import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, Shadows } from '@/constants/theme';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { AuthContainer } from '@/components/auth/AuthContainer';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';
import { Chrome } from 'lucide-react-native'; // Using Chrome icon for Google as a placeholder for premium feel
import Typography from '@/components/ui/Typography';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const togglePassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const mailIcon = useMemo(() => <Mail size={18} color={Colors.slateLight} />, []);
  const lockIcon = useMemo(() => <Lock size={18} color={Colors.slateLight} />, []);
  const eyeIcon = useMemo(() => <Eye size={18} color={Colors.slate} />, []);
  const eyeOffIcon = useMemo(() => <EyeOff size={18} color={Colors.slate} />, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const result = await signIn(email.trim(), password);
    if (result.error) {
      setError(result.error);
    }
    setIsSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError(null);
    const result = await signInWithGoogle();
    if (result.error) {
      setError(result.error);
    }
    setIsSubmitting(false);
  };

  return (
    <AuthContainer>
      <AuthHeader 
        title="Welcome back" 
        subtitle="Sign in to your Amortix workspace to manage your debt strategy." 
      />

      <View style={styles.card}>
        {/* Social Auth */}
        <TouchableOpacity style={styles.googleBtn} activeOpacity={0.8} onPress={handleGoogleLogin}>
          <Chrome size={20} color={Colors.navy} style={styles.googleIcon} />
          <Typography weight="bold" color="navy" style={styles.googleText}>Continue with Google</Typography>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Typography variant="xs" weight="bold" color="slateLight" style={styles.dividerText}>OR</Typography>
          <View style={styles.dividerLine} />
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Typography variant="sm" weight="medium" color="red" align="center" style={styles.errorText}>
              {error}
            </Typography>
          </View>
        )}

        {/* Email */}
        <AuthInput
          label="Email address"
          placeholder="johndoe@gmail.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          icon={mailIcon}
        />

        {/* Password */}
        <AuthInput
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete="password"
          icon={lockIcon}
          rightIcon={showPassword ? eyeOffIcon : eyeIcon}
          onRightIconPress={togglePassword}
          rightLink={{
            text: 'Forgot password?',
            onPress: () => router.push('/(auth)/forgot-password'),
          }}
        />

        {/* Submit */}
        <AuthButton
          title={isSubmitting ? 'Signing in...' : 'Sign In'}
          onPress={handleLogin}
          loading={isSubmitting}
          icon={!isSubmitting ? <ArrowRight size={18} color={Colors.white} /> : undefined}
          containerStyle={styles.submitContainer}
        />

        {/* Sign up link */}
        <View style={styles.footer}>
          <Typography color="slate" style={styles.footerText}>Don't have an account? </Typography>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Typography weight="semiBold" color="emerald" style={styles.footerLink}>Sign up</Typography>
          </TouchableOpacity>
        </View>
      </View>
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: Spacing.lg, // Reduced for horizontal room
    paddingVertical: Spacing.xl,
    ...Shadows.card,
    shadowOpacity: 0.06,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderMid,
    backgroundColor: Colors.white,
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
  },
  googleIcon: {
    opacity: 0.9,
  },
  googleText: {
    flexShrink: 1,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    letterSpacing: 1,
    lineHeight: 14, // Added lineHeight
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
    lineHeight: 18, // Added lineHeight
  },
  submitContainer: {
    marginTop: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    lineHeight: 20, // Added lineHeight
  },
  footerLink: {
    lineHeight: 20, // Added lineHeight
  },
});

