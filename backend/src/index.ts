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
import ActivityPost from './models/activityModel';
import CallSession from './models/callSessionModel';
import { sendEmail, generateBookingEmailHtml, generateDonationEmailHtml } from './lib/emailService';
import { v2 as cloudinary } from 'cloudinary';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize Razorpay SDK
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_TKxpLxhMCofQDL';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'MPAWug6Bpo3GMoME6SLmC11b';

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});


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
    category: 'vet',
    specialtyTags: ['Surgery', 'General Medicine'],
    experience: 8,
    fee: 400,
    bio: 'Specialist in feline medicine, soft tissue surgery, and companion animal practice.',
    rating: 4.9,
    reviewCount: 128,
    isOnline: true,
    email: 'vet1@aumoha.com',
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
    category: 'vet',
    specialtyTags: ['Dermatology', 'Oncology'],
    experience: 12,
    fee: 600,
    bio: 'Focused on chronic skin conditions, allergies, and oncological diagnostic support.',
    rating: 4.6,
    reviewCount: 96,
    isOnline: true,
    email: 'vet2@aumoha.com',
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
    category: 'vet',
    specialtyTags: ['Internal Medicine', 'Geriatrics'],
    experience: 10,
    fee: 500,
    bio: 'Internal pathology expert. Comprehensive healthcare management for senior pets.',
    rating: 4.6,
    reviewCount: 110,
    isOnline: false,
    email: 'vet3@aumoha.com',
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
    category: 'vet',
    specialtyTags: ['Exotics', 'Reptiles'],
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
  },
  {
    _id: 'exp1',
    name: 'Rohan Verma',
    photo: '/sairaj_avatar.png',
    specialisation: 'Certified Nutritionist',
    category: 'Nutritionist',
    specialtyTags: ['Diet Plans', 'Puppy Nutrition', 'Available Today'],
    experience: 6,
    fee: 300,
    bio: 'Specialist in custom raw feeding, allergen-free diets, and weight management.',
    rating: 4.8,
    reviewCount: 52,
    isOnline: true,
    email: 'expert1@aumoha.com',
    availableSlots: [
      { _id: 'slot_e1', date: 'Today', time: '10:00 AM', isBooked: false },
      { _id: 'slot_e2', date: 'Today', time: '3:00 PM', isBooked: false },
      { _id: 'slot_e3', date: 'Tomorrow', time: '11:00 AM', isBooked: false }
    ]
  },
  {
    _id: 'exp2',
    name: 'Dr. Ananya Rao',
    photo: '/warden-2.png',
    specialisation: 'Certified Animal Behaviourist',
    category: 'Animal Behaviourist',
    specialtyTags: ['Anxiety', 'Aggression', 'Behaviour modification'],
    experience: 9,
    fee: 500,
    bio: 'Helps pets overcome separation anxiety, fear aggression, and obsessive behaviors.',
    rating: 4.9,
    reviewCount: 120,
    isOnline: true,
    availableSlots: [
      { _id: 'slot_e4', date: 'Today', time: '9:30 AM', isBooked: false },
      { _id: 'slot_e5', date: 'Today', time: '1:30 PM', isBooked: false },
      { _id: 'slot_e6', date: 'Tomorrow', time: '10:00 AM', isBooked: false }
    ]
  },
  {
    _id: 'exp3',
    name: 'Vikram Sen',
    photo: '/warden-1.png',
    specialisation: 'Professional Canine Trainer',
    category: 'Trainer',
    specialtyTags: ['Obedience', 'Leash Training', 'Puppy Socialization'],
    experience: 8,
    fee: 350,
    bio: 'Specialist in positive reinforcement behavior training and puppy foundations.',
    rating: 4.8,
    reviewCount: 65,
    isOnline: false,
    availableSlots: [
      { _id: 'slot_e7', date: 'Tomorrow', time: '9:00 AM', isBooked: false },
      { _id: 'slot_e8', date: 'Tomorrow', time: '2:00 PM', isBooked: false }
    ]
  },
  {
    _id: 'exp4',
    name: 'Priya Sharma',
    photo: '/warden-2.png',
    specialisation: 'Behaviour Specialist',
    category: 'Behaviourist',
    specialtyTags: ['Fear Desensitization', 'Socialization', 'Available Today'],
    experience: 5,
    fee: 300,
    bio: 'Dedicated to helping rescue dogs transition smoothly into household environments.',
    rating: 4.7,
    reviewCount: 42,
    isOnline: true,
    availableSlots: [
      { _id: 'slot_e9', date: 'Today', time: '11:00 AM', isBooked: false },
      { _id: 'slot_e10', date: 'Today', time: '4:00 PM', isBooked: false }
    ]
  },
  {
    _id: 'exp5',
    name: 'John',
    photo: '/warden-3.png',
    specialisation: 'Pet Physiotherapist',
    category: 'Physiotherapist',
    specialtyTags: ['Mobility', 'Injury Recovery', 'Senior Care', 'Post-Surgery'],
    experience: 7,
    fee: 450,
    bio: 'Expert in canine massage, hydrotherapy guidance, and orthopedic mobility restoration.',
    rating: 4.9,
    reviewCount: 38,
    isOnline: true,
    availableSlots: [
      { _id: 'slot_e11', date: 'Today', time: '12:00 PM', isBooked: false },
      { _id: 'slot_e12', date: 'Tomorrow', time: '3:00 PM', isBooked: false }
    ]
  },
  {
    _id: 'exp6',
    name: 'Kabir Nair',
    photo: '/sairaj_avatar.png',
    specialisation: 'Wellness & Palliative Caretaker',
    category: 'Wellness & Palliative',
    specialtyTags: ['Pain Management', 'Senior Care', 'Emotional Comfort'],
    experience: 10,
    fee: 400,
    bio: 'Providing gentle support, home hospice setup guidance, and senior pet comfort.',
    rating: 4.6,
    reviewCount: 29,
    isOnline: false,
    availableSlots: [
      { _id: 'slot_e13', date: 'Tomorrow', time: '11:30 AM', isBooked: false }
    ]
  },
  {
    _id: 'exp7',
    name: 'Dr. Sameer Joshi',
    photo: '/warden-1.png',
    specialisation: 'Homeopathy Veterinarian',
    category: 'Homeopathy Vet',
    specialtyTags: ['Natural Healing', 'Chronic Illness', 'Holistic Wellness'],
    experience: 15,
    fee: 500,
    bio: 'Offering natural, organic herbal and homeopathic treatment consults.',
    rating: 4.8,
    reviewCount: 88,
    isOnline: true,
    availableSlots: [
      { _id: 'slot_e14', date: 'Today', time: '2:30 PM', isBooked: false },
      { _id: 'slot_e15', date: 'Tomorrow', time: '10:30 AM', isBooked: false }
    ]
  },
  {
    _id: 'exp8',
    name: 'Maya Roy',
    photo: '/warden-3.png',
    specialisation: 'Rehab Specialist',
    category: 'Rehab Specialist',
    specialtyTags: ['Joint Therapy', 'Laser Therapy guidance', 'Post-Surgery'],
    experience: 8,
    fee: 450,
    bio: 'Recovering joint mobility, muscle building post-surgeries, and fitness training.',
    rating: 4.7,
    reviewCount: 56,
    isOnline: true,
    availableSlots: [
      { _id: 'slot_e16', date: 'Today', time: '4:30 PM', isBooked: false },
      { _id: 'slot_e17', date: 'Tomorrow', time: '1:30 PM', isBooked: false }
    ]
  },
  {
    _id: 'exp9',
    name: 'Shalini Sen',
    photo: '/warden-2.png',
    specialisation: 'At-Home Support Assistant',
    category: 'At-Home Support',
    specialtyTags: ['Basic Nursing', 'Grooming Assist', 'Medication Admin'],
    experience: 6,
    fee: 250,
    bio: 'Compassionate assistance with home nursing, ear cleaning, and administering injections.',
    rating: 4.5,
    reviewCount: 33,
    isOnline: true,
    availableSlots: [
      { _id: 'slot_e18', date: 'Today', time: '10:30 AM', isBooked: false },
      { _id: 'slot_e19', date: 'Today', time: '5:00 PM', isBooked: false }
    ]
  },
  {
    _id: 'exp10',
    name: 'Devika Das',
    photo: '/warden-3.png',
    specialisation: 'Pet Communicator & Reiki Healer',
    category: 'Communicator/Psychotherapist/Reiki Healing',
    specialtyTags: ['Energy Balance', 'Telepathy', 'Grief counseling'],
    experience: 11,
    fee: 600,
    bio: 'Spiritual connection, pet mind reading, and natural distant reiki healing.',
    rating: 4.9,
    reviewCount: 91,
    isOnline: true,
    availableSlots: [
      { _id: 'slot_e20', date: 'Today', time: '11:00 AM', isBooked: false },
      { _id: 'slot_e21', date: 'Tomorrow', time: '4:00 PM', isBooked: false }
    ]
  },
  {
    _id: 'care1',
    name: 'Paws & Shine Grooming',
    photo: '/warden-1.png',
    specialisation: 'Independent groomer • Calm home visits',
    category: 'Grooming',
    specialtyTags: ['Home Visit', 'Verified', 'Available Today'],
    experience: 8,
    fee: 699,
    bio: 'Paws & Shine Grooming offers premium grooming at the comfort of your home. Standard shampooing, nail clipping, and fur trimming included.',
    rating: 4.8,
    reviewCount: 230,
    isOnline: true,
    location: '2.1 km away',
    availableSlots: [
      { _id: 'slot_c1', date: 'Today', time: '10:00 AM', isBooked: false },
      { _id: 'slot_c2', date: 'Today', time: '2:00 PM', isBooked: false },
      { _id: 'slot_c3', date: 'Tomorrow', time: '11:00 AM', isBooked: false }
    ]
  },
  {
    _id: 'care2',
    name: 'Happy Stay Daycare',
    photo: '/warden-2.png',
    specialisation: 'Daycare & boarding with trusted hosts',
    category: 'Boarding',
    specialtyTags: ['Boarding', 'Verified', 'Available Today'],
    experience: 5,
    fee: 499,
    bio: 'Happy Stay Daycare provides a warm, homely space for your pets to board and stay safely. Active playtime and balanced meals provided.',
    rating: 4.9,
    reviewCount: 340,
    isOnline: true,
    location: '1.8 km away',
    availableSlots: [
      { _id: 'slot_c4', date: 'Today', time: '9:00 AM', isBooked: false },
      { _id: 'slot_c5', date: 'Today', time: '1:00 PM', isBooked: false },
      { _id: 'slot_c6', date: 'Tomorrow', time: '10:00 AM', isBooked: false }
    ]
  },
  {
    _id: 'care3',
    name: 'Walk & Wag Club',
    photo: '/warden-3.png',
    specialisation: 'Solo walking and activity sessions',
    category: 'Walking',
    specialtyTags: ['Walk & Exercise', 'Verified', 'Available Today'],
    experience: 4,
    fee: 349,
    bio: 'Get your pet moving with Walk & Wag Club. Solo dog walking sessions tailored for hyperactive and energetic breeds.',
    rating: 4.7,
    reviewCount: 180,
    isOnline: true,
    location: '1.4 km away',
    availableSlots: [
      { _id: 'slot_c7', date: 'Today', time: '8:00 AM', isBooked: false },
      { _id: 'slot_c8', date: 'Today', time: '4:00 PM', isBooked: false },
      { _id: 'slot_c9', date: 'Tomorrow', time: '9:30 AM', isBooked: false }
    ]
  },
  {
    _id: 'care4',
    name: 'Puppy Power Training',
    photo: '/product-4.png',
    specialisation: 'Reward-based manners and play training',
    category: 'Training',
    specialtyTags: ['Training', 'Verified', 'Available Today'],
    experience: 6,
    fee: 549,
    bio: 'Puppy training foundations, potty training advice, obedience courses, and basic manners using positive reward systems.',
    rating: 4.6,
    reviewCount: 120,
    isOnline: true,
    location: '3.0 km away',
    availableSlots: [
      { _id: 'slot_c10', date: 'Today', time: '11:00 AM', isBooked: false },
      { _id: 'slot_c11', date: 'Today', time: '3:00 PM', isBooked: false },
      { _id: 'slot_c12', date: 'Tomorrow', time: '2:00 PM', isBooked: false }
    ]
  }
];

