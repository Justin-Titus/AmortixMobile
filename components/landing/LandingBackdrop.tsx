import { View, StyleSheet } from 'react-native';

import { Colors } from '@/constants/theme';

export function LandingBackdrop() {
  return (
    <View pointerEvents="none" style={styles.root}>
      <View style={styles.paper} />
      <View style={styles.orbTopRight} />
      <View style={styles.orbBottomLeft} />
      <View style={styles.orbMidLeft} />
      <View style={styles.ringLarge} />
      <View style={styles.ringSmall} />
      <View style={styles.ruleTop} />
      <View style={styles.ruleBottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  paper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.frost,
  },
  orbTopRight: {
    position: 'absolute',
    top: -110,
    right: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(17, 140, 118, 0.14)',
  },
  orbBottomLeft: {
    position: 'absolute',
    bottom: -110,
    left: -90,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(13, 27, 47, 0.06)',
  },
  orbMidLeft: {
    position: 'absolute',
    top: 240,
    left: -55,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(245, 159, 58, 0.10)',
  },
  ringLarge: {
    position: 'absolute',
    top: 88,
    left: -150,
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 1,
    borderColor: 'rgba(17, 140, 118, 0.16)',
  },
  ringSmall: {
    position: 'absolute',
    bottom: 120,
    right: -120,
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: 'rgba(209, 77, 91, 0.10)',
  },
  ruleTop: {
    position: 'absolute',
    top: 142,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(100, 116, 139, 0.10)',
  },
  ruleBottom: {
    position: 'absolute',
    bottom: 172,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(100, 116, 139, 0.08)',
  },
});
