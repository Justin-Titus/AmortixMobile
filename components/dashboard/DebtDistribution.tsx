import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';
import { Colors, Spacing } from '@/constants/theme';
import Typography from '../ui/Typography';
import { formatCompactCurrency } from '@/lib/calculations/emi';

type DebtDistributionProps = {
  loans: Array<{
    name: string;
    balance: number;
    color: string;
  }>;
};

const CHART_SIZE = 160;
const STROKE_WIDTH = 20;
const RADIUS = (CHART_SIZE - STROKE_WIDTH) / 2;
const CENTER = CHART_SIZE / 2;

export default function DebtDistribution({ loans }: DebtDistributionProps) {
  const total = loans.reduce((s, l) => s + l.balance, 0);
  
  if (total === 0) return null;

  let currentAngle = 0;

  return (
    <View style={styles.container}>
      <Typography variant="body" weight="bold" color="navy" fontFamily="heading" style={styles.title}>
        Debt Distribution
      </Typography>
      
      <View style={styles.content}>
        <View style={styles.chart}>
          <Svg width={CHART_SIZE} height={CHART_SIZE}>
            <G rotation="-90" origin={`${CENTER}, ${CENTER}`}>
              {loans.map((loan, i) => {
                const percentage = loan.balance / total;
                const angle = percentage * 360;
                
                // Calculate path for donut slice
                const x1 = CENTER + RADIUS * Math.cos((currentAngle * Math.PI) / 180);
                const y1 = CENTER + RADIUS * Math.sin((currentAngle * Math.PI) / 180);
                const x2 = CENTER + RADIUS * Math.cos(((currentAngle + angle) * Math.PI) / 180);
                const y2 = CENTER + RADIUS * Math.sin(((currentAngle + angle) * Math.PI) / 180);
                
                const largeArcFlag = angle > 180 ? 1 : 0;
                const d = `M ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
                
                const slice = (
                  <Path
                    key={loan.name}
                    d={d}
                    fill="none"
                    stroke={loan.color}
                    strokeWidth={STROKE_WIDTH}
                  />
                );
                
                currentAngle += angle;
                return slice;
              })}
            </G>
            {/* Center Text */}
            <SvgText
              x={CENTER}
              y={CENTER - 5}
              textAnchor="middle"
              fontSize="10"
              fill={Colors.slate}
            >
              Total
            </SvgText>
            <SvgText
              x={CENTER}
              y={CENTER + 15}
              textAnchor="middle"
              fontSize="14"
              fontWeight="bold"
              fill={Colors.navy}
            >
              {formatCompactCurrency(total)}
            </SvgText>
          </Svg>
        </View>

        <View style={styles.legend}>
          {loans.map((loan) => (
            <View key={loan.name} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: loan.color }]} />
              <View style={{ flex: 1 }}>
                <Typography variant="xs" weight="medium" color="navy" numberOfLines={1}>
                  {loan.name}
                </Typography>
                <Typography variant="xs" color="slate">
                  {Math.round((loan.balance / total) * 100)}%
                </Typography>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.md,
  },
  title: {
    marginBottom: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  chart: {
    width: CHART_SIZE,
    height: CHART_SIZE,
  },
  legend: {
    flex: 1,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
});
