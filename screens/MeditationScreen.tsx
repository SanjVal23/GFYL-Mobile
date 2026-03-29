import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../contexts/UserContext';
import { useLocalization } from '../contexts/LocalizationContext';

const screenWidth = Dimensions.get('window').width;

interface MeditationItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: 'breathing' | 'mantra' | 'guided';
  icon: keyof typeof Ionicons.glyphMap;
}

const meditations: MeditationItem[] = [
  {
    id: '1',
    title: 'Krishna Pranayama',
    description: 'A calming breathing technique to connect with divine consciousness. Inhale for 4 counts, hold for 4, exhale for 4.',
    duration: '5 min',
    type: 'breathing',
    icon: 'leaf',
  },
  {
    id: '2',
    title: 'Hare Krishna Mantra',
    description: 'Chant the maha-mantra: Hare Krishna, Hare Krishna, Krishna Krishna, Hare Hare, Hare Rama, Hare Rama, Rama Rama, Hare Hare',
    duration: '10 min',
    type: 'mantra',
    icon: 'musical-notes',
  },
  {
    id: '3',
    title: 'Box Breathing (Sama Vritti)',
    description: 'Equal breathing - Inhale 4 counts, Hold 4 counts, Exhale 4 counts, Hold 4 counts. Brings balance and calm.',
    duration: '7 min',
    type: 'breathing',
    icon: 'square-outline',
  },
  {
    id: '4',
    title: 'Vrindavan Visualization',
    description: 'Close your eyes and imagine yourself in the holy land of Vrindavan, walking beside Krishna through lush gardens.',
    duration: '15 min',
    type: 'guided',
    icon: 'flower',
  },
  {
    id: '5',
    title: 'Alternate Nostril Breathing',
    description: 'Nadi Shodhana - Purifies the nadis (energy channels). Breathe through left nostril, then right, alternating with gentle breath.',
    duration: '8 min',
    type: 'breathing',
    icon: 'sync',
  },
  {
    id: '6',
    title: 'Gayatri Mantra',
    description: 'Om Bhur Bhuvaḥ Swaḥ, Tat Savitur Vareṇyaṃ, Bhargo Devasya Dhīmahi, Dhiyo Yo Naḥ Prachodayāt',
    duration: '5 min',
    type: 'mantra',
    icon: 'sunny',
  },
  {
    id: '7',
    title: 'Ocean Breath (Ujjayi)',
    description: 'Create a soft ocean sound in the back of your throat while breathing. Calms the nervous system and focuses the mind.',
    duration: '6 min',
    type: 'breathing',
    icon: 'water',
  },
  {
    id: '8',
    title: 'Krishna Consciousness',
    description: 'Meditate on Krishna\'s form, qualities, and pastimes. Focus on His flute, peacock feather, and divine smile.',
    duration: '20 min',
    type: 'guided',
    icon: 'sparkles',
  },
];

type FilterType = 'all' | 'breathing' | 'mantra' | 'guided';

