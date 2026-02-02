import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import * as enrollmentService from '../services/enrollmentService';
import { extractUser, requireAuth, requireRole } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.use(extractUser);

const validate = (req: Request, _res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map(e => e.msg).join(', ');
    return next(new AppError(message, 400, 'VALIDATION_ERROR'));
  }
  next();
};

// Enroll in a class (students only)
router.post(
  '/',
  requireAuth,
  requireRole('student'),
  [body('classId').notEmpty().withMessage('Class ID is required')],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const enrollment = await enrollmentService.enroll(req.body.classId, req.user!.userId);

      res.status(201).json({
        success: true,
        data: { enrollment },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Unenroll from a class
router.delete(
  '/:classId',
  requireAuth,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await enrollmentService.unenroll(req.params.classId, req.user!.userId);

      res.json({
        success: true,
        message: 'Successfully unenrolled from class',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get enrollments for a class (educators only)
router.get(
  '/class/:classId',
  requireAuth,
  requireRole('educator', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const enrollments = await enrollmentService.getEnrollmentsByClass(req.params.classId);

      res.json({
        success: true,
        data: { enrollments, count: enrollments.length },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get my enrollments (students)
router.get('/my', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const enrollments = await enrollmentService.getEnrollmentsByStudent(req.user!.userId);

    res.json({
      success: true,
      data: { enrollments },
    });
  } catch (error) {
    next(error);
  }
});

// Check if enrolled in a class
router.get(
  '/check/:classId',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const enrolled = await enrollmentService.isEnrolled(req.params.classId, req.user!.userId);

      res.json({
        success: true,
        data: { enrolled },
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as enrollmentRouter };
