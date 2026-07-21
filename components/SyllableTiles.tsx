import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import { Syllable, StressLevel, WordFeedbackStatus } from '../types';

// ThemeColors has no "warning" token — matches the local accent GitaCoachScreen
// already uses for "close" results, kept consistent here.
const WARNING_COLOR = '#f59e0b';

function stressGlyph(stress: StressLevel): string {
  if (stress === 'high') return '▲';
  if (stress === 'low') return '▽';
  return '—';
}

export interface ActiveSyllableRef {
  padaIndex: number;
  syllableIndex: number;
}

interface SyllableTilesProps {
  syllables: Syllable[][];
  /** The tile currently under playback — takes visual priority over status coloring. */
  activeSyllable?: ActiveSyllableRef | null;
  /** Post-attempt correctness per tile, keyed "padaIndex-syllableIndex". */
  syllableStatuses?: Record<string, WordFeedbackStatus>;
  /** When set, renders only these padas (focused view for step-by-step practice). */
  onlyPadas?: number[];
  /** When set, tapping a tile plays that syllable's slice of the reference
   * audio — lets a student hear a single syllable, including one the coach
   * just flagged as missed. */
  onSyllablePress?: (padaIndex: number, syllableIndex: number) => void;
}

export default function SyllableTiles({
  syllables,
  activeSyllable,
  syllableStatuses,
  onlyPadas,
  onSyllablePress,
}: SyllableTilesProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const statusColor = (status?: WordFeedbackStatus): string | undefined => {
    if (status === 'correct') return colors.success;
    if (status === 'close') return WARNING_COLOR;
    if (status === 'retry') return colors.danger;
    return undefined;
  };

  return (
    <>
      {syllables.map((pada, padaIndex) => {
        if (onlyPadas != null && !onlyPadas.includes(padaIndex)) return null;

        return (
          <View key={padaIndex} style={styles.padaRow}>
            {pada.map((syllable, syllableIndex) => {
              const isActive =
                activeSyllable?.padaIndex === padaIndex && activeSyllable?.syllableIndex === syllableIndex;
              const tint = statusColor(syllableStatuses?.[`${padaIndex}-${syllableIndex}`]);

              const glyphColor = isActive
                ? colors.accentText
                : syllable.stress === 'high'
                ? colors.text
                : syllable.stress === 'mid'
                ? colors.textSecondary
                : colors.textTertiary;

              const textColor = isActive ? colors.accentText : tint ?? colors.text;
              const Tile = onSyllablePress ? TouchableOpacity : View;

              return (
                <Tile
                  key={syllableIndex}
                  style={[
                    styles.syllableCard,
                    isActive && { backgroundColor: colors.accent },
                    !isActive && tint ? { borderWidth: 1.5, borderColor: tint } : null,
                  ]}
                  {...(onSyllablePress
                    ? { onPress: () => onSyllablePress(padaIndex, syllableIndex), activeOpacity: 0.6 }
                    : null)}
                >
                  <Text style={[styles.syllableGlyph, { color: glyphColor }]}>{stressGlyph(syllable.stress)}</Text>
                  <Text style={[styles.syllableText, { color: textColor }]}>{syllable.text}</Text>
                </Tile>
              );
            })}
          </View>
        );
      })}
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    padaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    syllableCard: {
      alignItems: 'center',
      backgroundColor: colors.surfaceAlt,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
      minWidth: 40,
    },
    syllableGlyph: { fontSize: 12, marginBottom: 2 },
    syllableText: { fontSize: 14, fontWeight: '600', color: colors.text },
  });
