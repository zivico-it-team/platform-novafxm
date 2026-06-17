import api from './api';

export const notificationService = {
  async list() {
    const { data } = await api.get('/notifications');
    return data.notifications || [];
  },

  async unreadCount() {
    const { data } = await api.get('/notifications/unread-count');
    return Number(data.count || 0);
  },

  async markRead(id) {
    const { data } = await api.put(`/notifications/${id}/read`);
    return data.notification;
  },

  async markAllRead() {
    const { data } = await api.put('/notifications/read-all');
    return data;
  },
};
