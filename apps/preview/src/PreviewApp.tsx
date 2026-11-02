import React, { useEffect, useState } from 'react';
import { MobileApp, PlatformProvider, TvApp, type PlatformServices } from '@hallyu/ui';
import { webServices } from './platform';

function queryValue(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name);
}

function HarnessBar({ path, navigate }: { path: string; navigate: (p: string) => void }) {
  return (
    <div className="harness-bar">
      <span>HALLYU-STREAM · React Native review harness · {path === '/' ? 'Overview' : path}</span>
      <span>
        <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Overview</a>
        <a href="/mobile" onClick={(e) => { e.preventDefault(); navigate('/mobile'); }}>Phone</a>
        <a href="/tv" onClick={(e) => { e.preventDefault(); navigate('/tv'); }}>TV</a>
      </span>
    </div>
  );
}

function Landing({ navigate }: { navigate: (p: string) => void }) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const clientKey = import.meta.env.VITE_PAIRING_CLIENT_KEY as string | undefined;
  const configured = Boolean(supabaseUrl && clientKey);
  return (
    <div className="landing">
      <div className="landing-inner">
        <div className="brand-line">
          <h1 className="wordmark">HALLYU-STREAM</h1>
          <div className="rule" />
          <span className="hangul">한류 스트림</span>
          <p className="tagline">A private screening room in your pocket and on your wall — the lights are down, the artwork is lit, and nothing stands between you and the film.</p>
        </div>

        <div className="banner">
          <strong>Review harness only.</strong> The shipping clients are React Native: <code>apps/mobile</code> (Expo / Android phone) and <code>apps/tv</code> (react-native-tvos / Android TV). This browser view renders the same RN component tree through <code>react-native-web</code> so the work is visible without an Android SDK.
        </div>

        <div className="btn-row">
          <a className="btn btn-primary" href="/mobile" onClick={(e) => { e.preventDefault(); navigate('/mobile'); }}>Open phone experience →</a>
          <a className="btn btn-secondary" href="/tv" onClick={(e) => { e.preventDefault(); navigate('/tv'); }}>Open TV experience →</a>
        </div>

        <div className="grid">
          <div className="card">
            <h2>What was built</h2>
            <ul>
              <li>Full design token layer from master plan §9–10</li>
              <li>Shared normalised models + defensive zarhosting client</li>
              <li>Local-first library: progress, watchlist, history, downloads registry, settings</li>
              <li>Mobile: 5 tabs, detail, player, library, settings, pairing, devices</li>
              <li>TV: left rail, D-pad focus manager, activation gate, on-screen keyboard, 10-foot player</li>
              <li>Signalling-only Supabase migration + Edge Function source</li>
            </ul>
          </div>
          <div className="card">
            <h2>Architecture rules kept</h2>
            <ul>
              <li>Client calls provider JSON; video bytes go CDN → device</li>
              <li>Signed URLs never stored; re-resolve after failure</li>
              <li>Media headers in one module; browsers state the limitation honestly</li>
              <li>QR carries challenge id only; approval is explicit and single-use</li>
              <li>No fake catalogue, playback, download, or pairing success</li>
              <li>TV is a separate composition, not a stretched phone layout</li>
            </ul>
          </div>
          <div className="card">
            <h2>Backend status</h2>
            <p><strong style={{ color: '#D9A441' }}>New Supabase project blocked:</strong> the Hallyu-grok organisation reached its free-project limit. No project was deleted, paused, upgraded, or created automatically.</p>
            <p>Pairing API URL: {configured ? <code>{supabaseUrl}/functions/v1/pairing-api</code> : 'not configured (.env)'}</p>
            <p>The SQL migration and Edge Function are ready in <code>supabase/</code> to deploy once a slot is available.</p>
          </div>
          <div className="card">
            <h2>Provider status</h2>
            <p>Outbound access from this sandbox is limited to package registries and GitHub, so the live <code>movieapi.zarhosting.dpdns.org</code> JSON cannot be smoke-tested here.</p>
            <p>Normalisers are defensive and the UI shows the designed error / empty / loading states with Retry when the provider is unreachable. Verified vs assumed is recorded in the root README.</p>
          </div>
        </div>

        <div className="card">
          <h2>NOCTURNE → “The Screening Room”</h2>
          <div className="swatches">
            <span className="swatch"><span style={{ background: '#0A0B0D' }} /> Obsidian</span>
            <span className="swatch"><span style={{ background: '#111318' }} /> Surface</span>
            <span className="swatch"><span style={{ background: '#171A21' }} /> Elevated</span>
            <span className="swatch"><span style={{ background: '#F4EFE7' }} /> Ivory</span>
            <span className="swatch"><span style={{ background: '#A8A199' }} /> Muted</span>
            <span className="swatch"><span style={{ background: '#C97B4A' }} /> Copper</span>
            <span className="swatch"><span style={{ background: '#E0A277' }} /> Copper light</span>
            <span className="swatch"><span style={{ background: '#D9584B' }} /> Error</span>
          </div>
        </div>

        <div className="footer">
          TV: use arrow keys · Enter = select · Escape = back · Space = play/pause · right-click/ContextMenu = quick settings.<br />
          Phone: click/tap; Escape acts as back. Pairing requires the deployed Supabase function — there is no simulated success.
        </div>
      </div>
    </div>
  );
}

export function PreviewApp({ services = webServices }: { services?: PlatformServices }) {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (next: string) => {
    window.history.pushState({}, '', next);
    setPath(next);
  };

  const isMobile = path.startsWith('/mobile');
  const isTv = path.startsWith('/tv');
  const initialTab = (queryValue('tab') || 'home') as 'home' | 'explore' | 'search' | 'library' | 'settings';
  const initialPane = (queryValue('pane') || 'home') as 'home' | 'explore' | 'search' | 'library' | 'settings' | 'devices';

  return (
    <>
      <HarnessBar path={path} navigate={navigate} />
      <div className="harness-body">
        <PlatformProvider services={services}>
          {isMobile ? (
            <MobileApp key={`mobile-${path}`} initialTab={initialTab} />
          ) : isTv ? (
            <TvApp key={`tv-${path}`} initialPane={initialPane} />
          ) : (
            <Landing navigate={navigate} />
          )}
        </PlatformProvider>
      </div>
    </>
  );
}
