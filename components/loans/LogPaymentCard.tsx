import React, { useState } from 'react';
import {
  View, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { recordPayment } from '@/services/loans';
import { CheckCircle2, Calendar as CalendarIcon } from 'lucide-react-native';

type LogPaymentCardProps = {
  loanId: string;
  defaultAmount: number;
  onSuccess: () => void;
};

export function LogPaymentCard({ loanId, defaultAmount, onSuccess }: LogPaymentCardProps) {
  const [amount, setAmount] = useState(String(defaultAmount));
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [type, setType] = useState<'EMI' | 'PREPAYMENT'>('EMI');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSubmit = async () => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Enter a valid amount.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await recordPayment(loanId, {
      amount: numAmount,
      paymentDate: date.toISOString(),
      type,
      notes: notes || undefined,
    });

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setNotes('');
        setIsSubmitting(false);
        onSuccess();
      }, 2000);
    }
  };

  if (success) {
    return (
      <Card style={s.successCard}>
        <CheckCircle2 size={40} color={Colors.emerald} />
        <Typography variant="body" weight="bold" color="navy" style={s.successTitle}>
          Payment recorded!
        </Typography>
        <Typography variant="caption" color="slate">
          Your loan balance has been updated.
        </Typography>
      </Card>
    );
  }

  return (
    <Card>
      <Typography variant="xs" weight="bold" color="slate" style={s.label}>
        RECORD PAYMENT
      </Typography>
      <Typography variant="caption" color="slate" style={s.desc}>
        Made a payment? Log it here to track progress.
      </Typography>

      <View style={s.typeRow}>
        <TouchableOpacity 
          style={[s.typeBtn, type === 'EMI' && s.typeBtnActive]} 
          onPress={() => { setType('EMI'); setAmount(String(defaultAmount)); }}
        >
          <Typography variant="xs" weight="bold" color={type === 'EMI' ? 'emerald' : 'slate'}>
            Regular EMI
          </Typography>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[s.typeBtn, type === 'PREPAYMENT' && s.typeBtnActivePre]} 
          onPress={() => setType('PREPAYMENT')}
        >
          <Typography variant="xs" weight="bold" color={type === 'PREPAYMENT' ? 'amber' : 'slate'}>
            Prepayment
          </Typography>
        </TouchableOpacity>
      </View>

      <View style={s.formRow}>
        <Input
          label="AMOUNT (₹)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          containerStyle={{ flex: 1.5 }}
        />
        <View style={{ flex: 1 }}>
          <Typography variant="xs" weight="bold" color="navy" fontFamily="heading" style={s.pickerLabel}>
            DATE
          </Typography>
          <TouchableOpacity style={s.datePickerBtn} onPress={() => setShowPicker(true)}>
            <Typography variant="body" color="navy">
              {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </Typography>
            <CalendarIcon size={14} color={Colors.slate} />
          </TouchableOpacity>
        </View>
      </View>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

      <Input
        label="NOTES (OPTIONAL)"
        placeholder="e.g. Paid from bonus"
        value={notes}
        onChangeText={setNotes}
        containerStyle={s.input}
      />

      {error && <Typography variant="xs" color="red" align="center" style={s.error}>{error}</Typography>}

      <Button
        title={isSubmitting ? 'Recording...' : type === 'EMI' ? 'Log EMI' : 'Log Prepayment'}
        onPress={handleSubmit}
        loading={isSubmitting}
        variant={type === 'EMI' ? 'primary' : 'secondary'}
        style={type === 'PREPAYMENT' ? s.prepaymentBtn : undefined}
        textStyle={type === 'PREPAYMENT' ? s.prepaymentBtnText : undefined}
      />
    </Card>
  );
}

const s = StyleSheet.create({
  label: { letterSpacing: 0.8, marginBottom: 4 },
  desc: { marginBottom: Spacing.md },
  typeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  typeBtn: { 
    flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.borderLight, backgroundColor: Colors.white,
  },
  typeBtnActive: { borderColor: Colors.emerald, backgroundColor: '#f0fdf4' },
  typeBtnActivePre: { borderColor: '#f59e0b', backgroundColor: '#fffbeb' },
  formRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  pickerLabel: { letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },
  datePickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 52, borderRadius: Radius.button, borderWidth: 1, borderColor: Colors.borderMid,
    backgroundColor: '#f8fafc', paddingHorizontal: Spacing.base,
  },
  input: { marginBottom: Spacing.md },
  error: { marginBottom: Spacing.sm },
  prepaymentBtn: { backgroundColor: '#fffbeb', borderColor: '#f59e0b', borderWidth: 1 },
  prepaymentBtnText: { color: '#b45309' },
  successCard: { alignItems: 'center', paddingVertical: Spacing.xl },
  successTitle: { marginTop: Spacing.md, marginBottom: 4 },
});
