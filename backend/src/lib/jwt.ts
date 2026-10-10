import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface UserTokenPayload {
  userId: string;
  email: string;
  name: string;
  role: 'MENTOR' | 'ADMIN';
  mentorId?: string;
}

export function signUserToken(payload: UserTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}


export function verifyUserToken(token: string): UserTokenPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as UserTokenPayload;
  } catch (err) {
    throw new Error('Invalid or expired authentication token');
  }
}

export function signEmailVerificationToken(email: string): string {
  return jwt.sign({ email: email.toLowerCase().trim(), type: 'EMAIL_VERIFIED' }, env.JWT_SECRET, {
    expiresIn: '30m',
  });
}

export function verifyEmailVerificationToken(token: string, expectedEmail: string): boolean {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { email: string; type: string };
    return (
      payload.type === 'EMAIL_VERIFIED' &&
      payload.email.toLowerCase().trim() === expectedEmail.toLowerCase().trim()
    );
  } catch {
    return false;
  }
}
