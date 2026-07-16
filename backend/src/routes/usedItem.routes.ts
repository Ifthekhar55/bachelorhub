import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { uploadMultiple } from '../middleware/upload.middleware';
import { usedItemController } from '../controllers/usedItem.controller';

const router = Router();

// Public routes
router.get('/', usedItemController.getUsedItems);
router.get('/categories', usedItemController.getCategories);
router.get('/:id/reviews', usedItemController.getItemReviews);

// Protected routes
router.use(authenticate);
router.post('/', uploadMultiple, usedItemController.createUsedItem);
router.get('/saved/my-items', usedItemController.getSavedItems);
router.get('/my-listings', usedItemController.getMyListings);
router.put('/:id', uploadMultiple, usedItemController.updateUsedItem);
router.delete('/:id', usedItemController.deleteUsedItem);
router.patch('/:id/status', usedItemController.updateItemStatus);
router.post('/:id/save', usedItemController.saveItem);
router.delete('/:id/save', usedItemController.unsaveItem);
router.get('/messages/unread-count', usedItemController.getUnreadMessageCount);
router.patch('/messages/mark-all-as-read', usedItemController.markAllMessagesAsRead);
router.post('/:id/message', usedItemController.sendMessage);
router.patch('/:id/messages/mark-as-read', usedItemController.markMessagesAsRead);
router.get('/:id/messages', usedItemController.getMessages);
router.post('/:id/report', usedItemController.reportItem);
router.post('/:id/review', usedItemController.createItemReview);

// Public route - must be last to avoid matching other patterns
router.get('/:id', usedItemController.getUsedItemById);

export default router;