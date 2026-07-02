import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';

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

export default function StorybooksScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const openPdf = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error('Failed to open URL:', err)
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Gita Storybooks</Text>
        <Text style={styles.headerSubtitle}>Stories for Kids · Free &amp; Paid</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {storybooksData.map((book) => (
          <View key={book.id} style={styles.bookCard}>
            <View style={styles.ageBadge}>
              <Text style={styles.ageText}>{book.ageGroup}</Text>
            </View>

            <View style={styles.bookInfo}>
              <Text style={styles.bookTitle}>{book.title}</Text>
              <Text style={styles.bookDescription}>{book.description}</Text>

              <View style={styles.bookStats}>
                <Ionicons name="book-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.bookStatsText}>{book.pages} pages</Text>
              </View>

              {book.recommended && (
                <View style={styles.recommendedBadge}>
                  <Ionicons name="star" size={14} color={colors.text} />
                  <Text style={styles.recommendedText}>Recommended</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.readButton}
              onPress={() => openPdf(book.pdfUrl)}
              activeOpacity={0.85}
            >
              <Text style={styles.readButtonText}>Read</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
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
  bookCard: {
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
  ageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    minWidth: 50,
    alignItems: 'center',
    backgroundColor: colors.accent,
  },
  ageText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accentText,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  bookDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bookStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  bookStatsText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  recommendedText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '700',
  },
  readButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  readButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentText,
  },
});
