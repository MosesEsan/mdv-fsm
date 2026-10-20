import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function LandingNav() {
  return (
    <View style={styles.nav}>
      <View style={styles.brandRow}>
        <View style={styles.mark}><Text style={styles.markText}>J</Text></View>
        <View>
          <Text style={styles.brand}>JOBSITE</Text>
          <Text style={styles.byline}>BY MESAN DIGITAL VENTURES</Text>
        </View>
      </View>
      <Link href="/(auth)/login" asChild>
        <Pressable accessibilityRole="link" style={styles.signIn}><Text style={styles.signInText}>SIGN IN →</Text></Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { width: '100%', maxWidth: 1200, alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mark: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#dfff4f', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-3deg' }] },
  markText: { color: '#101813', fontSize: 23, fontWeight: '900' },
  brand: { color: '#f4f3eb', fontSize: 17, fontWeight: '900', letterSpacing: 2 },
  byline: { color: '#77847b', fontSize: 8, fontWeight: '700', letterSpacing: 1.2, marginTop: 2 },
  signIn: { borderWidth: 1, borderColor: '#4b594f', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 11 },
  signInText: { color: '#f4f3eb', fontWeight: '800', fontSize: 11, letterSpacing: 1.2 },
});
