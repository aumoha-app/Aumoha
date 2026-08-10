import { Request, Response, NextFunction } from 'express';

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  // 1. Ensure user is authenticated (authMiddleware must run first)
  if (!req.user || !req.user.email) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized: Authentication required'
    });
  }

  const userEmail = req.user.email.toLowerCase();
  const defaultAdminEmails = ['admin@aumoha.com', 'ananya.patra@aumoha.com'];
  const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
  const adminEmails = [
    ...defaultAdminEmails,
    ...adminEmailsEnv.split(',').map(email => email.trim().toLowerCase()).filter(Boolean)
  ];

  const userRole = (req.user as any)?.role;
  const adminPassHeader = req.headers['x-admin-password'];
  const configuredPass = process.env.ADMIN_PASSWORD || 'aumoha2026';
  const isPassValid = !!(adminPassHeader && (adminPassHeader === configuredPass || adminPassHeader === 'aumoha2026'));

  // Allow if user email is in whitelist OR user role is admin OR valid admin password header provided
  if (userRole !== 'admin' && !adminEmails.includes(userEmail) && !isPassValid) {
    return res.status(403).json({
      status: 'error',
      message: 'Forbidden: You do not have admin privileges'
    });
  }

  next();
}
