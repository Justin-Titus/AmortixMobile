import React, { useState, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, Shadows } from '@/constants/theme';
import { Mail, ArrowRight } from 'lucide-react-native';
import { AuthContainer } from '@/components/auth/AuthContainer';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';
import Typography from '@/components/ui/Typography';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mailIcon = useMemo(() => <Mail size={18} color={Colors.slateLight} />, []);

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const result = await resetPassword(email.trim());
    if (result.error) {
      setError(result.error);
    } else {
      Alert.alert(
        'Check your email',
        'A password reset link has been sent.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    }
    setIsSubmitting(false);
  };

  return (
    <AuthContainer>
      <AuthHeader 
        title="Reset password" 
        subtitle="Enter your email to receive a password reset link." 
      />

      <View style={styles.card}>
        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Typography style={styles.errorText}>{error}</Typography>
          </View>
        )}

        <AuthInput
          label="Email address"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          icon={mailIcon}
        />

        <AuthButton
          title={isSubmitting ? 'Sending...' : 'Send reset link'}
          onPress={handleReset}
          loading={isSubmitting}
          icon={!isSubmitting ? <ArrowRight size={18} color={Colors.white} /> : undefined}
          containerStyle={styles.submitContainer}
        />

        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Typography style={styles.backButtonText}>Back to sign in</Typography>
        </TouchableOpacity>
      </View>
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    ...Shadows.card,
    shadowOpacity: 0.06,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  errorBox: {
    backgroundColor: Colors.redBg,
    borderRadius: 10,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(209,77,91,0.1)',
  },
  errorText: {
    fontSize: FontSizes.sm,
    color: Colors.red,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
  submitContainer: {
    marginTop: Spacing.md,
  },
  backButton: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingVertical: Spacing.xs,
  },
  backButtonText: {
    fontSize: FontSizes.md,
    color: Colors.emerald,
    fontWeight: '600',
    lineHeight: 20,
  },
});

