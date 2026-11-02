import React, {useCallback, useRef, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Camera, Code, useCameraDevice, useCameraPermission} from 'react-native-vision-camera';
import {parseQrPayload} from '../../api/pairing';
import {useTheme} from '../../theme';
import {Button, Icon} from '../../components/ui';

/**
 * Phone-side QR capture. The QR carries a challenge id only — never a token, never a
 * media URL — so a photograph of the screen leaks nothing useful.
 */
export default function PairingScanScreen({navigation}: any) {
  const {c, t, s, r} = useTheme();
  const insets = useSafeAreaInsets();
  const {hasPermission, requestPermission} = useCameraPermission();
  const device = useCameraDevice('back');
  const [handled, setHandled] = useState(false);
  const lock = useRef(false);

  const onCodeScanned = useCallback(
    (codes: Code[]) => {
      if (lock.current) {
        return;
      }
      const value = codes.find(x => x.value)?.value;
      if (!value) {
        return;
      }
      const challengeId = parseQrPayload(value);
      if (!challengeId) {
        return;
      }
      lock.current = true;
      setHandled(true);
      navigation.replace('PairingCode', {challengeId});
    },
    [navigation],
  );

  if (!hasPermission) {
    return (
      <View style={{flex: 1, backgroundColor: c.obsidian, paddingTop: insets.top, padding: s.gutter}}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityLabel="Go back">
          <Icon name="back" size={22} color={c.ivory} />
        </Pressable>
        <View style={{flex: 1, justifyContent: 'center'}}>
          <Text style={[t.displayMd, {color: c.ivory}]}>Camera access</Text>
          <Text style={[t.bodyMd, {color: c.muted, marginTop: s.xs}]}>
            The scanner needs the camera to read the code on your television. Nothing is recorded
            or uploaded.
          </Text>
          <View style={{marginTop: s.lg}}>
            <Button label="Allow camera" icon="qr" onPress={() => requestPermission()} />
          </View>
          <View style={{marginTop: s.sm}}>
            <Button label="Type the code instead" variant="ghost" onPress={() => navigation.replace('PairingCode')} />
          </View>
        </View>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={{flex: 1, backgroundColor: c.obsidian, justifyContent: 'center', padding: s.gutter}}>
        <Text style={[t.bodyMd, {color: c.muted}]}>No camera on this device. Type the code instead.</Text>
        <View style={{marginTop: s.md}}>
          <Button label="Enter code" onPress={() => navigation.replace('PairingCode')} />
        </View>
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: '#000'}}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!handled}
        codeScanner={{codeTypes: ['qr'], onCodeScanned}}
      />
      <View style={[StyleSheet.absoluteFill, {backgroundColor: 'rgba(0,0,0,0.35)'}]} pointerEvents="none" />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: '28%',
          left: '12%',
          right: '12%',
          aspectRatio: 1,
          borderWidth: 2,
          borderColor: c.copper,
          borderRadius: r.lg,
        }}
      />
      <View style={{position: 'absolute', top: insets.top + s.sm, left: s.gutter, right: s.gutter}}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityLabel="Close scanner">
          <Icon name="close" size={24} color={c.ivory} />
        </Pressable>
        <Text style={[t.titleMd, {color: c.ivory, marginTop: s.md}]}>Point at the code on your TV</Text>
        <Text style={[t.bodySm, {color: c.muted, marginTop: 4}]}>It sits under the six-character code.</Text>
      </View>
      <View style={{position: 'absolute', bottom: insets.bottom + s.xl, left: s.gutter, right: s.gutter}}>
        <Button label="Type the code instead" variant="secondary" onPress={() => navigation.replace('PairingCode')} full />
      </View>
    </View>
  );
}
