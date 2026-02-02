import { Router, Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import * as classService from '../services/classService';
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

// Get classes (filtered by date range)
router.get(
  '/',
  requireAuth,
  [
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const classes = await classService.getClasses(
        req.user!.userId,
        req.user!.role,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: { classes },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get single class
router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classRecord = await classService.getClassById(req.params.id);

    res.json({
      success: true,
      data: { class: classRecord },
    });
  } catch (error) {
    next(error);
  }
});

// Create class (educators only)
router.post(
  '/',
  requireAuth,
  requireRole('educator', 'admin'),
  [
    body('name').trim().notEmpty().withMessage('Class name is required'),
    body('topic').optional().trim(),
    body('description').optional().trim(),
    body('startTime').isISO8601().withMessage('Valid start time is required'),
    body('durationMinutes').isInt({ min: 1 }).withMessage('Duration must be a positive number'),
    body('recurrence').optional().isIn(['daily', 'weekly', 'custom', null]),
    body('recurrencePattern').optional().isObject(),
    body('recurrenceEndDate').optional().isISO8601(),
    body('meetingLink').optional().isURL(),
    body('meetingPassword').optional().trim(),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const classRecord = await classService.createClass(req.user!.userId, {
        name: req.body.name,
        topic: req.body.topic,
        description: req.body.description,
        startTime: new Date(req.body.startTime),
        durationMinutes: req.body.durationMinutes,
        recurrence: req.body.recurrence,
        recurrencePattern: req.body.recurrencePattern,
        recurrenceEndDate: req.body.recurrenceEndDate ? new Date(req.body.recurrenceEndDate) : undefined,
        meetingLink: req.body.meetingLink,
        meetingPassword: req.body.meetingPassword,
      });

      res.status(201).json({
        success: true,
        data: { class: classRecord },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update class
router.put(
  '/:id',
  requireAuth,
  requireRole('educator', 'admin'),
  [
    body('name').optional().trim().notEmpty(),
    body('topic').optional().trim(),
    body('description').optional().trim(),
    body('startTime').optional().isISO8601(),
    body('durationMinutes').optional().isInt({ min: 1 }),
    body('meetingLink').optional().isURL(),
    body('meetingPassword').optional().trim(),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const classRecord = await classService.updateClass(
        req.params.id,
        req.user!.userId,
        req.body
      );

      res.json({
        success: true,
        data: { class: classRecord },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete class
router.delete(
  '/:id',
  requireAuth,
  requireRole('educator', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await classService.deleteClass(req.params.id, req.user!.userId);

      res.json({
        success: true,
        message: 'Class deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as classRouter };
