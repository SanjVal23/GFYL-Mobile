import React, { createContext, useState, useContext, ReactNode } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: {
    primary: string;
    secondary: string;
    background: [string, string];
    cardBackground: string;
    text: string;
    textSecondary: string;
    accent: string;
    border: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const colors = isDarkMode
    ? {
        primary: '#1e3a8a',
        secondary: '#1e40af',
        background: ['#172554', '#1e3a8a'] as [string, string],
        cardBackground: '#1e40af',
        text: '#fff',
        textSecondary: '#cbd5e1',
        accent: '#fb923c',
        border: '#1e40af',
      }
    : {
        primary: '#f0f9ff',
        secondary: '#e0f2fe',
        background: ['#ffffff', '#f0f9ff'] as [string, string],
        cardBackground: '#e0f2fe',
        text: '#0c4a6e',
        textSecondary: '#64748b',
        accent: '#fb923c',
        border: '#bae6fd',
      };

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
