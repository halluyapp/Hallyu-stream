import { config } from './config.js';
import {
  formatShortCode,
  generateShortCode,
  hashSecret,
  normaliseShortCode,
  randomId,
  randomToken,
  safeEqual,
} from './security.js';

const now = () => new Date().toISOString();
const isoIn = (seconds) => new Date(Date.now() + seconds * 1000).toISOString();

export class PairingStore {
  constructor(db) {
    this.db = db;
  }

  // ---------------------------------------------------------------- users

  createUser(displayName) {
    const id = randomId(16);
    const token = randomToken(32);
    const createdAt = now();
    this.db.prepare('INSERT INTO users (id, display_name, created_at) VALUES (?, ?, ?)')
      .run(id, displayName || 'Viewer', createdAt);
    this.db.prepare(
      'INSERT INTO user_tokens (id, user_id, token_hash, created_at) VALUES (?, ?, ?, ?)',
    ).run(randomId(12), id, hashSecret(token, config.tokenPepper), createdAt);
    return { userId: id, token, displayName: displayName || 'Viewer', createdAt };
  }

  userForToken(token) {
    if (!token) return null;
    const hash = hashSecret(token, config.tokenPepper);
    const row = this.db.prepare(
      `SELECT u.id, u.display_name FROM user_tokens t
       JOIN users u ON u.id = t.user_id
       WHERE t.token_hash = ? AND t.revoked_at IS NULL`,
    ).get(hash);
    if (!row) return null;
    this.db.prepare('UPDATE user_tokens SET last_used_at = ? WHERE token_hash = ?')
      .run(now(), hash);
    return { id: row.id, displayName: row.display_name };
  }

  // ------------------------------------------------------------- pairing

  createPairingSession({ deviceName, deviceModel, platform }) {
    const id = randomId(24);
    const shortCode = generateShortCode(config.shortCodeLength);
    const pollToken = randomToken(32);
    const createdAt = now();
    const expiresAt = isoIn(config.pairingTtlSeconds);

    this.db.prepare(
      `INSERT INTO pairing_sessions
        (id, short_code_hash, status, device_name, device_model, platform,
         created_at, expires_at, poll_token_hash)
       VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      hashSecret(normaliseShortCode(shortCode), config.tokenPepper),
      String(deviceName || 'Android TV').slice(0, 80),
      String(deviceModel || '').slice(0, 80) || null,
      platform === 'mobile' ? 'mobile' : 'tv',
      createdAt,
      expiresAt,
      hashSecret(pollToken, config.tokenPepper),
    );

    return {
      challengeId: id,
      shortCode: formatShortCode(shortCode),
      expiresAt,
      qrPayload: `hallyustream://pair?challenge=${encodeURIComponent(id)}`,
      pollToken,
    };
  }

