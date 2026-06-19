import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/theme';
import Typography from '@/components/ui/Typography';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={s.container}>
      <Typography variant="hero" weight="bold" color="slateLight" align="center">404</Typography>
      <Typography variant="h2" weight="bold" color="navy" align="center" style={s.title}>Page not found</Typography>
      <Typography variant="md" color="slate" align="center" style={s.desc}>The screen you're looking for doesn't exist.</Typography>
      <TouchableOpacity style={s.btn} onPress={() => router.replace('/')}>
        <Typography variant="md" weight="semiBold" color="white" align="center">Go home</Typography>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, padding: Spacing.xxl },
  title: { marginTop: Spacing.base },
  desc: { marginTop: Spacing.sm },
  btn: { marginTop: Spacing.xl, backgroundColor: Colors.emerald, borderRadius: Radius.button, paddingHorizontal: 24, paddingVertical: 14 },
});
