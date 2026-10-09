import { Router } from 'express';
import { getMentors, getMentorSchedule } from '../controllers/mentor.controller.js';

const router = Router();

router.get('/', getMentors);
router.get('/:id/schedule', getMentorSchedule);

export default router;
