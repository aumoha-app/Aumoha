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
import Vet from './models/vetModel';
import Appointment from './models/appointmentModel';
import { sendEmail, generateBookingEmailHtml } from './lib/emailService';
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

// Fallback data structure for offline MongoDB resilience
export const fallbackVets: any[] = [
  {
    _id: 'vet1',
    name: 'Dr. Ananya Patra',
    photo: '/warden-2.png',
    specialisation: 'Small Animal & Surgery',
    experience: 8,
    fee: 400,
    bio: 'Specialist in feline medicine, soft tissue surgery, and companion animal practice.',
    rating: 4.9,
    reviewCount: 128,
    isOnline: true,
    availableSlots: [
      { _id: 'slot1', date: 'Today', time: '9:00 AM', isBooked: false },
      { _id: 'slot2', date: 'Today', time: '11:00 AM', isBooked: false },
      { _id: 'slot3', date: 'Today', time: '2:00 PM', isBooked: false },
      { _id: 'slot4', date: 'Today', time: '4:30 PM', isBooked: false },
      { _id: 'slot5', date: 'Tomorrow', time: '9:00 AM', isBooked: false },
      { _id: 'slot6', date: 'Tomorrow', time: '11:00 AM', isBooked: false }
    ]
  },
  {
    _id: 'vet2',
    name: 'Dr. Rohit Nanda',
    photo: '/warden-1.png',
    specialisation: 'Dermatology & Oncology',
    experience: 12,
    fee: 600,
    bio: 'Focused on chronic skin conditions, allergies, and oncological diagnostic support.',
    rating: 4.6,
    reviewCount: 96,
    isOnline: true,
    availableSlots: [
      { _id: 'slot7', date: 'Today', time: '10:30 AM', isBooked: false },
      { _id: 'slot8', date: 'Today', time: '1:00 PM', isBooked: false },
      { _id: 'slot9', date: 'Today', time: '3:30 PM', isBooked: false },
      { _id: 'slot10', date: 'Tomorrow', time: '10:30 AM', isBooked: false },
      { _id: 'slot11', date: 'Tomorrow', time: '1:00 PM', isBooked: false }
    ]
  },
  {
    _id: 'vet3',
    name: 'Dr. Meera Iyer',
    photo: '/sairaj_avatar.png',
    specialisation: 'Internal Medicine',
    experience: 10,
    fee: 500,
    bio: 'Internal pathology expert. Comprehensive healthcare management for senior pets.',
    rating: 4.6,
    reviewCount: 110,
    isOnline: false,
    availableSlots: [
      { _id: 'slot12', date: 'Tomorrow', time: '9:30 AM', isBooked: false },
      { _id: 'slot13', date: 'Tomorrow', time: '12:00 PM', isBooked: false },
      { _id: 'slot14', date: 'Tomorrow', time: '3:00 PM', isBooked: false },
      { _id: 'slot15', date: 'Tomorrow', time: '5:30 PM', isBooked: false }
    ]
  },
  {
    _id: 'vet4',
    name: 'Dr. Sima Rath',
    photo: '/warden-3.png',
    specialisation: 'Exotic & Wildlife',
    experience: 7,
    fee: 500,
    bio: 'Passionate about reptiles, birds, pocket pets, and native wildlife rehabilitation.',
    rating: 4.7,
    reviewCount: 74,
    isOnline: true,
    availableSlots: [
      { _id: 'slot16', date: 'Today', time: '12:00 PM', isBooked: false },
      { _id: 'slot17', date: 'Today', time: '4:00 PM', isBooked: false },
      { _id: 'slot18', date: 'Tomorrow', time: '10:00 AM', isBooked: false },
      { _id: 'slot19', date: 'Tomorrow', time: '2:00 PM', isBooked: false }
    ]
  }
];

export const fallbackAppointments: any[] = [];

