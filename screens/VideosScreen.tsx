import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const screenWidth = Dimensions.get('window').width;

interface VideoItem {
  id: string;
  title: string;
  caption: string;
  url: string;
  category: string;
}

const videos: VideoItem[] = [
  {
    id: '1',
    title: 'Module 0',
    caption: 'Leaders lead themselves first and then others',
    url: 'https://drive.google.com/file/d/1nwekK87bUelwQ6iP1dE7Sxt7C-43nMiU/view?usp=drive_link',
    category: 'Teachings',
  },
  {
    id: '2',
    title: 'Module 1A – Class 1',
    caption: 'Recognize',
    url: 'https://drive.google.com/file/d/1dkcmdhaiczbdYCx9_T69qqSNKcWrIRxq/view?usp=drive_link',
    category: 'Teachings',
  },
  {
    id: '3',
    title: 'Module 1A – Class 3',
    caption: 'Emotional Intelligence',
    url: 'https://drive.google.com/file/d/10pcSTR2VBOmVHZ4Gm0qOTiJysMomaBB6/view?usp=drive_link',
    category: 'Teachings',
  },
];

const categories = ['All', 'Teachings'];

export default function VideosScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredVideos =
    selectedCategory === 'All'
      ? videos
      : videos.filter(v => v.category === selectedCategory);

  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open link:', err));
  };

  return (
    <LinearGradient colors={['#172554', '#1e3a8a']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Krishtok Videos</Text>
      </View>

      <ScrollView
        horizontal
        style={styles.categoriesContainer}
        showsHorizontalScrollIndicator={false}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {filteredVideos.map(video => (
          <TouchableOpacity
            key={video.id}
            style={styles.videoCard}
            onPress={() => openLink(video.url)}
          >
            <View style={styles.videoInfo}>
              <Text style={styles.videoTitle}>{video.title}</Text>
              <Text style={styles.videoCaption}>{video.caption}</Text>
              <View style={styles.openButton}>
                <Text style={styles.openButtonText}>Watch Video</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#1e40af',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  categoriesContainer: { paddingHorizontal: 15, paddingVertical: 15, maxHeight: 60 },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e40af',
    marginRight: 10,
  },
  categoryChipActive: { backgroundColor: '#fb923c' },
  categoryText: { fontSize: 14, color: '#cbd5e1', fontWeight: '500' },
  categoryTextActive: { color: '#fff', fontWeight: '600' },
  videoCard: {
    backgroundColor: '#1e40af',
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
  },
  videoInfo: { },
  videoTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 6 },
  videoCaption: { fontSize: 14, color: '#cbd5e1', lineHeight: 20, marginBottom: 10 },
  openButton: {
    backgroundColor: '#fb923c',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  openButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
