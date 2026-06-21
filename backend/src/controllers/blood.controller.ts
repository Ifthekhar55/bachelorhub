import { Request, Response } from 'express';
import { prisma } from '../server';
import { bloodService } from '../services/blood.service';
import { notificationService } from '../services/notification.service';

export class BloodController {
  // Get all blood requests with filters
  getBloodRequests = async (req: Request, res: Response) => {
    try {
      const {
        bloodGroup,
        emergencyLevel,
        status,
        location,
        radius,
        page = 1,
        limit = 20,
      } = req.query;

      const result = await bloodService.getRequests({
        bloodGroup: bloodGroup as string,
        emergencyLevel: emergencyLevel as string,
        status: status as string,
        location: location as string,
        radius: radius ? parseInt(radius as string) : undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });

      res.json(result);
    } catch (error) {
      console.error('Get blood requests error:', error);
      res.status(500).json({ error: 'Failed to fetch blood requests' });
    }
  };

  // Get emergency requests only
  getEmergencyRequests = async (req: Request, res: Response) => {
    try {
      const requests = await prisma.bloodRequest.findMany({
        where: {
          emergencyLevel: 'urgent',
          status: 'active',
          expiresAt: { gt: new Date() },
        },
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              phone: true,
              isVerified: true,
            },
          },
          donorResponses: {
            where: { status: 'interested' },
            select: { donorId: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch emergency requests' });
    }
  };

  // Get single request by ID
  getBloodRequestById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      
      await prisma.bloodRequest.update({
        where: { id },
        data: { views: { increment: 1 } },
      });

      const request = await prisma.bloodRequest.findUnique({
        where: { id },
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              phone: true,
              isVerified: true,
              profilePhoto: true,
            },
          },
          donorResponses: {
            include: {
              donor: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      phone: true,
                      isVerified: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }

      res.json(request);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch request' });
    }
  };

  // Create new blood request
  createBloodRequest = async (req: Request, res: Response) => {
    try {
      const requesterId = (req as any).user?.userId;
      const data = req.body;

      console.log('Creating blood request for user:', requesterId);
      console.log('Request data:', data);

      if (!requesterId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Validate required fields
      if (!data.bloodGroup) {
        return res.status(400).json({ error: 'Blood group is required' });
      }
      if (!data.hospitalName) {
        return res.status(400).json({ error: 'Hospital name is required' });
      }
      if (!data.hospitalAddress) {
        return res.status(400).json({ error: 'Hospital address is required' });
      }
      if (!data.requiredDate) {
        return res.status(400).json({ error: 'Required date is required' });
      }
      if (!data.contactNumber) {
        return res.status(400).json({ error: 'Contact number is required' });
      }
      if (!data.location) {
        return res.status(400).json({ error: 'Location is required' });
      }

      // Validate blood group
      const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      if (!validBloodGroups.includes(data.bloodGroup)) {
        return res.status(400).json({ error: 'Invalid blood group' });
      }

      // Validate emergency level
      const validEmergencyLevels = ['urgent', 'within_24_hours', 'planned'];
      if (data.emergencyLevel && !validEmergencyLevels.includes(data.emergencyLevel)) {
        return res.status(400).json({ error: 'Invalid emergency level' });
      }

      // Set expiry
      let expiresAt = new Date();
      if (data.emergencyLevel === 'urgent') {
        expiresAt.setHours(expiresAt.getHours() + 24);
      } else if (data.emergencyLevel === 'within_24_hours') {
        expiresAt.setHours(expiresAt.getHours() + 48);
      } else {
        expiresAt.setDate(expiresAt.getDate() + 7);
      }

      // Create the request with ONLY valid fields
      const request = await prisma.bloodRequest.create({
        data: {
          requesterId,
          bloodGroup: data.bloodGroup,
          unitsNeeded: data.unitsNeeded || 1,
          patientName: data.patientName || null,
          hospitalName: data.hospitalName,
          hospitalAddress: data.hospitalAddress,
          requiredDate: new Date(data.requiredDate),
          contactNumber: data.contactNumber,
          emergencyLevel: data.emergencyLevel || 'within_24_hours',
          additionalNotes: data.additionalNotes || null,
          location: data.location,
          expiresAt,
        },
      });

      console.log('Blood request created:', request);

      // Find and notify eligible donors (async, don't block response)
      try {
        const eligibleDonors = await bloodService.findEligibleDonors(
          data.bloodGroup,
          data.location,
          20
        );
        await bloodService.notifyDonors(request.id, eligibleDonors);
      } catch (notifyError) {
        console.error('Error notifying donors:', notifyError);
      }

      res.status(201).json(request);
    } catch (error) {
      console.error('Create blood request error:', error);
      res.status(500).json({ 
        error: 'Failed to create blood request', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  // Update request
  updateBloodRequest = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const requesterId = (req as any).user?.userId;

      const request = await prisma.bloodRequest.findFirst({
        where: { id, requesterId },
      });

      if (!request) {
        return res.status(404).json({ error: 'Request not found or unauthorized' });
      }

      const updated = await prisma.bloodRequest.update({
        where: { id },
        data: req.body,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update request' });
    }
  };

  // Delete request
  deleteBloodRequest = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const requesterId = (req as any).user?.userId;

      const request = await prisma.bloodRequest.findFirst({
        where: { id, requesterId },
      });

      if (!request) {
        return res.status(404).json({ error: 'Request not found or unauthorized' });
      }

      await prisma.bloodRequest.delete({ where: { id } });
      res.json({ message: 'Request deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete request' });
    }
  };

  // Update request status
  updateRequestStatus = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const userId = (req as any).user?.userId;

      const request = await prisma.bloodRequest.findFirst({
        where: { id, requesterId: userId },
      });

      if (!request) {
        return res.status(404).json({ error: 'Request not found or unauthorized' });
      }

      const updated = await prisma.bloodRequest.update({
        where: { id },
        data: { status },
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update status' });
    }
  };

  // Complete request (mark as completed)
  completeRequest = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = (req as any).user?.userId;

      const request = await prisma.bloodRequest.findFirst({
        where: { id, requesterId: userId },
      });

      if (!request) {
        return res.status(404).json({ error: 'Request not found or unauthorized' });
      }

      const updated = await prisma.bloodRequest.update({
        where: { id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          donorFound: true,
        },
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to complete request' });
    }
  };

  // Create or update donor profile - UPDATED with totalDonations and lastDonationDate
  createDonorProfile = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      const data = req.body;

      console.log('Creating/updating donor profile for user:', userId);
      console.log('Received data:', data);

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      if (data.bloodGroup && !validBloodGroups.includes(data.bloodGroup)) {
        return res.status(400).json({ error: 'Invalid blood group' });
      }

      const existing = await prisma.bloodDonorProfile.findUnique({
        where: { userId },
      });

      let profile;
      if (existing) {
        const updateData: any = {};
        if (data.bloodGroup !== undefined) updateData.bloodGroup = data.bloodGroup;
        if (data.weight !== undefined) updateData.weight = data.weight ? parseFloat(data.weight) : null;
        if (data.age !== undefined) updateData.age = data.age ? parseInt(data.age) : null;
        if (data.city !== undefined) updateData.city = data.city;
        if (data.area !== undefined) updateData.area = data.area;
        if (data.phoneVisible !== undefined) updateData.phoneVisible = data.phoneVisible;
        if (data.availabilityStatus !== undefined) updateData.availabilityStatus = data.availabilityStatus;
        if (data.totalDonations !== undefined) updateData.totalDonations = data.totalDonations;
        if (data.lastDonationDate !== undefined) updateData.lastDonationDate = data.lastDonationDate ? new Date(data.lastDonationDate) : null;

        profile = await prisma.bloodDonorProfile.update({
          where: { userId },
          data: updateData,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                isVerified: true,
              },
            },
          },
        });
      } else {
        profile = await prisma.bloodDonorProfile.create({
          data: {
            userId,
            bloodGroup: data.bloodGroup || 'O+',
            weight: data.weight ? parseFloat(data.weight) : null,
            age: data.age ? parseInt(data.age) : null,
            city: data.city || null,
            area: data.area || null,
            phoneVisible: data.phoneVisible !== undefined ? data.phoneVisible : true,
            availabilityStatus: data.availabilityStatus !== undefined ? data.availabilityStatus : true,
            totalDonations: data.totalDonations || 0,
            lastDonationDate: data.lastDonationDate ? new Date(data.lastDonationDate) : null,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                isVerified: true,
              },
            },
          },
        });
      }

      console.log('✅ Profile saved successfully:', profile);
      res.json(profile);
    } catch (error) {
      console.error('Create/Update donor profile error:', error);
      res.status(500).json({ 
        error: 'Failed to save donor profile', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  // Update donor profile - UPDATED with totalDonations and lastDonationDate
  updateDonorProfile = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      const data = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const existing = await prisma.bloodDonorProfile.findUnique({
        where: { userId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Donor profile not found.' });
      }

      const updateData: any = {};
      if (data.bloodGroup !== undefined) updateData.bloodGroup = data.bloodGroup;
      if (data.weight !== undefined) updateData.weight = data.weight ? parseFloat(data.weight) : null;
      if (data.age !== undefined) updateData.age = data.age ? parseInt(data.age) : null;
      if (data.city !== undefined) updateData.city = data.city;
      if (data.area !== undefined) updateData.area = data.area;
      if (data.phoneVisible !== undefined) updateData.phoneVisible = data.phoneVisible;
      if (data.availabilityStatus !== undefined) updateData.availabilityStatus = data.availabilityStatus;
      if (data.totalDonations !== undefined) updateData.totalDonations = data.totalDonations;
      if (data.lastDonationDate !== undefined) updateData.lastDonationDate = data.lastDonationDate ? new Date(data.lastDonationDate) : null;

      const updatedProfile = await prisma.bloodDonorProfile.update({
        where: { userId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isVerified: true,
            },
          },
        },
      });

      res.json(updatedProfile);
    } catch (error) {
      console.error('Update donor profile error:', error);
      res.status(500).json({ 
        error: 'Failed to update donor profile', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  // Get donor profile
  getDonorProfile = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.json(null);
      }

      const profile = await prisma.bloodDonorProfile.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isVerified: true,
            },
          },
        },
      });

      res.json(profile || null);
    } catch (error) {
      console.error('Get donor profile error:', error);
      res.status(500).json({ error: 'Failed to get donor profile' });
    }
  };

  // Check donor eligibility
  checkEligibility = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.json({ eligible: false, reason: 'User not authenticated' });
      }

      const profile = await prisma.bloodDonorProfile.findUnique({
        where: { userId },
      });

      if (!profile) {
        return res.json({ eligible: false, reason: 'No donor profile found' });
      }

      const eligibility = bloodService.checkDonorEligibility(profile);
      res.json(eligibility);
    } catch (error) {
      res.status(500).json({ error: 'Failed to check eligibility' });
    }
  };

  // Respond to a blood request (donor)
  respondToRequest = async (req: Request, res: Response) => {
    try {
      const donorId = (req as any).user?.userId;
      const id = req.params.id as string;
      const { status, message } = req.body;

      const donorProfile = await prisma.bloodDonorProfile.findUnique({
        where: { userId: donorId },
      });

      if (!donorProfile) {
        return res.status(400).json({ error: 'Please create a donor profile first' });
      }

      const response = await prisma.bloodDonorResponse.create({
        data: {
          requestId: id,
          donorId: donorProfile.id,
          status,
          message,
        },
      });

      if (status === 'interested') {
        const request = await prisma.bloodRequest.findUnique({
          where: { id },
          include: {
            requester: {
              select: { id: true, name: true },
            },
          },
        });

        await notificationService.createNotification({
          userId: request?.requesterId || '',
          type: 'blood_donor_found',
          title: '🩸 Donor Found!',
          body: `Someone has responded to your blood request.`,
        });
      }

      res.json(response);
    } catch (error) {
      console.error('Respond to request error:', error);
      res.status(500).json({ error: 'Failed to respond to request' });
    }
  };

  // Get responses for a request
  getResponses = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;

      const responses = await prisma.bloodDonorResponse.findMany({
        where: { requestId: id },
        include: {
          donor: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true,
                  isVerified: true,
                },
              },
            },
          },
        },
        orderBy: { respondedAt: 'desc' },
      });

      res.json(responses);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get responses' });
    }
  };

  // Get user's requests
  getMyRequests = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;

      const requests = await prisma.bloodRequest.findMany({
        where: { requesterId: userId },
        include: {
          donorResponses: {
            where: { status: 'interested' },
            select: { donorId: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get your requests' });
    }
  };

  // Get user's donation history
  getMyDonations = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;

      const donorProfile = await prisma.bloodDonorProfile.findUnique({
        where: { userId },
      });

      if (!donorProfile) {
        return res.json([]);
      }

      const donations = await prisma.bloodDonorResponse.findMany({
        where: { donorId: donorProfile.id },
        include: {
          request: {
            include: {
              requester: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: { respondedAt: 'desc' },
      });

      res.json(donations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get donation history' });
    }
  };

  // Get nearby requests based on location
  getNearbyRequests = async (req: Request, res: Response) => {
    try {
      const { lat, lng, radius = 10 } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({ error: 'Location coordinates required' });
      }

      const requests = await prisma.bloodRequest.findMany({
        where: {
          status: 'active',
          expiresAt: { gt: new Date() },
          lat: { not: null },
          lng: { not: null },
        },
        include: {
          requester: {
            select: {
              name: true,
              phone: true,
            },
          },
          donorResponses: {
            where: { status: 'interested' },
            select: { donorId: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      const filtered = requests.filter((request) => {
        if (!request.lat || !request.lng) return false;
        const distance = calculateDistance(
          parseFloat(lat as string),
          parseFloat(lng as string),
          request.lat,
          request.lng
        );
        return distance <= parseFloat(radius as string);
      });

      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get nearby requests' });
    }
  };

  // Get notifications for donor
  getNotifications = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;

      const notifications = await prisma.bloodNotification.findMany({
        where: { donorId: userId },
        include: {
          request: {
            include: {
              requester: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: { sentAt: 'desc' },
      });

      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get notifications' });
    }
  };

  // Mark notifications as read
  markNotificationsRead = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;

      await prisma.bloodNotification.updateMany({
        where: { donorId: userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });

      res.json({ message: 'Notifications marked as read' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
  };

  // Report fake request
  reportFakeRequest = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const reporterId = (req as any).user?.userId;
      const { reason } = req.body;

      await prisma.bloodRequest.update({
        where: { id },
        data: { status: 'expired' },
      });

      console.log(`Request ${id} reported by user ${reporterId}: ${reason}`);

      res.json({ message: 'Report submitted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to submit report' });
    }
  };
}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export const bloodController = new BloodController();