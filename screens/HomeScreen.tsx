import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../contexts/UserContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';

const screenWidth = Dimensions.get('window').width;
const CARD_WIDTH = screenWidth * 0.6;

type CardCategory = 'learn' | 'watch' | 'connect';

type DashboardCard = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  category: CardCategory;
  onPress?: () => void;
  locked?: boolean;
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useUser();
  const { t } = useLocalization();
  const { colors, isDarkMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const role = user.role || 'student';
  const accessTier = user.accessTier || 'free';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | CardCategory>('All');

  const displayName = user.isGuest ? t('home.guest', 'Guest') : user.name.split(' ')[0];
  const initial = displayName.charAt(0).toUpperCase();

  const studentCards: DashboardCard[] = [
    {
      key: 'gita',
      title: t('home.gita.title', 'Gita for Youth Leadership'),
      subtitle: t('home.gita.subtitle', 'Class Materials'),
      icon: 'book',
      category: 'learn',
      onPress: () => navigation.navigate('BhagavadGita'),
    },
    {
      key: 'videos',
      title: t('home.videos.title', 'KrishTok'),
      subtitle: t('home.videos.subtitle', 'Scroll short lessons'),
      icon: 'play-circle',
      category: 'watch',
      onPress: () => navigation.navigate('Main', { screen: 'Videos' }),
    },
    {
      key: 'ai',
      title: t('home.ai.title', 'Krishly AI'),
      subtitle: t('home.ai.subtitle', 'Ask me anything'),
      icon: 'chatbubbles',
      category: 'connect',
      onPress: () => navigation.navigate('AIBuddy'),
    },
    {
      key: 'meditation',
      title: t('home.meditation.title', 'Meditation'),
      subtitle: t('home.meditation.subtitle', 'Find Peace'),
      icon: 'flower',
      category: 'learn',
      onPress: () => navigation.navigate('Meditation'),
    },
    {
      key: 'gita-coach',
      title: t('home.gitaCoach.title', 'Gita Warriors'),
      subtitle: t('home.gitaCoach.subtitle', 'Shloka Pronunciation Coach'),
      icon: 'mic',
      category: 'learn',
      onPress: () => navigation.navigate('GitaCoach'),
    },
    {
      key: 'parent-lock',
      title: t('home.parentPortal.title', 'Parent Portal'),
      subtitle: accessTier !== 'paid'
        ? t('home.parentPortal.lockedSubtitle', 'Enter a membership code to unlock')
        : t('home.parentPortal.subtitle', 'Paid family insights and guidance'),
      icon: 'lock-closed',
      category: 'connect',
      locked: accessTier !== 'paid',
    },
  ];

  const parentCards: DashboardCard[] = [
    {
      key: 'family',
      title: t('home.parent.family', 'Family Dashboard'),
      subtitle: t('home.parent.family.subtitle', 'Track devotional progress and engagement'),
      icon: 'people',
      category: 'connect',
      onPress: () => navigation.navigate('Main', { screen: 'Community' }),
    },
    {
      key: 'courses',
      title: t('home.parent.courses', 'Parent Resources'),
      subtitle: t('home.parent.courses.subtitle', 'Guides, storybooks, and teaching material'),
      icon: 'school',
      category: 'learn',
      onPress: () => navigation.navigate('Main', { screen: 'Courses' }),
    },
    {
      key: 'videos',
      title: t('home.videos.title', 'KrishTok'),
      subtitle: t('home.parent.videos.subtitle', 'Share short lessons with students'),
      icon: 'play-circle',
      category: 'watch',
      onPress: () => navigation.navigate('Main', { screen: 'Videos' }),
    },
    {
      key: 'guru',
      title: t('home.guru.title', 'Our Guru'),
      subtitle: t('home.guru.subtitle', 'Spiritual Guide'),
      icon: 'person-circle-outline',
      category: 'learn',
      onPress: () => navigation.navigate('Guru'),
    },
    {
      key: 'community',
      title: t('home.community.title', 'Community'),
      subtitle: t('home.community.subtitle', 'Parent discussions and support'),
      icon: 'chatbox-ellipses',
      category: 'connect',
      onPress: () => navigation.navigate('Main', { screen: 'Community' }),
    },
  ];

  const teacherCards: DashboardCard[] = [
    {
      key: 'gita-coach-teacher',
      title: t('home.gitaCoachTeacher.title', 'Class Dashboard'),
      subtitle: t('home.gitaCoachTeacher.subtitle', 'Shloka scores for every student'),
      icon: 'bar-chart',
      category: 'connect',
      onPress: () => navigation.navigate('GitaCoachTeacher'),
    },
    {
      key: 'gita-coach',
      title: t('home.gitaCoach.title', 'Gita Warriors'),
      subtitle: t('home.gitaCoach.subtitle', 'Shloka Pronunciation Coach'),
      icon: 'mic',
      category: 'learn',
      onPress: () => navigation.navigate('GitaCoach'),
    },
    {
      key: 'community',
      title: t('home.community.title', 'Community'),
      subtitle: t('home.community.subtitle', 'Parent discussions and support'),
      icon: 'chatbox-ellipses',
      category: 'connect',
      onPress: () => navigation.navigate('Main', { screen: 'Community' }),
    },
  ];

  const dashboardCards = role === 'parent' ? parentCards : role === 'teacher' ? teacherCards : studentCards;
  const categories: Array<'All' | CardCategory> = [
    'All',
    ...Array.from(new Set(dashboardCards.map((card) => card.category))),
  ];
  const categoryLabels: Record<'All' | CardCategory, string> = {
    All: t('home.category.all', 'All'),
    learn: t('home.category.learn', 'Learn'),
    watch: t('home.category.watch', 'Watch'),
    connect: t('home.category.connect', 'Connect'),
  };

  const filteredCards = dashboardCards.filter((card) => {
    const matchesCategory = activeCategory === 'All' || card.category === activeCategory;
    const matchesQuery = card.title.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const resetFilters = () => {
    setSearchQuery('');
    setActiveCategory('All');
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.greetingBlock}>
            <Text style={styles.greeting}>{t('home.greeting', 'Hi, {{name}} 👋').replace('{{name}}', displayName)}</Text>
            <Text style={styles.greetingSubtitle}>
              {role === 'parent'
                ? t('home.parentSubtitle', 'Guide your family’s journey')
                : role === 'teacher'
                ? t('home.teacherSubtitle', 'See how your class is progressing')
                : t('home.studentSubtitle', 'Continue your daily practice')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => navigation.navigate('Main', { screen: 'Profile' })}
            activeOpacity={0.8}
          >
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initial}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>
              {role === 'parent'
                ? t('home.portal.parent', 'Parent Portal')
                : role === 'teacher'
                ? t('home.portal.teacher', 'Teacher Portal')
                : t('home.portal.student', 'Student Portal')}
            </Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>
              {accessTier === 'paid' ? t('home.tier.paid', 'Paid') : t('home.tier.free', 'Free')}
            </Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('home.searchPlaceholder', 'Search practices')}
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
          />
          <View style={styles.searchDivider} />
          <TouchableOpacity onPress={resetFilters} style={styles.searchFilterButton}>
            <Ionicons name="options-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {role === 'parent'
              ? t('home.parent.tools', 'Portal Tools')
              : role === 'teacher'
              ? t('home.teacher.tools', 'Teacher Tools')
              : t('home.student.tools', 'Your Practices')}
          </Text>
          <TouchableOpacity onPress={resetFilters}>
            <Text style={styles.sectionViewAll}>{t('home.viewAll', 'View all')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pillsRow}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[styles.pill, activeCategory === category && styles.pillActive]}
              onPress={() => setActiveCategory(category)}
              activeOpacity={0.85}
            >
              <Text style={[styles.pillText, activeCategory === category && styles.pillTextActive]}>
                {categoryLabels[category]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredCards.length === 0 ? (
          <Text style={styles.emptyText}>{t('home.noResults', 'No matches found.')}</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsRow}
          >
            {filteredCards.map((card) => (
              <TouchableOpacity
                key={card.key}
                onPress={card.onPress}
                disabled={card.locked}
                activeOpacity={0.85}
                style={[styles.card, card.locked && styles.cardLocked]}
              >
                <LinearGradient colors={colors.cardGradient} style={styles.cardGradient}>
                  <View style={styles.cardIconWrap}>
                    <Ionicons name={card.icon} size={48} color={colors.accentText} />
                  </View>
                  <View style={[styles.cardOverlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)' }]}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{card.title}</Text>
                    <Text style={styles.cardSubtitle} numberOfLines={2}>{card.subtitle}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  greetingBlock: {
    flex: 1,
    marginRight: 16,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  greetingSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: colors.accentText,
    fontSize: 18,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  statusPill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 20,
    height: 60,
    paddingHorizontal: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  searchDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  searchFilterButton: {
    padding: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  sectionViewAll: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
  },
  pillActive: {
    backgroundColor: colors.accent,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  pillTextActive: {
    color: colors.accentText,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 12,
  },
  cardsRow: {
    paddingHorizontal: 24,
    gap: 16,
  },
  card: {
    width: CARD_WIDTH,
    height: 320,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardLocked: {
    opacity: 0.55,
  },
  cardGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  cardIconWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardOverlay: {
    alignSelf: 'stretch',
    borderRadius: 16,
    padding: 14,
  },
  cardTitle: {
    color: colors.accentText,
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: colors.cardSubtitle,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
});
