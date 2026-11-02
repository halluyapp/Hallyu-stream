import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {pairing, PairingError, PairedDevice} from '../../api/pairing';
import {useApp} from '../../state/store';
import {useTheme} from '../../theme';
import {Button, EmptyState, Hairline, Icon, ReelLabel} from '../../components/ui';
import {timeAgo} from '../../core/platform';

function Header({title, onBack}: {title: string; onBack: () => void}) {
  const {c, t, s} = useTheme();
  return (
    <View style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: s.gutter}}>
      <Pressable onPress={onBack} hitSlop={12} accessibilityLabel="Go back">
        <Icon name="back" size={22} color={c.ivory} />
      </Pressable>
      <Text style={[t.displayMd, {color: c.ivory, marginLeft: s.sm}]}>{title}</Text>
    </View>
  );
}

/* ------------------------------- hub -------------------------------- */

export function PairingHubScreen({navigation}: any) {
  const {c, t, s, r} = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{flex: 1, backgroundColor: c.obsidian}}
      contentContainerStyle={{paddingTop: insets.top + s.sm, paddingBottom: s.xxl}}>
      <Header title="Pair a screen" onBack={() => navigation.goBack()} />

      <View style={{paddingHorizontal: s.gutter, marginTop: s.lg}}>
        <Text style={[t.bodyMd, {color: c.muted}]}>
          Your television shows a six-character code and a QR square. Either one connects it to
          this phone. Nothing about your viewing is stored on a server.
        </Text>
      </View>

      <View style={{paddingHorizontal: s.gutter, marginTop: s.lg, gap: s.sm}}>
        <Button label="Enter the code" icon="qr" onPress={() => navigation.navigate('PairingCode')} full />
        <Button label="Scan the QR" icon="qr" variant="secondary" onPress={() => navigation.navigate('PairingScan')} full />
        <Button label="Paired devices" icon="tv" variant="ghost" onPress={() => navigation.navigate('Devices')} full />
      </View>

      <View style={{paddingHorizontal: s.gutter, marginTop: s.xl}}>
        <ReelLabel>How it works</ReelLabel>
        {[
          'The TV opens a challenge that expires in ten minutes.',
          'You approve it here — the TV never sees your account.',
          'The TV collects its credential exactly once, then the code is dead.',
        ].map((line, i) => (
          <View key={line} style={{flexDirection: 'row', marginTop: s.sm}}>
            <Text style={[t.labelLg, {color: c.copper, width: 22}]}>{i + 1}</Text>
            <Text style={[t.bodySm, {color: c.muted, flex: 1}]}>{line}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/* ---------------------------- code entry ---------------------------- */

export function PairingCodeScreen({navigation, route}: any) {
  const {c, t, s, r} = useTheme();
  const insets = useSafeAreaInsets();
  const {settings, deviceToken, setDeviceToken, showToast} = useApp();
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState<{challengeId: string; deviceName: string; expiresAt: string} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const normalised = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
  const display = normalised.length > 3 ? `${normalised.slice(0, 3)}-${normalised.slice(3)}` : normalised;

  const ensureToken = useCallback(async () => {
    if (deviceToken) {
      return deviceToken;
    }
    const res = await pairing.authDevice(settings.pairingBaseUrl || null, 'My phone');
    setDeviceToken(res.token);
    return res.token;
  }, [deviceToken, settings.pairingBaseUrl, setDeviceToken]);

  const lookup = useCallback(
    async (code: string) => {
      setBusy(true);
      setError(null);
      try {
        const res = await pairing.lookup(settings.pairingBaseUrl || null, code);
        setFound({challengeId: res.challengeId, deviceName: res.deviceName, expiresAt: res.expiresAt});
      } catch (e: any) {
        const msg = e instanceof PairingError ? e.message : 'That code did not work.';
        setError(msg);
      } finally {
        setBusy(false);
      }
    },
    [settings.pairingBaseUrl],
  );

  useEffect(() => {
    if (normalised.length === 6 && !found) {
      void lookup(normalised);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalised]);

  const approve = async () => {
    if (!found) {
      return;
    }
    setBusy(true);
    try {
      const token = await ensureToken();
      const res = await pairing.approve(settings.pairingBaseUrl || null, token, found.challengeId, found.deviceName, 'tv');
      showToast(res.message || 'Connected.');
      navigation.navigate('Devices');
    } catch (e: any) {
      setError(e instanceof PairingError ? e.message : 'Could not approve.');
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    if (!found) {
      return;
    }
    try {
      const token = await ensureToken();
      await pairing.reject(settings.pairingBaseUrl || null, token, found.challengeId);
      showToast('Connection declined.');
      navigation.goBack();
    } catch {
      showToast('Could not decline.');
    }
  };

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: c.obsidian}}
      contentContainerStyle={{paddingTop: insets.top + s.sm, paddingBottom: s.xxl}}
      keyboardShouldPersistTaps="handled">
      <Header title="Enter code" onBack={() => navigation.goBack()} />

      {!found ? (
        <>
          <View style={{paddingHorizontal: s.gutter, marginTop: s.lg}}>
            <Text style={[t.bodyMd, {color: c.muted}]}>
              Type the six characters shown on your television.
            </Text>
          </View>
          <Pressable onPress={() => inputRef.current?.focus()} style={{paddingHorizontal: s.gutter, marginTop: s.xl}}>
            <Text
              style={[
                t.displayXl,
                {color: normalised.length === 6 ? c.copperLight : c.ivory, letterSpacing: 8, textAlign: 'center'},
              ]}>
              {display || '———-———'}
            </Text>
          </Pressable>
          <TextInput
            ref={inputRef}
            value={raw}
            onChangeText={setRaw}
            autoFocus
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
            keyboardType="default"
            style={{position: 'absolute', opacity: 0, height: 1, width: 1}}
            accessibilityLabel="Pairing code"
          />
          {error ? (
            <Text style={[t.bodySm, {color: c.error, textAlign: 'center', marginTop: s.md}]}>{error}</Text>
          ) : null}
          {busy ? (
            <Text style={[t.micro, {color: c.faint, textAlign: 'center', marginTop: s.md}]}>Looking for that screen…</Text>
          ) : null}
        </>
      ) : (
        <View style={{paddingHorizontal: s.gutter, marginTop: s.lg}}>
          <View
            style={{
              backgroundColor: c.elevated,
              borderRadius: r.md,
              borderWidth: 1,
              borderColor: c.hairline,
              padding: s.lg,
            }}>
            <Text style={[t.reel, {color: c.copperLight}]}>CONNECT THIS SCREEN?</Text>
            <Text style={[t.displayMd, {color: c.ivory, marginTop: s.xs}]}>{found.deviceName}</Text>
            <Text style={[t.bodySm, {color: c.muted, marginTop: s.xs}]}>
              Code {display} · expires {new Date(found.expiresAt).toLocaleTimeString()}
            </Text>
            <View style={{flexDirection: 'row', gap: s.sm, marginTop: s.lg}}>
              <Button label="Approve" icon="check" onPress={approve} loading={busy} />
              <Button label="Decline" variant="danger" onPress={decline} />
            </View>
          </View>
          {error ? (
            <Text style={[t.bodySm, {color: c.error, marginTop: s.md}]}>{error}</Text>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

/* ----------------------------- devices ------------------------------ */

export function DevicesScreen({navigation}: any) {
  const {c, t, s} = useTheme();
  const insets = useSafeAreaInsets();
  const {settings, deviceToken, setDeviceToken, showToast} = useApp();
  const [devices, setDevices] = useState<PairedDevice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!deviceToken) {
      setDevices([]);
      return;
    }
    try {
      const res = await pairing.devices(settings.pairingBaseUrl || null, deviceToken);
      setDevices(res.devices);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load devices.');
      setDevices([]);
    }
  }, [deviceToken, settings.pairingBaseUrl]);

  useEffect(() => {
    void load();
  }, [load]);

  const revoke = (d: PairedDevice) => {
    Alert.alert('Disconnect this screen?', `${d.displayName} will need a new code to reconnect.`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          if (!deviceToken) {
            return;
          }
          try {
            await pairing.revoke(settings.pairingBaseUrl || null, deviceToken, d.id);
            showToast('Screen disconnected.');
            void load();
          } catch {
            showToast('Could not disconnect.');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: c.obsidian}}
      contentContainerStyle={{paddingTop: insets.top + s.sm, paddingBottom: s.xxl}}>
      <Header title="Devices" onBack={() => navigation.goBack()} />

      {!deviceToken ? (
        <EmptyState
          icon="tv"
          headline="No screens paired"
          body="Approve a code from your television and it will appear here."
          actionLabel="Pair a screen"
          onAction={() => navigation.navigate('PairingCode')}
        />
      ) : devices === null ? (
        <Text style={[t.bodySm, {color: c.faint, padding: s.gutter}]}>Loading…</Text>
      ) : devices.length === 0 ? (
        <EmptyState
          icon="tv"
          headline="No screens yet"
          body={error ?? 'Approve a code from your television and it will appear here.'}
          actionLabel="Pair a screen"
          onAction={() => navigation.navigate('PairingCode')}
        />
      ) : (
        <View style={{paddingHorizontal: s.gutter, marginTop: s.md}}>
          <ReelLabel>Paired screens</ReelLabel>
          {devices.map(d => (
            <View key={d.id}>
              <View style={styles.row}>
                <Icon name="tv" size={20} color={c.copper} />
                <View style={{flex: 1, marginLeft: s.sm}}>
                  <Text style={[t.titleSm, {color: c.ivory}]}>{d.displayName}</Text>
                  <Text style={[t.micro, {color: c.faint, marginTop: 2}]}>
                    {d.type} · paired {timeAgo(new Date(d.createdAt).getTime())}
                  </Text>
                </View>
                <Pressable onPress={() => revoke(d)} hitSlop={10} accessibilityLabel={`Disconnect ${d.displayName}`}>
                  <Text style={[t.labelMd, {color: c.error}]}>Disconnect</Text>
                </Pressable>
              </View>
              <Hairline />
            </View>
          ))}
          <View style={{marginTop: s.lg}}>
            <Button
              label="Forget this phone's sign-in"
              variant="secondary"
              onPress={() => {
                setDeviceToken(null, null);
                setDevices([]);
                showToast('Signed out of the pairing service.');
              }}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', paddingVertical: 16},
});
