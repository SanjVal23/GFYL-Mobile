import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import {
  HomeScreen,
  CoursesScreen,
  CommunityScreen,
  VideosScreen,
  ProfileScreen,
  BhagavadGitaScreen,
  GuruScreen,
  AIBuddyScreen,
  StorybooksScreen,
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
  Meditation: undefined;
  CourseDetail: {
    courseId: string;
    courseTitle: string;
    courseDescription: string;
  };
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<RootStackParamList>();

const { width: screenWidth } = Dimensions.get('window');
const VISIBLE_TAB_COUNT = 4;
const TAB_ITEM_WIDTH = screenWidth / VISIBLE_TAB_COUNT;

function TabIcon({ name, focused }: { name: keyof typeof Ionicons.glyphMap; focused: boolean }) {
  const { colors } = useTheme();
  const tabIconStyles = useMemo(() => createTabIconStyles(colors), [colors]);

  return (
    <View style={tabIconStyles.wrap}>
      <View style={[tabIconStyles.iconBox, focused && tabIconStyles.iconBoxActive]}>
        <Ionicons name={name} size={22} color={focused ? colors.accentText : colors.textSecondary} />
      </View>
      {focused && <View style={tabIconStyles.dot} />}
    </View>
  );
}

const createTabIconStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: {
    backgroundColor: colors.accent,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.danger,
    marginTop: 4,
  },
});

function ScrollableTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const scrollableTabBarStyles = useMemo(() => createTabBarStyles(colors), [colors]);

  return (
    <View style={[scrollableTabBarStyles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={TAB_ITEM_WIDTH}
        decelerationRate="fast"
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[scrollableTabBarStyles.tabItem, { width: TAB_ITEM_WIDTH }]}
              activeOpacity={0.85}
            >
              {options.tabBarIcon
                ? options.tabBarIcon({ focused: isFocused, color: '', size: 22 })
                : <Text>{route.name}</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createTabBarStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  tabItem: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function TabNavigator({ onLogout }: { onLogout: () => void }) {
  return (
    <Tab.Navigator
      tabBar={(props) => <ScrollableTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AIBuddy"
        component={AIBuddyScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="chatbubbles" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Videos"
        component={VideosScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="play-circle" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Storybooks"
        component={StorybooksScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="book" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Courses"
        component={CoursesScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="megaphone" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="people" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />,
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
