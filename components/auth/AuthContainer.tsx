import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/theme';

interface AuthContainerProps {
  children: React.ReactNode;
  scrollEnabled?: boolean;
}

export function AuthContainer({ children, scrollEnabled = true }: AuthContainerProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.blurContainer}>
          <View style={styles.blurEmerald} />
          <View style={styles.blurAmber} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollEnabled}
        >
          <View style={styles.innerContent}>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blurEmerald: {
    position: 'absolute',
    top: -40,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(17,140,118,0.05)',
  },
  blurAmber: {
    position: 'absolute',
    bottom: 100,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(245,159,58,0.05)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg, // Reduced from xl
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
  innerContent: {
    flex: 1,
    justifyContent: 'center',
    alignSelf: 'stretch', // Changed from center
    width: '100%',
  },
});
