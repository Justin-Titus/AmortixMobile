import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { Scale, FileText, CheckCircle, AlertTriangle } from 'lucide-react-native';
import Typography from '@/components/ui/Typography';

export default function TermsScreen() {
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.header}>
        <View style={s.iconCircle}>
          <Scale size={24} color={Colors.emerald} />
        </View>
        <Typography variant="h2" weight="bold" color="navy" fontFamily="heading" style={s.title}>
          Terms of Service
        </Typography>
        <Typography variant="caption" color="slate" align="center">
          Effective Date: May 1, 2026. Last updated: May 1, 2026.
        </Typography>
      </View>

      <View style={s.section}>
        <View style={s.sectionTitleRow}>
          <CheckCircle size={18} color={Colors.emerald} />
          <Typography variant="lg" weight="bold" color="navy" fontFamily="heading">
            1. Acceptance of Terms
          </Typography>
        </View>
        <Typography variant="body" color="slateDark" style={s.text}>
          Welcome to Amortix. By visiting our website or using our software platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, you must discontinue the use of our services immediately.
        </Typography>
      </View>

      <View style={s.section}>
        <View style={s.sectionTitleRow}>
          <FileText size={18} color={Colors.emerald} />
          <Typography variant="lg" weight="bold" color="navy" fontFamily="heading">
            2. User Accounts and Eligibility
          </Typography>
        </View>
        <Typography variant="body" color="slateDark" style={s.text}>
          To use Amortix, you must be at least 18 years of age. By registering for an account, you represent and warrant that the information you provide is true and accurate. You are solely responsible for maintaining the confidentiality of your credentials and for any activity that occurs under your account. Amortix is not responsible for any losses arising from unauthorized access to your account.
        </Typography>
      </View>

      <View style={s.section}>
        <View style={s.sectionTitleRow}>
          <AlertTriangle size={18} color={Colors.emerald} />
          <Typography variant="lg" weight="bold" color="navy" fontFamily="heading">
            3. Disclaimer of Financial Advice
          </Typography>
        </View>
        <Typography variant="body" color="slateDark" style={s.text}>
          Amortix provides automated calculations, interest comparisons, and visualization models for informational and strategic planning purposes only.
        </Typography>
        <Typography variant="body" color="slateDark" style={s.bullet}>• Amortix does not offer personal, professional, or corporate financial, investment, or legal advice.</Typography>
        <Typography variant="body" color="slateDark" style={s.bullet}>• The software generates scenarios based on inputs you provide; accuracy of external results is subject to variables we cannot control.</Typography>
        <Typography variant="body" color="slateDark" style={s.bullet}>• Always perform independent validation or consult a certified financial planner before making significant payment adjustments or financial decisions.</Typography>
      </View>

      <View style={s.section}>
        <Typography variant="lg" weight="bold" color="navy" fontFamily="heading" style={s.sectionTitleSimple}>
          4. Permitted and Prohibited Uses
        </Typography>
        <Typography variant="body" color="slateDark" style={s.text}>
          You agree to use Amortix only for lawful purposes in accordance with these Terms. You specifically agree not to:
        </Typography>
        <Typography variant="body" color="slateDark" style={s.bullet}>• Reverse engineer, decompile, or extract the underlying logic, schemas, or source code of Amortix.</Typography>
        <Typography variant="body" color="slateDark" style={s.bullet}>• Engage in any activity that interferes with or disrupts our servers or services.</Typography>
        <Typography variant="body" color="slateDark" style={s.bullet}>• Upload malicious code, script injections, or false/misleading metadata that disrupts core system functions.</Typography>
      </View>

      <View style={s.section}>
        <Typography variant="lg" weight="bold" color="navy" fontFamily="heading" style={s.sectionTitleSimple}>
          5. Intellectual Property
        </Typography>
        <Typography variant="body" color="slateDark" style={s.text}>
          The design, structure, codebases, features, and content of Amortix (excluding user-submitted metrics) are the exclusive property of Amortix and are protected by applicable intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to access and use the platform for your own personal use.
        </Typography>
      </View>

      <View style={s.section}>
        <Typography variant="lg" weight="bold" color="navy" fontFamily="heading" style={s.sectionTitleSimple}>
          6. Limitation of Liability and Termination
        </Typography>
        <Typography variant="body" color="slateDark" style={s.text}>
          In no event shall Amortix or its developers be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use our services. We reserve the right to suspend or terminate access to our platform for any reason, including any breach of these Terms, at our sole discretion without notice.
        </Typography>
      </View>

      <View style={s.footer}>
        <Typography variant="caption" color="slate" align="center">
          Questions regarding these Terms of Service? Please reach out to amortix.admin@gmail.com
        </Typography>
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
  section: { marginBottom: Spacing.xl },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  sectionTitleSimple: { marginBottom: Spacing.sm },
  text: { lineHeight: 22 },
  bullet: { lineHeight: 22, marginLeft: Spacing.sm, marginTop: 6 },
  footer: { marginTop: Spacing.xl, paddingTop: Spacing.xl, borderTopWidth: 1, borderTopColor: '#e2e8f0', alignItems: 'center' },
});
