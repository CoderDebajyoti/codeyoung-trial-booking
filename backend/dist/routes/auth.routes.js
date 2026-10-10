"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_js_1 = require("../controllers/auth.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const rateLimiter_js_1 = require("../middleware/rateLimiter.js");
const router = (0, express_1.Router)();
// 1. Mentor & Administrator Authentication
router.post('/login', rateLimiter_js_1.loginRateLimiter, auth_controller_js_1.authController.login);
router.get('/me', auth_js_1.authenticate, auth_controller_js_1.authController.getMe);
router.post('/logout', auth_controller_js_1.authController.logout);
// 2. Parent Email OTP Verification
router.post('/otp/send', rateLimiter_js_1.otpSendRateLimiter, auth_controller_js_1.authController.sendOtp);
router.post('/otp/verify', rateLimiter_js_1.otpVerifyRateLimiter, auth_controller_js_1.authController.verifyOtp);
exports.default = router;
