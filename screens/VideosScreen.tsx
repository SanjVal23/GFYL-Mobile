import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Pressable,
  Animated,
  Linking,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalization } from '../contexts/LocalizationContext';
import { useUser } from '../contexts/UserContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const TAB_BAR_BASE_HEIGHT = 66;

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
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [containerHeight, setContainerHeight] = useState(screenHeight - TAB_BAR_BASE_HEIGHT);
  const FEED_HEIGHT = containerHeight;

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeVideoId, setActiveVideoId] = useState(videos[0]?.id ?? '');
  const [likedVideoIds, setLikedVideoIds] = useState<Record<string, boolean>>({});
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});
  const [isMuted, setIsMuted] = useState(true);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const [centerIcon, setCenterIcon] = useState<'play' | 'pause' | null>(null);
  const centerIconAnim = useRef(new Animated.Value(0)).current;
  const listRef = useRef<FlatList<VideoItem>>(null);
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
    if (nextVideo && nextVideo.id !== activeVideoId) {
      setActiveVideoId(nextVideo.id);
      setManuallyPaused(false);
    }
  };

  const togglePlayPause = () => {
    const nextPaused = !manuallyPaused;
    setManuallyPaused(nextPaused);
    setCenterIcon(nextPaused ? 'pause' : 'play');
    centerIconAnim.setValue(1);
    Animated.timing(centerIconAnim, {
      toValue: 0,
      duration: 650,
      delay: 150,
      useNativeDriver: true,
    }).start(() => setCenterIcon(null));
  };

  const renderVideo = ({ item }: { item: VideoItem }) => {
    const liked = !!likedVideoIds[item.id];
    const saved = savedItems.some(savedItem => savedItem.id.endsWith(`video-${item.id}`) || savedItem.id === `video-${item.id}`);
    const likeCount = item.likes + (liked ? 1 : 0);
    const isActive = item.id === activeVideoId;
    const shouldPlay = isActive && !manuallyPaused && isFocused;
    const playableUrl = toPlayableVideoUrl(item.url);
    const hasPlaybackError = !!videoErrors[item.id];

    return (
      <View style={[styles.videoPage, { height: FEED_HEIGHT }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={isActive ? togglePlayPause : undefined}
        >
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
          ) : (
            <LinearGradient colors={item.coverColors} style={styles.videoPlayer} />
          )}
        </Pressable>

        {isActive && centerIcon && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.centerIconWrap,
              {
                opacity: centerIconAnim,
                transform: [
                  {
                    scale: centerIconAnim.interpolate({ inputRange: [0, 1], outputRange: [1.35, 1] }),
                  },
                ],
              },
            ]}
          >
            <Ionicons name={centerIcon === 'pause' ? 'pause' : 'play'} size={52} color="#ffffff" />
          </Animated.View>
        )}

        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']}
          style={styles.topScrim}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
          style={styles.bottomScrim}
          pointerEvents="none"
        />

        {hasPlaybackError ? (
          <View style={[styles.errorBadge, { top: insets.top + 70 }]}>
            <Ionicons name="warning-outline" size={14} color="#fff" />
            <Text style={styles.errorBadgeText}>{t('videos.streamUnavailable', 'Inline stream unavailable')}</Text>
          </View>
        ) : null}

        <View style={styles.videoContentRow} pointerEvents="box-none">
          <View style={styles.videoTextColumn} pointerEvents="none">
            <Text style={styles.creatorHandle}>@{item.creator.toLowerCase()}</Text>
            <Text style={styles.videoCaption}>{item.caption}</Text>
            <View style={styles.soundRow}>
              <Ionicons name="musical-notes" size={13} color="#fff" />
              <Text style={styles.soundText}>Original Sound - {item.creator}</Text>
            </View>
          </View>

          <View style={styles.actionsColumn}>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(item.id)} activeOpacity={0.8}>
              <View style={[styles.actionIconCircle, liked && styles.actionIconCircleLiked]}>
                <Ionicons name={liked ? 'heart' : 'heart-outline'} size={26} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>{likeCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => handleSave(item)} activeOpacity={0.8}>
              <View style={[styles.actionIconCircle, saved && styles.actionIconCircleSaved]}>
                <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={24} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>{saved ? t('common.saved', 'Saved') : t('common.save', 'Save')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => openLink(item.url)} activeOpacity={0.8}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="open-outline" size={22} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>{t('videos.open', 'Open')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View
      style={styles.container}
      onLayout={(event) => setContainerHeight(event.nativeEvent.layout.height)}
    >
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
      />

      <View style={[styles.topOverlay, { paddingTop: insets.top + 10 }]} pointerEvents="box-none">
        <View style={styles.topBarRow}>
          <View style={styles.brandRow}>
            {navigation.canGoBack() && (
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                <Ionicons name="chevron-back" size={18} color="#fff" />
              </TouchableOpacity>
            )}
            <View style={styles.brandIcon}>
              <Ionicons name="play" size={14} color="#fff" />
            </View>
            <Text style={styles.brandTitle}>{t('videos.title', 'Krishtok')}</Text>
          </View>
          <TouchableOpacity style={styles.muteButton} onPress={() => setIsMuted((prev) => !prev)} activeOpacity={0.8}>
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
          renderItem={({ item: category }) => (
            <TouchableOpacity
              style={[styles.categoryPill, selectedCategory === category && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(category)}
              activeOpacity={0.85}
            >
              <Text style={[styles.categoryPillText, selectedCategory === category && styles.categoryPillTextActive]}>
                {t(`videos.category.${category.toLowerCase()}`, category)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoPage: {
    width: screenWidth,
  },
  videoPlayer: {
    ...StyleSheet.absoluteFillObject,
  },
  centerIconWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  bottomScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  errorBadge: {
    position: 'absolute',
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
  videoContentRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    gap: 14,
  },
  videoTextColumn: {
    flex: 1,
  },
  creatorHandle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 6,
  },
  videoCaption: {
    fontSize: 14,
    color: '#f1f1f1',
    lineHeight: 20,
    marginBottom: 10,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  soundText: {
    fontSize: 12,
    color: '#f1f1f1',
    fontWeight: '500',
  },
  actionsColumn: {
    alignItems: 'center',
    gap: 16,
    paddingBottom: 4,
  },
  actionButton: {
    alignItems: 'center',
    gap: 6,
  },
  actionIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
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
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  muteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesRow: {
    gap: 8,
    paddingTop: 14,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  categoryPillActive: {
    backgroundColor: '#ffffff',
  },
  categoryPillText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: '#111111',
    fontWeight: '700',
  },
});
