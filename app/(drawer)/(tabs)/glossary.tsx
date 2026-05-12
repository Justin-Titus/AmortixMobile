import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';
import { ChevronDown, ChevronUp, BookOpen, TrendingUp, ShieldCheck, Calculator } from 'lucide-react-native';
import Typography from '@/components/ui/Typography';

const glossaryGroups = [
  {
    title: "Core loan terms",
    icon: BookOpen,
    color: Colors.navyMid,
    items: [
      { term: "Principal", definition: "The original amount borrowed, before adding interest." },
      { term: "Outstanding balance", definition: "How much principal is still unpaid right now." },
      { term: "Tenure", definition: "The total repayment duration, usually shown in months." },
      { term: "Floating rate", definition: "A variable interest rate that can change based on market benchmarks." },
    ],
  },
  {
    title: "Repayment strategy",
    icon: TrendingUp,
    color: Colors.emerald,
    items: [
      { term: "Debt avalanche", definition: "Prioritize extra payments toward the highest-interest loan first." },
      { term: "Debt snowball", definition: "Prioritize the smallest outstanding loan first for faster closure wins." },
      { term: "Hybrid strategy", definition: "Mix avalanche and snowball by balancing savings with momentum." },
      { term: "Prepayment", definition: "A payment made above regular EMI to reduce future interest burden." },
    ],
  },
  {
    title: "Risk and health metrics",
    icon: ShieldCheck,
    color: Colors.amber,
    items: [
      { term: "DTI ratio", definition: "Debt-to-income ratio. Monthly EMI obligations divided by monthly income." },
      { term: "EMI load", definition: "The total EMI amount you pay each month across all active loans." },
      { term: "Default risk score", definition: "A model-driven estimate of repayment stress based on your profile and loan mix." },
      { term: "Interest leak", definition: "Avoidable annual interest loss caused by inefficient allocation or loan structure." },
    ],
  },
  {
    title: "Quick formulas",
    icon: Calculator,
    color: Colors.slate,
    items: [
      { term: "DTI", definition: "DTI = Total monthly EMI / Monthly income" },
      { term: "Disposable income", definition: "Disposable income = Monthly income - Monthly expenses" },
      { term: "Paid percentage", definition: "Paid % = (1 - Outstanding / Principal) * 100" },
      { term: "Weighted average rate", definition: "Sum(rate * outstanding) / Sum(outstanding)" },
    ],
  },
];

export default function GlossaryScreen() {
  const [expandedGroups, setExpandedGroups] = useState<number[]>([0]);

  const toggleGroup = (index: number) => {
    if (expandedGroups.includes(index)) {
      setExpandedGroups(expandedGroups.filter(i => i !== index));
    } else {
      setExpandedGroups([...expandedGroups, index]);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.badge}>
          <BookOpen size={12} color={Colors.emerald} />
          <Typography variant="xs" weight="bold" color="emerald" style={styles.badgeText}>
            LEARN THE LANGUAGE
          </Typography>
        </View>
        <Typography variant="h2" weight="bold" color="navy" fontFamily="heading" style={styles.title}>
          Glossary
        </Typography>
        <Typography color="slate" style={styles.description}>
          A quick reference for the financial terms, risk indicators, and formulas used across Amortix.
        </Typography>
      </View>

      {glossaryGroups.map((group, index) => (
        <View key={index} style={styles.groupContainer}>
          <Pressable 
            style={styles.groupHeader} 
            onPress={() => toggleGroup(index)}
          >
            <View style={styles.groupHeaderLeft}>
              <View style={[styles.iconBox, { backgroundColor: group.color + '15' }]}>
                <group.icon size={18} color={group.color} />
              </View>
              <Typography variant="md" weight="medium" color="navy" fontFamily="heading">
                {group.title}
              </Typography>
            </View>
            {expandedGroups.includes(index) ? (
              <ChevronUp size={20} color={Colors.slate} />
            ) : (
              <ChevronDown size={20} color={Colors.slate} />
            )}
          </Pressable>

          {expandedGroups.includes(index) && (
            <View style={styles.itemsContainer}>
              {group.items.map((item, i) => (
                <View key={i} style={[styles.item, i === group.items.length - 1 && styles.lastItem]}>
                  <Typography weight="bold" color="navyMid" style={styles.term}>
                    {item.term}
                  </Typography>
                  <Typography variant="caption" color="slate" style={styles.definition}>
                    {item.definition}
                  </Typography>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 40 },
  hero: {
    backgroundColor: Colors.white, padding: Spacing.xl, borderRadius: Radius.xxl,
    marginBottom: Spacing.xl, ...Shadows.card,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.emeraldBg,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.badge,
    alignSelf: 'flex-start', marginBottom: Spacing.md, gap: 4,
  },
  badgeText: { letterSpacing: 0.5 },
  title: { marginBottom: Spacing.sm },
  description: { lineHeight: 20 },
  groupContainer: {
    backgroundColor: Colors.white, borderRadius: Radius.xl, marginBottom: Spacing.md,
    overflow: 'hidden', ...Shadows.metric,
  },
  groupHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg,
  },
  groupHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconBox: { width: 36, height: 36, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center' },
  itemsContainer: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, backgroundColor: '#FAFAFA' },
  item: { paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  lastItem: { borderBottomWidth: 0 },
  term: { marginBottom: 4 },
  definition: { lineHeight: 18 },
});
