import { Request, Response, NextFunction } from 'express';

export function isAdminUser(user: Request['user']): boolean {
  if (!user) return false;
  // A signed Firebase custom claim can grant admin access. Email grants additionally
  // require verified email ownership and an explicit deployment allowlist.
  if (user.role === 'admin') return true;
  const emails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  return user.email_verified === true && emails.includes(user.email.toLowerCase());
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ status: 'error', message: 'Authentication required' });
  if (!isAdminUser(req.user)) return res.status(403).json({ status: 'error', message: 'Admin access required' });
  return next();
}
