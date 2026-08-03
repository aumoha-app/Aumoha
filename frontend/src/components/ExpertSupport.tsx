'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../lib/api';
import { processRazorpayPayment } from '../lib/razorpay';
import AgoraCallModal from './AgoraCallModal';
import CallSessionButton from './CallSessionButton';
import PaymentModal from './PaymentModal';


// Interfaces matching backend models
interface Slot {
  _id: string;
  date: string;
  time: string;
  isBooked: boolean;
  bookedBy?: string;
}

interface Expert {
  _id: string;
  name: string;
  photo?: string;
  specialisation: string;
  category: string;
  specialtyTags?: string[];
  experience: number;
  fee: number;
  bio?: string;
  rating: number;
  reviewCount: number;
  isOnline: boolean;
  isApproved?: boolean;
  availableSlots: Slot[];
  email?: string;
  phone?: string;
}

interface Appointment {
  _id: string;
  userEmail: string;
  vetId: string;
  vetName: string;
  vetSpecialisation: string;
  vetPhoto?: string;
  date: string;
  time: string;
  fee: number;
  mode: 'in-clinic' | 'tele-consult';
  type: 'vet' | 'expert';
  petName: string;
  petId?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
  bookingId: string;
  createdAt: string;
}

interface ExpertSupportProps {
  setActiveTab: (tab: any) => void;
}

