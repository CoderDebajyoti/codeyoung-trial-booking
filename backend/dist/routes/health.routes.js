"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_controller_js_1 = require("../controllers/health.controller.js");
const router = (0, express_1.Router)();
router.get('/', health_controller_js_1.getHealth);
exports.default = router;
