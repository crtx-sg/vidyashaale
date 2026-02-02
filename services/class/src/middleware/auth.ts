import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

// Extract user from headers (set by gateway)
export const extractUser = (req: Request, _res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const email = req.headers['x-user-email'] as string;
  const role = req.headers['x-user-role'] as string;

  if (userId && email && role) {
    req.user = { userId, email, role };
  }

  next();
};

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401, 'NOT_AUTHENTICATED'));
  }
  next();
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'NOT_AUTHENTICATED'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Not authorized', 403, 'NOT_AUTHORIZED'));
    }
    next();
  };
};
