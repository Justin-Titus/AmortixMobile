import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import Typography from '@/components/ui/Typography';
import { Colors, Spacing } from '@/constants/theme';

type OfflineBannerProps = {
  lastSync?: string | null;
};

export default function OfflineBanner({ lastSync }: OfflineBannerProps) {
  const formattedTime = (() => {
    if (!lastSync) return 'never';
    const syncDate = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - syncDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) {
      return `yesterday at ${syncDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return syncDate.toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  })();

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
