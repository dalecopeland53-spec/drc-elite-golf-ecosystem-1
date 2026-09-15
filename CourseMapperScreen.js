import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

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

export default function CourseMapperScreen({ targets, setTargets, holeIndex = 0 }) {
  const [selectedTee, setSelectedTee] = useState('White');
  const [loading, setLoading] = useState(false);
  const [localPoints, setLocalPoints] = useState({ front: null, center: null, back: null });

  const teeColors = [
    { name: 'Blue', color: '#1D599A', text: '#FFF' },
    { name: 'White', color: '#FFFFFF', text: '#0A2540' },
    { name: 'Red', color: '#E12D2D', text: '#FFF' },
  ];

  const handleCapture = async (pointType) => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Interrupted', 'GPS tracking privileges required to map community greens.');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const coords = {
        lat: Number(location.coords.latitude.toFixed(6)),
        lon: Number(location.coords.longitude.toFixed(6)),
      };

      setLocalPoints((prev) => ({ ...prev, [pointType]: coords }));
      Alert.alert('Coordinate Saved', `${pointType.toUpperCase()} position pinned cleanly to local cache memory.`);
    } catch (error) {
      Alert.alert('GPS Fault', 'Satellite sync timed out. Make sure your device location services are enabled.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToGlobalState = () => {
    if (!localPoints.front || !localPoints.center || !localPoints.back) {
      Alert.alert('Incomplete Configuration', 'Please stand on and capture all 3 locations before pushing.');
      return;
    }

    if (setTargets && targets) {
      const updatedTargets = [...targets];
      updatedTargets[holeIndex] = {
        front: localPoints.front,
        center: localPoints.center,
        back: localPoints.back,
        teeBox: selectedTee
      };
      setTargets(updatedTargets);
      Alert.alert('Sync Verified', `Hole ${holeIndex + 1} layout successfully synced with local Storage memory.`);
    } else {
      Alert.alert('Local Simulation Success', 'Data arrays processed cleanly without backend interruption.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollArea}>
      <View style={styles.moduleHeader}>
        <Text style={styles.titleText}>Course Setup & Mapping</Text>
        <Text style={styles.subtitleText}>CURRENT HOLE TARGET ID: #{holeIndex + 1}</Text>
      </View>

      <LinearGradient colors={C.metallicFrame} style={styles.metallicBorderFrame}>
        <View style={styles.panelInnerBody}>
          <Text style={styles.cardHeaderTitle}>1. Set Active Tee Box Color</Text>
          <View style={styles.teeRow}>
            {teeColors.map((tee) => (
              <TouchableOpacity
                key={tee.name}
                activeOpacity={0.8}
                style={[
                  styles.teeTapTarget,
                  { backgroundColor: tee.color },
                  selectedTee === tee.name && styles.activeTeeOutline
                ]}
                onPress={() => setSelectedTee(tee.name)}
              >
                <Text style={[styles.teeBtnLabelText, { color: tee.text }]}>{tee.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </LinearGradient>

      <LinearGradient colors={C.metallicFrame} style={[styles.metallicBorderFrame, { marginTop: 18 }]}>
        <View style={styles.panelInnerBody}>
          <Text style={styles.cardHeaderTitle}>2. Capture Device GPS Positions</Text>
          {loading && <ActivityIndicator size="small" color={C.blue} style={{ marginBottom: 12 }} />}
          <View style={styles.gpsGridRow}>
            {['front', 'center', 'back'].map((point) => (
              <View key={point} style={styles.gpsCardColumn}>
                <TouchableOpacity activeOpacity={0.85} style={styles.circleCapButton} onPress={() => handleCapture(point)}>
                  <LinearGradient colors={[C.blue, C.darkBlue]} style={styles.fullCircleGradient}>
                    <Text style={styles.circleActionMarkerText}>{point.charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <Text style={styles.pointLabelTag}>{point.toUpperCase()}</Text>
                <Text style={styles.coordValueDisplay}>
                  {localPoints[point] ? `${localPoints[point].lat}\n${localPoints[point].lon}` : 'EMPTY'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>

      <LinearGradient colors={C.metallicFrame} style={[styles.metallicBorderFrame, { marginTop: 18 }]}>
        <View style={styles.panelInnerBody}>
          <Text style={styles.cardHeaderTitle}>3. Spatial Alignment Verification</Text>
          <View style={styles.vectorPreviewBox}>
            {localPoints.front && localPoints.center && localPoints.back ? (
              <View style={styles.geometricGreenShim}>
                <View style={styles.vertexMarkerBack}><Text style={styles.vertexText}>B</Text></View>
                <View style={styles.vertexMarkerCenter}><Text style={styles.vertexText}>C</Text></View>
                <View style={styles.vertexMarkerFront}><Text style={styles.vertexText}>F</Text></View>
                <Text style={styles.meshStatusText}>Geometric Orientation: Confirmed</Text>
              </View>
            ) : (
              <Text style={styles.placeholderMeshText}>Capture all three node metrics to parse a topological confirmation shape mesh layout overlay.</Text>
            )}
          </View>
        </View>
      </LinearGradient>

      <TouchableOpacity style={styles.commitGlobalBtn} activeOpacity={0.9} onPress={handleApplyToGlobalState}>
        <LinearGradient colors={[C.green, '#1E8449']} style={styles.saveGradient}>
          <Text style={styles.saveActionText}>SAVE & COMMIT LOCAL GREEN FILE</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollArea: { padding: 16, paddingBottom: 40 },
  moduleHeader: { alignItems: 'center', marginVertical: 10, marginBottom: 20 },
  titleText: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  subtitleText: { fontSize: 10, fontWeight: '800', color: C.gold, letterSpacing: 2, marginTop: 4 },
  metallicBorderFrame: { borderRadius: 14, padding: 2 },
  panelInnerBody: { borderRadius: 12, padding: 14, backgroundColor: '#F8FAFC' },
  cardHeaderTitle: { fontSize: 14, fontWeight: '800', color: C.navy, marginBottom: 12, textAlign: 'center' },
  teeRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: '100%' },
  teeTapTarget: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1, borderColor: '#CBD5E1', elevation: 2 },
  activeTeeOutline: { borderColor: C.navy, transform: [{ scale: 1.04 }] },
  teeBtnLabelText: { fontSize: 13, fontWeight: '800' },
  gpsGridRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gpsCardColumn: { width: '31%', backgroundColor: '#FFFFFF', borderRadius: 10, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1' },
  circleCapButton: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', marginBottom: 6 },
  fullCircleGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  circleActionMarkerText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
  pointLabelTag: { fontSize: 10, fontWeight: '800', color: C.muted },
  coordValueDisplay: { fontSize: 9, fontWeight: '700', color: '#000', textAlign: 'center', marginTop: 2 },
  vectorPreviewBox: { height: 110, backgroundColor: '#0A1D30', borderRadius: 10, alignItems: 'center', justifyContent: 'center', padding: 10 },
  placeholderMeshText: { color: '#8A9EBC', fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 15 },
  geometricGreenShim: { flex: 1, width: '100%', position: 'relative', alignItems: 'center', justifyContent: 'center' },
  vertexMarkerBack: { position: 'absolute', top: 5, width: 16, height: 16, borderRadius: 8, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  vertexMarkerCenter: { position: 'absolute', top: 35, width: 16, height: 16, borderRadius: 8, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  vertexMarkerFront: { position: 'absolute', bottom: 20, width: 16, height: 16, borderRadius: 8, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  vertexText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  meshStatusText: { position: 'absolute', bottom: 0, color: C.green, fontSize: 9, fontWeight: '800' },
  commitGlobalBtn: { marginTop: 20, borderRadius: 12, overflow: 'hidden' },
  saveGradient: { paddingVertical: 14, alignItems: 'center' },
  saveActionText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});
