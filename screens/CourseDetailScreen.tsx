import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useUser } from '../contexts/UserContext';
import { useLocalization } from '../contexts/LocalizationContext';

type RootStackParamList = {
  CourseDetail: {
    courseId: string;
    courseTitle: string;
    courseDescription: string;
  };
};

type CourseDetailRouteProp = RouteProp<RootStackParamList, 'CourseDetail'>;
type CourseDetailNavigationProp = StackNavigationProp<RootStackParamList, 'CourseDetail'>;

interface CourseDetailScreenProps {
  route: CourseDetailRouteProp;
  navigation: CourseDetailNavigationProp;
}

interface Lesson {
  id: number;
  title: string;
  duration: string;
  completed: boolean;
  content: string;
}

const courseLessons: { [key: string]: Lesson[] } = {
  '1': [
    { id: 1, title: 'Introduction to Bhagavad Gita', duration: '15 min', completed: true, content: 'The Bhagavad Gita is a 700-verse Hindu scripture that is part of the epic Mahabharata. It consists of a conversation between Prince Arjuna and the god Krishna, who serves as his charioteer.' },
    { id: 2, title: 'Historical Context', duration: '12 min', completed: true, content: 'The Gita is set in a narrative framework of a dialogue between Pandava prince Arjuna and his guide and charioteer Krishna.' },
    { id: 3, title: 'The Battlefield of Kurukshetra', duration: '18 min', completed: true, content: 'Kurukshetra is described as the land of dharma. The battle represents the eternal conflict between good and evil.' },
    { id: 4, title: 'Arjuna\'s Dilemma', duration: '20 min', completed: true, content: 'Arjuna faces a moral crisis when he must fight against his own family members and beloved teachers.' },
    { id: 5, title: 'Krishna\'s Role', duration: '16 min', completed: true, content: 'Krishna serves not just as a charioteer but as a divine teacher, revealing profound spiritual truths.' },
    { id: 6, title: 'Key Themes Overview', duration: '22 min', completed: true, content: 'The Gita discusses dharma, karma, bhakti, and the nature of reality and self.' },
    { id: 7, title: 'Practical Applications', duration: '14 min', completed: false, content: 'Learn how to apply the teachings of the Gita in your daily life.' },
    { id: 8, title: 'Course Summary', duration: '10 min', completed: false, content: 'Recap of all the major concepts covered in this introductory course.' },
  ],
  '2': [
    { id: 1, title: 'Sankhya Yoga Introduction', duration: '18 min', completed: true, content: 'Chapter 2 is called Sankhya Yoga - the Yoga of Knowledge. It forms the foundation of Krishna\'s teachings.' },
    { id: 2, title: 'The Eternal Soul', duration: '20 min', completed: true, content: 'Krishna explains the immortality of the soul and how it transcends birth and death.' },
    { id: 3, title: 'Performing Duty', duration: '15 min', completed: true, content: 'The importance of performing one\'s duty without attachment to results.' },
    { id: 4, title: 'Equanimity in Success and Failure', duration: '16 min', completed: true, content: 'Maintaining balance in all situations is the mark of a wise person.' },
    { id: 5, title: 'Controlling the Mind', duration: '22 min', completed: false, content: 'Techniques for mastering the restless mind through practice and detachment.' },
    { id: 6, title: 'The Steadfast Intellect', duration: '19 min', completed: false, content: 'Characteristics of one who has attained steady wisdom.' },
  ],
};

