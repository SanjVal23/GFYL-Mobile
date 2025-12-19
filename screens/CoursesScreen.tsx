import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Course } from '../types';

const coursesData: Course[] = [
  {
    id: '1',
    title: 'Bhagavad Gita - Introduction',
    description: 'Understanding the context',
    duration: '2 hours',
    lessons: 8,
    progress: 75,
    icon: 'book',
  },
  {
    id: '2',
    title: 'Bhagavad Gita - Chapter 2',
    description: 'Reflections on Chapter 2',
    duration: '3 hours',
    lessons: 12,
    progress: 40,
    icon: 'book',
  },
  {
    id: '3',
    title: 'Daily Reflections',
    description: 'Daily inspiration',
    duration: '1 hour',
    lessons: 5,
    progress: 100,
    icon: 'sunny',
    completed: true,
  },
  {
    id: '4',
    title: 'Ramayana Stories',
    description: 'Epic tales of Lord Rama',
    duration: '4 hours',
    lessons: 15,
    progress: 0,
    icon: 'library',
  },
  {
    id: '5',
    title: 'Festival Prep',
    description: 'Janmashtami and more',
    duration: '2 hours',
    lessons: 6,
    progress: 0,
    icon: 'sparkles',
  },
];

export default function CoursesScreen() {
  const navigation = useNavigation<any>();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  return (
    <LinearGradient colors={['#172554', '#1e3a8a']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Courses</Text>
        <Text style={styles.headerSubtitle}>5 courses available</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {coursesData.map((course) => (
          <TouchableOpacity
            key={course.id}
            style={styles.courseCard}
            onPress={() => setSelectedCourse(course)}
          >
            <View style={styles.courseIcon}>
              <Ionicons name={course.icon as any} size={32} color="#fff" />
            </View>
            <View style={styles.courseInfo}>
              <Text style={styles.courseTitle}>{course.title}</Text>
              <Text style={styles.courseDescription}>{course.description}</Text>
              <View style={styles.courseStats}>
                <View style={styles.stat}>
                  <Ionicons name="time-outline" size={16} color="#94a3b8" />
                  <Text style={styles.statText}>{course.duration}</Text>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="book-outline" size={16} color="#94a3b8" />
                  <Text style={styles.statText}>{course.lessons} lessons</Text>
                </View>
              </View>
              <View style={styles.progressContainer}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressPercentage}>{course.progress}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${course.progress}%` }]}
                />
              </View>
              {course.completed && (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#34d399" />
                  <Text style={styles.completedText}>Completed</Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={24} color="#fb923c" />
          </TouchableOpacity>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Course Detail Modal */}
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
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.modalIcon}>
                <Ionicons name={selectedCourse?.icon as any} size={40} color="#fff" />
              </View>
              <Text style={styles.modalDescription}>
                {selectedCourse?.description}
              </Text>
              <View style={styles.modalStats}>
                <View style={styles.modalStat}>
                  <Ionicons name="time-outline" size={20} color="#94a3b8" />
                  <Text style={styles.modalStatText}>{selectedCourse?.duration}</Text>
                </View>
                <View style={styles.modalStat}>
                  <Ionicons name="book-outline" size={20} color="#94a3b8" />
                  <Text style={styles.modalStatText}>
                    {selectedCourse?.lessons} lessons
                  </Text>
                </View>
              </View>

              <View style={styles.modalProgress}>
                <Text style={styles.modalProgressLabel}>Your Progress</Text>
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
                This course will guide you through fundamental concepts and provide
                deep insights into spiritual teachings.
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
              >
                <Text style={styles.continueButtonText}>Continue Course</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.syllabusButton}>
                <Text style={styles.syllabusButtonText}>View Syllabus</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e40af',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 16,
    gap: 15,
  },
  courseIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#fb923c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  courseDescription: {
    fontSize: 13,
    color: '#cbd5e1',
    marginTop: 2,
  },
  courseStats: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  progressLabel: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fb923c',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fb923c',
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
    color: '#34d399',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e3a8a',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e40af',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#fb923c',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 15,
  },
  modalDescription: {
    fontSize: 16,
    color: '#e2e8f0',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    marginBottom: 20,
  },
  modalStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalStatText: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  modalProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalProgressLabel: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  modalProgressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fb923c',
  },
  modalProgressBar: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  modalProgressFill: {
    height: '100%',
    backgroundColor: '#fb923c',
    borderRadius: 4,
  },
  modalInfo: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    marginBottom: 20,
  },
  continueButton: {
    backgroundColor: '#fb923c',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  syllabusButton: {
    paddingVertical: 12,
  },
  syllabusButtonText: {
    fontSize: 15,
    color: '#cbd5e1',
    textAlign: 'center',
  },
});
