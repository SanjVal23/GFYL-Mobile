import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useTheme } from '../contexts/ThemeContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { useUser } from '../contexts/UserContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const FEED_HEIGHT = screenHeight - 150;

interface VideoItem {
  id: string;
  title: string;
  caption: string;
  url: string;
  category: string;
  creator: string;
  likes: number;
  coverColors: [string, string];
}

const videos: VideoItem[] = [
  {
    id: '1',
    title: 'Module 0',
    caption: 'Leaders lead themselves first and then others',
    url: 'https://drive.google.com/file/d/1nwekK87bUelwQ6iP1dE7Sxt7C-43nMiU/view?usp=drive_link',
    category: 'Teachings',
    creator: 'GFYL',
    likes: 182,
    coverColors: ['#0f172a', '#ea580c'],
  },
  {
    id: '2',
    title: 'Module 1A – Class 1',
    caption: 'Recognize',
    url: 'https://drive.google.com/file/d/1dkcmdhaiczbdYCx9_T69qqSNKcWrIRxq/view?usp=drive_link',
    category: 'Teachings',
    creator: 'GFYL',
    likes: 236,
    coverColors: ['#1e1b4b', '#2563eb'],
  },
  {
    id: '3',
    title: 'Module 1A – Class 3',
    caption: 'Emotional Intelligence',
    url: 'https://drive.google.com/file/d/10pcSTR2VBOmVHZ4Gm0qOTiJysMomaBB6/view?usp=drive_link',
    category: 'Teachings',
    creator: 'GFYL',
    likes: 321,
    coverColors: ['#172554', '#7c3aed'],
  },
];

const categories = ['All', 'Teachings'];

const toPlayableVideoUrl = (url: string) => {
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)\//);
  if (driveMatch?.[1]) {
    return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  }
  return url;
};

