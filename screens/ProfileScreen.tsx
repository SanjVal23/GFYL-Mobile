import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../types';

interface ProfileScreenProps {
  user: User;
}

export default function ProfileScreen({ user }: ProfileScreenProps) {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing screen would open here');
  };

  const handleNotifications = () => {
    Alert.alert('Notifications', 'Notification settings screen would open here');
  };

  const handleSavedItems = () => {
    Alert.alert('Saved Items', 'Showing your bookmarked verses and courses');
  };

  const handleLanguage = () => {
    Alert.alert('Language', 'Language selection: English, Hindi, Sanskrit');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  return (
    <LinearGradient colors={['#172554', '#1e3a8a']} style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={50} color="#fff" />
          </View>
          <Text style={styles.name}>{user.isGuest ? 'Demo User' : user.name}</Text>
          <Text style={styles.email}>{user.isGuest ? 'Guest Account' : user.email}</Text>
          {user.isGuest && (
            <TouchableOpacity style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Create Account</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
            <Ionicons name="person-outline" size={24} color="#fff" />
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleNotifications}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#334155', true: '#fb923c' }}
              thumbColor="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleSavedItems}>
            <Ionicons name="bookmark-outline" size={24} color="#fff" />
            <Text style={styles.menuText}>Saved Items</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>12</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.menuItem}>
            <Ionicons name="moon-outline" size={24} color="#fff" />
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#334155', true: '#fb923c' }}
              thumbColor="#fff"
            />
          </View>
          <TouchableOpacity style={styles.menuItem} onPress={handleLanguage}>
            <Ionicons name="language-outline" size={24} color="#fff" />
            <Text style={styles.menuText}>Language</Text>
            <Text style={styles.menuSubtext}>English</Text>
            <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="information-circle-outline" size={24} color="#fff" />
            <Text style={styles.menuText}>About App</Text>
            <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="document-text-outline" size={24} color="#fff" />
            <Text style={styles.menuText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#fff" />
            <Text style={styles.menuText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Version 1.0.0</Text>
        <View style={{ height: 40 }} />
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
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fb923c',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  email: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 4,
  },
  upgradeButton: {
    backgroundColor: '#fb923c',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 15,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e40af',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    gap: 15,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  menuSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#fb923c',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  logoutItem: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutText: {
    color: '#ef4444',
  },
  versionText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 20,
  },
});
