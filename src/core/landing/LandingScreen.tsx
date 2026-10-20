import { ScrollView, StyleSheet, View } from 'react-native';
import { LandingHero } from './components/LandingHero';
import { LandingNav } from './components/LandingNav';
import { ClosingSection, ToolsSection, WorkflowSection } from './components/LandingSections';

export function LandingScreen() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.heroArea}>
        <LandingNav />
        <LandingHero />
      </View>
      <WorkflowSection />
      <ToolsSection />
      <ClosingSection />
    </ScrollView>
  );
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: '#111914' }, content: { flexGrow: 1 }, heroArea: { backgroundColor: '#111914' } });
