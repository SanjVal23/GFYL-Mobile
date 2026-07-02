import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';
import { useLocalization } from '../contexts/LocalizationContext';

WebBrowser.maybeCompleteAuthSession();

type AuthStep = 'email' | 'credentials' | 'code' | 'role';
type AuthMode = 'login' | 'signup';
type PortalRole = 'student' | 'parent';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const DEFAULT_ROLE = 'student';
const DEFAULT_ACCESS_TIER = 'free';
const MEMBERSHIP_CODE = 'gfyl';

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const { t } = useLocalization();
  const [step, setStep] = useState<AuthStep>('email');
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<any | null>(null);
  const [isGuestFlow, setIsGuestFlow] = useState(false);
  const [membershipCode, setMembershipCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [accessTierChoice, setAccessTierChoice] = useState<'free' | 'paid'>(DEFAULT_ACCESS_TIER);
  const [selectedRole, setSelectedRole] = useState<PortalRole>(DEFAULT_ROLE);
  const redirectTo = useMemo(
    () => makeRedirectUri({ scheme: 'gfylmobile', path: 'auth/callback' }),
    []
  );

  const mapUser = (sessionUser: any, fallbackName?: string): User => ({
    id: sessionUser.id,
    name: sessionUser.user_metadata?.name || fallbackName || sessionUser.email?.split('@')[0] || 'User',
    email: sessionUser.email || '',
    role: sessionUser.user_metadata?.role || DEFAULT_ROLE,
    accessTier: sessionUser.user_metadata?.accessTier || DEFAULT_ACCESS_TIER,
  });

  const syncUserMetadata = async (sessionUser: any, preferredName?: string) => {
    const resolvedName = preferredName || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'User';

    const { data: updatedData, error: updateError } = await supabase.auth.updateUser({
      data: {
        ...sessionUser.user_metadata,
        name: resolvedName,
        role: sessionUser.user_metadata?.role || DEFAULT_ROLE,
        accessTier: sessionUser.user_metadata?.accessTier || DEFAULT_ACCESS_TIER,
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

  const handleContinueEmail = () => {
    const trimmed = email.trim();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setAuthError(null);
    setStep('credentials');
  };

  const handleBackToEmail = () => {
    setAuthError(null);
    setPassword('');
    setStep('email');
  };

  const handleSubmit = async () => {
    setAuthError(null);
    if (!email || !password || (mode === 'signup' && !name)) {
      Alert.alert('Missing Info', 'Please fill out all required fields.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
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

        const enrichedUser = await syncUserMetadata(sessionUser);
        await upsertProfile(enrichedUser);
        onLogin(mapUser(enrichedUser));
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, role: DEFAULT_ROLE, accessTier: DEFAULT_ACCESS_TIER },
          },
        });

        if (error) throw error;

        const sessionUser = data.user;
        if (sessionUser) {
          if (data.session) {
            setPendingUser(sessionUser);
            setStep('code');
          } else {
            await upsertProfile(sessionUser, name);
            Alert.alert('Check your email', 'Confirm your email to finish signing up.');
            setAuthError('Email confirmation required. Please verify your email and log in.');
            setMode('login');
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

  const handleCodeContinue = () => {
    const trimmed = membershipCode.trim().toLowerCase();
    if (trimmed.length === 0) {
      setCodeError('Enter a code or tap Skip for now.');
      return;
    }
    if (trimmed !== MEMBERSHIP_CODE) {
      setCodeError('That code is not valid. Check it and try again, or skip for now.');
      return;
    }
    setCodeError(null);
    setAccessTierChoice('paid');
    setStep('role');
  };

  const handleCodeSkip = () => {
    setCodeError(null);
    setAccessTierChoice('free');
    setStep('role');
  };

  const handleFinishRole = async () => {
    if (isGuestFlow) {
      onLogin({
        name: 'Demo User',
        email: 'demo@radhagovind.com',
        isGuest: true,
        role: selectedRole,
        accessTier: accessTierChoice,
      });
      return;
    }

    if (!pendingUser) return;

    setAuthError(null);
    setIsLoading(true);
    try {
      const { data: updatedData, error: updateError } = await supabase.auth.updateUser({
        data: {
          ...pendingUser.user_metadata,
          name,
          role: selectedRole,
          accessTier: accessTierChoice,
        },
      });

      if (updateError) throw updateError;

      const finalUser = updatedData.user || pendingUser;
      await upsertProfile(finalUser, name);
      onLogin(mapUser(finalUser, name));
    } catch (err: any) {
      const message = err?.message || 'Unable to finish setting up your account.';
      setAuthError(message);
      Alert.alert('Setup Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setIsGuestFlow(true);
    setAccessTierChoice(DEFAULT_ACCESS_TIER);
    setSelectedRole(DEFAULT_ROLE);
    setStep('code');
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'credentials' && (
            <TouchableOpacity style={styles.backButton} onPress={handleBackToEmail}>
              <Ionicons name="chevron-back" size={26} color="#000" />
            </TouchableOpacity>
          )}

          <View style={styles.logoBlob} />

          {step === 'email' ? (
            <>
              <Text style={styles.title}>{t('auth.title', 'Log in or sign up')}</Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('auth.emailPlaceholder', 'Email')}
                  placeholderTextColor="#8a8a8a"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleContinueEmail}
                />
                {email.length > 0 && (
                  <TouchableOpacity onPress={() => setEmail('')} style={styles.clearButton}>
                    <Ionicons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={handleContinueEmail} activeOpacity={0.8}>
                <Text style={styles.primaryButtonText}>{t('auth.continue', 'Continue')}</Text>
              </TouchableOpacity>

              <Text style={styles.orText}>{t('auth.or', 'or')}</Text>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleOAuth('google')}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Ionicons name="logo-google" size={20} color="#000" />
                <Text style={styles.socialButtonText}>{t('auth.google', 'Continue with Google')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleOAuth('apple')}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Ionicons name="logo-apple" size={20} color="#000" />
                <Text style={styles.socialButtonText}>{t('auth.apple', 'Continue with Apple')}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleGuestLogin} style={styles.guestLink}>
                <Text style={styles.guestLinkText}>{t('auth.guest', 'Continue as Guest')}</Text>
              </TouchableOpacity>

              <Text style={styles.terms}>
                {t('auth.terms', 'By continuing, you agree to our Terms of Service and Privacy Policy')}
              </Text>
            </>
          ) : step === 'credentials' ? (
            <>
              <Text style={styles.title}>
                {mode === 'login' ? t('auth.loginTitle', 'Enter your password') : t('auth.signupTitle', 'Create your account')}
              </Text>

              <View style={styles.emailRow}>
                <Text style={styles.emailRowText} numberOfLines={1}>
                  {email}
                </Text>
                <TouchableOpacity onPress={handleBackToEmail}>
                  <Text style={styles.editLink}>{t('auth.edit', 'Edit')}</Text>
                </TouchableOpacity>
              </View>

              {mode === 'signup' && (
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder={t('auth.fullNamePlaceholder', 'Full name')}
                    placeholderTextColor="#8a8a8a"
                    style={styles.input}
                  />
                </View>
              )}

              <View style={styles.inputWrapper}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('auth.passwordPlaceholder', 'Password')}
                  placeholderTextColor="#8a8a8a"
                  style={styles.input}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6b6b6b" />
                </TouchableOpacity>
              </View>

              {mode === 'login' && (
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>{t('auth.forgot', 'Forgot Password?')}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSubmit}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <Text style={styles.primaryButtonText}>
                  {isLoading
                    ? t('auth.pleaseWait', 'Please wait...')
                    : mode === 'login'
                    ? t('auth.login', 'Log In')
                    : t('auth.signup', 'Create Account')}
                </Text>
              </TouchableOpacity>

              {authError && <Text style={styles.errorText}>{authError}</Text>}

              <TouchableOpacity
                onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
                style={styles.modeSwitch}
              >
                <Text style={styles.modeSwitchText}>
                  {mode === 'login'
                    ? t('auth.switchToSignup', "New here? Create an account")
                    : t('auth.switchToLogin', 'Already have an account? Log in')}
                </Text>
              </TouchableOpacity>
            </>
          ) : null}

          {step === 'code' && (
            <>
              <Text style={styles.title}>{t('auth.codeTitle', 'Have a membership code?')}</Text>
              <Text style={styles.stepSubtitle}>
                {t('auth.codeSubtitle', 'Enter your code to unlock paid access, or skip for now.')}
              </Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  value={membershipCode}
                  onChangeText={(value) => {
                    setMembershipCode(value);
                    if (codeError) setCodeError(null);
                  }}
                  placeholder={t('auth.codePlaceholder', 'Enter code')}
                  placeholderTextColor="#8a8a8a"
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {codeError && <Text style={styles.errorText}>{codeError}</Text>}

              <TouchableOpacity style={styles.primaryButton} onPress={handleCodeContinue} activeOpacity={0.8}>
                <Text style={styles.primaryButtonText}>{t('auth.continue', 'Continue')}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleCodeSkip} style={styles.modeSwitch}>
                <Text style={styles.modeSwitchText}>{t('auth.skipCode', 'Skip for now')}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'role' && (
            <>
              <Text style={styles.title}>{t('auth.roleTitle', 'Choose your portal')}</Text>
              <Text style={styles.stepSubtitle}>
                {t('auth.roleSubtitle', "You can explore either experience — pick what fits you best.")}
              </Text>

              <View style={styles.roleCardsRow}>
                <TouchableOpacity
                  style={[styles.roleCard, selectedRole === 'student' && styles.roleCardActive]}
                  onPress={() => setSelectedRole('student')}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.roleCardBadge, selectedRole === 'student' && styles.roleCardBadgeActive]}>
                    {t('auth.free', 'Free')}
                  </Text>
                  <Ionicons name="school" size={26} color={selectedRole === 'student' ? '#fff' : '#000'} />
                  <Text style={[styles.roleCardTitle, selectedRole === 'student' && styles.roleCardTitleActive]}>
                    {t('auth.studentPortal', 'Student Portal')}
                  </Text>
                  <Text style={[styles.roleCardText, selectedRole === 'student' && styles.roleCardTextActive]}>
                    {t('auth.studentPortalSubtitle', 'Scripture, KrishTok, meditation, and AI guidance.')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleCard,
                    selectedRole === 'parent' && styles.roleCardActive,
                    accessTierChoice !== 'paid' && styles.roleCardLocked,
                  ]}
                  onPress={() => setSelectedRole('parent')}
                  activeOpacity={0.85}
                  disabled={accessTierChoice !== 'paid'}
                >
                  <Text style={[styles.roleCardBadge, selectedRole === 'parent' && styles.roleCardBadgeActive]}>
                    {t('auth.paid', 'Paid')}
                  </Text>
                  <Ionicons
                    name={accessTierChoice !== 'paid' ? 'lock-closed' : 'people'}
                    size={26}
                    color={selectedRole === 'parent' ? '#fff' : accessTierChoice !== 'paid' ? '#aaaaaa' : '#000'}
                  />
                  <Text
                    style={[
                      styles.roleCardTitle,
                      selectedRole === 'parent' && styles.roleCardTitleActive,
                      accessTierChoice !== 'paid' && styles.roleCardTitleLocked,
                    ]}
                  >
                    {t('auth.parentPortal', 'Parent Portal')}
                  </Text>
                  <Text
                    style={[
                      styles.roleCardText,
                      selectedRole === 'parent' && styles.roleCardTextActive,
                      accessTierChoice !== 'paid' && styles.roleCardTextLocked,
                    ]}
                  >
                    {accessTierChoice !== 'paid'
                      ? t('auth.parentPortalLocked', 'Enter a membership code to unlock')
                      : t('auth.parentPortalSubtitle', 'Family dashboards, premium content, and parent tools.')}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleFinishRole}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <Text style={styles.primaryButtonText}>
                  {isLoading ? t('auth.pleaseWait', 'Please wait...') : t('auth.finish', 'Continue to GFYL')}
                </Text>
              </TouchableOpacity>

              {authError && <Text style={styles.errorText}>{authError}</Text>}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 80,
    alignItems: 'stretch',
  },
  backButton: {
    position: 'absolute',
    top: 24,
    left: 16,
    padding: 8,
  },
  logoBlob: {
    width: 88,
    height: 88,
    backgroundColor: '#000000',
    borderTopLeftRadius: 44,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 44,
    alignSelf: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 28,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 14,
    paddingHorizontal: 18,
    height: 68,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 19,
    color: '#000000',
    height: '100%',
  },
  clearButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#b0b0b0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeButton: {
    padding: 4,
  },
  primaryButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  orText: {
    textAlign: 'center',
    color: '#8a8a8a',
    fontSize: 15,
    marginVertical: 20,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    height: 56,
    marginBottom: 14,
  },
  socialButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  guestLink: {
    alignSelf: 'center',
    marginTop: 8,
    padding: 8,
  },
  guestLinkText: {
    color: '#6b6b6b',
    fontSize: 14,
    fontWeight: '600',
  },
  terms: {
    fontSize: 12,
    color: '#9a9a9a',
    textAlign: 'center',
    marginTop: 28,
    lineHeight: 18,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 10,
  },
  emailRowText: {
    fontSize: 15,
    color: '#4b4b4b',
    fontWeight: '600',
    flexShrink: 1,
  },
  editLink: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#6b6b6b',
    fontWeight: '600',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 14,
  },
  modeSwitch: {
    alignSelf: 'center',
    marginTop: 24,
    padding: 8,
  },
  modeSwitchText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6b6b6b',
    textAlign: 'center',
    marginTop: -18,
    marginBottom: 24,
    lineHeight: 20,
  },
  roleCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  roleCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    padding: 16,
    minHeight: 170,
  },
  roleCardActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  roleCardLocked: {
    backgroundColor: '#f7f7f7',
    borderColor: '#e0e0e0',
  },
  roleCardTitleLocked: {
    color: '#aaaaaa',
  },
  roleCardTextLocked: {
    color: '#aaaaaa',
  },
  roleCardBadge: {
    color: '#8a8a8a',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  roleCardBadgeActive: {
    color: '#cccccc',
  },
  roleCardTitle: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  roleCardTitleActive: {
    color: '#ffffff',
  },
  roleCardText: {
    color: '#6b6b6b',
    fontSize: 12,
    lineHeight: 18,
  },
  roleCardTextActive: {
    color: '#dddddd',
  },
});