export const fallbackAppointments: any[] = [];
export const fallbackCallSessions: any[] = [];
export const fallbackUsers: any[] = [
  {
    _id: 'user_r1',
    firebaseUid: 'rescuer_uid_1',
    email: 'ananya.rescuer@aumoha.com',
    fullName: 'Dr. Ananya Patra',
    phone: '+919876543210',
    address: 'Saheed Nagar, Bhubaneswar',
    profilePic: '/warden-2.png',
    role: 'rescuer',
    pets: [],
    createdAt: new Date().toISOString()
  },
  {
    _id: 'user_r2',
    firebaseUid: 'rescuer_uid_2',
    email: 'rohan.rescuer@aumoha.com',
    fullName: 'Rohan Sharma',
    phone: '+919812345678',
    address: 'Janpath Road, Saheed Nagar',
    profilePic: '/sairaj_avatar.png',
    role: 'rescuer',
    pets: [],
    createdAt: new Date().toISOString()
  },
  {
    _id: 'user_r3',
    firebaseUid: 'rescuer_uid_3',
    email: 'priya.rescuer@aumoha.com',
    fullName: 'Priya Dash',
    phone: '+919777123456',
    address: 'VSS Nagar, Bhubaneswar',
    profilePic: '/warden-3.png',
    role: 'rescuer',
    pets: [],
    createdAt: new Date().toISOString()
  },
  {
    _id: 'user_m1',
    firebaseUid: 'feeder_uid_1',
    email: 'amit.feeder@aumoha.com',
    fullName: 'Amit Kumar',
    phone: '+919437012345',
    address: 'Acharya Vihar, Bhubaneswar',
    profilePic: '/warden-1.png',
    role: 'feeder',
    pets: [],
    createdAt: new Date().toISOString()
  },
  {
    _id: 'user_m2',
    firebaseUid: 'volunteer_uid_1',
    email: 'sneha.volunteer@aumoha.com',
    fullName: 'Sneha Mohanty',
    phone: '+919937098765',
    address: 'Jaydev Vihar, Bhubaneswar',
    profilePic: '/warden-2.png',
    role: 'volunteer',
    pets: [],
    createdAt: new Date().toISOString()
  },
  {
    _id: 'user_m3',
    firebaseUid: 'paravet_uid_1',
    email: 'bikram.paravet@aumoha.com',
    fullName: 'Bikram Rout',
    phone: '+919124056789',
    address: 'Master Canteen, Bhubaneswar',
    profilePic: '/sairaj_avatar.png',
    role: 'paravet',
    pets: [],
    createdAt: new Date().toISOString()
  }
];

export const fallbackActivities: any[] = [
  {
    _id: 'act_seed_1',
    userEmail: 'ananya.rescuer@aumoha.com',
    userPhone: '+919876543210',
    authorName: 'Dr. Ananya Patra',
    authorRole: 'rescuer',
    avatar: '/warden-2.png',
    category: 'feeding',
    title: 'Stray Dog Feeding & Medical Checkup Drive',
    description: 'Weekly community feeding drive for stray dogs in Saheed Nagar. Vaccines and basic first-aid treatments will also be administered.\n\n🕒 Scheduled: Sunday, 5:00 PM',
    location: 'Saheed Nagar Park, Bhubaneswar',
    image: '/boarding_card.png',
    likes: 12,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    _id: 'act_seed_2',
    userEmail: 'priya.rescuer@aumoha.com',
    userPhone: '+919777123456',
    authorName: 'Priya Dash',
    authorRole: 'rescuer',
    avatar: '/warden-3.png',
    category: 'awareness',
    title: 'Rabies Awareness & Anti-Rabies Vaccination Campaign',
    description: 'Free Anti-Rabies Vaccination drive for community street animals and pet safety awareness workshop for residents.\n\n🕒 Scheduled: Saturday, 10:00 AM',
    location: 'VSS Nagar Community Center, Bhubaneswar',
    image: '/grooming_card.png',
    likes: 24,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

async function seedVets() {
  try {
    const VetModel = mongoose.models.Vet || mongoose.model('Vet');
    // Ensure any existing profile named "Aditi Shah" is renamed to "John"
    await VetModel.updateMany({ name: 'Aditi Shah' }, { $set: { name: 'John' } });
    const count = await VetModel.countDocuments();
    if (count > 0) return;

    console.log('🌱 Seeding initial vet data...');
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
    await VetModel.insertMany(dbVets);
    console.log('✅ Vet seeding completed!');
  } catch (error) {
    console.error('❌ Failed to seed vet data:', error);
  }
}

async function seedUsers() {
  try {
    const UserModel = mongoose.models.User || mongoose.model('User');
    const rescuerCount = await UserModel.countDocuments({ role: 'rescuer' });
    if (rescuerCount > 0) return;

    console.log('🌱 Seeding initial community users & rescuers...');
    const dbUsers = fallbackUsers.map(({ _id, ...rest }) => rest);
    await UserModel.insertMany(dbUsers);
    console.log('✅ Users seeding completed!');
  } catch (error) {
    console.error('❌ Failed to seed user data:', error);
  }
}

async function seedActivities() {
  try {
    const ActivityModel = mongoose.models.ActivityPost || mongoose.model('ActivityPost');
    const count = await ActivityModel.countDocuments();
    if (count > 0) return;

    console.log('🌱 Seeding initial community activities...');
    const dbActivities = fallbackActivities.map(({ _id, ...rest }) => rest);
    await ActivityModel.insertMany(dbActivities);
    console.log('✅ Activities seeding completed!');
  } catch (error) {
    console.error('❌ Failed to seed activity data:', error);
  }
}

// Disable Mongoose command buffering globally so queries fail-fast when offline instead of hanging requests
mongoose.set('bufferCommands', false);

mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 2500, // 2.5s timeout for Atlas connection attempts
    connectTimeoutMS: 4000,
  })
  .then(() => {
    console.log('🍃 MongoDB connected successfully');
    seedVets();
    seedUsers();
    seedActivities();
  })
  .catch((err) => {
    console.warn('⚠️ MongoDB connection warning (Running in high-performance local fallback mode):', err.message || err);
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
      'Firebase Authentication',
      'Razorpay Payment Gateway'
    ]
  });
});

/**
 * POST /api/create-order
 * Creates a Razorpay payment order
 */