export default function VideosScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeVideoId, setActiveVideoId] = useState(videos[0]?.id ?? '');
  const [likedVideoIds, setLikedVideoIds] = useState<Record<string, boolean>>({});
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});
  const [isMuted, setIsMuted] = useState(true);
  const listRef = useRef<FlatList<VideoItem>>(null);
  const { colors } = useTheme();
  const { t } = useLocalization();
  const { savedItems, addSavedItem } = useUser();

  const filteredVideos = useMemo(
    () =>
    selectedCategory === 'All'
      ? videos
      : videos.filter(v => v.category === selectedCategory),
    [selectedCategory]
  );

  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open link:', err));
  };

  const handleLike = (videoId: string) => {
    setLikedVideoIds(prev => ({ ...prev, [videoId]: !prev[videoId] }));
  };

  const handleSave = (video: VideoItem) => {
    if (savedItems.some(item => item.id.endsWith(`video-${video.id}`) || item.id === `video-${video.id}`)) {
      return;
    }

    addSavedItem({
      id: `video-${video.id}`,
      title: video.title,
      type: 'video',
      icon: 'play-circle',
    });
  };

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.y / FEED_HEIGHT);
    const nextVideo = filteredVideos[nextIndex];
    if (nextVideo) {
      setActiveVideoId(nextVideo.id);
    }
  };

  const renderVideo = ({ item }: { item: VideoItem }) => {
    const liked = !!likedVideoIds[item.id];
    const saved = savedItems.some(savedItem => savedItem.id.endsWith(`video-${item.id}`) || savedItem.id === `video-${item.id}`);
    const likeCount = item.likes + (liked ? 1 : 0);
    const shouldPlay = item.id === activeVideoId;
    const playableUrl = toPlayableVideoUrl(item.url);
    const hasPlaybackError = !!videoErrors[item.id];

    return (
      <View style={[styles.videoPage, { height: FEED_HEIGHT }]}>
        <LinearGradient colors={item.coverColors} style={styles.videoGradient}>
          {!hasPlaybackError ? (
            <Video
              source={{ uri: playableUrl }}
              style={styles.videoPlayer}
              resizeMode={ResizeMode.COVER}
              shouldPlay={shouldPlay}
              isLooping
              isMuted={isMuted}
              onError={() => {
                setVideoErrors((prev) => ({ ...prev, [item.id]: true }));
              }}
            />
          ) : null}

          <LinearGradient
            colors={['rgba(2, 6, 23, 0.15)', 'rgba(2, 6, 23, 0.8)']}
            style={styles.videoOverlay}
          />

          {hasPlaybackError ? (
            <View style={styles.errorBadge}>
              <Ionicons name="warning-outline" size={14} color="#fff" />
              <Text style={styles.errorBadgeText}>{t('videos.streamUnavailable', 'Inline stream unavailable')}</Text>
            </View>
          ) : null}

          <View style={styles.videoMetaTopRow}>
            <View style={[styles.liveChip, { backgroundColor: colors.cardBackground }]}> 
              <Text style={[styles.liveChipText, { color: colors.text }]}>
                {item.id === activeVideoId ? t('videos.nowPlaying', 'Now Playing') : t('videos.upNext', 'In Feed')}
              </Text>
            </View>
            <View style={styles.topRightActions}>
              <TouchableOpacity style={styles.watchInlineButton} onPress={() => setIsMuted((prev) => !prev)}>
                <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={16} color="#fff" />
                <Text style={styles.watchInlineButtonText}>{isMuted ? t('videos.unmute', 'Unmute') : t('videos.mute', 'Mute')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.watchInlineButton} onPress={() => openLink(item.url)}>
                <Ionicons name="open-outline" size={16} color="#fff" />
                <Text style={styles.watchInlineButtonText}>{t('videos.open', 'Open')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.videoContentRow}>
            <View style={styles.videoTextColumn}>
              <Text style={styles.creatorHandle}>@{item.creator.toLowerCase()}</Text>
              <Text style={styles.videoTitle}>{item.title}</Text>
              <Text style={styles.videoCaption}>{item.caption}</Text>
              <Text style={styles.videoHint}>
                {t('videos.feedHint', 'Swipe up for the next lesson. Videos now autoplay in-feed.')}
              </Text>
            </View>

            <View style={styles.actionsColumn}>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(item.id)}>
                <View style={[styles.actionIconCircle, liked && styles.actionIconCircleLiked]}>
                  <Ionicons name={liked ? 'heart' : 'heart-outline'} size={24} color="#fff" />
                </View>
                <Text style={styles.actionLabel}>{likeCount}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={() => handleSave(item)}>
                <View style={[styles.actionIconCircle, saved && styles.actionIconCircleSaved]}>
                  <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={24} color="#fff" />
                </View>
                <Text style={styles.actionLabel}>{saved ? t('common.saved', 'Saved') : t('common.save', 'Save')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={() => openLink(item.url)}>
                <View style={styles.actionIconCircle}>
                  <Ionicons name="open-outline" size={22} color="#fff" />
                </View>
                <Text style={styles.actionLabel}>{t('videos.open', 'Open')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <LinearGradient colors={colors.background} style={styles.container}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('videos.title', 'Krishtok Videos')}</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}> 
          {t('videos.subtitle', 'Vertical short-form lessons with likes and saves')}
        </Text>
      </View>

      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        style={styles.categoriesContainer}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item: category }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              { backgroundColor: colors.cardBackground },
              selectedCategory === category && { backgroundColor: colors.accent },
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                { color: colors.textSecondary },
                selectedCategory === category && { color: '#fff', fontWeight: '600' },
              ]}
            >
              {t(`videos.category.${category.toLowerCase()}`, category)}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        ref={listRef}
        data={filteredVideos}
        keyExtractor={(item) => item.id}
        renderItem={renderVideo}
        pagingEnabled
        snapToInterval={FEED_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={styles.feedContent}
      />
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
  headerSubtitle: { fontSize: 13, marginTop: 4 },
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
  feedContent: {
    paddingBottom: 20,
  },
  videoPage: {
    width: screenWidth,
    paddingHorizontal: 15,
    paddingBottom: 12,
  },
  videoGradient: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  videoPlayer: {
    ...StyleSheet.absoluteFillObject,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  errorBadge: {
    position: 'absolute',
    top: 86,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(185, 28, 28, 0.9)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    zIndex: 3,
  },
  errorBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  videoMetaTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  topRightActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  liveChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  liveChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  watchInlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  watchInlineButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  videoContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    zIndex: 2,
  },
  videoTextColumn: {
    flex: 1,
  },
  creatorHandle: {
    color: '#e2e8f0',
    fontWeight: '700',
    marginBottom: 8,
  },
  videoTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
  },
  videoCaption: {
    fontSize: 16,
    color: '#e2e8f0',
    lineHeight: 24,
    marginBottom: 12,
  },
  videoHint: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  actionsColumn: {
    alignItems: 'center',
    gap: 16,
    paddingBottom: 8,
  },
  actionButton: {
    alignItems: 'center',
    gap: 6,
  },
  actionIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconCircleLiked: {
    backgroundColor: '#ef4444',
  },
  actionIconCircleSaved: {
    backgroundColor: '#16a34a',
  },
  actionLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});
