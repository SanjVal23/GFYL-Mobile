import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Course } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';

const coursesData: Course[] = [];

export default function CoursesScreen() {
  const navigation = useNavigation<any>();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const { t } = useLocalization();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('courses.title', 'Marketing')}</Text>
        <Text style={styles.headerSubtitle}>
          {t('courses.subtitle', 'Gita for Youth Leadership · Outreach & Campaigns')}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {coursesData.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="hourglass-outline" size={32} color={colors.text} />
            </View>
            <Text style={styles.emptyTitle}>{t('courses.comingSoon', 'Coming Soon')}</Text>
            <Text style={styles.emptyText}>
              {t('courses.comingSoonText', 'Marketing content is on the way. Check back soon for new campaigns and resources.')}
            </Text>
          </View>
        ) : (
          coursesData.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={styles.courseCard}
              onPress={() => setSelectedCourse(course)}
              activeOpacity={0.85}
            >
              <View style={styles.courseIcon}>
                <Ionicons name={course.icon as any} size={28} color={colors.accentText} />
              </View>
              <View style={styles.courseInfo}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseDescription}>{course.description}</Text>
                <View style={styles.courseStats}>
                  <View style={styles.stat}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.statText}>{course.duration}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.statText}>{course.lessons} outreach channels</Text>
                  </View>
                </View>
                <View style={styles.progressContainer}>
                  <Text style={styles.progressLabel}>Campaign Progress</Text>
                  <Text style={styles.progressPercentage}>{course.progress}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${course.progress}%` }]}
                  />
                </View>
                {course.completed && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    <Text style={styles.completedText}>Completed</Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Campaign Detail Modal */}
      <Modal
        visible={selectedCourse !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedCourse(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedCourse?.title}</Text>
              <TouchableOpacity onPress={() => setSelectedCourse(null)}>
                <Ionicons name="close" size={26} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.modalIcon}>
                <Ionicons name={selectedCourse?.icon as any} size={36} color={colors.accentText} />
              </View>
              <Text style={styles.modalDescription}>
                {selectedCourse?.description}
              </Text>
              <View style={styles.modalStats}>
                <View style={styles.modalStat}>
                  <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                  <Text style={styles.modalStatText}>{selectedCourse?.duration}</Text>
                </View>
                <View style={styles.modalStat}>
                  <Ionicons name="people-outline" size={18} color={colors.textSecondary} />
                  <Text style={styles.modalStatText}>
                    {selectedCourse?.lessons} outreach channels
                  </Text>
                </View>
              </View>

              <View style={styles.modalProgress}>
                <Text style={styles.modalProgressLabel}>Execution Status</Text>
                <Text style={styles.modalProgressPercentage}>
                  {selectedCourse?.progress}%
                </Text>
              </View>
              <View style={styles.modalProgressBar}>
                <View
                  style={[
                    styles.modalProgressFill,
                    { width: `${selectedCourse?.progress || 0}%` },
                  ]}
                />
              </View>

              <Text style={styles.modalInfo}>
                This marketing campaign focuses on introducing the Bhagavad Gita to
                youth through leadership themes, community engagement, and
                value-based storytelling.
              </Text>

              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => {
                  setSelectedCourse(null);
                  navigation.navigate('CourseDetail', {
                    courseId: selectedCourse?.id,
                    courseTitle: selectedCourse?.title,
                    courseDescription: selectedCourse?.description,
                  });
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.continueButtonText}>View Campaign Plan</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.syllabusButton}>
                <Text style={styles.syllabusButtonText}>Campaign Assets & Messaging</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    padding: 16,
    borderRadius: 18,
    gap: 14,
  },
  courseIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptyState: {
    marginTop: 30,
    padding: 28,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  courseDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  courseStats: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  completedText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    width: '100%',
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  modalIcon: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
    marginBottom: 20,
  },
  modalStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalStatText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalProgressLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalProgressPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  modalProgressBar: {
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  modalProgressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  modalInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  continueButton: {
    backgroundColor: colors.accent,
    paddingVertical: 15,
    borderRadius: 14,
    marginBottom: 12,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accentText,
    textAlign: 'center',
  },
  syllabusButton: {
    paddingVertical: 12,
  },
  syllabusButtonText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
});
