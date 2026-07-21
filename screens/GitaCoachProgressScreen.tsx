import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { shlokas, getAttemptHistory, bestScoreByShloka, computeStreak } from '../services/gitaCoachService';
import { GitaAttempt } from '../types';

const CHART_BAR_COUNT = 8;

function scoreColorFor(colors: ThemeColors, score: number) {
  if (score >= 80) return colors.success;
  if (score >= 50) return '#f59e0b';
  return colors.danger;
}

export default function GitaCoachProgressScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { user } = useUser();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<GitaAttempt[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!user.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      getAttemptHistory(user.id).then((data) => {
        if (!cancelled) {
          setAttempts(data);
          setLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }, [user.id])
  );

  const bestScores = useMemo(() => bestScoreByShloka(attempts), [attempts]);
  const streak = useMemo(() => computeStreak(attempts), [attempts]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Your Progress</Text>
        <Text style={styles.headerSubtitle}>Gita Warriors · Shloka Coach</Text>
      </View>

      {loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : !user.id ? (
        <View style={styles.centerFill}>
          <Ionicons name="person-outline" size={40} color={colors.textTertiary} />
          <Text style={styles.emptyText}>Sign in to track your progress across sessions.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.streakCard}>
            <Ionicons name="flame" size={28} color="#f59e0b" />
            <View>
              <Text style={styles.streakNumber}>{streak} day{streak === 1 ? '' : 's'}</Text>
              <Text style={styles.streakLabel}>Current practice streak</Text>
            </View>
          </View>

          {attempts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="mic-outline" size={32} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No attempts yet — practise a shloka to start your progress chart.</Text>
            </View>
          ) : (
            shlokas.map((shloka) => {
              const shlokaAttempts = attempts
                .filter((a) => a.shlokaId === shloka.id)
                .slice(0, CHART_BAR_COUNT)
                .reverse();
              const best = bestScores[shloka.id];

              if (shlokaAttempts.length === 0) {
                return (
                  <View key={shloka.id} style={styles.shlokaCard}>
                    <Text style={styles.shlokaTitle}>{shloka.reference}</Text>
                    <Text style={styles.noAttemptsText}>Not attempted yet</Text>
                  </View>
                );
              }

              return (
                <View key={shloka.id} style={styles.shlokaCard}>
                  <View style={styles.shlokaHeader}>
                    <Text style={styles.shlokaTitle}>{shloka.reference}</Text>
                    <Text style={[styles.bestScore, { color: scoreColorFor(colors, best ?? 0) }]}>
                      Best {best}
                    </Text>
                  </View>
                  <View style={styles.chartRow}>
                    {shlokaAttempts.map((attempt, index) => (
                      <View key={attempt.id} style={styles.barColumn}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: Math.max(6, (attempt.score / 100) * 60),
                              backgroundColor: scoreColorFor(colors, attempt.score),
                            },
                          ]}
                        />
                        <Text style={styles.barLabel}>{attempt.score}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.attemptCount}>
                    {attempts.filter((a) => a.shlokaId === shloka.id).length} attempt
                    {attempts.filter((a) => a.shlokaId === shloka.id).length === 1 ? '' : 's'}
                  </Text>
                </View>
              );
            })
          )}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}
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
    headerTitle: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
    headerSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
    scrollView: { flex: 1, paddingHorizontal: 20 },
    centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
    emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
    emptyCard: {
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 24,
    },
    streakCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 18,
      marginBottom: 16,
    },
    streakNumber: { fontSize: 20, fontWeight: '800', color: colors.text },
    streakLabel: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    shlokaCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 18,
      marginBottom: 14,
    },
    shlokaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    shlokaTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    bestScore: { fontSize: 14, fontWeight: '700' },
    noAttemptsText: { fontSize: 13, color: colors.textTertiary, marginTop: 6 },
    chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 80 },
    barColumn: { alignItems: 'center', gap: 6 },
    bar: { width: 18, borderRadius: 6 },
    barLabel: { fontSize: 10, color: colors.textTertiary },
    attemptCount: { fontSize: 12, color: colors.textSecondary, marginTop: 10 },
  });