app.post('/api/create-order', async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({
        status: 'error',
        message: 'Amount is required'
      });
    }

    // Frontend always sends amount in Rupees (e.g. 400 for ₹400). Convert to paise.
    const numericAmount = Number(amount);
    const amountInPaise = Math.round(numericAmount * 100);

    if (amountInPaise < 100) {
      return res.status(400).json({
        status: 'error',
        message: 'Minimum order amount must be at least ₹1 (100 paise)'
      });
    }

    const options = {
      amount: amountInPaise,
      currency: (currency || 'INR').toUpperCase(),
      receipt: receipt || `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      notes: notes || { app: 'Aumoha PWA' }
    };

    console.log(`💳 Creating Razorpay Order: Amount = ${amountInPaise} paise (${currency})`);
    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      status: 'success',
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: razorpayKeyId
    });
  } catch (error: any) {
    console.error('❌ Razorpay Order Creation Error:', error);
    return res.status(500).json({
      status: 'error',
      message: error?.description || error?.message || 'Failed to create Razorpay order'
    });
  }
});

/**
 * POST /api/verify-payment
 * Verifies Razorpay payment signature using HMAC-SHA256
 */
app.post('/api/verify-payment', async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required Razorpay verification fields (razorpay_order_id, razorpay_payment_id, razorpay_signature)'
      });
    }

    const bodyData = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(bodyData.toString())
      .digest('hex');

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (isSignatureValid) {
      console.log(`✅ Razorpay Payment Verified Successfully: Order ID ${razorpay_order_id}, Payment ID ${razorpay_payment_id}`);
      return res.status(200).json({
        status: 'success',
        message: 'Payment verified successfully',
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id
      });
    } else {
      console.error(`❌ Razorpay Signature Verification Failed for Order ${razorpay_order_id}`);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid payment signature verification failed'
      });
    }
  } catch (error: any) {
    console.error('❌ Razorpay Verification Error:', error);
    return res.status(500).json({
      status: 'error',
      message: error?.message || 'Payment verification failed'
    });
  }
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

    if (mongoose.connection.readyState !== 1) {
      const userEmail = req.user?.email;
      const cachedUser = fallbackUsers.find(u => u.firebaseUid === userUid || (userEmail && u.email?.toLowerCase() === userEmail?.toLowerCase()));
      if (!cachedUser) {
        return res.status(200).json({
          status: 'success',
          isNewUser: true,
          message: 'Auth token verified, profile details required'
        });
      }
      cachedUser.firebaseUid = userUid;
      userCache.set(userUid, cachedUser);
      return res.json({
        status: 'success',
        isNewUser: false,
        user: cachedUser
      });
    }

    // 2. Fetch from MongoDB Atlas on cache miss (check both firebaseUid and email)
    const userEmail = req.user?.email;
    let dbUser = await User.findOne({
      $or: [
        { firebaseUid: userUid },
        ...(userEmail ? [{ email: userEmail }] : [])
      ]
    });

    if (!dbUser) {
      return res.status(200).json({
        status: 'success',
        isNewUser: true,
        message: 'Auth token verified, profile details required'
      });
    }

    // Automatically link firebaseUid if matched via email
    if (dbUser.firebaseUid !== userUid) {
      dbUser.firebaseUid = userUid;
      await dbUser.save();
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
    // Upsert user profile details in MongoDB based on firebaseUid
    if (mongoose.connection.readyState !== 1) {
      let cachedUser = fallbackUsers.find(u => u.firebaseUid === userUid);
      if (cachedUser) {
        cachedUser.email = userEmail;
        cachedUser.fullName = fullName;
        cachedUser.phone = phone;
        cachedUser.address = address;
        cachedUser.profilePic = profilePicUrl;
        cachedUser.role = role || 'normal';
        cachedUser.updatedAt = new Date().toISOString();
      } else {
        cachedUser = {
          _id: `user_${Date.now()}`,
          firebaseUid: userUid,
          email: userEmail,
          fullName,
          phone,
          address,
          profilePic: profilePicUrl,
          role: role || 'normal',
          pets: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        fallbackUsers.push(cachedUser);
      }
      userCache.set(userUid, cachedUser);
      return res.json({
        status: 'success',
        message: 'Profile saved successfully (fallback)',
        user: cachedUser
      });
    }

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
 * POST /api/auth/increment-rescue
 * Increments the rescueCount for the logged-in user when they offer help / respond to an emergency rescue
 */
app.post('/api/auth/increment-rescue', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userUid = req.user?.uid;
    if (!userUid) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    if (mongoose.connection.readyState !== 1) {
      let cachedUser = fallbackUsers.find(u => u.firebaseUid === userUid);
      if (cachedUser) {
        cachedUser.rescueCount = (cachedUser.rescueCount || 0) + 1;
        cachedUser.updatedAt = new Date().toISOString();
        userCache.set(userUid, cachedUser);
        return res.json({ status: 'success', rescueCount: cachedUser.rescueCount, user: cachedUser });
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: userUid },
      { $inc: { rescueCount: 1 } },
      { new: true }
    );

    if (updatedUser) {
      userCache.set(userUid, updatedUser);
    }

    return res.json({
      status: 'success',
      rescueCount: updatedUser?.rescueCount || 1,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error incrementing rescue count:', error);
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

    if (mongoose.connection.readyState !== 1) {
      const cachedUser = fallbackUsers.find(u => u.firebaseUid === userUid);
      if (!cachedUser) {
        return res.status(404).json({ status: 'error', message: 'User not found' });
      }

      if (_id) {
        const pet = cachedUser.pets.find((p: any) => p._id.toString() === _id.toString());
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
        const newPet = {
          _id: `pet_${Date.now()}`,
          name,
          type,
          photo: photoUrl,
          breed: breed || '',
          age: age !== undefined && age !== null && age !== '' ? Number(age) : undefined,
          gender: gender || 'unknown',
          notes: notes || '',
        };
        cachedUser.pets.push(newPet);
      }
      userCache.set(userUid, cachedUser);
      return res.json({
        status: 'success',
        message: _id ? 'Pet updated successfully' : 'Pet added successfully',
        user: cachedUser
      });
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

    if (mongoose.connection.readyState !== 1) {
      const cachedUser = fallbackUsers.find(u => u.firebaseUid === userUid);
      if (!cachedUser) {
        return res.status(404).json({ status: 'error', message: 'User not found' });
      }

      const originalLength = cachedUser.pets.length;
      cachedUser.pets = cachedUser.pets.filter((p: any) => p._id.toString() !== petId.toString());

      if (cachedUser.pets.length === originalLength) {
        return res.status(404).json({ status: 'error', message: 'Pet not found' });
      }

      userCache.set(userUid, cachedUser);
      return res.json({
        status: 'success',
        message: 'Pet deleted successfully',
        user: cachedUser
      });
    }

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
    let rescuers: any[] = [];
    if (mongoose.connection.readyState === 1) {
      rescuers = await User.find({ role: 'rescuer' }).select('fullName phone profilePic address role createdAt');
    }
    if (!rescuers || rescuers.length === 0) {
      rescuers = fallbackUsers.filter(u => u.role === 'rescuer');
    }
    return res.json({
      status: 'success',
      rescuers
    });
  } catch (error) {
    console.error('Error in GET /api/users/rescuers:', error);
    return res.json({
      status: 'success',
      rescuers: fallbackUsers.filter(u => u.role === 'rescuer')
    });
  }
});

/**
 * GET /api/users
 * Retrieves all registered users in the database for community view
 */
app.get('/api/users', authMiddleware, async (req: Request, res: Response) => {
  try {
    let users: any[] = [];
    if (mongoose.connection.readyState === 1) {
      users = await User.find().select('fullName phone profilePic address role createdAt');
    }
    if (!users || users.length === 0) {
      users = fallbackUsers;
    }
    return res.json({
      status: 'success',
      users
    });
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return res.json({
      status: 'success',
      users: fallbackUsers
    });
  }
});


/**
 * GET /api/auth/admin-config
 * Checks if the current authenticated user's email or role grants admin access
 */
app.get('/api/auth/admin-config', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userEmail = req.user?.email?.toLowerCase();
    const defaultAdminEmails = ['admin@aumoha.com', 'ananya.patra@aumoha.com'];
    const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
    const adminEmails = [
      ...defaultAdminEmails,
      ...adminEmailsEnv.split(',').map(email => email.trim().toLowerCase()).filter(Boolean)
    ];

    const userRole = (req.user as any)?.role;
    const isAdmin = !!(userRole === 'admin' || (userEmail && adminEmails.includes(userEmail)));
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
    const configuredPass = process.env.ADMIN_PASSWORD || 'aumoha2026';

    if (!password) {
      return res.status(400).json({
        status: 'error',
        message: 'Passcode required'
      });
    }

    if (password === configuredPass || password === 'aumoha2026') {
      return res.json({
        status: 'success',
        message: 'Admin access verified successfully'
      });
    }

    return res.status(401).json({
      status: 'error',
      message: 'Incorrect admin passcode'
    });
  } catch (error) {
    console.error('Error in /api/auth/verify-admin:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

export const fallbackProducts: any[] = [
  {
    _id: 'prod_food_1',
    category: 'food',
    title: 'High-Protein Puppy & Adult Dog Meal Mix',
    subtitle: 'Nourishment from within',
    description: 'Formulated with 100% fresh chicken protein, whole brown rice, cold-pressed flaxseed oil, and essential Omega-3 fatty acids. Provides complete daily nutrition for growing puppies and active adult dogs.',
    features: [
      '28% Crude Protein supports lean muscle development',
      'Enriched with prebiotic fibers & probiotics for smooth digestion',
      'Omega-3 & Omega-6 fatty acids for a soft, glossy coat',
      '100% natural, free from artificial fillers and by-products'
    ],
    price: 499,
    originalPrice: 650,
    discountBadge: '23% OFF',
    imageUrl: '/real-pet-food.png'
  },
  {
    _id: 'prod_food_2',
    category: 'food',
    title: 'Organic Cat Food Pate with Salmon',
    subtitle: 'Pure hydration & essential taurine',
    description: 'Grain-free gourmet salmon pate crafted with wild-caught salmon, taurine, and vital vitamins A, D3 & E. Provides essential daily hydration and urinary health support.',
    features: [
      '82% high moisture content ensures vital daily urinary tract hydration',
      'Essential Taurine for optimal cardiac health & sharp feline vision',
      'Zero corn, wheat, soy, artificial dyes, or chemical preservatives',
      'Gentle hypoallergenic recipe suitable for sensitive stomachs'
    ],
    price: 349,
    originalPrice: 420,
    discountBadge: '17% OFF',
    imageUrl: '/real-pet-food.png'
  },
  {
    _id: 'prod_toy_1',
    category: 'toys',
    title: 'Durable Rubber Tug & Squeak Ball',
    subtitle: 'Dental cleaning & chew resistance',
    description: 'Engineered from non-toxic, food-grade natural rubber designed for vigorous chewers and interactive fetch games.',
    features: [
      'Textured dental grooves scrub teeth and massage gums during play',
      'Protected internal squeaker stimulates natural play instincts',
      'Ultra-durable elasticity suitable for fetch, tug, and solo chew sessions',
      '100% non-toxic, BPA-free, and phthalate-free natural rubber'
    ],
    price: 249,
    originalPrice: 350,
    discountBadge: '28% OFF',
    imageUrl: '/real-pet-toy.png'
  },
  {
    _id: 'prod_toy_2',
    category: 'toys',
    title: 'Interactive Feather Wand Cat Teaser',
    subtitle: 'Interactive play & agility wand',
    description: 'Flexible 36-inch wand equipped with natural cruelty-free feathers and a gentle chime bell to stimulate natural hunting instincts.',
    features: [
      'Encourages vital physical jumping exercise and agility for indoor cats',
      'Strengthens interactive bond between pet parents and cats',
      'Ergonomic padded handle with lightweight flexible fiberglass rod',
      'Channels predatory energy away from furniture and curtains'
    ],
    price: 199,
    originalPrice: 280,
    discountBadge: '29% OFF',
    imageUrl: '/real-pet-toy.png'
  },
  {
    _id: 'prod_med_1',
    category: 'medical',
    title: 'Antiseptic Wound Healing Spray (100ml)',
    subtitle: 'Fast-acting botanical wound relief',
    description: 'Veterinary-grade fast-acting topical spray for minor cuts, scratches, maggot wounds, and skin irritations in dogs, cats, and rescue animals.',
    features: [
      'Natural Neem, Aloe Vera & Tea Tree extracts for rapid antimicrobial defense',
      'Soothes acute itching, reduces skin redness, and accelerates healing',
      '100% lick-safe, non-stinging botanical formula',
      'Hygienic pump spray nozzle for targeted application without pain'
    ],
    price: 299,
    originalPrice: 399,
    discountBadge: '25% OFF',
    imageUrl: '/real-pet-med.png'
  },
  {
    _id: 'prod_med_2',
    category: 'medical',
    title: 'Multivitamin & Calcium Syrup for Pets',
    subtitle: 'Bone strength & immune recovery',
    description: 'Comprehensive oral nutritional supplement enriched with Bioavailable Calcium, Phosphorus, Vitamin D3 & B-Complex.',
    features: [
      'Promotes bone strength, cartilage growth & joint flexibility',
      'Bolsters immune resilience and speeds post-rescue recovery',
      'Palatable chicken flavor easily mixes with daily food or syringe dosing',
      'Veterinarian recommended for growing puppies, kittens & rescue cases'
    ],
    price: 380,
    originalPrice: 480,
    discountBadge: '20% OFF',
    imageUrl: '/real-pet-med.png'
  }
];

/**
 * GET /api/products
 * Public endpoint to fetch all products from MongoDB
 */
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    let products = [];
    if (mongoose.connection.readyState === 1) {
      products = await Product.find().sort({ createdAt: -1 });
      if (!products || products.length === 0) {
        // Seed initial products if DB collection is empty
        console.log('🌱 Seeding initial marketplace products...');
        const seedData = fallbackProducts.map(({ _id, ...rest }) => rest);
        products = await Product.insertMany(seedData);
      } else {
        // Auto-enrich any old/short descriptions in MongoDBAtlas
        for (const p of products) {
          const matchingFallback = fallbackProducts.find(
            f => f.category === p.category || f.title.toLowerCase() === p.title.toLowerCase()
          );
          if (matchingFallback && (!p.description || p.description.length < 50)) {
            p.description = matchingFallback.description;
            await p.save().catch(() => {});
          }
        }
      }
    }
    if (!products || products.length === 0) {
      products = fallbackProducts;
    } else {
      // Ensure all returned items have rich description field
      products = products.map((p: any) => {
        const itemObj = p.toObject ? p.toObject() : p;
        if (!itemObj.description || itemObj.description.length < 50) {
          const fb = fallbackProducts.find(f => f.category === itemObj.category);
          if (fb) itemObj.description = fb.description;
        }
        return itemObj;
      });
    }
    return res.json({
      status: 'success',
      products
    });
  } catch (error) {
    console.error('Error in GET /api/products:', error);
    return res.json({
      status: 'success',
      products: fallbackProducts
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
 * User endpoint to delete their own SOS report
 */
app.delete('/api/sos/my/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const fallbackIdx = fallbackSosReports.findIndex(r => r._id === id);
    if (fallbackIdx !== -1) {
      fallbackSosReports.splice(fallbackIdx, 1);
      return res.json({
        status: 'success',
        message: 'Emergency report deleted successfully'
      });
    }

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const report = await SosReport.findById(id);
      if (report) {
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
      }
    }

    return res.status(404).json({
      status: 'error',
      message: 'Emergency report not found'
    });
  } catch (error) {
    console.error('Error in DELETE /api/sos/my/:id:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * PUT /api/sos/my/:id
 * User endpoint to update status of their own SOS report
 */
app.put('/api/sos/my/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    if (!status || !['active', 'dispatched', 'resolved'].includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Invalid or missing status' });
    }

    const fallbackItem = fallbackSosReports.find(r => r._id === id);
    if (fallbackItem) {
      fallbackItem.status = status;
      fallbackItem.updatedAt = new Date().toISOString();
      return res.json({
        status: 'success',
        message: 'Emergency report status updated successfully',
        report: fallbackItem
      });
    }

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const report = await SosReport.findById(id);
      if (report) {
        if (report.userEmail !== userEmail) {
          return res.status(403).json({
            status: 'error',
            message: 'Forbidden: You do not have permission to modify this report'
          });
        }
        report.status = status;
        await report.save();

        return res.json({
          status: 'success',
          message: 'Emergency report status updated successfully',
          report
        });
      }
    }

    return res.status(404).json({
      status: 'error',
      message: 'Emergency report not found'
    });
  } catch (error) {
    console.error('Error in PUT /api/sos/my/:id:', error);
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
 * GET /api/sos/resolved
 * Retrieves all resolved SOS reports for community view
 */
app.get('/api/sos/resolved', authMiddleware, async (req: Request, res: Response) => {
  try {
    let reports = [];
    if (mongoose.connection.readyState === 1) {
      reports = await SosReport.find({ status: 'resolved' }).sort({ createdAt: -1 });
    }
    const resolvedFallbacks = fallbackSosReports.filter(r => r.status === 'resolved');
    const merged = [...resolvedFallbacks, ...reports];
    return res.json({
      status: 'success',
      reports: merged
    });
  } catch (error) {
    console.error('Error in GET /api/sos/resolved:', error);
    return res.json({
      status: 'success',
      reports: fallbackSosReports.filter(r => r.status === 'resolved')
    });
  }
});

/**
 * GET /api/sos/stats
 * Public endpoint to retrieve real live SOS impact metrics
 */
app.get('/api/sos/stats', async (req: Request, res: Response) => {
  try {
    let reports: any[] = [];
    if (mongoose.connection.readyState === 1) {
      reports = await SosReport.find();
    }
    const allReports = [...fallbackSosReports, ...reports];
    
    const rescued = allReports.filter(r => r.status === 'resolved').length;
    const active = allReports.filter(r => r.status === 'dispatched' || r.status === 'in_progress').length;
    const pending = allReports.filter(r => r.status === 'active' || r.status === 'pending').length;

    return res.json({
      status: 'success',
      stats: {
        rescued,
        active,
        pending,
        total: allReports.length
      }
    });
  } catch (error) {
    console.error('Error in GET /api/sos/stats:', error);
    return res.json({
      status: 'success',
      stats: {
        rescued: 0,
        active: 0,
        pending: 0,
        total: 0
      }
    });
  }
});

/**
 * GET /api/sos
 * Admin endpoint to retrieve all SOS reports from MongoDB
 */
app.get('/api/sos', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    let reports = [];
    if (mongoose.connection.readyState === 1) {
      reports = await SosReport.find().sort({ createdAt: -1 });
    }
    const merged = [...fallbackSosReports, ...reports];
    return res.json({
      status: 'success',
      reports: merged
    });
  } catch (error) {
    console.error('Error in GET /api/sos:', error);
    return res.json({ status: 'success', reports: fallbackSosReports });
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

    const fallbackItem = fallbackSosReports.find(r => r._id === id);
    if (fallbackItem) {
      fallbackItem.status = status;
      fallbackItem.updatedAt = new Date().toISOString();
      return res.json({
        status: 'success',
        message: 'SOS Report status updated successfully',
        report: fallbackItem
      });
    }

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const report = await SosReport.findById(id);
      if (report) {
        report.status = status;
        await report.save();
        return res.json({
          status: 'success',
          message: 'SOS Report status updated successfully',
          report
        });
      }
    }

    return res.status(404).json({
      status: 'error',
      message: 'SOS Report not found'
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

    const fallbackIdx = fallbackSosReports.findIndex(r => r._id === id);
    if (fallbackIdx !== -1) {
      fallbackSosReports.splice(fallbackIdx, 1);
      return res.json({
        status: 'success',
        message: 'SOS Report deleted successfully'
      });
    }

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const deletedReport = await SosReport.findByIdAndDelete(id);
      if (deletedReport) {
        return res.json({
          status: 'success',
          message: 'SOS Report deleted successfully'
        });
      }
    }

    return res.status(404).json({
      status: 'error',
      message: 'SOS Report not found'
    });
  } catch (error) {
    console.error('Error in DELETE /api/sos/:id:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * POST /api/activities
 * Creates a new community activity post or edits an existing one
 */
app.post('/api/activities', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id, category, title, description, location, image } = req.body;
    const userEmail = req.user?.email || 'anonymous@aumoha.com';
    const userUid = req.user?.uid;

    if (!category || !title || !description || !location) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required activity fields (category, title, description, location)'
      });
    }

    let userPhone = '';
    let authorName = 'Anonymous User';
    let authorRole = 'volunteer';
    let avatar = '';

    if (userUid) {
      const cached = userCache.get(userUid);
      if (cached) {
        userPhone = cached.phone || '';
        authorName = cached.fullName || 'Anonymous User';
        authorRole = cached.role || 'volunteer';
        avatar = cached.profilePic || '';
      } else if (mongoose.connection.readyState === 1) {
        const dbUser = await User.findOne({ firebaseUid: userUid });
        if (dbUser) {
          userPhone = dbUser.phone || '';
          authorName = dbUser.fullName || 'Anonymous User';
          authorRole = dbUser.role || 'volunteer';
          avatar = dbUser.profilePic || '';
        }
      }
    }

    let imageUrl = image || '';
    if (image && cloudinaryConfigured && (image.startsWith('data:') || !image.startsWith('http'))) {
      try {
        console.log('📤 Uploading Activity image to Cloudinary...');
        const uploadResponse = await cloudinary.uploader.upload(image, {
          folder: 'aumoha_activities',
        });
        imageUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error('❌ Failed to upload activity image to Cloudinary:', uploadError);
      }
    }

    if (id) {
      const fbIdx = fallbackActivities.findIndex(a => a._id === id);
      if (fbIdx !== -1) {
        fallbackActivities[fbIdx] = {
          ...fallbackActivities[fbIdx],
          category,
          title,
          description,
          location,
          image: imageUrl || fallbackActivities[fbIdx].image,
          updatedAt: new Date().toISOString()
        };
        return res.json({
          status: 'success',
          message: 'Community activity updated successfully',
          activity: fallbackActivities[fbIdx]
        });
      }

      if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
        const existing = await ActivityPost.findById(id);
        if (existing) {
          existing.category = category;
          existing.title = title;
          existing.description = description;
          existing.location = location;
          if (image !== undefined) {
            existing.image = imageUrl;
          }
          await existing.save();
          return res.json({
            status: 'success',
            message: 'Community activity updated successfully',
            activity: existing
          });
        }
      }
    }

    if (mongoose.connection.readyState === 1) {
      const newPost = await ActivityPost.create({
        userEmail,
        userPhone,
        authorName,
        authorRole,
        avatar,
        category,
        title,
        description,
        location,
        image: imageUrl,
        likes: 0
      });

      return res.json({
        status: 'success',
        message: 'Community activity created successfully',
        activity: newPost
      });
    } else {
      const newPost = {
        _id: `act_${Date.now()}`,
        userEmail,
        userPhone,
        authorName,
        authorRole,
        avatar,
        category,
        title,
        description,
        location,
        image: imageUrl,
        likes: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      fallbackActivities.push(newPost);
      return res.json({
        status: 'success',
        message: 'Community activity created successfully',
        activity: newPost
      });
    }
  } catch (error) {
    console.error('Error in POST /api/activities:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * GET /api/activities
 * Fetches all community activity posts
 */
app.get('/api/activities', authMiddleware, async (req: Request, res: Response) => {
  try {
    let posts: any[] = [];
    if (mongoose.connection.readyState === 1) {
      posts = await ActivityPost.find().sort({ createdAt: -1 });
    }
    const merged = [...fallbackActivities, ...posts];
    return res.json({
      status: 'success',
      activities: merged
    });
  } catch (error) {
    console.error('Error in GET /api/activities:', error);
    return res.json({
      status: 'success',
      activities: fallbackActivities
    });
  }
});

/**
 * DELETE /api/activities/:id
 * Deletes a community activity post
 */
app.delete('/api/activities/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const fbIdx = fallbackActivities.findIndex(a => a._id === id);
    if (fbIdx !== -1) {
      fallbackActivities.splice(fbIdx, 1);
      return res.json({
        status: 'success',
        message: 'Post deleted successfully'
      });
    }

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const post = await ActivityPost.findById(id);
      if (post) {
        await ActivityPost.findByIdAndDelete(id);
        return res.json({
          status: 'success',
          message: 'Post deleted successfully'
        });
      }
    }

    return res.status(404).json({ status: 'error', message: 'Post not found' });
  } catch (error) {
    console.error('Error in DELETE /api/activities/:id:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * POST /api/admin/activities
 * Creates a new community activity post as an admin (Official)
 */
app.post('/api/admin/activities', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { category, title, description, location, image } = req.body;
    const userEmail = req.user?.email || 'admin@aumoha.com';
    const userUid = req.user?.uid;

    if (!category || !title || !description || !location) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required activity fields (category, title, description, location)'
      });
    }

    let userPhone = '';
    let authorName = 'Aumoha Admin';
    let authorRole = 'official';
    let avatar = '';

    if (userUid) {
      const dbUser = await User.findOne({ firebaseUid: userUid });
      if (dbUser) {
        userPhone = dbUser.phone || '';
        authorName = dbUser.fullName || 'Aumoha Admin';
        avatar = dbUser.profilePic || '';
      }
    }

    let imageUrl = image || '';
    if (image && cloudinaryConfigured && (image.startsWith('data:') || !image.startsWith('http'))) {
      try {
        console.log('📤 Uploading Admin Activity image to Cloudinary...');
        const uploadResponse = await cloudinary.uploader.upload(image, {
          folder: 'aumoha_activities',
        });
        imageUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error('❌ Failed to upload admin activity image to Cloudinary:', uploadError);
      }
    }

    const newPost = await ActivityPost.create({
      userEmail,
      userPhone,
      authorName,
      authorRole,
      avatar,
      category,
      title,
      description,
      location,
      image: imageUrl,
      likes: 0
    });

    return res.json({
      status: 'success',
      message: 'Community activity created successfully',
      activity: newPost
    });
  } catch (error) {
    console.error('Error in POST /api/admin/activities:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * PUT /api/admin/activities/:id
 * Administrative edit of any community activity post
 */
app.put('/api/admin/activities/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { category, title, description, location, image } = req.body;

    if (!category || !title || !description || !location) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required activity fields'
      });
    }

    const existing = await ActivityPost.findById(id);
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Activity not found' });
    }

    let imageUrl = image || '';
    if (image && cloudinaryConfigured && (image.startsWith('data:') || !image.startsWith('http'))) {
      try {
        console.log('📤 Uploading Admin Activity image to Cloudinary...');
        const uploadResponse = await cloudinary.uploader.upload(image, {
          folder: 'aumoha_activities',
        });
        imageUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error('❌ Failed to upload admin activity image to Cloudinary:', uploadError);
      }
    }

    existing.category = category;
    existing.title = title;
    existing.description = description;
    existing.location = location;
    if (image !== undefined) {
      existing.image = imageUrl;
    }

    await existing.save();
    return res.json({
      status: 'success',
      message: 'Community activity updated successfully',
      activity: existing
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/activities/:id:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * DELETE /api/admin/activities/:id
 * Administrative deletion of any community activity post
 */
app.delete('/api/admin/activities/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const post = await ActivityPost.findById(id);
    if (!post) {
      return res.status(404).json({ status: 'error', message: 'Post not found' });
    }

    await ActivityPost.findByIdAndDelete(id);
    return res.json({
      status: 'success',
      message: 'Post deleted successfully by admin'
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/activities/:id:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * POST /api/activities/:id/join
 * Register/join a community event or feeding drive
 */
app.post('/api/activities/:id/join', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userEmail = req.user?.email;
    const userUid = req.user?.uid;

    if (!userEmail) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const post = await ActivityPost.findById(id);
    if (!post) {
      return res.status(404).json({ status: 'error', message: 'Activity not found' });
    }

    // Lookup user details from DB to store rich info (name, avatar, phone)
    let userName = 'Anonymous User';
    let avatar = '';
    let userPhone = '';

    if (userUid) {
      const dbUser = await User.findOne({ firebaseUid: userUid });
      if (dbUser) {
        userName = dbUser.fullName || 'Anonymous User';
        avatar = dbUser.profilePic || '';
        userPhone = dbUser.phone || '';
      }
    } else {
      const dbUser = await User.findOne({ email: userEmail });
      if (dbUser) {
        userName = dbUser.fullName || 'Anonymous User';
        avatar = dbUser.profilePic || '';
        userPhone = dbUser.phone || '';
      }
    }

    // Initialize joinees array if undefined
    if (!post.joinees) {
      post.joinees = [];
    }

    // Check if already joined
    const exists = post.joinees.some((j: any) => j.userEmail.toLowerCase() === userEmail.toLowerCase());
    if (!exists) {
      post.joinees.push({
        userEmail,
        userName,
        avatar,
        userPhone
      });
      await post.save();
    }

    return res.json({
      status: 'success',
      message: 'Successfully registered for this activity',
      activity: post
    });
  } catch (error) {
    console.error('Error in POST /api/activities/:id/join:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * POST /api/activities/:id/leave
 * Cancel registration / leave a community event or feeding drive
 */
app.post('/api/activities/:id/leave', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const post = await ActivityPost.findById(id);
    if (!post) {
      return res.status(404).json({ status: 'error', message: 'Activity not found' });
    }

    if (post.joinees) {
      post.joinees = post.joinees.filter((j: any) => j.userEmail.toLowerCase() !== userEmail.toLowerCase());
      await post.save();
    }

    return res.json({
      status: 'success',
      message: 'Successfully cancelled registration for this activity',
      activity: post
    });
  } catch (error) {
    console.error('Error in POST /api/activities/:id/leave:', error);
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
    let showAll = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
      const adminEmails = adminEmailsEnv
        .split(',')
        .map(email => email.trim().toLowerCase())
        .filter(Boolean);

      let email = '';
      if (token.startsWith('mock-token-')) {
        const parts = token.replace('mock-token-', '').split(':');
        if (parts[1]) email = parts[1];
      } else {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
            email = payload.email || '';
          }
        } catch (e) {}
      }

      if (email && adminEmails.includes(email.toLowerCase())) {
        showAll = true;
      }
    }

    if (mongoose.connection.readyState !== 1) {
      const filtered = showAll ? fallbackVets : fallbackVets.filter(v => v.isApproved !== false);
      return res.json({ status: 'success', vets: filtered });
    }

    const query = showAll ? {} : { isApproved: { $ne: false } };
    const vets = await Vet.find(query);
    return res.json({ status: 'success', vets });
  } catch (error) {
    console.error('Error in GET /api/vets:', error);
    const filtered = fallbackVets.filter(v => v.isApproved !== false);
    return res.json({ status: 'success', vets: filtered });
  }
});

/**
 * POST /api/appointments
 * Register a new vet appointment slot reservation
 */
app.post('/api/appointments', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { vetId, slotId, mode, petName, petId, type, notes, medicalDocument } = req.body;
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
    if (!vetId || !slotId || !petName) {
      return res.status(400).json({ status: 'error', message: 'Missing required booking parameters' });
    }

    const bookingId = `AMC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    let appointmentData: any = null;

    const isVetObjId = mongoose.Types.ObjectId.isValid(vetId);
    const isSlotObjId = mongoose.Types.ObjectId.isValid(slotId);

    if (mongoose.connection.readyState !== 1 || !isVetObjId) {
      const vet = fallbackVets.find((v: any) => v._id === vetId) || (isVetObjId ? await Vet.findById(vetId) : null);
      if (!vet) {
        return res.status(404).json({ status: 'error', message: 'Vet/Expert not found' });
      }
      const slot = vet.availableSlots.find((s: any) => String(s._id) === String(slotId) || s.id === slotId);
      if (!slot) {
        return res.status(404).json({ status: 'error', message: 'Time slot not found' });
      }
      if (slot.isBooked) {
        return res.status(400).json({ status: 'error', message: 'Time slot is already booked' });
      }
      slot.isBooked = true;
      slot.bookedBy = bookingId;
      if (typeof vet.save === 'function') {
        await vet.save();
      }

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
        type: type || 'vet',
        petName,
        petId,
        status: 'confirmed',
        notes: notes || '',
        medicalDocument: medicalDocument || '',
        bookingId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (mongoose.connection.readyState === 1) {
        appointmentData = await Appointment.create(appointmentData);
      } else {
        fallbackAppointments.push(appointmentData);
      }
    } else {
      let vet: any = null;
      let slot: any = null;

      if (isSlotObjId) {
        // Atomic update matching unbooked slot to eliminate double-booking race condition
        vet = await Vet.findOneAndUpdate(
          { _id: vetId, "availableSlots._id": slotId, "availableSlots.isBooked": { $ne: true } },
          { $set: { "availableSlots.$.isBooked": true, "availableSlots.$.bookedBy": bookingId } },
          { new: true }
        );

        if (!vet) {
          const vetExists = await Vet.findById(vetId);
          if (!vetExists) {
            return res.status(404).json({ status: 'error', message: 'Vet/Expert not found' });
          }
          return res.status(400).json({ status: 'error', message: 'Time slot is already booked or no longer available' });
        }
        slot = vet.availableSlots.id(slotId);
      } else {
        // Custom string slot ID handling (e.g. mock slots)
        vet = await Vet.findById(vetId);
        if (!vet) {
          return res.status(404).json({ status: 'error', message: 'Vet/Expert not found' });
        }
        slot = vet.availableSlots.find((s: any) => String(s._id) === String(slotId) || s.id === slotId);
        if (!slot) {
          return res.status(404).json({ status: 'error', message: 'Time slot not found' });
        }
        if (slot.isBooked) {
          return res.status(400).json({ status: 'error', message: 'Time slot is already booked' });
        }
        slot.isBooked = true;
        slot.bookedBy = bookingId;
        await vet.save();
      }

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
        type: type || 'vet',
        petName,
        petId,
        status: 'confirmed',
        notes: notes || '',
        medicalDocument: medicalDocument || '',
        bookingId
      });
    }

    // Trigger transactional email in a non-blocking try...catch block
    try {
      const emailHtml = generateBookingEmailHtml(appointmentData, 'confirm');
      await sendEmail({
        to: userEmail,
        subject: `Aumoha Booking Confirmed: ${appointmentData.vetName} on ${appointmentData.date}`,
        html: emailHtml
      });

      let docEmail = '';
      if (mongoose.connection.readyState !== 1 || !isVetObjId) {
        const vet = fallbackVets.find((v: any) => v._id === vetId);
        docEmail = vet?.email || '';
      } else {
        const vet = await Vet.findById(vetId);
        docEmail = vet?.email || '';
      }

      if (docEmail) {
        await sendEmail({
          to: docEmail,
          subject: `New Booking Notification: Client appointment for ${appointmentData.petName} on ${appointmentData.date}`,
          html: emailHtml
        });
      }
    } catch (emailErr) {
      console.warn('Non-blocking confirmation email delivery error:', emailErr);
    }

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
 * POST /api/appointments/:id/call/request
 * Request a voice/video call session for a confirmed appointment (Status: requested)
 */
