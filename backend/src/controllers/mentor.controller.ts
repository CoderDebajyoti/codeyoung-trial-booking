import { Request, Response, NextFunction } from 'express';
import { mentorService } from '../services/mentor.service.js';
import { parseWorkDays } from '../lib/dateUtils.js';

export const getMentors = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const mentors = await mentorService.getActiveMentors();
    res.status(200).json({
      status: 'success',
      data: {
        totalMentors: mentors.length,
        mentors: mentors.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          timeZone: m.timeZone,
          workDays: parseWorkDays(m.workDays),
          workStartHour: m.workStartHour,
          workEndHour: m.workEndHour,
        })),
      },
    });

  } catch (error) {
    next(error);
  }
};

export const getMentorSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const mentorId = req.params.id;
    const dateQuery = req.query.date as string;

    if (!mentorId) {
      res.status(400).json({ status: 'fail', message: 'Mentor ID is required' });
      return;
    }

    if (!dateQuery) {
      res.status(400).json({ status: 'fail', message: 'Query parameter date (YYYY-MM-DD) is required' });
      return;
    }

    const schedule = await mentorService.getMentorSchedule(mentorId, dateQuery);
    res.status(200).json({
      status: 'success',
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};
