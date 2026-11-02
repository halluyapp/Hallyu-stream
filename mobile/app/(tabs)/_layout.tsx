/** Five-tab IA (§4.2): Home · Explore · Search · Library · Settings. */
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Compass, Search, Library, Settings2 } from 'lucide-react-native';
import { colors, fonts, layout, type } from '@/theme/tokens';

const TABS = [
  { name: 'home', label: 'Home', Icon: Home },
  { name: 'explore', label: 'Explore', Icon: Compass },
  { name: 'search', label: 'Search', Icon: Search },
  { name: 'library', label: 'Library', Icon: Library },
  { name: 'settings', label: 'Settings', Icon: Settings2 },
] as const;

function GlassTabBar({ state, navigation }: { state: { index: number; routes: { key: string; name: string }[] }; navigation: { navigate: (name: string) => void } }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.navWrap, { paddingBottom: insets.bottom || 8 }]} pointerEvents="box-none">
      <View style={styles.glass}>
        {Platform.select({
          ios: (
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
              <View style={StyleSheet.absoluteFill} />
            </BlurView>
          ),
          default: null,
        })}
        <View style={styles.hairline} />
        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const active = state.index === index;
            const tab = TABS.find((t) => t.name === route.name) ?? TABS[0];
            const Icon = tab.Icon;
            return (
              <Pressable
                key={route.key}
                onPress={() => navigation.navigate(route.name)}
                style={styles.item}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={tab.label}
              >
                <Icon size={24} color={active ? colors.accentCopper : colors.textMuted} strokeWidth={1.75} />
                <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bgObsidian },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.label }} />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  navWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  glass: {
    height: layout.navHeight + 8,
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.bgGlass,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  hairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.topHighlight,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minWidth: layout.touchMin,
    height: layout.touchMin,
  },
  label: {
    ...type.micro,
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.accentCopper,
  },
});
