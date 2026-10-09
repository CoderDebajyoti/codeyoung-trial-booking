import { PrismaClient, Mentor, Prisma } from '@prisma/client';
import { prisma as defaultPrisma, isDbConnected, markDbDisconnected } from '../lib/prisma.js';
import { inMemoryStore } from '../lib/inMemoryStore.js';

export class MentorRepository {
  constructor(private db: PrismaClient = defaultPrisma) {}

  async findAllActive(): Promise<Mentor[]> {
    if (!isDbConnected() && this.db === defaultPrisma) {
      return inMemoryStore.getMentors();
    }
    try {
      return await this.db.mentor.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
    } catch {
      markDbDisconnected();
      return inMemoryStore.getMentors();
    }
  }

  async findById(id: string): Promise<Mentor | null> {
    if (!isDbConnected() && this.db === defaultPrisma) {
      return inMemoryStore.getMentorById(id);
    }
    try {
      return await this.db.mentor.findUnique({
        where: { id },
      });
    } catch {
      markDbDisconnected();
      return inMemoryStore.getMentorById(id);
    }
  }

  /**
   * Acquire explicit row-level locks on candidate mentors in sorted ID order to prevent race conditions / deadlocks.
   */
  async lockMentorsByIds(tx: Prisma.TransactionClient, mentorIds: string[]): Promise<Mentor[]> {
    if (mentorIds.length === 0) return [];
    
    try {
      const sortedIds = [...mentorIds].sort();
      const query = `
        SELECT * FROM "mentors" 
        WHERE "id" = ANY($1::text[]) 
        ORDER BY "id" ASC 
        FOR UPDATE
      `;
      const lockedMentors = await tx.$queryRawUnsafe<Mentor[]>(query, sortedIds);
      return lockedMentors;
    } catch {
      return mentorIds.map((id) => inMemoryStore.getMentorById(id)).filter(Boolean) as Mentor[];
    }
  }
}

export const mentorRepository = new MentorRepository();
