import { createContext, useContext, useMemo, useState } from 'react';

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
  darkMode: true,
  colors: palettes.dark,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(true);
  const value = useMemo(
    () => ({
      darkMode,
      colors: darkMode ? palettes.dark : palettes.light,
      toggleTheme: () => setDarkMode((enabled) => !enabled),
    }),
    [darkMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useAppTheme = () => useContext(ThemeContext);
