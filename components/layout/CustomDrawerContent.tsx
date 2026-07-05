import React from 'react';
import { View, StyleSheet, Image, Pressable, ScrollView } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useRouter, usePathname, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { InteractionManager } from 'react-native';
import { Spacing, Radius } from '@/constants/theme';
import Typography from '@/components/ui/Typography';
import {
  LayoutDashboard,
  BarChart3,
  Target,
  TrendingUp,
  CalendarDays,
  Activity,
  Sparkles,
  BookOpen,
  UserRound,
  Users,
} from 'lucide-react-native';

const mainNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/(drawer)/(tabs)/dashboard' },
  { icon: BarChart3, label: 'My Loans', href: '/(drawer)/(tabs)/loans' },
  { icon: Target, label: 'Strategy', href: '/(drawer)/(tabs)/strategy' },
  { icon: TrendingUp, label: 'Analysis', href: '/(drawer)/(tabs)/analysis' },
  { icon: CalendarDays, label: 'EMI Calendar', href: '/(drawer)/(tabs)/calendar' },
  { icon: Activity, label: 'Insights', href: '/(drawer)/(tabs)/insights' },
  { icon: Sparkles, label: 'AI Advisor', href: '/(drawer)/(tabs)/chat' },
  { icon: Users, label: 'Workspace', href: '/(drawer)/(tabs)/workspace' },
];

const toolsNavItems = [
  { icon: BookOpen, label: 'Glossary', href: '/(drawer)/(tabs)/glossary' },
  { icon: UserRound, label: 'Profile', href: '/(drawer)/(tabs)/profile' },
];

export default function CustomDrawerContent(props: any) {
  const router = useRouter();
  const pathname = usePathname();
  const navigation = useNavigation();

  const renderNavItem = (item: any) => {
    const itemBaseName = item.href.split('/').pop() as string;
    const currentBaseName = pathname.split('/').pop();
    const isActive = pathname === item.href || currentBaseName === itemBaseName;

    return (
      <Pressable
        key={item.href}
        style={[styles.navItem, isActive && styles.navItemActive]}
        onPress={() => {
          navigation.dispatch(DrawerActions.closeDrawer());
          InteractionManager.runAfterInteractions(() => {
            router.push(item.href);
          });
        }}
      >
        {isActive && (
          <View style={styles.indicatorContainer}>
            <View style={styles.activeIndicator} />
          </View>
        )}
        <View style={[styles.iconBox, isActive ? styles.iconBoxActive : null]}>
          <item.icon size={18} color={isActive ? '#4de0b3' : '#94a3b8'} />
        </View>
        <Typography
          variant="body"
          weight={isActive ? 'medium' : 'regular'}
          color={isActive ? '#e2e8f0' as any : '#94a3b8' as any}
          style={styles.navLabel}
        >
          {item.label}
        </Typography>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props} scrollEnabled={false} contentContainerStyle={styles.drawerContent}>
        {/* Header / Logo */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Image source={require('@/assets/Amortix.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <View>
            <Typography variant="lg" weight="medium" color="#f1f5f9" fontFamily="heading">
              Amortix
            </Typography>
            <Typography variant="xs" color="#94a3b8" style={styles.brandTagline}>
              Debt operations
            </Typography>
          </View>
        </View>

        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
          {/* Main Navigation */}
          <Typography variant="xs" weight="medium" color="#64748b" style={styles.sectionTitle}>
            MAIN
          </Typography>
          <View style={styles.navGroup}>
            {mainNavItems.map(renderNavItem)}
          </View>

          <View style={styles.divider} />

          {/* Tools Navigation */}
          <Typography variant="xs" weight="medium" color="#64748b" style={styles.sectionTitle}>
            TOOLS
          </Typography>
          <View style={styles.navGroup}>
            {toolsNavItems.map(renderNavItem)}
          </View>
        </ScrollView>
      </DrawerContentScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1b2f',
  },
  drawerContent: {
    flex: 1,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    gap: Spacing.md,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 32,
    height: 32,
    tintColor: '#00bc7d',
    transform: [{ scale: 1.4 }],
  },
  brandTagline: {
    letterSpacing: 0.4,
    marginTop: 2,
  },
  scrollArea: {
    flex: 1,
    paddingVertical: Spacing.xl,
  },
  sectionTitle: {
    letterSpacing: 0.4,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  navGroup: {
    paddingHorizontal: Spacing.sm,
    gap: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: Spacing.xl,
    marginHorizontal: Spacing.lg,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    minHeight: 44,
    position: 'relative',
    marginHorizontal: Spacing.xs,
  },
  navItemActive: {
    backgroundColor: '#1E3A5F',
  },
  indicatorContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  activeIndicator: {
    width: 3,
    height: 20,
    backgroundColor: '#10b981',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  iconBox: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  iconBoxActive: {
  },
  navLabel: {
    fontSize: 13,
  },
});
