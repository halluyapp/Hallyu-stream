import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {C, useTheme} from '../theme';
import {Icon, IconName} from '../components/ui';
import HomeScreen from '../screens/mobile/HomeScreen';
import ExploreScreen from '../screens/mobile/ExploreScreen';
import SearchScreen from '../screens/mobile/SearchScreen';
import LibraryScreen from '../screens/mobile/LibraryScreen';
import SettingsScreen from '../screens/mobile/SettingsScreen';
import DetailScreen from '../screens/mobile/DetailScreen';
import DownloadsScreen from '../screens/mobile/DownloadsScreen';
import {DevicesScreen, PairingCodeScreen, PairingHubScreen} from '../screens/mobile/PairingScreens';
import PairingScanScreen from '../screens/mobile/PairingScanScreen';
import PlayerScreen from '../screens/PlayerScreen';

export type RootStackParamList = {
  Tabs: undefined;
  Detail: {subjectId: string; detailPath: string; title?: string};
  Player: {
    subjectId: string;
    detailPath: string;
    title: string;
    season: number;
    episode: number;
    episodeTitle?: string;
    poster?: string;
    startAtMs?: number;
  };
  Downloads: undefined;
  PairingHub: undefined;
  PairingCode: {challengeId?: string} | undefined;
  PairingScan: undefined;
  Devices: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator();

const TAB_ICONS: Record<string, IconName> = {
  Home: 'home',
  Explore: 'explore',
  Search: 'search',
  Library: 'library',
  Settings: 'settings',
};

function TabBar({state, descriptors, navigation}: any) {
  const {c, t, device} = useTheme();
  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: device.glass ? c.glass : c.elevated,
          borderTopColor: c.hairline,
        },
      ]}>
      {state.routes.map((route: any, index: number) => {
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({type: 'tabPress', target: route.key, canPreventDefault: true});
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        return (
          <Text
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{selected: focused}}
            accessibilityLabel={route.name}
            onPress={onPress}
            style={styles.tabItem}>
            <View style={styles.tabInner}>
              <Icon name={TAB_ICONS[route.name] ?? 'home'} size={22} color={focused ? c.copper : c.faint} />
              <Text style={[t.micro, {color: focused ? c.copper : c.faint, marginTop: 3}]}>{route.name}</Text>
            </View>
          </Text>
        );
      })}
    </View>
  );
}

function MobileTabs() {
  return (
    <Tabs.Navigator screenOptions={{headerShown: false}} tabBar={props => <TabBar {...props} />}>
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Explore" component={ExploreScreen} />
      <Tabs.Screen name="Search" component={SearchScreen} />
      <Tabs.Screen name="Library" component={LibraryScreen} />
      <Tabs.Screen name="Settings" component={SettingsScreen} />
    </Tabs.Navigator>
  );
}

export function MobileNavigator() {
  const {c} = useTheme();
  const navTheme = {
    ...DefaultTheme,
    dark: true,
    colors: {
      ...DefaultTheme.colors,
      background: c.obsidian,
      card: c.surface,
      text: c.ivory,
      border: c.hairline,
      primary: c.copper,
      notification: c.copper,
    },
  };
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: c.obsidian},
          animation: 'fade',
        }}>
        <Stack.Screen name="Tabs" component={MobileTabs} />
        <Stack.Screen name="Detail" component={DetailScreen} />
        <Stack.Screen name="Player" component={PlayerScreen} options={{animation: 'fade'}} />
        <Stack.Screen name="Downloads" component={DownloadsScreen} />
        <Stack.Screen name="PairingHub" component={PairingHubScreen} />
        <Stack.Screen name="PairingCode" component={PairingCodeScreen} />
        <Stack.Screen name="PairingScan" component={PairingScanScreen} />
        <Stack.Screen name="Devices" component={DevicesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingBottom: 10,
  },
  tabItem: {flex: 1, alignItems: 'center'},
  tabInner: {alignItems: 'center'},
});
