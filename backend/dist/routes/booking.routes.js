"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const booking_controller_js_1 = require("../controllers/booking.controller.js");
const router = (0, express_1.Router)();
router.post('/', booking_controller_js_1.createBooking);
router.get('/:id', booking_controller_js_1.getBookingById);
exports.default = router;
