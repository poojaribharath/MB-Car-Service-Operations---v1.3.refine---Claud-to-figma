import React from 'react';
import { Bell, Clock, CheckCircle, AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { AppNotification } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface NotificationDropdownProps {
  notifications: AppNotification[];
  isOpen: boolean;
  onClose: () => void;
  onViewAll: () => void;
  onNotificationClick: (id: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  isOpen,
  onClose,
  onViewAll,
  onNotificationClick
}) => {
  const latestNotifications = notifications
    .filter(n => n.status !== 'dismissed')
    .slice(0, 5);

  const getIcon = (severity: AppNotification['severity']) => {
    switch (severity) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'danger': return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default: return <Info className="w-4 h-4 text-sky-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-[380px] bg-white rounded-xl border border-neutral-200 shadow-xl z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary-600" />
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider font-mono">Recent Notifications</h3>
              </div>
              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-[10px] font-bold font-mono">
                {notifications.filter(n => !n.read).length} NEW
              </span>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {latestNotifications.length > 0 ? (
                <div className="divide-y divide-neutral-100">
                  {latestNotifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => {
                        onNotificationClick(notification.id);
                        onClose();
                      }}
                      className={cn(
                        "w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors flex gap-3 items-start",
                        !notification.read && "bg-primary-50/30"
                      )}
                    >
                      <div className="mt-0.5 shrink-0">
                        {getIcon(notification.severity)}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn("text-xs font-bold text-neutral-900 truncate", !notification.read && "text-primary-900")}>
                            {notification.title}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-medium whitespace-nowrap font-mono">
                            {notification.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-10 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 mb-3">
                    <Bell className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-neutral-500 font-medium">No recent notifications</p>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                onViewAll();
                onClose();
              }}
              className="w-full py-3 bg-neutral-50 hover:bg-neutral-100 text-[11px] font-bold text-primary-700 uppercase tracking-widest border-t border-neutral-100 transition-colors flex items-center justify-center gap-2"
            >
              View Notification Centre <ChevronRight className="w-3 h-3" />
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
