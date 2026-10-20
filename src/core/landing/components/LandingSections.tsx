import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { fieldTools, workflow } from '../landingContent';

export function WorkflowSection() {
  const compact = useWindowDimensions().width < 760;
  return <View style={styles.lightSection}><View style={styles.sectionInner}><Text style={styles.kicker}>THE WHOLE JOB, IN ORDER</Text><Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>From first assignment to final handover.</Text><View style={[styles.workflow, compact && styles.stack]}>{workflow.map((item) => <View key={item.step} style={styles.workflowCard}><Text style={styles.step}>{item.step}</Text><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.cardText}>{item.text}</Text></View>)}</View></View></View>;
}

export function ToolsSection() {
  const compact = useWindowDimensions().width < 760;
  return <View style={styles.darkSection}><View style={styles.sectionInner}><View style={[styles.toolsHeader, compact && styles.stack]}><View><Text style={styles.kickerDark}>TOOLS THAT EARN THEIR PLACE</Text><Text style={[styles.sectionTitleDark, compact && styles.sectionTitleCompact]}>One source of truth.<Text style={styles.muted}>{'\n'}Fewer loose ends.</Text></Text></View><Text style={styles.toolsLead}>Designed around the rhythm of field work: quick to update on site, clear enough to act on in the office.</Text></View><View style={styles.grid}>{fieldTools.map(([title, text], index) => <View key={title} style={[styles.tool, compact && styles.toolCompact]}><Text style={styles.toolNumber}>{String(index + 1).padStart(2, '0')}</Text><Text style={styles.toolTitle}>{title}</Text><Text style={styles.toolText}>{text}</Text></View>)}</View></View></View>;
}

export function ClosingSection() {
  return <View style={styles.close}><View style={styles.closeRule}/><Text style={styles.closeSmall}>JOBSITE / FIELD OPERATIONS</Text><Text style={styles.closeTitle}>Keep the work moving.</Text><Text style={styles.closeText}>A focused operating system for teams who quote, schedule, visit, install, repair and deliver in the real world.</Text><Text style={styles.footer}>A MESAN DIGITAL VENTURES PRODUCT · WORKING TITLE</Text></View>;
}

const styles = StyleSheet.create({
  sectionInner: { width: '100%', maxWidth: 1200, alignSelf: 'center', paddingHorizontal: 24 }, lightSection: { backgroundColor: '#efeee5', paddingVertical: 92 }, darkSection: { backgroundColor: '#18221b', paddingVertical: 96, borderTopWidth: 1, borderTopColor: '#354239' },
  kicker: { color: '#667168', fontSize: 10, fontWeight: '900', letterSpacing: 1.6, marginBottom: 17 }, kickerDark: { color: '#dfff4f', fontSize: 10, fontWeight: '900', letterSpacing: 1.6, marginBottom: 17 },
  sectionTitle: { color: '#18221b', fontSize: 44, lineHeight: 49, fontWeight: '900', letterSpacing: -1.5, maxWidth: 690 }, sectionTitleDark: { color: '#f5f3e9', fontSize: 44, lineHeight: 49, fontWeight: '900', letterSpacing: -1.5 }, sectionTitleCompact: { fontSize: 34, lineHeight: 39 }, muted: { color: '#728077' },
  workflow: { flexDirection: 'row', marginTop: 50, borderTopWidth: 1, borderTopColor: '#c8cbc2' }, stack: { flexDirection: 'column' }, workflowCard: { flex: 1, paddingTop: 22, paddingRight: 30, paddingBottom: 24, minWidth: 210 },
  step: { color: '#879087', fontSize: 10, fontWeight: '900' }, cardTitle: { color: '#172119', fontSize: 20, fontWeight: '900', marginTop: 28 }, cardText: { color: '#626c64', fontSize: 14, lineHeight: 22, marginTop: 10 },
  toolsHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 50, alignItems: 'flex-end' }, toolsLead: { color: '#a6b0a8', fontSize: 15, lineHeight: 24, maxWidth: 370 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 58, borderTopWidth: 1, borderLeftWidth: 1, borderColor: '#3a473e' }, tool: { width: '33.333%', minWidth: 260, padding: 25, minHeight: 205, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#3a473e' }, toolCompact: { width: '100%', minWidth: 0 },
  toolNumber: { color: '#6f7d73', fontSize: 9, fontWeight: '900' }, toolTitle: { color: '#f2f1e8', fontSize: 21, fontWeight: '900', marginTop: 36 }, toolText: { color: '#98a49b', fontSize: 13, lineHeight: 21, marginTop: 9 },
  close: { backgroundColor: '#dfff4f', paddingHorizontal: 24, paddingVertical: 80, alignItems: 'center' }, closeRule: { width: 42, height: 5, borderRadius: 3, backgroundColor: '#172019', marginBottom: 24 }, closeSmall: { color: '#4a574d', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  closeTitle: { color: '#132018', fontSize: 48, fontWeight: '900', letterSpacing: -1.8, textAlign: 'center', marginTop: 18 }, closeText: { color: '#445047', fontSize: 16, lineHeight: 25, maxWidth: 630, textAlign: 'center', marginTop: 16 }, footer: { color: '#62705f', fontSize: 8, fontWeight: '900', letterSpacing: 1.2, marginTop: 58 },
});
