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
import { LandingBackdrop } from '@/components/landing/LandingBackdrop';

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
        <LandingBackdrop />

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