async function seedVets() {
  try {
    const Vet = mongoose.models.Vet || mongoose.model('Vet');
    const count = await Vet.countDocuments();
    if (count > 0) return;

    console.log('🌱 Seeding initial vet data...');
    // Make sure we strip client-only mock IDs when inserting to MDB
    const dbVets = fallbackVets.map((v: any) => {
      const { _id, availableSlots, ...rest } = v;
      return {
        ...rest,
        availableSlots: availableSlots.map((s: any) => {
          const { _id, ...slotRest } = s;
          return slotRest;
        })
      };
    });
    await Vet.insertMany(dbVets);
    console.log('✅ Seeding completed!');
  } catch (error) {
    console.error('❌ Failed to seed vet data:', error);
  }
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('🍃 MongoDB connected successfully');
    seedVets();
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
const fallbackSosReports: any[] = [];

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
    let rescuers = [];
    if (mongoose.connection.readyState === 1) {
      rescuers = await User.find({ role: 'rescuer' }).select('fullName phone profilePic address');
    }
    return res.json({
      status: 'success',
      rescuers
    });
  } catch (error) {
    console.error('Error in GET /api/users/rescuers:', error);
    return res.json({
      status: 'success',
      rescuers: []
    });
  }
});

/**
 * GET /api/users
 * Retrieves all registered users in the database for community view
 */
