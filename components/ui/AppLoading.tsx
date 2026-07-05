import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Image, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors, Spacing, Radius, FontSizes } from '@/constants/theme';
import Typography from './Typography';
import { LandingBackdrop } from '@/components/landing/LandingBackdrop';
import * as SplashScreen from 'expo-splash-screen';

export function AppLoading() {
  // Anim values for continuous handshake transition
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1.0)).current;
  const logoOpacity = useRef(new Animated.Value(1.0)).current; // Starts fully visible to match native splash
  const titleTranslateY = useRef(new Animated.Value(24)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(16)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const spinnerOpacity = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Instantly hide native splash now that React Native is rendering the matching frame
    SplashScreen.hideAsync().catch(err => {
      console.warn('Failed to hide splash screen:', err);
    });

    // 2. Play continuous animations
    Animated.sequence([
      // Step A: Fade in premium backdrop grid
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      // Step B: Bring in Typography & controls
      Animated.parallel([
        // Logo breath animation
        Animated.sequence([
          Animated.timing(logoScale, {
            toValue: 1.06,
            duration: 350,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(logoScale, {
            toValue: 1.0,
            tension: 40,
            friction: 6,
            useNativeDriver: true,
          }),
        ]),
        // Title slides up
        Animated.parallel([
          Animated.timing(titleTranslateY, {
            toValue: 0,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        // Subtitle + Spinner + Footer fade in
        Animated.parallel([
          Animated.timing(subtitleTranslateY, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(subtitleOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(spinnerOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(footerOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Background grid transitions in smoothly over solid white */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: backdropOpacity }]}>
        <LandingBackdrop />
      </Animated.View>

      <View style={styles.content}>
        {/* Animated Logo (starts centered and sized matching the native splash) */}
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
