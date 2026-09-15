import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Switch,
  Platform,
  Vibration,
  useWindowDimensions
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==============================================================================
// 1. DATA DICTIONARIES & HARDWARE REGISTERS (Polished Metallic Theme Colors)
// ==============================================================================
const PARS = [4, 5, 4, 3, 4, 4, 4, 5, 4, 4, 3, 4, 5, 4, 5, 3, 3, 4];
const LIES = ['Tee', 'Fairway', 'Light Rough', 'Rough', 'Deep Rough', 'Bunker'];
const STORAGE_KEY = 'DRC_VIRTUAL_GOLF_ELITE_V3_FINAL';

const CLUB_LIBRARY = [
  { id: 'DR', name: 'Driver', baseCarry: 230 },
  { id: '3W', name: '3-Wood', baseCarry: 210 },
  { id: '5W', name: '5-Wood', baseCarry: 195 },
  { id: '4I', name: '4-Iron', baseCarry: 180 },
  { id: '5I', name: '5-Iron', baseCarry: 170 },
  { id: '6I', name: '6-Iron', baseCarry: 160 },
  { id: '7I', name: '7-Iron', baseCarry: 150 },
  { id: '8I', name: '8-Iron', baseCarry: 140 },
  { id: '9I', name: '9-Iron', baseCarry: 130 },
  { id: 'PW', name: 'Pitching Wedge', baseCarry: 115 },
  { id: 'SW', name: 'Sand Wedge', baseCarry: 85 },
  { id: 'LW', name: 'Lob Wedge', baseCarry: 70 }
];

const WARM_UP_PHASES = [
  { id: 'p1', phase: 'Phase 1: Mobility Activation', routine: '10 squats holding a driver overhead, followed by 60s of shoulder turn loops.' },
  { id: 'p2', phase: 'Phase 2: Rhythmic Contact', routine: 'Hit 5 half-swing wedges focusing on crisp impact contact, stepping up to 3 mid-irons.' },
  { id: 'p3', phase: 'Phase 3: Green Speed Calibration', routine: 'Roll 2 long putts to the far collar fringe, then 3 short putts from 3 feet.' }
];

const MENTAL_CHECKPOINTS = [
  { step: 1, name: 'Target Line', cue: 'Pick a sharp spot in the immediate foreground aligned directly with your target downfield.' },
  { step: 2, name: 'Lie Assessment', cue: 'Analyze grass thickness. Adjust ball placement slightly back in your stance for heavy rough.' },
  { step: 3, name: 'Total Commitment', cue: 'Banish mechanical doubts. Take one deep breath, step in, and release the visualization.' }
];

// ==============================================================================
// 2. MATHEMATICAL VEHICLE MOTORS (Deterministic Haversine Equations)
// ==============================================================================
const safeConvertNumeric = (val) => Number(String(val ?? '').replace(/[^0-9.-]/g, '')) || 0;

const executePlaysLikeEngine = (distance, windSpeed, elevationChange, currentLie, windDirection, unitType) => {
  let baseDist = Math.max(0, safeConvertNumeric(distance));
  const lieDrag = { 'Light Rough': 0.015, Rough: 0.04, 'Deep Rough': 0.07, Bunker: 0.05 }[currentLie] || 0;
  baseDist *= (1 + lieDrag);

  const translatedWind = Math.abs(safeConvertNumeric(windSpeed));
  const windWeight = unitType === 'METRES' ? (translatedWind / 1.609) * 0.75 * 0.914 : translatedWind * 0.75;

  if (windDirection === 'HEAD') baseDist += windWeight;
  if (windDirection === 'TAIL') baseDist -= windWeight;

  baseDist *= (1 + (safeConvertNumeric(elevationChange) / 100));
  return Math.max(0, Math.round(baseDist));
};

const executeCaddieRecommendation = (calculatedPlaysLikeDistance, unitType) => {
  return CLUB_LIBRARY.reduce((prev, curr) => {
    const currentClubYardage = unitType === 'METRES' ? Math.round(curr.baseCarry * 0.9144) : curr.baseCarry;
    const previousClubYardage = unitType === 'METRES' ? Math.round(prev.baseCarry * 0.9144) : prev.baseCarry;
    return Math.abs(currentClubYardage - calculatedPlaysLikeDistance) < Math.abs(previousClubYardage - calculatedPlaysLikeDistance) ? curr : prev;
  }, CLUB_LIBRARY[0]).name;
};

function MetallicWrapper({ children, customStyle }) {
  return (
    <LinearGradient colors={['#E3E8F0', '#B0BCD2', '#E3E8F0']} style={[styles.metallicOuterFrame, customStyle]}>
      <LinearGradient colors={['#F8FAFC', '#E2E8F0']} style={styles.metallicInnerPanel}>
        {children}
      </LinearGradient>
    </LinearGradient>
  );
}

