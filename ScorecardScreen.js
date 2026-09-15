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

const PARS =;

export default function ScorecardScreen({ scores, setScores, putts, setPutts, gir, setGir, fw, setFw }) {
  const [activeHoleIdx, setActiveHoleIdx] = useState(0);

  const localScores = scores || Array(18).fill('');
  const localPutts = putts || Array(18).fill('');
  const localGir = gir || Array(18).fill(false);
  const localFw = fw || Array(18).fill(false);

  const currentStrokeCount = Number(localScores[activeHoleIdx]) || PARS[activeHoleIdx];
  const currentPuttCount = Number(localPutts[activeHoleIdx]) || 2;

  const updateMetric = (type, val) => {
    if (type === 'strokes') {
      const updated = [...localScores];
      updated[activeHoleIdx] = Math.max(1, currentStrokeCount + val).toString();
      if (setScores) setScores(updated);
    } else if (type === 'putts') {
      const updated = [...localPutts];
      updated[activeHoleIdx] = Math.max(0, currentPuttCount + val).toString();
      if (setPutts) setPutts(updated);
    }
  };

  const toggleStat = (type) => {
    if (type === 'gir' && setGir) {
      const updated = [...localGir];
      updated[activeHoleIdx] = !updated[activeHoleIdx];
      setGir(updated);
    } else if (type === 'fw' && setFw) {
      const updated = [...localFw];
      updated[activeHoleIdx] = !updated[activeHoleIdx];
      setFw(updated);
    }
  };

  const totalStrokes = localScores.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  const totalPutts = localPutts.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  const holesPlayed = localScores.filter(Boolean).length;

  return (
    <View style={styles.container}>
      <View style={styles.statsSummaryRibbon}>
        <View style={styles.summaryItem}><Text style={styles.summaryValue}>{totalStrokes || '—'}</Text><Text style={styles.summaryLabel}>STROKES</Text></View>
        <View style={styles.summaryItem}><Text style={styles.summaryValue}>{totalPutts || '—'}</Text><Text style={styles.summaryLabel}>PUTTS</Text></View>
        <View style={styles.summaryItem}><Text style={styles.summaryValue}>{holesPlayed}/18</Text><Text style={styles.summaryLabel}>PLAYED</Text></View>
      </View>

      <View style={styles.horizontalScrollFrame}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.holeScroller}>
          {PARS.map((par, idx) => {
            const isSelected = activeHoleIdx === idx;
            const isLogged = localScores[idx] !== '';
            return (
              <TouchableOpacity 
                key={idx} 
                activeOpacity={0.8}
                style={[styles.holeTab, isSelected && styles.activeHoleTab, !isSelected && isLogged && styles.loggedHoleTab]}
                onPress={() => setActiveHoleIdx(idx)}
              >
                <Text style={[styles.holeTabText, isSelected ? styles.textWhite : styles.textNavy]}>H{idx + 1}</Text>
                <Text style={[styles.holeTabParSub, isSelected ? styles.textGold : styles.textMuted]}>P{par}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.mainScrollBody}>
        <LinearGradient colors={C.metallicFrame} style={styles.metallicBorderFrame}>
          <View style={styles.panelInnerBody}>
            <Text style={styles.focusedHoleLabel}>HOLE {activeHoleIdx + 1} SETUP (PAR {PARS[activeHoleIdx]})</Text>

            <View style={styles.controlCounterRow}>
              <Text style={styles.controlMetricTitle}>Strokes</Text>
              <View style={styles.counterControlCluster}>
                <TouchableOpacity style={styles.mathCircleBtn} onPress={() => updateMetric('strokes', -1)}>
                  <Text style={styles.mathSymbol}>-</Text>
                </TouchableOpacity>
                <Text style={styles.counterValueDisplay}>{currentStrokeCount}</Text>
                <TouchableOpacity style={styles.mathCircleBtn} onPress={() => updateMetric('strokes', 1)}>
                  <Text style={styles.mathSymbol}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.controlCounterRow, { marginTop: 14 }]}>
              <Text style={styles.controlMetricTitle}>Putts</Text>
              <View style={styles.counterControlCluster}>
                <TouchableOpacity style={styles.mathCircleBtn} onPress={() => updateMetric('putts', -1)}>
                  <Text style={styles.mathSymbol}>-</Text>
                </TouchableOpacity>
                <Text style={styles.counterValueDisplay}>{currentPuttCount}</Text>
                <TouchableOpacity style={styles.mathCircleBtn} onPress={() => updateMetric('putts', 1)}>
                  <Text style={styles.mathSymbol}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>

        <LinearGradient colors={C.metallicFrame} style={[styles.metallicBorderFrame, { marginTop: 16 }]}>
          <View style={styles.panelInnerBody}>
            <Text style={styles.cardSectionLabel}>Fairway & Green Tracking</Text>
            <View style={styles.toggleRowSplit}>
              <TouchableOpacity 
                activeOpacity={0.8} 
                style={[styles.statToggleCard, localFw[activeHoleIdx] && styles.activeGreenToggle]}
                onPress={() => toggleStat('fw')}
              >
                <Text style={[styles.toggleCardLabel, localFw[activeHoleIdx] ? styles.textWhite : styles.textNavy]}>⛳ Fairway</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.8} 
                style={[styles.statToggleCard, localGir[activeHoleIdx] && styles.activeGreenToggle]}
                onPress={() => toggleStat('gir')}
              >
                <Text style={[styles.toggleCardLabel, localGir[activeHoleIdx] ? styles.textWhite : styles.textNavy]}>🎯 GIR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        <TouchableOpacity 
          style={styles.nextHoleActionBtn} 
          activeOpacity={0.9} 
          onPress={() => {
            if (activeHoleIdx < 17) {
              setActiveHoleIdx(prev => prev + 1);
            } else {
              Alert.alert('Complete', 'All 18 holes tracked!');
            }
          }}
        >
          <LinearGradient colors={[C.blue, C.darkBlue]} style={styles.actionGradient}>
            <Text style={styles.actionBtnLabel}>{activeHoleIdx < 17 ? 'NEXT HOLE' : 'SAVE SCORECARD'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statsSummaryRibbon: { flexDirection: 'row', backgroundColor: '#071E2D', paddingVertical: 10, justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 16, fontWeight: '900', color: C.gold },
  summaryLabel: { fontSize: 9, fontWeight: '700', color: '#8A9EBC', marginTop: 2 },
  horizontalScrollFrame: { backgroundColor: '#0A2540', paddingVertical: 8 },
  holeScroller: { paddingHorizontal: 10 },
  holeTab: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#142B4B', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  activeHoleTab: { backgroundColor: C.blue, borderWidth: 1, borderColor: C.white },
  loggedHoleTab: { borderWidth: 1, borderColor: C.gold },
  holeTabText: { fontSize: 13, fontWeight: '900' },
  holeTabParSub: { fontSize: 9, fontWeight: '700', marginTop: 1 },
  textWhite: { color: '#FFF' }, textNavy: { color: C.navy }, textGold: { color: C.gold }, textMuted: { color: '#8A9EBC' },
  mainScrollBody: { padding: 16 }, metallicBorderFrame: { borderRadius: 14, padding: 2 },
  panelInnerBody: { borderRadius: 12, padding: 14, backgroundColor: '#F8FAFC' },
  focusedHoleLabel: { fontSize: 12, fontWeight: '800', color: C.muted, textAlign: 'center', marginBottom: 12 },
  controlCounterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1' },
  controlMetricTitle: { fontSize: 15, fontWeight: '800', color: C.navy },
  counterControlCluster: { flexDirection: 'row', alignItems: 'center' },
  mathCircleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#CBD5E1' },
  mathSymbol: { fontSize: 18, fontWeight: '700', color: C.darkBlue },
  counterValueDisplay: { fontSize: 20, fontWeight: '900', color: C.navy, width: 40, textAlign: 'center' },
  cardSectionLabel: { fontSize: 13, fontWeight: '800', color: C.navy, marginBottom: 10, textAlign: 'center' },
  toggleRowSplit: { flexDirection: 'row', justifyContent: 'space-between' },
  statToggleCard: { width: '48%', backgroundColor: '#FFF', paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1' },
  activeGreenToggle: { backgroundColor: C.green, borderColor: C.green },
  toggleCardLabel: { fontSize: 12, fontWeight: '800' },
  nextHoleActionBtn: { marginTop: 16, borderRadius: 12, overflow: 'hidden' },
  actionGradient: { paddingVertical: 14, alignItems: 'center' },
  actionBtnLabel: { color: '#FFF', fontWeight: '900', fontSize: 13 }
});
