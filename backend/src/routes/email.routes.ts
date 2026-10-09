import { Router, Request, Response } from 'express';
import { emailService } from '../services/email.service.js';

const router = Router();

router.get('/recent', (_req: Request, res: Response) => {
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
