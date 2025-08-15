import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationService from './NotificationService';

export default function NotificationBell({ userEmail }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (userEmail) {
      loadNotifications();
      // Set up interval to check for new notifications
      const interval = setInterval(loadNotifications, 5000); // Check every 5 seconds
      return () => clearInterval(interval);
    }
  }, [userEmail]);

  const loadNotifications = () => {
    if (!userEmail) return;
    
    const userNotifications = NotificationService.getNotifications(userEmail);
    const unread = NotificationService.getUnreadCount(userEmail);
    
    setNotifications(userNotifications);
    setUnreadCount(unread);
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    NotificationService.markAsRead(userEmail, notification.id);
    
    // Navigate to action URL if provided
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    
    setShowDropdown(false);
    loadNotifications(); // Refresh to update read status
  };

  const markAllAsRead = () => {
    NotificationService.markAllAsRead(userEmail);
    loadNotifications();
  };

  const clearAll = () => {
    NotificationService.clearNotifications(userEmail);
    loadNotifications();
    setShowDropdown(false);
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
        </svg>
        
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={clearAll}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear all
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <div className="text-4xl mb-2">🔔</div>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{notification.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className={`font-medium text-sm ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${!notification.read ? 'text-gray-700' : 'text-gray-600'}`}>
                        {notification.message}
                      </p>
                      {notification.action && (
                        <span className="inline-block mt-2 text-xs text-blue-600 font-medium">
                          {notification.action} →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
