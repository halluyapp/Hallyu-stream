import crypto from 'node:crypto';

function int(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : fallback;
}

export const config = {
  port: int('PORT', 8787),
  host: process.env.HOST || '0.0.0.0',
  databasePath: process.env.DATABASE_PATH || './data/pairing.db',
  // Pairing challenges are short-lived. 10 minutes by default (pack 07: 5-15 min).
  pairingTtlSeconds: int('PAIRING_TTL_SECONDS', 600),
  // Short codes are a human convenience only; they are rate limited and hashed.
  shortCodeLength: 6,
  // Token hashing pepper. MUST be set in production.
  tokenPepper: process.env.TOKEN_PEPPER || 'dev-only-pepper-change-me',
  // Comma separated allow-list. Empty means allow all (development convenience).
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean),
  trustProxy: process.env.TRUST_PROXY === '1',
  cleanupIntervalSeconds: int('CLEANUP_INTERVAL_SECONDS', 60),
  isProduction: process.env.NODE_ENV === 'production',
};

if (config.isProduction && config.tokenPepper === 'dev-only-pepper-change-me') {
  // Fail fast rather than run production with a known pepper.
  throw new Error('TOKEN_PEPPER must be set to a strong random value in production');
}
