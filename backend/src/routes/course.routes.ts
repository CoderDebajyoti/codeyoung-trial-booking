import { Router } from 'express';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  upsertPackage,
  deletePackage,
} from '../controllers/course.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Public course endpoints
router.get('/', getCourses);
router.get('/:id', getCourseById);

// Protected Admin Course & Package Management
router.post('/', authenticate, requireRole(['ADMIN']), createCourse);
router.put('/:id', authenticate, requireRole(['ADMIN']), updateCourse);
router.delete('/:id', authenticate, requireRole(['ADMIN']), deleteCourse);
router.post('/:id/packages', authenticate, requireRole(['ADMIN']), upsertPackage);
router.delete('/packages/:id', authenticate, requireRole(['ADMIN']), deletePackage);

export default router;
