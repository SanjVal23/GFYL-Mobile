import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useShlokaRecorder } from '../hooks/useShlokaRecorder';
import { useSyllableHighlight } from '../hooks/useSyllableHighlight';
import { shlokas, assessPadaAttempt, submitFullAttempt, LineAssessOutcome, TileFeedback } from '../services/gitaCoachService';
import { shlokaAudioAssets } from '../constants/shlokaAudio';
import { CoachFeedback } from '../types';
import SyllableTiles from '../components/SyllableTiles';
import CoachFeedbackCard from '../components/CoachFeedbackCard';

type GitaCoachPracticeParamList = {
  GitaCoachPractice: { shlokaId?: string } | undefined;
};

type GitaCoachPracticeRouteProp = RouteProp<GitaCoachPracticeParamList, 'GitaCoachPractice'>;

interface GitaCoachPracticeScreenProps {
  route: GitaCoachPracticeRouteProp;
}

type LineResult = Extract<LineAssessOutcome, { ok: true }>;

type ErrorKind = 'mic_denied' | 'no_speech' | 'api_error' | null;

const ERROR_MESSAGES: Record<Exclude<ErrorKind, null>, string> = {
  mic_denied: 'Allow microphone access in your device settings to record your recitation.',
  no_speech: "We didn't hear anything — check your microphone and try again.",
  api_error: 'Coach unavailable — try again.',
};

