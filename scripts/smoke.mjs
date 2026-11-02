import { build } from 'esbuild';
import { rm, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const outfile = path.resolve('.cache/hallyu-smoke.mjs');
await mkdir(path.dirname(outfile), { recursive: true });
await build({
  entryPoints: [path.resolve('scripts/smoke-entry.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  outfile,
  logLevel: 'silent',
});
try {
  await import(pathToFileURL(outfile).href);
} finally {
  await rm(outfile, { force: true });
}
