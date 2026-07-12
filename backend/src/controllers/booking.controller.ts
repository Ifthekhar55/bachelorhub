import { Request, Response } from 'express'
import { prisma } from '../prisma'
import { notificationService } from '../services/notification.service'

export class BookingController {
  createBooking = async (req: Request, res: Response) => {
    try {
      const tenantId = String((req as any).user?.userId || '')
      const chefId = String(req.body?.chefId || '')
      const packageName = String(req.body?.packageName || '')
      const startDateValue = req.body?.startDate
      const preferredTime = String(req.body?.preferredTime || '')

      if (!tenantId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      if (!chefId || !packageName || !startDateValue || !preferredTime) {
        return res.status(400).json({ error: 'Missing booking fields' })
      }

      const startDate = new Date(startDateValue)
      if (Number.isNaN(startDate.getTime())) {
        return res.status(400).json({ error: 'Invalid startDate' })
      }

      const chef = await prisma.user.findUnique({ where: { id: chefId } })
      if (!chef || !chef.isHomechef) {
        return res.status(404).json({ error: 'Chef not found' })
      }

      const booking = await prisma.booking.create({
        data: {
          tenantId,
          chefId,
          packageName,
          startDate: new Date(startDate),
          preferredTime,
        },
        include: {
          tenant: {
            select: { id: true, name: true, profilePhoto: true },
          },
          chef: {
            select: { id: true, name: true, profilePhoto: true },
          },
        },
      })

      await notificationService.createNotification({
        userId: chefId,
        type: 'booking-request',
        title: 'New booking request',
        body: `${booking.tenant.name || 'A user'} requested a ${booking.packageName} booking for ${new Date(booking.startDate).toLocaleDateString()}.`,
        data: {
          bookingId: booking.id,
          tenantId: booking.tenantId,
          chefId: booking.chefId,
          status: 'pending',
        },
      })

      res.status(201).json({ booking })
    } catch (error) {
      console.error('Create booking error:', error)
      res.status(500).json({ error: 'Failed to create booking' })
    }
  }

  getMyBookings = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const bookings = await prisma.booking.findMany({
        where: {
          OR: [
            { tenantId: userId },
            { chefId: userId },
          ],
        },
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: {
            select: { id: true, name: true, profilePhoto: true },
          },
          chef: {
            select: { id: true, name: true, profilePhoto: true },
          },
        },
      })

      res.json({ bookings })
    } catch (error) {
      console.error('Get my bookings error:', error)
      res.status(500).json({ error: 'Failed to fetch bookings' })
    }
  }

  updateBookingStatus = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId
      const bookingId = String(req.params.id || '')
      const status = String(req.body.status || '').toLowerCase()

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      if (!bookingId || !status || !['confirmed', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid booking status' })
      }

      const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' })
      }
      if (booking.chefId !== userId) {
        return res.status(403).json({ error: 'Only the assigned chef can update this booking' })
      }
      if (booking.status !== 'pending') {
        return res.status(400).json({ error: 'Only pending bookings can be updated' })
      }

      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status },
        include: {
          tenant: {
            select: { id: true, name: true, profilePhoto: true },
          },
          chef: {
            select: { id: true, name: true, profilePhoto: true },
          },
        },
      })

      await notificationService.createNotification({
        userId: updatedBooking.tenantId,
        type: 'booking',
        title: status === 'confirmed' ? 'Booking accepted' : 'Booking rejected',
        body: `Your booking request for ${updatedBooking.packageName} was ${status === 'confirmed' ? 'accepted' : 'rejected'} by ${updatedBooking.chef.name || 'the chef'}.`,
        data: {
          bookingId: updatedBooking.id,
          tenantId: updatedBooking.tenantId,
          chefId: updatedBooking.chefId,
          status,
        },
      })

      res.json({ booking: updatedBooking })
    } catch (error) {
      console.error('Update booking status error:', error)
      res.status(500).json({ error: 'Failed to update booking status' })
    }
  }
}

export const bookingController = new BookingController()
