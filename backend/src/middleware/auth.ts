import { Request, Response, NextFunction } from 'express';
import { verifyUserToken, UserTokenPayload } from '../lib/jwt.js';

declare global {
  namespace Express {
    interface Request {
      user?: UserTokenPayload;
    }
  }
}

/**
 * Validates JWT Bearer token on incoming requests.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]?.trim();
  }

  if (!token) {
    res.status(401).json({
      status: 'fail',
      message: 'Authentication required. Please log in with company credentials.',
    });
    return;
  }

  try {
    const payload = verifyUserToken(token);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({
      status: 'fail',
      message: 'Invalid or expired session. Please log in again.',
    });
  }
};

/**
 * Enforces role-based authorization for protected routes.
 */
export const requireRole = (allowedRoles: Array<'MENTOR' | 'ADMIN'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        status: 'fail',
        message: 'Access forbidden. You do not have permission to access this resource.',
      });
      return;
    }

    next();
  };
};

/**
 * Restricts mentor schedule inspection to the authenticated mentor themselves or an administrator.
 */
export const requireMentorOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      status: 'fail',
      message: 'Authentication required.',
    });
    return;
  }

  if (req.user.role === 'ADMIN') {
    next();
    return;
  }

  const requestedMentorId = req.params.id;
  if (req.user.role === 'MENTOR' && req.user.mentorId === requestedMentorId) {
    next();
    return;
  }

  res.status(403).json({
    status: 'fail',
    message: "Access forbidden. Mentors may only access their own private schedule.",
  });
};
