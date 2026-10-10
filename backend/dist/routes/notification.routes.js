"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_js_1 = require("../controllers/notification.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// Protected: Only administrators can audit the outbox and trigger manual dispatch
router.use(auth_js_1.authenticate);
router.use((0, auth_js_1.requireRole)(['ADMIN']));
router.get('/recent', (req, res) => notification_controller_js_1.notificationController.getRecentNotifications(req, res));
router.get('/booking/:bookingId', (req, res) => notification_controller_js_1.notificationController.getNotificationsByBooking(req, res));
router.post('/process-outbox', (req, res) => notification_controller_js_1.notificationController.processOutboxNow(req, res));
router.get('/verify-config', (req, res) => notification_controller_js_1.notificationController.verifyEmailConfig(req, res));
exports.default = router;
