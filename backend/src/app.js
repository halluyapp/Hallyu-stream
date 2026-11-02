import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { PairingStore } from './store.js';

const json = (res, status, body) => res.status(status).json(body);

function bearer(req) {
  const header = req.get('authorization') || '';
  if (!header.toLowerCase().startsWith('bearer ')) return null;
  return header.slice(7).trim() || null;
}

export function createApp({ db }) {
  const store = new PairingStore(db);
  const app = express();

  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', 1);

  app.use(express.json({ limit: '16kb' }));
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.allowedOrigins.length === 0) return callback(null, true);
        return callback(null, config.allowedOrigins.includes(origin));
      },
      methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Poll-Token', 'X-Device-Token'],
      maxAge: 600,
    }),
  );

  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  const globalLimiter = rateLimit({
    windowMs: 60_000,
    limit: 240,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });
  app.use(globalLimiter);

  const createLimiter = rateLimit({
    windowMs: 60_000,
    limit: 12,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'rate_limited', message: 'Too many pairing codes requested. Try again shortly.' },
  });
  const lookupLimiter = rateLimit({
    windowMs: 60_000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'rate_limited', message: 'Too many code attempts. Try again shortly.' },
  });
  const approveLimiter = rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'rate_limited', message: 'Too many approval attempts. Try again shortly.' },
  });
  const authLimiter = rateLimit({
    windowMs: 60_000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'rate_limited', message: 'Too many sign-in attempts. Try again shortly.' },
  });

  const requireUser = (req, res, next) => {
    const user = store.userForToken(bearer(req));
    if (!user) {
      return json(res, 401, { error: 'unauthorized', message: 'A valid phone session is required.' });
    }
    req.user = user;
    return next();
  };

  // ---------------------------------------------------------------- health

  app.get('/health', (req, res) => {
    json(res, 200, {
      status: 'ok',
      service: 'hallyu-stream-pairing',
      version: '1.0.0',
      time: new Date().toISOString(),
      mediaProxy: false,
    });
  });

  // ------------------------------------------------------------------ auth

  app.post('/auth/device', authLimiter, (req, res) => {
    const displayName = String(req.body?.displayName || 'Viewer').slice(0, 60);
    const created = store.createUser(displayName);
    json(res, 201, {
      userId: created.userId,
      token: created.token,
      displayName: created.displayName,
      note: 'Store this token in platform secure storage. It is shown once.',
    });
  });

  // --------------------------------------------------------------- pairing

  app.post('/pairing/sessions', createLimiter, (req, res) => {
    const deviceName = String(req.body?.deviceName || 'Android TV').slice(0, 80);
    const deviceModel = String(req.body?.deviceModel || '').slice(0, 80);
    const platform = req.body?.platform === 'mobile' ? 'mobile' : 'tv';
    const session = store.createPairingSession({ deviceName, deviceModel, platform });
    json(res, 201, {
      ...session,
      ttlSeconds: config.pairingTtlSeconds,
      note: 'QR payload contains a challenge id only. Never media or account secrets.',
    });
  });

  app.get('/pairing/sessions/:id', (req, res) => {
    const session = store.getSessionPublic(req.params.id);
    if (!session) return json(res, 404, { error: 'not_found', message: 'Pairing session not found.' });
    return json(res, 200, session);
  });

  app.get('/pairing/sessions/:id/status', (req, res) => {
    const result = store.getSessionStatus(req.params.id, req.get('x-poll-token'));
    if (result.error === 'not_found') {
      return json(res, 404, { error: 'not_found', message: 'Pairing session not found.' });
    }
    if (result.error === 'forbidden') {
      return json(res, 403, { error: 'forbidden', message: 'A valid poll token is required.' });
    }
    return json(res, 200, result.session);
  });

  app.post('/pairing/lookup', lookupLimiter, (req, res) => {
    const session = store.lookupByShortCode(req.body?.shortCode);
    if (!session) {
      return json(res, 404, {
        error: 'invalid_code',
        message: 'That code is not valid or has expired.',
      });
    }
    return json(res, 200, session);
  });

  app.post('/pairing/sessions/:id/approve', approveLimiter, requireUser, (req, res) => {
    const result = store.approveSession(req.params.id, req.user.id);
    if (result.error) {
      const status = result.error === 'not_found' ? 404 : 409;
      return json(res, status, { error: result.error, message: approvalMessage(result.error) });
    }
    return json(res, 200, {
      status: 'approved',
      device: result.device,
      message: `${result.device.displayName} connected.`,
    });
  });

  app.post('/pairing/sessions/:id/reject', approveLimiter, requireUser, (req, res) => {
    const result = store.rejectSession(req.params.id, req.user.id);
    if (result.error) {
      const status = result.error === 'not_found' ? 404 : 409;
      return json(res, status, { error: result.error, message: approvalMessage(result.error) });
    }
    return json(res, 200, { status: 'rejected', message: 'Connection declined.' });
  });

  // --------------------------------------------------------------- devices

  app.get('/devices', requireUser, (req, res) => {
    json(res, 200, { devices: store.listDevices(req.user.id) });
  });

  app.delete('/devices/:id', requireUser, (req, res) => {
    const removed = store.revokeDevice(req.user.id, req.params.id);
    if (!removed) {
      return json(res, 404, { error: 'not_found', message: 'Device not found or already unpaired.' });
    }
    return json(res, 200, {
      status: 'revoked',
      message: 'This TV will need a new code to connect again.',
    });
  });

  app.post('/devices/heartbeat', (req, res) => {
    const device = store.deviceForToken(req.get('x-device-token'));
    if (!device) {
      return json(res, 401, { error: 'unauthorized', message: 'A valid device credential is required.' });
    }
    return json(res, 200, {
      status: 'ok',
      device: { id: device.id, displayName: device.display_name, type: device.type },
      time: new Date().toISOString(),
    });
  });

  // ----------------------------------------------------------- error paths

  app.use((req, res) => {
    json(res, 404, { error: 'not_found', message: 'No such endpoint.' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    if (error?.type === 'entity.parse.failed') {
      return json(res, 400, { error: 'bad_json', message: 'Request body must be valid JSON.' });
    }
    console.error('[pairing] unhandled error:', error?.message);
    return json(res, 500, { error: 'internal_error', message: 'Something went wrong on our side.' });
  });

  return { app, store };
}

function approvalMessage(code) {
  switch (code) {
    case 'expired':
      return 'This code expired. Request a new one on the TV.';
    case 'rejected':
      return 'This connection was already declined.';
    case 'already_approved':
      return 'This TV is already connected.';
    case 'not_found':
      return 'Pairing session not found.';
    default:
      return 'This pairing session can no longer be approved.';
  }
}
