import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';
import { useLocalization } from '../contexts/LocalizationContext';

WebBrowser.maybeCompleteAuthSession();

type PortalRole = 'student' | 'parent';
type AccessTier = 'free' | 'paid';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const { t } = useLocalization();
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState<PortalRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const selectedAccessTier: AccessTier = selectedRole === 'parent' ? 'paid' : 'free';
  const redirectTo = useMemo(
    () => makeRedirectUri({ scheme: 'gfylmobile', path: 'auth/callback' }),
    []
  );

  const mapUser = (sessionUser: any, fallbackName?: string): User => ({
    id: sessionUser.id,
    name: sessionUser.user_metadata?.name || fallbackName || sessionUser.email?.split('@')[0] || 'User',
    email: sessionUser.email || '',
    role: sessionUser.user_metadata?.role || selectedRole,
    accessTier: sessionUser.user_metadata?.accessTier || selectedAccessTier,
  });

  const syncUserMetadata = async (sessionUser: any, preferredName?: string) => {
    const resolvedName = preferredName || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'User';

    const { data: updatedData, error: updateError } = await supabase.auth.updateUser({
      data: {
        ...sessionUser.user_metadata,
        name: resolvedName,
        role: selectedRole,
        accessTier: selectedAccessTier,
      },
    });

    if (updateError) {
      console.error('Failed to update auth metadata', updateError);
      return sessionUser;
    }

    return updatedData.user || sessionUser;
  };

  const upsertProfile = async (sessionUser: any, preferredName?: string) => {
    await supabase.from('profiles').upsert({
      id: sessionUser.id,
      name: preferredName || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'User',
      email: sessionUser.email,
      language: 'English',
      notifications: true,
    });
  };

  const handleSubmit = async () => {
    setAuthError(null);
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Missing Info', 'Please fill out all required fields.');
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        const sessionUser = data.user;
        if (!data.session || !sessionUser) {
          const message = 'Login failed. Check your email confirmation or try again.';
          setAuthError(message);
          Alert.alert('Login Failed', message);
          return;
        }

        if (sessionUser) {
          const enrichedUser = await syncUserMetadata(sessionUser);
          await upsertProfile(enrichedUser);
          onLogin(mapUser(enrichedUser));
        } else {
          Alert.alert('Login Failed', 'No user session found. Please try again.');
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, role: selectedRole, accessTier: selectedAccessTier },
          },
        });

        if (error) throw error;

        const sessionUser = data.user;
        if (sessionUser) {
          const enrichedUser = await syncUserMetadata(sessionUser, name);
          await upsertProfile(enrichedUser, name);

          if (data.session) {
            onLogin(mapUser(enrichedUser, name));
          } else {
            Alert.alert('Check your email', 'Confirm your email to finish signing up.');
            setAuthError('Email confirmation required. Please verify your email and log in.');
            setIsLogin(true);
          }
        } else {
          const message = 'Sign up failed. No user record returned.';
          setAuthError(message);
          Alert.alert('Sign Up Failed', message);
        }
      }
    } catch (err: any) {
      const message = err?.message || 'Unable to authenticate.';
      setAuthError(message);
      Alert.alert('Auth Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setAuthError(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams:
            provider === 'google'
              ? { access_type: 'offline', prompt: 'consent' }
              : undefined,
        },
      });

      if (error) throw error;
      if (!data?.url) {
        throw new Error('OAuth URL was not created. Configure the provider in Supabase first.');
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type !== 'success' || !result.url) {
        if (result.type === 'cancel' || result.type === 'dismiss') {
          return;
        }
        throw new Error('Authentication did not complete.');
      }

      const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(result.url);
      if (exchangeError) throw exchangeError;

      const sessionUser = exchangeData.user;
      if (!sessionUser) {
        throw new Error('No user session was returned from the provider.');
      }

      const enrichedUser = await syncUserMetadata(sessionUser);
      await upsertProfile(enrichedUser);
      onLogin(mapUser(enrichedUser));
    } catch (err: any) {
      const message = err?.message || 'Unable to complete social authentication.';
      setAuthError(message);
      Alert.alert('Social Login Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#172554', '#1e3a8a']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo/Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1715628283743-00a42c986339?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb3JkJTIwa3Jpc2huYSUyMHBhaW50aW5nfGVufDF8fHx8MTc2NTczOTc5OXww&ixlib=rb-4.1.0&q=80&w=1080',
                }}
                style={styles.logo}
              />
            </View>
            <Text style={styles.title}>{t('auth.title', 'Gita For Youth Leadership')}</Text>
            <Text style={styles.subtitle}>{t('auth.subtitle', 'Gita For Your Life')}</Text>
          </View>

          {/* Auth Form */}
          <View style={styles.formContainer}>
            <View style={styles.portalSection}>
              <Text style={styles.portalSectionLabel}>{t('auth.experience', 'Choose your portal experience')}</Text>
              <View style={styles.portalCardsRow}>
                <TouchableOpacity
                  style={[
                    styles.portalCard,
                    selectedRole === 'student' && styles.portalCardActive,
                  ]}
                  onPress={() => setSelectedRole('student')}
                >
                  <Text style={styles.portalCardBadge}>{t('auth.free', 'Free')}</Text>
                  <Ionicons name="school" size={24} color={selectedRole === 'student' ? '#fff' : '#fb923c'} />
                  <Text style={styles.portalCardTitle}>{t('auth.studentPortal', 'Student Portal')}</Text>
                  <Text style={styles.portalCardText}>{t('auth.studentPortalSubtitle', 'Scripture, Krishtok, meditation, and AI guidance.')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.portalCard,
                    selectedRole === 'parent' && styles.portalCardActive,
                  ]}
                  onPress={() => setSelectedRole('parent')}
                >
                  <Text style={styles.portalCardBadge}>{t('auth.paid', 'Paid')}</Text>
                  <Ionicons name="people" size={24} color={selectedRole === 'parent' ? '#fff' : '#fb923c'} />
                  <Text style={styles.portalCardTitle}>{t('auth.parentPortal', 'Parent Portal')}</Text>
                  <Text style={styles.portalCardText}>{t('auth.parentPortalSubtitle', 'Family dashboards, premium content, and parent tools.')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Toggle Buttons */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                onPress={() => setIsLogin(true)}
                style={[
                  styles.toggleButton,
                  isLogin && styles.toggleButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    isLogin && styles.toggleTextActive,
                  ]}
                >
                  {t('auth.login', 'Login')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsLogin(false)}
                style={[
                  styles.toggleButton,
                  !isLogin && styles.toggleButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    !isLogin && styles.toggleTextActive,
                  ]}
                >
                  {t('auth.signup', 'Sign Up')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Name Input (Sign Up only) */}
            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.fullName', 'Full Name')}</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="#60a5fa"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder={t('auth.fullNamePlaceholder', 'Enter your name')}
                    placeholderTextColor="#60a5fa"
                    style={styles.input}
                  />
                </View>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.email', 'Email')}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#60a5fa"
                  style={styles.inputIcon}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('auth.emailPlaceholder', 'Enter your email')}
                  placeholderTextColor="#60a5fa"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.password', 'Password')}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#60a5fa"
                  style={styles.inputIcon}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
                  placeholderTextColor="#60a5fa"
                  style={[styles.input, styles.passwordInput]}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#60a5fa"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            {isLogin && (
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>{t('auth.forgot', 'Forgot Password?')}</Text>
              </TouchableOpacity>
            )}

            {/* Submit Button */}
            <TouchableOpacity onPress={handleSubmit} activeOpacity={0.8} disabled={isLoading}>
              <LinearGradient
                colors={['#f97316', '#ea580c']}
                style={styles.submitButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.submitButtonText}>
                  {isLoading ? t('auth.pleaseWait', 'Please wait...') : isLogin ? t('auth.login', 'Login') : t('auth.signup', 'Sign Up')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {authError && <Text style={styles.errorText}>{authError}</Text>}

            {/* Social Login (Login only) */}
            {isLogin && (
              <View style={styles.socialContainer}>
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>{t('auth.orContinue', 'Or continue with')}</Text>
                  <View style={styles.divider} />
                </View>

                <View style={styles.socialButtons}>
                  <TouchableOpacity style={styles.socialButton} onPress={() => handleOAuth('google')} disabled={isLoading}>
                    <Ionicons name="logo-google" size={16} color="#fff" />
                    <Text style={styles.socialButtonText}>{t('auth.google', 'Google')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialButton} onPress={() => handleOAuth('apple')} disabled={isLoading}>
                    <Ionicons name="logo-apple" size={16} color="#fff" />
                    <Text style={styles.socialButtonText}>{t('auth.apple', 'Apple')}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.socialHelperText}>
                  {t('auth.socialHelper', 'Complete provider setup in Supabase to finish enabling Google and Apple sign-in.')}
                </Text>
              </View>
            )}

            {/* Demo Login */}
            <View style={styles.demoContainer}>
              <Text style={styles.demoText}>{t('auth.demo', 'Quick Demo Login:')}</Text>
              <TouchableOpacity
                onPress={() =>
                  onLogin({ 
                    name: 'Demo User', 
                    email: 'demo@radhagovind.com',
                    isGuest: true,
                    role: 'student',
                    accessTier: 'free',
                  })
                }
                style={styles.demoButton}
              >
                <Text style={styles.demoButtonText}>{t('auth.guest', 'Continue as Guest')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            {t('auth.terms', 'By continuing, you agree to our Terms of Service and Privacy Policy')}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#f97316',
    overflow: 'hidden',
    marginBottom: 16,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#bfdbfe',
  },
  formContainer: {
    backgroundColor: 'rgba(30, 58, 138, 0.5)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(30, 64, 175, 0.5)',
  },
  portalSection: {
    marginBottom: 20,
  },
  portalSectionLabel: {
    fontSize: 14,
    color: '#bfdbfe',
    marginBottom: 10,
    fontWeight: '600',
  },
  portalCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  portalCard: {
    flex: 1,
    backgroundColor: 'rgba(23, 37, 84, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(30, 64, 175, 0.5)',
    borderRadius: 14,
    padding: 14,
    minHeight: 150,
  },
  portalCardActive: {
    backgroundColor: '#ea580c',
    borderColor: '#fdba74',
  },
  portalCardBadge: {
    color: '#fde68a',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  portalCardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  portalCardText: {
    color: '#dbeafe',
    fontSize: 12,
    lineHeight: 18,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#f97316',
  },
  toggleText: {
    color: '#bfdbfe',
  },
  toggleTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#bfdbfe',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(23, 37, 84, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(30, 64, 175, 0.5)',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#93c5fd',
  },
  submitButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  socialContainer: {
    marginTop: 24,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#1d4ed8',
  },
  dividerText: {
    fontSize: 14,
    color: '#93c5fd',
    marginHorizontal: 8,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(23, 37, 84, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(30, 64, 175, 0.5)',
    paddingVertical: 12,
    borderRadius: 8,
  },
  socialButtonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  socialHelperText: {
    color: '#93c5fd',
    fontSize: 12,
    marginTop: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  demoContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1d4ed8',
  },
  demoText: {
    fontSize: 12,
    color: '#93c5fd',
    textAlign: 'center',
    marginBottom: 8,
  },
  demoButton: {
    backgroundColor: 'rgba(30, 64, 175, 0.5)',
    borderWidth: 1,
    borderColor: '#1d4ed8',
    paddingVertical: 8,
    borderRadius: 8,
  },
  demoButtonText: {
    color: '#bfdbfe',
    fontSize: 14,
    textAlign: 'center',
  },
  terms: {
    fontSize: 12,
    color: '#93c5fd',
    textAlign: 'center',
    marginTop: 24,
  },
});
