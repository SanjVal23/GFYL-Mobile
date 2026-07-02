import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../contexts/UserContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';

interface ProfileScreenProps {
  onLogout: () => void;
}

export default function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const { user, updateUser, savedItems, removeSavedItem } = useUser();
  const { language, setLanguage, t } = useLocalization();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [notifications, setNotifications] = useState(user.notifications ?? true);
  const scrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

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
    <View style={styles.container}>
      <ScrollView ref={scrollViewRef} style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={44} color={colors.accentText} />
            )}
          </View>
          <Text style={styles.name}>{user.isGuest ? t('profile.guest', 'Guest User') : user.name}</Text>
          <Text style={styles.email}>{user.isGuest ? t('profile.guestAccount', 'Guest Account') : user.email}</Text>
          {user.isGuest && (
            <TouchableOpacity style={styles.upgradeButton} onPress={handleCreateAccount} activeOpacity={0.85}>
              <Text style={styles.upgradeButtonText}>{t('profile.createAccount', 'Create Account')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.account', 'Account')}</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile} activeOpacity={0.85}>
            <Ionicons name="person-outline" size={22} color={colors.text} />
            <Text style={styles.menuText}>{t('profile.editProfile', 'Edit Profile')}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <View style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>{t('profile.notifications', 'Notifications')}</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.accentText}
            />
          </View>
          <TouchableOpacity style={styles.menuItem} onPress={handleSavedItems} activeOpacity={0.85}>
            <Ionicons name="bookmark-outline" size={22} color={colors.text} />
            <Text style={styles.menuText}>{t('profile.savedItems', 'Saved Items')}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{savedItems.length}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.preferences', 'Preferences')}</Text>
          <View style={styles.menuItem}>
            <Ionicons name={isDarkMode ? 'moon-outline' : 'sunny-outline'} size={22} color={colors.text} />
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>
                {isDarkMode ? t('profile.darkMode', 'Dark Mode') : t('profile.lightMode', 'Light Mode')}
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.accentText}
            />
          </View>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowLanguage(true)} activeOpacity={0.85}>
            <Ionicons name="language-outline" size={22} color={colors.text} />
            <Text style={styles.menuText}>{t('profile.language', 'Language')}</Text>
            <Text style={styles.menuSubtext}>{selectedLanguage}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.about', 'About')}</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowAbout(true)} activeOpacity={0.85}>
            <Ionicons name="information-circle-outline" size={22} color={colors.text} />
            <Text style={styles.menuText}>{t('profile.aboutApp', 'About App')}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handlePrivacyPolicy} activeOpacity={0.85}>
            <Ionicons name="document-text-outline" size={22} color={colors.text} />
            <Text style={styles.menuText}>{t('profile.privacy', 'Privacy Policy')}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleTermsOfService} activeOpacity={0.85}>
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.text} />
            <Text style={styles.menuText}>{t('profile.terms', 'Terms of Service')}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutItem} onPress={handleLogout} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={22} color={colors.danger} />
            <Text style={styles.logoutText}>{t('profile.logout', 'Logout')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>{t('profile.version', 'Version 1.0.0')}</Text>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                <Ionicons name="close" size={26} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Enter your email"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} activeOpacity={0.85}>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.savedItems', 'Saved Items')}</Text>
              <TouchableOpacity onPress={() => setShowSavedItems(false)}>
                <Ionicons name="close" size={26} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.savedItemsList}>
              {savedItems.map(item => (
                <View key={item.id} style={styles.savedItem}>
                  <View style={styles.savedItemIcon}>
                    <Ionicons name={item.icon as any} size={22} color={colors.text} />
                  </View>
                  <View style={styles.savedItemInfo}>
                    <Text style={styles.savedItemTitle}>{item.title}</Text>
                    <Text style={styles.savedItemType}>{item.type}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveSavedItem(item.id)}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.selectLanguage', 'Select Language')}</Text>
              <TouchableOpacity onPress={() => setShowLanguage(false)}>
                <Ionicons name="close" size={26} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.languageList}>
              {languages.map(language => (
                <TouchableOpacity
                  key={language}
                  style={[
                    styles.languageItem,
                    selectedLanguage === language && styles.languageItemActive,
                  ]}
                  onPress={() => handleLanguageSelect(language)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.languageText}>{language}</Text>
                  {selectedLanguage === language && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About App</Text>
              <TouchableOpacity onPress={() => setShowAbout(false)}>
                <Ionicons name="close" size={26} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.aboutContent}>
              <View style={styles.aboutLogo}>
                <View style={styles.aboutLogoCircle}>
                  <Ionicons name="leaf" size={44} color={colors.accentText} />
                </View>
              </View>

              <Text style={styles.aboutTitle}>Gita For Youth Leadership</Text>
              <Text style={styles.aboutSubtitle}>Gita For Your Life</Text>

              <View style={styles.aboutSection}>
                <Text style={styles.aboutHeading}>Our Mission</Text>
                <Text style={styles.aboutText}>
                  To empower youth with timeless wisdom from the Bhagavad Gita,
                  fostering leadership, spiritual growth, and ethical living.
                </Text>
              </View>

              <View style={styles.aboutSection}>
                <Text style={styles.aboutHeading}>Features</Text>
                <View style={styles.featureItem}>
                  <Ionicons name="book" size={18} color={colors.text} />
                  <Text style={styles.featureText}>Complete Bhagavad Gita</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="chatbubbles" size={18} color={colors.text} />
                  <Text style={styles.featureText}>AI Spiritual Guide</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="school" size={18} color={colors.text} />
                  <Text style={styles.featureText}>Leadership Courses</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="flower" size={18} color={colors.text} />
                  <Text style={styles.featureText}>Meditation & Pranayama</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="people" size={18} color={colors.text} />
                  <Text style={styles.featureText}>Community Forums</Text>
                </View>
              </View>

              <View style={styles.aboutSection}>
                <Text style={styles.aboutHeading}>Contact</Text>
                <Text style={styles.aboutText}>
                  Email: support@gfyl.org{'\n'}
                  Website: www.gfyl.org
                </Text>
              </View>

              <Text style={styles.aboutVersion}>Version 1.0.0</Text>
              <Text style={styles.aboutCopyright}>
                © 2026 GFYL. All rights reserved.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 70,
    paddingBottom: 30,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  upgradeButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    marginTop: 16,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accentText,
  },
  section: {
    marginTop: 8,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    gap: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  menuSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 4,
  },
  badge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accentText,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.danger,
  },
  versionText: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 24,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },

  // Edit Profile
  inputContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: 15,
    fontSize: 16,
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accentText,
  },

  // Saved Items
  savedItemsList: {
    maxHeight: 500,
  },
  savedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    gap: 12,
  },
  savedItemIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedItemInfo: {
    flex: 1,
  },
  savedItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  savedItemType: {
    fontSize: 13,
    color: colors.textSecondary,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  languageItemActive: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.accent,
  },
  languageText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
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
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  aboutSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  aboutSection: {
    marginBottom: 20,
  },
  aboutHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  aboutText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  aboutVersion: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },
  aboutCopyright: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
});
