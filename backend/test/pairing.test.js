import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/db.js';
import { createApp } from '../src/app.js';

async function harness() {
  const db = openDatabase(':memory:');
  const { app, store } = createApp({ db });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  const call = async (method, path, { body, token, headers = {} } = {}) => {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await response.json().catch(() => null);
    return { status: response.status, json };
  };

  return {
    call,
    store,
    db,
    close: () =>
      new Promise((resolve) => {
        server.close(() => {
          db.close();
          resolve();
        });
      }),
  };
}

test('health reports signalling-only service', async () => {
  const h = await harness();
  try {
    const res = await h.call('GET', '/health');
    assert.equal(res.status, 200);
    assert.equal(res.json.status, 'ok');
    assert.equal(res.json.mediaProxy, false);
  } finally {
    await h.close();
  }
});

test('full pairing lifecycle: create, lookup, approve, credential delivery, revoke', async () => {
  const h = await harness();
  try {
    const user = await h.call('POST', '/auth/device', { body: { displayName: 'Pixel' } });
    assert.equal(user.status, 201);
    assert.ok(user.json.token);

    const created = await h.call('POST', '/pairing/sessions', {
      body: { deviceName: 'Living Room TV', deviceModel: 'Chromecast HD' },
    });
    assert.equal(created.status, 201);
    assert.match(created.json.shortCode, /^[A-Z0-9]{3}-[A-Z0-9]{3}$/);
    assert.ok(created.json.challengeId);
    assert.ok(created.json.pollToken);
    assert.ok(created.json.qrPayload.includes(created.json.challengeId));
    assert.ok(!created.json.qrPayload.includes('token'));

    const lookup = await h.call('POST', '/pairing/lookup', {
      body: { shortCode: created.json.shortCode.toLowerCase() },
    });
    assert.equal(lookup.status, 200);
    assert.equal(lookup.json.challengeId, created.json.challengeId);
    assert.equal(lookup.json.status, 'pending');
    assert.equal(lookup.json.deviceName, 'Living Room TV');

    const pending = await h.call('GET', `/pairing/sessions/${created.json.challengeId}/status`, {
      headers: { 'x-poll-token': created.json.pollToken },
    });
    assert.equal(pending.status, 200);
    assert.equal(pending.json.status, 'pending');

    const forbidden = await h.call('GET', `/pairing/sessions/${created.json.challengeId}/status`);
    assert.equal(forbidden.status, 403);

    const approve = await h.call(
      'POST',
      `/pairing/sessions/${created.json.challengeId}/approve`,
      { token: user.json.token },
    );
    assert.equal(approve.status, 200);
    assert.equal(approve.json.status, 'approved');
    assert.equal(approve.json.device.displayName, 'Living Room TV');

    const approved = await h.call('GET', `/pairing/sessions/${created.json.challengeId}/status`, {
      headers: { 'x-poll-token': created.json.pollToken },
    });
    assert.equal(approved.status, 200);
    assert.equal(approved.json.status, 'approved');
    assert.ok(approved.json.deviceToken);
    assert.ok(approved.json.deviceId);

    const secondPoll = await h.call('GET', `/pairing/sessions/${created.json.challengeId}/status`, {
      headers: { 'x-poll-token': created.json.pollToken },
    });
    assert.equal(secondPoll.status, 200);
    assert.equal(secondPoll.json.deviceToken, undefined, 'credential delivered exactly once');

    const devices = await h.call('GET', '/devices', { token: user.json.token });
    assert.equal(devices.status, 200);
    assert.equal(devices.json.devices.length, 1);

    const heartbeat = await h.call('POST', '/devices/heartbeat', {
      headers: { 'x-device-token': approved.json.deviceToken },
    });
    assert.equal(heartbeat.status, 200);
    assert.equal(heartbeat.json.device.displayName, 'Living Room TV');

    const revoke = await h.call('DELETE', `/devices/${approved.json.deviceId}`, {
      token: user.json.token,
    });
    assert.equal(revoke.status, 200);
    assert.equal(revoke.json.status, 'revoked');

    const afterRevoke = await h.call('POST', '/devices/heartbeat', {
      headers: { 'x-device-token': approved.json.deviceToken },
    });
    assert.equal(afterRevoke.status, 401);
  } finally {
    await h.close();
  }
});

test('approval requires authentication and a live session', async () => {
  const h = await harness();
  try {
    const created = await h.call('POST', '/pairing/sessions', { body: { deviceName: 'TV' } });
    const anonymous = await h.call(
      'POST',
      `/pairing/sessions/${created.json.challengeId}/approve`,
      { body: {} },
    );
    assert.equal(anonymous.status, 401);

    const user = await h.call('POST', '/auth/device', { body: { displayName: 'Phone' } });
    const missing = await h.call('POST', '/pairing/sessions/does-not-exist/approve', {
      token: user.json.token,
    });
    assert.equal(missing.status, 404);
  } finally {
    await h.close();
  }
});

test('rejection consumes the challenge', async () => {
  const h = await harness();
  try {
    const user = await h.call('POST', '/auth/device', { body: { displayName: 'Phone' } });
    const created = await h.call('POST', '/pairing/sessions', { body: { deviceName: 'TV' } });

    const reject = await h.call('POST', `/pairing/sessions/${created.json.challengeId}/reject`, {
      token: user.json.token,
    });
    assert.equal(reject.status, 200);
    assert.equal(reject.json.status, 'rejected');

    const lookup = await h.call('POST', '/pairing/lookup', {
      body: { shortCode: created.json.shortCode },
    });
    assert.equal(lookup.status, 404, 'rejected codes cannot be looked up');

    const approve = await h.call('POST', `/pairing/sessions/${created.json.challengeId}/approve`, {
      token: user.json.token,
    });
    assert.equal(approve.status, 409);
  } finally {
    await h.close();
  }
});

test('expired sessions cannot be approved and report expiry', async () => {
  const h = await harness();
  try {
    const user = await h.call('POST', '/auth/device', { body: { displayName: 'Phone' } });
    const created = await h.call('POST', '/pairing/sessions', { body: { deviceName: 'TV' } });

    h.db.prepare('UPDATE pairing_sessions SET expires_at = ? WHERE id = ?').run(
      new Date(Date.now() - 1000).toISOString(),
      created.json.challengeId,
    );

    const status = await h.call('GET', `/pairing/sessions/${created.json.challengeId}/status`, {
      headers: { 'x-poll-token': created.json.pollToken },
    });
    assert.equal(status.json.status, 'expired');

    const approve = await h.call('POST', `/pairing/sessions/${created.json.challengeId}/approve`, {
      token: user.json.token,
    });
    assert.equal(approve.status, 409);
    assert.equal(approve.json.error, 'expired');
  } finally {
    await h.close();
  }
});

test('one user cannot revoke another user\'s device', async () => {
  const h = await harness();
  try {
    const owner = await h.call('POST', '/auth/device', { body: { displayName: 'Owner' } });
    const other = await h.call('POST', '/auth/device', { body: { displayName: 'Other' } });
    const created = await h.call('POST', '/pairing/sessions', { body: { deviceName: 'TV' } });
    const approve = await h.call('POST', `/pairing/sessions/${created.json.challengeId}/approve`, {
      token: owner.json.token,
    });
    const deviceId = approve.json.device.id;

    const attempt = await h.call('DELETE', `/devices/${deviceId}`, { token: other.json.token });
    assert.equal(attempt.status, 404);

    const stillThere = await h.call('GET', '/devices', { token: owner.json.token });
    assert.equal(stillThere.json.devices.length, 1);
  } finally {
    await h.close();
  }
});