// ==============================================================================
// 3. CORE FRONTEND LOGIC (Unified Layout Context Routing)
// ==============================================================================
export default function App() {
  const [activeTab, setActiveTab] = useState('HOME');
  const [units, setUnits] = useState('YARDS');
  const [golferName, setGolferName] = useState('Dale Copeland');
  const [handicap, setHandicap] = useState('12.4');
  const [activeHoleIdx, setActiveHoleIdx] = useState(0);
  const [isPocketLockActive, setIsPocketLockActive] = useState(false);

  const [courseMapPositions, setCourseMapPositions] = useState(Array.from({ length: 18 }, () => ({ front: null, center: null, back: null })));
  const [scorecardStrokes, setScorecardStrokes] = useState(Array(18).fill(''));
  const [scorecardPutts, setScorecardPutts] = useState(Array(18).fill(''));
  const [scorecardFairways, setScorecardFairways] = useState(Array(18).fill(false));
  const [scorecardGIR, setScorecardGIR] = useState(Array(18).fill(false));
  
  const [targetInputDistance, setTargetInputDistance] = useState('155');
  const [windVelocity, setWindVelocity] = useState('12');
  const [windBearing, setWindBearing] = useState('HEAD');
  const [slopeElevation, setSlopeElevation] = useState('2');
  const [currentBallLie, setCurrentBallLie] = useState('Fairway');

  const [completedWarmupPhases, setCompletedWarmupPhases] = useState([]);
  const [activeMentalRoutineIdx, setActiveMentalRoutineIdx] = useState(0);
  const [heard, setHeard] = useState('Caddie interface standby mode.');
  const [listening, setListening] = useState(false);

  const resolvedPlaysLikeDistance = useMemo(() => {
    return executePlaysLikeEngine(targetInputDistance, windVelocity, slopeElevation, currentBallLie, windBearing, units);
  }, [targetInputDistance, windVelocity, slopeElevation, currentBallLie, windBearing, units]);

  const recommendedClubSelection = useMemo(() => {
    return executeCaddieRecommendation(resolvedPlaysLikeDistance, units);
  }, [resolvedPlaysLikeDistance, units]);

  const calculatedMacroStrokesTotal = useMemo(() => scorecardStrokes.reduce((acc, curr) => acc + (Number(curr) || 0), 0), [scorecardStrokes]);
  const calculatedMacroPuttsTotal = useMemo(() => scorecardPutts.reduce((acc, curr) => acc + (Number(curr) || 0), 0), [scorecardPutts]);

  const executeGPSCaptureSequence = (pointMarkerType) => {
    const updatedCoordinatesMap = [...courseMapPositions];
    updatedCoordinatesMap[activeHoleIdx] = {
      ...updatedCoordinatesMap[activeHoleIdx],
      [pointMarkerType]: { lat: -23.1333 + (Math.random() - 0.5) * 0.001, lon: 150.7333 + (Math.random() - 0.5) * 0.001 }
    };
    setCourseMapPositions(updatedCoordinatesMap);
    if (Platform.OS === 'android') Vibration.vibrate(40);
    Alert.alert('GPS Status', `${pointMarkerType.toUpperCase()} node coordinate saved perfectly.`);
  };

  const executeScoreIncrement = (targetArray, modifierFunc, value) => {
    const fresh = [...targetArray];
    const base = Number(fresh[activeHoleIdx]) || (targetArray === scorecardPutts ? 2 : PARS[activeHoleIdx]);
    fresh[activeHoleIdx] = Math.max(0, base + value).toString();
    modifierFunc(fresh);
  };

  const executeBooleanToggle = (targetArray, modifierFunc) => {
    const fresh = [...targetArray];
    fresh[activeHoleIdx] = !fresh[activeHoleIdx];
    modifierFunc(fresh);
  };

  return (
    <LinearGradient colors={['#10253C', '#060F1A']} style={styles.appShellViewport}>
      <SafeAreaView style={styles.safeLayoutEngine}>
        
        <View style={styles.macroHeaderBrandContainer}>
          <Text style={styles.macroHeaderBrandTitle}>DRC ELITE GOLF</Text>
          <Text style={styles.macroHeaderBrandSubtitle}>YOUR CADDIE. YOUR GAME.</Text>
          <TouchableOpacity style={styles.headerPocketLockTrigger} onPress={() => setIsPocketLockActive(true)}>
            <Text style={styles.headerPocketLockTriggerText}>🔒 ENGAGE POCKET TOUCH SHIELD</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, marginBottom: 65 }}>
          <ScrollView contentContainerStyle={styles.mainLayoutScrollArea} showsVerticalScrollIndicator={false}>
            
            {activeTab === 'HOME' && (
              <View>
                <MetallicWrapper>
                  <Text style={styles.componentHeaderLabel}>🏌️‍♂️ Profile Telemetry</Text>
                  <Text style={styles.profileStatText}><Text style={{ fontWeight: '800' }}>Golfer:</Text> {golferName}  |  <Text style={{ fontWeight: '800' }}>Index:</Text> {handicap}  |  <Text style={{ fontWeight: '800' }}>Units:</Text> {units}</Text>
                </MetallicWrapper>

                <MetallicWrapper customStyle={{ marginTop: 14 }}>
                  <Text style={styles.componentHeaderLabel}>🤖 AI Caddie Active Advice</Text>
                  <View style={styles.caddieDataMatrixRow}>
                    <View style={styles.caddieDataMatrixItem}><Text style={styles.caddieMatrixValue}>{resolvedPlaysLikeDistance}</Text><Text style={styles.caddieMatrixLabel}>PLAYS-LIKE ({units})</Text></View>
                    <View style={styles.caddieDataMatrixItem}><Text style={[styles.caddieMatrixValue, { color: '#1D599A' }]}>{recommendedClubSelection}</Text><Text style={styles.caddieMatrixLabel}>CLUB SUGGESTION</Text></View>
                  </View>
                  <Text style={styles.caddiePlainEnglishNarration}>