export default function MeditationScreen() {
  const { savedItems, addSavedItem } = useUser();
  const { t } = useLocalization();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale');
  const [timer, setTimer] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (activeSession) {
      const interval = setInterval(() => {
        setTimer(prev => {
          const nextValue = prev + 1;
          // Cycle through breath phases every 4 seconds
          const phase = Math.floor(nextValue / 4) % 4;
          if (phase === 0) setBreathPhase('inhale');
          else if (phase === 1) setBreathPhase('hold');
          else if (phase === 2) setBreathPhase('exhale');
          else setBreathPhase('pause');
          return nextValue;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimer(0);
    }
  }, [activeSession]);

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const filteredMeditations =
    selectedFilter === 'all'
      ? meditations
      : meditations.filter(m => m.type === selectedFilter);

  const startSession = (id: string) => {
    setActiveSession(id);
    setTimer(0);
    setBreathPhase('inhale');
  };

  const stopSession = () => {
    setActiveSession(null);
    setTimer(0);
  };

  const isMeditationSaved = (id: string) =>
    savedItems.some(item => item.id === `meditation-${id}` || item.id.endsWith(`meditation-${id}`));

  const handleSaveMeditation = (meditation: MeditationItem) => {
    if (isMeditationSaved(meditation.id)) return;
    addSavedItem({
      id: `meditation-${meditation.id}`,
      title: `Meditation: ${meditation.title}`,
      type: 'meditation',
      icon: 'flower',
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBreathPhaseColor = () => {
    switch (breathPhase) {
      case 'inhale': return '#60a5fa';
      case 'hold': return '#fb923c';
      case 'exhale': return '#34d399';
      case 'pause': return '#a78bfa';
      default: return '#60a5fa';
    }
  };

  const getBreathPhaseText = () => {
    switch (breathPhase) {
      case 'inhale': return 'Breathe In...';
      case 'hold': return 'Hold...';
      case 'exhale': return 'Breathe Out...';
      case 'pause': return 'Pause...';
      default: return '';
    }
  };

  return (
    <LinearGradient colors={['#172554', '#1e3a8a']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('meditation.title', 'Krishna Meditation')}</Text>
        <Text style={styles.headerSubtitle}>{t('meditation.subtitle', 'Find peace through breath and devotion')}</Text>
      </View>

      {/* Active Session Display */}
      {activeSession && (
        <View style={styles.activeSessionContainer}>
          <Animated.View
            style={[
              styles.breathCircle,
              {
                transform: [{ scale: pulseAnim }],
                backgroundColor: getBreathPhaseColor(),
              },
            ]}
          >
            <Text style={styles.breathPhaseText}>{getBreathPhaseText()}</Text>
            <Text style={styles.timerText}>{formatTime(timer)}</Text>
          </Animated.View>
          <TouchableOpacity style={styles.stopButton} onPress={stopSession}>
            <Ionicons name="stop-circle" size={24} color="#fff" />
            <Text style={styles.stopButtonText}>{t('meditation.endSession', 'End Session')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Chips */}
      <ScrollView
        horizontal
        style={styles.filterContainer}
        showsHorizontalScrollIndicator={false}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedFilter === 'all' && styles.filterChipActive,
          ]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === 'all' && styles.filterTextActive,
            ]}
          >
            {t('meditation.filter.all', 'All')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedFilter === 'breathing' && styles.filterChipActive,
          ]}
          onPress={() => setSelectedFilter('breathing')}
        >
          <Ionicons
            name="leaf"
            size={16}
            color={selectedFilter === 'breathing' ? '#fff' : '#cbd5e1'}
          />
          <Text
            style={[
              styles.filterText,
              selectedFilter === 'breathing' && styles.filterTextActive,
            ]}
          >
            {t('meditation.filter.breathing', 'Breathing')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedFilter === 'mantra' && styles.filterChipActive,
          ]}
          onPress={() => setSelectedFilter('mantra')}
        >
          <Ionicons
            name="musical-notes"
            size={16}
            color={selectedFilter === 'mantra' ? '#fff' : '#cbd5e1'}
          />
          <Text
            style={[
              styles.filterText,
              selectedFilter === 'mantra' && styles.filterTextActive,
            ]}
          >
            {t('meditation.filter.mantra', 'Mantras')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedFilter === 'guided' && styles.filterChipActive,
          ]}
          onPress={() => setSelectedFilter('guided')}
        >
          <Ionicons
            name="sparkles"
            size={16}
            color={selectedFilter === 'guided' ? '#fff' : '#cbd5e1'}
          />
          <Text
            style={[
              styles.filterText,
              selectedFilter === 'guided' && styles.filterTextActive,
            ]}
          >
            {t('meditation.filter.guided', 'Guided')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Meditation List */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        {filteredMeditations.map(meditation => (
          <View key={meditation.id} style={styles.meditationCard}>
            <View style={styles.meditationHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name={meditation.icon} size={24} color="#fb923c" />
              </View>
              <View style={styles.meditationInfo}>
                <Text style={styles.meditationTitle}>{meditation.title}</Text>
                <Text style={styles.meditationDuration}>
                  <Ionicons name="time-outline" size={14} color="#94a3b8" />
                  {' '}{meditation.duration}
                </Text>
              </View>
            </View>
            <Text style={styles.meditationDescription}>
              {meditation.description}
            </Text>
            <View style={styles.actionRow}>
              {!activeSession && (
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => startSession(meditation.id)}
                >
                  <Ionicons name="play" size={18} color="#fff" />
                  <Text style={styles.startButtonText}>{t('meditation.begin', 'Begin Practice')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isMeditationSaved(meditation.id) && styles.saveButtonSaved,
                ]}
                onPress={() => handleSaveMeditation(meditation)}
                disabled={isMeditationSaved(meditation.id)}
              >
                <Ionicons
                  name={isMeditationSaved(meditation.id) ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color="#fff"
                />
                <Text style={styles.saveButtonText}>
                  {isMeditationSaved(meditation.id) ? t('common.saved', 'Saved') : t('common.save', 'Save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Tips Section */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={24} color="#fbbf24" />
            <Text style={styles.tipsTitle}>{t('meditation.tips', 'Meditation Tips')}</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Find a quiet, comfortable place where you won't be disturbed
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Sit with a straight spine, either cross-legged or on a chair
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Start with shorter sessions and gradually increase duration
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Practice at the same time daily for best results
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Be patient and gentle with yourself - meditation is a journey
            </Text>
          </View>
        </View>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  activeSessionContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#1e40af',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 16,
  },
  breathCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  breathPhaseText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterContainer: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    maxHeight: 60,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e40af',
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: '#fb923c',
  },
  filterText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  meditationCard: {
    backgroundColor: '#1e40af',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
  },
  meditationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#172554',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  meditationInfo: {
    flex: 1,
  },
  meditationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  meditationDuration: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  meditationDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    marginBottom: 15,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  startButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fb923c',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  startButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e3a8a',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  saveButtonSaved: {
    backgroundColor: '#16a34a',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  tipsCard: {
    backgroundColor: '#1e40af',
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
    marginBottom: 15,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tipBullet: {
    color: '#fb923c',
    fontSize: 18,
    marginRight: 10,
    fontWeight: 'bold',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },
});
