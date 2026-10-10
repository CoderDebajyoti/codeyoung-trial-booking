import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Protected: Only administrators can audit the outbox and trigger manual dispatch
router.use(authenticate);
router.use(requireRole(['ADMIN']));

router.get('/recent', (req, res) => notificationController.getRecentNotifications(req, res));
router.get('/booking/:bookingId', (req, res) => notificationController.getNotificationsByBooking(req, res));
router.post('/process-outbox', (req, res) => notificationController.processOutboxNow(req, res));
router.get('/verify-config', (req, res) => notificationController.verifyEmailConfig(req, res));

export default router;
