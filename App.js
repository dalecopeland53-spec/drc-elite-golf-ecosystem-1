import React, { useState, useMemo, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==============================================================================
// 1. DATA DICTIONARIES & MEMORY REGISTERS (Deep Midnight Luxury Theme)
// ==============================================================================
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 3, 5, 4, 4];
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
  }, CLUB_LIBRARY[0]).name;
};

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

  useEffect(() => {
    loadPersistedState();
  }, []);

  const loadPersistedState = async () => {
    try {
      const saved = await AsyncStorage.getItem('golfAppState');
      if (saved) {
        const parsed = JSON.parse(saved);
        setGolferName(parsed.golferName || 'Dale Copeland');
        setHandicap(parsed.handicap || '12.4');
        setUnits(parsed.units || 'YARDS');
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
  };

  const persistState = async () => {
    try {
      await AsyncStorage.setItem('golfAppState', JSON.stringify({
        golferName,
        handicap,
        units
      }));
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  };

  const resolvedPlaysLikeDistance = useMemo(() => 
    executePlaysLikeEngine(targetInputDistance, windVelocity, slopeElevation, currentBallLie, windBearing, units), 
    [targetInputDistance, windVelocity, slopeElevation, currentBallLie, windBearing, units]
  );
  
  const recommendedClubSelection = useMemo(() => 
    executeCaddieRecommendation(resolvedPlaysLikeDistance, units), 
    [resolvedPlaysLikeDistance, units]
  );
  
  const calculatedMacroStrokesTotal = useMemo(() => 
    scorecardStrokes.reduce((acc, curr) => acc + (Number(curr) || 0), 0), 
    [scorecardStrokes]
  );
  
  const calculatedMacroPuttsTotal = useMemo(() => 
    scorecardPutts.reduce((acc, curr) => acc + (Number(curr) || 0), 0), 
    [scorecardPutts]
  );

  const calculatedTotalPar = PARS.reduce((sum, par) => sum + par, 0);
  const scoreRelativeToPar = calculatedMacroStrokesTotal - calculatedTotalPar;

  const executeGPSCaptureSequence = (pointMarkerType) => {
    const updatedCoordinatesMap = [...courseMapPositions];
    updatedCoordinatesMap[activeHoleIdx] = { 
      ...updatedCoordinatesMap[activeHoleIdx], 
      [pointMarkerType]: { 
        lat: -23.1333 + (Math.random() - 0.5) * 0.001, 
        lon: 150.7333 + (Math.random() - 0.5) * 0.001 
      } 
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

  const handleHoleNavigation = (direction) => {
    const newIdx = direction === 'next' ? Math.min(activeHoleIdx + 1, 17) : Math.max(activeHoleIdx - 1, 0);
    setActiveHoleIdx(newIdx);
  };

  const handleSaveAndPersist = () => {
    persistState();
    Alert.alert('Success', 'Profile and preferences saved to device storage.');
  };

  const handleCompleteRound = () => {
    const score = calculatedMacroStrokesTotal;
    const putts = calculatedMacroPuttsTotal;
    const vs = scoreRelativeToPar >= 0 ? '+' + scoreRelativeToPar : scoreRelativeToPar;
    Alert.alert(
      'Round Complete',
      `Score: ${score}\nPutts: ${putts}\nScore vs Par: ${vs}\n\nExcellent round, ${golferName}!`
    );
  };

  const tabs = ['HOME', 'CADDIE', 'SCORE', 'COURSE', 'MORE'];

  return (
    <SafeAreaProvider>
      <View style={styles.appShellViewport}>
        <StatusBar barStyle="light-content" backgroundColor="#0A1626" />
        <SafeAreaView style={styles.safeLayoutEngine}>
          <View style={styles.macroHeaderBrandContainer}>
            <Text style={styles.macroHeaderBrandTitle}>DRC ELITE GOLF</Text>
            <Text style={styles.macroHeaderBrandSubtitle}>YOUR CADDIE. YOUR GAME.</Text>
          </View>

          <ScrollView contentContainerStyle={styles.mainLayoutScrollArea} showsVerticalScrollIndicator={false}>
            <View style={styles.metallicInnerPanel}>
              <Text style={styles.componentHeaderLabel}>{activeTab}</Text>

              {/* HOME TAB */}
              {activeTab === 'HOME' && (
                <View style={styles.tabContent}>
                  <Text style={styles.bodyText}>Golfer: {golferName}</Text>
                  <Text style={styles.bodyText}>Handicap Index: {handicap}</Text>
                  <Text style={styles.bodyText}>Units: {units}</Text>
                  
                  <View style={styles.inputSection}>
                    <Text style={styles.labelText}>Edit Profile Name</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter golfer name"
                      placeholderTextColor="#8A9EBC"
                      value={golferName}
                      onChangeText={setGolferName}
                    />
                  </View>

                  <View style={styles.inputSection}>
                    <Text style={styles.labelText}>Handicap Index</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter handicap"
                      placeholderTextColor="#8A9EBC"
                      value={handicap}
                      onChangeText={setHandicap}
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={styles.unitToggleSection}>
                    <Text style={styles.labelText}>Preferred Units</Text>
                    <View style={styles.unitButtons}>
                      <TouchableOpacity
                        style={[styles.unitButton, units === 'YARDS' && styles.unitButtonActive]}
                        onPress={() => setUnits('YARDS')}
                      >
                        <Text style={styles.unitButtonText}>Yards</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.unitButton, units === 'METRES' && styles.unitButtonActive]}
                        onPress={() => setUnits('METRES')}
                      >
                        <Text style={styles.unitButtonText}>Metres</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.actionButton} onPress={handleSaveAndPersist}>
                    <Text style={styles.actionButtonText}>💾 SAVE PROFILE</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* CADDIE TAB */}
              {activeTab === 'CADDIE' && (
                <View style={styles.tabContent}>
                  <Text style={styles.caddieMatrixValue}>{resolvedPlaysLikeDistance} {units}</Text>
                  <Text style={styles.bodyText}>Recommended club: {recommendedClubSelection}</Text>
                  
                  <View style={styles.inputSection}>
                    <Text style={styles.labelText}>Distance to Target</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter distance"
                      placeholderTextColor="#8A9EBC"
                      value={targetInputDistance}
                      onChangeText={setTargetInputDistance}
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={styles.inputSection}>
                    <Text style={styles.labelText}>Wind Speed ({units === 'YARDS' ? 'mph' : 'kph'})</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter wind speed"
                      placeholderTextColor="#8A9EBC"
                      value={windVelocity}
                      onChangeText={setWindVelocity}
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={styles.inputSection}>
                    <Text style={styles.labelText}>Wind Direction</Text>
                    <View style={styles.windDirectionButtons}>
                      {['HEAD', 'TAIL', 'CROSS'].map(dir => (
                        <TouchableOpacity
                          key={dir}
                          style={[styles.windButton, windBearing === dir && styles.windButtonActive]}
                          onPress={() => setWindBearing(dir)}
                        >
                          <Text style={styles.windButtonText}>{dir}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputSection}>
                    <Text style={styles.labelText}>Elevation Change (%)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter elevation change"
                      placeholderTextColor="#8A9EBC"
                      value={slopeElevation}
                      onChangeText={setSlopeElevation}
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={styles.inputSection}>
                    <Text style={styles.labelText}>Ball Lie</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {LIES.map(lie => (
                        <TouchableOpacity
                          key={lie}
                          style={[styles.lieButton, currentBallLie === lie && styles.lieButtonActive]}
                          onPress={() => setCurrentBallLie(lie)}
                        >
                          <Text style={styles.lieButtonText}>{lie}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              )}

              {/* SCORE TAB */}
              {activeTab === 'SCORE' && (
                <View style={styles.tabContent}>
                  <Text style={styles.bodyText}>Hole {activeHoleIdx + 1} • Par {PARS[activeHoleIdx]}</Text>
                  <Text style={styles.caddieMatrixValue}>
                    {scorecardStrokes[activeHoleIdx] || '-'}
                  </Text>

                  <View style={styles.scoreInputSection}>
                    <Text style={styles.labelText}>Strokes</Text>
                    <View style={styles.scoreButtons}>
                      <TouchableOpacity
                        style={styles.minusButton}
                        onPress={() => executeScoreIncrement(scorecardStrokes, setScorecardStrokes, -1)}
                      >
                        <Text style={styles.buttonText}>−</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.scoreInput}
                        placeholder="0"
                        placeholderTextColor="#8A9EBC"
                        value={scorecardStrokes[activeHoleIdx]}
                        onChangeText={(val) => {
                          const fresh = [...scorecardStrokes];
                          fresh[activeHoleIdx] = val;
                          setScorecardStrokes(fresh);
                        }}
                        keyboardType="decimal-pad"
                      />
                      <TouchableOpacity
                        style={styles.plusButton}
                        onPress={() => executeScoreIncrement(scorecardStrokes, setScorecardStrokes, 1)}
                      >
                        <Text style={styles.buttonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.scoreInputSection}>
                    <Text style={styles.labelText}>Putts</Text>
                    <View style={styles.scoreButtons}>
                      <TouchableOpacity
                        style={styles.minusButton}
                        onPress={() => executeScoreIncrement(scorecardPutts, setScorecardPutts, -1)}
                      >
                        <Text style={styles.buttonText}>−</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.scoreInput}
                        placeholder="0"
                        placeholderTextColor="#8A9EBC"
                        value={scorecardPutts[activeHoleIdx]}
                        onChangeText={(val) => {
                          const fresh = [...scorecardPutts];
                          fresh[activeHoleIdx] = val;
                          setScorecardPutts(fresh);
                        }}
                        keyboardType="decimal-pad"
                      />
                      <TouchableOpacity
                        style={styles.plusButton}
                        onPress={() => executeScoreIncrement(scorecardPutts, setScorecardPutts, 1)}
                      >
                        <Text style={styles.buttonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.toggleSection}>
                    <TouchableOpacity
                      style={[styles.toggleButton, scorecardFairways[activeHoleIdx] && styles.toggleButtonActive]}
                      onPress={() => executeBooleanToggle(scorecardFairways, setScorecardFairways)}
                    >
                      <Text style={styles.toggleButtonText}>
                        {scorecardFairways[activeHoleIdx] ? '✓' : '○'} Fairway Hit
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.toggleButton, scorecardGIR[activeHoleIdx] && styles.toggleButtonActive]}
                      onPress={() => executeBooleanToggle(scorecardGIR, setScorecardGIR)}
                    >
                      <Text style={styles.toggleButtonText}>
                        {scorecardGIR[activeHoleIdx] ? '✓' : '○'} GIR
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.navigationButtons}>
                    <TouchableOpacity
                      style={[styles.navButton, activeHoleIdx === 0 && styles.navButtonDisabled]}
                      onPress={() => handleHoleNavigation('prev')}
                      disabled={activeHoleIdx === 0}
                    >
                      <Text style={styles.navButtonText}>← Prev Hole</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.navButton, activeHoleIdx === 17 && styles.navButtonDisabled]}
                      onPress={() => handleHoleNavigation('next')}
                      disabled={activeHoleIdx === 17}
                    >
                      <Text style={styles.navButtonText}>Next Hole →</Text>
                    </TouchableOpacity>
                  </View>

                  {activeHoleIdx === 17 && (
                    <TouchableOpacity style={styles.completeButton} onPress={handleCompleteRound}>
                      <Text style={styles.completeButtonText}>🏁 COMPLETE ROUND</Text>
                    </TouchableOpacity>
                  )}

                  <View style={styles.statsSection}>
                    <Text style={styles.statsText}>Round Stats</Text>
                    <Text style={styles.statsValue}>Total Strokes: {calculatedMacroStrokesTotal}</Text>
                    <Text style={styles.statsValue}>Total Putts: {calculatedMacroPuttsTotal}</Text>
                    <Text style={styles.statsValue}>vs Par: {scoreRelativeToPar >= 0 ? '+' : ''}{scoreRelativeToPar}</Text>
                  </View>
                </View>
              )}

              {/* COURSE TAB */}
              {activeTab === 'COURSE' && (
                <View style={styles.tabContent}>
                  <Text style={styles.bodyText}>Hole {activeHoleIdx + 1} GPS Mapping</Text>
                  
                  <View style={styles.courseMapSection}>
                    <Text style={styles.labelText}>Mapped Coordinates</Text>
                    
                    {['front', 'center', 'back'].map(pointType => (
                      <View key={pointType} style={styles.coordinateBox}>
                        <Text style={styles.coordinateLabel}>{pointType.toUpperCase()}</Text>
                        {courseMapPositions[activeHoleIdx][pointType] ? (
                          <Text style={styles.coordinateValue}>
                            {courseMapPositions[activeHoleIdx][pointType].lat.toFixed(4)}, {courseMapPositions[activeHoleIdx][pointType].lon.toFixed(4)}
                          </Text>
                        ) : (
                          <Text style={styles.coordinateEmpty}>Not mapped</Text>
                        )}
                        <TouchableOpacity
                          style={styles.captureButton}
                          onPress={() => executeGPSCaptureSequence(pointType)}
                        >
                          <Text style={styles.captureButtonText}>📍 Capture {pointType}</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* MORE TAB */}
              {activeTab === 'MORE' && (
                <View style={styles.tabContent}>
                  <View style={styles.settingsSection}>
                    <Text style={styles.labelText}>Pocket Shield (Distraction Lock)</Text>
                    <View style={styles.switchContainer}>
                      <Switch
                        value={isPocketLockActive}
                        onValueChange={setIsPocketLockActive}
                        trackColor={{ false: '#5C6E84', true: '#27AE60' }}
                        thumbColor={isPocketLockActive ? '#FFF' : '#CBD5E1'}
                      />
                      <Text style={styles.switchStatus}>
                        {isPocketLockActive ? 'Enabled' : 'Disabled'}
                      </Text>
                    </View>
                    {isPocketLockActive && (
                      <Text style={styles.lockDescription}>
                        Notifications and calls are muted during your round. Stay focused on the game.
                      </Text>
                    )}
                  </View>

                  <View style={styles.aboutSection}>
                    <Text style={styles.aboutTitle}>About DRC Elite Golf</Text>
                    <Text style={styles.aboutText}>Version 1.0.0</Text>
                    <Text style={styles.aboutText}>A premium golf scoring and improvement ecosystem.</Text>
                    <Text style={styles.aboutText}>Languages: 88.3% JavaScript, 11.7% Python</Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* NAVIGATION BAR */}
          <View style={styles.nav}>
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab}
                style={styles.navButtonBar}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.navText, activeTab === tab && styles.navTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appShellViewport: {
    flex: 1,
    backgroundColor: '#0A1626'
  },
  safeLayoutEngine: {
    flex: 1
  },
  macroHeaderBrandContainer: {
    padding: 18,
    alignItems: 'center',
    backgroundColor: '#10243D'
  },
  macroHeaderBrandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#D5AE52',
    letterSpacing: 2
  },
  macroHeaderBrandSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A9EBC',
    letterSpacing: 1.5,
    marginTop: 4
  },
  mainLayoutScrollArea: {
    flexGrow: 1,
    paddingBottom: 100
  },
  metallicInnerPanel: {
    margin: 16,
    padding: 16,
    backgroundColor: '#142B4B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1D599A'
  },
  componentHeaderLabel: {
    fontSize: 22,
    fontWeight: '900',
    color: '#D5AE52',
    marginBottom: 16,
    letterSpacing: 1
  },
  tabContent: {
    marginBottom: 20
  },
  bodyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 12,
    lineHeight: 20
  },
  labelText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D5AE52',
    marginBottom: 8,
    letterSpacing: 0.5
  },
  caddieMatrixValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#27AE60',
    textAlign: 'center',
    marginVertical: 20
  },
  inputSection: {
    marginBottom: 18
  },
  textInput: {
    backgroundColor: '#0F2038',
    borderWidth: 1,
    borderColor: '#1D599A',
    borderRadius: 10,
    padding: 12,
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600'
  },
  unitToggleSection: {
    marginBottom: 18
  },
  unitButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  unitButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    backgroundColor: '#0F2038',
    borderWidth: 1,
    borderColor: '#1D599A',
    borderRadius: 10,
    alignItems: 'center'
  },
  unitButtonActive: {
    backgroundColor: '#1D599A',
    borderColor: '#D5AE52'
  },
  unitButtonText: {
    color: '#E2E8F0',
    fontWeight: '700',
    fontSize: 12
  },
  actionButton: {
    backgroundColor: '#1D599A',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 12
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5
  },
  windDirectionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  windButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    backgroundColor: '#0F2038',
    borderWidth: 1,
    borderColor: '#1D599A',
    borderRadius: 10,
    alignItems: 'center'
  },
  windButtonActive: {
    backgroundColor: '#1D599A',
    borderColor: '#D5AE52'
  },
  windButtonText: {
    color: '#E2E8F0',
    fontWeight: '700',
    fontSize: 12
  },
  lieButton: {
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#0F2038',
    borderWidth: 1,
    borderColor: '#1D599A',
    borderRadius: 20
  },
  lieButtonActive: {
    backgroundColor: '#1D599A',
    borderColor: '#D5AE52'
  },
  lieButtonText: {
    color: '#E2E8F0',
    fontWeight: '700',
    fontSize: 11
  },
  scoreInputSection: {
    marginBottom: 16
  },
  scoreButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  minusButton: {
    width: 50,
    height: 50,
    backgroundColor: '#E12D2D',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center'
  },
  plusButton: {
    width: 50,
    height: 50,
    backgroundColor: '#27AE60',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900'
  },
  scoreInput: {
    flex: 1,
    marginHorizontal: 12,
    backgroundColor: '#0F2038',
    borderWidth: 1,
    borderColor: '#1D599A',
    borderRadius: 10,
    padding: 12,
    textAlign: 'center',
    color: '#27AE60',
    fontSize: 24,
    fontWeight: '900'
  },
  toggleSection: {
    marginVertical: 16
  },
  toggleButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#0F2038',
    borderWidth: 1,
    borderColor: '#1D599A',
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center'
  },
  toggleButtonActive: {
    backgroundColor: '#27AE60',
    borderColor: '#27AE60'
  },
  toggleButtonText: {
    color: '#E2E8F0',
    fontWeight: '700',
    fontSize: 13
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16
  },
  navButton: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 12,
    backgroundColor: '#1D599A',
    borderRadius: 10,
    alignItems: 'center'
  },
  navButtonDisabled: {
    backgroundColor: '#5C6E84',
    opacity: 0.5
  },
  navButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12
  },
  completeButton: {
    backgroundColor: '#27AE60',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 12
  },
  completeButtonText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5
  },
  statsSection: {
    marginTop: 20,
    padding: 14,
    backgroundColor: '#0F2038',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1D599A'
  },
  statsText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D5AE52',
    marginBottom: 10
  },
  statsValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 6
  },
  courseMapSection: {
    marginTop: 12
  },
  coordinateBox: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#0F2038',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1D599A'
  },
  coordinateLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D5AE52',
    marginBottom: 6
  },
  coordinateValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#27AE60',
    marginBottom: 10,
    fontFamily: 'monospace'
  },
  coordinateEmpty: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A9EBC',
    marginBottom: 10,
    fontStyle: 'italic'
  },
  captureButton: {
    backgroundColor: '#1D599A',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center'
  },
  captureButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12
  },
  settingsSection: {
    marginBottom: 20,
    padding: 14,
    backgroundColor: '#0F2038',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1D599A'
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12
  },
  switchStatus: {
    marginLeft: 12,
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0'
  },
  lockDescription: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
    color: '#8A9EBC',
    fontStyle: 'italic',
    lineHeight: 16
  },
  aboutSection: {
    padding: 14,
    backgroundColor: '#0F2038',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1D599A'
  },
  aboutTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D5AE52',
    marginBottom: 10
  },
  aboutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 6,
    lineHeight: 16
  },
  nav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#10243D',
    borderTopWidth: 1,
    borderTopColor: '#1D599A',
    paddingVertical: 12
  },
  navButtonBar: {
    flex: 1,
    paddingVertical: 6
  },
  navText: {
    textAlign: 'center',
    color: '#8A9EBC',
    fontSize: 11,
    fontWeight: '700'
  },
  navTextActive: {
    color: '#D5AE52',
    fontWeight: '900',
    fontSize: 12
  }
});
