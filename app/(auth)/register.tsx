import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, Shadows } from '@/constants/theme';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Check } from 'lucide-react-native';
import { AuthContainer } from '@/components/auth/AuthContainer';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';
import Typography from '@/components/ui/Typography';
import { sha1 } from '@/lib/utils/sha1';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const togglePassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const userIcon = useMemo(() => <User size={18} color={Colors.slateLight} />, []);
  const mailIcon = useMemo(() => <Mail size={18} color={Colors.slateLight} />, []);
  const lockIcon = useMemo(() => <Lock size={18} color={Colors.slateLight} />, []);
  const eyeIcon = useMemo(() => <Eye size={18} color={Colors.slate} />, []);
  const eyeOffIcon = useMemo(() => <EyeOff size={18} color={Colors.slate} />, []);

  const handleRegister = async () => {
    setError(null);
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Need at least one uppercase letter.');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('Need at least one number.');
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const hash = sha1(password);
      const prefix = hash.slice(0, 5);
      const suffix = hash.slice(5);

      const checkResponse = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      if (checkResponse.ok) {
        const data = await checkResponse.text();
        const hashes = data.split('\n');
        const leaked = hashes.some((h) => h.trim().split(':')[0] === suffix);
        
        if (leaked) {
          setError('This password has been compromised in a data breach. Please select a different password.');
          setIsSubmitting(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to verify password breach status, proceeding...', e);
    }

    const result = await signUp(name.trim(), email.trim(), password);
    if (result.error) {
      setError(result.error);
    } else {
      Alert.alert(
        'Account Created',
        'Check your email to verify before signing in.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    }
    setIsSubmitting(false);
  };

  const passwordValidations = useMemo(() => [
    { label: '8+ characters', satisfied: password.length >= 8 },
    { label: 'Uppercase', satisfied: /[A-Z]/.test(password) },
    { label: 'Number', satisfied: /[0-9]/.test(password) },
  ], [password]);

  return (
    <AuthContainer>
      <AuthHeader 
        title="Create your workspace" 
        subtitle="Join Amortix to unlock smart loan tracking and AI debt strategy." 
      />

      <View style={styles.card}>
        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Typography style={styles.errorText}>{error}</Typography>
          </View>
        )}

        <AuthInput
          label="Full name"
          placeholder="Your full name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          icon={userIcon}
        />

        <AuthInput
          label="Email address"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          icon={mailIcon}
        />

        <View style={styles.passwordContainer}>
          <AuthInput
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            icon={lockIcon}
            rightIcon={showPassword ? eyeOffIcon : eyeIcon}
            onRightIconPress={togglePassword}
            containerStyle={styles.noMargin}
          />
          
          <View style={styles.validationGrid}>
            {passwordValidations.map((v, i) => (
              <View key={i} style={styles.validationItem}>
                <Check 
                  size={12} 
                  color={v.satisfied ? Colors.emerald : Colors.slateLight} 
                  strokeWidth={3} 
                />
                <Typography style={[
                  styles.validationLabel, 
                  v.satisfied && styles.validationLabelSatisfied
                ]}>
                  {v.label}
                </Typography>
              </View>
            ))}
          </View>
        </View>

        <AuthInput
          label="Confirm password"
          placeholder="••••••••"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
          icon={lockIcon}
        />

        <AuthButton
          title={isSubmitting ? 'Creating workspace...' : 'Create workspace'}
          onPress={handleRegister}
          loading={isSubmitting}
          icon={!isSubmitting ? <ArrowRight size={18} color={Colors.white} /> : undefined}
          containerStyle={styles.submitContainer}
        />

        <View style={styles.termsFooter}>
          <Typography style={styles.termsText}>
            By signing up, you agree to our{' '}
          </Typography>
          <TouchableOpacity onPress={() => router.push('/terms')}>
            <Typography style={styles.termsLink}>Terms of Service</Typography>
          </TouchableOpacity>
          <Typography style={styles.termsText}> and </Typography>
          <TouchableOpacity onPress={() => router.push('/privacy')}>
            <Typography style={styles.termsLink}>Privacy Policy</Typography>
          </TouchableOpacity>
          <Typography style={styles.termsText}>.</Typography>
        </View>

        <View style={styles.footer}>
          <Typography style={styles.footerText}>Already have an account? </Typography>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Typography style={styles.footerLink}>Sign in</Typography>
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
  passwordContainer: {
    marginBottom: Spacing.lg,
  },
  noMargin: {
    marginBottom: 0,
  },
  validationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
    paddingHorizontal: 2,
  },
  validationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: '45%', // Two items per row mostly
  },
  validationLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.slate,
  },
  validationLabelSatisfied: {
    color: Colors.navy,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    fontSize: FontSizes.md,
    color: Colors.slate,
    lineHeight: 20,
  },
  footerLink: {
    fontSize: FontSizes.md,
    color: Colors.emerald,
    fontWeight: '600',
    lineHeight: 20,
  },
  termsFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  termsText: {
    fontSize: FontSizes.sm,
    color: Colors.slate,
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    fontSize: FontSizes.sm,
    color: Colors.emerald,
    textAlign: 'center',
    lineHeight: 20,
  },
});

