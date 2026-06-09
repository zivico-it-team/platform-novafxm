import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = '5000';

const normalizeApiUrl = (value) => {
  if (!value) return null;
  const trimmed = String(value).trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const expoHost = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost;

  return hostUri?.split(':')?.[0] || null;
};

export const apiBaseUrl = () => {
  const configured = normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL);
  if (configured) return configured;

  if (Platform.OS === 'web') {
    const browserHost = typeof window !== 'undefined' ? window.location?.hostname : null;
    const host = browserHost && browserHost !== 'localhost' && browserHost !== '127.0.0.1'
      ? browserHost
      : 'localhost';
    return `http://${host}:${API_PORT}/api`;
  }

  const host = expoHost();
  if (host) return `http://${host}:${API_PORT}/api`;
  if (Platform.OS === 'android') return `http://10.0.2.2:${API_PORT}/api`;

  return `http://${host || 'localhost'}:${API_PORT}/api`;
};

export const socketBaseUrl = () => apiBaseUrl().replace(/\/api\/?$/, '');
