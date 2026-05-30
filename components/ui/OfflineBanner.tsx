import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import Typography from '@/components/ui/Typography';
import { Colors, Spacing } from '@/constants/theme';

type OfflineBannerProps = {
  lastSync?: string | null;
};

export default function OfflineBanner({ lastSync }: OfflineBannerProps) {
  const formattedTime = lastSync 
    ? new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'never';

  return (
    <View style={[styles.container, { backgroundColor: Colors.warningBg, borderColor: Colors.amber }]}>
      <WifiOff size={14} color="#f59f3a" />
      <Typography variant="xs" weight="medium" color="#f59f3a" style={styles.text}>
        Offline — viewing cached data (synced {formattedTime})
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.xs,
  },
  text: {
    marginLeft: 4,
  },
});
