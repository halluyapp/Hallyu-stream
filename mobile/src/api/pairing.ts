/**
 * Pairing client — talks to our own signalling service (backend/).
 *
 * The service never sees a media URL. It issues challenges, records approvals and
 * hands the TV a device credential exactly once.
 */

export const DEFAULT_PAIRING_BASE = 'http://10.0.2.2:8787';

export interface Challenge {
  challengeId: string;
  shortCode: string;
  expiresAt: string;
  qrPayload: string;
  pollToken: string;
  ttlSeconds: number;
}

export interface SessionStatus {
  challengeId: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  expiresAt: string;
  deviceName?: string;
  deviceToken?: string;
  deviceId?: string;
}

export interface PairedDevice {
  id: string;
  type: string;
  displayName: string;
  model?: string | null;
  createdAt: string;
  lastSeenAt?: string;
}

export class PairingError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'PairingError';
  }
}

function base(url?: string | null): string {
  return (url && url.trim()) || DEFAULT_PAIRING_BASE;
}

async function call<T>(
  url: string | null | undefined,
  path: string,
  init: RequestInit & {token?: string} = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    };
    if (init.token) {
      headers.Authorization = `Bearer ${init.token}`;
    }
    const res = await fetch(`${base(url)}${path}`, {...init, headers, signal: controller.signal});
    const text = await res.text();
    const body = text ? JSON.parse(text) : {};
    if (!res.ok) {
      throw new PairingError(body?.error ?? `http_${res.status}`, body?.message ?? 'Something went wrong.');
    }
    return body as T;
  } catch (e: any) {
    if (e instanceof PairingError) {
      throw e;
    }
    if (e?.name === 'AbortError') {
      throw new PairingError('timeout', 'The connection timed out.');
    }
    throw new PairingError('network', 'Could not reach the pairing service.');
  } finally {
    clearTimeout(timer);
  }
}

export const pairing = {
  /** TV side: open a challenge. */
  createSession: (url: string | null, deviceName: string, platform: 'tv' | 'phone') =>
    call<Challenge>(url, '/pairing/sessions', {
      method: 'POST',
      body: JSON.stringify({deviceName, platform}),
    }),

  /** TV side: poll. The poll token is a header, never a query string. */
  status: (url: string | null, challengeId: string, pollToken: string) =>
    call<SessionStatus>(url, `/pairing/sessions/${encodeURIComponent(challengeId)}/status`, {
      method: 'GET',
      headers: {'x-poll-token': pollToken},
    }),

  /** Phone side: resolve a 6-character code to the waiting television. */
  lookup: (url: string | null, shortCode: string) =>
    call<{challengeId: string; status: string; deviceName: string; platform: string; expiresAt: string}>(
      url,
      '/pairing/lookup',
      {method: 'POST', body: JSON.stringify({shortCode})},
    ),

  /** Phone side: create (or reuse) the account that owns the device list. */
  authDevice: (url: string | null, deviceName: string) =>
    call<{token: string; user?: {id: string; displayName: string}}>(url, '/auth/device', {
      method: 'POST',
      body: JSON.stringify({deviceName}),
    }),

  approve: (url: string | null, token: string, challengeId: string, deviceName: string, platform = 'tv') =>
    call<{status: string; device: PairedDevice; message: string}>(
      url,
      `/pairing/sessions/${encodeURIComponent(challengeId)}/approve`,
      {method: 'POST', token, body: JSON.stringify({deviceName, platform})},
    ),

  reject: (url: string | null, token: string, challengeId: string) =>
    call<{status: string; message: string}>(
      url,
      `/pairing/sessions/${encodeURIComponent(challengeId)}/reject`,
      {method: 'POST', token},
    ),

  devices: (url: string | null, token: string) =>
    call<{devices: PairedDevice[]}>(url, '/devices', {method: 'GET', token}),

  revoke: (url: string | null, token: string, deviceId: string) =>
    call<{status: string}>(url, `/devices/${encodeURIComponent(deviceId)}`, {method: 'DELETE', token}),

  heartbeat: (url: string | null, token: string) =>
    call<{status: string; lastSeenAt: string}>(url, '/devices/heartbeat', {method: 'POST', token}),
};

/** `hallyustream://pair?challenge=<id>` → challenge id, or null. */
export function parseQrPayload(raw: string): string | null {
  const m = /challenge=([A-Za-z0-9_-]{8,})/.exec(raw);
  return m ? m[1] : null;
}
