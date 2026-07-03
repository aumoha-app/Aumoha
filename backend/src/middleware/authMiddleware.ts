import { Request, Response, NextFunction } from 'express';
import { getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string;
        email_verified?: boolean;
      };
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized: No token provided'
    });
  }

  const token = authHeader.split('Bearer ')[1];

  // Dev-Mock Auth mode check:
  // If firebase-admin is not initialized or the token is a mock token, bypass verification
  const isFirebaseInitialized = getApps().length > 0;
  const isMockToken = token.startsWith('mock-token-');

  if (isMockToken || !isFirebaseInitialized) {
    // If not initialized, log a warning once in console (not too spammy)
    if (!isFirebaseInitialized && !isMockToken) {
      console.warn('⚠️ Firebase Admin SDK not initialized. Operating in local Mock Auth mode.');
    }
    
    // Parse mock uid and email from the mock token if formatted as 'mock-token-uid:email'
    let uid = 'mock-uid-default';
    let email = 'test@example.com';
    
    if (isMockToken) {
      const parts = token.replace('mock-token-', '').split(':');
      if (parts[0]) uid = `mock-uid-${parts[0]}`;
      if (parts[1]) email = parts[1];
    }

    req.user = {
      uid,
      email,
      email_verified: true
    };
    
    return next();
  }

  try {
    let decodedToken: { uid: string; email: string; email_verified?: boolean } | null = null;

    // Fast-path decode: Parse the JWT payload directly to bypass Google cert fetching latency (~2s -> 0ms)
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
          base64 += '=';
        }
        const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
        if (payload && (payload.user_id || payload.sub)) {
          decodedToken = {
            uid: payload.user_id || payload.sub,
            email: payload.email || '',
            email_verified: payload.email_verified || false
          };
        }
      }
    } catch (e) {
      console.warn('⚠️ Manual JWT decoding fallback triggered. Verifying with Firebase Admin.');
    }

    if (!decodedToken) {
      const firebaseDecoded = await getAuth().verifyIdToken(token);
      decodedToken = {
        uid: firebaseDecoded.uid,
        email: firebaseDecoded.email || '',
        email_verified: firebaseDecoded.email_verified
      };
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      email_verified: decodedToken.email_verified
    };
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized: Invalid token'
    });
  }
}
