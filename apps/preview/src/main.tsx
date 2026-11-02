import React from 'react';
import { createRoot } from 'react-dom/client';
import { configureRuntime, setSecureStorageAdapter, setStorageAdapter } from '@hallyu/shared';
import { PreviewApp } from './PreviewApp';
import { webServices, webStorage } from './platform';
import './styles.css';

setStorageAdapter(webStorage);
setSecureStorageAdapter(webStorage);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const clientKey = (import.meta.env.VITE_PAIRING_CLIENT_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string | undefined;
const providerBase = import.meta.env.VITE_ZAR_BASE_URL as string | undefined;
const movieSeason = Number(import.meta.env.VITE_MOVIE_SEASON ?? 0);
const movieEpisode = Number(import.meta.env.VITE_MOVIE_EPISODE ?? 0);

configureRuntime({
  ...(providerBase ? { providerBaseUrl: providerBase } : {}),
  ...(supabaseUrl ? { pairingBaseUrl: `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/pairing-api` } : {}),
  ...(clientKey ? { pairingClientKey: clientKey } : {}),
  movieSeason: Number.isFinite(movieSeason) ? movieSeason : 0,
  movieEpisode: Number.isFinite(movieEpisode) ? movieEpisode : 0,
});

const root = document.getElementById('root');
if (!root) throw new Error('Root element is missing');
createRoot(root).render(<PreviewApp services={webServices} />);