export default function GitaCoachPracticeScreen({ route }: GitaCoachPracticeScreenProps) {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { user } = useUser();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [shloka] = useState(() => shlokas.find((s) => s.id === route.params?.shlokaId) ?? shlokas[0]);
  const padaCount = shloka.syllables.length;

  const audioSource = shlokaAudioAssets[shloka.id] ?? null;
  const { isPlaying, activeSyllable, playSegment, playSyllable, pause } = useSyllableHighlight(shloka, audioSource);
  const onSyllablePress = audioSource ? playSyllable : undefined;

  const [mode, setMode] = useState<'pada' | 'final'>('pada');
  const [padaIndex, setPadaIndex] = useState(0);
  // Keyed by pada index — each pada is recorded and scored on its own, one
  // recording never covers more than the single line of tiles on screen.
  const [padaResults, setPadaResults] = useState<Record<number, LineResult>>({});

  const currentPadaResult = padaResults[padaIndex];
  const hasAttemptedPada = currentPadaResult != null;

  // Merge every completed pada's real per-tile feedback so SyllableTiles can
  // color each tile from its own score.
  const syllableStatuses = useMemo(() => {
    const map: Record<string, 'correct' | 'close' | 'retry'> = {};
    Object.values(padaResults).forEach((result) => {
      Object.entries(result.tileFeedback).forEach(([key, tf]) => {
        map[key] = tf.status;
      });
    });
    return map;
  }, [padaResults]);

  const needsWorkList = useMemo(() => {
    if (!currentPadaResult) return [];
    const items: { key: string; text: string; note: string }[] = [];
    shloka.syllables[padaIndex]?.forEach((syllable, syllableIdx) => {
      const tf = currentPadaResult.tileFeedback[`${padaIndex}-${syllableIdx}`];
      if (tf && tf.status !== 'correct') {
        items.push({ key: `${padaIndex}-${syllableIdx}`, text: syllable.text, note: tf.note });
      }
    });
    return items;
  }, [currentPadaResult, padaIndex, shloka]);

  const recorder = useShlokaRecorder();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<ErrorKind>(null);
  const [feedback, setFeedback] = useState<CoachFeedback | null>(null);
  const [finalTileFeedback, setFinalTileFeedback] = useState<Record<string, TileFeedback> | null>(null);

  const finalSyllableStatuses = useMemo(() => {
    const map: Record<string, 'correct' | 'close' | 'retry'> = {};
    if (finalTileFeedback) {
      Object.entries(finalTileFeedback).forEach(([key, tf]) => {
        map[key] = tf.status;
      });
    }
    return map;
  }, [finalTileFeedback]);

  const finalNeedsWorkList = useMemo(() => {
    if (!finalTileFeedback) return [];
    const items: { key: string; text: string; note: string }[] = [];
    shloka.syllables.forEach((pada, padaIdx) => {
      pada.forEach((syllable, syllableIdx) => {
        const tf = finalTileFeedback[`${padaIdx}-${syllableIdx}`];
        if (tf && tf.status !== 'correct') {
          items.push({ key: `${padaIdx}-${syllableIdx}`, text: syllable.text, note: tf.note });
        }
      });
    });
    return items;
  }, [finalTileFeedback, shloka]);

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

  const handleListenPada = () => {
    if (isPlaying) {
      pause();
    } else {
      playSegment([padaIndex]);
    }
  };

  const handlePressIn = async () => {
    setError(null);
    const result = await recorder.start();
    if (!result.ok) setError('mic_denied');
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

    if (mode === 'pada') {
      const outcome = await assessPadaAttempt(recorded.base64, recorded.mimeType, shloka, padaIndex);
      setIsProcessing(false);

      if (!outcome.ok) {
        setError(outcome.errorCode === 'no_speech' ? 'no_speech' : 'api_error');
        return;
      }

      setPadaResults((prev) => ({ ...prev, [padaIndex]: outcome }));
      return;
    }

    const outcome = await submitFullAttempt(user.id, shloka, recorded);
    setIsProcessing(false);

    if (!outcome.ok) {
      setError(outcome.errorKind);
      return;
    }

    setFeedback(outcome.feedback);
    setFinalTileFeedback(outcome.tileFeedback);
  };

  const goToNextPada = () => {
    setError(null);
    if (padaIndex < padaCount - 1) {
      setPadaIndex(padaIndex + 1);
    } else {
      setMode('final');
    }
  };

  const retryPada = () => {
    setError(null);
    setPadaResults((prev) => {
      const next = { ...prev };
      delete next[padaIndex];
      return next;
    });
  };

  const resetFinalAttempt = () => {
    setFeedback(null);
    setFinalTileFeedback(null);
    setError(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{shloka.title}</Text>
        <Text style={styles.headerSubtitle}>
          {mode === 'pada' ? `Line ${padaIndex + 1} of ${padaCount}` : 'Full recitation'}
        </Text>
      </View>

      <View style={styles.dotsRow}>
        {shloka.syllables.map((_, i) => {
          const done = padaResults[i] != null;
          const current = mode === 'pada' && i === padaIndex;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                done && { backgroundColor: colors.success },
                current && { backgroundColor: colors.accent },
              ]}
            />
          );
        })}
        <View style={[styles.dot, mode === 'final' && { backgroundColor: colors.accent }]} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {mode === 'pada' ? (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Say this line</Text>
              <SyllableTiles
                syllables={shloka.syllables}
                onlyPadas={[padaIndex]}
                activeSyllable={activeSyllable}
                syllableStatuses={syllableStatuses}
                onSyllablePress={onSyllablePress}
              />
              {needsWorkList.length > 0 && (
                <View style={styles.needsWorkBox}>
                  {needsWorkList.map((item) => (
                    <Text key={item.key} style={styles.needsWorkText}>
                      <Text style={styles.needsWorkSyllable}>{item.text}</Text> — {item.note}
                    </Text>
                  ))}
                </View>
              )}
              {hasAttemptedPada && needsWorkList.length === 0 && (
                <View style={styles.needsWorkBox}>
                  <Text style={styles.needsWorkAllGood}>Nailed it — every sound landed clean.</Text>
                </View>
              )}
            </View>

            {audioSource ? (
              <TouchableOpacity style={styles.listenButton} onPress={handleListenPada} activeOpacity={0.85}>
                <Ionicons name={isPlaying ? 'volume-high' : 'play'} size={20} color={colors.accentText} />
                <Text style={styles.listenButtonText}>{isPlaying ? 'Playing...' : 'Listen to this line'}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.audioComingSoon}>
                <Ionicons name="mic-off-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.audioComingSoonText}>
                  Audio coming soon — the project team hasn't added a recording for this shloka yet.
                </Text>
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.recordHint}>
                {recorder.isRecording
                  ? 'Recording — release to submit'
                  : isProcessing
                  ? 'Analysing...'
                  : 'Hold the button and say this line'}
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

            {hasAttemptedPada && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.retryButton} onPress={retryPada} activeOpacity={0.85}>
                  <Ionicons name="refresh" size={18} color={colors.text} />
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.nextButton} onPress={goToNextPada} activeOpacity={0.85}>
                  <Text style={styles.nextButtonText}>
                    {padaIndex < padaCount - 1 ? 'Next line' : "I'm ready — recite it all"}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.accentText} />
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Now recite the whole shloka</Text>
              <SyllableTiles
                syllables={shloka.syllables}
                activeSyllable={activeSyllable}
                syllableStatuses={finalSyllableStatuses}
                onSyllablePress={onSyllablePress}
              />
              {finalNeedsWorkList.length > 0 && (
                <View style={styles.needsWorkBox}>
                  {finalNeedsWorkList.map((item) => (
                    <Text key={item.key} style={styles.needsWorkText}>
                      <Text style={styles.needsWorkSyllable}>{item.text}</Text> — {item.note}
                    </Text>
                  ))}
                </View>
              )}
              {finalTileFeedback && finalNeedsWorkList.length === 0 && (
                <View style={styles.needsWorkBox}>
                  <Text style={styles.needsWorkAllGood}>Nailed it — every sound landed clean.</Text>
                </View>
              )}
              <Text style={styles.devanagari}>{shloka.devanagari}</Text>
              <Text style={styles.roman}>{shloka.roman}</Text>
              <Text style={styles.meaning}>{shloka.meaning}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.recordHint}>
                {recorder.isRecording
                  ? 'Recording — release to submit'
                  : isProcessing
                  ? 'Analysing your recitation...'
                  : 'Hold the button and recite the full shloka'}
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

            {feedback && <CoachFeedbackCard feedback={feedback} onTryAgain={resetFinalAttempt} />}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
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
    headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
    headerSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
    dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#d0d0d0' },
    scrollView: { flex: 1, paddingHorizontal: 20 },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 18,
      marginBottom: 16,
    },
    sectionLabel: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 },
    devanagari: { fontSize: 22, lineHeight: 34, color: colors.text, fontFamily: 'serif', marginTop: 14, marginBottom: 10 },
    roman: { fontSize: 15, lineHeight: 22, color: colors.textSecondary, fontStyle: 'italic', marginBottom: 12 },
    meaning: { fontSize: 14, lineHeight: 20, color: colors.text },
    needsWorkBox: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 12,
      padding: 12,
      marginTop: 12,
      gap: 4,
    },
    needsWorkText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
    needsWorkSyllable: { fontWeight: '700', color: colors.text },
    needsWorkAllGood: { fontSize: 13, color: colors.success, fontWeight: '600', textAlign: 'center' },
    listenButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 14,
      marginBottom: 16,
    },
    listenButtonText: { color: colors.accentText, fontWeight: '700', fontSize: 15 },
    audioComingSoon: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      backgroundColor: colors.surfaceAlt,
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
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
    actionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 18,
    },
    retryButtonText: { color: colors.text, fontWeight: '700', fontSize: 14 },
    nextButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 14,
    },
    nextButtonText: { color: colors.accentText, fontWeight: '700', fontSize: 14 },
  });
