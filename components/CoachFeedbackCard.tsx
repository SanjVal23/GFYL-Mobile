import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import { CoachFeedback, WordFeedbackStatus } from '../types';
import { ACCURACY_CORRECT_THRESHOLD, ACCURACY_CLOSE_THRESHOLD } from '../services/gitaCoachService';

// ThemeColors has no "warning" token — this feature is the only place that
// needs an amber accent (for "close" word chips / the improve box).
const WARNING_COLOR = '#f59e0b';

interface CoachFeedbackCardProps {
  feedback: CoachFeedback;
  onTryAgain: () => void;
}

export default function CoachFeedbackCard({ feedback, onTryAgain }: CoachFeedbackCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const scoreColor = (score: number) => {
    if (score >= ACCURACY_CORRECT_THRESHOLD) return colors.success;
    if (score >= ACCURACY_CLOSE_THRESHOLD) return WARNING_COLOR;
    return colors.danger;
  };

  const chipColor = (status: WordFeedbackStatus) => {
    if (status === 'correct') return colors.success;
    if (status === 'close') return WARNING_COLOR;
    return colors.danger;
  };

  return (
    <View style={styles.card}>
      <View style={styles.scoreRow}>
        <View style={[styles.scoreCircle, { borderColor: scoreColor(feedback.score) }]}>
          <Text style={[styles.scoreNumber, { color: scoreColor(feedback.score) }]}>{feedback.score}</Text>
          <Text style={styles.scoreOutOf}>/100</Text>
        </View>
        <View style={styles.scoreInfo}>
          <Text style={styles.scoreLabel}>{feedback.scoreLabel}</Text>
          <Text style={styles.scoreTitle}>{feedback.title}</Text>
        </View>
      </View>

      <Text style={styles.summaryText}>{feedback.summary}</Text>

      <View style={[styles.feedbackBox, { borderLeftColor: colors.success }]}>
        <Text style={styles.feedbackBoxLabel}>What went well</Text>
        <Text style={styles.feedbackBoxText}>{feedback.strength}</Text>
      </View>

      <View style={[styles.feedbackBox, { borderLeftColor: WARNING_COLOR }]}>
        <Text style={styles.feedbackBoxLabel}>What to fix</Text>
        <Text style={styles.feedbackBoxText}>{feedback.improve}</Text>
      </View>

      <View style={[styles.feedbackBox, { borderLeftColor: colors.accent }]}>
        <Text style={styles.feedbackBoxLabel}>Coach tip</Text>
        <Text style={styles.feedbackBoxText}>{feedback.tip}</Text>
      </View>

      <View style={styles.wordChipRow}>
        {feedback.wordFeedback.map((word, index) => (
          <View key={index} style={[styles.wordChip, { borderColor: chipColor(word.status) }]}>
            <Text style={[styles.wordChipText, { color: chipColor(word.status) }]}>{word.word}</Text>
            <Text style={styles.wordChipNote}>{word.note}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.tryAgainButton} onPress={onTryAgain} activeOpacity={0.85}>
        <Ionicons name="refresh" size={18} color={colors.accentText} />
        <Text style={styles.tryAgainText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 18,
      marginBottom: 16,
    },
    scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14 },
    scoreCircle: {
      width: 84,
      height: 84,
      borderRadius: 42,
      borderWidth: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scoreNumber: { fontSize: 24, fontWeight: '800' },
    scoreOutOf: { fontSize: 11, color: colors.textSecondary },
    scoreInfo: { flex: 1 },
    scoreLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
    scoreTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
    summaryText: { fontSize: 14, lineHeight: 20, color: colors.text, marginBottom: 14 },
    feedbackBox: {
      backgroundColor: colors.surfaceAlt,
      borderLeftWidth: 3,
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
    },
    feedbackBoxLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
    feedbackBoxText: { fontSize: 13, lineHeight: 19, color: colors.text },
    wordChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 16 },
    wordChip: {
      borderWidth: 1.5,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      alignItems: 'center',
    },
    wordChipText: { fontSize: 13, fontWeight: '700' },
    wordChipNote: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
    tryAgainButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 14,
    },
    tryAgainText: { color: colors.accentText, fontWeight: '700', fontSize: 15 },
  });
