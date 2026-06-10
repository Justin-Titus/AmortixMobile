import React, { useState, useEffect } from 'react';
import {
  View, ScrollView, TouchableOpacity, KeyboardAvoidingView,
  Platform, StyleSheet, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getProfile, updateProfile, type FinancialProfile } from '@/services/profile';
import { Input } from '@/components/ui/Input';
import { Colors, Radius, Spacing, Shadows } from '@/constants/theme';
import { Save, ArrowLeft } from 'lucide-react-native';
import Typography from '@/components/ui/Typography';
import { CURRENCIES, getCurrencyConfig } from '@/lib/calculations';
import { Skeleton } from '@/components/ui/Skeleton';

const employmentTypes = ['SALARIED', 'SELF_EMPLOYED', 'BUSINESS_OWNER', 'STUDENT', 'OTHER'];
const creditScoreRanges = ['800+', '750-800', '700-750', '650-700', 'below 650'];

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [income, setIncome] = useState('');
  const [expenses, setExpenses] = useState('');
  const [employmentType, setEmploymentType] = useState('SALARIED');
  const [creditScore, setCreditScore] = useState('750-800');
  const [hasEmergencyFund, setHasEmergencyFund] = useState(false);
  const [emergencyMonths, setEmergencyMonths] = useState('');
  const [currency, setCurrency] = useState('INR');

  useEffect(() => {
    getProfile().then(p => {
      if (p) {
        setIncome(String(p.monthlyIncome));
        setExpenses(String(p.monthlyExpenses));
        setEmploymentType(p.employmentType);
        setCreditScore(p.creditScoreRange);
        setHasEmergencyFund(p.hasEmergencyFund);
        setEmergencyMonths(String(p.emergencyFundMonths));
        setCurrency(p.currency || 'INR');
      }
      setLoading(false);
    });
  }, []);

  const handleSubmit = async () => {
    if (!income || isNaN(Number(income))) { Alert.alert('Error', 'Valid monthly income is required'); return; }
    if (!expenses || isNaN(Number(expenses))) { Alert.alert('Error', 'Valid monthly expenses is required'); return; }

    setSubmitting(true);
    const result = await updateProfile({
      monthlyIncome: Number(income),
      monthlyExpenses: Number(expenses),
      employmentType: employmentType as any,
      creditScoreRange: creditScore,
      hasEmergencyFund,
      emergencyFundMonths: Number(emergencyMonths) || 0,
      currency,
    });

    if (result.success) {
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to update profile');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.hero}>
            <Skeleton width={180} height={32} style={{ marginBottom: Spacing.sm }} />
            <Skeleton width="100%" height={16} />
          </View>
          
          {[1, 2].map(i => (
            <View key={i} style={s.gap}>
              <Skeleton width={120} height={14} style={{ marginBottom: Spacing.sm }} />
              <Skeleton width="100%" height={52} borderRadius={Radius.button} />
            </View>
          ))}
          
          {[1, 2, 3].map(i => (
            <View key={`chips-${i}`} style={{ marginBottom: Spacing.lg }}>
              <Skeleton width={120} height={14} style={{ marginBottom: Spacing.sm }} />
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <Skeleton width={80} height={36} borderRadius={18} />
                <Skeleton width={100} height={36} borderRadius={18} />
                <Skeleton width={90} height={36} borderRadius={18} />
              </View>
            </View>
          ))}
          
          <Skeleton width="100%" height={52} borderRadius={Radius.button} style={{ marginTop: Spacing.lg }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={{ flex: 1, backgroundColor: Colors.background }}
    >
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>


        <View style={s.hero}>
          <Typography variant="h3" weight="bold" color="navy" fontFamily="heading">
            Financial profile
          </Typography>
          <Typography color="slate" style={s.description}>
            This data powers your risk analysis and interest leak detection.
          </Typography>
        </View>

        <Input 
          label={`MONTHLY INCOME (${getCurrencyConfig(currency).symbol})`} 
          placeholder="e.g. 100000" 
          value={income} 
          onChangeText={setIncome} 
          keyboardType="numeric" 
          containerStyle={s.gap} 
        />

        <Input 
          label={`MONTHLY EXPENSES (${getCurrencyConfig(currency).symbol})`} 
          placeholder="e.g. 40000" 
          value={expenses} 
          onChangeText={setExpenses} 
          keyboardType="numeric" 
          containerStyle={s.gap} 
        />

        <Typography variant="xs" weight="bold" color="navy" fontFamily="heading" style={s.label}>
          DEFAULT CURRENCY
        </Typography>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
          {Object.keys(CURRENCIES).map(code => (
            <TouchableOpacity 
              key={code} 
              style={[s.chip, currency === code && s.chipActive]} 
              onPress={() => setCurrency(code)}
            >
              <Typography variant="xs" weight="bold" color={currency === code ? 'white' : 'slate'}>
                {code} ({CURRENCIES[code].symbol})
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Typography variant="xs" weight="bold" color="navy" fontFamily="heading" style={s.label}>
          EMPLOYMENT TYPE
        </Typography>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
          {employmentTypes.map(t => (
            <TouchableOpacity 
              key={t} 
              style={[s.chip, employmentType === t && s.chipActive]} 
              onPress={() => setEmploymentType(t)}
            >
              <Typography variant="xs" weight="bold" color={employmentType === t ? 'white' : 'slate'}>
                {t.replace('_', ' ')}
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Typography variant="xs" weight="bold" color="navy" fontFamily="heading" style={s.label}>
          CREDIT SCORE RANGE
        </Typography>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
          {creditScoreRanges.map(r => (
            <TouchableOpacity 
              key={r} 
              style={[s.chip, creditScore === r && s.chipActive]} 
              onPress={() => setCreditScore(r)}
            >
              <Typography variant="xs" weight="bold" color={creditScore === r ? 'white' : 'slate'}>
                {r}
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={s.emergencyRow}>
          <View style={{ flex: 1 }}>
            <Typography variant="xs" weight="bold" color="navy" fontFamily="heading" style={s.label}>
              EMERGENCY FUND
            </Typography>
            <Typography variant="caption" color="slate">Do you have 3-6 months of buffer?</Typography>
          </View>
          <TouchableOpacity 
            style={[s.toggle, hasEmergencyFund && s.toggleActive]} 
            onPress={() => setHasEmergencyFund(!hasEmergencyFund)}
          >
            <View style={[s.toggleThumb, hasEmergencyFund && s.toggleThumbActive]} />
          </TouchableOpacity>
        </View>

        {hasEmergencyFund && (
          <Input 
            label="COVERAGE (MONTHS)" 
            placeholder="e.g. 6" 
            value={emergencyMonths} 
            onChangeText={setEmergencyMonths} 
            keyboardType="numeric" 
            containerStyle={s.gap} 
          />
        )}

        <TouchableOpacity 
          style={[s.submitBtn, submitting && s.disabled]} 
          onPress={handleSubmit} 
          disabled={submitting}
        >
          <Save size={18} color={Colors.white} />
          <Typography weight="bold" color="white">
            {submitting ? 'Saving...' : 'Save Profile'}
          </Typography>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  content: { padding: Spacing.base, paddingTop: Spacing.md },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md, alignSelf: 'flex-start' },
  hero: { marginBottom: Spacing.xl },
  description: { marginTop: 4 },
  gap: { marginBottom: Spacing.lg },
  label: { textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm },
  chipScroll: { marginBottom: Spacing.lg },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1,
    borderColor: Colors.borderMid, backgroundColor: Colors.white, marginRight: Spacing.sm,
  },
  chipActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  emergencyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: '#E2E8F0', padding: 2 },
  toggleActive: { backgroundColor: Colors.emerald },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.white },
  toggleThumbActive: { alignSelf: 'flex-end' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.emerald, borderRadius: Radius.button, height: 52, marginTop: Spacing.lg,
    ...Shadows.button,
  },
  disabled: { opacity: 0.5 },
});

