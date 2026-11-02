// HALLYU-STREAM pairing API — Supabase Edge Function (Deno).
// Signalling ONLY. No endpoint here fetches, relays, caches, or returns video bytes (ADR 001/002).
// Deploy with verify_jwt = false; this function performs its own client-key and rate-limit checks.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, apikey, x-client-info, content-type, x-client-key, x-installation-id, x-device-token',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const enc = new TextEncoder();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TTL_SECONDS = 600;
const QR_SCHEME = 'hallyu-stream://pair';

interface SessionRow {
  id: string;
  short_code_hash: string;
  status: 'pending' | 'approved' | 'expired' | 'rejected' | 'revoked';
  expires_at: string;
  created_at: string;
  tv_name: string | null;
  tv_model: string | null;
  approved_by: string | null;
  approved_at: string | null;
  consumed_at: string | null;
  rejected_at: string | null;
  device_id: string | null;
  token_delivered_at: string | null;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function fail(message: string, status = 400, code?: string): Response {
  return json({ error: message, code }, status);
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmacBytes(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

async function hmacHex(secret: string, data: string): Promise<string> {
  return hex(await hmacBytes(secret, data));
}

async function sha256Hex(value: string): Promise<string> {
  return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(value))));
}

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function deriveDeviceToken(secret: string, challengeId: string, installationId: string): Promise<string> {
  return base64Url(await hmacBytes(secret, `device:${challengeId}:${installationId}`));
}

function generateShortCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

function formatShortCode(code: string): string {
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

function sanitizeText(value: unknown, max = 80): string | undefined {
  if (typeof value !== 'string') return undefined;
  const clean = value.trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max);
  return clean || undefined;
}

async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const parsed = await req.json();
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function getIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim().slice(0, 64);
  return req.headers.get('cf-connecting-ip')?.slice(0, 64) || 'unknown';
}

function getInstallationId(req: Request): string | null {
  const value = req.headers.get('x-installation-id');
  return value && /^[A-Za-z0-9_-]{16,128}$/.test(value) ? value : null;
}

function clientKeyOk(req: Request, expected: string): boolean {
  const provided = req.headers.get('x-client-key') || req.headers.get('apikey') || '';
  return provided.length > 0 && provided === expected;
}

type Guard =
  | { ok: true; installationId: string | null }
  | { ok: false; response: Response };

function guard(req: Request, clientKey: string, needInstallation: boolean): Guard {
  if (!clientKeyOk(req, clientKey)) {
    return { ok: false, response: fail('Pairing client key is missing or invalid', 401, 'unauthorized') };
  }
  if (needInstallation) {
    const installationId = getInstallationId(req);
    if (!installationId) {
      return { ok: false, response: fail('Missing installation identity', 401, 'no_installation') };
    }
    return { ok: true, installationId };
  }
  return { ok: true, installationId: null };
}

