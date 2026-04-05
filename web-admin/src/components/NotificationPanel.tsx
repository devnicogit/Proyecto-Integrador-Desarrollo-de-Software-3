import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { getUnreadNotifications, getUnreadCount, markAsRead } from '../services/notificationService';
import type { Notification } from '../services/notificationService';

interface NotificationPanelProps {
  collapsed?: boolean;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ collapsed = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      // silently fail - notifications are non-critical
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await getUnreadNotifications();
      setNotifications(data);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Ahora';
      if (diffMin < 60) return `Hace ${diffMin}m`;
      const diffHrs = Math.floor(diffMin / 60);
      if (diffHrs < 24) return `Hace ${diffHrs}h`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: 'none',
          color: '#94a3b8',
          padding: '0.4rem',
          borderRadius: '0.375rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.2s',
        }}
        title="Notificaciones"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            backgroundColor: '#ef4444',
            color: '#fff',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            fontSize: '0.6rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: collapsed ? '0' : 'auto',
          right: collapsed ? 'auto' : '0',
          marginTop: '0.5rem',
          width: '320px',
          maxHeight: '400px',
          overflowY: 'auto',
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '0.75rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          zIndex: 1001,
        }}>
          <div style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.875rem' }}>Notificaciones</span>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', color: '#94a3b8', padding: '2px' }}
            >
              <X size={16} />
            </button>
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
              No hay notificaciones pendientes
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid #334155',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#f8fafc', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    {notification.title}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: 1.4, marginBottom: '0.25rem' }}>
                    {notification.message}
                  </p>
                  <span style={{ color: '#64748b', fontSize: '0.65rem' }}>
                    {formatTime(notification.createdAt)}
                  </span>
                </div>
                <button
                  onClick={() => handleMarkAsRead(notification.id)}
                  title="Marcar como leida"
                  style={{
                    background: 'none',
                    color: '#22c55e',
                    padding: '0.25rem',
                    flexShrink: 0,
                  }}
                >
                  <Check size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
