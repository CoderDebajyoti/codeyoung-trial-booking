import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';

const router = Router();

router.get('/recent', (req, res) => notificationController.getRecentNotifications(req, res));
router.get('/booking/:bookingId', (req, res) => notificationController.getNotificationsByBooking(req, res));
router.post('/process-outbox', (req, res) => notificationController.processOutboxNow(req, res));
router.get('/verify-config', (req, res) => notificationController.verifyEmailConfig(req, res));

export default router;
