import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, Radius } from '@/constants/theme';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={s.container}>
      <Text style={s.code}>404</Text>
      <Text style={s.title}>Page not found</Text>
      <Text style={s.desc}>The screen you're looking for doesn't exist.</Text>
      <TouchableOpacity style={s.btn} onPress={() => router.replace('/')}>
        <Text style={s.btnText}>Go home</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, padding: Spacing.xxl },
  code: { fontSize: 64, fontWeight: '700', color: Colors.borderMid },
  title: { fontSize: FontSizes.h2, fontWeight: '600', color: Colors.navy, marginTop: Spacing.base },
  desc: { fontSize: FontSizes.md, color: Colors.slate, marginTop: Spacing.sm, textAlign: 'center' },
  btn: { marginTop: Spacing.xl, backgroundColor: Colors.emerald, borderRadius: Radius.button, paddingHorizontal: 24, paddingVertical: 14 },
  btnText: { color: Colors.white, fontWeight: '600', fontSize: FontSizes.md },
});
