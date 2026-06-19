import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Image, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors, Spacing, Radius, FontSizes } from '@/constants/theme';
import Typography from './Typography';
import { LandingBackdrop } from '@/components/landing/LandingBackdrop';

export function AppLoading() {
  // Individual element animation values — container itself is always opacity:1
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(18)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(12)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const spinnerOpacity = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Small delay so the background renders first, then animate elements in
    const timer = setTimeout(() => {
      Animated.sequence([
        // Step 1: Logo scales up with spring + fades in
        Animated.parallel([
          Animated.spring(logoScale, {
            toValue: 1,
            tension: 55,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 380,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Step 2: Title slides up
        Animated.parallel([
          Animated.timing(titleTranslateY, {
            toValue: 0,
            duration: 320,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 320,
            useNativeDriver: true,
          }),
        ]),
        // Step 3: Subtitle + spinner + footer fade in
        Animated.parallel([
          Animated.timing(subtitleTranslateY, {
            toValue: 0,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(subtitleOpacity, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(spinnerOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(footerOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }, 80); // tiny delay so LandingBackdrop renders first

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <LandingBackdrop />

      <View style={styles.content}>
        {/* Animated Logo */}
        <Animated.View
          style={[
            styles.logoOuter,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoInner}>
            <Image
              source={require('@/assets/Amortix.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Animated Title */}
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          }}
        >
          <Typography
            variant="hero"
            weight="bold"
            color="navy"
            fontFamily="heading"
            style={styles.title}
          >
            Amortix
          </Typography>
        </Animated.View>

        {/* Animated Subtitle */}
        <Animated.View
          style={{
            opacity: subtitleOpacity,
            transform: [{ translateY: subtitleTranslateY }],
          }}
        >
          <Typography
            variant="md"
            color="slateDark"
            style={styles.subtitle}
          >
            Smart Debt Strategy
          </Typography>
        </Animated.View>

        {/* Animated Spinner */}
        <Animated.View style={[styles.spinnerContainer, { opacity: spinnerOpacity }]}>
          <View style={styles.pulseRing}>
            <View style={styles.pulseDot} />
          </View>
        </Animated.View>
      </View>

      {/* Animated Footer */}
      <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
        <Typography variant="xs" color="textMuted" style={{ letterSpacing: 1 }}>
          SECURE SYNC ACTIVE
        </Typography>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoOuter: {
    width: 90,
    height: 90,
    borderRadius: Radius.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  logoInner: {
    width: 68,
    height: 68,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#09111f',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  logoImage: {
    width: 44,
    height: 44,
  },
  title: {
    fontSize: FontSizes.hero + 4,
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    opacity: 0.85,
    marginBottom: Spacing.xxl,
    textAlign: 'center',
  },
  spinnerContainer: {
    marginTop: Spacing.lg,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(0, 188, 125, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00bc7d',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
});
