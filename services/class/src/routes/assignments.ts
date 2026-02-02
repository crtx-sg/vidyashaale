import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import * as assignmentService from '../services/assignmentService';
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

// Get assignments for a class
router.get('/class/:classId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignments = await assignmentService.getAssignmentsByClass(req.params.classId);

    res.json({
      success: true,
      data: { assignments },
    });
  } catch (error) {
    next(error);
  }
});

// Get single assignment
router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignment = await assignmentService.getAssignmentById(req.params.id);

    res.json({
      success: true,
      data: { assignment },
    });
  } catch (error) {
    next(error);
  }
});

// Create assignment (educators only)
router.post(
  '/',
  requireAuth,
  requireRole('educator', 'admin'),
  [
    body('classId').notEmpty().withMessage('Class ID is required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
    body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const assignment = await assignmentService.createAssignment(req.user!.userId, {
        classId: req.body.classId,
        title: req.body.title,
        description: req.body.description,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      });

      res.status(201).json({
        success: true,
        data: { assignment },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update assignment
router.put(
  '/:id',
  requireAuth,
  requireRole('educator', 'admin'),
  [
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('dueDate').optional().isISO8601(),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const assignment = await assignmentService.updateAssignment(
        req.params.id,
        req.user!.userId,
        req.body
      );

      res.json({
        success: true,
        data: { assignment },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete assignment
router.delete(
  '/:id',
  requireAuth,
  requireRole('educator', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await assignmentService.deleteAssignment(req.params.id, req.user!.userId);

      res.json({
        success: true,
        message: 'Assignment deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as assignmentRouter };
