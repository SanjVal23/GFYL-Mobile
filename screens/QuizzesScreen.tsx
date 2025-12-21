import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type Storybook = {
  id: string;
  title: string;
  description: string;
  ageGroup: string;
  pages: number;
  recommended?: boolean;
  pdfUrl: string;
};

const storybooksData: Storybook[] = [
  {
    id: '1',
    title: 'The Warrior’s Silence',
    description: 'A story of courage and calmness on the battlefield.',
    ageGroup: '6+',
    pages: 12,
    pdfUrl: 'https://gemini.google.com/share/07a85c1b4c46',
  },
  {
    id: '2',
    title: 'The Trembling Archer',
    description: 'Arjuna’s inner struggle and Krishna’s guidance.',
    ageGroup: '8+',
    pages: 15,
    recommended: true,
    pdfUrl: 'https://gemini.google.com/share/a392ba30fb70',
  },
  {
    id: '3',
    title: 'Chariot of Clarity',
    description: 'Lessons from the battlefield of Kurukshetra.',
    ageGroup: '10+',
    pages: 18,
    pdfUrl: 'https://gemini.google.com/share/98b41fba0b5c',
  },
];

const getAgeColor = (ageGroup: string) => {
  switch (ageGroup) {
    case '5+':
      return '#34d399'; // green
    case '6+':
      return '#3b82f6'; // blue
    case '8+':
      return '#fbbf24'; // yellow
    case '10+':
      return '#ef4444'; // red
    default:
      return '#94a3b8'; // gray
  }
};

export default function StorybooksScreen() {
  const openPdf = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error('Failed to open URL:', err)
    );
  };

  return (
    <LinearGradient colors={['#172554', '#1e3a8a']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gita Storybooks</Text>
        <Text style={styles.headerSubtitle}>Stories for Kids</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {storybooksData.map((book) => (
          <View key={book.id} style={styles.bookCard}>
            <View
              style={[styles.ageBadge, { backgroundColor: getAgeColor(book.ageGroup) }]}
            >
              <Text style={styles.ageText}>{book.ageGroup}</Text>
            </View>

            <View style={styles.bookInfo}>
              <Text style={styles.bookTitle}>{book.title}</Text>
              <Text style={styles.bookDescription}>{book.description}</Text>

              <View style={styles.bookStats}>
                <Ionicons name="book-outline" size={16} color="#94a3b8" />
                <Text style={styles.bookStatsText}>{book.pages} pages</Text>
              </View>

              {book.recommended && (
                <View style={styles.recommendedBadge}>
                  <Ionicons name="star" size={16} color="#fbbf24" />
                  <Text style={styles.recommendedText}>Recommended</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.actionButton, styles.readButton]}
              onPress={() => openPdf(book.pdfUrl)}
            >
              <Text style={styles.actionButtonText}>Read</Text>
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
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 0 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#cbd5e1', marginTop: 4 },
  scrollView: { flex: 1 },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e40af',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 16,
    gap: 12,
  },
  ageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  ageText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
  bookInfo: { flex: 1 },
  bookTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  bookDescription: { fontSize: 13, color: '#cbd5e1', marginTop: 2 },
  bookStats: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  bookStatsText: { fontSize: 12, color: '#94a3b8' },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recommendedText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  actionButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  readButton: { backgroundColor: '#fb923c' },
  actionButtonText: { fontSize: 13, fontWeight: '600', color: '#fff' },
});
