/**
 * HALLYU-STREAM — application root.
 *
 * One binary, two experiences. The form factor is detected at runtime
 * (Platform.isTV plus a landscape/no-touch heuristic) and we mount either the
 * mobile tab navigator or the ten-foot television navigator. Everything below
 * this file is shared: theme tokens, provider client, pairing client, state.
 */
import React from 'react';
import {StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {ThemeProvider, C} from './src/theme';
import {AppProvider} from './src/state/store';
import {detectFormFactor} from './src/core/platform';
import {ErrorBoundary} from './src/core/ErrorBoundary';
import {MobileNavigator} from './src/navigation';
import TvNavigator from './src/screens/tv/TvApp';

export default function App(): React.JSX.Element {
  const {isTv, isLowTier} = React.useMemo(() => detectFormFactor(), []);

  return (
    <SafeAreaProvider>
      <ThemeProvider isTv={isTv} isLowTier={isLowTier}>
        <View style={styles.root}>
          <StatusBar
            barStyle="light-content"
            backgroundColor={isTv ? C.obsidian : 'transparent'}
            translucent={!isTv}
          />
          <ErrorBoundary>
            <AppProvider>
              {isTv ? <TvNavigator /> : <MobileNavigator />}
            </AppProvider>
          </ErrorBoundary>
        </View>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.obsidian},
});
