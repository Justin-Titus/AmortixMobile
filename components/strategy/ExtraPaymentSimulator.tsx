import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Calculator } from 'lucide-react-native';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';
import Typography from '../ui/Typography';
import SliderField from '../ui/SliderField';
import { formatCurrency } from '@/lib/calculations/emi';

type ExtraPaymentSimulatorProps = {
  extraPayment: number;
  oneTimePayment: number;
  onExtraPaymentChange: (val: number) => void;
  onOneTimePaymentChange: (val: number) => void;
};

export default function ExtraPaymentSimulator({
  extraPayment,
  oneTimePayment,
  onExtraPaymentChange,
  onOneTimePaymentChange,
}: ExtraPaymentSimulatorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Calculator size={18} color={Colors.emerald} />
        <Typography variant="body" weight="bold" color="navy" fontFamily="heading">
          Extra Payment Simulator
        </Typography>
      </View>
      <Typography variant="sm" color="slate" style={styles.subText}>
        How much extra can you put towards your debt?
      </Typography>

      <SliderField
        label="Monthly extra"
        value={extraPayment}
        min={0}
        max={100000}
        step={1000}
        displayValue={formatCurrency(extraPayment)}
        onChange={onExtraPaymentChange}
      />

      <SliderField
        label="One-time prepayment"
        value={oneTimePayment}
        min={0}
        max={1000000}
        step={10000}
        displayValue={formatCurrency(oneTimePayment)}
        onChange={onOneTimePaymentChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    ...Shadows.card,
    marginBottom: Spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  subText: {
    marginBottom: Spacing.lg,
  },
});
