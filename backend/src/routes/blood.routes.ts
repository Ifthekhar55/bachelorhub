import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { bloodController } from '../controllers/blood.controller';

const router = Router();

// ============ PUBLIC ROUTES ============
router.get('/requests', bloodController.getBloodRequests);
router.get('/requests/:id', bloodController.getBloodRequestById);
router.get('/emergency', bloodController.getEmergencyRequests);
router.get('/nearby', bloodController.getNearbyRequests);

// ============ SEMI-PUBLIC ROUTES (no auth required) ============
router.get('/donor-profile/eligibility', bloodController.checkEligibility);

// ============ PROTECTED ROUTES (auth required) ============
router.use(authenticate);

// Request management
router.post('/requests', bloodController.createBloodRequest);
router.put('/requests/:id', bloodController.updateBloodRequest);
router.delete('/requests/:id', bloodController.deleteBloodRequest);
router.patch('/requests/:id/status', bloodController.updateRequestStatus);
router.patch('/requests/:id/complete', bloodController.completeRequest);

// Donor management
router.get('/donor-profile', bloodController.getDonorProfile);
router.post('/donor-profile', bloodController.createDonorProfile);
router.put('/donor-profile', bloodController.updateDonorProfile);

// Donor responses
router.post('/requests/:id/respond', bloodController.respondToRequest);
router.get('/requests/:id/responses', bloodController.getResponses);

// User's requests
router.get('/my-requests', bloodController.getMyRequests);
router.get('/my-donations', bloodController.getMyDonations);

// Notifications
router.post('/notifications/mark-read', bloodController.markNotificationsRead);
router.get('/notifications', bloodController.getNotifications);

// Report fake request
router.post('/requests/:id/report', bloodController.reportFakeRequest);

export default router;