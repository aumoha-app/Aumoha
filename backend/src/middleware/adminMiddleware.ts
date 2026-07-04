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

  // 2. Validate email against whitelist in ADMIN_EMAILS env variable
  const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
  const adminEmails = adminEmailsEnv
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);

  if (!adminEmails.includes(userEmail)) {
    return res.status(403).json({
      status: 'error',
      message: 'Forbidden: You do not have admin privileges'
    });
  }

  // 3. Verify Admin Password header
  const adminPassword = process.env.ADMIN_PASSWORD;
  const providedPassword = req.headers['x-admin-password'];

  if (!adminPassword) {
    console.warn('⚠️ ADMIN_PASSWORD environment variable is not set. Admin action permitted by email match only.');
    return next();
  }

  if (!providedPassword || providedPassword !== adminPassword) {
    return res.status(403).json({
      status: 'error',
      message: 'Forbidden: Invalid admin password'
    });
  }

  next();
}
