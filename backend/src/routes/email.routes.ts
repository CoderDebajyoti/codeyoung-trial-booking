import { Router, Request, Response } from 'express';
import { emailService } from '../services/email.service.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Protected: Only administrators can audit the raw in-memory sent emails
router.get('/recent', authenticate, requireRole(['ADMIN']), (_req: Request, res: Response) => {
  const sentEmails = emailService.getSentEmails();
  res.status(200).json({
    status: 'success',
    data: {
      totalSent: sentEmails.length,
      emails: sentEmails,
    },
  });
});

export default router;
