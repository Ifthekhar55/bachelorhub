import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Get all active listings
router.get('/', async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { status: 'active' },
      include: {
        landlord: {
          select: { name: true, email: true, phone: true, isVerified: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(listings);
  } catch (error) {
    console.error('Fetch listings error:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Get saved listings for current user
router.get('/saved', authenticate, async (req, res) => {
  try {
    const userId = String((req as any).user?.userId);
    const saved = await prisma.savedListing.findMany({
      where: { userId },
      include: { listing: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(saved.map((item) => item.listing));
  } catch (error) {
    console.error('Fetch saved listings error:', error);
    res.status(500).json({ error: 'Failed to fetch saved listings' });
  }
});

// Get current user's own listings
router.get('/my-listings', authenticate, async (req, res) => {
  try {
    const userId = String((req as any).user?.userId);
    const listings = await prisma.listing.findMany({
      where: { landlordId: userId },
      include: {
        landlord: {
          select: { name: true, email: true, phone: true, isVerified: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(listings);
  } catch (error) {
    console.error('Fetch my listings error:', error);
    res.status(500).json({ error: 'Failed to fetch your listings' });
  }
});

// Check whether current user has saved this listing
router.get('/:id/saved', authenticate, async (req, res) => {
  try {
    const userId = String((req as any).user?.userId);
    const listingId = String(req.params.id);

    const saved = await prisma.savedListing.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
    });

    res.json({ saved: Boolean(saved) });
  } catch (error) {
    console.error('Fetch saved listing state error:', error);
    res.status(500).json({ error: 'Failed to fetch saved listing state' });
  }
});

// Get single listing
router.get('/:id', async (req, res) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        landlord: {
          select: { name: true, email: true, phone: true, isVerified: true },
        },
      },
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(listing);
  } catch (error) {
    console.error('Fetch listing error:', error);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

// Create listing
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = String((req as any).user?.userId);
    const {
      title,
      description,
      location,
      rent,
      priceValue,
      availableSeats,
      genderPreference,
      furnishing,
      availableFrom,
      features,
      rules,
      photos,
    } = req.body;

    const listing = await prisma.listing.create({
      data: {
        landlordId: userId,
        title,
        description,
        location,
        rent: Number(rent) || 0,
        priceValue: Number(priceValue) || Number(rent) || 0,
        availableSeats: Number(availableSeats) || 1,
        genderPreference: genderPreference || undefined,
        furnishing: furnishing || undefined,
        availableFrom: availableFrom ? new Date(availableFrom) : undefined,
        features: Array.isArray(features) ? features : [],
        rules: Array.isArray(rules) ? rules : [],
        photos: Array.isArray(photos) ? photos : [],
      },
    });

    res.status(201).json(listing);
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

// Save a listing
router.post('/:id/save', authenticate, async (req, res) => {
  try {
    const userId = String((req as any).user?.userId);
    const listingId = String(req.params.id);

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const saved = await prisma.savedListing.upsert({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
      update: {},
      create: {
        userId,
        listingId,
      },
    });

    res.status(201).json(saved);
  } catch (error) {
    console.error('Save listing error:', error);
    res.status(500).json({ error: 'Failed to save listing' });
  }
});

// Unsave a listing
router.delete('/:id/save', authenticate, async (req, res) => {
  try {
    const userId = String((req as any).user?.userId);
    const listingId = String(req.params.id);

    await prisma.savedListing.deleteMany({
      where: {
        userId,
        listingId,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Unsave listing error:', error);
    res.status(500).json({ error: 'Failed to remove saved listing' });
  }
});

// Update listing
router.put('/:id', authenticate, async (req, res) => {
  try {
    const userId = String((req as any).user?.userId);
    const listingId = String(req.params.id);
    const existingListing = await prisma.listing.findUnique({ where: { id: listingId } });

    if (!existingListing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    if (existingListing.landlordId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const {
      title,
      description,
      location,
      rent,
      priceValue,
      availableSeats,
      genderPreference,
      furnishing,
      availableFrom,
      features,
      rules,
      photos,
    } = req.body;

    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: {
        title,
        description,
        location,
        rent: Number(rent) || existingListing.rent,
        priceValue: Number(priceValue) || Number(rent) || existingListing.priceValue,
        availableSeats: Number(availableSeats) || existingListing.availableSeats,
        genderPreference: genderPreference || existingListing.genderPreference || undefined,
        furnishing: furnishing || existingListing.furnishing || undefined,
        availableFrom: availableFrom ? new Date(availableFrom) : existingListing.availableFrom,
        features: Array.isArray(features) ? features : existingListing.features,
        rules: Array.isArray(rules) ? rules : existingListing.rules,
        photos: Array.isArray(photos) ? photos : existingListing.photos,
      },
    });

    res.json(updatedListing);
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ error: 'Failed to update listing' });
  }
});

// Delete listing
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = String((req as any).user?.userId);
    const listingId = String(req.params.id);
    const existingListing = await prisma.listing.findUnique({ where: { id: listingId } });

    if (!existingListing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    if (existingListing.landlordId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.savedListing.deleteMany({
      where: { listingId },
    });
    await prisma.listing.delete({ where: { id: listingId } });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

export default router;
