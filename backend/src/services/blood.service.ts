import { prisma } from '../server';
import { BloodDonorProfile } from '@prisma/client';

export class BloodService {
  async getRequests(filters: {
    bloodGroup?: string;
    emergencyLevel?: string;
    status?: string;
    location?: string;
    radius?: number;
    page: number;
    limit: number;
  }) {
    const { page, limit, ...whereFilters } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'active',
      expiresAt: { gt: new Date() },
      ...(filters.bloodGroup && { bloodGroup: filters.bloodGroup }),
      ...(filters.emergencyLevel && { emergencyLevel: filters.emergencyLevel }),
      ...(filters.status && { status: filters.status }),
      ...(filters.location && {
        location: { contains: filters.location, mode: 'insensitive' },
      }),
    };

    const [requests, total] = await Promise.all([
      prisma.bloodRequest.findMany({
        where,
        skip,
        take: limit,
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
            where: { status: 'interested' },
            select: { donorId: true },
          },
        },
        orderBy: [
          { emergencyLevel: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.bloodRequest.count({ where }),
    ]);

    return {
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findEligibleDonors(
    bloodGroup: string,
    location: string,
    radius: number
  ): Promise<any[]> {
    const donors = await prisma.bloodDonorProfile.findMany({
      where: {
        bloodGroup,
        availabilityStatus: true,
        isVerified: true,
        OR: [
          { lastDonationDate: null },
          { lastDonationDate: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return donors;
  }

  async notifyDonors(requestId: string, donors: any[]) {
    const notifications = donors.map((donor) => ({
      donorId: donor.user.id,
      requestId,
      sentAt: new Date(),
    }));

    if (notifications.length > 0) {
      await prisma.bloodNotification.createMany({
        data: notifications,
      });
    }

    return notifications.length;
  }

  checkDonorEligibility(profile: BloodDonorProfile): {
    eligible: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];

    if (profile.lastDonationDate) {
      const daysSinceLastDonation = Math.floor(
        (Date.now() - profile.lastDonationDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastDonation < 90) {
        reasons.push(`You need to wait ${90 - daysSinceLastDonation} more days`);
      }
    }

    if (profile.weight && profile.weight < 50) {
      reasons.push('Minimum weight requirement is 50kg');
    }

    if (profile.age) {
      if (profile.age < 18) reasons.push('Minimum age is 18 years');
      if (profile.age > 65) reasons.push('Maximum age is 65 years');
    }

    return {
      eligible: reasons.length === 0,
      reasons,
    };
  }

  async updateDonorStats(donorId: string) {
    const totalDonations = await prisma.bloodDonorResponse.count({
      where: {
        donorId,
        status: 'interested',
      },
    });

    await prisma.bloodDonorProfile.update({
      where: { id: donorId },
      data: { totalDonations },
    });
  }
}

export const bloodService = new BloodService();