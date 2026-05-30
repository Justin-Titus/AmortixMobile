import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { Colors, Spacing } from '@/constants/theme';
import Typography from '../ui/Typography';
import { formatCurrency } from '@/lib/calculations';

type StrategyComparisonChartProps = {
  data: {
    name: string;
    interest: number;
    color: string;
  }[];
  activeStrategy: string;
  currencyCode?: string;
};

const CHART_HEIGHT = 200;
const CHART_WIDTH = Dimensions.get('window').width - Spacing.base * 4 - 32;

export default function StrategyComparisonChart({ data, activeStrategy, currencyCode = 'INR' }: StrategyComparisonChartProps) {
  const maxInterest = Math.max(...data.map(d => d.interest), 1);
  const barHeight = 24;
  const gap = 30;

  return (
    <View style={styles.container}>
      <Typography variant="body" weight="bold" color="navy" fontFamily="heading" style={styles.title}>
        Interest Comparison
      </Typography>
      
      <View style={styles.chart}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {data.map((item, i) => {
            const barWidth = (item.interest / maxInterest) * (CHART_WIDTH - 100);
            const y = i * (barHeight + gap) + 20;
            const isActive = activeStrategy.toLowerCase() === item.name.toLowerCase();

            return (
              <React.Fragment key={item.name}>
                <SvgText
                  x="0"
                  y={y - 8}
                  fontSize="11"
                  fontWeight="bold"
                  fill={Colors.navy}
                >
                  {item.name}
                </SvgText>
                
                <Rect
                  x="0"
                  y={y}
                  width={CHART_WIDTH - 80}
                  height={barHeight}
                  fill="#f1f5f9"
                  rx={4}
                />
                
                <Rect
                  x="0"
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={isActive ? item.color : '#94A3B8'}
                  rx={4}
                />

                <SvgText
                  x={CHART_WIDTH - 70}
                  y={y + 16}
                  fontSize="11"
                  fontWeight="bold"
                  fill={Colors.navy}
                >
                  {formatCurrency(item.interest, currencyCode)}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    marginTop: Spacing.base,
  },
  title: {
    marginBottom: Spacing.md,
  },
  chart: {
    alignItems: 'center',
  },
});

