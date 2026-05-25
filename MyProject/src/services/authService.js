import api from './api';

export const authService = {
  register: (values) => api.post('/auth/register', values).then((response) => response.data),
  login: (values) => api.post('/auth/login', values).then((response) => response.data),
  me: () => api.get('/auth/me').then((response) => response.data),
  updateProfile: (values) => api.put('/users/profile', values).then((response) => response.data),
};
