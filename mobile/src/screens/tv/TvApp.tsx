import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import QRCode from 'react-native-qrcode-svg';
import {api, Title} from '../../api/provider';
import {pairing, PairingError} from '../../api/pairing';
import {useApp} from '../../state/store';
import {useTheme} from '../../theme';
import {C, R, S} from '../../theme';
import {Icon, IconName, ProgressBar, ReelLabel} from '../../components/ui';
import PlayerScreen from '../PlayerScreen';
import {formatPosition} from '../../core/platform';
import {useAsync} from '../../core/hooks';

/* --------------------------- focusable tile -------------------------- */

function TvTile({
  onPress,
  children,
  style,
  preferred,
  label,
}: {
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
  preferred?: boolean;
  label?: string;
}) {
  const [focused, setFocused] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const anim = (to: number, ms: number) =>
    Animated.timing(scale, {toValue: to, duration: ms, useNativeDriver: true}).start();
  return (
    <Animated.View style={[{transform: [{scale}]}, style, focused ? {zIndex: 5} : null]}>
      <Pressable
        hasTVPreferredFocus={preferred}
        onFocus={() => {
          setFocused(true);
          anim(1.04, 180);
        }}
        onBlur={() => {
          setFocused(false);
          anim(1, 120);
        }}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}>
        <View>
          {children}
          {focused ? (
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFillObject, {borderWidth: 3, borderColor: C.copper, borderRadius: R.md, margin: -3}]}
            />
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ----------------------------- activation ---------------------------- */

function ActivationScreen({onPaired}: {onPaired: () => void}) {
  const {t, s, r} = useTheme();
  const {settings, showToast} = useApp();
  const [challenge, setChallenge] = useState<any>(null);
  const [status, setStatus] = useState<'creating' | 'waiting' | 'approved' | 'expired' | 'error'>('creating');
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [attempt, setAttempt] = useState(0);

  const create = useCallback(async () => {
    setStatus('creating');
    setError(null);
    try {
      const res = await pairing.createSession(settings.pairingBaseUrl || null, 'Living Room TV', 'tv');
      setChallenge(res);
      setSecondsLeft(res.ttlSeconds);
      setStatus('waiting');
    } catch (e: any) {
      setStatus('error');
      setError(e instanceof PairingError ? e.message : 'Could not reach the pairing service.');
    }
  }, [settings.pairingBaseUrl]);

  useEffect(() => {
    void create();
  }, [create, attempt]);

  // Countdown.
  useEffect(() => {
    if (status !== 'waiting') {
      return;
    }
    const id = setInterval(() => {
      setSecondsLeft(v => {
        if (v <= 1) {
          setStatus('expired');
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [status]);

  // Poll every 2 seconds. The poll token is a header, never a URL.
  useEffect(() => {
    if (status !== 'waiting' || !challenge) {
      return;
    }
    const id = setInterval(async () => {
      try {
        const res = await pairing.status(settings.pairingBaseUrl || null, challenge.challengeId, challenge.pollToken);
        if (res.status === 'approved') {
          setStatus('approved');
          showToast(`${res.deviceName ?? 'Your TV'} connected`);
          setTimeout(onPaired, 900);
        } else if (res.status === 'rejected') {
          setStatus('expired');
          setError('The phone declined this code.');
        } else if (res.status === 'expired') {
          setStatus('expired');
        }
      } catch {
        // Transient network failures are expected; keep polling until TTL.
      }
    }, 2000);
    return () => clearInterval(id);
  }, [status, challenge, settings.pairingBaseUrl, onPaired, showToast]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <View style={{flex: 1, backgroundColor: C.obsidian, padding: 64}}>
      <Text style={[t.reel, {color: C.faint}]}>HALLYU-STREAM</Text>
      <Text style={[t.displayXl, {color: C.ivory, marginTop: 8}]}>Wake the screen</Text>
      <Text style={[t.bodyMd, {color: C.muted, marginTop: 12, maxWidth: 720}]}>
        Scan the square with your phone, or type the code at hallyu.stream/pair. The code dies the
        moment it is used, and it never contains your account.
      </Text>

      <View style={{flexDirection: 'row', marginTop: 48, alignItems: 'flex-start'}}>
        <View
          style={{
            backgroundColor: C.ivory,
            padding: 20,
            borderRadius: r.md,
          }}>
          {challenge ? (
            <QRCode value={challenge.qrPayload} size={240} backgroundColor="#F4EFE7" color="#0A0B0D" />
          ) : (
            <View style={{width: 240, height: 240, alignItems: 'center', justifyContent: 'center'}}>
              <Text style={{color: C.obsidian}}>…</Text>
            </View>
          )}
        </View>

        <View style={{marginLeft: 56, flex: 1}}>
          <Text style={[t.reel, {color: C.muted}]}>OR ENTER THIS CODE</Text>
          <Text style={[t.displayXl, {color: C.copperLight, letterSpacing: 10, marginTop: 8}]}>
            {challenge?.shortCode ?? '———-———'}
          </Text>

          <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 24}}>
            <Icon name="clock" size={18} color={status === 'expired' ? C.error : C.muted} />
            <Text style={[t.bodyMd, {color: status === 'expired' ? C.error : C.muted, marginLeft: 8}]}>
              {status === 'expired' ? 'This code expired' : `Expires in ${mm}:${ss}`}
            </Text>
          </View>

          {status === 'approved' ? (
            <Text style={[t.titleMd, {color: C.success, marginTop: 20}]}>Connected. Opening your library…</Text>
          ) : null}

          {status === 'error' || error ? (
            <View style={{marginTop: 20}}>
              <Text style={[t.bodyMd, {color: C.error}]}>{error ?? 'Something went wrong.'}</Text>
              <Pressable
                onPress={() => setAttempt(a => a + 1)}
                style={{marginTop: 16, alignSelf: 'flex-start', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, backgroundColor: C.copper}}>
                <Text style={[t.labelLg, {color: C.obsidian}]}>Try again</Text>
              </Pressable>
            </View>
          ) : null}

          {status === 'expired' ? (
            <Pressable
              onPress={() => setAttempt(a => a + 1)}
              style={{marginTop: 20, alignSelf: 'flex-start', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, borderWidth: 1, borderColor: C.hairlineStrong}}>
              <Text style={[t.labelLg, {color: C.ivory}]}>New code</Text>
            </Pressable>
          ) : null}

          <Pressable onPress={onPaired} style={{marginTop: 40}}>
            <Text style={[t.labelMd, {color: C.faint}]}>Browse without pairing →</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/* -------------------------------- rail ------------------------------- */

const RAIL: {key: string; label: string; icon: IconName}[] = [
  {key: 'home', label: 'Home', icon: 'home'},
  {key: 'explore', label: 'Explore', icon: 'explore'},
  {key: 'search', label: 'Search', icon: 'search'},
  {key: 'library', label: 'Library', icon: 'library'},
  {key: 'settings', label: 'Settings', icon: 'settings'},
];

function Rail({active, onSelect}: {active: string; onSelect: (k: string) => void}) {
  const {t} = useTheme();
  const [expanded, setExpanded] = useState(false);
  const width = useRef(new Animated.Value(S.railCollapsed)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: expanded ? S.railExpanded : S.railCollapsed,
      duration: 240,
      useNativeDriver: false,
    }).start();
  }, [expanded, width]);

  return (
    <Animated.View
      style={{
        width,
        backgroundColor: C.surface,
        borderRightWidth: StyleSheet.hairlineWidth,
        borderRightColor: C.hairline,
        paddingTop: 32,
        paddingHorizontal: 12,
      }}>
      <View style={{height: 48, justifyContent: 'center', marginBottom: 24}}>
        <Text style={[t.reel, {color: C.copperLight, marginLeft: 12}]}>H</Text>
      </View>
      {RAIL.map(item => {
        const selected = active === item.key;
        return (
          <Pressable
            key={item.key}
            onFocus={() => setExpanded(true)}
            onBlur={() => setExpanded(false)}
            onPress={() => onSelect(item.key)}
            accessibilityRole="tab"
            accessibilityState={{selected}}
            accessibilityLabel={item.label}
            style={({focused}: any) => [
              styles.railItem,
              {
                backgroundColor: selected ? C.copperTint : 'transparent',
                borderLeftWidth: 3,
                borderLeftColor: selected ? C.copper : 'transparent',
              },
              focused ? {borderWidth: 3, borderColor: C.copper, borderRadius: R.sm} : null,
            ]}>
            <View style={{width: 48, alignItems: 'center'}}>
              <Icon name={item.icon} size={24} color={selected ? C.copper : C.muted} />
            </View>
            {expanded ? (
              <Text style={[t.labelLg, {color: selected ? C.ivory : C.muted, marginLeft: 8}]}>{item.label}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

/* ----------------------------- tv posters ---------------------------- */

function TvPoster({item, onPress, width = 220, progress}: {item: Title; onPress: () => void; width?: number; progress?: number}) {
  const {t} = useTheme();
  const height = Math.round((width * 3) / 2);
  return (
    <TvTile onPress={onPress} label={item.title} style={{marginRight: 20}}>
      <View style={{width, height, borderRadius: R.sm, overflow: 'hidden', backgroundColor: C.elevated}}>
        {item.poster ? <Image source={{uri: item.poster}} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
        {progress && progress > 0.01 ? (
          <View style={{position: 'absolute', left: 0, right: 0, bottom: 0}}>
            <ProgressBar ratio={progress} height={4} />
          </View>
        ) : null}
      </View>
      <Text numberOfLines={1} style={[t.labelLg, {color: C.ivory, marginTop: 10, width}]}>
        {item.title}
      </Text>
    </TvTile>
  );
}

function TvRow({title, items, onPress, progressFor}: {title: string; items: Title[]; onPress: (t: Title) => void; progressFor?: (t: Title) => number | undefined}) {
  if (items.length === 0) {
    return null;
  }
  return (
    <View style={{marginBottom: 28}}>
      <View style={{paddingHorizontal: 48, marginBottom: 12}}>
        <ReelLabel>{title}</ReelLabel>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 48}}>
        {items.map(item => (
          <TvPoster key={item.subjectId} item={item} onPress={() => onPress(item)} progress={progressFor?.(item)} />
        ))}
      </ScrollView>
    </View>
  );
}

/* ------------------------------- screens ----------------------------- */

function TvHome({onOpen}: {onOpen: (t: Title) => void}) {
  const {t} = useTheme();
  const {progressFor} = useApp();
  const {data, loading} = useAsync(signal => api.home(signal), []);
  const featured = data?.[0]?.items?.[0];

  if (loading) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <Text style={[t.bodyMd, {color: C.muted}]}>Opening the catalogue…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{paddingTop: 32, paddingBottom: 48}}>
      {featured ? (
        <View style={{height: 460, marginBottom: 32, marginHorizontal: 48, borderRadius: R.lg, overflow: 'hidden'}}>
          <Image source={{uri: featured.poster}} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={[StyleSheet.absoluteFill, {backgroundColor: 'rgba(10,11,13,0.55)'}]} />
          <View style={{flex: 1, justifyContent: 'flex-end', padding: 40}}>
            <Text style={[t.reel, {color: C.copperLight}]}>FEATURED TONIGHT</Text>
            <Text style={[t.displayXl, {color: C.ivory, marginTop: 8, maxWidth: 900}]} numberOfLines={2}>
              {featured.title}
            </Text>
            <View style={{flexDirection: 'row', marginTop: 20}}>
              <TvTile onPress={() => onOpen(featured)} preferred label={`Open ${featured.title}`}>
                <View style={{paddingHorizontal: 32, paddingVertical: 14, borderRadius: 999, backgroundColor: C.copper}}>
                  <Text style={[t.labelLg, {color: C.obsidian}]}>Watch now</Text>
                </View>
              </TvTile>
            </View>
          </View>
        </View>
      ) : null}

      {data?.map(section => (
        <TvRow
          key={section.key}
          title={section.title}
          items={section.items}
          onPress={onOpen}
          progressFor={item => {
            const p = progressFor(item.subjectId, item.type === 'series' ? 1 : 0, item.type === 'series' ? 1 : 0);
            return p && p.durationMs ? p.positionMs / p.durationMs : undefined;
          }}
        />
      ))}
    </ScrollView>
  );
}

function TvExplore({onOpen}: {onOpen: (t: Title) => void}) {
  const {t} = useTheme();
  const {data, loading} = useAsync(signal => api.home(signal), []);
  const all = useMemo(() => {
    const seen = new Set<string>();
    const out: Title[] = [];
    (data ?? []).forEach(sec => sec.items.forEach(i => {
      if (!seen.has(i.subjectId)) {
        seen.add(i.subjectId);
        out.push(i);
      }
    }));
    return out;
  }, [data]);

  if (loading) {
    return <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}><Text style={[t.bodyMd, {color: C.muted}]}>Loading…</Text></View>;
  }

  return (
    <ScrollView contentContainerStyle={{padding: 48, flexDirection: 'row', flexWrap: 'wrap'}}>
      {all.map(item => (
        <View key={item.subjectId} style={{marginBottom: 28}}>
          <TvPoster item={item} onPress={() => onOpen(item)} width={200} />
        </View>
      ))}
    </ScrollView>
  );
}

const KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function TvSearch({onOpen}: {onOpen: (t: Title) => void}) {
  const {t} = useTheme();
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const {data, loading} = useAsync(
    signal => (submitted.length >= 2 ? api.search(submitted, 1, signal) : Promise.resolve(null)),
    [submitted],
  );

  return (
    <View style={{flex: 1, padding: 48}}>
      <Text style={[t.displayLg, {color: C.ivory}]}>Search</Text>
      <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 16, height: 64, borderRadius: R.md, backgroundColor: C.elevated, paddingHorizontal: 24}}>
        <Icon name="search" size={22} color={C.faint} />
        <Text style={[t.titleMd, {color: query ? C.ivory : C.faint, marginLeft: 12}]}>{query || 'Type with the remote'}</Text>
      </View>

      <View style={{flexDirection: 'row', flexWrap: 'wrap', marginTop: 24, maxWidth: 900}}>
        {KEYS.map(k => (
          <TvTile key={k} onPress={() => setQuery(q => (q + k).slice(0, 40))} label={k} style={{marginRight: 10, marginBottom: 10}}>
            <View style={{width: 64, height: 56, borderRadius: R.xs, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center'}}>
              <Text style={[t.labelLg, {color: C.ivory}]}>{k}</Text>
            </View>
          </TvTile>
        ))}
        <TvTile onPress={() => setQuery(q => q.slice(0, -1))} label="Delete" style={{marginRight: 10, marginBottom: 10}}>
          <View style={{width: 104, height: 56, borderRadius: R.xs, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center'}}>
            <Icon name="back" size={20} color={C.ivory} />
          </View>
        </TvTile>
        <TvTile onPress={() => setQuery(q => `${q} `)} label="Space" style={{marginRight: 10, marginBottom: 10}}>
          <View style={{width: 104, height: 56, borderRadius: R.xs, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center'}}>
            <Text style={[t.labelMd, {color: C.ivory}]}>Space</Text>
          </View>
        </TvTile>
        <TvTile onPress={() => setSubmitted(query.trim())} label="Search" style={{marginBottom: 10}}>
          <View style={{width: 140, height: 56, borderRadius: R.xs, backgroundColor: C.copper, alignItems: 'center', justifyContent: 'center'}}>
            <Text style={[t.labelLg, {color: C.obsidian}]}>Search</Text>
          </View>
        </TvTile>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop: 24}} contentContainerStyle={{paddingBottom: 16}}>
        {loading ? <Text style={[t.bodyMd, {color: C.muted}]}>Searching…</Text> : null}
        {(data?.items ?? []).map(item => (
          <TvPoster key={item.subjectId} item={item} onPress={() => onOpen(item)} width={180} />
        ))}
        {data && data.items.length === 0 ? (
          <Text style={[t.bodyMd, {color: C.muted}]}>Nothing for “{submitted}”.</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

function TvLibrary({onOpen}: {onOpen: (t: Title) => void}) {
  const {t} = useTheme();
  const {library, continueWatching} = useApp();
  const resume = continueWatching();
  return (
    <ScrollView contentContainerStyle={{padding: 48}}>
      <Text style={[t.displayLg, {color: C.ivory, marginBottom: 24}]}>Library</Text>
      {resume.length > 0 ? (
        <View style={{marginBottom: 32}}>
          <ReelLabel>Continue watching</ReelLabel>
          <View style={{flexDirection: 'row', flexWrap: 'wrap', marginTop: 16}}>
            {resume.map(p => (
              <TvTile key={p.subjectId} onPress={() => onOpen({subjectId: p.subjectId, detailPath: p.detailPath, title: p.title, poster: p.poster, type: 'series'})} label={p.title} style={{marginRight: 20, marginBottom: 20}}>
                <View style={{width: 300, height: 170, borderRadius: R.sm, backgroundColor: C.elevated, justifyContent: 'flex-end', padding: 12}}>
                  <Text numberOfLines={1} style={[t.labelLg, {color: C.ivory}]}>{p.title}</Text>
                  <Text style={[t.micro, {color: C.copperLight}]}>
                    {p.season > 0 ? `S${p.season} E${p.episode} · ` : ''}{formatPosition(p.positionMs)}
                  </Text>
                </View>
              </TvTile>
            ))}
          </View>
        </View>
      ) : null}

      {library.length === 0 ? (
        <Text style={[t.bodyMd, {color: C.muted}]}>Nothing saved yet. Press “Add to library” on any title.</Text>
      ) : (
        <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
          {library.map(item => (
            <TvPoster key={item.subjectId} item={{...item}} onPress={() => onOpen({...item})} width={200} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function TvSettings() {
  const {t} = useTheme();
  const {settings, updateSettings, deviceToken, setDeviceToken, showToast} = useApp();
  const rows: {label: string; value: string; onPress: () => void}[] = [
    {
      label: 'Autoplay next episode',
      value: settings.autoplayNext ? 'On' : 'Off',
      onPress: () => updateSettings({autoplayNext: !settings.autoplayNext}),
    },
    {
      label: 'Preferred quality',
      value: settings.preferredQuality === 'auto' ? 'Auto' : settings.preferredQuality,
      onPress: () => {
        const order = ['auto', '360p', '480p', '720p', '1080p'];
        const next = order[(order.indexOf(settings.preferredQuality) + 1) % order.length];
        updateSettings({preferredQuality: next as any});
      },
    },
    {
      label: 'Subtitles',
      value: settings.subtitlesOn ? 'On' : 'Off',
      onPress: () => updateSettings({subtitlesOn: !settings.subtitlesOn}),
    },
    {
      label: 'Pairing service',
      value: settings.pairingBaseUrl || 'default',
      onPress: () => showToast('Set PAIRING_BASE_URL at build time.'),
    },
    {
      label: 'This television',
      value: deviceToken ? 'Paired' : 'Not paired',
      onPress: () => {
        setDeviceToken(null, null);
        showToast('Signed out of the pairing service.');
      },
    },
  ];

  return (
    <ScrollView contentContainerStyle={{padding: 48}}>
      <Text style={[t.displayLg, {color: C.ivory, marginBottom: 24}]}>Settings</Text>
      {rows.map(row => (
        <TvTile key={row.label} onPress={row.onPress} label={`${row.label}: ${row.value}`} style={{marginBottom: 12}}>
          <View style={{width: 760, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 20, borderRadius: R.sm, backgroundColor: C.surface}}>
            <Text style={[t.titleSm, {color: C.ivory}]}>{row.label}</Text>
            <Text style={[t.labelLg, {color: C.copperLight}]}>{row.value}</Text>
          </View>
        </TvTile>
      ))}
      <Text style={[t.micro, {color: C.faint, marginTop: 24}]}>
        HALLYU-STREAM 1.0.0 · media streams directly from the CDN to this television.
      </Text>
    </ScrollView>
  );
}

/* ------------------------------- shell ------------------------------- */

function TvShell({navigation}: any) {
  const [paired, setPaired] = useState(false);
  const [tab, setTab] = useState('home');

  const openDetail = useCallback(
    (item: Title) =>
      navigation.navigate('TvDetail', {
        subjectId: item.subjectId,
        detailPath: item.detailPath,
        title: item.title,
      }),
    [navigation],
  );

  if (!paired) {
    return <ActivationScreen onPaired={() => setPaired(true)} />;
  }

  return (
    <View style={{flex: 1, flexDirection: 'row', backgroundColor: C.obsidian}}>
      <Rail active={tab} onSelect={setTab} />
      <View style={{flex: 1}}>
        {tab === 'home' ? <TvHome onOpen={openDetail} /> : null}
        {tab === 'explore' ? <TvExplore onOpen={openDetail} /> : null}
        {tab === 'search' ? <TvSearch onOpen={openDetail} /> : null}
        {tab === 'library' ? <TvLibrary onOpen={openDetail} /> : null}
        {tab === 'settings' ? <TvSettings /> : null}
      </View>
    </View>
  );
}

function TvDetailScreen({route, navigation}: any) {
  const {detailPath, title: fallback} = route.params;
  const {t} = useTheme();
  const {data} = useAsync(signal => api.detail(detailPath, signal), [detailPath]);
  const [season, setSeason] = useState(1);

  const play = (se: number, ep: number) =>
    navigation.navigate('Player', {
      subjectId: data?.subjectId ?? route.params.subjectId,
      detailPath,
      title: data?.title ?? fallback,
      season: se,
      episode: ep,
      poster: data?.poster,
    });

  if (!data) {
    return <View style={{flex: 1, backgroundColor: C.obsidian, alignItems: 'center', justifyContent: 'center'}}><Text style={[t.bodyMd, {color: C.muted}]}>Loading…</Text></View>;
  }

  const isMovie = data.type === 'movie';
  const active = data.seasons.find(x => x.season === season) ?? data.seasons[0];

  return (
    <ScrollView style={{backgroundColor: C.obsidian}} contentContainerStyle={{paddingBottom: 64}}>
      <View style={{height: 480}}>
        <Image source={{uri: data.backdrop || data.poster}} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={[StyleSheet.absoluteFill, {backgroundColor: 'rgba(10,11,13,0.6)'}]} />
        <View style={{flex: 1, justifyContent: 'flex-end', padding: 48}}>
          <Text style={[t.displayXl, {color: C.ivory}]}>{data.title}</Text>
          <Text style={[t.labelLg, {color: C.muted, marginTop: 8}]}>
            {[data.year, data.rating ? `${data.rating} ★` : null, data.country, data.genres.slice(0, 2).join(', ')].filter(Boolean).join('  ·  ')}
          </Text>
          <View style={{flexDirection: 'row', marginTop: 24}}>
            <TvTile onPress={() => play(isMovie ? 0 : 1, isMovie ? 0 : 1)} preferred label="Play">
              <View style={{paddingHorizontal: 32, paddingVertical: 14, borderRadius: 999, backgroundColor: C.copper, marginRight: 16}}>
                <Text style={[t.labelLg, {color: C.obsidian}]}>{isMovie ? 'Play' : 'Play S1 E1'}</Text>
              </View>
            </TvTile>
            <TvTile onPress={() => navigation.goBack()} label="Back">
              <View style={{paddingHorizontal: 32, paddingVertical: 14, borderRadius: 999, borderWidth: 1, borderColor: C.hairlineStrong}}>
                <Text style={[t.labelLg, {color: C.ivory}]}>Back</Text>
              </View>
            </TvTile>
          </View>
        </View>
      </View>

      <View style={{paddingHorizontal: 48, marginTop: 32}}>
        <Text style={[t.bodyMd, {color: C.muted, maxWidth: 1100}]}>{data.description}</Text>

        {!isMovie && data.seasons.length > 0 ? (
          <View style={{marginTop: 32}}>
            <View style={{flexDirection: 'row', marginBottom: 16}}>
              {data.seasons.map(se => (
                <TvTile key={se.season} onPress={() => setSeason(se.season)} label={`Season ${se.season}`} style={{marginRight: 12}}>
                  <View style={{paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, backgroundColor: active?.season === se.season ? C.copperTint : C.surface, borderWidth: 1, borderColor: active?.season === se.season ? C.copper : C.hairline}}>
                    <Text style={[t.labelMd, {color: active?.season === se.season ? C.copperLight : C.muted}]}>Season {se.season}</Text>
                  </View>
                </TvTile>
              ))}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {active?.episodes.map(ep => (
                <TvTile key={ep.id} onPress={() => play(ep.season, ep.episode)} label={`Episode ${ep.episode}`} style={{marginRight: 16}}>
                  <View style={{width: 240, height: 140, borderRadius: R.sm, backgroundColor: C.surface, justifyContent: 'flex-end', padding: 14, borderWidth: 1, borderColor: C.hairline}}>
                    <Text style={[t.labelLg, {color: C.ivory}]}>Episode {ep.episode}</Text>
                  </View>
                </TvTile>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

/* ----------------------------- navigator ----------------------------- */

const Stack = createNativeStackNavigator();

export default function TvNavigator() {
  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        dark: true,
        colors: {
          ...DefaultTheme.colors,
          background: C.obsidian,
          card: C.surface,
          text: C.ivory,
          border: C.hairline,
          primary: C.copper,
          notification: C.copper,
        },
      }}>
      <Stack.Navigator screenOptions={{headerShown: false, contentStyle: {backgroundColor: C.obsidian}, animation: 'fade'}}>
        <Stack.Screen name="TvShell" component={TvShell} />
        <Stack.Screen name="TvDetail" component={TvDetailScreen} />
        <Stack.Screen name="Player" component={PlayerScreen} options={{animation: 'fade'}} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  railItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    marginBottom: 8,
    borderRadius: R.sm,
  },
});
