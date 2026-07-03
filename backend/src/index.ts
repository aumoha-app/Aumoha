import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { initializeApp, cert } from 'firebase-admin/app';
import { authMiddleware } from './middleware/authMiddleware';
import User from './models/userModel';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize Firebase Admin (Supports service account cert or public certificate key verification)
const projectId = process.env.FIREBASE_PROJECT_ID || 'aumoha-2a158';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

try {
  if (projectId && clientEmail && privateKey) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    console.log('🔥 Firebase Admin SDK initialized with Service Account Key');
  } else if (projectId) {
    initializeApp({ projectId });
    console.log(`🔥 Firebase Admin SDK initialized for project: ${projectId} (Public Cert verification mode)`);
  } else {
    console.log('⚠️ Firebase project ID missing. Running in Dev-Mock Auth mode.');
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
}

// Initialize MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is missing.');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('🍃 MongoDB connected successfully'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Support base64 image uploads

// In-memory cache for user profile documents to bypass MongoDB Atlas round-trip latency
const userCache = new Map<string, any>();

// Basic welcome route
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'Welcome to Aumoha API Services',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// API sample endpoint for PWA verification
app.get('/api/info', (req: Request, res: Response) => {
  res.json({
    appName: 'Aumoha PWA',
    version: '1.0.0',
    features: [
      'Offline caching',
      'Add to Home Screen',
      'Push notification ready structure',
      'MongoDB Integration',
      'Firebase Authentication'
    ]
  });
});

/**
 * GET /api/auth/me
 * Retrieves current authenticated user profile details from MongoDB
 */
app.get('/api/auth/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userUid = req.user?.uid;
    if (!userUid) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    // 1. Return cached profile instantly if available
    if (userCache.has(userUid)) {
      return res.json({
        status: 'success',
        isNewUser: false,
        user: userCache.get(userUid)
      });
    }

    // 2. Fetch from MongoDB Atlas on cache miss
    const dbUser = await User.findOne({ firebaseUid: userUid });
    if (!dbUser) {
      return res.status(200).json({
        status: 'success',
        isNewUser: true,
        message: 'Auth token verified, profile details required'
      });
    }

    // 3. Cache it in memory for subsequent requests
    userCache.set(userUid, dbUser);

    return res.json({
      status: 'success',
      isNewUser: false,
      user: dbUser
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * POST /api/auth/profile
 * Creates or updates user details in MongoDB
 */
app.post('/api/auth/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userUid = req.user?.uid;
    const userEmail = req.user?.email || req.body.email;
    if (!userUid) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const { fullName, phone, address, profilePic } = req.body;

    if (!fullName || !phone || !address) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Missing required profile fields (fullName, phone, address)' 
      });
    }

    // Upsert user profile details in MongoDB based on firebaseUid
    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: userUid },
      {
        firebaseUid: userUid,
        email: userEmail,
        fullName,
        phone,
        address,
        profilePic: profilePic || ''
      },
      { new: true, upsert: true, runValidators: true }
    );

    // 4. Update in-memory user cache
    userCache.set(userUid, updatedUser);

    return res.json({
      status: 'success',
      message: 'Profile saved successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error in /api/auth/profile:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Aumoha Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 Health-check API endpoint active at http://localhost:${PORT}/health`);
});
