import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useShlokaRecorder } from '../hooks/useShlokaRecorder';
import { useSyllableHighlight, PlaybackSpeed } from '../hooks/useSyllableHighlight';
import { shlokas, submitFullAttempt } from '../services/gitaCoachService';
import { shlokaAudioAssets } from '../constants/shlokaAudio';
import { CoachFeedback, Shloka } from '../types';
import SyllableTiles from '../components/SyllableTiles';
import CoachFeedbackCard from '../components/CoachFeedbackCard';

type ErrorKind = 'mic_denied' | 'no_speech' | 'api_error' | null;

const ERROR_MESSAGES: Record<Exclude<ErrorKind, null>, string> = {
  mic_denied: 'Allow microphone access in your device settings to record your recitation.',
  no_speech: "We didn't hear anything — check your microphone and try again.",
  api_error: 'Coach unavailable — try again.',
};

export default function GitaCoachScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { user } = useUser();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [selectedShloka, setSelectedShloka] = useState<Shloka>(shlokas[0]);
  const audioSource = shlokaAudioAssets[selectedShloka.id] ?? null;
  const { isPlaying, activeSyllable, speed, play, playSyllable, pause, setSpeed } = useSyllableHighlight(selectedShloka, audioSource);
  const onSyllablePress = audioSource ? playSyllable : undefined;

  const recorder = useShlokaRecorder();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<ErrorKind>(null);
  const [feedback, setFeedback] = useState<CoachFeedback | null>(null);

  const waveAnim = useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    if (!recorder.isRecording) {
      waveAnim.setValue(0.4);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, { toValue: 1, duration: 350, useNativeDriver: false }),
        Animated.timing(waveAnim, { toValue: 0.3, duration: 350, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [recorder.isRecording, waveAnim]);

  const resetAttempt = () => {
    setFeedback(null);
    setError(null);
  };

  const selectShloka = (shloka: Shloka) => {
    if (shloka.id === selectedShloka.id) return;
    setSelectedShloka(shloka);
    resetAttempt();
  };

  const handleListen = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handlePressIn = async () => {
    resetAttempt();
    const result = await recorder.start();
    if (!result.ok) {
      setError('mic_denied');
    }
  };

  const handlePressOut = async () => {
    if (!recorder.isRecording) return;
    setIsProcessing(true);

    const recorded = await recorder.stop();
    if (!recorded) {
      setError('api_error');
      setIsProcessing(false);
      return;
    }

    const outcome = await submitFullAttempt(user.id, selectedShloka, recorded);
    setIsProcessing(false);

    if (!outcome.ok) {
      setError(outcome.errorKind);
      return;
    }

    setFeedback(outcome.feedback);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.progressButton}
          onPress={() => navigation.navigate('GitaCoachProgress')}
          activeOpacity={0.85}
        >
          <Ionicons name="stats-chart" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gita Warriors</Text>
        <Text style={styles.headerSubtitle}>Shloka Pronunciation Coach</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.selectorRow}
          contentContainerStyle={{ gap: 10 }}
        >
          {shlokas.map((shloka) => {
            const active = shloka.id === selectedShloka.id;
            return (
              <TouchableOpacity
                key={shloka.id}
                style={[styles.selectorChip, active && styles.selectorChipActive]}
                onPress={() => selectShloka(shloka)}
                activeOpacity={0.85}
              >
                <Text style={[styles.selectorChipText, active && styles.selectorChipTextActive]}>
                  {shloka.reference}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={styles.practiceButton}
          onPress={() => navigation.navigate('GitaCoachPractice', { shlokaId: selectedShloka.id })}
          activeOpacity={0.85}
        >
          <Ionicons name="school-outline" size={20} color={colors.accentText} />
          <Text style={styles.practiceButtonText}>Practice step-by-step</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.accentText} />
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.shlokaTitle}>{selectedShloka.title}</Text>
          <Text style={styles.devanagari}>{selectedShloka.devanagari}</Text>
          <Text style={styles.roman}>{selectedShloka.roman}</Text>
          <Text style={styles.meaning}>{selectedShloka.meaning}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Pronunciation Guide</Text>
          <SyllableTiles
            syllables={selectedShloka.syllables}
            activeSyllable={activeSyllable}
            onSyllablePress={onSyllablePress}
          />
          <View style={styles.tipBox}>
            <Ionicons name="bulb-outline" size={18} color={colors.text} />
            <Text style={styles.tipText}>{selectedShloka.tip}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Listen</Text>
          {audioSource ? (
            <>
              <TouchableOpacity style={styles.listenButton} onPress={handleListen} activeOpacity={0.85}>
                <Ionicons name={isPlaying ? 'volume-high' : 'play'} size={20} color={colors.accentText} />
                <Text style={styles.listenButtonText}>{isPlaying ? 'Playing...' : 'Play authentic audio'}</Text>
              </TouchableOpacity>
              <View style={styles.speedRow}>
                {([1, 0.75, 0.5] as PlaybackSpeed[]).map((rate) => (
                  <TouchableOpacity
                    key={rate}
                    style={[styles.speedChip, speed === rate && styles.speedChipActive]}
                    onPress={() => setSpeed(rate)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.speedChipText, speed === rate && styles.speedChipTextActive]}>
                      {rate === 1 ? '1x' : `${rate}x`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.audioComingSoon}>
              <Ionicons name="mic-off-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.audioComingSoonText}>
                Audio coming soon — the project team hasn't added a recording for this shloka yet.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Your Turn</Text>
          <Text style={styles.recordHint}>
            {recorder.isRecording
              ? 'Recording — release to submit'
              : isProcessing
              ? 'Analysing your recitation...'
              : 'Hold the button and recite the shloka'}
          </Text>

          <View style={styles.recordArea}>
            {recorder.isRecording && (
              <View style={styles.waveform}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.waveBar,
                      {
                        height: waveAnim.interpolate({
                          inputRange: [0.3, 1],
                          outputRange: [8, 32 - i * 2],
                        }),
                      },
                    ]}
                  />
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.recordButton, recorder.isRecording && styles.recordButtonActive]}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={isProcessing}
              activeOpacity={0.85}
            >
              {isProcessing ? (
                <ActivityIndicator color={colors.accentText} />
              ) : (
                <Ionicons name="mic" size={30} color={colors.accentText} />
              )}
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{ERROR_MESSAGES[error]}</Text>
            </View>
          )}
        </View>

        {feedback && <CoachFeedbackCard feedback={feedback} onTryAgain={resetAttempt} />}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
    backButton: {
      position: 'absolute',
      left: 20,
      top: 60,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
    progressButton: {
      position: 'absolute',
      right: 20,
      top: 60,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
    headerTitle: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
    headerSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
    scrollView: { flex: 1, paddingHorizontal: 20 },
    selectorRow: { marginBottom: 16 },
    selectorChip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectorChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    selectorChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    selectorChipTextActive: { color: colors.accentText },
    practiceButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 14,
      marginBottom: 16,
    },
    practiceButtonText: { color: colors.accentText, fontWeight: '700', fontSize: 15 },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 18,
      marginBottom: 16,
    },
    shlokaTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 10 },
    devanagari: {
      fontSize: 22,
      lineHeight: 34,
      color: colors.text,
      fontFamily: 'serif',
      marginBottom: 10,
    },
    roman: { fontSize: 15, lineHeight: 22, color: colors.textSecondary, fontStyle: 'italic', marginBottom: 12 },
    meaning: { fontSize: 14, lineHeight: 20, color: colors.text },
    sectionLabel: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 },
    tipBox: {
      flexDirection: 'row',
      gap: 10,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 12,
      padding: 12,
      marginTop: 10,
      alignItems: 'flex-start',
    },
    tipText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.text },
    listenButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 14,
    },
    listenButtonText: { color: colors.accentText, fontWeight: '700', fontSize: 15 },
    speedRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    speedChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    speedChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    speedChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    speedChipTextActive: { color: colors.accentText },
    audioComingSoon: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      backgroundColor: colors.surfaceAlt,
      borderRadius: 12,
      padding: 12,
    },
    audioComingSoonText: { flex: 1, fontSize: 13, color: colors.textSecondary },
    recordHint: { fontSize: 13, color: colors.textSecondary, marginBottom: 16, textAlign: 'center' },
    recordArea: { alignItems: 'center', justifyContent: 'center', gap: 14 },
    waveform: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 32 },
    waveBar: { width: 5, borderRadius: 3, backgroundColor: colors.accent },
    recordButton: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recordButtonActive: { backgroundColor: colors.danger },
    errorBanner: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'flex-start',
      backgroundColor: colors.surfaceAlt,
      borderRadius: 12,
      padding: 12,
      marginTop: 16,
    },
    errorText: { flex: 1, fontSize: 13, color: colors.danger, lineHeight: 18 },
  });
