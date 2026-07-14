import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { shlokas, getTeacherDashboard, buildTeacherCsv } from '../services/gitaCoachService';
import { TeacherStudentRow } from '../types';

function daysAgoLabel(iso: string | null): string {
  if (!iso) return 'Never practised';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Practised today';
  if (days === 1) return 'Practised yesterday';
  return `Practised ${days} days ago`;
}

function scoreColorFor(colors: ThemeColors, score: number | null) {
  if (score == null) return colors.textTertiary;
  if (score >= 80) return colors.success;
  if (score >= 50) return '#f59e0b';
  return colors.danger;
}

export default function GitaCoachTeacherScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { user } = useUser();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TeacherStudentRow[]>([]);
  const isTeacher = user.role === 'teacher';

  useFocusEffect(
    useCallback(() => {
      if (!isTeacher) {
        setLoading(false);
        return;
      }
      let cancelled = false;
      setLoading(true);
      getTeacherDashboard().then((data) => {
        if (!cancelled) {
          setRows(data);
          setLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }, [isTeacher])
  );

  const needsHelpCount = rows.filter((r) => r.needsHelp).length;

  const handleExportCsv = async () => {
    const csv = buildTeacherCsv(rows);
    try {
      await Share.share({ message: csv, title: 'Gita Warriors — Class Scores' });
    } catch (e) {
      console.error('Failed to share CSV', e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Class Dashboard</Text>
        <Text style={styles.headerSubtitle}>Gita Warriors · Teacher View</Text>
      </View>

      {!isTeacher ? (
        <View style={styles.centerFill}>
          <Ionicons name="lock-closed-outline" size={40} color={colors.textTertiary} />
          <Text style={styles.emptyText}>This dashboard is only available to teacher accounts.</Text>
        </View>
      ) : loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.centerFill}>
          <Ionicons name="people-outline" size={40} color={colors.textTertiary} />
          <Text style={styles.emptyText}>No student attempts yet.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{rows.length}</Text>
              <Text style={styles.summaryLabel}>Students</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryNumber, needsHelpCount > 0 && { color: colors.danger }]}>
                {needsHelpCount}
              </Text>
              <Text style={styles.summaryLabel}>Need follow-up</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.exportButton} onPress={handleExportCsv} activeOpacity={0.85}>
            <Ionicons name="download-outline" size={18} color={colors.accentText} />
            <Text style={styles.exportButtonText}>Export scores as CSV</Text>
          </TouchableOpacity>

          {rows.map((row) => (
            <View key={row.userId} style={styles.studentCard}>
              <View style={styles.studentHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{row.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{row.name}</Text>
                  <Text style={styles.lastPracticed}>{daysAgoLabel(row.lastPracticedAt)}</Text>
                </View>
                {row.needsHelp && (
                  <View style={styles.flagBadge}>
                    <Ionicons name="flag" size={12} color={colors.danger} />
                    <Text style={styles.flagBadgeText}>Needs help</Text>
                  </View>
                )}
              </View>

              <View style={styles.scoreGrid}>
                {shlokas.map((shloka) => {
                  const score = row.scoresByShloka[shloka.id];
                  return (
                    <View key={shloka.id} style={styles.scoreChip}>
                      <Text style={styles.scoreChipLabel} numberOfLines={1}>
                        {shloka.reference.replace('Bhagavad Gita ', '')}
                      </Text>
                      <Text style={[styles.scoreChipValue, { color: scoreColorFor(colors, score) }]}>
                        {score == null ? '—' : score}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
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
    summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    summaryCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
    },
    summaryNumber: { fontSize: 24, fontWeight: '800', color: colors.text },
    summaryLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    exportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 14,
      marginBottom: 16,
    },
    exportButtonText: { color: colors.accentText, fontWeight: '700', fontSize: 14 },
    studentCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
    },
    studentHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: colors.accentText, fontWeight: '700', fontSize: 16 },
    studentName: { fontSize: 15, fontWeight: '700', color: colors.text },
    lastPracticed: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    flagBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    flagBadgeText: { fontSize: 10, fontWeight: '700', color: colors.danger },
    scoreGrid: { flexDirection: 'row', gap: 8 },
    scoreChip: {
      flex: 1,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 10,
      paddingVertical: 8,
      alignItems: 'center',
    },
    scoreChipLabel: { fontSize: 10, color: colors.textSecondary, marginBottom: 2 },
    scoreChipValue: { fontSize: 15, fontWeight: '800' },
  });
