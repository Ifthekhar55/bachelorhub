import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { bookingController } from '../controllers/booking.controller'

const router = Router()

router.use(authenticate)
router.post('/', bookingController.createBooking)
router.get('/my-bookings', bookingController.getMyBookings)
router.patch('/:id/status', bookingController.updateBookingStatus)

export default router
