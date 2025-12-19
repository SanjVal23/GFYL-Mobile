import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface Video {
  id: string;
  title: string;
  channel: string;
  duration: string;
  views: string;
  thumbnail: string;
  category: string;
}

const videos: Video[] = [
  {
    id: '1',
    title: 'Introduction to Bhagavad Gita - Complete Overview',
    channel: 'Spiritual Wisdom',
    duration: '45:30',
    views: '125K',
    thumbnail: 'https://images.unsplash.com/photo-1541795083-1b160cf4f3d7?w=400',
    category: 'Teachings',
  },
  {
    id: '2',
    title: 'Chapter 2 Explained - Sankhya Yoga in Detail',
    channel: 'Gita Teachings',
    duration: '1:12:45',
    views: '89K',
    thumbnail: 'https://images.unsplash.com/photo-1518414922567-55217c7e9dd7?w=400',
    category: 'Teachings',
  },
  {
    id: '3',
    title: 'Daily Morning Meditation - Guided Practice',
    channel: 'Meditation Guide',
    duration: '20:00',
    views: '250K',
    thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
    category: 'Meditation',
  },
  {
    id: '4',
    title: 'Bhajan: Hare Krishna Maha Mantra',
    channel: 'Devotional Music',
    duration: '15:30',
    views: '500K',
    thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
    category: 'Music',
  },
  {
    id: '5',
    title: 'Stories from Mahabharata - Arjuna\'s Journey',
    channel: 'Epic Tales',
    duration: '35:20',
    views: '180K',
    thumbnail: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400',
    category: 'Stories',
  },
  {
    id: '6',
    title: 'Karma Yoga - Performing Actions Without Attachment',
    channel: 'Spiritual Wisdom',
    duration: '28:15',
    views: '95K',
    thumbnail: 'https://images.unsplash.com/photo-1510138225543-98398849e74a?w=400',
    category: 'Teachings',
  },
];

const categories = ['All', 'Teachings', 'Meditation', 'Music', 'Stories'];

export default function VideosScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const filteredVideos = selectedCategory === 'All'
    ? videos
    : videos.filter(v => v.category === selectedCategory);

  return (
    <LinearGradient colors={['#172554', '#1e3a8a']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Spiritual Videos</Text>
      </View>

      <ScrollView horizontal style={styles.categoriesContainer} showsHorizontalScrollIndicator={false}>
        {categories.map((category) => (
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

      <ScrollView style={styles.scrollView}>
        {filteredVideos.map((video) => (
          <TouchableOpacity key={video.id} style={styles.videoCard}>
            <View style={styles.thumbnailContainer}>
              <Image source={{ uri: video.thumbnail }} style={styles.thumbnail} />
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{video.duration}</Text>
              </View>
              <View style={styles.playOverlay}>
                <Ionicons name="play" size={40} color="#fff" />
              </View>
            </View>
            <View style={styles.videoInfo}>
              <Text style={styles.videoTitle} numberOfLines={2}>
                {video.title}
              </Text>
              <View style={styles.videoMeta}>
                <Text style={styles.channelName}>{video.channel}</Text>
                <View style={styles.metaDivider} />
                <Text style={styles.views}>{video.views} views</Text>
              </View>
              <View style={styles.videoActions}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="bookmark-outline" size={20} color="#94a3b8" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="share-outline" size={20} color="#94a3b8" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="ellipsis-vertical" size={20} color="#94a3b8" />
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
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#1e40af',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  categoriesContainer: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    maxHeight: 60,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e40af',
    marginRight: 10,
  },
  categoryChipActive: {
    backgroundColor: '#fb923c',
  },
  categoryText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  videoCard: {
    backgroundColor: '#1e40af',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#334155',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  videoInfo: {
    padding: 15,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 22,
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  channelName: {
    fontSize: 13,
    color: '#94a3b8',
  },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#94a3b8',
    marginHorizontal: 8,
  },
  views: {
    fontSize: 13,
    color: '#94a3b8',
  },
  videoActions: {
    flexDirection: 'row',
    gap: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  actionBtn: {
    padding: 5,
  },
});
