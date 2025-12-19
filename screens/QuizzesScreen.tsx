import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Quiz } from '../types';

const quizzesData: Quiz[] = [
  {
    id: '1',
    title: 'Chapter 1 Quiz',
    description: 'Arjuna Vishada Yoga',
    difficulty: 'Easy',
    questions: 10,
    score: 85,
  },
  {
    id: '2',
    title: 'Chapter 2 Quiz',
    description: 'Sankhya Yoga fundamentals',
    difficulty: 'Medium',
    questions: 15,
    score: 92,
    hasStarRating: true,
  },
  {
    id: '3',
    title: 'Krishna Leelas',
    description: "Stories from Krishna's life",
    difficulty: 'Easy',
    questions: 12,
  },
  {
    id: '4',
    title: 'Daily Practice',
    description: 'Understanding Hindu rituals',
    difficulty: 'Easy',
    questions: 8,
  },
  {
    id: '5',
    title: 'Advanced Philosophy',
    description: 'Deep Vedantic concepts',
    difficulty: 'Hard',
    questions: 20,
  },
];

const getDifficultyColor = (difficulty: Quiz['difficulty']) => {
  switch (difficulty) {
    case 'Easy':
      return '#34d399';
    case 'Medium':
      return '#3b82f6';
    case 'Hard':
      return '#ef4444';
    default:
      return '#94a3b8';
  }
};

export default function QuizzesScreen() {
  return (
    <LinearGradient colors={['#172554', '#1e3a8a']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quizzes</Text>
        <Text style={styles.headerSubtitle}>Test your knowledge</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {quizzesData.map((quiz) => (
          <View key={quiz.id} style={styles.quizCard}>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor(quiz.difficulty) },
              ]}
            >
              <Text style={styles.difficultyText}>{quiz.difficulty}</Text>
            </View>
            <View style={styles.quizInfo}>
              <Text style={styles.quizTitle}>{quiz.title}</Text>
              <Text style={styles.quizDescription}>{quiz.description}</Text>
              <View style={styles.quizStats}>
                <Ionicons name="help-circle-outline" size={16} color="#94a3b8" />
                <Text style={styles.quizStatsText}>{quiz.questions} questions</Text>
              </View>
              {quiz.score !== undefined && (
                <View style={styles.scoreContainer}>
                  <Ionicons name="trophy" size={18} color="#fb923c" />
                  <Text style={styles.scoreText}>Score: {quiz.score}%</Text>
                  {quiz.hasStarRating && (
                    <Ionicons name="star" size={18} color="#fbbf24" />
                  )}
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.actionButton,
                quiz.score !== undefined ? styles.retakeButton : styles.startButton,
              ]}
            >
              <Text style={styles.actionButtonText}>
                {quiz.score !== undefined ? 'Retake' : 'Start Quiz'}
              </Text>
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={24} color="#fb923c" />
          </View>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 0,
  },
  headerTitle: {
    fontSize: 20,
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
  quizCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e40af',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 16,
    gap: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  quizInfo: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  quizDescription: {
    fontSize: 13,
    color: '#cbd5e1',
    marginTop: 2,
  },
  quizStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  quizStatsText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fb923c',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  startButton: {
    backgroundColor: '#fb923c',
  },
  retakeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#fb923c',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});
