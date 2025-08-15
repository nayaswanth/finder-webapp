// Notification Service for managing user notifications
class NotificationService {
  constructor() {
    this.storageKey = 'finder_notifications';
  }

  // Get all notifications for a user
  getNotifications(userEmail) {
    try {
      const notifications = JSON.parse(localStorage.getItem(this.storageKey)) || {};
      return notifications[userEmail] || [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // Add a new notification
  addNotification(userEmail, notification) {
    try {
      const notifications = JSON.parse(localStorage.getItem(this.storageKey)) || {};
      if (!notifications[userEmail]) {
        notifications[userEmail] = [];
      }
      
      const newNotification = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        read: false,
        ...notification
      };
      
      notifications[userEmail].unshift(newNotification); // Add to beginning
      
      // Keep only last 50 notifications per user
      if (notifications[userEmail].length > 50) {
        notifications[userEmail] = notifications[userEmail].slice(0, 50);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(notifications));
      return newNotification;
    } catch (error) {
      console.error('Error adding notification:', error);
      return null;
    }
  }

  // Mark notification as read
  markAsRead(userEmail, notificationId) {
    try {
      const notifications = JSON.parse(localStorage.getItem(this.storageKey)) || {};
      if (notifications[userEmail]) {
        const notification = notifications[userEmail].find(n => n.id === notificationId);
        if (notification) {
          notification.read = true;
          localStorage.setItem(this.storageKey, JSON.stringify(notifications));
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read for a user
  markAllAsRead(userEmail) {
    try {
      const notifications = JSON.parse(localStorage.getItem(this.storageKey)) || {};
      if (notifications[userEmail]) {
        notifications[userEmail].forEach(n => n.read = true);
        localStorage.setItem(this.storageKey, JSON.stringify(notifications));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Get unread count
  getUnreadCount(userEmail) {
    const notifications = this.getNotifications(userEmail);
    return notifications.filter(n => !n.read).length;
  }

  // Clear all notifications for a user
  clearNotifications(userEmail) {
    try {
      const notifications = JSON.parse(localStorage.getItem(this.storageKey)) || {};
      notifications[userEmail] = [];
      localStorage.setItem(this.storageKey, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  // Create notification for new application
  notifyOpportunityPoster(posterEmail, applicantName, opportunityTitle, opportunityId) {
    return this.addNotification(posterEmail, {
      type: 'new_application',
      title: 'New Application Received',
      message: `${applicantName} applied to your opportunity "${opportunityTitle}"`,
      icon: '👤',
      action: 'View Applications',
      actionUrl: `/dashboard?tab=posted&opportunityId=${opportunityId}`
    });
  }

  // Create notification for application acceptance
  notifyApplicationAccepted(applicantEmail, opportunityTitle, opportunityId) {
    return this.addNotification(applicantEmail, {
      type: 'application_accepted',
      title: 'Application Accepted!',
      message: `Congratulations! Your application for "${opportunityTitle}" has been accepted.`,
      icon: '✅',
      action: 'View Details',
      actionUrl: `/dashboard?filter=accepted&tab=applied&opportunityId=${opportunityId}`
    });
  }

  // Create notification for application rejection
  notifyApplicationRejected(applicantEmail, opportunityTitle, opportunityId) {
    return this.addNotification(applicantEmail, {
      type: 'application_rejected',
      title: 'Application Update',
      message: `Your application for "${opportunityTitle}" was not selected this time.`,
      icon: '❌',
      action: 'View Status',
      actionUrl: `/dashboard?tab=applied&opportunityId=${opportunityId}`
    });
  }

  // Create notification for opportunity closure
  notifyOpportunityClosed(applicantEmail, opportunityTitle, opportunityId) {
    return this.addNotification(applicantEmail, {
      type: 'opportunity_closed',
      title: 'Opportunity Closed',
      message: `The opportunity "${opportunityTitle}" you applied for has been closed.`,
      icon: '🔒',
      action: 'View Status',
      actionUrl: `/dashboard?tab=applied&opportunityId=${opportunityId}`
    });
  }
}

export default new NotificationService();
