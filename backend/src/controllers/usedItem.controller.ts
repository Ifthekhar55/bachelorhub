import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { cloudinaryService } from '../services/cloudinary.service';
import { getSocketServer } from '../socket';

const getUserIdFromAuthHeader = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  if (!token) return null;

  try {
    const secret = process.env.JWT_SECRET || 'secret';
    const payload = jwt.verify(token, secret) as { userId: string };
    return payload.userId;
  } catch (error) {
    return null;
  }
};

export class UsedItemController {
  getUsedItems = async (req: Request, res: Response) => {
    try {
      const {
        category,
        minPrice,
        maxPrice,
        location,
        condition,
        search,
        sortBy = 'newest',
        page = 1,
        limit = 20,
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      let orderBy: any = {};
      switch (sortBy) {
        case 'price_asc':
          orderBy = { price: 'asc' };
          break;
        case 'price_desc':
          orderBy = { price: 'desc' };
          break;
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
      }

      const where: any = { status: 'active' };

      if (category) where.category = category;
      if (location) where.location = { contains: location, mode: 'insensitive' };
      if (condition) where.condition = condition;
      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = Number(minPrice);
        if (maxPrice) where.price.lte = Number(maxPrice);
      }
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const userId = getUserIdFromAuthHeader(req);

      const includeOptions: any = {
        postedBy: {
          select: {
            id: true,
            name: true,
            isVerified: true,
            profilePhoto: true,
          },
        },
        _count: {
          select: { savedBy: true },
        },
      };

      if (userId) {
        includeOptions.savedBy = {
          where: { userId },
          select: { id: true },
        };
      }

      const [items, total] = await Promise.all([
        prisma.usedItem.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy,
          include: includeOptions,
        }),
        prisma.usedItem.count({ where }),
      ]);

      // Map postedBy to seller for frontend consistency
      const items_mapped = items.map((item: any) => {
        const { postedBy, savedBy, ...rest } = item;
        return {
          ...rest,
          seller: postedBy,
          isSaved: userId ? Boolean(savedBy?.length) : false,
        };
      });

      res.json({
        items: items_mapped,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Get used items error:', error);
      res.status(500).json({ error: 'Failed to fetch items' });
    }
  };

  getUsedItemById = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      
      // Increment view count
      await prisma.usedItem.update({ where: { id }, data: { viewCount: { increment: 1 } } });