// Category Configuration with emojis and custom displays matching the mockup visual structure
const CATEGORY_CONFIGS: Record<string, {
  title: string;
  displayTitle: string;
  subtitle: string;
  subFilters: string[];
  color: string;
  desc: string;
  filterGroup: 'Wellness' | 'Behaviour' | 'Therapy' | 'Holistic';
  bgGradient: string;
  emoji: string;
  image: string;
  icon: React.ReactNode;
}> = {
  'Nutritionist': {
    title: 'Nutritionists',
    displayTitle: 'Nutritionist',
    subtitle: 'Custom diet formulation & healthy meal planning',
    subFilters: ['Puppy Diet', 'Weight Management', 'Raw Feeding', 'Available Today'],
    color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    bgGradient: 'bg-gradient-to-tr from-emerald-500/20 to-teal-500/10',
    desc: 'Balanced diet plans for better health.',
    filterGroup: 'Wellness',
    emoji: '🐶',
    image: '/expert_nutritionist.png',
    icon: (
      <svg className="w-5 h-5 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    )
  },
  'Animal Behaviourist': {
    title: 'Animal Behaviourists',
    displayTitle: 'Animal Behaviourist',
    subtitle: 'Canine & feline behavior rehabilitation',
    subFilters: ['Aggression', 'Separation Anxiety', 'Phobias', 'Available Today'],
    color: 'text-blue-700 bg-blue-50 border-blue-100',
    bgGradient: 'bg-gradient-to-tr from-blue-500/20 to-cyan-500/10',
    desc: 'Understand behaviour & build better bonds.',
    filterGroup: 'Behaviour',
    emoji: '🐕',
    image: '/expert_animal_behaviourist.png',
    icon: (
      <svg className="w-5 h-5 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <circle cx="9" cy="10" r="1.5" />
        <circle cx="15" cy="10" r="1.5" />
      </svg>
    )
  },
  'Trainer': {
    title: 'Professional Trainers',
    displayTitle: 'Trainer',
    subtitle: 'Obedience foundation & trick training',
    subFilters: ['Puppy Training', 'Basic Obedience', 'Leash Pulling', 'Available Today'],
    color: 'text-amber-700 bg-amber-50 border-amber-100',
    bgGradient: 'bg-gradient-to-tr from-amber-500/20 to-orange-500/10',
    desc: 'Positive training for obedience & skills.',
    filterGroup: 'Behaviour',
    emoji: '🦮',
    image: '/expert_trainer.png',
    icon: (
      <svg className="w-5 h-5 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    )
  },
  'Behaviourist': {
    title: 'Behaviour Specialists',
    displayTitle: 'Behaviourist',
    subtitle: 'Desensitization and confidence building',
    subFilters: ['Fear Desensitization', 'Socialization', 'Hyperactivity', 'Available Today'],
    color: 'text-indigo-700 bg-indigo-50 border-indigo-100',
    bgGradient: 'bg-gradient-to-tr from-indigo-500/20 to-purple-500/10',
    desc: 'Address behavioural challenges.',
    filterGroup: 'Behaviour',
    emoji: 'poodle',
    image: '/expert_behaviourist.png',
    icon: (
      <svg className="w-5 h-5 text-indigo-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    )
  },
  'Physiotherapist': {
    title: 'Physiotherapists',
    displayTitle: 'Physiotherapist',
    subtitle: 'Muscle recovery, senior comfort & massage',
    subFilters: ['Mobility', 'Injury Recovery', 'Senior Care', 'Post-Surgery'],
    color: 'text-orange-700 bg-orange-50 border-orange-100',
    bgGradient: 'bg-gradient-to-tr from-orange-500/20 to-yellow-500/10',
    desc: 'Pain relief, mobility & recovery care.',
    filterGroup: 'Therapy',
    emoji: '🐕',
    image: '/expert_physiotherapist.png',
    icon: (
      <svg className="w-5 h-5 text-orange-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  },
  'Wellness & Palliative': {
    title: 'Wellness & Palliative Care',
    displayTitle: 'Wellness & Palliative',
    subtitle: 'Senior care guidance & comfort therapy',
    subFilters: ['Hospice Setup', 'Pain Relief', 'Senior Wellness', 'Available Today'],
    color: 'text-rose-700 bg-rose-50 border-rose-100',
    bgGradient: 'bg-gradient-to-tr from-rose-500/20 to-pink-500/10',
    desc: 'Comfort, quality & holistic support.',
    filterGroup: 'Wellness',
    emoji: '🐈',
    image: '/expert_wellness.png',
    icon: (
      <svg className="w-5 h-5 text-rose-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    )
  },
  'Homeopathy Vet': {
    title: 'Homeopathic Consultants',
    displayTitle: 'Homeopathy Vet',
    subtitle: 'Natural remedies and organic treatments',
    subFilters: ['Chronic Issues', 'Herbal Treatment', 'Holistic Wellness'],
    color: 'text-lime-700 bg-lime-50 border-lime-100',
    bgGradient: 'bg-gradient-to-tr from-lime-500/20 to-emerald-500/10',
    desc: 'Natural healing with gentle care.',
    filterGroup: 'Holistic',
    emoji: '🌱',
    image: '/expert_homeopathy.png',
    icon: (
      <svg className="w-5 h-5 text-lime-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    )
  },
  'Rehab Specialist': {
    title: 'Rehabilitation Specialists',
    displayTitle: 'Rehab Specialist',
    subtitle: 'Post-injury therapeutic recoveries',
    subFilters: ['Joint Therapy', 'Laser Therapy', 'Post-Surgery Recovery'],
    color: 'text-cyan-700 bg-cyan-50 border-cyan-100',
    bgGradient: 'bg-gradient-to-tr from-cyan-500/20 to-blue-500/10',
    desc: 'Rehabilitation for injuries & surgeries.',
    filterGroup: 'Therapy',
    emoji: '🐾',
    image: '/expert_rehab.png',
    icon: (
      <svg className="w-5 h-5 text-cyan-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    )
  },
  'At-Home Support': {
    title: 'At-Home Support assistants',
    displayTitle: 'At-Home Support',
    subtitle: 'Nursing care, medication assistance & grooming support',
    subFilters: ['Medication Assist', 'Basic Nursing', 'Elderly Care', 'Available Today'],
    color: 'text-purple-700 bg-purple-50 border-purple-100',
    bgGradient: 'bg-gradient-to-tr from-purple-500/20 to-indigo-500/10',
    desc: 'Expert care in the comfort of home.',
    filterGroup: 'Wellness',
    emoji: '🐈',
    image: '/expert_athome.png',
    icon: (
      <svg className="w-5 h-5 text-purple-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  },
  'Communicator/Psychotherapist/Reiki Healing': {
    title: 'Communicators & Reiki Healers',
    displayTitle: 'Reiki Healing',
    subtitle: 'Telepathic consultations & spiritual distance healing',
    subFilters: ['Reiki Healing', 'Grief Counseling', 'Energy Balance', 'Available Today'],
    color: 'text-fuchsia-700 bg-fuchsia-50 border-fuchsia-100',
    bgGradient: 'bg-gradient-to-tr from-fuchsia-500/20 to-pink-500/10',
    desc: 'Telepathic bonds & spiritual energy healing.',
    filterGroup: 'Holistic',
    emoji: '🔮',
    image: '/expert_reiki.png',
    icon: (
      <svg className="w-5 h-5 text-fuchsia-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        <path d="M2 12h20" />
      </svg>
    )
  }
};

export default function ExpertSupport({ setActiveTab }: ExpertSupportProps) {
  const { token, user, syncProfile } = useAuth();

  // Navigation states
  const [currentView, setCurrentView] = useState<'home' | 'listing' | 'wizard' | 'confirmed' | 'admin'>('home');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('Nutritionist');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Home Filter Group: 'All' | 'Wellness' | 'Behaviour' | 'Therapy' | 'Holistic'
  const [homeGroup, setHomeGroup] = useState<'All' | 'Wellness' | 'Behaviour' | 'Therapy' | 'Holistic'>('All');

  // Listings states
  const [experts, setExperts] = useState<Expert[]>([]);
  const [listingSubFilter, setListingSubFilter] = useState<string | null>(null);
  const [isLoadingExperts, setIsLoadingExperts] = useState(false);

  // Wizard state
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [bookingMode, setBookingMode] = useState<'chat' | 'video' | 'audio' | 'in-person'>('chat');
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [concernText, setConcernText] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('Today');
  const [timeToggle, setTimeToggle] = useState<'Morning' | 'Afternoon' | 'Evening'>('Morning');
  const [selectedPetName, setSelectedPetName] = useState('');
  const [newPetInput, setNewPetInput] = useState(false);
  const [customPetName, setCustomPetName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST)');
  const [isChangingTimezone, setIsChangingTimezone] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarSelectedDay, setCalendarSelectedDay] = useState<number | null>(null);

  // Add Pet modal states mimicking profile pet management
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [isPetSaving, setIsPetSaving] = useState(false);
  const [petError, setPetError] = useState<string | null>(null);
  const [petForm, setPetForm] = useState<{
    name: string;
    type: string;
    photo: string;
    breed: string;
    age: number | undefined;
    gender: 'male' | 'female' | 'unknown';
    notes: string;
  }>({
    name: '',
    type: 'Dog',
    photo: '',
    breed: '',
    age: undefined,
    gender: 'unknown',
    notes: ''
  });


  // Post booking confirmation state
  const [confirmedAppt, setConfirmedAppt] = useState<Appointment | null>(null);
  const [showCall, setShowCall] = useState<boolean>(false);

  // Interactive Quiz Modal
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizStep, setQuizStep] = useState(1);
  const [quizAnswers, setQuizAnswers] = useState({ petType: '', challenge: '' });

  // Admin Dashboard configurations
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isAddingExpert, setIsAddingExpert] = useState(false);
  const [isEditingExpert, setIsEditingExpert] = useState<Expert | null>(null);

  // Admin form state
  const [expertFormName, setExpertFormName] = useState('');
  const [expertFormSpecialty, setExpertFormSpecialty] = useState('');
  const [expertFormCategory, setExpertFormCategory] = useState('Nutritionist');
  const [expertFormEmail, setExpertFormEmail] = useState('');
  const [expertFormPhone, setExpertFormPhone] = useState('');
  const [expertFormExp, setExpertFormExp] = useState('');
  const [expertFormFee, setExpertFormFee] = useState('');
  const [expertFormBio, setExpertFormBio] = useState('');
  const [expertFormOnline, setExpertFormOnline] = useState(false);
  const [expertFormTagsInput, setExpertFormTagsInput] = useState('');
  const [expertFormSlots, setExpertFormSlots] = useState<{ date: string; time: string }[]>([
    { date: 'Today', time: '10:00 AM' },
    { date: 'Today', time: '11:30 AM' },
    { date: 'Tomorrow', time: '02:00 PM' }
  ]);

  // Check admin role
  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/auth/admin-config`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setIsAdminUser(data.isAdmin);
        }
      })
      .catch(err => console.error('Failed to retrieve admin configuration in Expert Support:', err));
    } else {
      setIsAdminUser(false);
    }
  }, [token]);

const DEFAULT_MOCK_EXPERTS: Expert[] = [
  {
    _id: 'exp_physio_1',
    name: 'Dr. Ananya Sharma, PT',
    photo: '/expert_physiotherapist.png',
    specialisation: 'Canine Hydrotherapy & Post-Op Rehab',
    category: 'Physiotherapist',
    specialtyTags: ['Mobility', 'Joint Therapy', 'Hydrotherapy', 'Post-Op Recovery'],
    experience: 8,
    fee: 800,
    bio: 'Specialist in canine post-surgical rehabilitation, hydrotherapy, and joint mobility enhancement for senior companions.',
    rating: 4.9,
    reviewCount: 142,
    isOnline: true,
    availableSlots: [
      { _id: 's1', date: 'Today', time: '10:00 AM', isBooked: false },
      { _id: 's2', date: 'Today', time: '03:30 PM', isBooked: false },
      { _id: 's3', date: 'Tomorrow', time: '11:00 AM', isBooked: false }
    ]
  },
  {
    _id: 'exp_physio_2',
    name: 'Dr. Rohan Verma',
    photo: '/expert_rehab.png',
    specialisation: 'Senior Pet Comfort & Ortho Massage',
    category: 'Physiotherapist',
    specialtyTags: ['Senior Comfort', 'Ortho Massage', 'Injury Recovery'],
    experience: 6,
    fee: 750,
    bio: 'Certified animal physical therapist focusing on arthritis management, spinal care, and pain-relief therapeutic massage.',
    rating: 4.8,
    reviewCount: 98,
    isOnline: true,
    availableSlots: [
      { _id: 's4', date: 'Today', time: '02:00 PM', isBooked: false },
      { _id: 's5', date: 'Tomorrow', time: '10:00 AM', isBooked: false }
    ]
  },
  {
    _id: 'exp_nutri_1',
    name: 'Dr. Kavita Menon',
    photo: '/expert_nutritionist.png',
    specialisation: 'Clinical Pet Dietitian & BARF Specialist',
    category: 'Nutritionist',
    specialtyTags: ['Raw BARF Diets', 'Weight Loss', 'Allergy Management'],
    experience: 9,
    fee: 700,
    bio: 'Formulates custom home-cooked and raw meal plans for dogs and cats suffering from food allergies and chronic kidney conditions.',
    rating: 4.9,
    reviewCount: 215,
    isOnline: true,
    availableSlots: [
      { _id: 's6', date: 'Today', time: '11:00 AM', isBooked: false },
      { _id: 's7', date: 'Tomorrow', time: '04:00 PM', isBooked: false }
    ]
  },
  {
    _id: 'exp_behav_1',
    name: 'Vikramaditya Roy',
    photo: '/expert_animal_behaviourist.png',
    specialisation: 'Canine Behaviour Modification & Anxiety',
    category: 'Animal Behaviourist',
    specialtyTags: ['Aggression', 'Separation Anxiety', 'Phobias', 'Fear Desensitization'],
    experience: 11,
    fee: 900,
    bio: 'Positive-reinforcement animal psychologist specializing in severe aggression, rescue dog trauma, and reactivity.',
    rating: 4.9,
    reviewCount: 310,
    isOnline: true,
    availableSlots: [
      { _id: 's8', date: 'Today', time: '05:00 PM', isBooked: false }
    ]
  },
  {
    _id: 'exp_behav_2',
    name: 'Dr. Shalini Deshmukh',
    photo: '/expert_behaviourist.png',
    specialisation: 'Desensitization & Confidence Building',
    category: 'Behaviourist',
    specialtyTags: ['Fear Desensitization', 'Socialization', 'Hyperactivity'],
    experience: 9,
    fee: 850,
    bio: 'Specialist in fear desensitization, sound phobias, and feline/canine anxiety reduction through reward-based therapy.',
    rating: 4.8,
    reviewCount: 175,
    isOnline: true,
    availableSlots: [
      { _id: 's8b', date: 'Today', time: '02:00 PM', isBooked: false },
      { _id: 's8c', date: 'Tomorrow', time: '11:30 AM', isBooked: false }
    ]
  },
  {
    _id: 'exp_well_1',
    name: 'Dr. Aarav Patel',
    photo: '/expert_wellness.png',
    specialisation: 'Senior Care Guidance & Palliative Therapy',
    category: 'Wellness & Palliative',
    specialtyTags: ['Hospice Setup', 'Pain Relief', 'Senior Wellness'],
    experience: 12,
    fee: 780,
    bio: 'Compassionate senior pet care specialist focused on pain management, hospice setup, and quality-of-life optimization.',
    rating: 4.9,
    reviewCount: 210,
    isOnline: true,
    availableSlots: [
      { _id: 's8d', date: 'Today', time: '04:00 PM', isBooked: false }
    ]
  },
  {
    _id: 'exp_trainer_1',
    name: 'Rajesh Nair',
    photo: '/expert_trainer.png',
    specialisation: 'Obedience Foundation & Puppy Manners',
    category: 'Trainer',
    specialtyTags: ['Puppy Training', 'Basic Obedience', 'Leash Pulling'],
    experience: 7,
    fee: 650,
    bio: 'Professional obedience coach focusing on positive leash work, recall, potty training, and trick learning.',
    rating: 4.8,
    reviewCount: 180,
    isOnline: true,
    availableSlots: [
      { _id: 's9', date: 'Tomorrow', time: '09:00 AM', isBooked: false }
    ]
  },
  {
    _id: 'exp_homeo_1',
    name: 'Dr. Meera Iyer',
    photo: '/expert_homeopathy.png',
    specialisation: 'Holistic Veterinary Medicine & Herbal Care',
    category: 'Homeopathy Vet',
    specialtyTags: ['Chronic Issues', 'Herbal Treatment', 'Holistic Wellness'],
    experience: 12,
    fee: 750,
    bio: 'Gentle, natural homeopathic remedies for chronic skin issues, immune support, and age-related vitality.',
    rating: 4.9,
    reviewCount: 165,
    isOnline: true,
    availableSlots: [
      { _id: 's10', date: 'Today', time: '12:00 PM', isBooked: false }
    ]
  },
  {
    _id: 'exp_rehab_1',
    name: 'Dr. Sameer Joshi',
    photo: '/expert_rehab.png',
    specialisation: 'Post-Surgery & Joint Recovery',
    category: 'Rehab Specialist',
    specialtyTags: ['Joint Therapy', 'Laser Therapy', 'Post-Surgery Recovery'],
    experience: 10,
    fee: 850,
    bio: 'Specialized laser therapy and muscle rebuilding for pets recovering from cruciate ligament and spinal surgeries.',
    rating: 4.9,
    reviewCount: 125,
    isOnline: true,
    availableSlots: [
      { _id: 's11', date: 'Tomorrow', time: '03:00 PM', isBooked: false }
    ]
  },
  {
    _id: 'exp_athome_1',
    name: 'Pooja Hegde, RVT',
    photo: '/expert_athome.png',
    specialisation: 'At-Home Nursing & Geriatric Care',
    category: 'At-Home Support',
    specialtyTags: ['Medication Assist', 'Basic Nursing', 'Elderly Care'],
    experience: 5,
    fee: 500,
    bio: 'Registered veterinary technician offering home visits for injections, fluid therapy, bandaging, and senior pet care.',
    rating: 4.8,
    reviewCount: 92,
    isOnline: true,
    availableSlots: [
      { _id: 's12', date: 'Today', time: '02:30 PM', isBooked: false }
    ]
  },
  {
    _id: 'exp_reiki_1',
    name: 'Sunita Chawla',
    photo: '/expert_reiki.png',
    specialisation: 'Intuitive Animal Communicator & Reiki Master',
    category: 'Communicator/Psychotherapist/Reiki Healing',
    specialtyTags: ['Reiki Healing', 'Grief Counseling', 'Energy Balance'],
    experience: 14,
    fee: 800,
    bio: 'Telepathic animal communicator and Reiki master helping pet parents understand behavioral shifts and emotional well-being.',
    rating: 4.9,
    reviewCount: 240,
    isOnline: true,
    availableSlots: [
      { _id: 's13', date: 'Tomorrow', time: '04:30 PM', isBooked: false }
    ]
  }
];

  // Fetch experts list
  const fetchExperts = async () => {
    setIsLoadingExperts(true);
    try {
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE}/vets`, { headers });
      const data = await res.json();
      if (res.ok) {
        const allVets = data.vets || [];
        const fetchedExperts = allVets.filter((v: any) => v.category !== 'vet');
        
        // Merge fetched experts with default mock experts so every category has active specialists
        const combined = [...fetchedExperts];
        DEFAULT_MOCK_EXPERTS.forEach(mockExp => {
          if (!combined.some(e => e._id === mockExp._id || (e.name === mockExp.name && e.category === mockExp.category))) {
            combined.push(mockExp);
          }
        });
        setExperts(combined);
      } else {
        setExperts(DEFAULT_MOCK_EXPERTS);
      }
    } catch (err) {
      console.error('Error fetching experts:', err);
      setExperts(DEFAULT_MOCK_EXPERTS);
    } finally {
      setIsLoadingExperts(false);
    }
  };

  // Admin Credentials Verification
  const verifyAdminPass = async (pass: string) => {
    setAdminError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password: pass })
      });
      if (res.ok) {
        setIsAdminAuthenticated(true);
        setAdminPassword(pass);
        sessionStorage.setItem('aumoha_admin_password', pass);
      } else {
        setAdminError('Invalid Admin Passcode');
      }
    } catch (err) {
      setAdminError('Could not verify credentials.');
    }
  };

  useEffect(() => {
    fetchExperts();
    const cachedPass = sessionStorage.getItem('aumoha_admin_password');
    if (cachedPass) {
      verifyAdminPass(cachedPass);
    }
  }, [token]);

  useEffect(() => {
    if (user?.pets && user.pets.length > 0) {
      setSelectedPetName(user.pets[0].name);
    }
  }, [user]);

  // Compute filtered categories for Home Screen 3-column grid
  const filteredCategoryKeys = Object.keys(CATEGORY_CONFIGS).filter(key => {
    const config = CATEGORY_CONFIGS[key];
    const matchesGroup = homeGroup === 'All' ? true : config.filterGroup === homeGroup;
    const matchesSearch = key.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          config.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  // Category Listing experts list
  const activeCategoryConfig = CATEGORY_CONFIGS[selectedCategoryKey];
  const listedExperts = experts.filter(exp => {
    const isThisCategory = 
      exp.category === selectedCategoryKey ||
      (selectedCategoryKey.includes('Behaviour') && exp.category.includes('Behaviour')) ||
      (selectedCategoryKey.includes('Wellness') && exp.category.includes('Wellness')) ||
      (selectedCategoryKey.includes('Reiki') && exp.category.includes('Reiki'));
    if (!isThisCategory) return false;
    
    if (listingSubFilter) {
      if (listingSubFilter === 'Available Today') {
        return exp.availableSlots.some(s => s.date === 'Today' && !s.isBooked);
      }
      return exp.specialtyTags?.includes(listingSubFilter);
    }
    return true;
  });

  // Action: Launch Quiz
  const handleStartQuiz = () => {
    setQuizStep(1);
    setQuizAnswers({ petType: '', challenge: '' });
    setIsQuizOpen(true);
  };

  // Action: Submit Quiz
  const handleQuizAnswer = (field: string, val: string) => {
    const updated = { ...quizAnswers, [field]: val };
    setQuizAnswers(updated);
    if (quizStep === 1) {
      setQuizStep(2);
    } else {
      setIsQuizOpen(false);
      let targetCategory = 'Nutritionist';
      if (updated.challenge === 'eating') targetCategory = 'Nutritionist';
      else if (updated.challenge === 'aggression') targetCategory = 'Animal Behaviourist';
      else if (updated.challenge === 'obedience') targetCategory = 'Trainer';
      else if (updated.challenge === 'mobility') targetCategory = 'Physiotherapist';
      else if (updated.challenge === 'anxiety') targetCategory = 'Behaviourist';
      else if (updated.challenge === 'recovery') targetCategory = 'Rehab Specialist';
      else if (updated.challenge === 'chronic') targetCategory = 'Homeopathy Vet';
      
      setSelectedCategoryKey(targetCategory);
      setListingSubFilter(null);
      setCurrentView('listing');
    }
  };

  // Action: Pick expert to start wizard
  const handleSelectExpert = (exp: Expert) => {
    setSelectedExpert(exp);
    setSelectedSlot(null);
    setWizardStep(2);
    setCurrentView('wizard');
  };

  // Action: Final Confirmed Booking Post API
  const handleConfirmBooking = async () => {
    if (!token || !selectedExpert || !selectedSlot) return;

    const petName = newPetInput ? customPetName : selectedPetName;
    if (!petName.trim()) {
      alert('Please specify your pet’s name.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vetId: selectedExpert._id,
          slotId: selectedSlot._id,
          mode: bookingMode === 'in-person' ? 'in-clinic' : 'tele-consult',
          petName: petName.trim(),
          type: 'expert'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setConfirmedAppt(data.appointment);
        setWizardStep(6);
        setCurrentView('confirmed');
        fetchExperts();
      } else {
        alert(data.message || 'Failed to confirm expert booking.');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error confirming reservation.');
    }
  };



  // Admin Specialist Form Action
  const handleSaveExpert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !expertFormName || !expertFormExp || !expertFormFee) return;

    const specialtyTagsArray = expertFormTagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const body = {
      name: expertFormName,
      specialisation: expertFormSpecialty || `${expertFormCategory} Specialist`,
      category: expertFormCategory,
      specialtyTags: specialtyTagsArray,
      experience: Number(expertFormExp),
      fee: Number(expertFormFee),
      bio: expertFormBio,
      isOnline: expertFormOnline,
      availableSlots: expertFormSlots,
      email: expertFormEmail,
      phone: expertFormPhone
    };

    try {
      const method = isEditingExpert ? 'PUT' : 'POST';
      const endpoint = isEditingExpert 
        ? `${API_BASE}/vets/${isEditingExpert._id}` 
        : `${API_BASE}/vets`;

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-admin-password': adminPassword
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setIsAddingExpert(false);
        setIsEditingExpert(null);
        resetExpertForm();
        fetchExperts();
      } else {
        const d = await res.json();
        alert(d.message || 'Action failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating expert registry.');
    }
  };

  const handleEditExpertClick = (exp: Expert) => {
    setIsEditingExpert(exp);
    setExpertFormName(exp.name);
    setExpertFormSpecialty(exp.specialisation);
    setExpertFormCategory(exp.category);
    setExpertFormEmail(exp.email || '');
    setExpertFormPhone(exp.phone || '');
    setExpertFormExp(String(exp.experience));
    setExpertFormFee(String(exp.fee));
    setExpertFormBio(exp.bio || '');
    setExpertFormOnline(exp.isOnline);
    setExpertFormTagsInput(exp.specialtyTags?.join(', ') || '');
    setExpertFormSlots(exp.availableSlots.map(s => ({ date: s.date, time: s.time })));
    setIsAddingExpert(true);
  };

  const handleDeleteExpert = async (id: string) => {
    if (!token) return;
    const confirm = window.confirm('Are you sure you want to remove this specialist profile?');
    if (!confirm) return;

    try {
      const res = await fetch(`${API_BASE}/vets/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-admin-password': adminPassword
        }
      });
      if (res.ok) {
        fetchExperts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleApproveExpert = async (exp: Expert) => {
    if (!token) return;
    const currentApproval = exp.isApproved !== false;
    const nextApproval = !currentApproval;
    const confirm = window.confirm(`Are you sure you want to ${nextApproval ? 'approve' : 'unapprove'} ${exp.name}?`);
    if (!confirm) return;

    try {
      const res = await fetch(`${API_BASE}/vets/${exp._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({
          isApproved: nextApproval
        })
      });
      if (res.ok) {
        fetchExperts();
      } else {
        const d = await res.json();
        alert(d.message || 'Action failed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetExpertForm = () => {
    setExpertFormName('');
    setExpertFormSpecialty('');
    setExpertFormCategory('Nutritionist');
    setExpertFormEmail('');
    setExpertFormPhone('');
    setExpertFormExp('');
    setExpertFormFee('');
    setExpertFormBio('');
    setExpertFormOnline(false);
    setExpertFormTagsInput('');
    setExpertFormSlots([
      { date: 'Today', time: '10:00 AM' },
      { date: 'Today', time: '11:30 AM' },
      { date: 'Tomorrow', time: '02:00 PM' }
    ]);
  };

  const handleDownloadCalendarInvite = () => {
    if (!confirmedAppt) return;
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:Aumoha Expert Consult - ${confirmedAppt.vetName}\nDESCRIPTION:Expert consultation for ${confirmedAppt.petName} (${confirmedAppt.vetSpecialisation})\nDTSTART:20260715T100000\nDURATION:PT1H\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `appointment_${confirmedAppt.bookingId}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="w-full max-w-2xl mx-auto bg-[#FAF8F5] rounded-[28px] overflow-hidden shadow-sm transition-all duration-300 font-sans text-charcoal flex flex-col min-h-[80vh]">
      {/* Full-Bleed Hero Banner covering complete top */}
      <div className="relative">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#FAF8F5] via-[#EFEBE3] to-[#E8E3DA]">
          {/* Top smudge fade into page canvas */}
          <div className="absolute top-0 left-0 right-0 h-7 bg-gradient-to-b from-[#FAF8F5] via-[#FAF8F5]/50 to-transparent z-10 pointer-events-none" />

          <div className="flex items-stretch min-h-[210px] md:min-h-[240px]">
            {/* Left: Text Content */}
            <div className="flex-1 flex flex-col justify-center gap-3 px-5 md:px-8 py-6 z-10">
              {/* Back button */}
              <button 
                onClick={() => {
                  if (currentView === 'listing') {
                    setCurrentView('home');
                  } else if (currentView === 'wizard') {
                    setCurrentView('listing');
                  } else if (currentView === 'confirmed' || currentView === 'admin') {
                    setCurrentView('home');
                  } else {
                    setActiveTab('home');
                  }
                }} 
                className="w-9 h-9 rounded-full border border-[#2D4536]/15 bg-white/70 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors cursor-pointer mb-1"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-600">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <h2 className="font-serif text-xl md:text-2xl text-[#1C1A17] leading-[1.15] font-semibold tracking-tight">
                Expert Support and Specialist Advice
              </h2>
              <p className="max-w-[260px] text-[11px] md:text-xs text-stone-500 font-medium leading-relaxed">
                Verified behaviorists, dietitians, trainers and therapists for every pet need.
              </p>
            </div>

            {/* Right: Hero Image */}
            <div className="w-[45%] md:w-[35%] relative shrink-0 flex items-end justify-end overflow-hidden">
              {/* Top smudge overlay specifically over image */}
              <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-[#FAF8F5] via-[#FAF8F5]/70 to-transparent z-10 pointer-events-none" />
              <img
                src="/expert_care_pet_hero.png"
                alt="Expert Support Pet Hero"
                className="w-full h-full object-contain object-right-bottom translate-y-0.5"
              />
            </div>
          </div>

          {/* Bottom fade into content area background */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#FAF8F5] to-transparent" />
        </div>
      </div>

      {/* Main Content Area with Horizontal Padding */}
      <div className="px-4 md:px-8 pt-2 pb-8 flex flex-col gap-6">

      {/* ==================== SCREEN 1: EXPERT SUPPORT HOME ==================== */}
      {currentView === 'home' && (
        <div className="flex flex-col gap-5 w-full animate-fadeIn">
          
          {/* SEARCH BAR + FILTER */}
          <div className="flex gap-2 w-full">
            <div className="relative flex-grow">
              <input 
                type="text"
                placeholder="Search experts or services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#F0EBE1] rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#2D4536]/40 shadow-sm"
              />
              <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            
            <button 
              onClick={() => handleStartQuiz()}
              className="px-4 bg-[#1C1A17] hover:bg-stone-800 text-white text-[11px] font-extrabold rounded-2xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              ✨ Quiz
            </button>
          </div>

          {/* CATEGORY FILTER CHIPS */}
          <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-hide select-none">
            {(['All', 'Wellness', 'Behaviour', 'Therapy', 'Holistic'] as const).map(grp => (
              <button
                key={grp}
                onClick={() => setHomeGroup(grp)}
                className={`px-4 py-2 border rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer active:scale-95 shadow-xs flex items-center gap-1.5 ${
                  homeGroup === grp 
                    ? 'bg-[#1C1A17] border-[#1C1A17] text-white shadow-sm' 
                    : 'bg-white border-[#F0EBE1] text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                {grp}
              </button>
            ))}
          </div>

          {/* 3-COLUMN CATEGORY GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
            {filteredCategoryKeys.map(catKey => {
              const conf = CATEGORY_CONFIGS[catKey];
              const displayTitle = conf.displayTitle || catKey;
              return (
                <div 
                  key={catKey}
                  onClick={() => {
                    setSelectedCategoryKey(catKey);
                    setListingSubFilter(null);
                    setCurrentView('listing');
                  }}
                  className="bg-white border border-[#F0EBE1] rounded-[24px] p-5 cursor-pointer shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-[160px] hover:scale-[1.02] group"
                >
                  <div className="flex flex-col gap-1 z-10 w-[58%]">
                    <div>
                      {/* Title and Description */}
                      <h4 className="text-xs font-bold font-serif text-charcoal leading-tight group-hover:text-[#2D4536] transition-colors">
                        {displayTitle}
                      </h4>
                      <p className="text-[10px] text-stone-500 font-semibold leading-relaxed mt-1 line-clamp-2">
                        {conf.desc}
                      </p>
                    </div>
                  </div>

                  {/* Circular Chevron icon */}
                  <div className="w-7 h-7 rounded-full bg-white border border-[#2D4536]/20 flex items-center justify-center text-[#2D4536] shadow-xs group-hover:bg-[#E8F0EA] z-10 transition-all mt-auto">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>

                  {/* Right side high-quality transparent image of the pet */}
                  <div className="absolute right-0 bottom-0 w-28 h-28 xs:w-32 xs:h-32 md:w-28 md:h-28 max-w-[48%] pointer-events-none select-none z-0 overflow-hidden flex items-end justify-end">
                    <img 
                      src={conf.image} 
                      alt={displayTitle} 
                      className="w-full h-full object-contain object-right-bottom transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </div>
              );
            })}
            {filteredCategoryKeys.length === 0 && (
              <div className="col-span-full text-center py-10 text-xs text-stone-400 font-semibold bg-white border border-dashed border-[#F0EBE1] rounded-3xl">
                No matching expert categories found.
              </div>
            )}
          </div>



        </div>
      )}

      {/* INTERACTIVE MATCH QUIZ DIALOG */}
      {isQuizOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-end md:items-center justify-center px-4 transition-all">
          <div className="bg-white rounded-t-3xl md:rounded-3xl p-6 w-full max-w-sm flex flex-col gap-5 shadow-xl border border-warmBeige animate-scaleIn">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <h3 className="text-xs font-extrabold text-stone-500 uppercase tracking-wider">Find My Expert Quiz</h3>
              <button 
                onClick={() => setIsQuizOpen(false)}
                className="text-stone-400 hover:text-stone-600 font-extrabold text-xs px-1"
              >
                ✕
              </button>
            </div>

            {quizStep === 1 ? (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-stone-600">Step 1: What type of pet do you have?</span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button 
                    onClick={() => handleQuizAnswer('petType', 'dog')}
                    className="p-3 border border-[#F0EBE1] hover:border-terracotta rounded-xl text-xs font-bold text-center bg-[#FCFAF7] hover:bg-white"
                  >
                    Dog
                  </button>
                  <button 
                    onClick={() => handleQuizAnswer('petType', 'cat')}
                    className="p-3 border border-[#F0EBE1] hover:border-terracotta rounded-xl text-xs font-bold text-center bg-[#FCFAF7] hover:bg-white"
                  >
                    Cat
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-stone-600">Step 2: What is the main concern or challenge?</span>
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'Eating Habits & Diet', val: 'eating' },
                    { label: 'Aggression or Lashing out', val: 'aggression' },
                    { label: 'Basic Training & Obedience', val: 'obedience' },
                    { label: 'Mobility & Post-injury rehab', val: 'mobility' },
                    { label: 'Fear & Separation Anxiety', val: 'anxiety' },
                    { label: 'Natural & Holistic remedies', val: 'chronic' }
                  ].map(ch => (
                    <button 
                      key={ch.val}
                      onClick={() => handleQuizAnswer('challenge', ch.val)}
                      className="p-2.5 border border-[#F0EBE1] hover:border-terracotta rounded-xl text-xs font-bold text-left bg-[#FCFAF7] hover:bg-white"
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== SCREEN 2: CONFIG-DRIVEN CATEGORY LISTING PAGE ==================== */}
      {currentView === 'listing' && activeCategoryConfig && (
        <div className="flex flex-col gap-5 w-full animate-fadeIn">
          
          {/* CATEGORY HERO BANNER HEADER */}
          <div className="bg-white border border-[#F0EBE1] rounded-[28px] p-5 md:p-6 shadow-sm flex items-center justify-between gap-4">
            <div className="flex flex-col items-start min-w-0">
              <span className="text-[10px] bg-[#E8F0EA] border border-[#2D4536]/20 text-[#2D4536] font-extrabold uppercase rounded-full px-3 py-1 tracking-wider shadow-3xs">
                Specialist Directory
              </span>
              <h2 className="text-xl md:text-2xl font-serif text-charcoal font-normal mt-2 leading-tight">
                {activeCategoryConfig.displayTitle}
              </h2>
              <p className="text-xs text-stone-500 font-medium mt-1 leading-relaxed">
                {activeCategoryConfig.subtitle}
              </p>
            </div>
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#E8F0EA] border border-[#2D4536]/20 flex items-center justify-center shrink-0 shadow-sm text-[#2D4536]">
              {activeCategoryConfig.icon}
            </div>
          </div>

          {/* CATEGORY-SPECIFIC SUB-FILTER CHIPS */}
          <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-hide select-none">
            <button
              onClick={() => setListingSubFilter(null)}
              className={`px-4 py-2 border rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer active:scale-95 shadow-xs ${
                listingSubFilter === null 
                  ? 'bg-[#2D4536] border-[#2D4536] text-white shadow-sm' 
                  : 'bg-white border-[#F0EBE1] text-stone-600 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
              All Focuses
            </button>
            {activeCategoryConfig.subFilters.map(subF => (
              <button
                key={subF}
                onClick={() => setListingSubFilter(subF)}
                className={`px-4 py-2 border rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer active:scale-95 shadow-xs ${
                  listingSubFilter === subF
                    ? 'bg-[#2D4536] border-[#2D4536] text-white shadow-sm' 
                    : 'bg-white border-[#F0EBE1] text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                {subF}
              </button>
            ))}
          </div>

          {/* EXPERT CARDS list with flexible design variants */}
          <div className="flex flex-col gap-4 w-full">
            {isLoadingExperts ? (
              <div className="w-full text-center py-10 text-xs text-stone-500 font-semibold">Loading specialists...</div>
            ) : listedExperts.length === 0 ? (
              <div className="w-full text-center py-12 text-xs text-stone-400 font-semibold bg-white border border-dashed border-[#F0EBE1] rounded-[24px]">
                No active experts currently registered for this category focus.
              </div>
            ) : listedExperts.map((exp, index) => {
              const isTagForwardVariant = index % 2 === 0;
              const photoUrl = exp.photo || (exp as any).image || (exp as any).avatar || (exp as any).profilePic;

              return (
                <div 
                  key={exp._id}
                  className="bg-white border border-[#F0EBE1] hover:border-[#2D4536]/30 hover:shadow-[0_8px_30px_rgba(45,69,54,0.06)] rounded-[28px] p-5 md:p-6 flex flex-col gap-4 shadow-sm transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3.5">
                      {/* Avatar with responsive photo & initials fallback */}
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-[#E8F0EA] border border-[#2D4536]/20 relative shrink-0 flex items-center justify-center shadow-xs">
                        {photoUrl ? (
                          <img 
                            src={photoUrl} 
                            alt={exp.name} 
                            className={`w-full h-full ${photoUrl.includes('expert_') || photoUrl.includes('.png') ? 'object-contain p-1' : 'object-cover'} rounded-2xl`}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                              const fallbackEl = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                              if (fallbackEl) fallbackEl.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-full h-full bg-gradient-to-br from-[#E8F0EA] to-[#D4E4D7] flex items-center justify-center text-[#2D4536] font-extrabold text-sm sm:text-base ${
                            photoUrl ? 'hidden' : 'flex'
                          }`}
                        >
                          {exp.name ? exp.name.charAt(0).toUpperCase() : 'E'}
                        </div>
                        {exp.isOnline && (
                          <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></span>
                        )}
                      </div>

                      {/* Bio Details */}
                      <div>
                        <h4 className="text-sm md:text-base font-bold text-charcoal flex items-center gap-1.5 leading-snug">
                          {exp.name}
                          <svg className="w-4 h-4 text-[#2D4536] fill-current" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        </h4>
                        <span className="text-xs text-stone-500 font-semibold block mt-0.5">{exp.specialisation}</span>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-stone-500">
                          <span className="text-amber-500 font-bold">★</span>
                          <strong className="text-charcoal font-extrabold">{exp.rating}</strong>
                          <span>({exp.reviewCount} sessions)</span>
                          <span>•</span>
                          <span>{exp.experience} yrs exp</span>
                        </div>
                      </div>
                    </div>

                    {/* Price Tag styling */}
                    {!isTagForwardVariant && (
                      <div className="text-right flex flex-col items-end gap-0.5 shrink-0">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Starts at</span>
                        <span className="text-base font-extrabold text-[#2D4536]">₹{exp.fee}</span>
                      </div>
                    )}
                  </div>

                  {exp.bio && (
                    <p className="text-xs md:text-sm text-stone-600 leading-relaxed font-medium pl-3 border-l-2 border-[#2D4536]/40">
                      {exp.bio}
                    </p>
                  )}

                  {/* Specialty Tags */}
                  <div className="flex flex-wrap gap-2 select-none">
                    {exp.specialtyTags && exp.specialtyTags.map((tag, tIdx) => (
                      <span 
                        key={tag} 
                        className={`text-[11px] md:text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
                          tIdx === 1
                            ? 'bg-[#E8F0EA] border-[#2D4536]/20 text-[#2D4536]'
                            : 'bg-white border-[#F0EBE1] text-stone-600'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action CTA */}
                  <div className="flex justify-between items-center pt-3.5 border-t border-stone-100 mt-1 flex-wrap gap-3">
                    <div className="text-left flex flex-col">
                      <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Consultation Fee</span>
                      <span className="text-sm md:text-base font-extrabold text-charcoal">₹{exp.fee} / session</span>
                    </div>
                    <button
                      onClick={() => handleSelectExpert(exp)}
                      className="px-6 py-2.5 bg-[#2D4536] hover:bg-[#1E2E24] text-white text-xs md:text-sm font-bold rounded-full transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
                    >
                      View Profile & Book
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ==================== SCREEN 3: BOOKING FORM SHEET ==================== */}
      {currentView === 'wizard' && selectedExpert && (() => {
        const availableSlots = selectedExpert.availableSlots 
          ? selectedExpert.availableSlots.filter(s => !s.isBooked) 
          : [];

        // Calendar helpers
        const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const dayNames = ['Su','Mo','Tu','We','Th','Fr','Sa'];
        const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
        const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();
        const today = new Date();
        const isCurrentMonth = calendarMonth === today.getMonth() && calendarYear === today.getFullYear();
        const todayDate = today.getDate();

        // Build slots lookup by date string for the calendar dots
        const slotDateStrings = new Set(availableSlots.map(s => s.date));
        const hasSlotOnDay = (day: number) => {
          // Check common date label formats
          const dateObj = new Date(calendarYear, calendarMonth, day);
          const labels = ['Today', 'Tomorrow'];
          const todayObj = new Date();
          const tomorrowObj = new Date(); tomorrowObj.setDate(todayObj.getDate() + 1);
          if (dateObj.toDateString() === todayObj.toDateString() && slotDateStrings.has('Today')) return true;
          if (dateObj.toDateString() === tomorrowObj.toDateString() && slotDateStrings.has('Tomorrow')) return true;
          // Also check formatted strings
          const formatted = `${dateObj.getDate()} ${monthNames[dateObj.getMonth()].slice(0,3)}`;
          if (slotDateStrings.has(formatted)) return true;
          return slotDateStrings.has(dateObj.toLocaleDateString());
        };

        // Get label for selected calendar day
        const getDateLabel = (day: number) => {
          const dateObj = new Date(calendarYear, calendarMonth, day);
          const todayObj = new Date();
          const tomorrowObj = new Date(); tomorrowObj.setDate(todayObj.getDate() + 1);
          if (dateObj.toDateString() === todayObj.toDateString()) return 'Today';
          if (dateObj.toDateString() === tomorrowObj.toDateString()) return 'Tomorrow';
          return `${day} ${monthNames[calendarMonth].slice(0,3)}`;
        };

        const activeDateLabel = calendarSelectedDay ? getDateLabel(calendarSelectedDay) : (availableSlots[0]?.date || 'Today');
        const slotsForActiveDate = availableSlots.filter(s => s.date === activeDateLabel);

        const prevMonth = () => {
          if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); }
          else setCalendarMonth(calendarMonth - 1);
        };
        const nextMonth = () => {
          if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); }
          else setCalendarMonth(calendarMonth + 1);
        };

        return (
          <div className="w-full max-w-[860px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4 animate-fadeIn select-none text-left">
            
            {/* ─── LEFT COLUMN ─── */}
            <div className="flex flex-col gap-4">
              
              {/* ── Section 1: Session Mode ── */}
              <div className="bg-white border border-[#EBE3D5] rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 pt-4 pb-2">
                  <h3 className="text-[12px] font-extrabold text-charcoal uppercase tracking-wider">Session Mode</h3>
                </div>
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-[#FAF8F5] border border-[#F0EBE1] rounded-xl">
                    {[
                      { 
                        mode: 'chat', 
                        label: 'Chat', 
                        icon: (
                          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        ) 
                      },
                      { 
                        mode: 'video', 
                        label: 'Video', 
                        icon: (
                          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="23 7 16 12 23 17 23 7" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                          </svg>
                        ) 
                      },
                      { 
                        mode: 'audio', 
                        label: 'Voice', 
                        icon: (
                          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                        ) 
                      },
                      { 
                        mode: 'in-person', 
                        label: 'Clinic', 
                        icon: (
                          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 21h18" />
                            <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                            <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
                            <path d="M10 9h4" />
                            <path d="M12 7v4" />
                          </svg>
                        ) 
                      }
                    ].map(m => (
                      <button
                        key={m.mode}
                        type="button"
                        onClick={() => setBookingMode(m.mode as any)}
                        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-all ${
                          bookingMode === m.mode
                            ? 'bg-white text-terracotta shadow-sm border border-[#EBE3D5]'
                            : 'text-stone-500 hover:text-charcoal hover:bg-white/60'
                        }`}
                      >
                        {m.icon}
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Section 2: Pet & Concerns ── */}
              <div className="bg-white border border-[#EBE3D5] rounded-2xl shadow-sm overflow-hidden">
                {/* Pet Selection */}
                <div className="px-5 pt-4 pb-3 border-b border-stone-100/60">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-[12px] font-extrabold text-charcoal uppercase tracking-wider">Your Pet</h3>
                    <button 
                      type="button"
                      onClick={() => {
                        setPetError(null);
                        setPetForm({
                          name: '',
                          type: 'Dog',
                          photo: '',
                          breed: '',
                          age: undefined,
                          gender: 'unknown',
                          notes: ''
                        });
                        setIsPetModalOpen(true);
                      }}
                      className="text-[10px] font-bold text-terracotta hover:underline"
                    >
                      + Add New Pet
                    </button>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
                    {user?.pets && user.pets.map((pet: any) => (
                      <button
                        key={pet._id}
                        type="button"
                        onClick={() => setSelectedPetName(pet.name)}
                        className={`px-3.5 py-1.5 border rounded-lg text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                          selectedPetName === pet.name 
                            ? 'bg-[#FAF2EE] border-terracotta/50 text-terracotta' 
                            : 'bg-[#FAF8F5] border-[#F0EBE1] text-stone-600 hover:border-stone-300'
                        }`}
                      >
                        {pet.name}
                      </button>
                    ))}
                    {(!user?.pets || user.pets.length === 0) && (
                      <span className="text-[10px] text-stone-400 italic py-1">No pets registered. Add a pet above.</span>
                    )}
                  </div>
                </div>


                {/* Concerns */}
                <div className="px-5 pt-3 pb-4">
                  <h3 className="text-[12px] font-extrabold text-charcoal uppercase tracking-wider mb-2.5">Concerns</h3>
                  
                  <div className="flex flex-wrap gap-1.5 select-none">
                    {['Anxiety', 'Aggression', 'Hyperactivity', 'Eating habits', 'Injury recovery', 'Grooming', 'Post-Surgery', 'Diet plan'].map(tag => {
                      const isSelected = selectedConcerns.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedConcerns(selectedConcerns.filter(t => t !== tag));
                            } else {
                              setSelectedConcerns([...selectedConcerns, tag]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            isSelected 
                              ? 'bg-[#FAF2EE] border-terracotta/40 text-terracotta' 
                              : 'bg-[#FAF8F5] border-[#F0EBE1] text-stone-500 hover:border-stone-300'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>

                  <textarea
                    rows={2}
                    value={concernText}
                    onChange={(e) => setConcernText(e.target.value)}
                    placeholder="Additional notes or symptoms..."
                    className="w-full mt-3 bg-[#FAF8F5] border border-[#F0EBE1] rounded-xl p-3 text-[11px] font-semibold text-charcoal focus:outline-none focus:border-terracotta/40 placeholder:text-stone-400 resize-none"
                  />
                </div>
              </div>

              {/* ── Section 3: Calendar & Time Slots ── */}
              <div className="bg-white border border-[#EBE3D5] rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 pt-4 pb-2">
                  <h3 className="text-[12px] font-extrabold text-charcoal uppercase tracking-wider">Schedule</h3>
                </div>
                
                {/* Calendar */}
                <div className="px-5 pb-4 pt-1">
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-3">
                    <button 
                      type="button" 
                      onClick={prevMonth}
                      className="w-7 h-7 rounded-lg border border-[#F0EBE1] bg-[#FAF8F5] flex items-center justify-center text-stone-500 hover:bg-stone-100 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="text-[13px] font-extrabold text-charcoal">{monthNames[calendarMonth]} {calendarYear}</span>
                    <button 
                      type="button" 
                      onClick={nextMonth}
                      className="w-7 h-7 rounded-lg border border-[#F0EBE1] bg-[#FAF8F5] flex items-center justify-center text-stone-500 hover:bg-stone-100 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>

                  {/* Day Headers */}
                  <div className="grid grid-cols-7 mb-1">
                    {dayNames.map(d => (
                      <span key={d} className="text-center text-[9px] font-bold text-stone-400 uppercase py-1">{d}</span>
                    ))}
                  </div>

                  {/* Day Grid */}
                  <div className="grid grid-cols-7 gap-y-0.5">
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <span key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const isPast = isCurrentMonth && day < todayDate;
                      const isToday = isCurrentMonth && day === todayDate;
                      const isSelected = calendarSelectedDay === day;
                      const hasSlot = hasSlotOnDay(day);
                      
                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={isPast}
                          onClick={() => {
                            setCalendarSelectedDay(day);
                            const label = getDateLabel(day);
                            setSelectedDate(label);
                            const firstSlot = availableSlots.find(s => s.date === label);
                            if (firstSlot) setSelectedSlot(firstSlot);
                          }}
                          className={`relative w-full aspect-square flex items-center justify-center rounded-lg text-[10px] font-bold transition-all ${
                            isPast 
                              ? 'text-stone-300 cursor-default'
                              : isSelected
                                ? 'bg-terracotta text-white shadow-sm'
                                : isToday
                                  ? 'bg-[#FAF2EE] text-terracotta border border-terracotta/30'
                                  : 'text-charcoal hover:bg-stone-50 cursor-pointer'
                          }`}
                        >
                          {day}
                          {hasSlot && !isSelected && (
                            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 mt-2.5 pt-2 border-t border-stone-100/60">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[9px] font-semibold text-stone-400">Slots available</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-terracotta/10 border border-terracotta/30" />
                      <span className="text-[9px] font-semibold text-stone-400">Today</span>
                    </div>
                  </div>
                </div>

                {/* Time Slots */}
                <div className="px-5 pb-4 pt-3 border-t border-stone-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[12px] font-extrabold text-charcoal uppercase tracking-wider">
                      {calendarSelectedDay ? activeDateLabel : 'Select a date'}
                    </span>
                    <span className="text-[10px] font-semibold text-stone-400 bg-[#FAF8F5] px-2 py-0.5 rounded-md">
                      {slotsForActiveDate.length} slot{slotsForActiveDate.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {slotsForActiveDate.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {slotsForActiveDate.map(slot => (
                        <button
                          key={slot._id}
                          type="button"
                          onClick={() => {
                            setSelectedSlot(slot);
                            setSelectedDate(slot.date);
                          }}
                          className={`py-2.5 px-5 border rounded-xl text-[12px] font-bold text-center transition-all ${
                            selectedSlot?._id === slot._id
                              ? 'bg-clay border-clay text-white shadow-sm'
                              : 'bg-[#FAF8F5] border-[#F0EBE1] text-charcoal hover:border-stone-300 hover:bg-white'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-5">
                      <span className="text-[11px] text-stone-400 font-semibold italic">
                        {calendarSelectedDay ? 'No slots available on this date' : 'Pick a date from the calendar above'}
                      </span>
                    </div>
                  )}

                  {/* Timezone */}
                  <div className="mt-3 pt-2.5 border-t border-stone-100/60 flex items-center justify-between">
                    <span className="text-[10px] text-stone-400 font-semibold">🌐 {timezone}</span>
                    <button 
                      type="button" 
                      onClick={() => setIsChangingTimezone(!isChangingTimezone)}
                      className="text-[10px] text-terracotta font-bold hover:underline"
                    >
                      Change
                    </button>
                  </div>
                  {isChangingTimezone && (
                    <select 
                      value={timezone}
                      onChange={(e) => { setTimezone(e.target.value); setIsChangingTimezone(false); }}
                      className="mt-1.5 bg-[#FAF8F5] border border-[#F0EBE1] text-[10px] font-bold px-2.5 py-1.5 rounded-lg focus:outline-none w-full"
                    >
                      <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                      <option value="America/New_York (EST)">America/New_York (EST)</option>
                      <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* ─── RIGHT COLUMN ─── */}
            <div className="flex flex-col gap-4 md:sticky md:top-4 h-fit">
              
              {/* Specialist Card */}
              <div className="bg-white border border-[#EBE3D5] rounded-2xl shadow-sm p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-stone-100 border border-[#F0EBE1] shrink-0">
                  {selectedExpert.photo ? (
                    <img src={selectedExpert.photo} alt={selectedExpert.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center text-stone-600 font-bold text-[11px]">
                      {selectedExpert.name[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[12px] font-bold text-charcoal truncate leading-tight">{selectedExpert.name}</h4>
                  <span className="text-[10px] text-stone-500 font-semibold truncate block">{selectedExpert.specialisation}</span>
                </div>
                <div className="bg-[#FAF2EE] border border-[#F5DFD8] text-terracotta text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Private
                </div>
              </div>

              {/* Invoice & CTA */}
              <div className="bg-white border border-[#EBE3D5] rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 pt-4 pb-2">
                  <h3 className="text-[12px] font-extrabold text-charcoal uppercase tracking-wider">Booking Summary</h3>
                </div>

                <div className="px-4 pb-3">
                  <div className="divide-y divide-stone-100">
                    {[
                      { label: 'Mode', value: bookingMode, capitalize: true },
                      { label: 'Pet', value: (newPetInput ? customPetName : selectedPetName) || '—' },
                      { label: 'Date & Time', value: selectedSlot ? `${selectedSlot.date} · ${selectedSlot.time}` : '—', highlight: !!selectedSlot },
                      { label: 'Focus', value: selectedConcerns.length > 0 ? selectedConcerns.join(', ') : 'General' },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between items-center py-2.5">
                        <span className="text-[11px] text-stone-400 font-semibold">{row.label}</span>
                        <span className={`text-[11px] font-bold text-right max-w-[140px] truncate ${
                          row.highlight ? 'text-emerald-700' : 'text-charcoal'
                        } ${row.capitalize ? 'capitalize' : ''}`}>
                          {row.value}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-3">
                      <span className="text-[12px] text-charcoal font-extrabold">Total</span>
                      <span className="text-base font-extrabold text-terracotta">₹{selectedExpert.fee}</span>
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      if (!selectedSlot || !(newPetInput ? customPetName : selectedPetName).trim()) return;
                      const petName = newPetInput ? customPetName : selectedPetName;
                      processRazorpayPayment({
                        amount: selectedExpert.fee,
                        receipt: `receipt_exp_${Date.now()}`,
                        name: `Specialist Consult - ${selectedExpert.name}`,
                        description: `Session fee for ${petName} (${selectedExpert.specialisation})`,
                        prefill: {
                          name: user?.fullName || '',
                          email: user?.email || '',
                          contact: user?.phone || '',
                        },
                        onSuccess: () => {
                          handleConfirmBooking();
                        }
                      });
                    }}
                    disabled={!selectedSlot || !(newPetInput ? customPetName : selectedPetName).trim()}
                    className="w-full py-3 bg-[#2D4536] hover:bg-[#1E2E24] disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-2xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    💳 Proceed to Pay ₹{selectedExpert.fee} Online <span>→</span>
                  </button>
                  
                  <button
                    onClick={handleConfirmBooking}
                    disabled={!selectedSlot || !(newPetInput ? customPetName : selectedPetName).trim()}
                    className="w-full py-2.5 bg-white border border-[#EBE3D5] hover:bg-stone-50 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-stone-600 text-xs font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Confirm Booking (Pay Later)
                  </button>
                </div>
              </div>
              
            </div>
            
          </div>
        );
      })()}
      
      {/* ==================== SCREEN 4: BOOKING CONFIRMED SUCCESS SCREEN ==================== */}
      {currentView === 'confirmed' && confirmedAppt && (
        <div className="flex flex-col items-center justify-center text-center gap-6 py-6 w-full animate-fadeIn select-none">
          
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 z-10">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            
            <svg className="absolute -top-3 -left-3 w-5 h-5 text-amber-400 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>

          <div>
            <h2 className="font-serif font-extrabold text-xl text-terracotta">Booking Confirmed!</h2>
            <p className="text-[10px] text-stone-500 font-semibold mt-1">Your specialist consultation has been scheduled.</p>
          </div>

          {/* Real Email confirmation summary */}
          <div className="bg-[#FAF2EE] border border-[#F5DFD8] text-terracotta rounded-xl px-4 py-2.5 text-[9.5px] font-bold w-full flex items-center justify-center gap-2">
            <span>🌿</span> A confirmation summary has been sent to your email.
          </div>

          {/* Session details */}
          <div className="w-full bg-white border border-[#F0EBE1] rounded-[24px] p-5 text-left flex flex-col gap-4 shadow-sm">
            <h4 className="text-[10px] font-extrabold text-terracotta uppercase tracking-wider border-b border-stone-100 pb-2">Session Details</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-600">
                <span className="text-xl">💬</span>
                <div>
                  <span className="text-[9px] text-stone-400 block font-bold">Mode</span>
                  <span className="text-charcoal capitalize">{bookingMode}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-stone-600">
                <span className="text-xl">📅</span>
                <div>
                  <span className="text-[9px] text-stone-400 block font-bold">Date</span>
                  <span className="text-charcoal">{confirmedAppt.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-stone-600">
                <span className="text-xl">⏱️</span>
                <div>
                  <span className="text-[9px] text-stone-400 block font-bold">Time</span>
                  <span className="text-charcoal">{confirmedAppt.time}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-stone-600">
                <span className="text-xl">⏳</span>
                <div>
                  <span className="text-[9px] text-stone-400 block font-bold">Duration</span>
                  <span className="text-charcoal">Up to 60 mins</span>
                </div>
              </div>
            </div>
          </div>

          {/* Consulting Expert Card details */}
          <div className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-[24px] p-4 text-left flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-stone-100 border border-[#F0EBE1]">
                {confirmedAppt.vetPhoto ? (
                  <img src={confirmedAppt.vetPhoto} alt={confirmedAppt.vetName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#E2E8F0] to-[#CBD5E1] flex items-center justify-center text-stone-600 font-bold text-xs">
                    {confirmedAppt.vetName[0]}
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-charcoal">{confirmedAppt.vetName}</h4>
                <span className="text-[9.5px] text-stone-500 font-semibold block">{confirmedAppt.vetSpecialisation}</span>
              </div>
            </div>
            <div className="text-[9px] text-stone-400 font-bold text-right shrink-0">
              Booking ID<br />
              <strong className="text-terracotta text-[10px]">{confirmedAppt.bookingId}</strong>
            </div>
          </div>

          {/* What's Next guidance box */}
          <div className="w-full bg-blue-50/40 border border-blue-100 rounded-[20px] p-4 text-left flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <strong className="text-[10px] text-blue-800 block font-bold">What's Next?</strong>
              <span className="text-[9.5px] text-blue-900/80 font-semibold leading-relaxed block mt-0.5">
                You can start the session from the "My Appointments" panel at the scheduled time. Your specialist will join the room then.
              </span>
            </div>
          </div>

          {/* Add to Calendar Row */}
          <button
            onClick={handleDownloadCalendarInvite}
            className="w-full bg-white border border-[#F0EBE1] hover:bg-stone-50 p-3 rounded-[18px] text-[10px] font-extrabold text-charcoal flex items-center justify-between shadow-sm active:scale-95 transition-all"
          >
            <span className="flex items-center gap-2">
              📅 Add to Calendar (.ics)
            </span>
            <span className="text-stone-400">Download ›</span>
          </button>

          {/* Emergency Disclaimer box */}
          <div className="w-full bg-rose-50/50 border border-rose-100 rounded-[20px] p-4 text-left flex items-start gap-3">
            <span className="text-lg">🛡️</span>
            <div>
              <strong className="text-[10px] text-rose-800 block font-bold">For Emergencies</strong>
              <span className="text-[9px] text-rose-900/70 font-semibold leading-relaxed block mt-0.5">
                For severe medical symptoms, poison ingestion, open wounds, respiratory difficulty, or seizures, contact a licensed veterinarian immediately.
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2.5 w-full mt-2">
            {confirmedAppt.mode === 'tele-consult' && (
              <CallSessionButton 
                appointment={confirmedAppt} 
                onJoinCall={() => setShowCall(true)} 
              />
            )}
            <button 
              onClick={() => {
                setActiveTab('vetconsult');
              }}
              className="w-full py-3.5 bg-terracotta hover:bg-[#c2502f] text-white text-xs font-extrabold rounded-2xl shadow-sm transition-all"
            >
              Go to My Consultations
            </button>
            <button 
              onClick={() => {
                setCurrentView('home');
              }}
              className="w-full py-3 bg-white border border-[#F0EBE1] hover:bg-stone-50 text-stone-600 text-xs font-extrabold rounded-2xl shadow-sm transition-all"
            >
              Back to Home
            </button>
          </div>

        </div>
      )}

      {/* ==================== SCREEN 5: ADMIN MANAGEMENT DASHBOARD ==================== */}
      {currentView === 'admin' && (
        <div className="w-full flex flex-col gap-5 animate-fadeIn">
          {!isAdminAuthenticated ? (
            <div className="bg-white border border-[#F0EBE1] p-5 rounded-[28px] shadow-sm flex flex-col gap-4 text-center max-w-sm mx-auto my-6">
              <div className="text-3xl">🔐</div>
              <div>
                <h4 className="text-xs font-extrabold text-charcoal">Specialist Registry Admin Settings</h4>
                <p className="text-[9px] text-stone-400 font-semibold mt-1">Please authenticate with your passcode to configure the Expert directory.</p>
              </div>

              <input 
                type="password"
                placeholder="Enter passcode"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl px-4 py-2 text-xs font-bold text-center focus:outline-none"
              />
              {adminError && <span className="text-[9px] text-rose-500 font-bold block">{adminError}</span>}

              <button 
                onClick={() => verifyAdminPass(adminPassword)}
                className="w-full py-2.5 bg-[#2D4536] hover:bg-[#1E2E24] text-white text-xs font-bold rounded-2xl shadow-sm"
              >
                Authenticate Settings
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5 w-full">
              
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest">Active Specialist Registry</span>
                <button
                  onClick={() => {
                    setIsEditingExpert(null);
                    resetExpertForm();
                    setIsAddingExpert(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-bold shadow-sm"
                >
                  + Add Specialist Profile
                </button>
              </div>

              {/* LIST EXPERTS FOR EDIT/DELETE */}
              <div className="flex flex-col gap-3">
                {isLoadingExperts ? (
                  <span className="text-xs text-stone-400 text-center py-4 font-semibold">Loading list...</span>
                ) : experts.length === 0 ? (
                  <span className="text-xs text-stone-400 text-center py-4 font-semibold">No experts registered.</span>
                ) : experts.map(exp => (
                  <div key={exp._id} className="bg-white border border-[#F0EBE1] rounded-2xl p-3 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-stone-100 border border-stone-200 relative shrink-0">
                        {exp.photo ? (
                          <img src={exp.photo} alt={exp.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#E2E8F0] to-[#CBD5E1] flex items-center justify-center text-stone-600 font-bold text-xs">
                            {exp.name[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-charcoal">{exp.name}</h4>
                        <span className="text-[9.5px] text-stone-500 font-semibold block">{exp.category} • {exp.specialisation}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleApproveExpert(exp)}
                        className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold border transition-colors ${
                          exp.isApproved !== false
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'
                            : 'bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-100'
                        }`}
                      >
                        {exp.isApproved !== false ? 'Approved' : 'Pending'}
                      </button>
                      <button
                        onClick={() => handleEditExpertClick(exp)}
                        className="px-2.5 py-1.5 bg-white border border-warmBeige hover:bg-stone-50 text-stone-600 rounded-lg text-[9px] font-bold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteExpert(exp._id)}
                        className="px-2.5 py-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 rounded-lg text-[9px] font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ADD/EDIT MODAL OVERLAY FORM */}
              {isAddingExpert && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-end md:items-center justify-center px-4 transition-all">
                  <form 
                    onSubmit={handleSaveExpert}
                    className="bg-white rounded-t-3xl md:rounded-3xl p-5 w-full max-w-md flex flex-col gap-4 shadow-xl border border-warmBeige max-h-[85vh] overflow-y-auto"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                      <h3 className="text-xs font-extrabold text-stone-500 uppercase">
                        {isEditingExpert ? 'Edit Expert Profile' : 'Add Expert Profile'}
                      </h3>
                      <button 
                        type="button"
                        onClick={() => { setIsAddingExpert(false); setIsEditingExpert(null); resetExpertForm(); }}
                        className="text-stone-400 hover:text-stone-600 font-extrabold text-xs"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block mb-1">Full Name</label>
                        <input 
                          type="text"
                          required
                          placeholder="Devika Das"
                          value={expertFormName}
                          onChange={(e) => setExpertFormName(e.target.value)}
                          className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block mb-1">Category Type</label>
                          <select
                            value={expertFormCategory}
                            onChange={(e) => setExpertFormCategory(e.target.value)}
                            className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                          >
                            {Object.keys(CATEGORY_CONFIGS).map(catKey => (
                              <option key={catKey} value={catKey}>{catKey}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block mb-1">Specialisation Title</label>
                          <input 
                            type="text"
                            placeholder="e.g. Certified Physiotherapist"
                            value={expertFormSpecialty}
                            onChange={(e) => setExpertFormSpecialty(e.target.value)}
                            className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block mb-1">Email Address</label>
                          <input 
                            type="email"
                            placeholder="expert@aumoha.com"
                            value={expertFormEmail}
                            onChange={(e) => setExpertFormEmail(e.target.value)}
                            className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block mb-1">Phone Number</label>
                          <input 
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={expertFormPhone}
                            onChange={(e) => setExpertFormPhone(e.target.value)}
                            className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block mb-1">Experience (Years)</label>
                          <input 
                            type="number"
                            required
                            placeholder="8"
                            value={expertFormExp}
                            onChange={(e) => setExpertFormExp(e.target.value)}
                            className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block mb-1">Consultation Fee (₹)</label>
                          <input 
                            type="number"
                            required
                            placeholder="400"
                            value={expertFormFee}
                            onChange={(e) => setExpertFormFee(e.target.value)}
                            className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block mb-1">Focus Tags (Comma Separated)</label>
                        <input 
                          type="text"
                          placeholder="Mobility, Recovery, Joint Therapy"
                          value={expertFormTagsInput}
                          onChange={(e) => setExpertFormTagsInput(e.target.value)}
                          className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block mb-1">Doctor Bio</label>
                        <textarea
                          rows={2}
                          placeholder="Tell users about this specialist's background..."
                          value={expertFormBio}
                          onChange={(e) => setExpertFormBio(e.target.value)}
                          className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <input 
                          type="checkbox"
                          id="expertFormOnline"
                          checked={expertFormOnline}
                          onChange={(e) => setExpertFormOnline(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="expertFormOnline" className="text-[10px] font-bold text-stone-600 select-none">Currently Online</label>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3 bg-[#2D4536] hover:bg-[#1E2E24] text-white text-xs font-bold rounded-2xl shadow-md mt-2"
                    >
                      Save Specialist Profile
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  </div>

      {showCall && confirmedAppt && (
        <AgoraCallModal 
          appointmentId={confirmedAppt._id} 
          onClose={() => setShowCall(false)} 
        />
      )}

      {/* MATCHING PROFILE PET MODAL FOR BOOKING FLOW */}
      {isPetModalOpen && (
        <div className="fixed inset-0 z-[3000] bg-[#1C1A17]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#F0EBE1] shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            <header className="flex justify-between items-start">
              <div>
                <h3 className="font-serif text-xl text-[#1C1A17] font-normal tracking-tight">Add New Pet</h3>
                <p className="text-[10px] text-stone-400 font-medium mt-0.5">Introduce a new member of your pet family</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPetModalOpen(false)}
                className="p-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer flex items-center justify-center"
              >
                ✕
              </button>
            </header>

            {petError && (
              <div className="bg-[#FDEDEC] border border-[#F5C2C2] text-[#C0392B] rounded-xl px-4 py-2.5 text-[10px] font-semibold">
                {petError}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!petForm.name.trim() || !petForm.type) {
                  setPetError('Name and Pet Type are required.');
                  return;
                }
                setIsPetSaving(true);
                setPetError(null);
                try {
                  const res = await fetch(`${API_BASE}/auth/profile/pets`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(petForm)
                  });
                  if (res.ok) {
                    await syncProfile();
                    setSelectedPetName(petForm.name);
                    setIsPetModalOpen(false);
                  } else {
                    const err = await res.json();
                    setPetError(err.message || 'Failed to save pet details.');
                  }
                } catch {
                  setPetError('Network error. Unable to save pet.');
                } finally {
                  setIsPetSaving(false);
                }
              }}
              className="flex flex-col gap-4 text-left"
            >
              {/* Name & Type Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Pet Name *</label>
                  <input
                    type="text"
                    value={petForm.name}
                    onChange={(e) => setPetForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="e.g. Max"
                    className="w-full bg-[#F5F3EF] rounded-xl py-2 px-3 text-xs text-[#1C1A17] border border-transparent focus:border-[#2D4536] outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Pet Type *</label>
                  <select
                    value={petForm.type}
                    onChange={(e) => setPetForm(prev => ({ ...prev, type: e.target.value }))}
                    required
                    className="w-full bg-[#F5F3EF] rounded-xl py-2 px-3 text-xs text-[#1C1A17] border border-transparent focus:border-[#2D4536] outline-none"
                  >
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Bird">Bird</option>
                    <option value="Fish">Fish</option>
                    <option value="Rabbit">Rabbit</option>
                    <option value="Reptile">Reptile</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Breed & Age Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Breed</label>
                  <input
                    type="text"
                    value={petForm.breed}
                    onChange={(e) => setPetForm(prev => ({ ...prev, breed: e.target.value }))}
                    placeholder="e.g. Beagle"
                    className="w-full bg-[#F5F3EF] rounded-xl py-2 px-3 text-xs text-[#1C1A17] border border-transparent focus:border-[#2D4536] outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Age (Years)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 3"
                    value={petForm.age === undefined ? '' : petForm.age}
                    onChange={(e) => setPetForm(prev => ({ ...prev, age: e.target.value === '' ? undefined : Number(e.target.value) }))}
                    className="w-full bg-[#F5F3EF] rounded-xl py-2 px-3 text-xs text-[#1C1A17] border border-transparent focus:border-[#2D4536] outline-none"
                  />
                </div>
              </div>

              {/* Gender radio */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Gender</span>
                <div className="grid grid-cols-3 gap-2">
                  {['male', 'female', 'unknown'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setPetForm(prev => ({ ...prev, gender: g as any }))}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all capitalize ${
                        petForm.gender === g
                          ? 'border-[#2D4536] bg-[#2D4536] text-white'
                          : 'border-stone-200 bg-white text-stone-500 hover:bg-stone-50'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Action */}
              <div className="flex justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsPetModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-stone-200 bg-white text-stone-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPetSaving}
                  className="px-5 py-2 bg-[#2D4536] hover:bg-[#1E2E24] text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {isPetSaving ? 'Saving...' : 'Add Pet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

