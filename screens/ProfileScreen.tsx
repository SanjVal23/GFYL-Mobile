import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Modal,
  TextInput,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLocalization } from '../contexts/LocalizationContext';

interface ProfileScreenProps {
  onLogout: () => void;
}

export default function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const { user, updateUser, savedItems, removeSavedItem } = useUser();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const { language, setLanguage, t } = useLocalization();
  const [notifications, setNotifications] = useState(user.notifications ?? true);
  
  // Modals
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSavedItems, setShowSavedItems] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  
  // Edit profile fields
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  
  // Language selection
  const [selectedLanguage, setSelectedLanguage] = useState(user.language ?? language ?? 'English');
  const languages = ['English', 'Hindi', 'Sanskrit', 'Telugu', 'Tamil', 'Bengali'];

  useEffect(() => {
    setNotifications(user.notifications ?? true);
    setSelectedLanguage(user.language ?? language ?? 'English');
  }, [user.notifications, user.language, language]);

  const handleEditProfile = () => {
    setEditName(user.name);
    setEditEmail(user.email);
    setShowEditProfile(true);
  };

  const handleSaveProfile = () => {
    updateUser({ name: editName, email: editEmail });
    Alert.alert('Success', 'Profile updated successfully!');
    setShowEditProfile(false);
  };

  const handleNotificationToggle = (value: boolean) => {
    setNotifications(value);
    updateUser({ notifications: value });
    Alert.alert(
      'Notifications',
      value ? 'Notifications enabled' : 'Notifications disabled'
    );
  };

  const handleDarkModeToggle = () => {
    toggleTheme();
    Alert.alert(
      isDarkMode ? 'Light Mode' : 'Dark Mode',
      isDarkMode ? 'Switched to light mode' : 'Switched to dark mode'
    );
  };

  const handleSavedItems = () => {
    setShowSavedItems(true);
  };

  const handleCreateAccount = () => {
    if (Platform.OS === 'web') {
      onLogout();
      return;
    }

    Alert.alert(
      'Create Account',
      'You are currently in guest mode. Continue to sign up?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            onLogout();
          },
        },
      ]
    );
  };

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setLanguage(language);
    updateUser({ language });
    Alert.alert('Language Changed', `Language set to ${language}`);
    setShowLanguage(false);
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'Would you like to view our privacy policy?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View',
          onPress: () => {
            Linking.openURL('https://example.com/privacy').catch(() => {
              Alert.alert('Info', 'Privacy policy will be available soon!');
            });
          },
        },
      ]
    );
  };

  const handleTermsOfService = () => {
    Alert.alert(
      'Terms of Service',
      'Would you like to view our terms of service?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View',
          onPress: () => {
            Linking.openURL('https://example.com/terms').catch(() => {
              Alert.alert('Info', 'Terms of service will be available soon!');
            });
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      onLogout();
      return;
    }

    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            console.log('Logout pressed');
            if (onLogout) {
              onLogout();
            } else {
              console.error('onLogout is undefined');
            }
          },
        },
      ]
    );
  };

  const handleRemoveSavedItem = (id: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeSavedItem(id);
            Alert.alert('Success', 'Item removed from saved items');
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={colors.background} style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Ionicons name="person" size={50} color="#fff" />
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{user.isGuest ? t('profile.guest', 'Guest User') : user.name}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user.isGuest ? t('profile.guestAccount', 'Guest Account') : user.email}</Text>
          {user.isGuest && (
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: colors.accent }]}
              onPress={handleCreateAccount}
            >
              <Text style={styles.upgradeButtonText}>{t('profile.createAccount', 'Create Account')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('profile.account', 'Account')}</Text>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.cardBackground }]} onPress={handleEditProfile}>
            <Ionicons name="person-outline" size={24} color={colors.text} />
            <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.editProfile', 'Edit Profile')}</Text>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={[styles.menuItem, { backgroundColor: colors.cardBackground }]}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.notifications', 'Notifications')}</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: '#334155', true: colors.accent }}
              thumbColor="#fff"
            />
          </View>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.cardBackground }]} onPress={handleSavedItems}>
            <Ionicons name="bookmark-outline" size={24} color={colors.text} />
            <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.savedItems', 'Saved Items')}</Text>
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={styles.badgeText}>{savedItems.length}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('profile.preferences', 'Preferences')}</Text>
          <View style={[styles.menuItem, { backgroundColor: colors.cardBackground }]}>
            <Ionicons name="moon-outline" size={24} color={colors.text} />
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.darkMode', 'Dark Mode')}</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: '#334155', true: colors.accent }}
              thumbColor="#fff"
            />
          </View>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.cardBackground }]} onPress={() => setShowLanguage(true)}>
            <Ionicons name="language-outline" size={24} color={colors.text} />
            <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.language', 'Language')}</Text>
            <Text style={[styles.menuSubtext, { color: colors.textSecondary }]}>{selectedLanguage}</Text>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('profile.about', 'About')}</Text>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.cardBackground }]} onPress={() => setShowAbout(true)}>
            <Ionicons name="information-circle-outline" size={24} color={colors.text} />
            <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.aboutApp', 'About App')}</Text>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.cardBackground }]} onPress={handlePrivacyPolicy}>
            <Ionicons name="document-text-outline" size={24} color={colors.text} />
            <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.privacy', 'Privacy Policy')}</Text>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.cardBackground }]} onPress={handleTermsOfService}>
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.text} />
            <Text style={[styles.menuText, { color: colors.text }]}>{t('profile.terms', 'Terms of Service')}</Text>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={[styles.menuItem, styles.logoutItem, { borderColor: '#ef4444' }]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            <Text style={[styles.menuText, styles.logoutText]}>{t('profile.logout', 'Logout')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.versionText, { color: colors.textSecondary }]}>{t('profile.version', 'Version 1.0.0')}</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditProfile(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Enter your email"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.accent }]} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Saved Items Modal */}
      <Modal
        visible={showSavedItems}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSavedItems(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('profile.savedItems', 'Saved Items')}</Text>
              <TouchableOpacity onPress={() => setShowSavedItems(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.savedItemsList}>
              {savedItems.map(item => (
                <View key={item.id} style={[styles.savedItem, { backgroundColor: colors.cardBackground }]}>
                  <View style={[styles.savedItemIcon, { backgroundColor: colors.primary }]}>
                    <Ionicons name={item.icon as any} size={24} color={colors.accent} />
                  </View>
                  <View style={styles.savedItemInfo}>
                    <Text style={[styles.savedItemTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.savedItemType, { color: colors.textSecondary }]}>{item.type}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveSavedItem(item.id)}>
                    <Ionicons name="trash-outline" size={22} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguage}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLanguage(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('profile.selectLanguage', 'Select Language')}</Text>
              <TouchableOpacity onPress={() => setShowLanguage(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.languageList}>
              {languages.map(language => (
                <TouchableOpacity
                  key={language}
                  style={[
                    styles.languageItem,
                    { backgroundColor: colors.cardBackground },
                    selectedLanguage === language && [styles.languageItemActive, { borderColor: colors.accent }],
                  ]}
                  onPress={() => handleLanguageSelect(language)}
                >
                  <Text style={[styles.languageText, { color: colors.text }]}>{language}</Text>
                  {selectedLanguage === language && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* About App Modal */}
      <Modal
        visible={showAbout}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAbout(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>About App</Text>
              <TouchableOpacity onPress={() => setShowAbout(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.aboutContent}>
              <View style={styles.aboutLogo}>
                <View style={[styles.aboutLogoCircle, { backgroundColor: colors.cardBackground, borderColor: colors.accent }]}>
                  <Ionicons name="leaf" size={50} color={colors.accent} />
                </View>
              </View>
              
              <Text style={[styles.aboutTitle, { color: colors.text }]}>Gita For Youth Leadership</Text>
              <Text style={[styles.aboutSubtitle, { color: colors.textSecondary }]}>Gita For Your Life</Text>
              
              <View style={styles.aboutSection}>
                <Text style={[styles.aboutHeading, { color: colors.accent }]}>Our Mission</Text>
                <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
                  To empower youth with timeless wisdom from the Bhagavad Gita, 
                  fostering leadership, spiritual growth, and ethical living.
                </Text>
              </View>

              <View style={styles.aboutSection}>
                <Text style={[styles.aboutHeading, { color: colors.accent }]}>Features</Text>
                <View style={styles.featureItem}>
                  <Ionicons name="book" size={20} color={colors.accent} />
                  <Text style={[styles.featureText, { color: colors.text }]}>Complete Bhagavad Gita</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="chatbubbles" size={20} color={colors.accent} />
                  <Text style={[styles.featureText, { color: colors.text }]}>AI Spiritual Guide</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="school" size={20} color={colors.accent} />
                  <Text style={[styles.featureText, { color: colors.text }]}>Leadership Courses</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="flower" size={20} color={colors.accent} />
                  <Text style={[styles.featureText, { color: colors.text }]}>Meditation & Pranayama</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="people" size={20} color={colors.accent} />
                  <Text style={[styles.featureText, { color: colors.text }]}>Community Forums</Text>
                </View>
              </View>

              <View style={styles.aboutSection}>
                <Text style={[styles.aboutHeading, { color: colors.accent }]}>Contact</Text>
                <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
                  Email: support@gfyl.org{'\n'}
                  Website: www.gfyl.org
                </Text>
              </View>

              <Text style={[styles.aboutVersion, { color: colors.textSecondary }]}>Version 1.0.0</Text>
              <Text style={[styles.aboutCopyright, { color: colors.textSecondary }]}>
                © 2026 GFYL. All rights reserved.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e3a8a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  
  // Edit Profile
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e40af',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  saveButton: {
    backgroundColor: '#fb923c',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Saved Items
  savedItemsList: {
    maxHeight: 500,
  },
  savedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e40af',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  savedItemIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#172554',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedItemInfo: {
    flex: 1,
  },
  savedItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  savedItemType: {
    fontSize: 13,
    color: '#94a3b8',
    textTransform: 'capitalize',
  },
  
  // Language
  languageList: {
    maxHeight: 400,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e40af',
    padding: 18,
    borderRadius: 12,
    marginBottom: 10,
  },
  languageItemActive: {
    backgroundColor: '#2563eb',
    borderWidth: 2,
    borderColor: '#fb923c',
  },
  languageText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  
  // About
  aboutContent: {
    maxHeight: 500,
  },
  aboutLogo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  aboutLogoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1e40af',
    borderWidth: 3,
    borderColor: '#fb923c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  aboutSubtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 20,
  },
  aboutSection: {
    marginBottom: 20,
  },
  aboutHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fb923c',
    marginBottom: 10,
  },
  aboutText: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 22,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 15,
    color: '#e2e8f0',
  },
  aboutVersion: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 10,
  },
  aboutCopyright: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
});
