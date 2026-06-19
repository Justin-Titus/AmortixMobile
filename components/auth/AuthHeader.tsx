
import { StyleSheet, View, Image } from 'react-native';
import { Colors, Spacing, Shadows } from '@/constants/theme';
import Typography from '@/components/ui/Typography';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <Image
          source={require('@/assets/Amortix.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <Typography variant="h2" weight="bold" color="navy" align="center" style={styles.title}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="md" color="slate" align="center" style={styles.subtitle}>
          {subtitle}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    width: '100%',
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.card,
    shadowOpacity: 0.05,
  },
  logo: {
    width: 52,
    height: 52,
  },
  title: {
    marginBottom: Spacing.xs,
    width: '100%',
  },
  subtitle: {
    lineHeight: 22,
  },
});
