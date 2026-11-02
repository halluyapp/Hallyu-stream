import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

/**
 * Last-resort render guard.
 *
 * A release React Native build shows a blank screen and then dies when a render
 * throws, which is indistinguishable from a native crash. Catching the error
 * here turns "the app closed itself" into a readable message the user can
 * screenshot, and keeps the process alive so the rest of the app is reachable.
 */
type Props = {children: React.ReactNode};
type State = {error: Error | null; info: string | null};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {error: null, info: null};

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {error};
  }

  componentDidCatch(error: Error, info: {componentStack?: string | null}) {
    // eslint-disable-next-line no-console
    console.error('HALLYU render error:', error?.message, info?.componentStack);
    this.setState({info: info?.componentStack ?? null});
  }

  render() {
    const {error, info} = this.state;
    if (!error) {
      return this.props.children;
    }
    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.reel}>HALLYU-STREAM</Text>
          <Text style={styles.title}>Something broke while drawing this screen</Text>
          <Text style={styles.msg}>{String(error?.message || error)}</Text>
          {info ? <Text style={styles.stack}>{info.trim()}</Text> : null}
          <Text style={styles.hint}>
            Screenshot this and send it over — the message names the exact component.
          </Text>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#0A0B0D'},
  body: {padding: 24, paddingTop: 72},
  reel: {color: '#C97B4A', fontSize: 11, letterSpacing: 3.4, fontWeight: '600'},
  title: {color: '#F4EFE7', fontSize: 24, fontWeight: '600', marginTop: 10, marginBottom: 14},
  msg: {color: '#E8A49B', fontSize: 14, lineHeight: 21},
  stack: {color: '#A8A199', fontSize: 11, lineHeight: 17, marginTop: 18},
  hint: {color: '#6E6862', fontSize: 12, marginTop: 22, lineHeight: 18},
});
