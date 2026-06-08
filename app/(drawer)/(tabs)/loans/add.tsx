import React, { useState, useEffect, useCallback } from 'react';
import {
  View, ScrollView, TouchableOpacity, KeyboardAvoidingView,
  Platform, StyleSheet, Alert, Vibration,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { createLoan, getLoan, updateLoan } from '@/services/loans';
import { getProfile } from '@/services/profile';
import { clearCachedLoans } from '@/lib/offline/cache';
import { Input } from '@/components/ui/Input';
import { Colors, Radius, Spacing, Shadows } from '@/constants/theme';
import { calculateEMI, calculateTenure, CURRENCIES, getCurrencyConfig } from '@/lib/calculations';
import { Save, Plus, ArrowLeft, Calendar as CalendarIcon } from 'lucide-react-native';
import Typography from '@/components/ui/Typography';
import { Skeleton } from '@/components/ui/Skeleton';

const loanTypes = ['HOME', 'EDUCATION', 'PERSONAL', 'VEHICLE', 'BUSINESS', 'GOLD', 'OTHER'];
const rateTypes = ['FIXED', 'FLOATING'];

export default function AddLoanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [loanType, setLoanType] = useState('PERSONAL');
  const [principal, setPrincipal] = useState('');
  const [outstanding, setOutstanding] = useState('');
  const [rate, setRate] = useState('');
  const [rateType, setRateType] = useState<'FIXED' | 'FLOATING'>('FIXED');
  const [tenure, setTenure] = useState('');
  const [emi, setEmi] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [lender, setLender] = useState('');
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState('INR');
  
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // Track whether the user has modified any field so we can warn before discarding
  const [isDirty, setIsDirty] = useState(false);
  const navigation = useNavigation();

  // Intercept back navigation when there are unsaved changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!isDirty || submitting) return; // Nothing to warn about
      e.preventDefault();
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Keep editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });
    return unsubscribe;
  }, [navigation, isDirty, submitting]);

  useEffect(() => {
    const init = async () => {
      const p = await getProfile();
      if (p) {
        setCurrency(p.currency || 'INR');
      }
      if (id) {
        const l = await getLoan(id);
        if (l) {
          setName(l.name);
          setLoanType(l.loanType);
          setPrincipal(String(l.principal));
          setOutstanding(String(l.outstandingBalance));
          setRate(String(l.interestRate));
          setRateType(l.rateType);
          setTenure(String(l.tenureMonths));
          setEmi(String(l.emiAmount));
          setStartDate(new Date(l.startDate));
          setLender(l.lender || '');
          setNotes(l.notes || '');
          setCurrency(l.currency || p?.currency || 'INR');
        }
      }
      setLoading(false);
    };
    init();
  }, [id]);
  
  useEffect(() => {
    const p = Number(principal);
    const r = Number(rate);
    const t = Number(tenure);
    
    if (p > 0 && r >= 0 && t > 0) {
      const calculatedEmi = calculateEMI(p, r, t);
      if (calculatedEmi > 0 && Math.abs(calculatedEmi - Number(emi)) > 1) {
        setEmi(String(calculatedEmi));
      }
    }
  }, [principal, rate, tenure]);

  const handleEmiChange = (val: string) => {
    setEmi(val);
    const p = Number(principal);
    const r = Number(rate);
    const e = Number(val);
    
    if (p > 0 && r >= 0 && e > 0) {
      const calculatedTenure = calculateTenure(p, r, e);
      if (calculatedTenure > 0 && calculatedTenure !== Number(tenure)) {
        setTenure(String(calculatedTenure));
      }
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    const errors: Record<string, string> = {};
    
    if (!name.trim()) errors.name = 'Required';
    if (!principal || isNaN(Number(principal)) || Number(principal) <= 0) errors.principal = 'Invalid principal';
    if (!rate || isNaN(Number(rate)) || Number(rate) < 0) errors.rate = 'Invalid rate';
    if (!tenure || isNaN(Number(tenure)) || Number(tenure) <= 0) errors.tenure = 'Invalid tenure';
    if (!emi || isNaN(Number(emi)) || Number(emi) <= 0) errors.emi = 'Invalid EMI';

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError('Please fix the errors before submitting.');
      return;
    }

    setSubmitting(true);
    const loanData = {
      name: name.trim(),
      loanType,
      principal: Number(principal),
      outstandingBalance: outstanding ? Number(outstanding) : Number(principal),
      interestRate: Number(rate),
      rateType,
      tenureMonths: Number(tenure),
      emiAmount: Number(emi),
      startDate: startDate.toISOString(),
      lender: lender.trim() || null,
      notes: notes.trim() || null,
      currency,
    };

    const result = id 
      ? await updateLoan(id, loanData)
      : await createLoan(loanData);

    if ('error' in result && result.error) {
      setError(result.error);
    } else {
      // Invalidate the loan cache so the next offline read is fresh
      await clearCachedLoans();
      // Reset dirty flag so back navigation doesn't trigger discard dialog
      setIsDirty(false);
      // Success haptic feedback
      Vibration.vibrate(30);
      Alert.alert('Success', `Loan ${id ? 'updated' : 'added'} successfully!`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
    setSubmitting(false);

  };

  if (loading) {
    return (
      <View style={s.container}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Skeleton width={80} height={20} style={{ marginBottom: Spacing.md }} />
          
          <View style={s.hero}>
            <Skeleton width={150} height={32} style={{ marginBottom: Spacing.sm }} />
            <Skeleton width="100%" height={16} />
          </View>
          
          {[1, 2, 3, 4, 5, 6].map(i => (
            <View key={i} style={s.gap}>
              <Skeleton width={120} height={14} style={{ marginBottom: Spacing.sm }} />
              <Skeleton width="100%" height={52} borderRadius={Radius.button} />
            </View>
          ))}
          
          <Skeleton width="100%" height={52} borderRadius={Radius.button} style={{ marginTop: Spacing.lg }} />
        </ScrollView>
      </View>
    );
  }

  const currentConfig = getCurrencyConfig(currency);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={s.container}
    >
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={s.hero}>
          <Typography variant="h3" weight="bold" color="navy" fontFamily="heading">
            {id ? 'Edit loan' : 'Add new loan'}
          </Typography>
          <Typography color="slate" style={s.description}>
            {id ? 'Update your loan details to keep your analysis accurate.' : 'Enter your loan details to start tracking payoff progress.'}
          </Typography>
        </View>

        {error && (
          <View style={s.errorBox}>
            <Typography color="red">{error}</Typography>
          </View>
        )}
        
        <Input
          label="LOAN NAME"
          placeholder="e.g. Home Loan - SBI"
          value={name}
          onChangeText={(v) => { setName(v); setIsDirty(true); if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' }); }}
          error={fieldErrors.name}
          containerStyle={s.gap}
        />

        <Typography variant="xs" weight="bold" color="navy" fontFamily="heading" style={s.label}>
          LOAN TYPE
        </Typography>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
          {loanTypes.map(t => (
            <TouchableOpacity key={t} style={[s.chip, loanType === t && s.chipActive]} onPress={() => setLoanType(t)}>
              <Typography variant="xs" weight="bold" color={loanType === t ? 'white' : 'slate'}>
                {t}
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Typography variant="xs" weight="bold" color="navy" fontFamily="heading" style={s.label}>
          LOAN CURRENCY
        </Typography>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
          {Object.keys(CURRENCIES).map(code => (
            <TouchableOpacity key={code} style={[s.chip, currency === code && s.chipActive]} onPress={() => setCurrency(code)}>
              <Typography variant="xs" weight="bold" color={currency === code ? 'white' : 'slate'}>
                {code} ({CURRENCIES[code].symbol})
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Input label={`PRINCIPAL (${currentConfig.symbol})`} placeholder="e.g. 5000000" value={principal}
          onChangeText={(v) => { setPrincipal(v); if(fieldErrors.principal) setFieldErrors({...fieldErrors, principal: ''}); }} 
          keyboardType="numeric" error={fieldErrors.principal} containerStyle={s.gap} />
          
        <Input label={`OUTSTANDING BALANCE (${currentConfig.symbol})`} placeholder="Leave blank if same as principal" value={outstanding}
          onChangeText={setOutstanding} keyboardType="numeric" containerStyle={s.gap}
          hint="Leave blank if same as principal" />
          
        <Input label="INTEREST RATE (%)" placeholder="e.g. 8.5" value={rate}
          onChangeText={(v) => { setRate(v); if(fieldErrors.rate) setFieldErrors({...fieldErrors, rate: ''}); }} 
          keyboardType="decimal-pad" error={fieldErrors.rate} containerStyle={s.gap} />

        <Typography variant="xs" weight="bold" color="navy" fontFamily="heading" style={s.label}>
          RATE TYPE
        </Typography>
        <View style={s.toggleRow}>
          {rateTypes.map(t => (
            <TouchableOpacity key={t} style={[s.toggle, rateType === t && s.toggleActive]}
              onPress={() => setRateType(t as 'FIXED' | 'FLOATING')}>
              <Typography variant="body" weight="bold" color={rateType === t ? 'white' : 'slate'}>
                {t}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>

        <Input label="TENURE (MONTHS)" placeholder="e.g. 240" value={tenure}
          onChangeText={(v) => { setTenure(v); if(fieldErrors.tenure) setFieldErrors({...fieldErrors, tenure: ''}); }} 
          keyboardType="numeric" error={fieldErrors.tenure} containerStyle={s.gap} />
          
        <Input label={`EMI AMOUNT (${currentConfig.symbol})`} placeholder="e.g. 45000" value={emi}
          onChangeText={(v) => { handleEmiChange(v); if(fieldErrors.emi) setFieldErrors({...fieldErrors, emi: ''}); }} 
          keyboardType="numeric" error={fieldErrors.emi} containerStyle={s.gap} />

        {/* Start Date Picker */}
        <Typography variant="xs" weight="bold" color="navy" fontFamily="heading" style={s.label}>
          LOAN START DATE
        </Typography>
        <TouchableOpacity style={s.datePickerBtn} onPress={() => setShowDatePicker(true)}>
          <Typography variant="body" color="navy">
            {startDate.toLocaleDateString(currentConfig.locale, { day: 'numeric', month: 'long', year: 'numeric' })}
          </Typography>
          <CalendarIcon size={18} color={Colors.slate} />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        <View style={{ marginTop: Spacing.lg }} />

        <Input label="LENDER" placeholder="e.g. State Bank of India" value={lender}
          onChangeText={setLender} containerStyle={s.gap} />
        <Input label="NOTES" placeholder="Optional notes" value={notes}
          onChangeText={setNotes} multiline numberOfLines={3} containerStyle={s.gap} />

        <TouchableOpacity style={[s.submitBtn, submitting && s.disabled]}
          onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
          {id ? <Save size={16} color={Colors.white} /> : <Plus size={16} color={Colors.white} />}
          <Typography weight="bold" color="white">
            {submitting ? 'Processing...' : id ? 'Update loan' : 'Add loan'}
          </Typography>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, paddingTop: Spacing.md },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md, alignSelf: 'flex-start' },
  hero: { marginBottom: Spacing.lg },
  description: { marginTop: 4 },
  errorBox: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: Radius.button, padding: 12, marginBottom: Spacing.base },
  gap: { marginBottom: Spacing.lg },
  label: { textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm },
  chipScroll: { marginBottom: Spacing.lg },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1,
    borderColor: Colors.borderMid, backgroundColor: Colors.white, marginRight: Spacing.sm,
  },
  chipActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  toggleRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  toggle: {
    flex: 1, paddingVertical: 12, borderRadius: Radius.button, borderWidth: 1,
    borderColor: Colors.borderMid, backgroundColor: Colors.white, alignItems: 'center',
  },
  toggleActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  datePickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 52, borderRadius: Radius.button, borderWidth: 1, borderColor: Colors.borderMid,
    backgroundColor: '#f8fafc', paddingHorizontal: Spacing.base,
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.emerald, borderRadius: Radius.button, height: 52, marginTop: Spacing.lg,
    ...Shadows.button,
  },
  disabled: { opacity: 0.5 },
});

