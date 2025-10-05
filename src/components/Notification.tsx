import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';

export const Notification = () => {
  const { notification, hideNotification } = useAppStore();

  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => {
        hideNotification();
      }, 3000); // Nachricht verschwindet nach 3 Sekunden

      return () => clearTimeout(timer);
    }
  }, [notification, hideNotification]);

  if (!notification.message) {
    return null;
  }

  const baseStyle: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    borderRadius: '8px',
    color: 'white',
    zIndex: 2000,
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    fontSize: '15px',
    fontWeight: 500,
    animation: 'fadeInDown 0.5s ease',
  };

  const typeStyle: React.CSSProperties = {
    success: { background: '#22c55e' },
    error: { background: '#ef4444' },
    info: { background: '#3b82f6' },
  };

  return (
    <>
      <div style={{ ...baseStyle, ...typeStyle[notification.type] }}>
        {notification.message}
      </div>
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </>
  );
};