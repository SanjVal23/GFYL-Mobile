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

type RootStackParamList = {
  ChapterDetail: {
    chapterId: number;
    chapterName: string;
    totalVerses: number;
  };
};

type ChapterDetailRouteProp = RouteProp<RootStackParamList, 'ChapterDetail'>;
type ChapterDetailNavigationProp = StackNavigationProp<RootStackParamList, 'ChapterDetail'>;

interface ChapterDetailScreenProps {
  route: ChapterDetailRouteProp;
  navigation: ChapterDetailNavigationProp;
}

interface Verse {
  number: number;
  sanskrit: string;
  translation: string;
  meaning: string;
}

const sampleVerses: { [key: number]: Verse[] } = {
  1: [
    {
      number: 1,
      sanskrit: 'धृतराष्ट्र उवाच | धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः',
      translation: 'Dhritarashtra said: O Sanjaya, what did my sons and the sons of Pandu do when they assembled in the place of pilgrimage at Kurukshetra eager for battle?',
      meaning: 'King Dhritarashtra inquires about the battle preparations at Kurukshetra.',
    },
    {
      number: 2,
      sanskrit: 'सञ्जय उवाच | दृष्ट्वा तु पाण्डवानीकं व्यूढं दुर्योधनस्तदा',
      translation: 'Sanjaya said: O King, having seen the army of the Pandavas arrayed, Prince Duryodhana approached his teacher and spoke the following words.',
      meaning: 'Sanjaya describes Duryodhana approaching Dronacharya after seeing the Pandava army.',
    },
  ],
  2: [
    {
      number: 1,
      sanskrit: 'सञ्जय उवाच | तं तथा कृपयाविष्टमश्रुपूर्णाकुलेक्षणम्',
      translation: 'Sanjaya said: Seeing Arjuna full of compassion, his eyes brimming with tears and despondent, Madhusudana spoke these words.',
      meaning: 'Krishna observes Arjuna overcome with grief and begins his discourse.',
    },
    {
      number: 2,
      sanskrit: 'श्रीभगवानुवाच | कुतस्त्वा कश्मलमिदं विषमे समुपस्थितम्',
      translation: 'The Supreme Lord said: My dear Arjuna, how have these impurities come upon you? They are not at all befitting a man who knows the value of life.',
      meaning: 'Krishna questions why Arjuna has fallen into this state of confusion.',
    },
  ],
};

export default function ChapterDetailScreen({ route }: ChapterDetailScreenProps) {
  const { chapterId, chapterName, totalVerses } = route.params;
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  
  const verses = sampleVerses[chapterId] || [];

  return (
    <LinearGradient colors={['#172554', '#1e3a8a']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.chapterTitle}>Chapter {chapterId}</Text>
        <Text style={styles.chapterName}>{chapterName}</Text>
        <Text style={styles.verseCount}>{totalVerses} Verses</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {verses.length > 0 ? (
          verses.map((verse) => (
            <View key={verse.number} style={styles.verseCard}>
              <TouchableOpacity
                onPress={() =>
                  setSelectedVerse(selectedVerse === verse.number ? null : verse.number)
                }
              >
                <View style={styles.verseHeader}>
                  <View style={styles.verseNumber}>
                    <Text style={styles.verseNumberText}>{verse.number}</Text>
                  </View>
                  <Text style={styles.sanskrit}>{verse.sanskrit}</Text>
                  <Ionicons
                    name={
                      selectedVerse === verse.number
                        ? 'chevron-up'
                        : 'chevron-down'
                    }
                    size={24}
                    color="#fb923c"
                  />
                </View>
              </TouchableOpacity>

              {selectedVerse === verse.number && (
                <View style={styles.verseContent}>
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Translation:</Text>
                    <Text style={styles.sectionText}>{verse.translation}</Text>
                  </View>
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Meaning:</Text>
                    <Text style={styles.sectionText}>{verse.meaning}</Text>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="bookmark-outline" size={20} color="#fb923c" />
                      <Text style={styles.actionText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="share-outline" size={20} color="#fb923c" />
                      <Text style={styles.actionText}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={60} color="#94a3b8" />
            <Text style={styles.emptyText}>
              Verses for this chapter will be available soon
            </Text>
            <Text style={styles.emptySubtext}>
              This chapter contains {totalVerses} verses
            </Text>
          </View>
        )}
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
    borderBottomWidth: 1,
    borderBottomColor: '#1e40af',
  },
  chapterTitle: {
    fontSize: 16,
    color: '#fb923c',
    fontWeight: '600',
  },
  chapterName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  verseCount: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  verseCard: {
    backgroundColor: '#1e40af',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 12,
  },
  verseNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fb923c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verseNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  sanskrit: {
    flex: 1,
    fontSize: 15,
    color: '#fbbf24',
    fontWeight: '500',
  },
  verseContent: {
    padding: 15,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  section: {
    marginTop: 15,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 15,
    color: '#e2e8f0',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#fb923c',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#cbd5e1',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
});
