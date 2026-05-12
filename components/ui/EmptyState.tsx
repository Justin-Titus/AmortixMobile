import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Radius, Spacing } from '@/constants/theme';
import Typography from './Typography';

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Typography variant="base" weight="semiBold" color="navy" align="center" style={styles.title}>
        {title}
      </Typography>
      <Typography variant="body" color="slate" align="center" style={styles.description}>
        {description}
      </Typography>
      {action && (
        <TouchableOpacity
          style={styles.action}
          onPress={() => router.push(action.href as any)}
        >
          <Typography variant="body" weight="semiBold" color="white" style={styles.actionText}>
            {action.label}
          </Typography>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: Colors.frost,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  description: {
    lineHeight: 20,
    maxWidth: 280,
  },
  action: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.emerald,
    borderRadius: Radius.button,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  actionText: {
  },
});
