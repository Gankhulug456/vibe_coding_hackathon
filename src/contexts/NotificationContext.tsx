
"use client";

import type { Notification } from '@/types';
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useLanguage }
from './LanguageContext';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  clearNotifications: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const MAX_NOTIFICATIONS = 10;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { t } = useLanguage(); // For default notification

  useEffect(() => {
    const storedNotifications = localStorage.getItem('nomad-intern-notifications');
    if (storedNotifications) {
      const parsedNotifications = JSON.parse(storedNotifications).map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp) // Ensure timestamp is a Date object
      }));
      setNotifications(parsedNotifications);
    } else {
      // Add a default welcome notification if none exist
      // Ensure t is available or use raw strings for keys
      const welcomeNotification: Notification = {
        id: Date.now().toString(),
        titleKey: 'notifications.sampleNotification.title',
        descriptionKey: 'notifications.sampleNotification.description',
        timestamp: new Date(),
        read: false,
        link: '/student/dashboard'
      };
      setNotifications([welcomeNotification]);
    }
  }, []); // Removed t from dependency array as it might cause re-runs if not stable early

  useEffect(() => {
    localStorage.setItem('nomad-intern-notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // For now, unreadCount is just the total number of notifications.
  // A more complex system would track individual read status.
  const unreadCount = notifications.length;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, clearNotifications, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
