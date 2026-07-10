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
