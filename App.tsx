import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthScreen } from './screens/AuthScreen';
import AppNavigator from './navigation/AppNavigator';
import StartupAnimation from './components/StartupAnimation';
import { User } from './types';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { UserProvider } from './contexts/UserContext';
import { supabase } from './services/supabaseClient';
import { LocalizationProvider } from './contexts/LocalizationContext';

const mapSessionUser = (sessionUser: any): User => ({
  id: sessionUser.id,
  name: sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'User',
  email: sessionUser.email || '',
  role: sessionUser.user_metadata?.role || 'student',
  accessTier: sessionUser.user_metadata?.accessTier || 'free',
  avatarUrl: sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || undefined,
});

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isGuestSession, setIsGuestSession] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const isGuestSessionRef = useRef(false);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    isGuestSessionRef.current = isGuestSession;
  }, [isGuestSession]);

  useEffect(() => {
    const loadSession = async () => {
      if (isGuestSessionRef.current) return;
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user;
      if (sessionUser) {
        setUser(mapSessionUser(sessionUser));
      }
    };

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (isGuestSessionRef.current) return;
        const sessionUser = session?.user;
        if (sessionUser) {
          setUser(mapSessionUser(sessionUser));
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setIsGuestSession(!!userData.isGuest);
  };

  const handleLogout = async () => {
    setUser(null);
    setIsGuestSession(false);

    if (!user?.isGuest) {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Supabase signOut failed', error);
      }
    }
  };

  if (!user) {
    return (
      <>
        <AuthScreen onLogin={handleLogin} />
        <StatusBar style="dark" />
        {showSplash && <StartupAnimation onFinish={() => setShowSplash(false)} />}
      </>
    );
  }

  return (
    <>
      <UserProvider initialUser={user}>
        <NavigationContainer>
          <AppNavigator onLogout={handleLogout} />
        </NavigationContainer>
      </UserProvider>
      <StatusBar style={showSplash ? 'dark' : (isDarkMode ? 'light' : 'dark')} />
      {showSplash && <StartupAnimation onFinish={() => setShowSplash(false)} />}
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LocalizationProvider>
          <AppContent />
        </LocalizationProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
