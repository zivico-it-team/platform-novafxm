import axios from 'axios';
import { Platform } from 'react-native';
import { storage } from '../utils/storage';

const defaultUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || defaultUrl,
  timeout: 9000,
});

api.interceptors.request.use(async (config) => {
  const token = await storage.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
