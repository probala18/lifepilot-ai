import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SESSION_COOKIE = 'lp_session';

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || 'dev-only-secret-not-for-production';
}

export const DEFAULT_USER = {
  sub: 'local_user',
  email: 'user@lifepilot.local',
  name: 'LifePilot User',
  picture: '',
};

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = (req as any).cookies?.[SESSION_COOKIE];
  if (token) {
    try {
      const user = jwt.verify(token, getSessionSecret());
      (req as any).user = user;
      return next();
    } catch {
      // Fallback to default user
    }
  }
  (req as any).user = DEFAULT_USER;
  next();
}
