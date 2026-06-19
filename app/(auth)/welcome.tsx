import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  FlatList,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius, Shadows, FontSizes } from '@/constants/theme';
import Typography from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { 
  TrendingDown, 
  Sparkles, 
  Bell, 
  ArrowRight, 
  Coins, 
  ShieldCheck, 
  ArrowUpRight 
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LandingBackdrop } from '@/components/landing/LandingBackdrop';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type OnboardingSlide = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  illustration: () => React.ReactNode;
};

export default function WelcomeScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);

  const slides: OnboardingSlide[] = [
    {
      id: 'debt_strategy',
      title: 'Master Your Debt Strategy',
      subtitle: 'Visualize interest leaks and discover optimal repayment paths with the Avalanche or Snowball methods.',
      icon: <TrendingDown size={24} color={Colors.emerald} />,
      illustration: () => (
        <View style={styles.illContainer}>
          {/* Main Card */}
          <View style={styles.cardHeader}>
            <View style={styles.badgeRow}>
              <View style={styles.activeBadge}>
                <Typography variant="xs" weight="bold" color="white">SAVINGS ACTIVE</Typography>
              </View>
              <Typography variant="caption" weight="bold" color="slate">Snowball Method</Typography>
            </View>
            <Typography variant="h3" weight="bold" color="navy" style={styles.cardHeaderTitle}>
              ₹3,40,000 Saved
            </Typography>
            <Typography variant="caption" color="textMuted">
              By adding ₹12,000 extra payment monthly
            </Typography>
          </View>

          {/* Graphical Representation */}
          <View style={styles.chartArea}>
            <View style={[styles.bar, { height: '80%', backgroundColor: 'rgba(17, 140, 118, 0.1)' }]}>
              <View style={[styles.barFilled, { height: '40%', backgroundColor: Colors.emerald }]} />
            </View>
            <View style={[styles.bar, { height: '60%', backgroundColor: 'rgba(17, 140, 118, 0.1)' }]}>
              <View style={[styles.barFilled, { height: '65%', backgroundColor: Colors.emerald }]} />
            </View>
            <View style={[styles.bar, { height: '90%', backgroundColor: 'rgba(17, 140, 118, 0.1)' }]}>
              <View style={[styles.barFilled, { height: '85%', backgroundColor: Colors.emeraldLight }]} />
            </View>
            <View style={[styles.bar, { height: '50%', backgroundColor: 'rgba(17, 140, 118, 0.1)' }]}>
              <View style={[styles.barFilled, { height: '100%', backgroundColor: Colors.emeraldLight }]} />
            </View>
          </View>
          
          <View style={styles.savingsPill}>
            <Coins size={14} color={Colors.emeraldDark} />
            <Typography variant="xs" weight="bold" color={Colors.emeraldDark}>
              Interest leakage reduced by 42%
            </Typography>
          </View>
        </View>
      ),
    },
    {
      id: 'ai_insights',
      title: 'Proactive AI Insights',
      subtitle: 'Get customized, automated tips to optimize interest savings and pay off debt faster.',
      icon: <Sparkles size={24} color={Colors.amber} />,
      illustration: () => (
        <View style={styles.illContainer}>
          <View style={styles.aiHeader}>
            <View style={styles.sparkleIconBox}>
              <Sparkles size={18} color={Colors.white} />
            </View>
            <View>
              <Typography variant="sm" weight="bold" color="white">Amortix AI Assistant</Typography>
              <Typography variant="xs" color="emeraldLight">Analysis complete • 1m ago</Typography>
            </View>
          </View>
          
          {/* Simulation Box */}
          <View style={styles.aiInsightCard}>
            <Typography variant="xs" weight="bold" color="textMuted" style={{ marginBottom: 4 }}>
              RECOMMENDED SCENARIO
            </Typography>
            <Typography variant="md" weight="bold" color="navy" style={{ marginBottom: 8 }}>
              Accelerated Prepayments
            </Typography>
            
            <View style={styles.insightStatRow}>
              <View>
                <Typography variant="caption" color="textMuted">Interest Saved</Typography>
                <Typography variant="md" weight="bold" color="emerald">₹10,27,200</Typography>
              </View>
              <View style={styles.statDivider} />
              <View>
                <Typography variant="caption" color="textMuted">Time Saved</Typography>
                <Typography variant="md" weight="bold" color="navy">2.4 Years</Typography>
              </View>
            </View>
            
            <View style={styles.insightFooter}>
              <Typography variant="xs" color="slate" style={{ flex: 1 }}>
                Apply this strategy to your Home Loan to save interest.
              </Typography>
              <ArrowUpRight size={16} color={Colors.emerald} />
            </View>
          </View>
        </View>
      ),
    },
    {
      id: 'reminders_sync',
      title: 'Smart Reminders & Sync',
      subtitle: 'Keep your data synced securely across all your devices, and get smart notifications before your EMI dates.',
      icon: <Bell size={24} color={Colors.emerald} />,
      illustration: () => (
        <View style={styles.illContainer}>
          {/* Device Sync & Notification Mock */}
          <View style={styles.notificationMock}>
            <View style={styles.notifHeader}>
              <View style={styles.notifBadge}>
                <Bell size={12} color={Colors.white} />
              </View>
              <Typography variant="xs" weight="bold" color="navy" style={{ flex: 1 }}>
                EMI REMINDER
              </Typography>
              <Typography variant="xs" color="textMuted">Just now</Typography>
            </View>
            
            <Typography variant="sm" weight="bold" color="navy" style={{ marginVertical: 4 }}>
              Upcoming payment due in 2 days
            </Typography>
            <Typography variant="xs" color="slate">
              Car Loan payment of ₹27,200 is scheduled. Open Amortix to log payment.
            </Typography>
          </View>

          {/* Sync Shield */}
          <View style={styles.syncStatus}>
            <ShieldCheck size={18} color={Colors.emerald} />
            <Typography variant="xs" weight="semiBold" color="slate">
              Military-grade end-to-end sync enabled
            </Typography>
          </View>
        </View>
      ),
    },
  ];

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / SCREEN_WIDTH);
    setActiveIndex(index);
  }, []);

  const completeOnboarding = async (targetRoute: '/(auth)/register' | '/(auth)/login') => {
    try {
      await AsyncStorage.setItem('amortix_has_seen_welcome', 'true');
    } catch (e) {
      console.error('Failed to save welcome state', e);
    }
    router.replace(targetRoute);
  };

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    } else {
      completeOnboarding('/(auth)/register');
    }
  };

  const handleSkip = () => {
    completeOnboarding('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Graphic Backdrop */}
      <LandingBackdrop />

      {/* Top Bar */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Image 
            source={require('../../assets/Amortix.png')} 
            style={{ width: 32, height: 32, borderRadius: 8 }} 
            resizeMode="contain" 
          />
          <Typography variant="h3" weight="bold" color="navy" fontFamily="heading">
            Amortix
          </Typography>
        </View>
        
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={styles.skipButton}>
          <Typography variant="sm" weight="semiBold" color="emerald">Skip</Typography>
        </TouchableOpacity>
      </View>

      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        renderItem={({ item }) => (
          <View style={styles.slideContainer}>
            {/* Visual Illustration */}
            <View style={styles.illustrationWrapper}>
              {item.illustration()}
            </View>
            
            {/* Information Texts */}
            <View style={styles.textWrapper}>
              <View style={styles.iconContainer}>
                {item.icon}
              </View>
              <Typography variant="h2" weight="bold" color="navy" align="center" style={styles.title}>
                {item.title}
              </Typography>
              <Typography variant="base" color="slate" align="center" style={styles.subtitle}>
                {item.subtitle}
              </Typography>
            </View>
          </View>
        )}
      />

      {/* Pagination & Actions Section */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.paginationRow}>
          {slides.map((_, index) => {
            const isActive = index === activeIndex;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  isActive && styles.activeDot,
                ]}
              />
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title={activeIndex === slides.length - 1 ? 'Get Started' : 'Continue'}
            onPress={handleNext}
            variant="primary"
            icon={activeIndex < slides.length - 1 ? <ArrowRight size={18} color={Colors.white} /> : undefined}
          />
          
          <View style={styles.signInRow}>
            <Typography variant="sm" color="slate">Already have an account? </Typography>
            <TouchableOpacity onPress={() => completeOnboarding('/(auth)/login')} activeOpacity={0.7}>
              <Typography variant="sm" weight="bold" color="emerald">Sign In</Typography>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  skipButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  illustrationWrapper: {
    flex: 1.1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  illContainer: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Shadows.card,
    shadowOpacity: 0.04,
  },
  cardHeader: {
    marginBottom: Spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  activeBadge: {
    backgroundColor: Colors.emerald,
    borderRadius: Radius.badge,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cardHeaderTitle: {
    fontSize: FontSizes.h2,
    marginVertical: 2,
  },
  chartArea: {
    height: 100,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    marginVertical: Spacing.md,
    gap: 16,
  },
  bar: {
    flex: 1,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFilled: {
    width: '100%',
    borderRadius: Radius.sm,
  },
  savingsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.emeraldBg,
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
    marginTop: Spacing.sm,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navy,
    borderTopLeftRadius: Radius.card - 2,
    borderTopRightRadius: Radius.card - 2,
    marginHorizontal: -Spacing.lg,
    marginTop: -Spacing.lg,
    padding: Spacing.md,
    gap: 12,
    marginBottom: Spacing.md,
  },
  sparkleIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiInsightCard: {
    paddingVertical: Spacing.sm,
  },
  insightStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.frost,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginVertical: Spacing.md,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.borderLight,
  },
  insightFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.md,
    marginTop: Spacing.xs,
    gap: 12,
  },
  notificationMock: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    ...Shadows.metric,
    shadowOpacity: 0.05,
    marginBottom: Spacing.md,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.xs,
  },
  notifBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.emerald,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  textWrapper: {
    flex: 0.9,
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.emeraldBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  subtitle: {
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  footer: {
    width: '100%',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.borderMid,
  },
  activeDot: {
    width: 22,
    backgroundColor: Colors.emerald,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
});
