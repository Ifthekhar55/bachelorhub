const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const userId = '4e884019-93d5-4631-8af1-43a9569dad0a';
const parseJsonField = (value, fallback) => {
  if (!value || typeof value !== 'string') {
    return fallback;
  }
  try { return JSON.parse(value); } catch (error) { console.warn('Invalid JSON', value, error); return fallback; }
};
(async () => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        notificationSettings: true,
        privacySettings: true,
        preferences: true,
      },
    });
    console.log('user', JSON.stringify(user, null, 2));
    if (!user) {
      console.log('user not found');
      return;
    }
    const notifications = parseJsonField(user.notificationSettings, {
      messageNotifications: true,
      bookingNotifications: true,
      listingUpdates: true,
      promotionalNotifications: true,
    });
    const privacy = parseJsonField(user.privacySettings, {
      profileVisibility: 'public',
      blockedUsers: [],
    });
    const preferences = parseJsonField(user.preferences, {
      language: 'en',
      locationPreference: '',
    });
    console.log('notifications', notifications);
    console.log('privacy', privacy);
    console.log('preferences', preferences);
  } catch (error) {
    console.error('ERROR', error);
  } finally {
    await prisma.$disconnect();
  }
})();
