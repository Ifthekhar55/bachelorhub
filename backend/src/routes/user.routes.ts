import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { uploadProfileAndFoodPhotos } from '../middleware/upload.middleware';
import { userController } from '../controllers/user.controller';

const router = Router();

// Public routes
router.get('/profile/:userId', userController.getUserProfile);
router.get('/homechefs', userController.getHomechefs);

// Protected routes
router.use(authenticate);
router.get('/me', userController.getCurrentUser);
router.get('/all', userController.getAllUsers);
router.get('/settings', userController.getSettings);
router.get('/notifications', userController.getNotifications);
router.put('/notifications/read/:id', userController.markNotificationAsRead);
router.put('/notifications/read-all', userController.markAllNotificationsAsRead);
router.put('/profile', uploadProfileAndFoodPhotos, userController.updateProfile);
router.put('/settings', userController.updateSettings);
router.post('/change-password', userController.changePassword);
router.delete('/account', userController.deleteAccount);

export default router;