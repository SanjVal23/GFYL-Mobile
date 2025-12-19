import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AuthScreen } from './screens/AuthScreen';
import AppNavigator from './navigation/AppNavigator';
import { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  if (!user) {
    return (
      <>
        <AuthScreen onLogin={handleLogin} />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <>
      <NavigationContainer>
        <AppNavigator user={user} />
      </NavigationContainer>
      <StatusBar style="light" />
    </>
  );
}
