import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { apiRequest } from '../api/apiClient';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

function getNotificationId(item) {
  return String(
    item.notification_id ||
      item.id ||
      `${item.type || 'ORDER'}-${item.order_id || ''}-${item.updated_at || item.created_at || ''}`
  );
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const recalculateUnreadCount = useCallback((list) => {
    const count = list.filter((item) => !item.is_read).length;
    setUnreadCount(count);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user?.user_id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);

      const data = await apiRequest('/notifications', {
        method: 'GET',
      });

      const list = Array.isArray(data?.notifications)
        ? data.notifications
        : [];

      setNotifications(list);
      recalculateUnreadCount(list);
    } catch (error) {
      console.log('[NotificationContext] Không lấy được thông báo:', error.message);
    } finally {
      setLoading(false);
    }
  }, [user?.user_id, recalculateUnreadCount]);

  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) => {
      const nextList = prev.map((item) => {
        const currentId = getNotificationId(item);

        if (currentId === String(notificationId)) {
          return {
            ...item,
            is_read: true,
          };
        }

        return item;
      });

      recalculateUnreadCount(nextList);
      return nextList;
    });
  }, [recalculateUnreadCount]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const nextList = prev.map((item) => ({
        ...item,
        is_read: true,
      }));

      setUnreadCount(0);
      return nextList;
    });
  }, []);

  const deleteNotification = useCallback((notificationId) => {
    setNotifications((prev) => {
      const nextList = prev.filter((item) => {
        const currentId = getNotificationId(item);
        return currentId !== String(notificationId);
      });

      recalculateUnreadCount(nextList);
      return nextList;
    });
  }, [recalculateUnreadCount]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearNotifications,
      setUnreadCount,
    }),
    [
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearNotifications,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications phải được dùng bên trong NotificationProvider');
  }

  return context;
}