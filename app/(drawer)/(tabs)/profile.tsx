import React, { useEffect, useState, useCallback } from 'react';
import {
  View, ScrollView, TouchableOpacity, RefreshControl,
  Alert, StyleSheet, Image, Linking, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getProfile, getUserData, updateUserSettings, type FinancialProfile } from '@/services/profile';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { formatCurrency } from '@/lib/calculations';
import { Mail, Briefcase, Shield, PiggyBank, LogOut, ChevronRight, LifeBuoy, FileText, Lock, HelpCircle, Coins, TrendingUp, TrendingDown } from 'lucide-react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { useOfflineData } from '@/hooks/useOfflineData';
import { saveOfflineProfile, getOfflineProfile, saveOfflineUserData, getOfflineUserData } from '@/lib/offline/cache';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const fetcher = useCallback(async () => {
    const [p, u] = await Promise.all([getProfile(), getUserData()]);
    return { profile: p, userData: u };
  }, []);

  const cacher = useCallback(async (data: { profile: FinancialProfile | null, userData: any }) => {
    if (data.profile) await saveOfflineProfile(data.profile);
    if (data.userData) await saveOfflineUserData(data.userData);
  }, []);

  const reader = useCallback(async () => {
    const p = await getOfflineProfile();
    const u = await getOfflineUserData();
    return { profile: p, userData: u };
  }, []);

  const { data, loading, refreshing, refresh, isOffline } = useOfflineData({ fetcher, cacher, reader });

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [updatingSettings, setUpdatingSettings] = useState(false);

  useEffect(() => {
    if (data?.userData) {
      setEmailNotifications(data.userData.emailNotifications ?? true);
      setPushNotifications(data.userData.pushNotifications ?? true);
    }
  }, [data]);

  const handleToggle = async (type: 'email' | 'push', value: boolean) => {
    if (isOffline) {
      Alert.alert('Offline', 'Cannot update preferences while offline.');
      return;
    }
    
    // Optimistic update
    if (type === 'email') setEmailNotifications(value);
    else setPushNotifications(value);

    setUpdatingSettings(true);
    const result = await updateUserSettings({
      [type === 'email' ? 'emailNotifications' : 'pushNotifications']: value,
    });

    if (result.error) {
      Alert.alert('Error', result.error);
      // Revert state
      if (type === 'email') setEmailNotifications(!value);
      else setPushNotifications(!value);
    } else {
      // Update cache immediately to prevent momentary revert when refresh() loads from cache
      if (data?.userData) {
        const updatedUserData = {
          ...data.userData,
          [type === 'email' ? 'emailNotifications' : 'pushNotifications']: value,
        };
        await saveOfflineUserData(updatedUserData);
      }
      refresh(); // Refresh offline cache with new data from server
    }
    setUpdatingSettings(false);
  };

  const profile = data?.profile ?? null;
  const userData = data?.userData ?? null;

  const onRefresh = () => refresh();

  if (loading) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Card style={s.profileCard}>
          <Skeleton width={72} height={72} borderRadius={24} style={{ marginBottom: Spacing.base }} />
          <Skeleton width={150} height={28} style={{ marginBottom: 4 }} />
          <Skeleton width={200} height={16} />
        </Card>

        <Card>
          <View style={s.sectionHeader}>
            <Skeleton width={120} height={20} />
            <Skeleton width={80} height={16} />
          </View>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <View key={i} style={s.profileRow}>
              <View style={s.profileRowLeft}>
                <Skeleton width={16} height={16} />
                <Skeleton width={100} height={16} />
              </View>
              <Skeleton width={80} height={16} />
            </View>
          ))}
        </Card>

        <Card>
          <Skeleton width={150} height={24} style={{ marginBottom: Spacing.md }} />
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={s.linkRow}>
              <View style={s.linkRowLeft}>
                <Skeleton width={18} height={18} />
                <Skeleton width={120} height={18} />
              </View>
              <Skeleton width={16} height={16} />
            </View>
          ))}
        </Card>
      </ScrollView>
    );
  }

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const displayName = userData?.name ?? user?.user_metadata?.full_name ?? 'User';
  const displayEmail = user?.email ?? '';

  return (
    <ScrollView 
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.emerald} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile header */}
      <Card style={s.profileCard}>
        <View style={s.avatarWrap}>
          <View style={s.avatar}>
            <Image source={require('@/assets/Amortix.png')} style={s.avatarImg} resizeMode="contain" />
          </View>
        </View>
        <Typography variant="h3" weight="bold" color="navy" fontFamily="heading" style={s.name}>
          {displayName}
        </Typography>
        <Typography variant="md" color="slate" style={s.email}>
          {displayEmail}
        </Typography>
      </Card>

      {/* Financial Profile */}
      <Card>
        <View style={s.sectionHeader}>
          <Typography variant="md" weight="bold" color="navy" fontFamily="heading">
            Financial profile
          </Typography>
          <TouchableOpacity onPress={() => !isOffline && router.push('/(drawer)/(tabs)/edit-profile')} disabled={isOffline}>
            <Typography variant="caption" weight="bold" color={isOffline ? 'slateLight' : 'emerald'}>Edit profile</Typography>
          </TouchableOpacity>
        </View>
        {profile ? (
          <>
            {[
              { icon: <Briefcase size={16} color={Colors.slate} />, label: 'Employment', value: profile.employmentType },
              { icon: <Coins size={16} color={Colors.slate} />, label: 'Default currency', value: profile.currency || 'INR' },
              { icon: <TrendingUp size={16} color={Colors.slate} />, label: 'Monthly income', value: formatCurrency(profile.monthlyIncome, profile.currency) },
              { icon: <TrendingDown size={16} color={Colors.slate} />, label: 'Monthly expenses', value: formatCurrency(profile.monthlyExpenses, profile.currency) },
              { icon: <Shield size={16} color={Colors.slate} />, label: 'Credit score', value: profile.creditScoreRange },
              { icon: <PiggyBank size={16} color={Colors.slate} />, label: 'Emergency fund', value: profile.hasEmergencyFund ? `${profile.emergencyFundMonths} months` : 'Not set up' },
            ].map(item => (
              <View key={item.label} style={s.profileRow}>
                <View style={s.profileRowLeft}>
                  {item.icon}
                  <Typography variant="body" color="slate">{item.label}</Typography>
                </View>
                <Typography variant="body" weight="medium" color="navy">{item.value}</Typography>
              </View>
            ))}
          </>
        ) : (
          <View style={s.noProfile}>
            <Typography variant="md" weight="medium" color="navy">No financial profile set up yet.</Typography>
            <TouchableOpacity onPress={() => !isOffline && router.push('/(drawer)/(tabs)/edit-profile')} disabled={isOffline}>
              <Typography variant="caption" weight="bold" color={isOffline ? 'slateLight' : 'emerald'} style={s.setupLink}>
                Set up your profile →
              </Typography>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* Notification preferences */}
      <Card>
        <Typography variant="md" weight="bold" color="navy" fontFamily="heading" style={s.sectionTitle}>
          Notification preferences
        </Typography>
        
        <View style={s.profileRow}>
          <View style={{ flex: 1, marginRight: Spacing.sm }}>
            <Typography variant="body" weight="medium" color="navy">Email Notifications</Typography>
            <Typography variant="caption" color="slate">Receive EMI reminders via email</Typography>
          </View>
          <Switch
            value={emailNotifications}
            onValueChange={(val) => handleToggle('email', val)}
            disabled={updatingSettings || isOffline}
            trackColor={{ false: '#cbd5e1', true: Colors.emerald }}
          />
        </View>

        <View style={[s.profileRow, { borderBottomWidth: 0 }]}>
          <View style={{ flex: 1, marginRight: Spacing.sm }}>
            <Typography variant="body" weight="medium" color="navy">Push Notifications</Typography>
            <Typography variant="caption" color="slate">Receive push alerts on this device</Typography>
          </View>
          <Switch
            value={pushNotifications}
            onValueChange={(val) => handleToggle('push', val)}
            disabled={updatingSettings || isOffline}
            trackColor={{ false: '#cbd5e1', true: Colors.emerald }}
          />
        </View>
      </Card>

      {/* Settings & Support */}
      <Card>
        <Typography variant="md" weight="bold" color="navy" fontFamily="heading" style={s.sectionTitle}>
          Settings & Support
        </Typography>
        
        <TouchableOpacity 
          style={s.linkRow}
          onPress={() => Linking.openURL('mailto:amortix.admin@gmail.com')}
        >
          <View style={s.linkRowLeft}>
            <LifeBuoy size={18} color={Colors.emerald} />
            <Typography variant="md" weight="medium" color="navy">Contact support</Typography>
          </View>
          <ChevronRight size={16} color={Colors.slate} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={s.linkRow}
          onPress={() => router.push('/(drawer)/(tabs)/help')}
        >
          <View style={s.linkRowLeft}>
            <HelpCircle size={18} color={Colors.emerald} />
            <Typography variant="md" weight="medium" color="navy">Help center</Typography>
          </View>
          <ChevronRight size={16} color={Colors.slate} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={s.linkRow}
          onPress={() => router.push('/privacy')}
        >
          <View style={s.linkRowLeft}>
            <Lock size={18} color={Colors.emerald} />
            <Typography variant="md" weight="medium" color="navy">Privacy policy</Typography>
          </View>
          <ChevronRight size={16} color={Colors.slate} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[s.linkRow, { borderBottomWidth: 0 }]}
          onPress={() => router.push('/terms')}
        >
          <View style={s.linkRowLeft}>
            <FileText size={18} color={Colors.emerald} />
            <Typography variant="md" weight="medium" color="navy">Terms of service</Typography>
          </View>
          <ChevronRight size={16} color={Colors.slate} />
        </TouchableOpacity>
      </Card>

      {/* Sign Out */}
      <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
        <LogOut size={16} color={Colors.red} />
        <Typography variant="md" weight="bold" color="red">Sign out</Typography>
      </TouchableOpacity>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, gap: Spacing.base, paddingTop: Spacing.md },
  profileCard: { alignItems: 'center', paddingVertical: Spacing.xxl },
  avatarWrap: { marginBottom: Spacing.base },
  avatar: {
    width: 72, height: 72, borderRadius: 24, backgroundColor: Colors.frost,
    borderWidth: 2, borderColor: Colors.emerald, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: 48, height: 48 },
  name: { },
  email: { marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.base },
  setupLink: { marginTop: 8 },
  profileRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  profileRowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  noProfile: { paddingVertical: Spacing.lg, alignItems: 'center' },
  linkRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  linkRowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  sectionTitle: { marginBottom: Spacing.md },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: '#fef2f2', borderRadius: Radius.button,
    paddingVertical: Spacing.base, borderWidth: 1, borderColor: '#fecaca',
    marginTop: Spacing.sm,
  },
});

