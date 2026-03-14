import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SESSION_COOKIE = 'lp_session';

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || 'dev-only-secret-not-for-production';
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = (req as any).cookies?.[SESSION_COOKIE];
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  try {
    const user = jwt.verify(token, getSessionSecret());
    (req as any).user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}
