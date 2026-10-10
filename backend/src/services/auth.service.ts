import bcrypt from 'bcryptjs';
import { signUserToken, UserTokenPayload } from '../lib/jwt.js';
import { mentorService } from './mentor.service.js';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: 'MENTOR' | 'ADMIN';
  mentorId?: string;
  passwordHash: string;
}

const DEFAULT_MENTOR_PASSWORD_HASH = bcrypt.hashSync('Mentor@Codeyoung2026!', 10);
const DEFAULT_ADMIN_PASSWORD_HASH = bcrypt.hashSync('Admin@Codeyoung2026!', 10);

export class AuthService {
  private users: UserAccount[] = [
    {
      id: 'admin-1',
      email: 'admin@codeyoung.com',
      name: 'System Administrator',
      role: 'ADMIN',
      passwordHash: DEFAULT_ADMIN_PASSWORD_HASH,
    },
  ];

  constructor() {
    this.initMentorAccounts();
  }

  private async initMentorAccounts() {
    try {
      const mentors = await mentorService.getActiveMentors();
      for (const m of mentors) {
        if (!this.users.find((u) => u.email.toLowerCase() === m.email.toLowerCase())) {
          this.users.push({
            id: `user-${m.id}`,
            email: m.email.toLowerCase(),
            name: m.name,
            role: 'MENTOR',
            mentorId: m.id,
            passwordHash: DEFAULT_MENTOR_PASSWORD_HASH,
          });
        }
      }
    } catch {
      // Mentors will be populated lazily on login if DB connection initializes later
    }
  }

  private async findUserByEmail(email: string): Promise<UserAccount | null> {
    const normalized = email.toLowerCase().trim();
    let user = this.users.find((u) => u.email.toLowerCase() === normalized);
    if (!user) {
      // Check if it's one of the mentors from mentorService
      const mentors = await mentorService.getActiveMentors();
      const mentor = mentors.find((m) => m.email.toLowerCase() === normalized);
      if (mentor) {
        user = {
          id: `user-${mentor.id}`,
          email: mentor.email.toLowerCase(),
          name: mentor.name,
          role: 'MENTOR',
          mentorId: mentor.id,
          passwordHash: DEFAULT_MENTOR_PASSWORD_HASH,
        };
        this.users.push(user);
      }
    }
    return user || null;
  }

  async login(
    email: string,
    candidatePassword: string
  ): Promise<{ token: string; user: Omit<UserAccount, 'passwordHash'> }> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      // Constant-time comparison simulation to prevent timing enumeration attacks
      await bcrypt.compare(candidatePassword, DEFAULT_MENTOR_PASSWORD_HASH);
      throw new Error('Invalid email address or password.');
    }

    const isValid = await bcrypt.compare(candidatePassword, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email address or password.');
    }

    const payload: UserTokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mentorId: user.mentorId,
    };

    const token = signUserToken(payload);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mentorId: user.mentorId,
      },
    };
  }

  async getUserById(id: string): Promise<Omit<UserAccount, 'passwordHash'> | null> {
    const user = this.users.find((u) => u.id === id);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mentorId: user.mentorId,
    };
  }
}

export const authService = new AuthService();
