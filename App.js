import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import AsyncStorage from '@react-native-async-storage/async-storage';

const C = {
  bgGradient: ['#142B4B', '#0A1626'],
  metallicFrame: ['#E3E8F0', '#B0BCD2', '#E3E8F0'],
  innerPanel: ['#F8FAFC', '#E2E8F0'],
  navy: '#0A2540', blue: '#1D599A', darkBlue: '#0C356A', gold: '#D5AE52',
  text: '#0F2038', muted: '#5C6E84', white: '#FFFFFF', green: '#27AE60', red: '#E12D2D'
};

const NAV = ['HOME', 'CADDIE', 'MAPPER', 'SCORECARD', 'MORE'];
const PARS =;
const STORAGE = 'CADDIEOS_WORLDCLASS_V1';

export default function App() { return <SafeAreaProvider><Shell /></SafeAreaProvider>; }

function Shell() {
  const insets = useSafeAreaInsets();
  const [entered, setEntered] = useState(false);
  const [tab, setTab] = useState('HOME');
  const [units, setUnits] = useState('METRES');
  const [player, setPlayer] = useState('Player');
  const [handicap, setHandicap] = useState('');
  const [screenLocked, setScreenLocked] = useState(false);
  
  const [targets, setTargets] = useState(Array.from({ length: 18 }, () => ({ front: null, center: null, back: null })));
  const [scores, setScores] = useState(Array(18).fill(''));
  const [putts, setPutts] = useState(Array(18).fill(''));
  const [gir, setGir] = useState(Array(18).fill(false));
  const [fw, setFw] = useState(Array(18).fill(false));
  const [heard, setHeard] = useState('Tap the mic to talk to your caddie.');
  const [listening, setListening] = useState(false);

  const saveState = async () => {
    try {
      const dataStr = JSON.stringify({ units, player, handicap, targets, scores, putts, gir, fw });
      await AsyncStorage.setItem(STORAGE, dataStr);
    } catch (e) { console.warn("Sync error:", e); }
  };

  useEffect(() => { if (entered) saveState(); }, [units, player, handicap, targets, scores, putts, gir, fw]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE);
        if (raw) {
          const x = JSON.parse(raw);
          if (x.units) setUnits(x.units); if (x.player) setPlayer(x.player); if (x.handicap) setHandicap(x.handicap);
        }
      } catch {}
    })();
    Tts.setDefaultLanguage('en-AU').catch(() => {});
    Voice.onSpeechStart = () => setListening(true);
    Voice.onSpeechEnd = () => setListening(false);
    Voice.onSpeechResults = (e) => { if (e.value) setHeard(e.value); };
    Voice.onSpeechError = () => setListening(false);
    return () => { Voice.destroy().then(Voice.removeAllListeners); };
  }, []);

  return (
    <LinearGradient colors={C.bgGradient} style={styles.shellContainer}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={[styles.mainArea, { paddingTop: insets.top }]}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>DRC ELITE GOLF</Text>
          <Text style={styles.brandSubtitle}>YOUR CADDIE. YOUR GAME.</Text>
          {entered && (
            <TouchableOpacity style={styles.lockHeaderBtn} onPress={() => setScreenLocked(true)}>
              <Text style={styles.lockBtnText}>🔒 ACTIVE POCKET LOCK</Text>
            </TouchableOpacity>
          )}
        </View>

        {!entered ? (
          <ScrollView contentContainerStyle={styles.centerFlow}>
            <LinearGradient colors={C.metallicFrame} style={styles.outerBorder}>
              <LinearGradient colors={C.innerPanel} style={styles.innerContainer}>
                <Text style={styles.loginHeader}>Welcome Player</Text>
                <TextInput style={styles.inputField} placeholder="Golfer Name" placeholderTextColor={C.muted} value={player} onChangeText={setPlayer} />
                <TextInput style={styles.inputField} placeholder="Handicap Index" placeholderTextColor={C.muted} keyboardType="numeric" value={handicap} onChangeText={setHandicap} />
                <TouchableOpacity style={styles.primaryActionBtn} onPress={() => setEntered(true)}>
                  <LinearGradient colors={[C.blue, C.darkBlue]} style={styles.btnGradient}>
                    <Text style={styles.btnActionText}>LAUNCH APP DASHBOARD</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </LinearGradient>
          </ScrollView>
        ) : (
          <View style={styles.hydratedBody}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {tab === 'HOME' && (
                <LinearGradient colors={C.metallicFrame} style={styles.outerBorder}>
                  <View style={styles.innerContainer}>
                    <Text style={styles.loginHeader}>Welcome, {player}!</Text>
                    <Text style={{ color: C.text, textAlign: 'center' }}>Handicap Index: {handicap}</Text>
                  </View>
                </LinearGradient>
              )}
              {tab === 'CADDIE' && (
                <LinearGradient colors={C.metallicFrame} style={styles.outerBorder}>
                  <View style={styles.innerContainer}>
                    <Text style={styles.loginHeader}>🎙️ Caddie Listening</Text>
                    <Text style={styles.heardTerminalText}>{heard}</Text>
                  </View>
                </LinearGradient>
              )}
            </ScrollView>
            <View style={styles.tabbarFrame}>
              {NAV.map((m) => (
                <TouchableOpacity key={m} style={styles.tabBtn} onPress={() => setTab(m)}>
                  <Text style={[styles.tabBtnText, tab === m ? styles.tabActiveText : styles.tabInactiveText]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        {screenLocked && (
          <View style={StyleSheet.absoluteFill}>
            <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setScreenLocked(false)}>
              <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '900' }}>🔒 POCKET SAFE ACTIVE</Text>
              <Text style={{ color: C.gold, marginTop: 10 }}>Tap Screen to Unlock</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  shellContainer: { flex: 1 }, mainArea: { flex: 1 },
  brandContainer: { alignItems: 'center', marginVertical: 10, width: '100%' },
  brandTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: 3 },
  brandSubtitle: { fontSize: 10, fontWeight: '700', color: C.gold, letterSpacing: 1.5, marginTop: 2 },
  lockHeaderBtn: { marginTop: 6, backgroundColor: '#0A2540', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#1E3A5F' },
  lockBtnText: { color: C.gold, fontSize: 9, fontWeight: '800' },
  centerFlow: { flexGrow: 1, justifyContent: 'center', padding: 20 }, hydratedBody: { flex: 1 },
  outerBorder: { borderRadius: 18, padding: 2.5 }, innerContainer: { borderRadius: 16, padding: 18, backgroundColor: '#F8FAFC' },
  loginHeader: { fontSize: 20, fontWeight: '800', color: C.navy, textAlign: 'center', marginBottom: 12 },
  inputField: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 12, marginBottom: 14, color: '#000' },
  primaryActionBtn: { borderRadius: 12, overflow: 'hidden' }, btnGradient: { paddingVertical: 14, alignItems: 'center' },
  btnActionText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  heardTerminalText: { backgroundColor: '#FFF', padding: 16, borderRadius: 10, minHeight: 60, color: C.navy, textAlign: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  tabbarFrame: { flexDirection: 'row', backgroundColor: '#071E2D', borderTopWidth: 2, borderTopColor: '#1E3A5F', height: 60, alignItems: 'center', position: 'absolute', bottom: 0, left: 0, right: 0 },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabBtnText: { fontSize: 10, fontWeight: '800' }, tabActiveText: { color: C.gold }, tabInactiveText: { color: '#8A9EBC' }
});
