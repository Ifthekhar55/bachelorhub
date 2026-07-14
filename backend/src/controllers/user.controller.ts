import { Request, Response } from 'express';
import { File as MulterFile } from 'multer';
import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';
import { cloudinaryService } from '../services/cloudinary.service';

const parseJsonField = <T>(value: string | null | undefined, fallback: T): T => {
  if (!value || typeof value !== 'string') {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn('Invalid JSON in user settings field, using fallback value.', { value, error });
    return fallback;
  }
};

export class UserController {
  getUserProfile = async (req: Request, res: Response) => {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: { listings: true },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const rawInterests = (user as any).interests
      const interests = Array.isArray(rawInterests)
        ? rawInterests
        : typeof rawInterests === 'string'
        ? rawInterests.length
          ? rawInterests.split(',').map((i: string) => i.trim())
          : []
        : [];

      const result = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        verificationStatus: (user as any).verificationStatus,
        profilePhoto: user.profilePhoto,
        bio: user.bio,
        location: user.location,
        occupation: user.occupation,
        education: user.education,
        interests,
        // Homechef fields
        isHomechef: (user as any).isHomechef,
        specialties: (user as any).specialties || [],
        experience: (user as any).experience,
        servingArea: (user as any).servingArea,
        foods: (user as any).foods || [],
        schedule: (user as any).schedule,
        packages: (user as any).packages,
        foodPhotos: (user as any).foodPhotos || [],
        rating: (user as any).rating || 0,
        reviewsCount: (user as any).reviewsCount || 0,
        memberSince: user.createdAt,
        listingsCount: user._count?.listings ?? 0,
      };

