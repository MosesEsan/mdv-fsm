import { StyleSheet, Text, View } from 'react-native';

function MiniJob({ time, title, tone }: { time: string; title: string; tone: string }) {
  return (
    <View style={styles.job}>
      <Text style={styles.time}>{time}</Text>
      <View style={[styles.jobBar, { backgroundColor: tone }]} />
      <View style={{ flex: 1 }}><Text style={styles.jobTitle}>{title}</Text><Text style={styles.jobMeta}>Assigned · Ready</Text></View>
      <Text style={styles.arrow}>↗</Text>
    </View>
  );
}

export function JobsitePreview() {
  return (
    <View style={styles.shell}>
      <View style={styles.top}><View style={styles.dots}><View style={styles.dot}/><View style={styles.dot}/><View style={styles.dot}/></View><Text style={styles.today}>TODAY · 4 JOBS</Text></View>
      <View style={styles.body}>
        <View style={styles.rail}><Text style={styles.railMark}>J</Text><View style={styles.railLine}/><View style={styles.railLine}/><View style={styles.railLine}/></View>
        <View style={styles.content}>
          <View style={styles.headingRow}><View><Text style={styles.eyebrow}>TUESDAY, 21 OCT</Text><Text style={styles.heading}>Good morning.</Text></View><View style={styles.live}><View style={styles.liveDot}/><Text style={styles.liveText}>LIVE</Text></View></View>
          <MiniJob time="08:00" title="Kitchen installation" tone="#dfff4f" />
          <MiniJob time="11:30" title="Site measure" tone="#ff9066" />
          <MiniJob time="14:00" title="Flooring handover" tone="#75d5ff" />
          <View style={styles.footer}><Text style={styles.footerText}>12.5 HOURS LOGGED</Text><Text style={styles.footerText}>3 UPDATES TODAY</Text></View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { backgroundColor: '#f2f1e9', borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#415046', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 36, shadowOffset: { width: 0, height: 22 } },
  top: { height: 42, backgroundColor: '#202b24', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dots: { flexDirection: 'row', gap: 5 }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#526158' },
  today: { color: '#98a49c', fontSize: 8, fontWeight: '800', letterSpacing: 1.3 },
  body: { flexDirection: 'row', minHeight: 390 }, rail: { width: 54, backgroundColor: '#172019', alignItems: 'center', paddingTop: 18, gap: 16 },
  railMark: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#dfff4f', color: '#172019', textAlign: 'center', paddingTop: 4, fontWeight: '900' },
  railLine: { width: 18, height: 4, borderRadius: 2, backgroundColor: '#3d4940' },
  content: { flex: 1, padding: 22, gap: 11 }, headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  eyebrow: { color: '#768078', fontSize: 8, fontWeight: '800', letterSpacing: 1 }, heading: { color: '#152019', fontSize: 25, fontWeight: '900', marginTop: 4 },
  live: { backgroundColor: '#e2e4db', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#5aa45f' }, liveText: { color: '#526057', fontSize: 7, fontWeight: '900' },
  job: { backgroundColor: '#fff', borderRadius: 12, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#e1e2da' },
  time: { color: '#647067', fontSize: 10, fontWeight: '800', width: 34 }, jobBar: { width: 4, height: 34, borderRadius: 2 },
  jobTitle: { color: '#19231c', fontSize: 12, fontWeight: '800' }, jobMeta: { color: '#929a94', fontSize: 8, marginTop: 3 }, arrow: { color: '#5d675f', fontSize: 15 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#d9dbd3' }, footerText: { color: '#818b84', fontSize: 7, fontWeight: '900', letterSpacing: .8 },
});
