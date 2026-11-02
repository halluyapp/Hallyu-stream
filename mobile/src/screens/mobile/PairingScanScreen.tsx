import React, {useState} from 'react';
import {Pressable, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../theme';
import {Button, Icon} from '../../components/ui';

/**
 * Phone-side pairing entry.
 *
 * This used to be a QR scanner built on react-native-vision-camera. That module
 * needs react-native-worklets-core plus a native C++ build to be present; when
 * it is not, the screen throws the moment it mounts. Manual code entry needs no
 * camera permission, no native surface and no extra native code, and the
 * pairing protocol already accepts a 6-character code — so the QR was a
 * convenience, never a requirement.
 *
 * The TV shows a code; the user types it here; the TV polls and receives the
 * one-time credential. Nothing about the security model changes.
 */
export default function PairingScanScreen({navigation}: any) {
  const {c, t, s, r} = useTheme();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');

  const clean = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
  const ready = clean.length === 6;

  const submit = () => {
    if (ready) {
      navigation.replace('PairingCode', {challengeId: undefined, code: clean});
    }
  };

  return (
    <View style={{flex: 1, backgroundColor: c.obsidian, paddingTop: insets.top, padding: s.gutter}}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityLabel="Go back">
        <Icon name="back" size={22} color={c.ivory} />
      </Pressable>

      <View style={{flex: 1, justifyContent: 'center'}}>
        <Text style={[t.reel, {color: c.copper}]}>PAIR A TELEVISION</Text>
        <Text style={[t.displayMd, {color: c.ivory, marginTop: s.xs}]}>Enter the code</Text>
        <Text style={[t.bodyMd, {color: c.muted, marginTop: s.xs}]}>
          Your television shows a six-character code on its activation screen. Type it here and the
          TV picks up your session on its next poll.
        </Text>

        <TextInput
          value={clean}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus
          maxLength={6}
          placeholder="ABC123"
          placeholderTextColor={c.faint}
          returnKeyType="go"
          onSubmitEditing={submit}
          style={{
            marginTop: s.lg,
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: ready ? c.copper : c.hairline,
            borderRadius: r.md,
            paddingVertical: s.md,
            paddingHorizontal: s.md,
            color: c.ivory,
            fontSize: 30,
            letterSpacing: 12,
            textAlign: 'center',
            fontFamily: 'Inter_600SemiBold',
          }}
        />

        <View style={{marginTop: s.lg}}>
          <Button label="Continue" icon="check" disabled={!ready} onPress={submit} />
        </View>

        <Text style={[t.micro, {color: c.faint, marginTop: s.md, textAlign: 'center'}]}>
          The code expires after ten minutes and can only be used once.
        </Text>
      </View>
    </View>
  );
}
