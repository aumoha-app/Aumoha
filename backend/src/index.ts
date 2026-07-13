import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { initializeApp, cert } from 'firebase-admin/app';
import { authMiddleware } from './middleware/authMiddleware';
import { adminMiddleware } from './middleware/adminMiddleware';
import User from './models/userModel';
import Product from './models/productModel';
import SosReport from './models/sosModel';
import Settings from './models/settingsModel';
import { v2 as cloudinary } from 'cloudinary';

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

// Initialize Cloudinary if variables are provided
const cloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('☁️ Cloudinary SDK configured successfully');
} else {
  console.warn('⚠️ Cloudinary configuration missing. Running in local image fallback mode.');
}

// Initialize MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is missing.');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('🍃 MongoDB connected successfully');
  })
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

    // Silently default role if missing (for existing users)
    if (!dbUser.role) {
      dbUser.role = 'normal';
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

    const { fullName, phone, address, profilePic, role } = req.body;

    if (!fullName || !phone || !address) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Missing required profile fields (fullName, phone, address)' 
      });
    }

    let profilePicUrl = profilePic || '';

    // If Cloudinary is configured and the profile picture is a base64 string
    if (profilePic && cloudinaryConfigured && (profilePic.startsWith('data:') || !profilePic.startsWith('http'))) {
      try {
        console.log('📤 Uploading profile picture to Cloudinary...');
        const uploadResponse = await cloudinary.uploader.upload(profilePic, {
          folder: 'aumoha_profiles',
        });
        profilePicUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error('❌ Failed to upload profile picture to Cloudinary:', uploadError);
        // Fallback to storing raw base64 or empty string if it fails
      }
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
        profilePic: profilePicUrl,
        role: role || 'normal'
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

/**
 * POST /api/auth/profile/pets
 * Adds a new pet to the user's profile, or updates an existing pet if _id is provided
 */
app.post('/api/auth/profile/pets', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userUid = req.user?.uid;
    if (!userUid) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const { _id, name, type, photo, breed, age, gender, notes } = req.body;

    if (!name || !type) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Missing required pet fields (name, type)' 
      });
    }

    let photoUrl = photo || '';

    // If Cloudinary is configured and the pet photo is a base64 string
    if (photo && cloudinaryConfigured && (photo.startsWith('data:') || !photo.startsWith('http'))) {
      try {
        console.log('📤 Uploading pet photo to Cloudinary...');
        const uploadResponse = await cloudinary.uploader.upload(photo, {
          folder: 'aumoha_pets',
        });
        photoUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error('❌ Failed to upload pet photo to Cloudinary:', uploadError);
        // Fallback to storing raw base64 or empty string
      }
    }

    const dbUser = await User.findOne({ firebaseUid: userUid });
    if (!dbUser) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    if (_id) {
      // Find pet and update
      const pet = dbUser.pets.find((p: any) => p._id.toString() === _id.toString());
      if (!pet) {
        return res.status(404).json({ status: 'error', message: 'Pet not found' });
      }
      pet.name = name;
      pet.type = type;
      pet.photo = photoUrl;
      pet.breed = breed || '';
      pet.age = age !== undefined && age !== null && age !== '' ? Number(age) : undefined;
      pet.gender = gender || 'unknown';
      pet.notes = notes || '';
    } else {
      // Push new pet
      dbUser.pets.push({
        name,
        type,
        photo: photoUrl,
        breed: breed || '',
        age: age !== undefined && age !== null && age !== '' ? Number(age) : undefined,
        gender: gender || 'unknown',
        notes: notes || '',
      } as any);
    }

    await dbUser.save();

    // Update in-memory user cache
    userCache.set(userUid, dbUser);

    return res.json({
      status: 'success',
      message: _id ? 'Pet updated successfully' : 'Pet added successfully',
      user: dbUser
    });
  } catch (error) {
    console.error('Error in POST /api/auth/profile/pets:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * DELETE /api/auth/profile/pets/:petId
 * Deletes a pet from the user's profile by petId
 */
app.delete('/api/auth/profile/pets/:petId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userUid = req.user?.uid;
    if (!userUid) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const { petId } = req.params;

    const dbUser = await User.findOne({ firebaseUid: userUid });
    if (!dbUser) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const petExists = dbUser.pets.some((p: any) => p._id.toString() === petId);
    if (!petExists) {
      return res.status(404).json({ status: 'error', message: 'Pet not found' });
    }

    (dbUser.pets as any).pull(petId);
    await dbUser.save();

    // Update in-memory user cache
    userCache.set(userUid, dbUser);

    return res.json({
      status: 'success',
      message: 'Pet deleted successfully',
      user: dbUser
    });
  } catch (error) {
    console.error('Error in DELETE /api/auth/profile/pets/:petId:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * GET /api/users/rescuers
 * Retrieves all registered users with the 'rescuer' role
 */
app.get('/api/users/rescuers', authMiddleware, async (req: Request, res: Response) => {
  try {
    const rescuers = await User.find({ role: 'rescuer' }).select('fullName phone profilePic address');
    return res.json({
      status: 'success',
      rescuers
    });
  } catch (error) {
    console.error('Error in GET /api/users/rescuers:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * GET /api/auth/admin-config
 * Checks if the current authenticated user's email is in the admin whitelist
 */
app.get('/api/auth/admin-config', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userEmail = req.user?.email?.toLowerCase();
    const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
    const adminEmails = adminEmailsEnv
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(Boolean);

    const isAdmin = !!(userEmail && adminEmails.includes(userEmail));
    return res.json({
      status: 'success',
      isAdmin
    });
  } catch (error) {
    console.error('Error in /api/auth/admin-config:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * POST /api/auth/verify-admin
 * Verifies if the admin password is valid for double-lock protection
 */
app.post('/api/auth/verify-admin', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const userEmail = req.user?.email?.toLowerCase();
    const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
    const adminEmails = adminEmailsEnv
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(Boolean);

    if (!userEmail || !adminEmails.includes(userEmail)) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: You do not have admin access'
      });
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return res.json({
        status: 'success',
        message: 'Admin access verified (No password set on server)'
      });
    }

    if (password === adminPassword) {
      return res.json({
        status: 'success',
        message: 'Admin access verified successfully'
      });
    } else {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid admin password'
      });
    }
  } catch (error) {
    console.error('Error in /api/auth/verify-admin:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * GET /api/products
 * Public endpoint to fetch all products from MongoDB
 */
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.json({
      status: 'success',
      products
    });
  } catch (error) {
    console.error('Error in GET /api/products:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * POST /api/products
 * Admin endpoint to create a new product
 */
app.post('/api/products', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { category, title, description, price, originalPrice, discountBadge, image } = req.body;

    if (!category || !title || !description || !price || !image) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required product fields (category, title, description, price, image)'
      });
    }

    let imageUrl = '';

    // If Cloudinary is configured and the image is a base64 string
    if (cloudinaryConfigured && (image.startsWith('data:') || !image.startsWith('http'))) {
      console.log('📤 Uploading new product image to Cloudinary...');
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: 'aumoha_marketplace',
      });
      imageUrl = uploadResponse.secure_url;
    } else {
      imageUrl = image; // Use raw URL or base64 fallback
    }

    const newProduct = await Product.create({
      category,
      title,
      description,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      discountBadge: discountBadge || '',
      imageUrl
    });

    return res.json({
      status: 'success',
      message: 'Product created successfully',
      product: newProduct
    });
  } catch (error) {
    console.error('Error in POST /api/products:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * PUT /api/products/:id
 * Admin endpoint to update an existing product
 */
app.put('/api/products/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { category, title, description, price, originalPrice, discountBadge, image } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    let imageUrl = product.imageUrl;

    if (image && image !== product.imageUrl) {
      if (cloudinaryConfigured && (image.startsWith('data:') || !image.startsWith('http'))) {
        console.log('📤 Uploading updated product image to Cloudinary...');
        const uploadResponse = await cloudinary.uploader.upload(image, {
          folder: 'aumoha_marketplace',
        });
        imageUrl = uploadResponse.secure_url;
      } else {
        imageUrl = image;
      }
    }

    product.category = category || product.category;
    product.title = title || product.title;
    product.description = description || product.description;
    product.price = price !== undefined ? Number(price) : product.price;
    product.originalPrice = originalPrice !== undefined ? (originalPrice ? Number(originalPrice) : null) : product.originalPrice;
    product.discountBadge = discountBadge !== undefined ? discountBadge : product.discountBadge;
    product.imageUrl = imageUrl;

    await product.save();

    return res.json({
      status: 'success',
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Error in PUT /api/products/:id:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * DELETE /api/products/:id
 * Admin endpoint to delete a product
 */
app.delete('/api/products/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    return res.json({
      status: 'success',
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/products/:id:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * POST /api/sos
 * Public/authenticated endpoint to submit a new emergency SOS report
 */
app.post('/api/sos', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { category, severity, location, reason, photo, audio } = req.body;
    const userEmail = req.user?.email || 'anonymous@aumoha.com';
    const userUid = req.user?.uid;

    if (!category || !severity || !reason) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required SOS report fields (category, severity, reason)'
      });
    }

    let userPhone = '';
    if (userUid) {
      // Lookup profile phone details dynamically to populate call metrics
      const dbUser = await User.findOne({ firebaseUid: userUid });
      if (dbUser) {
        userPhone = dbUser.phone || '';
      }
    }

    // 1. Upload photo to Cloudinary if provided
    let photoUrl = '';
    if (photo && cloudinaryConfigured && (photo.startsWith('data:') || !photo.startsWith('http'))) {
      try {
        console.log('📤 Uploading SOS photo to Cloudinary...');
        const uploadResponse = await cloudinary.uploader.upload(photo, {
          folder: 'aumoha_sos',
        });
        photoUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error('❌ Failed to upload SOS photo to Cloudinary:', uploadError);
      }
    }

    // 2. Upload audio/voice note to Cloudinary if provided
    let audioUrl = '';
    if (audio && cloudinaryConfigured && (audio.startsWith('data:') || !audio.startsWith('http'))) {
      try {
        console.log('📤 Uploading SOS voice note to Cloudinary...');
        const uploadResponse = await cloudinary.uploader.upload(audio, {
          folder: 'aumoha_sos_audio',
          resource_type: 'video' // Required for audio files in Cloudinary
        });
        audioUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error('❌ Failed to upload SOS voice note to Cloudinary:', uploadError);
      }
    }

    const newReport = await SosReport.create({
      userEmail,
      userPhone,
      category,
      severity,
      location: location || 'Current Location',
      reason,
      photo: photoUrl || photo || '',
      audio: audioUrl || audio || '',
      status: 'active'
    });

    console.log(`🚨 New SOS Emergency Alert received: [${severity.toUpperCase()}] ${category} by ${userEmail}`);

    return res.json({
      status: 'success',
      message: 'Emergency SOS alert broadcast successfully',
      report: newReport
    });
  } catch (error) {
    console.error('Error in POST /api/sos:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * GET /api/sos/my
 * User endpoint to retrieve their own SOS reports from MongoDB
 */
app.get('/api/sos/my', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
    const reports = await SosReport.find({ userEmail }).sort({ createdAt: -1 });
    return res.json({ status: 'success', reports });
  } catch (error) {
    console.error('Error in GET /api/sos/my:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * DELETE /api/sos/my/:id
 * User endpoint to delete their own SOS report from MongoDB
 */
app.delete('/api/sos/my/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const report = await SosReport.findById(id);
    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Emergency report not found'
      });
    }

    // Verify ownership
    if (report.userEmail !== userEmail) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: You do not have permission to delete this report'
      });
    }

    await SosReport.findByIdAndDelete(id);

    return res.json({
      status: 'success',
      message: 'Emergency report deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/sos/my/:id:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * GET /api/sos
 * Admin endpoint to retrieve all SOS reports from MongoDB
 */
app.get('/api/sos', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const reports = await SosReport.find().sort({ createdAt: -1 });
    return res.json({
      status: 'success',
      reports
    });
  } catch (error) {
    console.error('Error in GET /api/sos:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * PUT /api/sos/:id
 * Admin endpoint to update the status of an SOS report
 */
app.put('/api/sos/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'dispatched', 'resolved'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status update. Must be active, dispatched, or resolved'
      });
    }

    const report = await SosReport.findById(id);
    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'SOS Report not found'
      });
    }

    report.status = status;
    await report.save();

    return res.json({
      status: 'success',
      message: 'SOS Report status updated successfully',
      report
    });
  } catch (error) {
    console.error('Error in PUT /api/sos/:id:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * DELETE /api/sos/:id
 * Admin endpoint to delete an SOS report
 */
app.delete('/api/sos/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedReport = await SosReport.findByIdAndDelete(id);

    if (!deletedReport) {
      return res.status(404).json({
        status: 'error',
        message: 'SOS Report not found'
      });
    }

    return res.json({
      status: 'success',
      message: 'SOS Report deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/sos/:id:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * GET /api/settings/checkout-phone
 * Public endpoint to fetch configured country code and phone number for checkout
 */
app.get('/api/settings/checkout-phone', async (req: Request, res: Response) => {
  try {
    const setting = await Settings.findOne({ key: 'marketplace_checkout_phone' });
    if (!setting) {
      return res.json({
        status: 'success',
        countryCode: '',
        phoneNumber: ''
      });
    }
    return res.json({
      status: 'success',
      countryCode: setting.value.countryCode || '',
      phoneNumber: setting.value.phoneNumber || ''
    });
  } catch (error) {
    console.error('Error in GET /api/settings/checkout-phone:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * POST /api/settings/checkout-phone
 * Admin-locked endpoint to update configured country code and phone number for checkout
 */
app.post('/api/settings/checkout-phone', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { countryCode, phoneNumber } = req.body;

    // Validate inputs
    if (!countryCode || !phoneNumber) {
      return res.status(400).json({
        status: 'error',
        message: 'Country code and phone number are required.'
      });
    }

    if (!/^\+\d+$/.test(countryCode)) {
      return res.status(400).json({
        status: 'error',
        message: 'Country code must start with "+" followed by digits (e.g. +91).'
      });
    }

    if (!/^\d+$/.test(phoneNumber)) {
      return res.status(400).json({
        status: 'error',
        message: 'Phone number must contain only digits.'
      });
    }

    const updatedSetting = await Settings.findOneAndUpdate(
      { key: 'marketplace_checkout_phone' },
      { value: { countryCode, phoneNumber } },
      { upsert: true, new: true }
    );

    return res.json({
      status: 'success',
      message: 'WhatsApp checkout settings updated successfully.',
      setting: updatedSetting.value
    });
  } catch (error) {
    console.error('Error in POST /api/settings/checkout-phone:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Aumoha Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 Health-check API endpoint active at http://localhost:${PORT}/health`);
});


