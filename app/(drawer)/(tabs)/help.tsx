
import { ScrollView, View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { HelpCircle, Mail, Globe, ChevronRight, BarChart3, CheckCircle2, Plus } from 'lucide-react-native';
import Typography from '@/components/ui/Typography';

export default function HelpScreen() {
  const steps = [
    {
      title: "Add your loans",
      description: "Enter principal, rate, tenure, and EMI once. Amortix keeps the details organized.",
      outcome: "Your full debt portfolio in one place",
      Icon: Plus,
    },
    {
      title: "Compare the math",
      description: "See which payoff strategy saves the most interest and which one clears debt fastest.",
      outcome: "Pick the right strategy in minutes",
      Icon: BarChart3,
    },
    {
      title: "Act with confidence",
      description: "Use the AI advisor, reminders, and exports to stay on track without second-guessing.",
      outcome: "Stay on track every month",
      Icon: CheckCircle2,
    },
  ];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.header}>
        <View style={s.iconCircle}>
          <HelpCircle size={24} color={Colors.emerald} />
        </View>
        <Typography variant="h2" weight="bold" color="navy" fontFamily="heading" style={s.title}>
          Help Center
        </Typography>
        <Typography variant="caption" color="slate" align="center">
          Three steps from chaos to control.
        </Typography>
      </View>

      <View style={s.section}>
        <Typography variant="lg" weight="bold" color="navy" fontFamily="heading" style={s.sectionTitle}>
          How Amortix Works
        </Typography>
        {steps.map((step, i) => (
          <View key={i} style={s.stepCard}>
            <View style={s.stepHeader}>
              <View style={s.stepIcon}>
                <step.Icon size={18} color={Colors.emerald} />
              </View>
              <Typography variant="md" weight="bold" color="navy" fontFamily="heading">
                {step.title}
              </Typography>
            </View>
            <Typography variant="body" color="slateDark" style={s.stepDesc}>
              {step.description}
            </Typography>
            <View style={s.outcomeBadge}>
              <Typography variant="xs" weight="bold" color="emerald">
                {step.outcome}
              </Typography>
            </View>
          </View>
        ))}
      </View>

      <View style={s.section}>
        <Typography variant="lg" weight="bold" color="navy" fontFamily="heading" style={s.sectionTitle}>
          Support Channels
        </Typography>
        <TouchableOpacity 
          style={s.supportCard}
          onPress={() => Linking.openURL('mailto:amortix.admin@gmail.com')}
        >
          <View style={s.supportIcon}>
            <Mail size={20} color={Colors.white} />
          </View>
          <View style={s.supportInfo}>
            <Typography variant="md" weight="bold" color="navy" fontFamily="heading">
              Email Support
            </Typography>
            <Typography variant="caption" color="slate">amortix.admin@gmail.com</Typography>
          </View>
          <ChevronRight size={16} color={Colors.slate} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={s.supportCard}
          onPress={() => Linking.openURL('https://amortix.vercel.app')}
        >
          <View style={[s.supportIcon, { backgroundColor: Colors.navy }]}>
            <Globe size={20} color={Colors.white} />
          </View>
          <View style={s.supportInfo}>
            <Typography variant="md" weight="bold" color="navy" fontFamily="heading">
              Official Website
            </Typography>
            <Typography variant="caption" color="slate">amortix.vercel.app</Typography>
          </View>
          <ChevronRight size={16} color={Colors.slate} />
        </TouchableOpacity>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl },
  header: { alignItems: 'center', marginBottom: Spacing.xxl },
  iconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.emeraldBg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  title: { marginBottom: 4 },
  section: { marginBottom: Spacing.xxl },
  sectionTitle: { marginBottom: Spacing.lg },
  stepCard: {
    backgroundColor: Colors.white, padding: Spacing.base, borderRadius: Radius.md,
    borderWidth: 1, borderColor: '#f1f5f9', marginBottom: Spacing.base,
  },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 8 },
  stepIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.emeraldBg, alignItems: 'center', justifyContent: 'center' },
  stepDesc: { lineHeight: 20, marginBottom: 8 },
  outcomeBadge: { backgroundColor: '#f8fafc', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  supportCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.base,
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  supportIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.emerald, alignItems: 'center', justifyContent: 'center' },
  supportInfo: { flex: 1, marginLeft: Spacing.md },
});