app.get('/api/users', authMiddleware, async (req: Request, res: Response) => {
  try {
    let users = [];
    if (mongoose.connection.readyState === 1) {
      users = await User.find().select('fullName phone profilePic address role createdAt');
    }
    return res.json({
      status: 'success',
      users
    });
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return res.json({
      status: 'success',
      users: []
    });
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
    let products = [];
    if (mongoose.connection.readyState === 1) {
      products = await Product.find().sort({ createdAt: -1 });
    }
    return res.json({
      status: 'success',
      products
    });
  } catch (error) {
    console.error('Error in GET /api/products:', error);
    return res.json({
      status: 'success',
      products: []
    });
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
      if (mongoose.connection.readyState === 1) {
        const dbUser = await User.findOne({ firebaseUid: userUid });
        if (dbUser) {
          userPhone = dbUser.phone || '';
        }
      } else {
        const cachedUser = userCache.get(userUid);
        if (cachedUser) {
          userPhone = cachedUser.phone || '';
        }
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

    let newReport;
    if (mongoose.connection.readyState === 1) {
      newReport = await SosReport.create({
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
    } else {
      newReport = {
        _id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userEmail,
        userPhone,
        category,
        severity,
        location: location || 'Current Location',
        reason,
        photo: photoUrl || photo || '',
        audio: audioUrl || audio || '',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      fallbackSosReports.push(newReport);
    }

    console.log(`🚨 New SOS Emergency Alert received: [${severity.toUpperCase()}] ${category} by ${userEmail} (Mode: ${mongoose.connection.readyState === 1 ? 'MDB' : 'Fallback-Memory'})`);

    return res.json({
      status: 'success',
      message: 'Emergency SOS alert broadcast successfully',
      report: newReport
    });
  } catch (error) {
    console.error('Error in POST /api/sos:', error);
    const { category, severity, location, reason, photo, audio } = req.body;
    const userEmail = req.user?.email || 'anonymous@aumoha.com';
    const fallbackReport = {
      _id: `fallback_${Date.now()}`,
      userEmail,
      userPhone: '',
      category: category || 'general',
      severity: severity || 'low',
      location: location || 'Current Location',
      reason: reason || 'Unknown emergency',
      photo: photo || '',
      audio: audio || '',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    fallbackSosReports.push(fallbackReport);
    return res.json({
      status: 'success',
      message: 'Emergency SOS alert saved locally in server memory',
      report: fallbackReport
    });
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
    let reports = [];
    if (mongoose.connection.readyState === 1) {
      reports = await SosReport.find({ userEmail }).sort({ createdAt: -1 });
    }
    const myFallbacks = fallbackSosReports.filter(r => r.userEmail === userEmail);
    const merged = [...myFallbacks, ...reports];
    return res.json({ status: 'success', reports: merged });
  } catch (error) {
    console.error('Error in GET /api/sos/my:', error);
    const userEmail = req.user?.email || 'anonymous@aumoha.com';
    return res.json({ 
      status: 'success', 
      reports: fallbackSosReports.filter(r => r.userEmail === userEmail) 
    });
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
 * GET /api/sos/active
 * Retrieves all active/dispatched SOS reports for community view
 */
app.get('/api/sos/active', authMiddleware, async (req: Request, res: Response) => {
  try {
    let reports = [];
    if (mongoose.connection.readyState === 1) {
      reports = await SosReport.find({ status: { $in: ['active', 'dispatched'] } }).sort({ createdAt: -1 });
    }
    const activeFallbacks = fallbackSosReports.filter(r => ['active', 'dispatched'].includes(r.status));
    const merged = [...activeFallbacks, ...reports];
    return res.json({
      status: 'success',
      reports: merged
    });
  } catch (error) {
    console.error('Error in GET /api/sos/active:', error);
    return res.json({
      status: 'success',
      reports: fallbackSosReports.filter(r => ['active', 'dispatched'].includes(r.status))
    });
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
    let setting = null;
    if (mongoose.connection.readyState === 1) {
      setting = await Settings.findOne({ key: 'marketplace_checkout_phone' });
    }
    if (!setting) {
      return res.json({
        status: 'success',
        countryCode: '+91',
        phoneNumber: '9876543210'
      });
    }
    return res.json({
      status: 'success',
      countryCode: setting.value.countryCode || '+91',
      phoneNumber: setting.value.phoneNumber || '9876543210'
    });
  } catch (error) {
    console.error('Error in GET /api/settings/checkout-phone:', error);
    return res.json({
      status: 'success',
      countryCode: '+91',
      phoneNumber: '9876543210'
    });
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

/**
 * GET /api/vets
 * Retrieve the directory of all active veterinarians
 */
app.get('/api/vets', async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ status: 'success', vets: fallbackVets });
    }
    const vets = await Vet.find({});
    return res.json({ status: 'success', vets });
  } catch (error) {
    console.error('Error in GET /api/vets:', error);
    return res.json({ status: 'success', vets: fallbackVets });
  }
});

/**
 * POST /api/appointments
 * Register a new vet appointment slot reservation
 */
app.post('/api/appointments', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { vetId, slotId, mode, petName, petId } = req.body;
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
    if (!vetId || !slotId || !petName) {
      return res.status(400).json({ status: 'error', message: 'Missing required booking parameters' });
    }

    const bookingId = `AMC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    let appointmentData: any = null;

    if (mongoose.connection.readyState !== 1) {
      const vet = fallbackVets.find((v: any) => v._id === vetId);
      if (!vet) {
        return res.status(404).json({ status: 'error', message: 'Vet not found' });
      }
      const slot = vet.availableSlots.find((s: any) => s._id === slotId);
      if (!slot) {
        return res.status(404).json({ status: 'error', message: 'Time slot not found' });
      }
      if (slot.isBooked) {
        return res.status(400).json({ status: 'error', message: 'Time slot is already booked' });
      }
      slot.isBooked = true;
      slot.bookedBy = bookingId;

      appointmentData = {
        _id: `appt_${Date.now()}`,
        userEmail,
        vetId,
        vetName: vet.name,
        vetSpecialisation: vet.specialisation,
        vetPhoto: vet.photo,
        date: slot.date,
        time: slot.time,
        fee: vet.fee,
        mode: mode || 'in-clinic',
        petName,
        petId,
        status: 'confirmed',
        bookingId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      fallbackAppointments.push(appointmentData);
    } else {
      const vet = await Vet.findById(vetId);
      if (!vet) {
        return res.status(404).json({ status: 'error', message: 'Vet not found' });
      }
      const slot = vet.availableSlots.id(slotId);
      if (!slot) {
        return res.status(404).json({ status: 'error', message: 'Time slot not found' });
      }
      if (slot.isBooked) {
        return res.status(400).json({ status: 'error', message: 'Time slot is already booked' });
      }
      slot.isBooked = true;
      slot.bookedBy = bookingId;
      await vet.save();

      appointmentData = await Appointment.create({
        userEmail,
        vetId,
        vetName: vet.name,
        vetSpecialisation: vet.specialisation,
        vetPhoto: vet.photo,
        date: slot.date,
        time: slot.time,
        fee: vet.fee,
        mode: mode || 'in-clinic',
        petName,
        petId,
        status: 'confirmed',
        bookingId
      });
    }

    // Trigger transactional email
    const emailHtml = generateBookingEmailHtml(appointmentData, 'confirm');
    await sendEmail({
      to: userEmail,
      subject: `Aumoha Booking Confirmed: ${appointmentData.vetName} on ${appointmentData.date}`,
      html: emailHtml
    });

    return res.json({ status: 'success', appointment: appointmentData });
  } catch (error) {
    console.error('Error in POST /api/appointments:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * GET /api/appointments
 * Fetch list of current user's appointments
 */
app.get('/api/appointments', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    if (mongoose.connection.readyState !== 1) {
      const userAppts = fallbackAppointments.filter(a => a.userEmail === userEmail);
      return res.json({ status: 'success', appointments: userAppts });
    }

    const appointments = await Appointment.find({ userEmail }).sort({ createdAt: -1 });
    return res.json({ status: 'success', appointments });
  } catch (error) {
    console.error('Error in GET /api/appointments:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * PUT /api/appointments/:id/reschedule
 * Change date/time slot of an existing appointment
 */
app.put('/api/appointments/:id/reschedule', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newSlotId } = req.body;
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    if (mongoose.connection.readyState !== 1) {
      const appt = fallbackAppointments.find((a: any) => a._id === id && a.userEmail === userEmail);
      if (!appt) {
        return res.status(404).json({ status: 'error', message: 'Appointment not found' });
      }

      // Free old slot
      const oldVet = fallbackVets.find((v: any) => v._id === appt.vetId);
      if (oldVet) {
        const oldSlot = oldVet.availableSlots.find((s: any) => s.date === appt.date && s.time === appt.time);
        if (oldSlot) {
          oldSlot.isBooked = false;
          oldSlot.bookedBy = undefined;
        }
      }

      // Reserve new slot
      const newVet = fallbackVets.find((v: any) => v._id === appt.vetId);
      if (!newVet) {
        return res.status(404).json({ status: 'error', message: 'Vet not found' });
      }
      const newSlot = newVet.availableSlots.find((s: any) => s._id === newSlotId);
      if (!newSlot) {
        return res.status(404).json({ status: 'error', message: 'New slot not found' });
      }
      if (newSlot.isBooked) {
        return res.status(400).json({ status: 'error', message: 'New slot is already booked' });
      }
      newSlot.isBooked = true;
      newSlot.bookedBy = appt.bookingId;

      appt.date = newSlot.date;
      appt.time = newSlot.time;
      appt.updatedAt = new Date().toISOString();

      const emailHtml = generateBookingEmailHtml(appt, 'reschedule');
      await sendEmail({
        to: userEmail,
        subject: `Aumoha Booking Rescheduled: ${appt.vetName} on ${appt.date}`,
        html: emailHtml
      });

      return res.json({ status: 'success', appointment: appt });
    }

    const appt = await Appointment.findById(id);
    if (!appt || appt.userEmail !== userEmail) {
      return res.status(404).json({ status: 'error', message: 'Appointment not found' });
    }

    // Free old slot
    const oldVet = await Vet.findById(appt.vetId);
    if (oldVet) {
      const oldSlot = oldVet.availableSlots.find((s: any) => s.date === appt.date && s.time === appt.time);
      if (oldSlot) {
        oldSlot.isBooked = false;
        oldSlot.bookedBy = null;
        await oldVet.save();
      }
    }

    // Reserve new slot
    const newVet = await Vet.findById(appt.vetId);
    if (!newVet) {
      return res.status(404).json({ status: 'error', message: 'Vet not found' });
    }
    const newSlot = newVet.availableSlots.id(newSlotId);
    if (!newSlot) {
      return res.status(404).json({ status: 'error', message: 'New slot not found' });
    }
    if (newSlot.isBooked) {
      return res.status(400).json({ status: 'error', message: 'New slot is already booked' });
    }
    newSlot.isBooked = true;
    newSlot.bookedBy = appt.bookingId;
    await newVet.save();

    appt.date = newSlot.date;
    appt.time = newSlot.time;
    await appt.save();

    const emailHtml = generateBookingEmailHtml(appt, 'reschedule');
    await sendEmail({
      to: userEmail,
      subject: `Aumoha Booking Rescheduled: ${appt.vetName} on ${appt.date}`,
      html: emailHtml
    });

    return res.json({ status: 'success', appointment: appt });
  } catch (error) {
    console.error('Error in PUT /api/appointments/:id/reschedule:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * PUT /api/appointments/:id/cancel
 * Cancel an appointment slot booking
 */
app.put('/api/appointments/:id/cancel', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    if (mongoose.connection.readyState !== 1) {
      const appt = fallbackAppointments.find((a: any) => a._id === id && a.userEmail === userEmail);
      if (!appt) {
        return res.status(404).json({ status: 'error', message: 'Appointment not found' });
      }

      const vet = fallbackVets.find((v: any) => v._id === appt.vetId);
      if (vet) {
        const slot = vet.availableSlots.find((s: any) => s.date === appt.date && s.time === appt.time);
        if (slot) {
          slot.isBooked = false;
          slot.bookedBy = undefined;
        }
      }

      appt.status = 'cancelled';
      appt.updatedAt = new Date().toISOString();

      const emailHtml = generateBookingEmailHtml(appt, 'cancel');
      await sendEmail({
        to: userEmail,
        subject: `Aumoha Booking Cancelled: ${appt.vetName}`,
        html: emailHtml
      });

      return res.json({ status: 'success', appointment: appt });
    }

    const appt = await Appointment.findById(id);
    if (!appt || appt.userEmail !== userEmail) {
      return res.status(404).json({ status: 'error', message: 'Appointment not found' });
    }

    const vet = await Vet.findById(appt.vetId);
    if (vet) {
      const slot = vet.availableSlots.find((s: any) => s.date === appt.date && s.time === appt.time);
      if (slot) {
        slot.isBooked = false;
        slot.bookedBy = null;
        await vet.save();
      }
    }

    appt.status = 'cancelled';
    await appt.save();

    const emailHtml = generateBookingEmailHtml(appt, 'cancel');
    await sendEmail({
      to: userEmail,
      subject: `Aumoha Booking Cancelled: ${appt.vetName}`,
      html: emailHtml
    });

    return res.json({ status: 'success', appointment: appt });
  } catch (error) {
    console.error('Error in PUT /api/appointments/:id/cancel:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * PUT /api/appointments/:id/notes
 * Add/update pet parent notes on a booking
 */
app.put('/api/appointments/:id/notes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    if (mongoose.connection.readyState !== 1) {
      const appt = fallbackAppointments.find((a: any) => a._id === id && a.userEmail === userEmail);
      if (!appt) {
        return res.status(404).json({ status: 'error', message: 'Appointment not found' });
      }
      appt.notes = notes || '';
      appt.updatedAt = new Date().toISOString();
      return res.json({ status: 'success', appointment: appt });
    }

    const appt = await Appointment.findOneAndUpdate(
      { _id: id, userEmail },
      { notes: notes || '' },
      { new: true }
    );
    if (!appt) {
      return res.status(404).json({ status: 'error', message: 'Appointment not found' });
    }

    return res.json({ status: 'success', appointment: appt });
  } catch (error) {
    console.error('Error in PUT /api/appointments/:id/notes:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * POST /api/vets
 * Admin-gated: Register a new vet profile
 */
app.post('/api/vets', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, photo, specialisation, experience, fee, bio, isOnline, availableSlots } = req.body;
    if (!name || !specialisation || !experience || !fee) {
      return res.status(400).json({ status: 'error', message: 'Missing required parameters' });
    }

    if (mongoose.connection.readyState !== 1) {
      const newVet = {
        _id: `vet_${Date.now()}`,
        name,
        photo: photo || '/sairaj_avatar.png',
        specialisation,
        experience: Number(experience),
        fee: Number(fee),
        bio: bio || '',
        rating: 5.0,
        reviewCount: 0,
        isOnline: !!isOnline,
        availableSlots: (availableSlots || []).map((s: any, idx: number) => ({
          _id: `slot_${Date.now()}_${idx}`,
          date: s.date || 'Today',
          time: s.time || '10:00 AM',
          isBooked: false
        }))
      };
      fallbackVets.push(newVet);
      return res.json({ status: 'success', vet: newVet });
    }

    const newVet = await Vet.create({
      name,
      photo: photo || '/sairaj_avatar.png',
      specialisation,
      experience: Number(experience),
      fee: Number(fee),
      bio: bio || '',
      isOnline: !!isOnline,
      availableSlots: (availableSlots || []).map((s: any) => ({
        date: s.date || 'Today',
        time: s.time || '10:00 AM',
        isBooked: false
      }))
    });

    return res.json({ status: 'success', vet: newVet });
  } catch (error) {
    console.error('Error in POST /api/vets:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * PUT /api/vets/:id
 * Admin-gated: Update vet details / available slots
 */
app.put('/api/vets/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, photo, specialisation, experience, fee, bio, isOnline, availableSlots } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const vet = fallbackVets.find(v => v._id === id);
      if (!vet) {
        return res.status(404).json({ status: 'error', message: 'Vet not found' });
      }
      if (name) vet.name = name;
      if (photo) vet.photo = photo;
      if (specialisation) vet.specialisation = specialisation;
      if (experience) vet.experience = Number(experience);
      if (fee) vet.fee = Number(fee);
      if (bio) vet.bio = bio;
      if (isOnline !== undefined) vet.isOnline = !!isOnline;
      if (availableSlots) {
        vet.availableSlots = availableSlots.map((s: any, idx: number) => ({
          _id: s._id || `slot_${Date.now()}_${idx}`,
          date: s.date,
          time: s.time,
          isBooked: !!s.isBooked,
          bookedBy: s.bookedBy
        }));
      }
      return res.json({ status: 'success', vet });
    }

    const vet = await Vet.findById(id);
    if (!vet) {
      return res.status(404).json({ status: 'error', message: 'Vet not found' });
    }
    if (name) vet.name = name;
    if (photo) vet.photo = photo;
    if (specialisation) vet.specialisation = specialisation;
    if (experience) vet.experience = Number(experience);
    if (fee) vet.fee = Number(fee);
    if (bio) vet.bio = bio;
    if (isOnline !== undefined) vet.isOnline = !!isOnline;
    if (availableSlots) {
      vet.availableSlots = availableSlots;
    }
    await vet.save();

    return res.json({ status: 'success', vet });
  } catch (error) {
    console.error('Error in PUT /api/vets/:id:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * DELETE /api/vets/:id
 * Admin-gated: Delete a vet profile
 */
app.delete('/api/vets/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      const idx = fallbackVets.findIndex(v => v._id === id);
      if (idx === -1) {
        return res.status(404).json({ status: 'error', message: 'Vet not found' });
      }
      fallbackVets.splice(idx, 1);
      return res.json({ status: 'success', message: 'Vet deleted successfully' });
    }

    const vet = await Vet.findByIdAndDelete(id);
    if (!vet) {
      return res.status(404).json({ status: 'error', message: 'Vet not found' });
    }

    return res.json({ status: 'success', message: 'Vet deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/vets/:id:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Aumoha Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 Health-check API endpoint active at http://localhost:${PORT}/health`);
});


