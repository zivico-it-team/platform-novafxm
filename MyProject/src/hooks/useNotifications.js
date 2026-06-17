import { useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';
import { socketBaseUrl } from '../services/apiConfig';
import { notificationService } from '../services/notificationService';
import { storage } from '../utils/storage';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const [items, count] = await Promise.all([
        notificationService.list(),
        notificationService.unreadCount(),
      ]);
      setNotifications(items);
      setUnreadCount(count);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  useEffect(() => {
    let socket;
    let active = true;

    async function connect() {
      if (!user?.id) return;
      const token = await storage.get('token');
      if (!active) return;
      socket = io(socketBaseUrl(), {
        auth: { token },
      });
      socket.on('connect', () => socket.emit('notifications:join', user.id)); socket.on('new_notification', (notification) => { setNotifications((prev) => [notification, ...prev.filter((item) => item.id !== notification.id)]); setUnreadCount((count) => count + (notification.isRead ? 0 : 1)); DeviceEventEmitter.emit('novafxm:new-notification', notification); });
    }

    connect();
    return () => {
      active = false;
      socket?.disconnect();
    };
  }, [user?.id]);

  const markRead = useCallback(async (id) => {
    const target = notifications.find((item) => String(item.id) === String(id));
    setNotifications((prev) => prev.map((item) => (
      String(item.id) === String(id) ? { ...item, isRead: true } : item
    )));
    if (target && !target.isRead) setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await notificationService.markRead(id);
    } catch {
      refresh().catch(() => {});
    }
  }, [notifications, refresh]);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationService.markAllRead();
    } catch {
      refresh().catch(() => {});
    }
  }, [refresh]);

  return { notifications, unreadCount, loading, refresh, markRead, markAllRead };
}
