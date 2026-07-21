import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  accent: string;
  accentText: string;
  danger: string;
  success: string;
  cardGradient: [string, string];
  cardSubtitle: string;
}

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const lightColors: ThemeColors = {
  background: '#ffffff',
  surface: '#ffffff',
  surfaceAlt: '#f2f2f2',
  text: '#111111',
  textSecondary: '#8a8a8a',
  textTertiary: '#b0b0b0',
  border: '#e5e5e5',
  accent: '#000000',
  accentText: '#ffffff',
  danger: '#ef4444',
  success: '#16a34a',
  cardGradient: ['#1c1c1c', '#000000'],
  cardSubtitle: '#d4d4d4',
};

const darkColors: ThemeColors = {
  background: '#000000',
  surface: '#121212',
  surfaceAlt: '#1e1e1e',
  text: '#ffffff',
  textSecondary: '#9a9a9a',
  textTertiary: '#6b6b6b',
  border: '#2a2a2a',
  accent: '#ffffff',
  accentText: '#000000',
  danger: '#f87171',
  success: '#4ade80',
  cardGradient: ['#f2f2f2', '#e0e0e0'],
  cardSubtitle: '#4b4b4b',
};

const THEME_STORAGE_KEY = 'gfyl_theme_preference';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (stored === 'dark') setIsDarkMode(true);
        if (stored === 'light') setIsDarkMode(false);
      })
      .catch(() => {});
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      AsyncStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light').catch(() => {});
      return next;
    });
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
