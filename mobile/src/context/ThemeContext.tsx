import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: ThemeColors;
}

interface ThemeColors {
  background: string;
  surface: string;
  surfaceHighlight: string;
  text: string;
  textSecondary: string;
  accent: string;
  border: string;
  danger: string;
  success: string;
}

const darkColors: ThemeColors = {
  background: '#0f172a', // Slate 900
  surface: 'rgba(30, 41, 59, 0.7)', // Slate 800 with opacity
  surfaceHighlight: 'rgba(51, 65, 85, 0.8)', // Slate 700
  text: '#f8fafc', // Slate 50
  textSecondary: '#94a3b8', // Slate 400
  accent: '#3b82f6', // Blue 500
  border: 'rgba(148, 163, 184, 0.2)',
  danger: '#ef4444',
  success: '#22c55e',
};

const lightColors: ThemeColors = {
  background: '#f8fafc', // Slate 50
  surface: 'rgba(255, 255, 255, 0.7)',
  surfaceHighlight: 'rgba(241, 245, 249, 0.8)', // Slate 100
  text: '#0f172a', // Slate 900
  textSecondary: '#64748b', // Slate 500
  accent: '#3b82f6',
  border: 'rgba(148, 163, 184, 0.2)',
  danger: '#ef4444',
  success: '#22c55e',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(systemScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const stored = await AsyncStorage.getItem('app_theme');
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    await AsyncStorage.setItem('app_theme', newTheme);
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
