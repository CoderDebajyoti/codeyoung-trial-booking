import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { courseService, CourseValidationError } from '../services/course.service.js';

const createCourseSchema = z.object({
  id: z.string().min(2, 'Course ID is required (e.g. "python-ai")'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  category: z.string().min(2, 'Category is required'),
  shortDesc: z.string().min(5, 'Short description is required'),
  ageGroup: z.string().min(2, 'Age group is required'),
  classLevel: z.string().optional(),
  outcomes: z.string().min(2, 'Learning outcomes are required'),
  duration: z.string().default('3 - 6 Months'),
  totalClasses: z.number().int().positive().default(48),
  classDuration: z.number().int().positive().default(60),
  price: z.number().min(0).default(120),
  currency: z.string().default('USD'),
  icon: z.string().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

const updateCourseSchema = z.object({
  title: z.string().min(3).optional(),
  category: z.string().min(2).optional(),
  shortDesc: z.string().min(5).optional(),
  ageGroup: z.string().min(2).optional(),
  classLevel: z.string().optional(),
  outcomes: z.string().min(2).optional(),
  duration: z.string().optional(),
  totalClasses: z.number().int().positive().optional(),
  classDuration: z.number().int().positive().optional(),
  price: z.number().min(0).optional(),
  currency: z.string().optional(),
  icon: z.string().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});

const upsertPackageSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Package name is required'),
  durationMonths: z.number().int().positive(),
  classesCount: z.number().int().positive(),
  price: z.number().min(0),
  currency: z.string().default('USD'),
  discountPct: z.number().min(0).max(100).optional().default(0),
  isActive: z.boolean().default(true),
});

export const getCourses = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const courses = await courseService.getAllCourses(includeInactive);
    res.status(200).json({
      status: 'success',
      data: {
        totalCourses: courses.length,
        courses,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const courseId = req.params.id as string;
    const course = await courseService.getCourseById(courseId);
    if (!course) {
      res.status(404).json({
        status: 'fail',
        message: `Course with ID "${courseId}" not found.`,
      });
      return;
    }
    res.status(200).json({
      status: 'success',
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

export const createCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = createCourseSchema.parse(req.body);
    const course = await courseService.createCourse(validated as any);
    res.status(201).json({
      status: 'success',
      data: course,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        status: 'fail',
        message: error.errors[0]?.message || 'Validation error',
      });
      return;
    }
    if (error instanceof CourseValidationError) {
      res.status(400).json({
        status: 'fail',
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

export const updateCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const courseId = req.params.id as string;
    const validated = updateCourseSchema.parse(req.body);
    const course = await courseService.updateCourse(courseId, validated);
    res.status(200).json({
      status: 'success',
      data: course,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        status: 'fail',
        message: error.errors[0]?.message || 'Validation error',
      });
      return;
    }
    if (error instanceof CourseValidationError) {
      res.status(400).json({
        status: 'fail',
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

export const deleteCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const courseId = req.params.id as string;
    const deleted = await courseService.deleteCourse(courseId);
    res.status(200).json({
      status: 'success',
      message: 'Course deleted successfully.',
      data: deleted,
    });
  } catch (error) {
    if (error instanceof CourseValidationError) {
      res.status(400).json({
        status: 'fail',
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

export const upsertPackage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const courseId = req.params.id as string;
    const validated = upsertPackageSchema.parse(req.body);
    const pkg = await courseService.upsertPackage({
      ...validated,
      courseId,
    });
    res.status(200).json({
      status: 'success',
      data: pkg,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        status: 'fail',
        message: error.errors[0]?.message || 'Validation error',
      });
      return;
    }
    if (error instanceof CourseValidationError) {
      res.status(400).json({
        status: 'fail',
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

export const deletePackage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const packageId = req.params.id as string;
    const deleted = await courseService.deletePackage(packageId);
    res.status(200).json({
      status: 'success',
      message: 'Package deleted successfully.',
      data: deleted,
    });
  } catch (error) {
    next(error);
  }
};
