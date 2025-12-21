import React from 'react';
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
import { User } from '../types';
import { useNavigation } from '@react-navigation/native';

interface HomeScreenProps {
  user: User;
}

export default function HomeScreen({ user }: HomeScreenProps) {
  const navigation = useNavigation<any>();

  return (
    <LinearGradient colors={['#172554', '#1e3a8a']} style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Ionicons name="leaf" size={30} color="#fb923c" />
              </View>
            </View>
            <Text style={styles.title}>Gita For Youth Leadership</Text>
            <Text style={styles.subtitle}>Gita For Your Life</Text>
          </View>
          <View style={styles.userBadge}>
            <Ionicons name="person-circle" size={20} color="#fb923c" />
            <Text style={styles.userName}>{user.isGuest ? 'Demo User' : user.name}</Text>
          </View>
        </View>

        {/* Bhagavad Gita Section */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('BhagavadGita')}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="book" size={28} color="#fff" />
            </View>
            <Text style={styles.cardTitle}>Gita for Youth Leadership</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.listItem}>
              <Ionicons name="book-outline" size={20} color="#60a5fa" />
              <Text style={styles.listItemText}>Introduction to Hinduism</Text>
            </View>
            <View style={styles.listItem}>
              <Ionicons name="book-outline" size={20} color="#60a5fa" />
              <Text style={styles.listItemText}>Life of Krishna</Text>
            </View>
            <View style={styles.listItem}>
              <Ionicons name="book-outline" size={20} color="#60a5fa" />
              <Text style={styles.listItemText}>Daily Practices</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* AI Buddy */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('AIBuddy')}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: '#fb923c' }]}>
              <Ionicons name="chatbubbles" size={28} color="#fff" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Krishly AI</Text>
              <Text style={styles.cardSubtitle}>Your AI companion for spiritual guidance</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Courses */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Main', { screen: 'Courses' })}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: '#f97316' }]}>
              <Ionicons name="school" size={28} color="#fff" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Marketing</Text>
              <Text style={styles.cardSubtitle}>GFYL Marketing Content</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Quizzes */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Quizzes')}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: '#eab308' }]}>
              <Ionicons name="help-circle" size={28} color="#fff" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Storybooks</Text>
              <Text style={styles.cardSubtitle}>Learn with books!</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Videos */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Main', { screen: 'Videos' })}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: '#3b82f6' }]}>
              <Ionicons name="play-circle" size={28} color="#fff" />
            </View>
            <View>
              <Text style={styles.cardTitle}>KrishTok</Text>
              <Text style={styles.cardSubtitle}>Tiktok? Nah. KrishTok</Text>
            </View>
          </View>
        </TouchableOpacity>


{/* Guru Card */}
<TouchableOpacity
  style={styles.card}
  onPress={() => navigation.navigate('Guru')}
>
  <View style={styles.cardHeader}>
    <View style={[styles.cardIconContainer, { backgroundColor: '#34d399' }]}>
      <Ionicons name="person-circle-outline" size={28} color="#fff" />
    </View>
    <View>
      <Text style={styles.cardTitle}>Our Guru</Text>
      <Text style={styles.cardSubtitle}>Krishna & Maharaj Ji by your side</Text>
    </View>
  </View>
</TouchableOpacity>




        {/* Community Forums */}
        <TouchableOpacity
          style={[styles.card, { marginBottom: 30 }]}
          onPress={() => navigation.navigate('Main', { screen: 'Community' })}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: '#f59e0b' }]}>
              <Ionicons name="people" size={28} color="#fff" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Meditation</Text>
            </View>
          </View>
        </TouchableOpacity>
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
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e40af',
    borderWidth: 3,
    borderColor: '#fb923c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    marginTop: 4,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e40af',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  userName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1e40af',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 16,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fb923c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#cbd5e1',
    marginTop: 2,
  },
  cardContent: {
    marginTop: 15,
    gap: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listItemText: {
    fontSize: 15,
    color: '#e2e8f0',
  },
});
