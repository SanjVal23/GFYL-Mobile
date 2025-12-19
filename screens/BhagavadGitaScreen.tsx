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
import { useNavigation } from '@react-navigation/native';
import { Chapter } from '../types';

const chapters: Chapter[] = [
  { id: 1, name: 'Arjuna Vishada Yoga', verses: 47 },
  { id: 2, name: 'Sankhya Yoga', verses: 72, isBookmarked: true },
  { id: 3, name: 'Karma Yoga', verses: 43, isBookmarked: true },
  { id: 4, name: 'Jnana Karma Sanyasa Yoga', verses: 42 },
  { id: 5, name: 'Karma Sanyasa Yoga', verses: 29 },
  { id: 6, name: 'Dhyana Yoga', verses: 47 },
  { id: 7, name: 'Jnana Vijnana Yoga', verses: 30 },
  { id: 8, name: 'Aksara Brahma Yoga', verses: 28 },
  { id: 9, name: 'Raja Vidya Yoga', verses: 34 },
  { id: 10, name: 'Vibhuti Yoga', verses: 42 },
  { id: 11, name: 'Vishvarupa Darshana Yoga', verses: 55 },
  { id: 12, name: 'Bhakti Yoga', verses: 20 },
  { id: 13, name: 'Kshetra Kshetragna Vibhaga Yoga', verses: 35 },
  { id: 14, name: 'Gunatraya Vibhaga Yoga', verses: 27 },
  { id: 15, name: 'Purushottama Yoga', verses: 20 },
  { id: 16, name: 'Daivasura Sampad Vibhaga Yoga', verses: 24 },
  { id: 17, name: 'Shraddhatraya Vibhaga Yoga', verses: 28 },
  { id: 18, name: 'Moksha Sanyasa Yoga', verses: 78 },
];

export default function BhagavadGitaScreen() {
  const navigation = useNavigation<any>();
  const [bookmarkedChapters, setBookmarkedChapters] = useState<number[]>([2, 3]);

  const toggleBookmark = (chapterId: number) => {
    setBookmarkedChapters((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  return (
    <LinearGradient colors={['#172554', '#1e3a8a']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bhagavad Gita</Text>
        <Text style={styles.headerSubtitle}>18 Chapters • 700 Verses</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {chapters.map((chapter) => (
          <TouchableOpacity
            key={chapter.id}
            onPress={() =>
              navigation.navigate('ChapterDetail', {
                chapterId: chapter.id,
                chapterName: chapter.name,
                totalVerses: chapter.verses,
              })
            }
          >
            <View style={styles.chapterCard}>
              <View style={styles.chapterNumber}>
                <Text style={styles.chapterNumberText}>{chapter.id}</Text>
              </View>
              <View style={styles.chapterInfo}>
                <Text style={styles.chapterName}>{chapter.name}</Text>
                <Text style={styles.chapterVerses}>{chapter.verses} verses</Text>
              </View>
              <View style={styles.chapterActions}>
                {bookmarkedChapters.includes(chapter.id) && (
                  <TouchableOpacity onPress={() => toggleBookmark(chapter.id)}>
                    <Ionicons name="bookmark" size={20} color="#34d399" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity>
                  <Ionicons name="chevron-forward" size={24} color="#fb923c" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
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
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e40af',
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
    gap: 15,
  },
  chapterNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fb923c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterNumberText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  chapterInfo: {
    flex: 1,
  },
  chapterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  chapterVerses: {
    fontSize: 13,
    color: '#cbd5e1',
    marginTop: 3,
  },
  chapterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
