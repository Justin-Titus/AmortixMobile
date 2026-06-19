
import { TouchableOpacity, Alert, StyleSheet, View } from 'react-native';
import Typography from '../ui/Typography';
import { Colors, Radius } from '@/constants/theme';
import { Info } from 'lucide-react-native';

function scoreTone(score: number) {
  if (score >= 75) return { bg: 'emeraldBg', text: 'emerald', border: 'rgba(77, 224, 179, 0.4)' };
  if (score >= 50) return { bg: 'amberBg', text: 'amber', border: 'rgba(245, 159, 58, 0.4)' };
  return { bg: 'redBg', text: 'red', border: 'rgba(209, 77, 91, 0.4)' };
}

export default function LoanHealthScoreBadge({ score }: { score: number }) {
  const tone = scoreTone(score);

  const handlePress = () => {
    Alert.alert(
      'Loan Health Score',
      `This score (${score}/100) reflects this loan's interest rate, EMI burden, and repayment progress. A higher score indicates a healthier, more sustainable loan structure.`
    );
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: Colors[tone.bg as keyof typeof Colors], borderColor: tone.border }]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.circle, { backgroundColor: Colors[tone.text as keyof typeof Colors] }]}>
        <Typography variant="xs" weight="bold" color="white" align="center">
          {score}
        </Typography>
      </View>
      <Typography variant="caption" weight="semiBold" color={tone.text} style={styles.text}>
        Loan Health Score
      </Typography>
      <Info size={12} color={Colors[tone.text as keyof typeof Colors]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 8,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 11,
  },
});