      res.json(result);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  };

  getHomechefs = async (req: Request, res: Response) => {
    try {
      const homechefs = await prisma.user.findMany({
        where: {
          isHomechef: true,
        },
        select: {
          id: true,
          isHomechef: true,
          name: true,
          profilePhoto: true,
          location: true,
          bio: true,
          isVerified: true,
          // Homechef fields
          specialties: true,
          experience: true,
          servingArea: true,
          foods: true,
          schedule: true,
          packages: true,
          foodPhotos: true,
          rating: true,
          reviewsCount: true,
        },
      });

      res.json({ data: homechefs });
    } catch (error) {
      console.error('Get homechefs error:', error);
      res.status(500).json({ error: 'Failed to fetch homechefs' });
    }
  };

  getCurrentUser = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          profilePhoto: true,
          bio: true,
          location: true,
        },
      });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get user' });
    }
  };

  getAllUsers = async (req: Request, res: Response) => {
    try {
      const currentUserId = (req as any).user?.userId;
      const users = await prisma.user.findMany({
        where: {
          AND: [
            {
              id: {
                not: currentUserId,
              },
            },
            {
              name: {
                not: 'John Doe',
              },
            },
            {
              name: {
                not: 'Test User',
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          profilePhoto: true,
        },
      });

      res.json({ users });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  };

  updateProfile = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      const {
        name,
        bio,
        location,
        occupation,
        education,
        interests,
        // Homechef fields
        specialties,
        experience,
        servingArea,
        foods,
        schedule,
        packages,
        isHomechef,
        profilePhoto: profilePhotoUrl,
        removeProfilePhoto,
      } = req.body;

      // Handle existing profile photo or upload new one
      let profilePhoto: string | null | undefined = profilePhotoUrl;
      const requestWithFiles = req as Request & { files?: MulterFile[] };
      const shouldRemoveProfilePhoto = removeProfilePhoto === 'true' || removeProfilePhoto === true;
      const existingUser = await prisma.user.findUnique({ where: { id: userId }, select: { profilePhoto: true } });
      
      // If there are files and one might be a profile photo
      if (requestWithFiles.files && requestWithFiles.files.length > 0) {
        // Try to find profilePhoto in files (for backward compatibility)
        const profilePhotoFile = requestWithFiles.files.find(f => f.fieldname === 'profilePhoto');
        if (profilePhotoFile) {
          try {
            profilePhoto = await cloudinaryService.uploadImage(profilePhotoFile, 'profiles');
          } catch (uploadError) {
            console.error('Profile photo upload failed:', uploadError);
            console.error('Profile photo file details:', {
              fieldname: profilePhotoFile.fieldname,
              originalname: profilePhotoFile.originalname,
              mimetype: profilePhotoFile.mimetype,
              size: profilePhotoFile.size,
              path: profilePhotoFile.path,
            });
            profilePhoto = undefined;
          }
        }
      }

      if (shouldRemoveProfilePhoto) {
        profilePhoto = null;
      } else if (profilePhoto === undefined && existingUser?.profilePhoto) {
        profilePhoto = existingUser.profilePhoto;
      }

      const interestsArray = interests ? interests.split(',').map((i: string) => i.trim()) : undefined;
      
      // Parse homechef field strings to arrays
      const specialtiesArray = specialties ? (Array.isArray(specialties) ? specialties : specialties.split(',').map((s: string) => s.trim())) : undefined;
      const foodsArray = foods ? (Array.isArray(foods) ? foods : foods.split(',').map((f: string) => f.trim())) : undefined;
      
      // Handle food photos
      let foodPhotos: string[] = [];
      if (requestWithFiles.files) {
        const foodPhotoFiles = requestWithFiles.files.filter(f => f.fieldname === 'foodPhotos' || f.fieldname === 'photos');
        for (const file of foodPhotoFiles) {
          try {
            const uploadedUrl = await cloudinaryService.uploadImage(file, 'food-photos');
            foodPhotos.push(uploadedUrl);
          } catch (uploadError) {
            console.error('Food photo upload failed:', uploadError);
            console.error('Food photo file details:', {
              fieldname: file.fieldname,
              originalname: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
              path: file.path,
            });
          }
        }
      }

      const updateData: any = {
        name: name || undefined,
        bio: bio || undefined,
        location: location || undefined,
        occupation: occupation || undefined,
        education: education || undefined,
        interests: interestsArray,
        profilePhoto: profilePhoto === null ? null : (profilePhoto || undefined),
      };

      // Add homechef fields if provided
      if (specialtiesArray !== undefined) updateData.specialties = specialtiesArray;
      if (experience !== undefined) updateData.experience = experience;
      if (servingArea !== undefined) updateData.servingArea = servingArea;
      if (foodsArray !== undefined) updateData.foods = foodsArray;
      if (schedule !== undefined) updateData.schedule = schedule;
      if (packages !== undefined) updateData.packages = packages; // Already JSON stringified from frontend
      if (isHomechef !== undefined) updateData.isHomechef = isHomechef === 'true' || isHomechef === true;
      if (foodPhotos.length > 0) updateData.foodPhotos = foodPhotos;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          profilePhoto: true,
          bio: true,
          location: true,
          occupation: true,
          education: true,
          // Homechef fields
          isHomechef: true,
          specialties: true,
          experience: true,
          servingArea: true,
          foods: true,
          schedule: true,
          packages: true,
          foodPhotos: true,
          createdAt: true,
        },
      });

      res.json({ user: updatedUser, message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  };

  changePassword = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      const { currentPassword, newPassword } = req.body;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to change password' });
    }
  };

  deleteAccount = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      await prisma.user.delete({ where: { id: userId } });
      res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete account' });
    }
  };

  getSettings = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
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

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
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

      res.json({
        email: user.email,
        phone: user.phone,
        notifications,
        privacy,
        preferences,
      });
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  };

  getNotifications = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      const sampleTitles = [
        'Someone reviewed your profile',
        'Your average rating changed',
        'Blood request matches your blood group',
        'Someone liked your post',
        'Someone commented on your post',
        'Someone replied to your comment',
        'Someone mentioned you',
        'Welcome notification',
        'New feature announcements',
        'App update available',
        'New listings matching your saved filters',
        'Booking request',
      ];

      const existingNotifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          data: true,
          isRead: true,
          createdAt: true,
        },
      });

      const seededNotificationIds = existingNotifications
        .filter((notification) => {
          const data = notification.data as Record<string, unknown> | null
          const isSeeded = data?.source === 'seed'
          const matchesSampleTitle = sampleTitles.includes(notification.title)
          const matchesSampleBody = notification.body && [
            'A user left a positive review for your recent interaction.',
            'Your average rating increased to 4.8 based on recent feedback.',
            'A nearby urgent blood request matches your blood group and location.',
            'One of your community posts received a new like.',
            'A new comment was added to your recent post.',
            'Your comment received a reply from another user.',
            'You were mentioned in a community discussion.',
            'Welcome back to BachelorHub. Explore new features and connect with people nearby.',
            'A new matching and messaging experience is now available.',
            'A new app update is ready to install for the best experience.',
            'We found new listings that match your saved preferences.',
            'You received a new booking request for one of your listings.',
          ].includes(notification.body)
          return isSeeded || matchesSampleTitle || matchesSampleBody
        })
        .map((notification) => notification.id)

      if (seededNotificationIds.length > 0) {
        await prisma.notification.deleteMany({
          where: { id: { in: seededNotificationIds } },
        })
      }

      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          data: true,
          isRead: true,
          createdAt: true,
        },
      });

      res.json({ notifications });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  };

  markNotificationAsRead = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      const notificationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification || notification.userId !== userId) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({ error: 'Failed to update notification' });
    }
  };

  markAllNotificationsAsRead = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Mark all notifications read error:', error);
      res.status(500).json({ error: 'Failed to update notifications' });
    }
  };

  updateSettings = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      const {
        email,
        phone,
        notifications,
        privacy,
        preferences,
      } = req.body;

      const updateData: any = {};

      // Update email if provided
      if (email) {
        const existingEmail = await prisma.user.findUnique({
          where: { email },
        });
        if (existingEmail && existingEmail.id !== userId) {
          return res.status(400).json({ error: 'Email already in use' });
        }
        updateData.email = email;
      }

      // Update phone if provided
      if (phone) {
        const existingPhone = await prisma.user.findUnique({
          where: { phone },
        });
        if (existingPhone && existingPhone.id !== userId) {
          return res.status(400).json({ error: 'Phone already in use' });
        }
        updateData.phone = phone;
      }

      // Update notification settings
      if (notifications && typeof notifications === 'object') {
        updateData.notificationSettings = JSON.stringify(notifications);
      }

      // Update privacy settings
      if (privacy && typeof privacy === 'object') {
        updateData.privacySettings = JSON.stringify(privacy);
      }

      // Update preferences
      if (preferences && typeof preferences === 'object') {
        updateData.preferences = JSON.stringify(preferences);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      res.json({
        message: 'Settings updated successfully',
        user: {
          email: updatedUser.email,
          phone: updatedUser.phone,
        },
      });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  };
}

export const userController = new UserController();