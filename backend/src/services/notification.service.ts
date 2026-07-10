import { prisma, io } from '../server';

class NotificationService {
  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: any;
  }) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          body: data.body,
          data: data.data || {},
        },
      });

      if (io) {
        io.to(`user_${data.userId}`).emit('new_notification', {
          notification,
        });
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  async getNotifications(userId: string, limit: number = 20) {
    try {
      return await prisma.notification.findMany({
        where: { userId },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async seedNotificationsForUser(userId: string) {
    try {
      const existing = await prisma.notification.findMany({
        where: { userId },
        take: 1,
      });

      if (existing.length > 0) {
        return existing;
      }

      const seededNotifications = [
        {
          userId,
          type: 'review',
          title: 'Someone reviewed your profile',
          body: 'A user left a positive review for your recent interaction.',
          data: { source: 'seed' },
        },
        {
          userId,
          type: 'rating',
          title: 'Your average rating changed',
          body: 'Your average rating increased to 4.8 based on recent feedback.',
          data: { source: 'seed' },
        },
        {
          userId,
          type: 'blood',
          title: 'Blood request matches your blood group',
          body: 'A nearby urgent blood request matches your blood group and location.',
          data: { source: 'seed' },
        },
        {
          userId,
          type: 'like',
          title: 'Someone liked your post',
          body: 'One of your community posts received a new like.',
          data: { source: 'seed' },
        },
        {
          userId,
          type: 'comment',
          title: 'Someone commented on your post',
          body: 'A new comment was added to your recent post.',
          data: { source: 'seed' },
        },
        {
          userId,
          type: 'reply',
          title: 'Someone replied to your comment',
          body: 'Your comment received a reply from another user.',
          data: { source: 'seed' },
        },
        {
          userId,
          type: 'mention',
          title: 'Someone mentioned you',
          body: 'You were mentioned in a community discussion.',
          data: { source: 'seed' },
        },
        {
          userId,
          type: 'welcome',
          title: 'Welcome notification',
          body: 'Welcome back to BachelorHub. Explore new features and connect with people nearby.',
          data: { source: 'seed' },
        },
        {
          userId,
          type: 'announcement',
          title: 'New feature announcements',
          body: 'A new matching and messaging experience is now available.',
          data: { source: 'seed' },
        },
        {
          userId,
          type: 'update',
          title: 'App update available',
          body: 'A new app update is ready to install for the best experience.',
          data: { source: 'seed' },
        },
        {
          userId,
          type: 'listing',
          title: 'New listings matching your saved filters',
          body: 'We found new listings that match your saved preferences.',
          data: { source: 'seed' },
        },
        {
          userId,
          type: 'booking',
          title: 'Booking request',
          body: 'You received a new booking request for one of your listings.',
          data: { source: 'seed' },
        },
      ];

      await prisma.notification.createMany({
        data: seededNotifications,
      });

      return await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error seeding notifications:', error);
      return [];
    }
  }

  async markAsRead(notificationId: string) {
    try {
      return await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }
}

export const notificationService = new NotificationService();