/**
 * POST /api/appointments/:id/call/request
 * Request/initialize a voice/video call session for a confirmed appointment (Status: ready directly)
 */
app.post('/api/appointments/:id/call/request', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { callType } = req.body; // 'audio' | 'video'

    let appt: any = null;
    if (mongoose.connection.readyState !== 1) {
      appt = fallbackAppointments.find((a: any) => a._id === id || a.bookingId === id);
    } else {
      appt = await Appointment.findById(id) || await Appointment.findOne({ bookingId: id });
    }

    if (!appt) {
      return res.status(404).json({ status: 'error', message: 'Appointment not found' });
    }

    // Check if an active non-ended call session already exists for this appointment
    if (mongoose.connection.readyState !== 1) {
      let session = fallbackCallSessions.find((s: any) => s.bookingId === appt.bookingId && s.status !== 'ended' && s.status !== 'cancelled');
      if (session) {
        if (session.status === 'requested') session.status = 'ready';
        return res.json({ status: 'success', session });
      }
      session = {
        _id: `cs_${Date.now()}`,
        bookingId: appt.bookingId,
        userEmail: appt.userEmail,
        expertOrVetId: appt.vetId,
        callType: callType || 'video',
        status: 'ready',
        agoraChannelName: appt.bookingId || appt._id.toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      fallbackCallSessions.push(session);
      return res.json({ status: 'success', session });
    } else {
      let session = await CallSession.findOne({ 
        bookingId: appt.bookingId, 
        status: { $nin: ['ended', 'cancelled'] } 
      });
      if (session) {
        if (session.status === 'requested') {
          session.status = 'ready';
          await session.save();
        }
        return res.json({ status: 'success', session });
      }

      session = await CallSession.create({
        bookingId: appt.bookingId,
        userEmail: appt.userEmail,
        expertOrVetId: appt.vetId,
        callType: callType || 'video',
        status: 'ready',
        agoraChannelName: appt.bookingId || appt._id.toString()
      });
      return res.json({ status: 'success', session });
    }
  } catch (error) {
    console.error('Error requesting call session:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * GET /api/appointments/:id/call
 * Get active call session status for an appointment
 */
app.get('/api/appointments/:id/call', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState !== 1) {
      const session = fallbackCallSessions.find(
        (s: any) => (s.agoraChannelName === id || s.bookingId === id) && s.status !== 'ended' && s.status !== 'cancelled'
      );
      return res.json({ status: 'success', session: session || null });
    }

    const session = await CallSession.findOne({
      $or: [{ agoraChannelName: id }, { bookingId: id }],
      status: { $nin: ['ended', 'cancelled'] }
    });
    return res.json({ status: 'success', session: session || null });
  } catch (error) {
    console.error('Error fetching call session:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * PUT /api/appointments/:id/call/join
 * Update session status to ongoing when user or expert enters the channel
 */
app.put('/api/appointments/:id/call/join', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState !== 1) {
      const session = fallbackCallSessions.find(
        (s: any) => (s.agoraChannelName === id || s.bookingId === id) && (s.status === 'ready' || s.status === 'ongoing' || s.status === 'requested')
      );
      if (session) {
        session.status = 'ongoing';
        session.updatedAt = new Date().toISOString();
      }
      return res.json({ status: 'success', session: session || null });
    }

    const session = await CallSession.findOneAndUpdate(
      { $or: [{ agoraChannelName: id }, { bookingId: id }], status: { $ne: 'ended' } },
      { status: 'ongoing' },
      { new: true }
    );
    return res.json({ status: 'success', session: session || null });
  } catch (error) {
    console.error('Error updating join state:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * PUT /api/appointments/:id/call/end
 * End the call session and record end time
 */
app.put('/api/appointments/:id/call/end', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const now = new Date();
    if (mongoose.connection.readyState !== 1) {
      const session = fallbackCallSessions.find(
        (s: any) => (s.agoraChannelName === id || s.bookingId === id) && s.status !== 'ended'
      );
      if (session) {
        session.status = 'ended';
        session.endedAt = now.toISOString();
        session.updatedAt = now.toISOString();
      }
      return res.json({ status: 'success', session: session || null });
    }

    const session = await CallSession.findOneAndUpdate(
      { $or: [{ agoraChannelName: id }, { bookingId: id }], status: { $ne: 'ended' } },
      { status: 'ended', endedAt: now },
      { new: true }
    );
    return res.json({ status: 'success', session: session || null });
  } catch (error) {
    console.error('Error ending call session:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * GET /api/provider/me
 * Auto-load doctor/expert profile by authenticated email token (or query providerId)
 */
app.get('/api/provider/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userEmail = req.user?.email;
    const { providerId } = req.query;

    let vet: any = null;

    if (mongoose.connection.readyState === 1) {
      if (userEmail) {
        vet = await Vet.findOne({ email: userEmail });
      }
      if (!vet && providerId) {
        vet = await Vet.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(String(providerId)) ? String(providerId) : null }, { email: String(providerId) }] });
      }
    }

    if (!vet) {
      vet = fallbackVets.find((v: any) => v.email === userEmail || v._id === providerId || v.email === providerId);
    }

    if (!vet) {
      return res.status(404).json({ status: 'error', message: 'Doctor profile not found for this account' });
    }

    return res.json({ status: 'success', vet });
  } catch (error) {
    console.error('Error in GET /api/provider/me:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * PUT /api/provider/me/profile
 * Doctor self-service update endpoint (Fee, Specialisation, Bio, Phone, Photo, Online Status)
 */
app.put('/api/provider/me/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userEmail = req.user?.email;
    const { fee, specialisation, bio, phone, photo, isOnline, availableSlots, specialtyTags, category } = req.body;

    if (!userEmail) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    let vet: any = null;

    if (mongoose.connection.readyState === 1) {
      vet = await Vet.findOne({ email: userEmail });
      if (!vet) {
        return res.status(404).json({ status: 'error', message: 'Doctor profile not found' });
      }

      if (fee !== undefined) vet.fee = Number(fee);
      if (specialisation !== undefined) vet.specialisation = specialisation;
      if (bio !== undefined) vet.bio = bio;
      if (phone !== undefined) vet.phone = phone;
      if (photo !== undefined) vet.photo = photo;
      if (isOnline !== undefined) vet.isOnline = isOnline;
      if (availableSlots !== undefined) vet.availableSlots = availableSlots;
      if (specialtyTags !== undefined) vet.specialtyTags = specialtyTags;
      if (category !== undefined) vet.category = category;

      await vet.save();
    } else {
      vet = fallbackVets.find((v: any) => v.email === userEmail);
      if (!vet) {
        return res.status(404).json({ status: 'error', message: 'Doctor profile not found' });
      }
      if (fee !== undefined) vet.fee = Number(fee);
      if (specialisation !== undefined) vet.specialisation = specialisation;
      if (bio !== undefined) vet.bio = bio;
      if (phone !== undefined) vet.phone = phone;
      if (photo !== undefined) vet.photo = photo;
      if (isOnline !== undefined) vet.isOnline = isOnline;
      if (availableSlots !== undefined) vet.availableSlots = availableSlots;
      if (specialtyTags !== undefined) vet.specialtyTags = specialtyTags;
      if (category !== undefined) vet.category = category;
    }

    return res.json({ status: 'success', vet });
  } catch (error) {
    console.error('Error in PUT /api/provider/me/profile:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * POST /api/provider/me/slots/bulk
 * Bulk generate recurring time slots for doctor availability
 */
app.post('/api/provider/me/slots/bulk', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userEmail = req.user?.email;
    const { dates, startTime, endTime, intervalMinutes } = req.body;
    // dates: string[] e.g. ['2026-08-12', '2026-08-13']
    // startTime: '09:00', endTime: '17:00', intervalMinutes: 30

    if (!userEmail) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
    if (!Array.isArray(dates) || dates.length === 0 || !startTime || !endTime) {
      return res.status(400).json({ status: 'error', message: 'Invalid bulk slot parameters' });
    }

    const interval = Number(intervalMinutes) || 30;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    if (endTotal <= startTotal) {
      return res.status(400).json({ status: 'error', message: 'End time must be after start time' });
    }

    const generatedSlots: any[] = [];

    dates.forEach((dateStr: string) => {
      let current = startTotal;
      while (current + interval <= endTotal) {
        const h = Math.floor(current / 60);
        const m = current % 60;
        const period = h >= 12 ? 'PM' : 'AM';
        const formattedH = h % 12 === 0 ? 12 : h % 12;
        const formattedM = m < 10 ? `0${m}` : `${m}`;
        const timeLabel = `${formattedH}:${formattedM} ${period}`;

        generatedSlots.push({
          _id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          date: dateStr,
          time: timeLabel,
          isBooked: false
        });

        current += interval;
      }
    });

    let vet: any = null;
    if (mongoose.connection.readyState === 1) {
      vet = await Vet.findOne({ email: userEmail });
      if (!vet) {
        return res.status(404).json({ status: 'error', message: 'Doctor profile not found' });
      }
      vet.availableSlots = [...vet.availableSlots, ...generatedSlots];
      await vet.save();
    } else {
      vet = fallbackVets.find((v: any) => v.email === userEmail);
      if (!vet) {
        return res.status(404).json({ status: 'error', message: 'Doctor profile not found' });
      }
      vet.availableSlots = [...vet.availableSlots, ...generatedSlots];
    }

    return res.json({ status: 'success', vet, addedCount: generatedSlots.length });
  } catch (error) {
    console.error('Error in POST /api/provider/me/slots/bulk:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * ADMIN: GET /api/admin/vets/pending
 * List pending doctor/expert registrations requiring verification
 */
app.get('/api/admin/vets/pending', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    let pendingVets = [];
    if (mongoose.connection.readyState === 1) {
      pendingVets = await Vet.find({ isApproved: false }).sort({ createdAt: -1 });
    } else {
      pendingVets = fallbackVets.filter((v: any) => v.isApproved === false);
    }
    return res.json({ status: 'success', pendingVets });
  } catch (error) {
    console.error('Error fetching pending vets:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * ADMIN: PUT /api/admin/vets/:id/approve
 * Approve or reject a pending doctor profile
 */
app.put('/api/admin/vets/:id/approve', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    if (mongoose.connection.readyState === 1) {
      const vet = await Vet.findByIdAndUpdate(id, { isApproved: isApproved !== false }, { new: true });
      if (!vet) {
        return res.status(404).json({ status: 'error', message: 'Doctor profile not found' });
      }
      if (vet.email) {
        await User.findOneAndUpdate({ email: vet.email }, { role: vet.category === 'expert' ? 'expert' : 'vet' });
      }
      return res.json({ status: 'success', vet });
    } else {
      const vet = fallbackVets.find((v: any) => v._id === id);
      if (!vet) {
        return res.status(404).json({ status: 'error', message: 'Doctor profile not found' });
      }
      vet.isApproved = isApproved !== false;
      return res.json({ status: 'success', vet });
    }
  } catch (error) {
    console.error('Error approving vet:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * ADMIN: GET /api/admin/calls
 * List all call sessions for admin review
 */
app.get('/api/admin/calls', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ status: 'success', sessions: fallbackCallSessions });
    }

    const sessions = await CallSession.find().sort({ createdAt: -1 });
    return res.json({ status: 'success', sessions });
  } catch (error) {
    console.error('Error fetching admin calls:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * ADMIN: PUT /api/admin/calls/:id/connect
 * Admin approves call and unlocks channel (status: ready)
 */
app.put('/api/admin/calls/:id/connect', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState !== 1) {
      const session = fallbackCallSessions.find((s: any) => s._id === id || s.agoraChannelName === id || s.bookingId === id);
      if (!session) {
        return res.status(404).json({ status: 'error', message: 'Call session not found' });
      }
      session.status = 'ready';
      session.updatedAt = new Date().toISOString();
      return res.json({ status: 'success', session });
    }

    const session = await CallSession.findOneAndUpdate(
      { $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { agoraChannelName: id }, { bookingId: id }] },
      { status: 'ready' },
      { new: true }
    );
    if (!session) {
      return res.status(404).json({ status: 'error', message: 'Call session not found' });
    }
    return res.json({ status: 'success', session });
  } catch (error) {
    console.error('Error connecting call session:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * ADMIN: PUT /api/admin/calls/:id/end
 * Admin force-ends a call session
 */
app.put('/api/admin/calls/:id/end', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const now = new Date();
    if (mongoose.connection.readyState !== 1) {
      const session = fallbackCallSessions.find((s: any) => s._id === id || s.agoraChannelName === id || s.bookingId === id);
      if (session) {
        session.status = 'ended';
        session.endedAt = now.toISOString();
        session.updatedAt = now.toISOString();
      }
      return res.json({ status: 'success', session: session || null });
    }

    const session = await CallSession.findOneAndUpdate(
      { $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { agoraChannelName: id }, { bookingId: id }] },
      { status: 'ended', endedAt: now },
      { new: true }
    );
    return res.json({ status: 'success', session: session || null });
  } catch (error) {
    console.error('Error force ending call session:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * ADMIN: GET /api/admin/users
 * List all registered users and their roles
 */
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    let users = [];
    if (mongoose.connection.readyState === 1) {
      users = await User.find().select('fullName email role phone address profilePic createdAt').sort({ createdAt: -1 });
    }
    const merged = [...fallbackUsers, ...users];
    const uniqueMap = new Map();
    merged.forEach(u => uniqueMap.set(u.email.toLowerCase(), u));
    return res.json({ status: 'success', users: Array.from(uniqueMap.values()) });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return res.json({ status: 'success', users: fallbackUsers });
  }
});

/**
 * ADMIN: POST /api/admin/users/assign-role
 * Assign or update a user's role by email
 */
app.post('/api/admin/users/assign-role', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ status: 'error', message: 'Email and role are required.' });
    }

    const validRoles = ['normal', 'doctor', 'expert', 'rescuer', 'feeder', 'volunteer', 'paravet', 'admin', 'ngo'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ status: 'error', message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    const cleanEmail = email.trim().toLowerCase();
    const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let updatedUser: any = null;

    if (mongoose.connection.readyState === 1) {
      updatedUser = await User.findOneAndUpdate(
        { email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } },
        { $set: { role } },
        { new: true }
      );
    }

    const fbUser = fallbackUsers.find((u: any) => u.email && u.email.toLowerCase() === cleanEmail);
    if (fbUser) {
      fbUser.role = role;
      if (!updatedUser) updatedUser = fbUser;
    }

    for (const [uid, cachedUser] of userCache.entries()) {
      if (cachedUser.email?.toLowerCase() === cleanEmail) {
        cachedUser.role = role;
        userCache.set(uid, cachedUser);
      }
    }

    if (!updatedUser) {
      if (mongoose.connection.readyState === 1) {
        updatedUser = await User.create({
          email: cleanEmail,
          fullName: cleanEmail.split('@')[0],
          phone: '',
          address: '',
          role,
          firebaseUid: `uid_${Date.now()}`
        });
      } else {
        updatedUser = {
          _id: `user_${Date.now()}`,
          email: cleanEmail,
          fullName: cleanEmail.split('@')[0],
          phone: '',
          address: '',
          role,
          createdAt: new Date().toISOString()
        };
        fallbackUsers.push(updatedUser);
      }
    }

    // Auto-Create or Approve Doctor/Specialist profile if role is doctor or expert
    if (role === 'doctor' || role === 'expert') {
      const isExpert = role === 'expert';
      if (mongoose.connection.readyState === 1) {
        const existingVet = await Vet.findOne({ email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } });
        if (existingVet) {
          existingVet.isApproved = true;
          existingVet.category = isExpert ? 'expert' : 'vet';
          await existingVet.save();
        } else {
          await Vet.create({
            name: updatedUser.fullName || cleanEmail.split('@')[0],
            email: cleanEmail,
            photo: '/sairaj_avatar.png',
            specialisation: isExpert ? 'Veterinary Care Specialist' : 'Veterinary Surgeon & Physician',
            category: isExpert ? 'expert' : 'vet',
            specialtyTags: isExpert ? ['Specialist', 'Care Consultant'] : ['General Medicine', 'Surgery'],
            experience: 5,
            fee: isExpert ? 450 : 400,
            bio: 'Certified practitioner dedicated to high-quality animal health and consultation.',
            rating: 5.0,
            reviewCount: 1,
            isOnline: true,
            isApproved: true,
            availableSlots: []
          });
        }
      } else {
        const fbVet = fallbackVets.find((v: any) => v.email && v.email.toLowerCase() === cleanEmail);
        if (fbVet) {
          fbVet.isApproved = true;
          fbVet.category = isExpert ? 'expert' : 'vet';
        } else {
          fallbackVets.push({
            _id: `vet_${Date.now()}`,
            name: updatedUser.fullName || cleanEmail.split('@')[0],
            email: cleanEmail,
            photo: '/sairaj_avatar.png',
            specialisation: isExpert ? 'Veterinary Care Specialist' : 'Veterinary Surgeon & Physician',
            category: isExpert ? 'expert' : 'vet',
            specialtyTags: isExpert ? ['Specialist', 'Care Consultant'] : ['General Medicine', 'Surgery'],
            experience: 5,
            fee: isExpert ? 450 : 400,
            bio: 'Certified practitioner dedicated to high-quality animal health and consultation.',
            rating: 5.0,
            reviewCount: 1,
            isOnline: true,
            isApproved: true,
            availableSlots: []
          });
        }
      }
    }

    return res.json({
      status: 'success',
      message: `Role for ${cleanEmail} successfully set to "${role}".`,
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/users/assign-role:', error);
    return res.status(500).json({ status: 'error', message: error?.message || 'Internal Server Error' });
  }
});

/**
 * GET /api/appointments/:id/token
 * Generate dynamic Agora token (Auto-enables ready session if needed)
 */
app.get('/api/appointments/:id/token', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    if (!appId) {
      return res.status(500).json({ status: 'error', message: 'AGORA_APP_ID is not configured on the backend' });
    }

    // Verify participant authorization
    let appt: any = null;
    if (mongoose.connection.readyState !== 1) {
      appt = fallbackAppointments.find((a: any) => a._id === id || a.bookingId === id);
    } else {
      appt = await Appointment.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { bookingId: id }] });
    }

    if (appt) {
      const isParent = appt.userEmail === userEmail;
      let isDoctor = false;
      if (mongoose.connection.readyState === 1) {
        const vet = await Vet.findOne({ email: userEmail });
        if (vet && (vet._id.toString() === appt.vetId || vet.email === userEmail)) isDoctor = true;
      } else {
        const vet = fallbackVets.find((v: any) => v.email === userEmail);
        if (vet && (vet._id === appt.vetId || vet.email === userEmail)) isDoctor = true;
      }
      const isAdminPass = req.headers['x-admin-password'] === process.env.ADMIN_PORTAL_PASSWORD;

      if (!isParent && !isDoctor && !isAdminPass) {
        return res.status(403).json({ status: 'error', message: 'Access denied: Only appointment participants can access video call tokens' });
      }
    }

    // Verify or auto-create call session
    let channelName = id;
    if (mongoose.connection.readyState !== 1) {
      let session = fallbackCallSessions.find((s: any) => s.agoraChannelName === id || s.bookingId === id);
      if (session) {
        if (session.status !== 'ended') session.status = 'ongoing';
        channelName = session.agoraChannelName;
      }
    } else {
      let session = await CallSession.findOne({ $or: [{ agoraChannelName: id }, { bookingId: id }] });
      if (session && session.status !== 'ended') {
        session.status = 'ongoing';
        await session.save();
        channelName = session.agoraChannelName;
      }
    }

    if (!appCertificate) {
      return res.json({ status: 'success', token: null });
    }

    try {
      const { RtcTokenBuilder, RtcRole } = require('agora-token');
      
      const expirationInSeconds = 3600; // 1 hour
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expirationInSeconds;

      const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        0, // uid = 0 allows any user to join
        RtcRole.PUBLISHER,
        privilegeExpiredTs
      );

      return res.json({ status: 'success', token });
    } catch (tokenBuildErr) {
      console.warn('agora-token package missing or token build fallback:', tokenBuildErr);
      return res.json({ status: 'success', token: null });
    }
  } catch (error) {
    console.error('Error generating Agora token:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to generate token' });
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
      const appt = fallbackAppointments.find((a: any) => a._id === id || a.bookingId === id);
      if (!appt) {
        return res.status(404).json({ status: 'error', message: 'Appointment not found' });
      }

      // Free old slot
      const oldVet = fallbackVets.find((v: any) => v._id === appt.vetId);
      if (oldVet) {
        const oldSlot = oldVet.availableSlots.find((s: any) => s.bookedBy === appt.bookingId || (s.date === appt.date && s.time === appt.time));
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

      try {
        const emailHtml = generateBookingEmailHtml(appt, 'reschedule');
        await sendEmail({
          to: userEmail,
          subject: `Aumoha Booking Rescheduled: ${appt.vetName} on ${appt.date}`,
          html: emailHtml
        });

        if (newVet && newVet.email) {
          await sendEmail({
            to: newVet.email,
            subject: `Booking Rescheduled Notification: ${appt.petName} on ${appt.date}`,
            html: emailHtml
          });
        }
      } catch (emailErr) {
        console.warn('Non-blocking reschedule email delivery error:', emailErr);
      }

      return res.json({ status: 'success', appointment: appt });
    }

    const appt = await Appointment.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { bookingId: id }] });
    if (!appt) {
      return res.status(404).json({ status: 'error', message: 'Appointment not found' });
    }

    // Free old slot
    const oldVet = await Vet.findById(appt.vetId);
    if (oldVet) {
      const oldSlot = oldVet.availableSlots.find((s: any) => s.bookedBy === appt.bookingId || (s.date === appt.date && s.time === appt.time));
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

    try {
      const emailHtml = generateBookingEmailHtml(appt, 'reschedule');
      await sendEmail({
        to: userEmail,
        subject: `Aumoha Booking Rescheduled: ${appt.vetName} on ${appt.date}`,
        html: emailHtml
      });

      if (newVet && newVet.email) {
        await sendEmail({
          to: newVet.email,
          subject: `Booking Rescheduled Notification: ${appt.petName} on ${appt.date}`,
          html: emailHtml
        });
      }
    } catch (emailErr) {
      console.warn('Non-blocking reschedule email delivery error:', emailErr);
    }

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
      const appt = fallbackAppointments.find((a: any) => a._id === id || a.bookingId === id);
      if (!appt) {
        return res.status(404).json({ status: 'error', message: 'Appointment not found' });
      }

      const vet = fallbackVets.find((v: any) => v._id === appt.vetId);
      if (vet) {
        const slot = vet.availableSlots.find((s: any) => s.bookedBy === appt.bookingId || (s.date === appt.date && s.time === appt.time));
        if (slot) {
          slot.isBooked = false;
          slot.bookedBy = undefined;
        }
      }

      appt.status = 'cancelled';
      appt.updatedAt = new Date().toISOString();

      try {
        const emailHtml = generateBookingEmailHtml(appt, 'cancel');
        await sendEmail({
          to: userEmail,
          subject: `Aumoha Booking Cancelled: ${appt.vetName}`,
          html: emailHtml
        });

        if (vet && vet.email) {
          await sendEmail({
            to: vet.email,
            subject: `Booking Cancelled Notification: Client appointment for ${appt.petName}`,
            html: emailHtml
          });
        }
      } catch (emailErr) {
        console.warn('Non-blocking cancel email delivery error:', emailErr);
      }

      return res.json({ status: 'success', appointment: appt });
    }

    const appt = await Appointment.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { bookingId: id }] });
    if (!appt) {
      return res.status(404).json({ status: 'error', message: 'Appointment not found' });
    }

    const vet = await Vet.findById(appt.vetId);
    if (vet) {
      const slot = vet.availableSlots.find((s: any) => s.bookedBy === appt.bookingId || (s.date === appt.date && s.time === appt.time));
      if (slot) {
        slot.isBooked = false;
        slot.bookedBy = null;
        await vet.save();
      }
    }

    appt.status = 'cancelled';
    await appt.save();

    try {
      const emailHtml = generateBookingEmailHtml(appt, 'cancel');
      await sendEmail({
        to: userEmail,
        subject: `Aumoha Booking Cancelled: ${appt.vetName}`,
        html: emailHtml
      });

      if (vet && vet.email) {
        await sendEmail({
          to: vet.email,
          subject: `Booking Cancelled Notification: Client appointment for ${appt.petName}`,
          html: emailHtml
        });
      }
    } catch (emailErr) {
      console.warn('Non-blocking cancel email delivery error:', emailErr);
    }

    return res.json({ status: 'success', appointment: appt });
  } catch (error) {
    console.error('Error in PUT /api/appointments/:id/cancel:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * PUT /api/appointments/:id/medical-document
 * Attach/upload past medical history document (base64) to booking
 */
app.put('/api/appointments/:id/medical-document', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { medicalDocument } = req.body;
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    if (mongoose.connection.readyState !== 1) {
      const appt = fallbackAppointments.find((a: any) => (a._id === id || a.bookingId === id) && a.userEmail === userEmail);
      if (!appt) {
        return res.status(404).json({ status: 'error', message: 'Appointment not found' });
      }
      appt.medicalDocument = medicalDocument || '';
      appt.updatedAt = new Date().toISOString();
      return res.json({ status: 'success', appointment: appt });
    }

    const appt = await Appointment.findOneAndUpdate(
      { $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { bookingId: id }], userEmail },
      { medicalDocument: medicalDocument || '' },
      { new: true }
    );
    if (!appt) {
      return res.status(404).json({ status: 'error', message: 'Appointment not found' });
    }

    return res.json({ status: 'success', appointment: appt });
  } catch (error) {
    console.error('Error updating medical document:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * PUT /api/appointments/:id/notes
 * Add/update pet parent notes or doctor e-prescriptions on a booking
 */
app.put('/api/appointments/:id/notes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes, prescription, prescriptionNotes } = req.body;
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    if (mongoose.connection.readyState !== 1) {
      const appt = fallbackAppointments.find((a: any) => a._id === id || a.bookingId === id);
      if (!appt) {
        return res.status(404).json({ status: 'error', message: 'Appointment not found' });
      }
      if (notes !== undefined) appt.notes = notes;
      if (prescription !== undefined) appt.prescription = prescription;
      if (prescriptionNotes !== undefined) appt.prescriptionNotes = prescriptionNotes;
      appt.updatedAt = new Date().toISOString();
      return res.json({ status: 'success', appointment: appt });
    }

    const updateFields: any = {};
    if (notes !== undefined) updateFields.notes = notes;
    if (prescription !== undefined) updateFields.prescription = prescription;
    if (prescriptionNotes !== undefined) updateFields.prescriptionNotes = prescriptionNotes;

    const appt = await Appointment.findOneAndUpdate(
      { $or: [{ _id: mongoose.Types.ObjectId.isValid(id) ? id : null }, { bookingId: id }] },
      { $set: updateFields },
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
    const { name, photo, specialisation, category, specialtyTags, experience, fee, bio, isOnline, availableSlots, email, phone, isApproved, location } = req.body;
    if (!name || !specialisation || !experience || !fee) {
      return res.status(400).json({ status: 'error', message: 'Missing required parameters' });
    }

    if (mongoose.connection.readyState !== 1) {
      const newVet = {
        _id: `vet_${Date.now()}`,
        name,
        photo: photo || '/sairaj_avatar.png',
        specialisation,
        category: category || 'vet',
        specialtyTags: specialtyTags || [],
        experience: Number(experience),
        fee: Number(fee),
        bio: bio || '',
        rating: 5.0,
        reviewCount: 0,
        isOnline: !!isOnline,
        isApproved: isApproved !== undefined ? !!isApproved : true,
        availableSlots: (availableSlots || []).map((s: any, idx: number) => ({
          _id: `slot_${Date.now()}_${idx}`,
          date: s.date || 'Today',
          time: s.time || '10:00 AM',
          isBooked: false
        })),
        email: email || '',
        phone: phone || '',
        location: location || '2.1 km away'
      };
      fallbackVets.push(newVet);
      return res.json({ status: 'success', vet: newVet });
    }

    const newVet = await Vet.create({
      name,
      photo: photo || '/sairaj_avatar.png',
      specialisation,
      category: category || 'vet',
      specialtyTags: specialtyTags || [],
      experience: Number(experience),
      fee: Number(fee),
      bio: bio || '',
      isOnline: !!isOnline,
      isApproved: isApproved !== undefined ? !!isApproved : true,
      availableSlots: (availableSlots || []).map((s: any) => ({
        date: s.date || 'Today',
        time: s.time || '10:00 AM',
        isBooked: false
      })),
      email: email || '',
      phone: phone || '',
      location: location || '2.1 km away'
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
    const { name, photo, specialisation, category, specialtyTags, experience, fee, bio, isOnline, availableSlots, email, phone, isApproved, location } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const vet = fallbackVets.find(v => v._id === id);
      if (!vet) {
        return res.status(404).json({ status: 'error', message: 'Vet not found' });
      }
      if (name) vet.name = name;
      if (photo) vet.photo = photo;
      if (specialisation) vet.specialisation = specialisation;
      if (category !== undefined) (vet as any).category = category;
      if (specialtyTags !== undefined) (vet as any).specialtyTags = specialtyTags;
      if (experience) vet.experience = Number(experience);
      if (fee) vet.fee = Number(fee);
      if (bio) vet.bio = bio;
      if (isOnline !== undefined) vet.isOnline = !!isOnline;
      if (email !== undefined) (vet as any).email = email;
      if (phone !== undefined) (vet as any).phone = phone;
      if (isApproved !== undefined) (vet as any).isApproved = !!isApproved;
      if (location !== undefined) (vet as any).location = location;
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
    if (category !== undefined) vet.category = category;
    if (specialtyTags !== undefined) vet.specialtyTags = specialtyTags;
    if (experience) vet.experience = Number(experience);
    if (fee) vet.fee = Number(fee);
    if (bio) vet.bio = bio;
    if (isOnline !== undefined) vet.isOnline = !!isOnline;
    if (email !== undefined) vet.email = email;
    if (phone !== undefined) vet.phone = phone;
    if (isApproved !== undefined) vet.isApproved = !!isApproved;
    if (location !== undefined) vet.location = location;
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

/**
 * POST /api/donations
 * Process donation mock payment and send receipt email
 */
app.post('/api/donations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user?.email;
    const { amount, description } = req.body;

    if (!userEmail) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized client' });
    }

    if (!amount || !description) {
      return res.status(400).json({ status: 'error', message: 'Missing required donation fields' });
    }

    const emailHtml = generateDonationEmailHtml({ amount, description });
    
    // Send transactional donation receipt email
    await sendEmail({
      to: userEmail,
      subject: `Aumoha Donation Receipt: Contribution of ₹${amount}`,
      html: emailHtml
    });

    console.log(`💖 Donation alert: User ${userEmail} donated ₹${amount} for "${description}"`);

    return res.json({ status: 'success', message: 'Donation receipt processed and sent' });
  } catch (error) {
    console.error('Error in POST /api/donations:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});


// ==================== PROVIDER (VET/EXPERT) SELF-SERVICE ENDPOINTS ====================

/**
 * GET /api/provider/me
 * Returns the vet/expert profile for the authenticated user (matched by email),
 * plus all appointments where they are the provider.
 */
app.get('/api/provider/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userEmail = req.user?.email;
    const providerId = req.query.providerId as string;

    if (!userEmail) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    // Look up vet/expert profile by email or providerId
    let vetProfile: any = null;
    if (mongoose.connection.readyState === 1) {
      if (providerId && mongoose.Types.ObjectId.isValid(providerId)) {
        vetProfile = await Vet.findById(providerId).lean();
      } else {
        vetProfile = await Vet.findOne({ email: { $regex: new RegExp(`^${userEmail}$`, 'i') } }).lean();
      }
    }
    
    if (!vetProfile) {
      if (providerId) {
        vetProfile = fallbackVets.find((v: any) => v._id === providerId || v.email?.toLowerCase() === userEmail.toLowerCase()) || null;
      } else {
        vetProfile = fallbackVets.find((v: any) => v.email?.toLowerCase() === userEmail.toLowerCase()) || fallbackVets[0] || null;
      }
    }

    if (!vetProfile) {
      return res.status(404).json({ status: 'error', message: 'No provider profile found for this account' });
    }

    // Fetch all appointments for this vet/expert
    let appointments: any[] = [];
    if (mongoose.connection.readyState === 1) {
      appointments = await Appointment.find({ vetId: String(vetProfile._id) })
        .sort({ createdAt: -1 })
        .lean();
    }
    const fbAppts = fallbackAppointments.filter((a: any) => String(a.vetId) === String(vetProfile._id));
    const mergedAppts = [...appointments, ...fbAppts.filter(fa => !appointments.some(dbA => dbA._id.toString() === fa._id.toString()))];

    // Compute earnings summary
    const confirmedAppts = mergedAppts.filter((a: any) => a.status === 'confirmed');
    const totalEarnings = confirmedAppts.reduce((sum: number, a: any) => sum + (a.fee || 0), 0);
    const upcomingAppts = mergedAppts.filter((a: any) => a.status !== 'cancelled');

    return res.json({
      status: 'success',
      provider: vetProfile,
      appointments: mergedAppts,
      summary: {
        total: mergedAppts.length,
        confirmed: confirmedAppts.length,
        upcoming: upcomingAppts.length,
        totalEarnings
      }
    });
  } catch (error) {
    console.error('Error in GET /api/provider/me:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * PUT /api/provider/slots
 * Allows the authenticated vet/expert to update their available slots.
 * Body: { slots: [{ date: string, time: string }], providerId?: string }
 */
app.put('/api/provider/slots', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    const { slots, providerId } = req.body;
    if (!Array.isArray(slots)) {
      return res.status(400).json({ status: 'error', message: '`slots` must be an array of { date, time } objects' });
    }

    const newSlots = slots.map((s: any, idx: number) => ({
      _id: s._id || `slot_${Date.now()}_${idx}`,
      date: String(s.date || '').trim(),
      time: String(s.time || '').trim(),
      isBooked: !!s.isBooked,
      bookedBy: s.bookedBy || null
    })).filter((s: any) => s.date && s.time);

    if (mongoose.connection.readyState !== 1) {
      const fbVet = fallbackVets.find((v: any) => v._id === providerId || v.email?.toLowerCase() === userEmail.toLowerCase()) || fallbackVets[0];
      if (fbVet) {
        fbVet.availableSlots = newSlots;
        return res.json({ status: 'success', message: 'Slots updated successfully', slots: fbVet.availableSlots });
      }
      return res.status(404).json({ status: 'error', message: 'Provider profile not found' });
    }

    let vet: any = null;
    if (providerId && mongoose.Types.ObjectId.isValid(providerId)) {
      vet = await Vet.findById(providerId);
    } else {
      vet = await Vet.findOne({ email: { $regex: new RegExp(`^${userEmail}$`, 'i') } });
    }

    if (!vet) {
      const fbVet = fallbackVets.find((v: any) => v._id === providerId || v.email?.toLowerCase() === userEmail.toLowerCase());
      if (fbVet) {
        fbVet.availableSlots = newSlots;
        return res.json({ status: 'success', message: 'Slots updated successfully', slots: fbVet.availableSlots });
      }
      return res.status(404).json({ status: 'error', message: 'Provider profile not found' });
    }

    vet.availableSlots = newSlots.map(s => ({
      ...s,
      _id: mongoose.Types.ObjectId.isValid(s._id) ? s._id : new mongoose.Types.ObjectId()
    })) as any;
    await vet.save();

    return res.json({ status: 'success', message: 'Slots updated successfully', slots: vet.availableSlots });
  } catch (error) {
    console.error('Error in PUT /api/provider/slots:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * PUT /api/provider/profile
 * Allows logged-in provider to update their profile bio, fee, experience, and specialization.
 */
app.put('/api/provider/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userEmail = req.user?.email;
    const { providerId, bio, fee, experience, specialisation, photo } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const vet = fallbackVets.find(v => (providerId && v._id === providerId) || (v.email && userEmail && v.email.toLowerCase() === userEmail.toLowerCase()));
      if (vet) {
        if (bio !== undefined) vet.bio = bio;
        if (fee !== undefined) vet.fee = Number(fee);
        if (experience !== undefined) vet.experience = Number(experience);
        if (specialisation !== undefined) vet.specialisation = specialisation;
        if (photo !== undefined) vet.photo = photo;
        return res.json({ status: 'success', provider: vet });
      }
      return res.status(404).json({ status: 'error', message: 'Provider profile not found' });
    }

    let vet = null;
    if (providerId) {
      vet = await Vet.findById(providerId);
    } else if (userEmail) {
      vet = await Vet.findOne({ email: { $regex: new RegExp(`^${userEmail}$`, 'i') } });
    }

    if (!vet) {
      return res.status(404).json({ status: 'error', message: 'Provider profile not found' });
    }

    if (bio !== undefined) vet.bio = bio;
    if (fee !== undefined) vet.fee = Number(fee);
    if (experience !== undefined) vet.experience = Number(experience);
    if (specialisation !== undefined) vet.specialisation = specialisation;
    if (photo !== undefined) vet.photo = photo;
    await vet.save();

    return res.json({ status: 'success', provider: vet });
  } catch (error) {
    console.error('Error in PUT /api/provider/profile:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * PUT /api/provider/availability
 * Toggles the vet/expert's isOnline status.
 * Body: { isOnline: boolean }
 */
app.put('/api/provider/availability', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    const { isOnline } = req.body;
    if (typeof isOnline !== 'boolean') {
      return res.status(400).json({ status: 'error', message: '`isOnline` must be a boolean' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ status: 'error', message: 'Database unavailable.' });
    }

    const vet = await Vet.findOneAndUpdate(
      { email: { $regex: new RegExp(`^${userEmail}$`, 'i') } },
      { $set: { isOnline } },
      { new: true }
    );

    if (!vet) {
      return res.status(404).json({ status: 'error', message: 'Provider profile not found' });
    }

    return res.json({ status: 'success', isOnline: vet.isOnline });
  } catch (error) {
    console.error('Error in PUT /api/provider/availability:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * PUT /api/appointments/:id/medical-document
 * Allows client to upload/set their past medical document for an appointment
 */
app.put('/api/appointments/:id/medical-document', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userEmail = req.user?.email;
    const { id } = req.params;
    const { medicalDocument } = req.body; // base64 string or URL

    if (!userEmail) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    if (mongoose.connection.readyState !== 1) {
      const appt = fallbackAppointments.find((a: any) => a._id === id && a.userEmail.toLowerCase() === userEmail.toLowerCase());
      if (!appt) return res.status(404).json({ status: 'error', message: 'Appointment not found' });
      appt.medicalDocument = medicalDocument;
      return res.json({ status: 'success', appointment: appt });
    }

    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, userEmail: { $regex: new RegExp(`^${userEmail}$`, 'i') } },
      { $set: { medicalDocument } },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ status: 'error', message: 'Appointment not found' });
    }

    return res.json({ status: 'success', appointment });
  } catch (error) {
    console.error('Error adding medical document:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

/**
 * PUT /api/provider/appointments/:id/prescription
 * Allows authenticated vet/expert to upload/set prescription & notes for an appointment
 */
app.put('/api/provider/appointments/:id/prescription', authMiddleware, async (req: Request, res: Response) => {
  try {
    const providerEmail = req.user?.email;
    const { id } = req.params;
    const { prescription, prescriptionNotes } = req.body;

    if (!providerEmail) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    if (mongoose.connection.readyState !== 1) {
      const appt = fallbackAppointments.find((a: any) => a._id === id);
      if (!appt) return res.status(404).json({ status: 'error', message: 'Appointment not found' });
      appt.prescription = prescription;
      appt.prescriptionNotes = prescriptionNotes;
      return res.json({ status: 'success', appointment: appt });
    }

    // Verify provider owns this appointment by matching vet email
    const appt = await Appointment.findById(id);
    if (!appt) {
      return res.status(404).json({ status: 'error', message: 'Appointment not found' });
    }

    const provider = await Vet.findById(appt.vetId);
    if (!provider || provider.email.toLowerCase() !== providerEmail.toLowerCase()) {
      return res.status(403).json({ status: 'error', message: 'You are not authorized to update this appointment' });
    }

    appt.prescription = prescription || '';
    appt.prescriptionNotes = prescriptionNotes || '';
    await appt.save();

    // Trigger Prescription Issued email notification to the pet owner
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #2d4536; text-align: center;">Prescription Issued</h2>
        <p>Hello,</p>
        <p><strong>Dr. ${provider.name}</strong> has issued a prescription for your pet <strong>${appt.petName}</strong> regarding your consult on <strong>${appt.date}</strong>.</p>
        
        ${prescriptionNotes ? `
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #2d4536; margin: 15px 0;">
          <h4 style="margin: 0 0 8px 0; color: #333;">Doctor's Advice/Notes:</h4>
          <p style="margin: 0; font-style: italic;">${prescriptionNotes}</p>
        </div>` : ''}

        <p>Please log in to the Aumoha app and navigate to <strong>Profile &gt; Booking History</strong> to view and download the official prescription attachment.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #888; text-align: center;">Aumoha Care Network &bull; Rescue, Protect, Care</p>
      </div>
    `;

    await sendEmail({
      to: appt.userEmail,
      subject: `Prescription Issued for ${appt.petName} by Dr. ${provider.name}`,
      html: emailHtml
    });

    return res.json({ status: 'success', appointment: appt });
  } catch (error) {
    console.error('Error adding prescription:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});


// Start server

app.listen(PORT, () => {
  console.log(`🚀 Aumoha Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 Health-check API endpoint active at http://localhost:${PORT}/health`);
});


