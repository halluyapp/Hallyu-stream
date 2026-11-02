import React from 'react';
import { StatusBar, View } from 'react-native';
import Config from 'react-native-config';
import { configureRuntime, setSecureStorageAdapter, setStorageAdapter } from '@hallyu/shared';
import { PlatformProvider, TvApp, color } from '@hallyu/ui';
import { asyncStorageAdapter, keychainAdapter, tvServices } from './platform';

setStorageAdapter(asyncStorageAdapter);
setSecureStorageAdapter(keychainAdapter);

const supabaseUrl = Config.SUPABASE_URL;
const clientKey = Config.PAIRING_CLIENT_KEY || Config.SUPABASE_PUBLISHABLE_KEY;
const providerBase = Config.ZAR_BASE_URL;
const movieSeason = Number(Config.MOVIE_SEASON ?? 0);
const movieEpisode = Number(Config.MOVIE_EPISODE ?? 0);

configureRuntime({
  ...(providerBase ? { providerBaseUrl: providerBase } : {}),
  ...(supabaseUrl ? { pairingBaseUrl: `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/pairing-api` } : {}),
  ...(clientKey ? { pairingClientKey: clientKey } : {}),
  movieSeason: Number.isFinite(movieSeason) ? movieSeason : 0,
  movieEpisode: Number.isFinite(movieEpisode) ? movieEpisode : 0,
});

export default function App() {
  return (
    <PlatformProvider services={tvServices}>
      <StatusBar barStyle="light-content" backgroundColor={color.bg.obsidian} />
      <View style={{ flex: 1, backgroundColor: color.bg.obsidian }}>
        <TvApp />
      </View>
    </PlatformProvider>
  );
}
