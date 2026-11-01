import { Request, Response, NextFunction } from 'express';
import { getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

declare global {
  namespace Express {
    interface Request {
      user?: { uid: string; email: string; email_verified?: boolean; role?: string };
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const match = req.headers.authorization?.match(/^Bearer (\S+)$/);
  if (!match) return res.status(401).json({ status: 'error', message: 'Authentication required' });
  // Configuration failures must never turn authentication into an allow-all mode.
  if (getApps().length === 0) {
    return res.status(503).json({ status: 'error', message: 'Authentication service unavailable' });
  }
  try {
    // Always verify signature, issuer, audience and expiry using the Admin SDK.
    const decoded = await getAuth().verifyIdToken(match[1]);
    if (decoded.email && decoded.email_verified !== true) {
      return res.status(403).json({ status: 'error', message: 'Please verify your email before using Aumoha' });
    }
    req.user = {
      uid: decoded.uid,
      email: decoded.email || '',
      email_verified: decoded.email_verified === true,
      role: decoded.admin === true || decoded.role === 'admin' ? 'admin' : undefined,
    };
    return next();
  } catch {
    return res.status(401).json({ status: 'error', message: 'Invalid or expired authentication token' });
  }
}
