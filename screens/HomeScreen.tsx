import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLocalization } from '../contexts/LocalizationContext';

const screenWidth = Dimensions.get('window').width;

type DashboardCard = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  locked?: boolean;
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useUser();
  const { colors } = useTheme();
  const { t } = useLocalization();
  const role = user.role || 'student';
  const accessTier = user.accessTier || 'free';

  const studentCards: DashboardCard[] = [
    {
      key: 'gita',
      title: t('home.gita.title', 'Gita for Youth Leadership'),
      subtitle: t('home.gita.subtitle', 'Timeless Wisdom'),
      icon: 'book',
      onPress: () => navigation.navigate('BhagavadGita'),
    },
    {
      key: 'videos',
      title: t('home.videos.title', 'KrishTok'),
      subtitle: t('home.videos.subtitle', 'Scroll short lessons'),
      icon: 'play-circle',
      onPress: () => navigation.navigate('Main', { screen: 'Videos' }),
    },
    {
      key: 'ai',
      title: t('home.ai.title', 'Krishly AI'),
      subtitle: t('home.ai.subtitle', 'Ask me anything'),
      icon: 'chatbubbles',
      onPress: () => navigation.navigate('AIBuddy'),
    },
    {
      key: 'meditation',
      title: t('home.meditation.title', 'Meditation'),
      subtitle: t('home.meditation.subtitle', 'Find Peace'),
      icon: 'flower',
      onPress: () => navigation.navigate('Meditation'),
    },
    {
      key: 'parent-lock',
      title: t('home.parentPortal.title', 'Parent Portal'),
      subtitle: t('home.parentPortal.subtitle', 'Paid family insights and guidance'),
      icon: 'lock-closed',
      locked: true,
    },
  ];

  const parentCards: DashboardCard[] = [
    {
      key: 'family',
      title: t('home.parent.family', 'Family Dashboard'),
      subtitle: t('home.parent.family.subtitle', 'Track devotional progress and engagement'),
      icon: 'people',
      onPress: () => navigation.navigate('Main', { screen: 'Community' }),
    },
    {
      key: 'courses',
      title: t('home.parent.courses', 'Parent Resources'),
      subtitle: t('home.parent.courses.subtitle', 'Guides, storybooks, and teaching material'),
      icon: 'school',
      onPress: () => navigation.navigate('Main', { screen: 'Courses' }),
    },
    {
      key: 'videos',
      title: t('home.videos.title', 'KrishTok'),
      subtitle: t('home.parent.videos.subtitle', 'Share short lessons with students'),
      icon: 'play-circle',
      onPress: () => navigation.navigate('Main', { screen: 'Videos' }),
    },
    {
      key: 'guru',
      title: t('home.guru.title', 'Our Guru'),
      subtitle: t('home.guru.subtitle', 'Spiritual Guide'),
      icon: 'person-circle-outline',
      onPress: () => navigation.navigate('Guru'),
    },
    {
      key: 'community',
      title: t('home.community.title', 'Community'),
      subtitle: t('home.community.subtitle', 'Parent discussions and support'),
      icon: 'chatbox-ellipses',
      onPress: () => navigation.navigate('Main', { screen: 'Community' }),
    },
  ];

  const dashboardCards = role === 'parent' ? parentCards : studentCards;

  return (
    <LinearGradient colors={colors.background} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.logo, { backgroundColor: colors.secondary, borderColor: colors.accent }]}>
              <Ionicons name="leaf" size={32} color={colors.accent} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]}>{t('home.title', 'GFYL')}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('home.subtitle', 'Gita For Your Life')}</Text>
            </View>
          </View>
          <View style={[styles.userBadge, { backgroundColor: colors.cardBackground }]}>
            <Ionicons name="person-circle" size={18} color={colors.accent} />
            <Text style={[styles.userName, { color: colors.text }]}>{user.isGuest ? t('home.guest', 'Guest') : user.name}</Text>
          </View>
        </View>

        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeText, { color: colors.text }]}>
            {role === 'parent' ? t('home.parentWelcome', 'Welcome to the Parent Portal') : t('home.studentWelcome', 'Welcome to the Student Portal')}
          </Text>
          <Text style={[styles.welcomeSubtext, { color: colors.textSecondary }]}>
            {role === 'parent'
              ? t('home.parentWelcome.subtitle', 'Guide your family with structured spiritual content and insights')
              : t('home.studentWelcome.subtitle', 'Explore the free experience and build your daily spiritual practice')}
          </Text>
        </View>

        <View style={[styles.portalHero, { backgroundColor: colors.cardBackground }]}> 
          <View>
            <Text style={[styles.portalBadge, { color: colors.accent }]}> 
              {role === 'parent' ? t('home.portal.parent', 'Parent Portal') : t('home.portal.student', 'Student Portal')}
            </Text>
            <Text style={[styles.portalTitle, { color: colors.text }]}>
              {accessTier === 'paid' ? t('home.tier.paid', 'Paid Experience') : t('home.tier.free', 'Free Experience')}
            </Text>
            <Text style={[styles.portalSubtitle, { color: colors.textSecondary }]}>
              {role === 'parent'
                ? t('home.parentHero', 'Access premium content, parent guidance, and family-centered progress views.')
                : t('home.studentHero', 'The free student path focuses on scripture, short-form content, and daily practice.')}
            </Text>
          </View>
          <View style={[styles.portalStatus, { borderColor: colors.border }]}> 
            <Text style={[styles.portalStatusLabel, { color: colors.textSecondary }]}>{t('home.access', 'Access')}</Text>
            <Text style={[styles.portalStatusValue, { color: colors.text }]}>
              {role === 'parent' ? t('home.parentPaid', 'Parent Paid') : t('home.studentFree', 'Student Free')}
            </Text>
          </View>
        </View>

        {role === 'parent' ? (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}> 
              <Text style={[styles.statValue, { color: colors.text }]}>12</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('home.parent.stat1', 'Lessons Shared')}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}> 
              <Text style={[styles.statValue, { color: colors.text }]}>4</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('home.parent.stat2', 'Weekly Check-ins')}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}> 
              <Text style={[styles.statValue, { color: colors.text }]}>89%</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('home.parent.stat3', 'Engagement')}</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.unlockCard, { backgroundColor: colors.cardBackground }]}> 
            <Ionicons name="sparkles" size={20} color={colors.accent} />
            <Text style={[styles.unlockText, { color: colors.text }]}>
              {t('home.unlockText', 'Parent Portal adds premium family guidance, progress views, and community tools.')}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {role === 'parent' ? t('home.parent.tools', 'Portal Tools') : t('home.student.tools', 'Free Experience')}
          </Text>
          <View style={styles.grid}>
            {dashboardCards.map((card) => (
              <TouchableOpacity
                key={card.key}
                style={[
                  styles.gridCard,
                  { backgroundColor: colors.cardBackground },
                  card.locked && styles.gridCardLocked,
                ]}
                onPress={card.onPress}
                disabled={card.locked}
              >
                <View style={[styles.gridIconCircle, { backgroundColor: colors.primary }]}>
                  <Ionicons name={card.icon} size={28} color={colors.accent} />
                </View>
                <Text style={[styles.gridTitle, { color: colors.text }]}>{card.title}</Text>
                <Text style={[styles.gridSubtitle, { color: colors.textSecondary }]}>{card.subtitle}</Text>
                {card.locked ? (
                  <View style={styles.lockRow}>
                    <Ionicons name="lock-closed" size={14} color={colors.accent} />
                    <Text style={[styles.lockText, { color: colors.accent }]}>{t('home.locked', 'Locked')}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginRight: 12,
  },
  headerText: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  userName: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
  },
  welcomeSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 15,
  },
  portalHero: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    gap: 16,
  },
  portalBadge: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  portalTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  portalSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  portalStatus: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  portalStatusLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  portalStatusValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  unlockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  unlockText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  gridCard: {
    width: (screenWidth - 52) / 2,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  gridCardLocked: {
    opacity: 0.75,
  },
  gridIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  gridSubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  lockText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
