"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const slot_controller_js_1 = require("../controllers/slot.controller.js");
const router = (0, express_1.Router)();
router.get('/', slot_controller_js_1.getAvailableSlots);
exports.default = router;
