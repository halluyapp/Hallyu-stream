import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { configureRuntime, setSecureStorageAdapter, setStorageAdapter } from '@hallyu/shared';
import { MobileApp, PlatformProvider, color } from '@hallyu/ui';
import { asyncStorageAdapter, nativeServices, secureStorageAdapter } from './platform';

setStorageAdapter(asyncStorageAdapter);
setSecureStorageAdapter(secureStorageAdapter);

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const clientKey = process.env.EXPO_PUBLIC_PAIRING_CLIENT_KEY || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const providerBase = process.env.EXPO_PUBLIC_ZAR_BASE_URL;
const movieSeason = Number(process.env.EXPO_PUBLIC_MOVIE_SEASON ?? 0);
const movieEpisode = Number(process.env.EXPO_PUBLIC_MOVIE_EPISODE ?? 0);

configureRuntime({
  ...(providerBase ? { providerBaseUrl: providerBase } : {}),
  ...(supabaseUrl ? { pairingBaseUrl: `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/pairing-api` } : {}),
  ...(clientKey ? { pairingClientKey: clientKey } : {}),
  movieSeason: Number.isFinite(movieSeason) ? movieSeason : 0,
  movieEpisode: Number.isFinite(movieEpisode) ? movieEpisode : 0,
});

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg.obsidian, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={color.accent.copper} />
      </View>
    );
  }

  return (
    <PlatformProvider services={nativeServices}>
      <StatusBar style="light" backgroundColor={color.bg.obsidian} />
      <MobileApp />
    </PlatformProvider>
  );
}
