import { Router } from 'express';
import { getMentors, getMentorSchedule } from '../controllers/mentor.controller.js';
import { authenticate, requireMentorOrAdmin } from '../middleware/auth.js';

const router = Router();

// Public listing of active mentors (names & timezones)
router.get('/', getMentors);

// Protected mentor schedule inspection: restricted to the mentor themselves or administrator
router.get('/:id/schedule', authenticate, requireMentorOrAdmin, getMentorSchedule);

export default router;
