import { Router } from 'express';
import authRoutes from './auth.routes.js';
import healthRoutes from './health.routes.js';
import mentorRoutes from './mentor.routes.js';
import slotRoutes from './slot.routes.js';
import bookingRoutes from './booking.routes.js';
import emailRoutes from './email.routes.js';
import notificationRoutes from './notification.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/health', healthRoutes);
apiRouter.use('/mentors', mentorRoutes);
apiRouter.use('/slots', slotRoutes);
apiRouter.use('/bookings', bookingRoutes);
apiRouter.use('/emails', emailRoutes);
apiRouter.use('/notifications', notificationRoutes);

export default apiRouter;
