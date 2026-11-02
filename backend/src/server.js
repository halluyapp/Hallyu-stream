import { config } from './config.js';
import { openDatabase } from './db.js';
import { createApp } from './app.js';

const db = openDatabase(config.databasePath);
const { app, store } = createApp({ db });

const cleanup = setInterval(() => {
  try {
    store.cleanup();
  } catch (error) {
    console.error('[pairing] cleanup failed:', error?.message);
  }
}, config.cleanupIntervalSeconds * 1000);
cleanup.unref();

const server = app.listen(config.port, config.host, () => {
  console.log(
    `[pairing] listening on http://${config.host}:${config.port} ` +
      `(ttl=${config.pairingTtlSeconds}s, mediaProxy=disabled)`,
  );
});

function shutdown(signal) {
  console.log(`[pairing] ${signal} received, shutting down`);
  server.close(() => {
    try {
      db.close();
    } catch {
      /* already closed */
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
