/** Small formatting helpers. Real values from data; unknown → '—' (plan §18.4). */

export function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
}

export function formatSize(bytes: number | null): string {
  if (bytes === null || !Number.isFinite(bytes) || bytes <= 0) return '—';
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / 1024 ** 2;
  if (mb >= 1) return `${Math.round(mb)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Credits line: `2008 · TV-MA · ★8.6 · 1h48` — gaps become '—', never invented. */
export function creditsLine(parts: Array<string | null | undefined>): string {
  return parts.map((p) => (p && p.trim() ? p.trim() : '—')).join(' · ');
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function minLeft(positionMs: number, durationMs: number | null): string | null {
  if (!durationMs || durationMs <= positionMs) return null;
  return `${Math.max(1, Math.round((durationMs - positionMs) / 60000))} min left`;
}
