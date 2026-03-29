import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import {
  HomeScreen,
  CoursesScreen,
  CommunityScreen,
  VideosScreen,
  ProfileScreen,
  BhagavadGitaScreen,
  GuruScreen,
  AIBuddyScreen,
  QuizzesScreen,
  ChapterDetailScreen,
  CourseDetailScreen,
  MeditationScreen,
} from '../screens';

export type RootStackParamList = {
  Main: undefined;
  Guru: undefined;
  BhagavadGita: undefined;
  ChapterDetail: {
    chapterId: number;
    chapterName: string;
    totalVerses: number;
  };
  AIBuddy: undefined;
  Quizzes: undefined;
  Meditation: undefined;
  CourseDetail: {
    courseId: string;
    courseTitle: string;
    courseDescription: string;
  };
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<RootStackParamList>();

function TabNavigator({ onLogout }: { onLogout: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1e3a8a',
          borderTopWidth: 0,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarActiveTintColor: '#fb923c',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Courses"
        component={CoursesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Videos"
        component={VideosScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="play-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      >
        {() => <ProfileScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function AppNavigator({ onLogout }: { onLogout: () => void }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1e3a8a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Main"
        options={{ headerShown: false }}
      >
        {() => <TabNavigator onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen
        name="BhagavadGita"
        component={BhagavadGitaScreen}
        options={{ title: 'Bhagavad Gita' }}
      />
      <Stack.Screen
        name="Guru"
        component={GuruScreen}
        options={{ title: 'Our Guru' }}
      />
      <Stack.Screen
        name="ChapterDetail"
        component={ChapterDetailScreen}
        options={{ title: 'Chapter Details' }}
      />
      <Stack.Screen
        name="AIBuddy"
        component={AIBuddyScreen}
        options={{ title: 'AI Buddy' }}
      />
      <Stack.Screen
        name="Quizzes"
        component={QuizzesScreen}
        options={{ title: 'Quizzes' }}
      />
      <Stack.Screen
        name="Meditation"
        component={MeditationScreen}
        options={{ title: 'Meditation' }}
      />
      <Stack.Screen
        name="CourseDetail"
        component={CourseDetailScreen}
        options={{ title: 'Course' }}
      />
    </Stack.Navigator>
  );
}
