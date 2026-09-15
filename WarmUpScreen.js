import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const C = {
  bgGradient: ['#142B4B', '#0A1626'],
  metallicFrame: ['#E3E8F0', '#B0BCD2', '#E3E8F0'],
  innerPanel: ['#F8FAFC', '#E2E8F0'],
  navy: '#0A2540',
  blue: '#1D599A',
  darkBlue: '#0C356A',
  gold: '#D5AE52',
  text: '#0F2038',
  muted: '#5C6E84',
  white: '#FFFFFF',
  green: '#27AE60',
  red: '#E12D2D'
};

const PHASES = [
  { id: 1, title: 'Phase 1: Stretch & Mobility', detail: 'Perform 10 bodyweight squats using your driver for horizontal stability, followed by 60 seconds of gentle torso rotations.' },
  { id: 2, title: 'Phase 2: Swing Tempo Build', detail: 'Settle into rhythm with 5 relaxed half-wedge shots. Build up tempo naturally by hitting 3 smooth mid-irons.' },
  { id: 3, title: 'Phase 3: Green Speed Calibration', detail: 'Hit 2 continuous lag putts across the length of the green to the fringe. Finish with 3 short putts inside a 3-foot radius circle.' }
];

export default function WarmUpScreen() {
  const [completedPhases, setCompletedPhases] = useState([]);
  const [adviceOnly, setAdviceOnly] = useState(false);

  const togglePhase = (id) => {
    if (completedPhases.includes(id)) {
      setCompletedPhases(prev => prev.filter(phaseId => phaseId !== id));
    } else {
      setCompletedPhases(prev => [...prev, id]);
    }
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView contentContainerStyle={styles.scrollArea}>
        
        {/* Module Header Banner */}
        <View style={styles.moduleHeader}>
          <Text style={styles.titleText}>Pre-Round Prep Tracker</Text>
          <Text style={styles.subtitleText}>STREAMLINED COMMUNITY CONDITIONING</Text>
        </View>

        {/* 1. Advice Only Strategic Configuration Module Toggle */}
        <LinearGradient colors={C.metallicFrame} style={styles.metallicBorderFrame}>
          <View style={styles.panelInnerBody}>
            <View style={styles.toggleRowSplit}>
              <View style={styles.textColumn}>
                <Text style={styles.toggleLabelTitle}>Advice Only Execution Mode</Text>
                <Text style={styles.toggleLabelDesc}>Mutes strict checking grids to display strategic tempo cue tips instead.</Text>
              </View>
              <TouchableOpacity 
                activeOpacity={0.8}
                style={[styles.customToggleSwitch, adviceOnly && styles.toggleSwitchActive]}
                onPress={() => setAdviceOnly(!adviceOnly)}
              >
                <View style={[styles.toggleThumb, adviceOnly && styles.toggleThumbRight]} />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* 2. Dynamic Operational Content Switching Cards */}
        {adviceOnly ? (
          <LinearGradient colors={C.metallicFrame} style={[styles.metallicBorderFrame, { marginTop: 16 }]}>
            <View style={[styles.panelInnerBody, { backgroundColor: '#0A2540' }]}>
              <Text style={[styles.cardHeaderTitle, { color: C.gold }]}>🤖 CaddieOS Mental Focus Prompts</Text>
              <Text style={styles.adviceContextText}>
                "The target score today doesn't matter. Focus purely on hitting the center of your clubface during warmups, relax your grip pressure down to a 4 out of 10, and pick clear targets down the range field line."
              </Text>
            </View>
          </LinearGradient>
        ) : (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.sectionTitleLabel}>Physical Activation Sequence</Text>
            
            {PHASES.map((phase) => {
              const isDone = completedPhases.includes(phase.id);
              return (
                <TouchableOpacity 
                  key={phase.id}
                  activeOpacity={0.9}
                  style={styles.cardTouchWrapper}
                  onPress={() => togglePhase(phase.id)}
                >
                  <LinearGradient colors={C.metallicFrame} style={styles.rowBorderFrame}>
                    <View style={styles.rowInnerBody}>
                      <View style={styles.rowFlexLayout}>
                        
                        {/* High Contrast Custom Checked Indicators */}
                        <View style={[styles.checkboxMetric, isDone && styles.checkboxActive]}>
                          {isDone && <Text style={styles.checkMarkSymbol}>✓</Text>}
                        </View>
                        
                        <View style={styles.textColumn}>
                          <Text style={[styles.phaseTitleText, isDone && styles.textCrossedOut]}>{phase.title}</Text>
                          <Text style={[styles.phaseDetailText, isDone && styles.textCrossedOut]}>{phase.detail}</Text>
                        </View>

                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Complete Verification Routine Trigger Button */}
        {!adviceOnly && (
          <TouchableOpacity 
            style={styles.actionBtnContainer}
            activeOpacity={0.9}
            onPress={() => {
              if (completedPhases.length === PHASES.length) {
                Alert.alert('Activation Ready', 'Warmup routines successfully cataloged. Head over to the first tee box, turn on your pocket safety lock shield, and hit your target lines!');
              } else {
                Alert.alert('Incomplete Sequence', 'Please finalize checking off your remaining mobility or speed phases before heading out.');
              }
            }}
          >
            <LinearGradient colors={[C.blue, C.darkBlue]} style={styles.actionGradient}>
              <Text style={styles.actionBtnLabelText}>VERIFY PRE-ROUND MOBILITY FILE</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  scrollArea: { padding: 16, paddingBottom: 40 },
  moduleHeader: { alignItems: 'center', marginVertical: 10, marginBottom: 20 },
  titleText: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  subtitleText: { fontSize: 10, fontWeight: '800', color: C.gold, letterSpacing: 2, marginTop: 4 },
  metallicBorderFrame: { borderRadius: 14, padding: 2 },
  panelInnerBody: { borderRadius: 12, padding: 14, backgroundColor: '#F8FAFC' },
  toggleRowSplit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  textColumn: { flex: 1, paddingRight: 12 },
  toggleLabelTitle: { fontSize: 15, fontWeight: '800', color: C.navy },
  toggleLabelDesc: { fontSize: 12, fontWeight: '600', color: C.muted, marginTop: 2, lineHeight: 16 },
  customToggleSwitch: { width: 50, height: 28, borderRadius: 14, backgroundColor: '#CBD5E1', padding: 2, justifyContent: 'center' },
  toggleSwitchActive: { backgroundColor: C.green },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF', elevation: 2 },
  toggleThumbRight: { alignSelf: 'flex-end' },
  sectionTitleLabel: { fontSize: 13, fontWeight: '800', color: '#FFF', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  cardTouchWrapper: { marginBottom: 12 },
  rowBorderFrame: { borderRadius: 14, padding: 2 },
  rowInnerBody: { borderRadius: 12, padding: 12, backgroundColor: '#F8FAFC' },
  rowFlexLayout: { flexDirection: 'row', alignItems: 'center' },
  checkboxMetric: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: C.blue, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: '#FFF' },
  checkboxActive: { backgroundColor: C.green, borderColor: C.green },
  checkMarkSymbol: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  phaseTitleText: { fontSize: 14, fontWeight: '800', color: C.navy },
  phaseDetailText: { fontSize: 12, fontWeight: '600', color: C.muted, marginTop: 2, lineHeight: 16 },
  textCrossedOut: { textDecorationLine: 'line-through', color: C.muted },
  cardHeaderTitle: { fontSize: 15, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  adviceContextText: { color: '#8A9EBC', fontSize: 13, fontWeight: '600', fontStyle: 'italic', textAlign: 'center', lineHeight: 20 },
  actionBtnContainer: { marginTop: 16, borderRadius: 12, overflow: 'hidden' },
  actionGradient: { paddingVertical: 14, alignItems: 'center' },
  actionBtnLabelText: { color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 }
});
