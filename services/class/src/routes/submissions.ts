import { Router, Request, Response, NextFunction } from 'express';
import * as assignmentService from '../services/assignmentService';
import { extractUser, requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(extractUser);

// Get submissions for an assignment (educators only)
router.get(
  '/assignment/:assignmentId',
  requireAuth,
  requireRole('educator', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const submissions = await assignmentService.getSubmissionsByAssignment(req.params.assignmentId);

      res.json({
        success: true,
        data: { submissions, count: submissions.length },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get my submission for an assignment (students)
router.get(
  '/my/:assignmentId',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const submission = await assignmentService.getStudentSubmission(
        req.params.assignmentId,
        req.user!.userId
      );

      res.json({
        success: true,
        data: { submission },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Submit assignment - actual file upload handled by resource service
// This endpoint is called after file is uploaded to get the storage path
router.post(
  '/',
  requireAuth,
  requireRole('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { assignmentId, storagePath, originalFilename, fileSize } = req.body;

      const submission = await assignmentService.createSubmission(
        assignmentId,
        req.user!.userId,
        storagePath,
        originalFilename,
        fileSize
      );

      res.status(201).json({
        success: true,
        data: { submission },
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as submissionRouter };
