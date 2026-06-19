/* Hallmark · genre: editorial-modern · macrostructure: Launch Splash / Story Board / Launch Gate · design-system: design.md · anchor hue: emerald */

import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import { Colors, Spacing } from '@/constants/theme';

import { LandingBackdrop } from './LandingBackdrop';

type LandingAction = {
  title: string;
  onPress: () => void;
  icon?: ReactNode;
};

type LandingScreenProps = {
  step: number;
  totalSteps?: number;
  badge: string;
  badgeVariant?: 'green' | 'amber' | 'red' | 'slate';
  title: string;
  description: string;
  topActions?: ReactNode;
  children: ReactNode;
  primaryAction: LandingAction;
  secondaryAction?: LandingAction;
  footerNote?: string;
};

export function LandingScreen({
  step,
  totalSteps = 3,
  badge,
  badgeVariant = 'green',
  title,
  description,
  topActions,
  children,
  primaryAction,
  secondaryAction,
  footerNote,
}: LandingScreenProps) {
  const { width } = useWindowDimensions();
  const compact = width < 390;

  return (
    <SafeAreaView style={styles.safe}>
      <LandingBackdrop />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.topRail, compact && styles.topRailCompact]}>
          <View style={styles.brandPill}>
            <View style={styles.brandDot} />
            <Typography variant="caption" weight="bold" color="navy">
              Amortix
            </Typography>
            <Typography variant="caption" color="textMuted" style={styles.brandMeta}>
              mobile
            </Typography>
          </View>

          {topActions ? <View style={styles.topActions}>{topActions}</View> : null}
        </View>

        <View style={styles.header}>
          <View style={[styles.kickerRow, compact && styles.kickerRowCompact]}>
            <Badge text={badge} variant={badgeVariant} />
            <View style={styles.progressPill}>
              <View style={styles.progressBars}>
                {Array.from({ length: totalSteps }, (_, index) => {
                  const active = index + 1 <= step;
                  return <View key={index} style={[styles.progressBar, active && styles.progressBarActive]} />;
                })}
              </View>
              <Typography variant="caption" weight="bold" color="navy" fontFamily="mono">
                {String(step).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}
              </Typography>
            </View>
          </View>

          <Typography variant="h1" weight="bold" color="navy" style={styles.title}>
            {title}
          </Typography>

          <Typography variant="md" color="slateDark" style={styles.description}>
            {description}
          </Typography>
        </View>

        <View style={styles.body}>{children}</View>

        <View style={styles.footer}>
          <Button
            variant="primary"
            title={primaryAction.title}
            onPress={primaryAction.onPress}
            icon={primaryAction.icon}
          />

          {secondaryAction ? (
            <View style={styles.secondaryWrap}>
              <Button
                variant="ghost"
                size="sm"
                title={secondaryAction.title}
                onPress={secondaryAction.onPress}
                icon={secondaryAction.icon}
              />
            </View>
          ) : null}

          {footerNote ? (
            <Typography variant="caption" color="textMuted" align="center" style={styles.footerNote}>
              {footerNote}
            </Typography>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.frost,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  topRail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  topRailCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.86)',
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.emerald,
  },
  brandMeta: {
    marginLeft: 2,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  header: {
    maxWidth: 560,
    marginBottom: Spacing.lg,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: Spacing.md,
  },
  kickerRowCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  progressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.86)',
  },
  progressBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressBar: {
    width: 14,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(13, 27, 47, 0.12)',
  },
  progressBarActive: {
    backgroundColor: Colors.emerald,
  },
  title: {
    marginBottom: Spacing.sm,
    lineHeight: 40,
  },
  description: {
    lineHeight: 24,
    maxWidth: 520,
  },
  body: {
    flex: 1,
    gap: Spacing.lg,
  },
  footer: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  secondaryWrap: {
    alignItems: 'center',
  },
  footerNote: {
    marginTop: 4,
  },
});
