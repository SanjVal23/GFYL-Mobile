import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../types';
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
  CourseDetail: {
    courseId: string;
    courseTitle: string;
    courseDescription: string;
  };
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<RootStackParamList>();

function TabNavigator({ user }: { user: User }) {
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
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      >
        {() => <HomeScreen user={user} />}
      </Tab.Screen>
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
        {() => <ProfileScreen user={user} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function AppNavigator({ user }: { user: User }) {
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
        {() => <TabNavigator user={user} />}
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
        name="CourseDetail"
        component={CourseDetailScreen}
        options={{ title: 'Course' }}
      />
    </Stack.Navigator>
  );
}
