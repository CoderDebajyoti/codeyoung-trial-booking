import { Router } from 'express';
import { getAvailableSlots } from '../controllers/slot.controller.js';

const router = Router();

router.get('/', getAvailableSlots);

export default router;
