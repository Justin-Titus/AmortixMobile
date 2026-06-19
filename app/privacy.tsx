
import { ScrollView, View, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { Shield, Lock, Eye, FileText } from 'lucide-react-native';
import Typography from '@/components/ui/Typography';

export default function PrivacyScreen() {
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.header}>
        <View style={s.iconCircle}>
          <Shield size={24} color={Colors.emerald} />
        </View>
        <Typography variant="h2" weight="bold" color="navy" fontFamily="heading" style={s.title}>
          Privacy Policy
        </Typography>
        <Typography variant="caption" color="slate" align="center">
          Effective Date: May 1, 2026. Last updated: May 1, 2026.
        </Typography>
      </View>

      <View style={s.section}>
        <View style={s.sectionTitleRow}>
          <Eye size={18} color={Colors.emerald} />
          <Typography variant="lg" weight="bold" color="navy" fontFamily="heading">
            1. Information We Collect
          </Typography>
        </View>
        <Typography variant="body" color="slateDark" style={s.text}>
          At Amortix, we are committed to being transparent about the data we collect. Our platform is designed to provide actionable loan strategy insights while respecting your privacy.
        </Typography>
        <Typography variant="body" color="slateDark" style={s.bullet}>• Account Information: When you register on Amortix, we collect your name, email address, and authentication credentials through our auth providers.</Typography>
        <Typography variant="body" color="slateDark" style={s.bullet}>• Financial Information: To calculate debt reduction strategies, you input specific loan details such as total debt amount, interest rate, term length, and extra monthly payments.</Typography>
        <Typography variant="body" color="slateDark" style={s.bullet}>• Usage and Device Information: We collect technical data, including IP address, browser type, operating system, and usage statistics, to help improve the performance and security of our platform.</Typography>
      </View>

      <View style={s.section}>
        <View style={s.sectionTitleRow}>
          <FileText size={18} color={Colors.emerald} />
          <Typography variant="lg" weight="bold" color="navy" fontFamily="heading">
            2. How We Use Your Information
          </Typography>
        </View>
        <Typography variant="body" color="slateDark" style={s.text}>
          We process your data for the following legitimate business purposes:
        </Typography>
        <Typography variant="body" color="slateDark" style={s.bullet}>• To provide and maintain the Amortix dashboard, including tracking your loans and visualizing amortization tables.</Typography>
        <Typography variant="body" color="slateDark" style={s.bullet}>• To calculate and present custom payoff strategies, such as Avalanche or Snowball techniques.</Typography>
        <Typography variant="body" color="slateDark" style={s.bullet}>• To provide customer support and troubleshoot account-related issues.</Typography>
        <Typography variant="body" color="slateDark" style={s.bullet}>• To improve our analytics, optimize design patterns, and harden site security.</Typography>
      </View>

      <View style={s.section}>
        <View style={s.sectionTitleRow}>
          <Lock size={18} color={Colors.emerald} />
          <Typography variant="lg" weight="bold" color="navy" fontFamily="heading">
            3. Data Security and Retention
          </Typography>
        </View>
        <Typography variant="body" color="slateDark" style={s.text}>
          We understand that financial details are highly sensitive. We implement enterprise-grade security measures to keep your data safe:
        </Typography>
        <Typography variant="body" color="slateDark" style={s.bullet}>• Encryption: All information is transmitted over secure channels (HTTPS) and encrypted at rest using industry-standard protocols.</Typography>
        <Typography variant="body" color="slateDark" style={s.bullet}>• Access Controls: We restrict internal access to your personal data to only those employees or partners who require it to provide the service.</Typography>
        <Typography variant="body" color="slateDark" style={s.bullet}>• Retention: We retain your data as long as your account remains active. You can completely delete your account and associated loan details at any time directly through the dashboard settings.</Typography>
      </View>

      <View style={s.section}>
        <Typography variant="lg" weight="bold" color="navy" fontFamily="heading" style={s.sectionTitleSimple}>
          4. Sharing Your Information
        </Typography>
        <Typography variant="body" color="slateDark" style={s.text}>
          Amortix does not sell, trade, or rent your personal data to third parties. We only share information with reputable service providers to the extent necessary to support our operations (e.g., our primary cloud hosting, authentication providers, and error trackers), or if required by law to comply with valid legal processes.
        </Typography>
      </View>

      <View style={s.section}>
        <Typography variant="lg" weight="bold" color="navy" fontFamily="heading" style={s.sectionTitleSimple}>
          5. Your Rights and Choices
        </Typography>
        <Typography variant="body" color="slateDark" style={s.text}>
          As an Amortix user, you have full ownership over your data:
        </Typography>
        <Typography variant="body" color="slateDark" style={s.bullet}>• Access & Export: You can review and export your inputted loan profiles.</Typography>
        <Typography variant="body" color="slateDark" style={s.bullet}>• Correction: You can edit any loan metrics immediately within your loan settings view.</Typography>
        <Typography variant="body" color="slateDark" style={s.bullet}>• Deletion: You have the right to request deletion of all data we hold about you.</Typography>
      </View>

      <View style={s.footer}>
        <Typography variant="caption" color="slate" align="center">
          Have questions about this Privacy Policy? Contact us at{' '}
        </Typography>
        <TouchableOpacity onPress={() => Linking.openURL('mailto:amortix.admin@gmail.com')}>
          <Typography variant="caption" color="emerald" align="center" style={{ textDecorationLine: 'underline' }}>
            amortix.admin@gmail.com
          </Typography>
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
  section: { marginBottom: Spacing.xl },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  sectionTitleSimple: { marginBottom: Spacing.sm },
  text: { lineHeight: 22 },
  bullet: { lineHeight: 22, marginLeft: Spacing.sm, marginTop: 6 },
  footer: { marginTop: Spacing.xl, paddingTop: Spacing.xl, borderTopWidth: 1, borderTopColor: '#e2e8f0', alignItems: 'center' },
});
