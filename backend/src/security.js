import crypto from 'node:crypto';

/** Cryptographically random, URL-safe identifier. */
export function randomId(bytes = 24) {
  return crypto.randomBytes(bytes).toString('base64url');
}

/** Opaque bearer token. Returned to a client exactly once. */
export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

/** Hash a secret before persistence. Secrets are never stored in plaintext. */
export function hashSecret(secret, pepper) {
  return crypto.createHmac('sha256', pepper).update(secret).digest('hex');
}

/** Constant-time comparison of two hex digests. */
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Short codes avoid ambiguous characters (0/O, 1/I/L) for reading across a room.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateShortCode(length = 6) {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

export function formatShortCode(code) {
  const half = Math.ceil(code.length / 2);
  return `${code.slice(0, half)}-${code.slice(half)}`;
}

export function normaliseShortCode(input) {
  return String(input || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}
