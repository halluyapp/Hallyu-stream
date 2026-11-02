import {
  PAIRING_TTL_SECONDS,
  QR_DEEP_LINK_SCHEME,
  getPairingBaseUrl,
  getPairingClientKey,
} from './config';
import { groupShortCode } from './playback';
import { KEYS, secureStorage } from './storage';
import type { PairedDevice, PairingApiError, PairingSession, PairingStatus } from './types';

export class PairingApiErrorImpl extends Error implements PairingApiError {
  status?: number;
  code?: string;
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'PairingApiError';
    this.status = status;
    this.code = code;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function randomHex(bytes: number): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    const arr = new Uint8Array(bytes);
    cryptoObj.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  let out = '';
  for (let i = 0; i < bytes * 2; i += 1) out += Math.floor(Math.random() * 16).toString(16);
  return out;
}

export function cleanShortCode(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
}

export function formatShortCode(value: string): string {
  return groupShortCode(cleanShortCode(value));
}

/** QR payload carries the challenge id / deep link only — never a token or media URL (`07` §3). */
export function buildQrPayload(challengeId: string): string {
  return `${QR_DEEP_LINK_SCHEME}?c=${encodeURIComponent(challengeId)}`;
}

export function parseQrPayload(payload: string): string | null {
  const trimmed = payload.trim();
  if (UUID_RE.test(trimmed)) return trimmed.toLowerCase();
  try {
    const url = new URL(trimmed);
    const challenge = url.searchParams.get('c') || url.searchParams.get('challenge') || url.searchParams.get('challengeId');
    return challenge && UUID_RE.test(challenge) ? challenge.toLowerCase() : null;
  } catch {
    return null;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  installationId?: string;
  deviceToken?: string;
  timeoutMs?: number;
}

interface ApiSession {
  challengeId: string;
  shortCode?: string;
  expiresAt: string;
  qrPayload?: string;
  tvName?: string;
  tvModel?: string;
  status: PairingStatus;
  deviceToken?: string;
  deviceId?: string;
  ttlSeconds?: number;
}

export class PairingClient {
  private readonly fetchImpl: typeof fetch;

  constructor(fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis)) {
    this.fetchImpl = fetchImpl;
  }

  /** Anonymous, local-first owner id. Stored in secure storage, sent on phone actions only. */
  async getInstallationId(): Promise<string> {
    const existing = await secureStorage.getItem(KEYS.installationId);
    if (existing && /^[A-Za-z0-9_-]{16,128}$/.test(existing)) return existing;
    const id = `hs_${randomHex(24)}`;
    await secureStorage.setItem(KEYS.installationId, id);
    return id;
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 12_000);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      apikey: getPairingClientKey(),
      'x-client-key': getPairingClientKey(),
    };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.installationId) headers['X-Installation-Id'] = options.installationId;
    if (options.deviceToken) headers['X-Device-Token'] = options.deviceToken;

    try {
      const response = await this.fetchImpl(`${getPairingBaseUrl()}${path}`, {
        method: options.method ?? 'GET',
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });
      const text = await response.text();
      let data: unknown = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }
      }
      if (!response.ok) {
        const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
        const message =
          (typeof record.error === 'string' && record.error) ||
          (typeof record.message === 'string' && record.message) ||
          `Pairing service returned HTTP ${response.status}`;
        const code = typeof record.code === 'string' ? record.code : undefined;
        throw new PairingApiErrorImpl(message, response.status, code);
      }
      return data as T;
    } catch (error) {
      if (error instanceof PairingApiErrorImpl) throw error;
      const aborted = error instanceof Error && error.name === 'AbortError';
      throw new PairingApiErrorImpl(
        aborted ? 'Pairing service timed out' : "Can't reach the pairing service",
        undefined,
        aborted ? 'timeout' : 'network',
      );
    } finally {
      clearTimeout(timer);
    }
  }

  // ── TV side ─────────────────────────────────────────────────────────────
  async createSession(info: { tvName?: string; tvModel?: string } = {}): Promise<PairingSession> {
    const session = await this.request<ApiSession>('/sessions', {
      method: 'POST',
      body: { tvName: info.tvName, tvModel: info.tvModel },
    });
    return { ...session, ttlSeconds: session.ttlSeconds ?? PAIRING_TTL_SECONDS };
  }

  /** TV polls. `deviceToken` appears exactly once after approval. */
  async getSession(challengeId: string): Promise<PairingSession> {
    if (!UUID_RE.test(challengeId)) throw new PairingApiErrorImpl('Invalid pairing challenge', 400, 'invalid_challenge');
    return this.request<ApiSession>(`/sessions/${encodeURIComponent(challengeId)}`);
  }

  async heartbeat(deviceToken: string): Promise<{ deviceId: string; revoked: boolean }> {
    return this.request<{ deviceId: string; revoked: boolean }>('/devices/heartbeat', {
      method: 'POST',
      deviceToken,
    });
  }

  async saveTvCredential(deviceId: string, deviceToken: string): Promise<void> {
    await secureStorage.setItem(KEYS.tvDeviceId, deviceId);
    await secureStorage.setItem(KEYS.tvDeviceToken, deviceToken);
  }

  async getTvCredential(): Promise<{ deviceId: string; deviceToken: string } | null> {
    const deviceId = await secureStorage.getItem(KEYS.tvDeviceId);
    const deviceToken = await secureStorage.getItem(KEYS.tvDeviceToken);
    return deviceId && deviceToken ? { deviceId, deviceToken } : null;
  }

  async clearTvCredential(): Promise<void> {
    await secureStorage.removeItem(KEYS.tvDeviceId);
    await secureStorage.removeItem(KEYS.tvDeviceToken);
  }

  // ── Phone side ──────────────────────────────────────────────────────────
  async lookupByCode(shortCode: string): Promise<PairingSession> {
    const installationId = await this.getInstallationId();
    return this.request<ApiSession>('/sessions/lookup', {
      method: 'POST',
      body: { shortCode: cleanShortCode(shortCode) },
      installationId,
    });
  }

  async approve(challengeId: string, displayName?: string): Promise<{ device: PairedDevice; status: PairingStatus }> {
    const installationId = await this.getInstallationId();
    return this.request<{ device: PairedDevice; status: PairingStatus }>(
      `/sessions/${encodeURIComponent(challengeId)}/approve`,
      { method: 'POST', body: { displayName }, installationId },
    );
  }

  async reject(challengeId: string): Promise<{ status: PairingStatus }> {
    const installationId = await this.getInstallationId();
    return this.request<{ status: PairingStatus }>(
      `/sessions/${encodeURIComponent(challengeId)}/reject`,
      { method: 'POST', body: {}, installationId },
    );
  }

  async listDevices(): Promise<PairedDevice[]> {
    const installationId = await this.getInstallationId();
    const result = await this.request<{ devices: PairedDevice[] }>('/devices', { installationId });
    return result.devices ?? [];
  }

  async revokeDevice(deviceId: string): Promise<boolean> {
    const installationId = await this.getInstallationId();
    const result = await this.request<{ revoked: boolean }>(
      `/devices/${encodeURIComponent(deviceId)}`,
      { method: 'DELETE', installationId },
    );
    return Boolean(result.revoked);
  }
}

export const pairing = new PairingClient();
