import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { JobsitePreview } from './JobsitePreview';

export function LandingHero() {
  const { width } = useWindowDimensions();
  const compact = width < 820;
  return (
    <View style={[styles.hero, compact && styles.heroCompact]}>
      <View style={styles.copy}>
        <View style={styles.pill}><View style={styles.pillDot}/><Text style={styles.pillText}>FIELD SERVICE, WITHOUT THE FRICTION</Text></View>
        <Text style={[styles.title, compact && styles.titleCompact]}>RUN THE JOB.<Text style={styles.titleAccent}>{'\n'}NOT THE PAPERWORK.</Text></Text>
        <Text style={styles.lead}>Jobsite keeps schedules, job records, site photos, time and extra work in one calm place—so the office and the field stay in step.</Text>
        <View style={styles.actions}>
          <Link href="/(auth)/login" asChild><Pressable style={styles.primary}><Text style={styles.primaryText}>OPEN JOBSITE →</Text></Pressable></Link>
          <Text style={styles.note}>Built for practical teams who would rather be doing the work.</Text>
        </View>
      </View>
      <View style={styles.preview}><JobsitePreview /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', maxWidth: 1200, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 74, paddingBottom: 94, flexDirection: 'row', alignItems: 'center', gap: 64 },
  heroCompact: { flexDirection: 'column', paddingTop: 45, gap: 54 }, copy: { flex: 1.03, alignItems: 'flex-start' }, preview: { flex: .97, width: '100%' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#3f4e44', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 26 },
  pillDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#dfff4f' }, pillText: { color: '#94a096', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: '#f5f3e9', fontSize: 64, lineHeight: 64, fontWeight: '900', letterSpacing: -2.8 }, titleCompact: { fontSize: 43, lineHeight: 45, letterSpacing: -1.8 },
  titleAccent: { color: '#dfff4f' }, lead: { color: '#a9b1aa', fontSize: 18, lineHeight: 29, maxWidth: 580, marginTop: 28 },
  actions: { marginTop: 34, gap: 15, alignItems: 'flex-start' }, primary: { backgroundColor: '#dfff4f', borderRadius: 10, paddingHorizontal: 22, paddingVertical: 16 },
  primaryText: { color: '#162019', fontSize: 12, fontWeight: '900', letterSpacing: 1 }, note: { color: '#77847b', fontSize: 11, maxWidth: 330, lineHeight: 17 },
});
