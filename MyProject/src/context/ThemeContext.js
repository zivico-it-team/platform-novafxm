import { createContext, useContext, useMemo, useState } from 'react';

const palettes = {
  light: {
    mode: 'light',
    background: '#f4f7f5',
    panel: '#ffffff',
    surface: '#edf4ef',
    border: '#d7e3da',
    text: '#092017',
    muted: '#66766f',
    primary: '#006b3c',
    primarySoft: '#dff5e9',
    success: '#008f50',
    danger: '#e23b48',
    chartBackground: '#ffffff',
    chartText: '#24352d',
    chartGrid: 'rgba(15, 23, 42, .09)',
  },
  dark: {
    mode: 'dark',
    background: '#020604',
    panel: '#07150f',
    surface: '#0d2117',
    border: '#17452d',
    text: '#ffffff',
    muted: '#a7b8af',
    primary: '#00a85a',
    primarySoft: '#0a301d',
    success: '#12cf7a',
    danger: '#f24d58',
    chartBackground: '#020604',
    chartText: '#ffffff',
    chartGrid: 'rgba(255, 255, 255, .12)',
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