// deno-lint-ignore no-explicit-any
async function rateLimit(supabase: any, subject: string, action: string, max: number, windowSeconds: number): Promise<boolean> {
  const { data, error } = await supabase.rpc('pairing_rate_limit', {
    p_subject: subject,
    p_action: action,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) return false; // fail closed
  return data === true;
}

// deno-lint-ignore no-explicit-any
async function getSessionRow(supabase: any, id: string): Promise<SessionRow | null> {
  const { data, error } = await supabase
    .from('pairing_sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return data as SessionRow;
}

// deno-lint-ignore no-explicit-any
async function expireIfNeeded(supabase: any, row: SessionRow): Promise<SessionRow> {
  if (row.status === 'pending' && new Date(row.expires_at).getTime() <= Date.now()) {
    await supabase
      .from('pairing_sessions')
      .update({ status: 'expired' })
      .eq('id', row.id)
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString());
    return { ...row, status: 'expired' };
  }
  return row;
}

function sessionResponse(row: SessionRow, extra: Record<string, unknown> = {}) {
  return {
    challengeId: row.id,
    status: row.status,
    expiresAt: row.expires_at,
    qrPayload: `${QR_SCHEME}?c=${encodeURIComponent(row.id)}`,
    tvName: row.tv_name ?? undefined,
    tvModel: row.tv_model ?? undefined,
    ttlSeconds: TTL_SECONDS,
    ...extra,
  };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const url = new URL(req.url);
  let path = url.pathname
    .replace(/^\/functions\/v1\/pairing-api/, '')
    .replace(/^\/pairing-api/, '');
  if (!path.startsWith('/')) path = `/${path}`;
  const method = req.method;

  if (path === '/health' && method === 'GET') {
    return json({ ok: true, service: 'hallyu-stream-pairing', mediaProxy: false });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const codeSecret = Deno.env.get('PAIRING_CODE_SECRET');
  const clientKey = Deno.env.get('PAIRING_CLIENT_KEY');
  if (!supabaseUrl || !serviceKey || !codeSecret || !clientKey) {
    return fail('Pairing service is not configured', 500, 'server_misconfigured');
  }
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ── TV: create a short-lived challenge ──────────────────────────────────
  if (path === '/sessions' && method === 'POST') {
    const g = guard(req, clientKey, false);
    if (!g.ok) return g.response;
    if (!(await rateLimit(supabase, `ip:${getIp(req)}`, 'create', 5, 600))) {
      return fail('Too many pairing codes requested', 429, 'rate_limited');
    }
    const body = await readBody(req);
    const shortCode = generateShortCode();
    const codeHash = await hmacHex(codeSecret, `code:${shortCode}`);
    const { data, error } = await supabase.rpc('create_pairing_session', {
      p_short_code_hash: codeHash,
      p_ttl_seconds: TTL_SECONDS,
      p_tv_name: sanitizeText(body.tvName) ?? null,
      p_tv_model: sanitizeText(body.tvModel) ?? null,
    });
    if (error) return fail('Could not create a pairing code', 500, 'create_failed');
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.id) return fail('Could not create a pairing code', 500, 'create_failed');
    return json({
      challengeId: row.id,
      shortCode: formatShortCode(shortCode),
      expiresAt: row.expires_at,
      qrPayload: `${QR_SCHEME}?c=${encodeURIComponent(row.id)}`,
      tvName: sanitizeText(body.tvName),
      tvModel: sanitizeText(body.tvModel),
      status: 'pending',
      ttlSeconds: TTL_SECONDS,
    });
  }

  // ── Phone: resolve a manually entered short code ────────────────────────
  if (path === '/sessions/lookup' && method === 'POST') {
    const g = guard(req, clientKey, true);
    if (!g.ok) return g.response;
    if (!(await rateLimit(supabase, `install:${g.installationId}`, 'lookup', 10, 600))) {
      return fail('Too many code attempts', 429, 'rate_limited');
    }
    const body = await readBody(req);
    const raw = typeof body.shortCode === 'string' ? body.shortCode : '';
    const code = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
    if (code.length !== 6) return fail('Enter the six-character code from your TV', 400, 'invalid_code');
    const codeHash = await hmacHex(codeSecret, `code:${code}`);
    const { data, error } = await supabase
      .from('pairing_sessions')
      .select('*')
      .eq('short_code_hash', codeHash)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return fail('This code expired or is not valid', 404, 'code_not_found');
    return json(sessionResponse(await expireIfNeeded(supabase, data as SessionRow)));
  }

  // ── Phone: approve / reject ─────────────────────────────────────────────
  const actionMatch = /^\/sessions\/([0-9a-f-]{36})\/(approve|reject)$/i.exec(path);
  if (actionMatch && method === 'POST') {
    const challengeId = actionMatch[1].toLowerCase();
    const action = actionMatch[2].toLowerCase();
    const g = guard(req, clientKey, true);
    if (!g.ok) return g.response;
    if (!(await rateLimit(supabase, `install:${g.installationId}`, action, 10, 600))) {
      return fail('Too many pairing attempts', 429, 'rate_limited');
    }

    if (action === 'reject') {
      const { data, error } = await supabase.rpc('reject_pairing_session', { p_challenge_id: challengeId });
      if (error) return fail('Could not decline this session', 500, 'reject_failed');
      const row = Array.isArray(data) ? data[0] : data;
      return json({ status: row?.status ?? 'not_found' });
    }

    const body = await readBody(req);
    const displayName = sanitizeText(body.displayName) ?? 'Android TV';
    const deviceToken = await deriveDeviceToken(codeSecret, challengeId, g.installationId as string);
    const credentialHash = await sha256Hex(deviceToken);
    const { data, error } = await supabase.rpc('approve_pairing_session', {
      p_challenge_id: challengeId,
      p_installation_id: g.installationId,
      p_credential_hash: credentialHash,
      p_display_name: displayName,
      p_model: null,
    });
    if (error) return fail('Could not approve this session', 500, 'approve_failed');
    const row = Array.isArray(data) ? data[0] : data;
    const status = row?.status ?? 'not_found';
    if (status !== 'approved') {
      const httpStatus = status === 'expired' ? 410 : status === 'not_found' ? 404 : 409;
      return fail(`Pairing session is ${status}`, httpStatus, status);
    }
    const { data: device } = await supabase
      .from('devices')
      .select('id, display_name, model, last_seen_at, created_at, revoked_at')
      .eq('id', row.device_id)
      .maybeSingle();
    return json({
      status: 'approved',
      device: device
        ? {
            id: device.id,
            displayName: device.display_name,
            model: device.model ?? undefined,
            lastSeenAt: device.last_seen_at ?? undefined,
            createdAt: device.created_at,
            revokedAt: device.revoked_at ?? undefined,
          }
        : { id: row.device_id, displayName, createdAt: new Date().toISOString() },
    });
  }

  // ── TV: poll session status; receive device token exactly once ───────────
  const sessionMatch = /^\/sessions\/([0-9a-f-]{36})$/i.exec(path);
  if (sessionMatch && method === 'GET') {
    const g = guard(req, clientKey, false);
    if (!g.ok) return g.response;
    const challengeId = sessionMatch[1].toLowerCase();
    if (!UUID_RE.test(challengeId)) return fail('Invalid challenge id', 400, 'invalid_challenge');
    const row = await getSessionRow(supabase, challengeId);
    if (!row) return fail('Pairing code not found', 404, 'not_found');
    const current = await expireIfNeeded(supabase, row);
    const extra: Record<string, unknown> = {};
    if (current.status === 'approved' && current.approved_by && current.device_id) {
      const claimed = await supabase.rpc('claim_device_token', { p_challenge_id: challengeId });
      if (!claimed.error && claimed.data === true) {
        extra.deviceToken = await deriveDeviceToken(codeSecret, challengeId, current.approved_by);
        extra.deviceId = current.device_id;
      }
    }
    return json(sessionResponse(current, extra));
  }

  // ── TV: heartbeat / revocation detection ────────────────────────────────
  if (path === '/devices/heartbeat' && method === 'POST') {
    const g = guard(req, clientKey, false);
    if (!g.ok) return g.response;
    const token = req.headers.get('x-device-token');
    if (!token) return fail('Missing device credential', 401, 'no_device_token');
    const hash = await sha256Hex(token);
    const { data, error } = await supabase.rpc('heartbeat_device', { p_credential_hash: hash });
    if (error) return fail('Could not verify this TV', 500, 'heartbeat_failed');
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.device_id || row.revoked) {
      return fail('This TV is no longer paired', 401, 'revoked');
    }
    return json({ deviceId: row.device_id, revoked: false });
  }

  // ── Phone: list / revoke devices ────────────────────────────────────────
  if (path === '/devices' && method === 'GET') {
    const g = guard(req, clientKey, true);
    if (!g.ok) return g.response;
    const { data, error } = await supabase.rpc('list_devices', { p_installation_id: g.installationId });
    if (error) return fail('Could not load paired TVs', 500, 'list_failed');
    const devices = (Array.isArray(data) ? data : []).map((d: Record<string, unknown>) => ({
      id: d.id,
      displayName: d.display_name,
      model: d.model ?? undefined,
      lastSeenAt: d.last_seen_at ?? undefined,
      createdAt: d.created_at,
      revokedAt: d.revoked_at ?? undefined,
    }));
    return json({ devices });
  }

  const deviceMatch = /^\/devices\/([0-9a-f-]{36})$/i.exec(path);
  if (deviceMatch && method === 'DELETE') {
    const g = guard(req, clientKey, true);
    if (!g.ok) return g.response;
    const { data, error } = await supabase.rpc('revoke_device', {
      p_device_id: deviceMatch[1].toLowerCase(),
      p_installation_id: g.installationId,
    });
    if (error) return fail('Could not unpair this TV', 500, 'revoke_failed');
    if (data !== true) return fail('This TV is not paired to this phone', 404, 'device_not_found');
    return json({ revoked: true });
  }

  return fail('Pairing endpoint not found', 404, 'not_found');
});