      const userId = getUserIdFromAuthHeader(req);
      const includeOptions: any = {
        postedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isVerified: true,
            profilePhoto: true,
            createdAt: true,
            rating: true,
            reviewsCount: true,
          },
        },
      };

      if (userId) {
        includeOptions.savedBy = {
          where: { userId },
          select: { id: true },
        };
      }

      const item = (await prisma.usedItem.findUnique({
        where: { id },
        include: includeOptions,
      })) as any;

      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      // Get similar items
      const similarItems = await prisma.usedItem.findMany({
        where: { category: item.category, id: { not: id }, status: 'active' },
        take: 4,
        include: { postedBy: { select: { name: true, isVerified: true } } },
      });

      const reviews = await prisma.review.findMany({
        where: { itemId: id },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              profilePhoto: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Map postedBy to seller for frontend consistency
      const { postedBy, savedBy, ...itemRest } = item;
      const mapped_item = {
        ...itemRest,
        seller: {
          ...postedBy,
          listingsCount: 0,
        },
        isSaved: userId ? Boolean(savedBy?.length) : false,
      };

      const mapped_similarItems = similarItems.map((si: any) => {
        const { postedBy: siPostedBy, ...siRest } = si;
        return {
          ...siRest,
          seller: siPostedBy,
        };
      });

      res.json({ item: mapped_item, similarItems: mapped_similarItems, reviews });
    } catch (error) {
      console.error('Get used item error:', error);
      res.status(500).json({ error: 'Failed to fetch item' });
    }
  };

  createUsedItem = async (req: Request, res: Response) => {
    try {
      const postedById = String((req as any).user?.userId);
      const {
        title,
        description,
        price,
        category,
        condition,
        location,
        isNegotiable,
        isUrgent,
        deliveryOption,
        contactNumber,
      } = req.body;

      let photoUrls: string[] = [];
      if ((req as any).files && Array.isArray((req as any).files)) {
        photoUrls = await Promise.all(((req as any).files as any[]).map(file => cloudinaryService.uploadImage(file, 'used-items')));
      }

      const item = await prisma.usedItem.create({
        data: {
          postedById,
          title,
          description,
          price: parseInt(price),
          category,
          condition,
          location,
          negotiable: isNegotiable === 'true',
          isUrgent: isUrgent === 'true',
          delivery: deliveryOption,
          contact: contactNumber,
          photos: photoUrls,
        },
      });

      res.status(201).json(item);
    } catch (error) {
      console.error('Create used item error:', error);
      res.status(500).json({ error: 'Failed to create item' });
    }
  };

  updateUsedItem = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const postedById = String((req as any).user?.userId);
      const updateData = req.body;

      console.log('UpdateUsedItem called for id=', id, 'postedBy=', postedById);
      console.log('Incoming body keys:', Object.keys(updateData));
      console.log('Example body values:', {
        title: updateData.title,
        price: updateData.price,
        isNegotiable: updateData.isNegotiable,
        isUrgent: updateData.isUrgent,
        contactNumber: updateData.contactNumber,
        deliveryOption: updateData.deliveryOption,
      });
      console.log('Files present:', Array.isArray((req as any).files) ? (req as any).files.length : 0);

      const item = await prisma.usedItem.findFirst({ where: { id, postedById } });

      if (!item) {
        return res.status(404).json({ error: 'Item not found or unauthorized' });
      }

      let existingPhotos: string[] = item.photos;
      if (typeof updateData.existingPhotos === 'string') {
        try {
          existingPhotos = JSON.parse(updateData.existingPhotos);
        } catch {
          existingPhotos = item.photos;
        }
      } else if (Array.isArray(updateData.existingPhotos)) {
        existingPhotos = updateData.existingPhotos;
      }

      // Delete removed photos from Cloudinary when URLs were removed from the existing photo list.
      const removedPhotos = item.photos.filter((photoUrl) => !existingPhotos.includes(photoUrl));
      const getPublicId = (url: string) => {
        const parts = url.split('/');
        const lastPart = parts[parts.length - 1];
        const [publicIdWithExt] = lastPart.split('.');
        return publicIdWithExt;
      };
      await Promise.all(
        removedPhotos.map(async (photoUrl) => {
          const publicId = getPublicId(photoUrl);
          if (publicId) {
            await cloudinaryService.deleteImage(`bachelor-housing/used-items/${publicId}`);
          }
        })
      );

      let photoUrls = existingPhotos;
      if ((req as any).files && Array.isArray((req as any).files)) {
        const newPhotos = await Promise.all(((req as any).files as any[]).map(file => cloudinaryService.uploadImage(file, 'used-items')));
        photoUrls = [...existingPhotos, ...newPhotos];
      }

      // Map incoming form fields to the Prisma model fields explicitly to avoid
      // passing unknown keys (e.g., contactNumber, deliveryOption, isNegotiable)
      const {
        title,
        description,
        price,
        category,
        condition,
        location,
        isNegotiable,
        isUrgent,
        deliveryOption,
        contactNumber,
      } = updateData as any;

      const dataToUpdate: any = {};
      if (typeof title !== 'undefined') dataToUpdate.title = title;
      if (typeof description !== 'undefined') dataToUpdate.description = description;
      if (typeof category !== 'undefined') dataToUpdate.category = category;
      if (typeof condition !== 'undefined') dataToUpdate.condition = condition;
      if (typeof location !== 'undefined') dataToUpdate.location = location;
      if (typeof price !== 'undefined' && price !== '') dataToUpdate.price = parseInt(price);
      // normalize negotiable / isUrgent
      if (typeof isNegotiable !== 'undefined') dataToUpdate.negotiable = isNegotiable === 'true' || isNegotiable === true;
      if (typeof updateData.negotiable !== 'undefined') dataToUpdate.negotiable = updateData.negotiable === true;
      if (typeof isUrgent !== 'undefined') dataToUpdate.isUrgent = isUrgent === 'true' || isUrgent === true;
      if (typeof updateData.isUrgent !== 'undefined') dataToUpdate.isUrgent = updateData.isUrgent === true;
      if (typeof deliveryOption !== 'undefined') dataToUpdate.delivery = deliveryOption;
      if (typeof updateData.delivery !== 'undefined') dataToUpdate.delivery = updateData.delivery;
      if (typeof contactNumber !== 'undefined') dataToUpdate.contact = contactNumber;
      if (typeof updateData.contact !== 'undefined') dataToUpdate.contact = updateData.contact;

      dataToUpdate.photos = photoUrls;

      const updated = await prisma.usedItem.update({ where: { id }, data: dataToUpdate });

      res.json(updated);
    } catch (error) {
      console.error('Update used item error:', error);
      res.status(500).json({ error: 'Failed to update item' });
    }
  };

  deleteUsedItem = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const postedById = String((req as any).user?.userId);

      const item = await prisma.usedItem.findFirst({ where: { id, postedById } });

      if (!item) {
        return res.status(404).json({ error: 'Item not found or unauthorized' });
      }

      await prisma.usedItem.update({
        where: { id },
        data: { status: 'deleted' },
      });

      res.json({ message: 'Item deleted successfully' });
    } catch (error) {
      console.error('Delete used item error:', error);
      res.status(500).json({ error: 'Failed to delete item' });
    }
  };

  updateItemStatus = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const postedById = String((req as any).user?.userId);
      const { status } = req.body;

      const item = await prisma.usedItem.findFirst({ where: { id, postedById } });

      if (!item) {
        return res.status(404).json({ error: 'Item not found or unauthorized' });
      }

      const updated = await prisma.usedItem.update({
        where: { id },
        data: { status },
      });

      res.json(updated);
    } catch (error) {
      console.error('Update item status error:', error);
      res.status(500).json({ error: 'Failed to update status' });
    }
  };

  saveItem = async (req: Request, res: Response) => {
    try {
      const userId = String((req as any).user?.userId);
      const id = String(req.params.id);
      await prisma.savedUsedItem.create({ data: { userId, itemId: id } });

      res.json({ message: 'Item saved successfully' });
    } catch (error) {
      console.error('Save item error:', error);
      res.status(500).json({ error: 'Failed to save item' });
    }
  };

  unsaveItem = async (req: Request, res: Response) => {
    try {
      const userId = String((req as any).user?.userId);
      const id = String(req.params.id);
      await prisma.savedUsedItem.deleteMany({ where: { userId, itemId: id } });

      res.json({ message: 'Item removed from saved' });
    } catch (error) {
      console.error('Unsave item error:', error);
      res.status(500).json({ error: 'Failed to unsave item' });
    }
  };

  getSavedItems = async (req: Request, res: Response) => {
    try {
      const userId = String((req as any).user?.userId);
      const savedItems = await prisma.savedUsedItem.findMany({
        where: { userId },
        include: { item: { include: { postedBy: { select: { name: true, isVerified: true } } } } },
        orderBy: { createdAt: 'desc' },
      });
      
      // Map postedBy to seller for frontend consistency
      const mapped_items = savedItems.map(s => {
        const { postedBy, ...itemRest } = s.item;
        return {
          ...itemRest,
          seller: postedBy,
        };
      });
      
      res.json(mapped_items);
    } catch (error) {
      console.error('Get saved items error:', error);
      res.status(500).json({ error: 'Failed to fetch saved items' });
    }
  };

  getUnreadMessageCount = async (req: Request, res: Response) => {
    try {
      const userId = String((req as any).user?.userId);
      const unreadCount = await prisma.usedItemMessage.count({
        where: {
          receiverId: userId,
          isRead: false,
        },
      });
      console.log(`Unread message count for user ${userId}: ${unreadCount}`);
      res.json({ unreadCount });
    } catch (error) {
      console.error('Get unread message count error:', error);
      res.status(500).json({ error: 'Failed to fetch unread message count' });
    }
  };

  markAllMessagesAsRead = async (req: Request, res: Response) => {
    try {
      const userId = String((req as any).user?.userId);
      console.log(`Marking all messages as read for user: ${userId}`);

      const unreadBefore = await prisma.usedItemMessage.count({
        where: {
          receiverId: userId,
          isRead: false,
        },
      });
      console.log(`Unread messages before: ${unreadBefore}`);

      const updatedMessages = await prisma.usedItemMessage.updateMany({
        where: {
          receiverId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      console.log(`Updated count: ${updatedMessages.count}`);

      const unreadAfter = await prisma.usedItemMessage.count({
        where: {
          receiverId: userId,
          isRead: false,
        },
      });
      console.log(`Unread messages after: ${unreadAfter}`);

      res.json({ message: 'All messages marked as read', updatedCount: updatedMessages.count, unreadAfter });
    } catch (error) {
      console.error('Mark all messages as read error:', error);
      res.status(500).json({ error: 'Failed to mark all messages as read' });
    }
  };

  getMyListings = async (req: Request, res: Response) => {
    try {
      const postedById = String((req as any).user?.userId);
      const listings = await prisma.usedItem.findMany({
        where: { postedById },
        include: {
          _count: {
            select: { savedBy: true, messages: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(listings);
    } catch (error) {
      console.error('Get my listings error:', error);
      res.status(500).json({ error: 'Failed to fetch listings' });
    }
  };

  sendMessage = async (req: Request, res: Response) => {
    try {
      const senderId = String((req as any).user?.userId);
      const id = String(req.params.id);
      const { message } = req.body;

      const item = await prisma.usedItem.findUnique({
        where: { id },
        select: { postedById: true },
      });

      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      const newMessage = await prisma.usedItemMessage.create({
        data: { itemId: id, senderId, receiverId: item.postedById, message },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profilePhoto: true,
            },
          },
        },
      });

      const io = getSocketServer()
      if (io) {
        const receiverRoom = `user_${item.postedById}`
        io.to(receiverRoom).emit('new_unread_message', {
          itemId: id,
          senderId,
          receiverId: item.postedById,
          messageId: newMessage.id,
          message: newMessage.message,
        })
      }

      res.json(newMessage);
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  };

  getMessages = async (req: Request, res: Response) => {
    try {
      const userId = String((req as any).user?.userId);
      const id = String(req.params.id);

      const messages = await prisma.usedItemMessage.findMany({
        where: {
          itemId: id,
          OR: [
            { senderId: userId },
            { receiverId: userId },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profilePhoto: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      res.json(messages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  };

  getItemReviews = async (req: Request, res: Response) => {
    try {
      const itemId = String(req.params.id);

      const reviews = await prisma.review.findMany({
        where: { itemId },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              profilePhoto: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ reviews });
    } catch (error) {
      console.error('Get item reviews error:', error);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  };

  createItemReview = async (req: Request, res: Response) => {
    try {
      const reviewerId = String((req as any).user?.userId);
      const itemId = String(req.params.id);
      const { rating, comment } = req.body;
      const parsedRating = Number(rating);

      if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      const item = await prisma.usedItem.findUnique({
        where: { id: itemId },
        select: { postedById: true },
      });

      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      if (item.postedById === reviewerId) {
        return res.status(400).json({ error: 'You cannot review your own item' });
      }

      const review = await prisma.review.create({
        data: {
          reviewerId,
          revieweeId: item.postedById,
          itemId,
          rating: parsedRating,
          comment: comment?.trim() || null,
        },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              profilePhoto: true,
            },
          },
        },
      });

      const reviewee = await prisma.user.findUnique({ where: { id: item.postedById } });
      if (reviewee) {
        const currentCount = reviewee.reviewsCount || 0;
        const currentRating = reviewee.rating || 0;
        const nextRating = currentCount === 0
          ? parsedRating
          : Number(((currentRating * currentCount + parsedRating) / (currentCount + 1)).toFixed(1));

        await prisma.user.update({
          where: { id: item.postedById },
          data: {
            rating: nextRating,
            reviewsCount: currentCount + 1,
          },
        });
      }

      res.status(201).json({ review });
    } catch (error) {
      console.error('Create item review error:', error);
      res.status(500).json({ error: 'Failed to submit review' });
    }
  };

  deleteItemReview = async (req: Request, res: Response) => {
    try {
      const reviewerId = String((req as any).user?.userId);
      const itemId = String(req.params.id);
      const reviewId = String(req.params.reviewId);

      const review = await prisma.review.findFirst({
        where: { id: reviewId, itemId, reviewerId },
      });

      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      await prisma.review.delete({ where: { id: reviewId } });

      const remainingReviews = await prisma.review.findMany({
        where: { revieweeId: review.revieweeId },
        select: { rating: true },
      });

      const nextCount = remainingReviews.length;
      const nextRating = nextCount === 0
        ? 0
        : Number((remainingReviews.reduce((sum, item) => sum + item.rating, 0) / nextCount).toFixed(1));

      await prisma.user.update({
        where: { id: review.revieweeId },
        data: {
          rating: nextRating,
          reviewsCount: nextCount,
        },
      });

      res.json({ message: 'Review deleted successfully' });
    } catch (error) {
      console.error('Delete item review error:', error);
      res.status(500).json({ error: 'Failed to delete review' });
    }
  };

  markMessagesAsRead = async (req: Request, res: Response) => {
    try {
      const userId = String((req as any).user?.userId);
      const itemId = String(req.params.id);

      const updatedMessages = await prisma.usedItemMessage.updateMany({
        where: {
          itemId,
          receiverId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      res.json({ message: 'Messages marked as read', updatedCount: updatedMessages.count });
    } catch (error) {
      console.error('Mark messages as read error:', error);
      res.status(500).json({ error: 'Failed to mark messages as read' });
    }
  };

  reportItem = async (req: Request, res: Response) => {
    try {
      const reporterId = String((req as any).user?.userId);
      const id = String(req.params.id);
      const { reason, description } = req.body;

      const report = await prisma.usedItemReport.create({
        data: {
          itemId: id,
          reporterId,
          reason,
          description,
        },
      });

      res.json({ message: 'Report submitted successfully', report });
    } catch (error) {
      console.error('Report item error:', error);
      res.status(500).json({ error: 'Failed to submit report' });
    }
  };

  getCategories = async (req: Request, res: Response) => {
    const categories = {
      furniture: ['Bed', 'Mattress', 'Table', 'Chair', 'Wardrobe', 'Bookshelf'],
      electronics: ['Laptop', 'Monitor', 'Router', 'Fan', 'Refrigerator', 'Television'],
      kitchen: ['Rice Cooker', 'Blender', 'Induction Cooker', 'Gas Stove', 'Plates & Utensils'],
      home_appliances: ['Iron', 'Water Filter', 'Vacuum Cleaner'],
      study_items: ['Books', 'Notes', 'Calculator'],
      miscellaneous: ['Bicycle', 'Gym Equipment', 'Musical Instruments'],
      moving_out_sale: ['Moving Out Sale'],
      room_setup_bundle: ['Room Setup Bundle'],
    };
    res.json(categories);
  };
}

export const usedItemController = new UsedItemController();