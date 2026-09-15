import React, { useState, useMemo } from 'react';
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
  Vibration
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// ==============================================================================
// 1. DATA DICTIONARIES & MEMORY REGISTERS (Deep Midnight Luxury Theme)
// ==============================================================================
const PARS = [4,4,3,5,4,4,3,5,4,4,3,5,4,4,3,5,4,4];
const LIES = ['Tee', 'Fairway', 'Light Rough', 'Rough', 'Deep Rough', 'Bunker'];

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
  }, CLUB_LIBRARY).name;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('HOME');
  const [units, setUnits] = useState('YARDS');
  const [golferName] = useState('Dale Copeland');
  const [handicap] = useState('12.4');
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

  const resolvedPlaysLikeDistance = useMemo(() => executePlaysLikeEngine(targetInputDistance, windVelocity, slopeElevation, currentBallLie, windBearing, units), [targetInputDistance, windVelocity, slopeElevation, currentBallLie, windBearing, units]);
  const recommendedClubSelection = useMemo(() => executeCaddieRecommendation(resolvedPlaysLikeDistance, units), [resolvedPlaysLikeDistance, units]);
  const calculatedMacroStrokesTotal = useMemo(() => scorecardStrokes.reduce((acc, curr) => acc + (Number(curr) || 0), 0), [scorecardStrokes]);
  const calculatedMacroPuttsTotal = useMemo(() => scorecardPutts.reduce((acc, curr) => acc + (Number(curr) || 0), 0), [scorecardPutts]);

  const executeGPSCaptureSequence = (pointMarkerType) => {
    const updatedCoordinatesMap = [...courseMapPositions];
    updatedCoordinatesMap[activeHoleIdx] = { ...updatedCoordinatesMap[activeHoleIdx], [pointMarkerType]: { lat: -23.1333 + (Math.random() - 0.5) * 0.001, lon: 150.7333 + (Math.random() - 0.5) * 0.001 } };
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

  const tabs = ['HOME', 'CADDIE', 'SCORE', 'COURSE', 'MORE'];
  return (
    <SafeAreaProvider>
      <View style={styles.appShellViewport}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeLayoutEngine}>
          <View style={styles.macroHeaderBrandContainer}>
            <Text style={styles.macroHeaderBrandTitle}>DRC ELITE GOLF</Text>
            <Text style={styles.macroHeaderBrandSubtitle}>YOUR CADDIE. YOUR GAME.</Text>
          </View>
          <ScrollView contentContainerStyle={styles.mainLayoutScrollArea}>
            <View style={styles.metallicInnerPanel}>
              <Text style={styles.componentHeaderLabel}>{activeTab}</Text>
              {activeTab === 'HOME' && <Text style={styles.bodyText}>Golfer: {golferName}   Index: {handicap}   Units: {units}</Text>}
              {activeTab === 'CADDIE' && <><Text style={styles.caddieMatrixValue}>{resolvedPlaysLikeDistance} {units}</Text><Text style={styles.bodyText}>Recommended club: {recommendedClubSelection}</Text><TextInput style={styles.formInputField} keyboardType="numeric" value={targetInputDistance} onChangeText={setTargetInputDistance} /></>}
              {activeTab === 'SCORE' && <><Text style={styles.bodyText}>Hole {activeHoleIdx + 1} • Par {PARS[activeHoleIdx]}</Text><Text style={styles.caddieMatrixValue}>{scorecardStrokes[activeHoleIdx] || '-'}</Text><View style={styles.row}><TouchableOpacity style={styles.button} onPress={() => executeScoreIncrement(scorecardStrokes,setScorecardStrokes,-1)}><Text>-</Text></TouchableOpacity><TouchableOpacity style={styles.button} onPress={() => executeScoreIncrement(scorecardStrokes,setScorecardStrokes,1)}><Text>+</Text></TouchableOpacity></View><Text style={styles.bodyText}>Total {calculatedMacroStrokesTotal} • Putts {calculatedMacroPuttsTotal}</Text></>}
              {activeTab === 'COURSE' && <><Text style={styles.bodyText}>Hole {activeHoleIdx + 1} mapping</Text><TouchableOpacity style={styles.actionButton} onPress={() => executeGPSCaptureSequence('center')}><Text style={styles.actionText}>MARK GREEN CENTRE</Text></TouchableOpacity></>}
              {activeTab === 'MORE' && <><Text style={styles.bodyText}>Pocket shield: {isPocketLockActive ? 'ON' : 'OFF'}</Text><Switch value={isPocketLockActive} onValueChange={setIsPocketLockActive}/><TouchableOpacity style={styles.actionButton} onPress={() => setUnits(units === 'YARDS' ? 'METRES' : 'YARDS')}><Text style={styles.actionText}>USE {units === 'YARDS' ? 'METRES' : 'YARDS'}</Text></TouchableOpacity></>}
            </View>
          </ScrollView>
          <View style={styles.nav}>{tabs.map(tab => <TouchableOpacity key={tab} style={styles.navButton} onPress={() => setActiveTab(tab)}><Text style={[styles.navText,activeTab===tab&&styles.navTextActive]}>{tab}</Text></TouchableOpacity>)}</View>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appShellViewport:{flex:1,backgroundColor:'#0A1626'},safeLayoutEngine:{flex:1},macroHeaderBrandContainer:{padding:18,alignItems:'center',backgroundColor:'#10243D'},macroHeaderBrandTitle:{fontSize:24,fontWeight:'900',color:'#F4F6F8'},macroHeaderBrandSubtitle:{fontSize:11,fontWeight:'700',color:'#B9C4D2',letterSpacing:2},mainLayoutScrollArea:{padding:14,paddingBottom:90},metallicInnerPanel:{backgroundColor:'#E9EDF2',borderRadius:16,padding:18},componentHeaderLabel:{fontSize:18,fontWeight:'900',color:'#10243D',marginBottom:14},bodyText:{fontSize:16,color:'#17283D',marginVertical:8},caddieMatrixValue:{fontSize:34,fontWeight:'900',color:'#10243D'},formInputField:{backgroundColor:'#FFF',borderWidth:1,borderColor:'#AEB9C6',borderRadius:10,padding:12,fontSize:20,color:'#10243D',marginTop:12},row:{flexDirection:'row',gap:12,marginVertical:12},button:{backgroundColor:'#D5DCE5',padding:18,borderRadius:10,minWidth:64,alignItems:'center'},actionButton:{backgroundColor:'#123B67',padding:16,borderRadius:10,marginTop:12,alignItems:'center'},actionText:{color:'#FFF',fontWeight:'800'},nav:{position:'absolute',bottom:0,left:0,right:0,height:68,flexDirection:'row',backgroundColor:'#0E2037',borderTopWidth:1,borderTopColor:'#64748B'},navButton:{flex:1,alignItems:'center',justifyContent:'center'},navText:{fontSize:10,fontWeight:'800',color:'#9BAABC'},navTextActive:{color:'#FFFFFF'}
});