  #session(id) {
    const row = this.db.prepare('SELECT * FROM pairing_sessions WHERE id = ?').get(id);
    if (!row) return null;
    if (row.status === 'pending' && new Date(row.expires_at).getTime() <= Date.now()) {
      this.db.prepare("UPDATE pairing_sessions SET status = 'expired' WHERE id = ?").run(id);
      row.status = 'expired';
    }
    return row;
  }

  /** Public view used by the phone before approval. Never includes secrets. */
  getSessionPublic(id) {
    const row = this.#session(id);
    if (!row) return null;
    return {
      challengeId: row.id,
      status: row.status,
      deviceName: row.device_name,
      deviceModel: row.device_model,
      platform: row.platform,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    };
  }

  lookupByShortCode(input) {
    const code = normaliseShortCode(input);
    if (code.length !== config.shortCodeLength) return null;
    const row = this.db.prepare(
      "SELECT * FROM pairing_sessions WHERE short_code_hash = ? AND status = 'pending'",
    ).get(hashSecret(code, config.tokenPepper));
    if (!row) return null;
    return this.getSessionPublic(row.id);
  }

  /** TV polling. Requires the poll token issued at creation. */
  getSessionStatus(id, pollToken) {
    const row = this.#session(id);
    if (!row) return { error: 'not_found' };
    if (!pollToken || !safeEqual(hashSecret(pollToken, config.tokenPepper), row.poll_token_hash)) {
      return { error: 'forbidden' };
    }

    const response = {
      challengeId: row.id,
      status: row.status,
      expiresAt: row.expires_at,
      deviceName: row.device_name,
    };

    if (row.status === 'approved' && row.delivery_token && !row.consumed_at) {
      // One-time delivery of the device credential, then it is wiped.
      response.deviceToken = row.delivery_token;
      response.deviceId = row.delivered_device_id;
      this.db.prepare(
        'UPDATE pairing_sessions SET consumed_at = ?, delivery_token = NULL WHERE id = ?',
      ).run(now(), row.id);
    }
    return { session: response };
  }

  approveSession(id, userId) {
    const row = this.#session(id);
    if (!row) return { error: 'not_found' };
    if (row.status === 'approved') return { error: 'already_approved' };
    if (row.status === 'rejected') return { error: 'rejected' };
    if (row.status === 'expired') return { error: 'expired' };

    const deviceId = randomId(16);
    const deviceToken = randomToken(32);
    const timestamp = now();

    this.db.exec('BEGIN');
    try {
      this.db.prepare(
        `UPDATE pairing_sessions
         SET status = 'approved', approved_by_user_id = ?, approved_at = ?,
             delivery_token = ?, delivered_device_id = ?
         WHERE id = ? AND status = 'pending'`,
      ).run(userId, timestamp, deviceToken, deviceId, id);

      this.db.prepare(
        `INSERT INTO devices
          (id, user_id, type, display_name, model, credential_hash,
           pairing_session_id, created_at, last_seen_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        deviceId,
        userId,
        row.platform === 'mobile' ? 'mobile' : 'tv',
        row.device_name,
        row.device_model,
        hashSecret(deviceToken, config.tokenPepper),
        id,
        timestamp,
        timestamp,
      );
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }

    return {
      device: {
        id: deviceId,
        type: row.platform === 'mobile' ? 'mobile' : 'tv',
        displayName: row.device_name,
        model: row.device_model,
        createdAt: timestamp,
      },
    };
  }

  rejectSession(id, userId) {
    const row = this.#session(id);
    if (!row) return { error: 'not_found' };
    if (row.status !== 'pending') return { error: row.status };
    this.db.prepare(
      "UPDATE pairing_sessions SET status = 'rejected', rejected_at = ?, approved_by_user_id = ? WHERE id = ?",
    ).run(now(), userId, id);
    return { status: 'rejected' };
  }

  // ------------------------------------------------------------- devices

  listDevices(userId) {
    return this.db.prepare(
      `SELECT id, type, display_name, model, created_at, last_seen_at
       FROM devices WHERE user_id = ? AND revoked_at IS NULL
       ORDER BY created_at DESC`,
    ).all(userId).map((row) => ({
      id: row.id,
      type: row.type,
      displayName: row.display_name,
      model: row.model,
      createdAt: row.created_at,
      lastSeenAt: row.last_seen_at,
    }));
  }

  revokeDevice(userId, deviceId) {
    const result = this.db.prepare(
      'UPDATE devices SET revoked_at = ? WHERE id = ? AND user_id = ? AND revoked_at IS NULL',
    ).run(now(), deviceId, userId);
    return result.changes > 0;
  }

  deviceForToken(token) {
    if (!token) return null;
    const row = this.db.prepare(
      `SELECT id, user_id, display_name, type FROM devices
       WHERE credential_hash = ? AND revoked_at IS NULL`,
    ).get(hashSecret(token, config.tokenPepper));
    if (!row) return null;
    this.db.prepare('UPDATE devices SET last_seen_at = ? WHERE id = ?').run(now(), row.id);
    return row;
  }

  cleanup() {
    const timestamp = now();
    this.db.prepare(
      "UPDATE pairing_sessions SET status = 'expired' WHERE status = 'pending' AND expires_at <= ?",
    ).run(timestamp);
    // Keep expired sessions for a day for observability, then drop them.
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    this.db.prepare(
      "DELETE FROM pairing_sessions WHERE status != 'pending' AND expires_at < ?",
    ).run(cutoff);
  }
}
