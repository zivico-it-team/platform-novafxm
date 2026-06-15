import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const LEGACY_THEME_STORAGE_KEY = 'novafxm.theme';
const THEME_STORAGE_KEY = 'novafxm.theme.v2';

const palettes = {
  light: {
    mode: 'light',
    background: '#f7f5ee',
    panel: '#ffffff',
    surface: '#f2eee0',
    border: '#d8cca2',
    text: '#0B0B0B',
    muted: '#5f665e',
    primary: '#D4AF37',
    primarySoft: '#efe2b1',
    success: '#014421',
    danger: '#e23b48',
    chartBackground: '#ffffff',
    chartText: '#0B0B0B',
    chartGrid: 'rgba(1, 68, 33, .12)',
  },
  dark: {
    mode: 'dark',
    background: '#0b0e11',
    panel: '#181a20',
    surface: '#1e2329',
    border: '#2b3139',
    text: '#ffffff',
    muted: '#848e9c',
    primary: '#D4AF37',
    primarySoft: '#3a2f12',
    success: '#12cf7a',
    danger: '#f24d58',
    chartBackground: '#0b0e11',
    chartText: '#ffffff',
    chartGrid: 'rgba(132, 142, 156, .18)',
  },
};

const ThemeContext = createContext({
  darkMode: false,
  colors: palettes.light,
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((storedTheme) => {
        AsyncStorage.removeItem(LEGACY_THEME_STORAGE_KEY).catch(() => {});
        if (!mounted || !storedTheme) return;
        setDarkMode(storedTheme !== 'light');
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', darkMode);
      document.body.style.backgroundColor = darkMode ? palettes.dark.background : palettes.light.background;
    }
  }, [darkMode]);

  const setThemeMode = useCallback((mode) => {
    const nextDarkMode = mode === 'dark';
    setDarkMode(nextDarkMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, nextDarkMode ? 'dark' : 'light').catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setDarkMode((enabled) => {
      const nextDarkMode = !enabled;
      AsyncStorage.setItem(THEME_STORAGE_KEY, nextDarkMode ? 'dark' : 'light').catch(() => {});
      return nextDarkMode;
    });
  }, []);

  const value = useMemo(
    () => ({
      darkMode,
      colors: darkMode ? palettes.dark : palettes.light,
      setThemeMode,
      toggleTheme,
    }),
    [darkMode, setThemeMode, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useAppTheme = () => useContext(ThemeContext);
