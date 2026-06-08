import axios from 'axios';
import { storage } from '../utils/storage';
import { apiBaseUrl } from './apiConfig';

const api = axios.create({
  baseURL: apiBaseUrl(),
  timeout: 9000,
});

api.interceptors.request.use(async (config) => {
  const token = await storage.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
