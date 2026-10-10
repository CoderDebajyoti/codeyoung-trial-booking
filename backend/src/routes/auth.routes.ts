import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import {
  loginRateLimiter,
  otpSendRateLimiter,
  otpVerifyRateLimiter,
} from '../middleware/rateLimiter.js';

const router = Router();

// 1. Mentor & Administrator Authentication
router.post('/login', loginRateLimiter, authController.login);
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authController.logout);

// 2. Parent Email OTP Verification
router.post('/otp/send', otpSendRateLimiter, authController.sendOtp);
router.post('/otp/verify', otpVerifyRateLimiter, authController.verifyOtp);

export default router;