export default function CourseDetailScreen({ route, navigation }: CourseDetailScreenProps) {
  const { courseId, courseTitle, courseDescription } = route.params;
  const [lessons] = useState<Lesson[]>(courseLessons[courseId] || []);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const { savedItems, addSavedItem } = useUser();
  const { t } = useLocalization();

  const completedCount = lessons.filter((l) => l.completed).length;
  const progress = Math.round((completedCount / lessons.length) * 100);

  const isLessonSaved = (lessonId: number) =>
    savedItems.some(item => item.id === `lesson-${courseId}-${lessonId}` || item.id.endsWith(`lesson-${courseId}-${lessonId}`));

  const handleSaveLesson = (lesson: Lesson) => {
    if (isLessonSaved(lesson.id)) return;
    addSavedItem({
      id: `lesson-${courseId}-${lesson.id}`,
      title: `${courseTitle}: ${lesson.title}`,
      type: 'lesson',
      icon: 'book',
    });
  };

  return (
    <LinearGradient colors={['#172554', '#1e3a8a']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.courseTitle}>{courseTitle}</Text>
        <Text style={styles.courseDescription}>{courseDescription}</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>{t('course.progress', 'Your Progress')}</Text>
            <Text style={styles.progressPercentage}>{progress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {t('course.progressCount', `${completedCount} of ${lessons.length} lessons completed`)}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {lessons.map((lesson, index) => (
          <TouchableOpacity
            key={lesson.id}
            style={styles.lessonCard}
            onPress={() => setSelectedLesson(selectedLesson === lesson.id ? null : lesson.id)}
          >
            <View style={styles.lessonHeader}>
              <View style={styles.lessonNumber}>
                {lesson.completed ? (
                  <Ionicons name="checkmark" size={20} color="#fff" />
                ) : (
                  <Text style={styles.lessonNumberText}>{index + 1}</Text>
                )}
              </View>
              <View style={styles.lessonInfo}>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <View style={styles.lessonMeta}>
                  <Ionicons name="time-outline" size={14} color="#94a3b8" />
                  <Text style={styles.lessonDuration}>{lesson.duration}</Text>
                  {lesson.completed && (
                    <>
                      <Ionicons name="checkmark-circle" size={14} color="#34d399" />
                      <Text style={styles.completedText}>Completed</Text>
                    </>
                  )}
                </View>
              </View>
              <Ionicons
                name={selectedLesson === lesson.id ? 'chevron-up' : 'chevron-down'}
                size={24}
                color="#fb923c"
              />
            </View>

            {selectedLesson === lesson.id && (
              <View style={styles.lessonContent}>
                <Text style={styles.contentText}>{lesson.content}</Text>
                <View style={styles.lessonActions}>
                  <TouchableOpacity
                    style={[
                      styles.startButton,
                      lesson.completed && styles.reviewButton,
                    ]}
                  >
                    <Ionicons
                      name={lesson.completed ? 'refresh' : 'play'}
                      size={20}
                      color="#fff"
                    />
                    <Text style={styles.startButtonText}>
                      {lesson.completed ? t('course.review', 'Review Lesson') : t('course.start', 'Start Lesson')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      isLessonSaved(lesson.id) && styles.saveButtonSaved,
                    ]}
                    onPress={() => handleSaveLesson(lesson)}
                    disabled={isLessonSaved(lesson.id)}
                  >
                    <Ionicons
                      name={isLessonSaved(lesson.id) ? 'bookmark' : 'bookmark-outline'}
                      size={18}
                      color="#fff"
                    />
                    <Text style={styles.saveButtonText}>
                      {isLessonSaved(lesson.id) ? t('common.saved', 'Saved') : t('common.save', 'Save')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueButton}>
          <Text style={styles.continueButtonText}>
            {completedCount === lessons.length
              ? t('course.complete', 'Complete Course')
              : t('course.continue', `Continue: ${lessons.find((l) => !l.completed)?.title || 'Next Lesson'}`)}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e40af',
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  courseDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 6,
  },
  progressContainer: {
    marginTop: 20,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fb923c',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fb923c',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
  },
  scrollView: {
    flex: 1,
  },
  lessonCard: {
    backgroundColor: '#1e40af',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 12,
  },
  lessonNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fb923c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  lessonDuration: {
    fontSize: 13,
    color: '#94a3b8',
  },
  completedText: {
    fontSize: 13,
    color: '#34d399',
    fontWeight: '500',
  },
  lessonContent: {
    padding: 15,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  contentText: {
    fontSize: 15,
    color: '#e2e8f0',
    lineHeight: 22,
    marginBottom: 15,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fb923c',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    flex: 1,
  },
  reviewButton: {
    backgroundColor: '#3b82f6',
  },
  lessonActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e3a8a',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
  },
  saveButtonSaved: {
    backgroundColor: '#16a34a',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#1e40af',
  },
  continueButton: {
    backgroundColor: '#fb923c',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
