/** Root layout — NOCTURNE ground, fonts, providers, splash handoff. */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Fraunces_400Regular,
  Fraunces_600SemiBold,
  Fraunces_400Regular_Italic,
} from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { colors } from '@/theme/tokens';
import { LibraryProvider } from '@/lib/store';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_600SemiBold,
    Fraunces_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bgObsidian).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <LibraryProvider>
      <View style={styles.ground}>
        <StatusBar style="light" backgroundColor={colors.bgObsidian} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bgObsidian },
            animation: 'fade_from_bottom',
            animationDuration: 320,
          }}
        >
          <Stack.Screen name="index" options={{ animation: 'fade' }} />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen name="detail/[subjectId]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="player" options={{ animation: 'fade' }} />
          <Stack.Screen name="about" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </View>
    </LibraryProvider>
  );
}

const styles = StyleSheet.create({
  ground: {
    flex: 1,
    backgroundColor: colors.bgObsidian,
  },
});
