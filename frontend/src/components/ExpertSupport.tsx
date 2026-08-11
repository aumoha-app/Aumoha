'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../lib/api';
import { processRazorpayPayment } from '../lib/razorpay';
import AgoraCallModal from './AgoraCallModal';
import CallSessionButton from './CallSessionButton';
import PaymentModal from './PaymentModal';
import PopupModal, { PopupConfig } from './PopupModal';


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
  medicalDocument?: string;
  prescription?: string;
  prescriptionNotes?: string;
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
    color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    bgGradient: 'bg-gradient-to-tr from-emerald-500/20 to-teal-500/10',
    desc: 'Positive training for obedience & skills.',
    filterGroup: 'Behaviour',
    emoji: '🦮',
    image: '/expert_trainer.png',
    icon: (
      <svg className="w-5 h-5 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
    color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    bgGradient: 'bg-gradient-to-tr from-emerald-500/20 to-teal-500/10',
    desc: 'Pain relief, mobility & recovery care.',
    filterGroup: 'Therapy',
    emoji: '🐕',
    image: '/expert_physiotherapist.png',
    icon: (
      <svg className="w-5 h-5 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
  const [popupConfig, setPopupConfig] = useState<PopupConfig | null>(null);

  const showPopup = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', title?: string) => {
    setPopupConfig({ message, type, title });
  };

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
  const [bookingMode, setBookingMode] = useState<string>('in-clinic');
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [concernText, setConcernText] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('Today');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('10:30 AM');
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
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

  // Auto scroll to top on view transition
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const container = document.getElementById('expert-wizard-container');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentView, wizardStep]);

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

  const [medicalReportBase64, setMedicalReportBase64] = useState<string>('');
  const [medicalReportName, setMedicalReportName] = useState<string>('');

  // Action: Final Confirmed Booking Post API
  const handleConfirmBooking = async () => {
    if (!token || !selectedExpert || !selectedSlot) return;

    const petName = newPetInput ? customPetName : selectedPetName;
    if (!petName.trim()) {
      showPopup('Please specify your pet’s name.', 'warning');
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
          mode: (bookingMode === 'in-clinic' || bookingMode === 'in-person') ? 'in-clinic' : 'tele-consult',
          petName: petName.trim(),
          type: 'expert',
          medicalDocument: medicalReportBase64
        })
      });

      const data = await res.json();
      if (res.ok) {
        setConfirmedAppt(data.appointment);
        setWizardStep(6);
        setCurrentView('confirmed');
        setMedicalReportBase64('');
        setMedicalReportName('');
        fetchExperts();
      } else {
        showPopup(data.message || 'Failed to confirm expert booking.', 'error');
      }
    } catch (err) {
      console.error(err);
      showPopup('Connection error confirming reservation.', 'error');
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
        showPopup(d.message || 'Action failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showPopup('Error updating expert registry.', 'error');
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
    setPopupConfig({
      title: 'Remove Specialist Profile?',
      message: 'Are you sure you want to remove this specialist profile? This action cannot be undone.',
      confirmText: 'Remove Specialist',
      type: 'warning',
      onConfirm: async () => {
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
      }
    });
  };

  const handleToggleApproveExpert = async (exp: Expert) => {
    if (!token) return;
    const currentApproval = exp.isApproved !== false;
    const nextApproval = !currentApproval;
    setPopupConfig({
      title: `${nextApproval ? 'Approve' : 'Unapprove'} Specialist?`,
      message: `Are you sure you want to ${nextApproval ? 'approve' : 'unapprove'} ${exp.name}?`,
      confirmText: nextApproval ? 'Approve' : 'Unapprove',
      type: 'warning',
      onConfirm: async () => {
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
            showPopup(d.message || 'Action failed.', 'error');
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
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
            <div className="w-[42%] md:w-[35%] relative shrink-0 flex items-end justify-end overflow-hidden">
              <img
                src="/expert_care_pet_hero.png?v=2"
                alt="Expert Support Pet Hero"
                className="w-full h-full object-cover object-right-bottom scale-115 origin-right translate-y-0.5"
              />
            </div>
          </div>
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
              <svg className="w-3.5 h-3.5 text-amber-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
              </svg>
              <span>Match Quiz</span>
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
                  className="bg-white border border-[#F0EBE1] rounded-[24px] p-5 md:p-6 cursor-pointer shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[175px] hover:scale-[1.02] group"
                >
                  <div className="flex flex-col gap-1 z-10 w-[62%]">
                    <div>
                      {/* Title and Description */}
                      <h4 className="text-base sm:text-lg font-bold font-serif text-[#1C1A17] leading-snug group-hover:text-[#2D4536] transition-colors">
                        {displayTitle}
                      </h4>
                      <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed mt-1.5 line-clamp-2">
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
      {isMounted && isQuizOpen && createPortal(
        <div className="fixed inset-0 bg-black/65 backdrop-blur-md z-[10000] flex items-center justify-center px-4 transition-all">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm flex flex-col gap-5 shadow-xl border border-warmBeige animate-scaleIn my-auto relative">
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
        </div>,
        document.body
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
                  className="bg-[#FAF6F0] border border-[#E8E2D8] rounded-[24px] overflow-hidden shadow-2xs flex flex-col hover:border-[#2D4536]/30 transition-all duration-300"
                >
                  {/* TOP MAIN SECTION */}
                  <div className="flex items-stretch min-h-[145px] sm:min-h-[155px]">
                    {/* LEFT TALL PHOTO COLUMN */}
                    <div className="w-28 sm:w-32 md:w-36 self-stretch shrink-0 bg-[#E8F0EA] overflow-hidden relative flex items-center justify-center">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={exp.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                            const fallbackEl = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                            if (fallbackEl) fallbackEl.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full bg-gradient-to-br from-[#2D4536] to-[#4A5D4E] flex items-center justify-center text-white font-serif font-bold text-2xl ${
                          photoUrl ? 'hidden' : 'flex'
                        }`}
                      >
                        {exp.name ? exp.name.charAt(0).toUpperCase() : 'E'}
                      </div>
                    </div>

                    {/* RIGHT DETAILS COLUMN */}
                    <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0 gap-2">
                      <div className="flex items-start justify-between gap-2.5">
                        {/* Name + Category Pill Tag */}
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <h4 className="font-serif text-base sm:text-xl font-bold text-[#1C1A17] leading-tight">
                            {exp.name}
                          </h4>
                          <span className="bg-[#E8E2D8] text-stone-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 inline-block">
                            {exp.category === 'vet' ? 'VET' : (exp.category || 'EXPERT')}
                          </span>
                        </div>

                        {/* Fee & Mode */}
                        <div className="text-right shrink-0">
                          <span className="font-sans text-lg sm:text-2xl font-extrabold text-[#1C1A17] block leading-none">
                            ₹{exp.fee}
                          </span>
                          <span className="text-[10px] sm:text-xs text-stone-500 font-medium block text-right mt-1">
                            In-clinic
                          </span>
                        </div>
                      </div>

                      {/* Specialisation Subtitle */}
                      <p className="text-xs sm:text-sm font-semibold text-stone-700 leading-snug">
                        {exp.specialisation}
                      </p>

                      {/* Bio Quote */}
                      {exp.bio && (
                        <p className="text-xs sm:text-sm text-stone-600 font-medium italic leading-snug line-clamp-2">
                          "{exp.bio}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* BOTTOM SLOT SELECTOR ROW */}
                  <div className="bg-[#F4EFE6] border-t border-[#E8E2D8] px-4 py-3 sm:px-5 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <span className="font-serif text-sm sm:text-base font-bold text-[#1C1A17] mr-1">Today</span>
                      {(exp.availableSlots && exp.availableSlots.length > 0
                        ? exp.availableSlots.filter(s => !s.isBooked).slice(0, 3)
                        : [
                            { _id: 's1', time: '9:00 AM' },
                            { _id: 's2', time: '11:00 AM' },
                            { _id: 's3', time: '2:00 PM' }
                          ]
                      ).map((slot, sIdx) => (
                        <button
                          key={slot._id || sIdx}
                          type="button"
                          onClick={() => {
                            setSelectedSlot(slot as any);
                            handleSelectExpert(exp);
                          }}
                          className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-white hover:bg-[#2D4536] hover:text-white border border-[#E5E0D8] rounded-full text-xs font-extrabold text-[#1C1A17] transition-all shadow-2xs cursor-pointer"
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectExpert(exp)}
                      className="text-xs sm:text-sm font-extrabold text-[#2D4536] hover:underline cursor-pointer flex items-center gap-1 ml-auto"
                    >
                      <span>View all</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== SCREEN 3: MULTI-STEP CONFIRM BOOKING FLOW ==================== */}
          {currentView === 'wizard' && selectedExpert && (
            <div id="expert-wizard-container" className="flex flex-col gap-5 w-full animate-fadeIn select-none text-left">

              {/* STEPPER PROGRESS HEADER BAR */}
              <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-[24px] p-4 flex flex-col gap-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#2D4536]">
                    Step {wizardStep} of 3
                  </span>
                  <span className="text-xs font-bold text-[#1C1A17]">
                    {wizardStep === 1 && 'Consultation & Companion'}
                    {wizardStep === 2 && 'Schedule Date & Time'}
                    {wizardStep === 3 && 'Review & Payment'}
                  </span>
                </div>

                {/* Visual Step Progress Line */}
                <div className="w-full bg-[#E5E0D8] h-2 rounded-full overflow-hidden relative">
                  <div
                    className="bg-gradient-to-r from-[#2D4536] to-[#4A5D4E] h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${(wizardStep / 3) * 100}%` }}
                  />
                </div>

                {/* Step Indicators Grid */}
                <div className="grid grid-cols-3 text-center text-[10px] font-bold pt-1">
                  <div className={`flex items-center justify-center gap-1.5 ${wizardStep >= 1 ? 'text-[#2D4536]' : 'text-stone-400'}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${wizardStep >= 1 ? 'bg-[#2D4536] text-white' : 'bg-stone-300 text-stone-600'}`}>1</span>
                    <span>Companion</span>
                  </div>
                  <div className={`flex items-center justify-center gap-1.5 ${wizardStep >= 2 ? 'text-[#2D4536]' : 'text-stone-400'}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${wizardStep >= 2 ? 'bg-[#2D4536] text-white' : 'bg-stone-300 text-stone-600'}`}>2</span>
                    <span>Date & Time</span>
                  </div>
                  <div className={`flex items-center justify-center gap-1.5 ${wizardStep >= 3 ? 'text-[#2D4536]' : 'text-stone-400'}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${wizardStep >= 3 ? 'bg-[#2D4536] text-white' : 'bg-stone-300 text-stone-600'}`}>3</span>
                    <span>Review & Pay</span>
                  </div>
                </div>
              </div>

              {/* PROMINENT DOCTOR PROFILE BANNER WITH BIO (VISIBLE ON ALL STEPS) */}
              <div className="bg-[#FAF6F0] border border-[#EBE3D5] rounded-[24px] p-4 sm:p-5 shadow-2xs flex flex-col gap-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-white border border-[#D5CEBF] shrink-0 shadow-2xs">
                      {selectedExpert.photo ? (
                        <img src={selectedExpert.photo} alt={selectedExpert.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#2D4536] to-[#4A5D4E] flex items-center justify-center text-white font-serif font-bold text-lg">
                          {selectedExpert.name ? selectedExpert.name.charAt(0).toUpperCase() : 'E'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-serif text-base sm:text-xl font-bold text-[#1C1A17] leading-tight truncate">
                        {selectedExpert.name}
                      </h3>
                      <p className="text-xs sm:text-sm font-semibold text-[#2D4536] mt-0.5 truncate">
                        {selectedExpert.specialisation}
                      </p>
                    </div>
                  </div>

                  <div className="text-right bg-white/90 backdrop-blur-sm border border-[#E5DEC3] rounded-2xl px-3.5 py-2 shrink-0 shadow-2xs">
                    <span className="font-sans text-base sm:text-xl font-extrabold text-[#2D4536] block leading-none">₹{selectedExpert.fee}</span>
                    <span className="text-[9px] sm:text-[10px] text-stone-500 font-bold uppercase tracking-widest block mt-1">Fee</span>
                  </div>
                </div>

                {/* DOCTOR BIO / DESCRIPTION DISPLAY */}
                <div className="bg-white/80 backdrop-blur-sm border border-[#EBE3D5] rounded-2xl p-3.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-stone-500 uppercase tracking-widest mb-1">
                    <svg className="w-3.5 h-3.5 text-[#2D4536]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>ABOUT THE SPECIALIST</span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-700 font-medium leading-relaxed font-sans">
                    {selectedExpert.bio || "Dedicated specialist providing holistic care, gentle treatments, and health consultations for your pet companions."}
                  </p>
                </div>
              </div>

              {/* STEP 1: CONSULTATION MODE, SELECT PET & UPLOAD REPORT */}
              {wizardStep === 1 && (
                <div className="flex flex-col gap-5 w-full animate-fadeIn">
                  {/* Consultation Mode Picker */}
                  <div className="flex flex-col gap-2.5">
                    <label className="text-[10.5px] font-extrabold text-stone-500 uppercase tracking-widest px-1">1. CONSULTATION MODE</label>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
                      <button
                        type="button"
                        onClick={() => setBookingMode('in-clinic')}
                        className={`p-4 sm:p-5 rounded-2xl sm:rounded-[22px] text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[120px] ${bookingMode === 'in-clinic' || bookingMode === 'in-person'
                            ? 'bg-[#F4F0EA] border-2 border-[#2D4536] shadow-sm'
                            : 'bg-[#F9F6F0] border border-[#E5E0D8] hover:bg-[#F5F1EA]'
                          }`}
                      >
                        <div className="flex items-start justify-between w-full">
                          <svg className="w-7 h-7 sm:w-8 sm:h-8 text-[#2D4536]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 21h18" />
                            <path d="M5 21V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14" />
                            <path d="M9 21v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4" />
                            <path d="M10 9h4" />
                            <path d="M12 7v4" />
                          </svg>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${bookingMode === 'in-clinic' || bookingMode === 'in-person' ? 'bg-[#2D4536] border-2 border-[#2D4536]' : 'border-2 border-stone-300'
                            }`}>
                            {(bookingMode === 'in-clinic' || bookingMode === 'in-person') && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                        <div className="mt-3">
                          <h4 className="font-serif text-sm sm:text-base font-bold text-[#1C1A17] leading-tight">In-clinic / In-person</h4>
                          <p className="text-[11px] sm:text-xs text-stone-500 font-medium mt-0.5">Visit clinic or home visit</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBookingMode('tele-consult')}
                        className={`p-4 sm:p-5 rounded-2xl sm:rounded-[22px] text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[120px] ${bookingMode === 'tele-consult' || bookingMode === 'video'
                            ? 'bg-[#F4F0EA] border-2 border-[#2D4536] shadow-sm'
                            : 'bg-[#F9F6F0] border border-[#E5E0D8] hover:bg-[#F5F1EA]'
                          }`}
                      >
                        <div className="flex items-start justify-between w-full">
                          <svg className="w-7 h-7 sm:w-8 sm:h-8 text-[#2D4536]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="6" width="14" height="12" rx="3" />
                            <path d="M16 10l5-3v10l-5-3" />
                          </svg>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${bookingMode === 'tele-consult' || bookingMode === 'video' ? 'bg-[#2D4536] border-2 border-[#2D4536]' : 'border-2 border-stone-300'
                            }`}>
                            {(bookingMode === 'tele-consult' || bookingMode === 'video') && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                        <div className="mt-3">
                          <h4 className="font-serif text-sm sm:text-base font-bold text-[#1C1A17] leading-tight">Tele-consult</h4>
                          <p className="text-[11px] sm:text-xs text-stone-500 font-medium mt-0.5">Online video call</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* SELECT PET SECTION */}
                  <div className="flex flex-col gap-2.5 w-full">
                    <label className="text-[10.5px] font-extrabold text-stone-500 uppercase tracking-widest px-1">2. SELECT PET COMPANION</label>
                    {(() => {
                      const currentPet = user?.pets?.find((p: any) => p.name === selectedPetName) || user?.pets?.[0];
                      const petName = newPetInput ? customPetName : (selectedPetName || currentPet?.name);

                      if (!petName && !currentPet) {
                        return (
                          <div className="bg-[#F4F0EA] border border-[#E5E0D8] rounded-[22px] p-4 flex items-center justify-between w-full shadow-2xs">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-200 border border-[#D5CEBF] shrink-0 flex items-center justify-center text-stone-500">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-serif text-base font-bold text-[#1C1A17] leading-tight">No Pet Selected</h4>
                                <p className="text-xs text-stone-500 font-medium mt-0.5">Click "+ Add another pet" below to add your pet profile</p>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      const petBreed = currentPet?.breed || (currentPet?.type ? `${currentPet.type}` : '');
                      const petAge = currentPet?.age ? `${currentPet.age} yrs` : '';
                      const petGender = currentPet?.gender && currentPet.gender !== 'unknown' ? currentPet.gender : '';
                      const detailsString = [petBreed, petAge, petGender].filter(Boolean).join(' • ') || (currentPet?.type || 'Pet');

                      return (
                        <div
                          onClick={() => {
                            if (user?.pets && user.pets.length > 1) {
                              const currentIndex = user.pets.findIndex((p: any) => p.name === (selectedPetName || currentPet?.name));
                              const nextPet = user.pets[(currentIndex + 1) % user.pets.length];
                              if (nextPet) {
                                setSelectedPetName(nextPet.name);
                                setNewPetInput(false);
                              }
                            }
                          }}
                          className={`bg-[#F4F0EA] border border-[#E5E0D8] rounded-[22px] p-4 flex items-center justify-between w-full shadow-2xs ${user?.pets && user.pets.length > 1 ? 'cursor-pointer hover:border-[#D5CEBF]' : ''
                            }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-200 border border-[#D5CEBF] shrink-0 flex items-center justify-center text-[#2D4536]">
                              {currentPet?.photo ? (
                                <img src={currentPet.photo} alt={petName || 'Pet'} className="w-full h-full object-cover" />
                              ) : (
                                <svg className="w-6 h-6 stroke-[1.8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-serif text-base font-bold text-[#1C1A17] leading-tight truncate">{petName}</h4>
                              <p className="text-xs text-stone-500 font-medium mt-0.5 truncate capitalize">{detailsString}</p>
                            </div>
                          </div>
                          {user?.pets && user.pets.length > 1 && (
                            <div className="w-6 h-6 text-stone-600 flex items-center justify-center shrink-0" title="Click to cycle pets">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <button
                      type="button"
                      onClick={() => {
                        setPetError(null);
                        setPetForm({ name: '', type: 'Dog', photo: '', breed: '', age: undefined, gender: 'unknown', notes: '' });
                        setIsPetModalOpen(true);
                      }}
                      className="w-full py-3 px-4 border-2 border-dashed border-[#DCD5C7] rounded-[22px] bg-transparent hover:bg-[#F5F2EC] text-[#1C1A17] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span className="text-base font-bold">+</span>
                      <span>Add another pet</span>
                    </button>
                  </div>

                  {/* UPLOAD OLD MEDICAL REPORT SECTION */}
                  <div className="flex flex-col gap-2.5 w-full bg-[#FAF8F5] border border-[#E8E2D8] rounded-[24px] p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <label className="text-[10.5px] font-extrabold text-stone-500 uppercase tracking-widest flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        <span>UPLOAD MEDICAL HISTORY (OPTIONAL)</span>
                      </label>
                      <span className="text-[9px] text-stone-400 font-semibold">Image or PDF</span>
                    </div>
                    <p className="text-[11px] text-stone-500 font-medium">Share your pet's past records with {selectedExpert.name} in advance for better consultation context.</p>
                    <div className="flex items-center gap-3">
                      <label className="px-4 py-2.5 bg-white border border-[#D5CEBF] hover:bg-[#F5F2EC] text-[#1C1A17] text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-2xs">
                        <svg className="w-4 h-4 text-[#2D4536]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <span>Choose File</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setMedicalReportName(file.name);
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setMedicalReportBase64(event.target?.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {medicalReportName && (
                        <div className="flex items-center gap-2 text-xs font-bold text-[#2D4536] bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl truncate max-w-[200px]">
                          <span>✓ {medicalReportName}</span>
                          <button
                            type="button"
                            onClick={() => { setMedicalReportBase64(''); setMedicalReportName(''); }}
                            className="text-stone-400 hover:text-rose-500 font-extrabold ml-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* STEP 1 NEXT BUTTON */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const petName = newPetInput ? customPetName : (selectedPetName || user?.pets?.[0]?.name);
                        if (!petName || !petName.trim()) {
                          showPopup('Please specify the name of your pet companion.', 'warning');
                          return;
                        }
                        setWizardStep(2);
                      }}
                      className="w-full sm:w-auto px-7 py-3 bg-[#2D4536] hover:bg-[#1E2E24] active:scale-[0.98] text-white text-xs sm:text-sm font-extrabold rounded-full shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Next</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: SELECT DATE & TIME SLOT */}
              {wizardStep === 2 && (
                <div className="flex flex-col gap-5 w-full animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 w-full bg-[#FAF8F5] border border-[#E8E2D8] rounded-[26px] p-5 shadow-2xs">

                    {/* SELECT DATE (Left 7 Cols) */}
                    <div className="md:col-span-7 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10.5px] font-extrabold text-stone-500 uppercase tracking-widest">SELECT DATE</label>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="font-serif text-sm font-bold text-[#1C1A17]">
                          {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][calendarMonth]} {calendarYear}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (calendarMonth === 11) {
                              setCalendarMonth(0);
                              setCalendarYear(prev => prev + 1);
                            } else {
                              setCalendarMonth(prev => prev + 1);
                            }
                          }}
                          className="w-6 h-6 rounded-full hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-all cursor-pointer font-bold text-xs"
                        >
                          ›
                        </button>
                      </div>

                      <div className="grid grid-cols-7 text-center">
                        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                          <span key={d} className="text-[9px] font-bold text-stone-400 uppercase py-1">{d}</span>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-y-1 text-center">
                        {Array.from({ length: new Date(calendarYear, calendarMonth, 1).getDay() }).map((_, i) => (
                          <span key={`blank-${i}`} />
                        ))}
                        {Array.from({ length: new Date(calendarYear, calendarMonth + 1, 0).getDate() }).map((_, i) => {
                          const dayNum = i + 1;
                          const isSelected = calendarSelectedDay === dayNum;
                          const isPast = new Date().getMonth() === calendarMonth && new Date().getFullYear() === calendarYear && dayNum < new Date().getDate();

                          return (
                            <div key={dayNum} className="flex flex-col items-center justify-center">
                              <button
                                type="button"
                                disabled={isPast}
                                onClick={() => {
                                  setCalendarSelectedDay(dayNum);
                                  const mName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][calendarMonth];
                                  const dateStr = `${mName} ${dayNum}`;
                                  setSelectedSlot({
                                    _id: `slot_${dayNum}`,
                                    date: dateStr,
                                    time: selectedTimeSlot,
                                    isBooked: false
                                  });
                                }}
                                className={`w-8 h-8 rounded-full text-xs font-bold transition-all flex items-center justify-center ${isPast
                                    ? 'text-stone-300 cursor-not-allowed'
                                    : isSelected
                                      ? 'bg-[#2D4536] text-white shadow-sm font-extrabold'
                                      : 'text-[#1C1A17] hover:bg-[#F4F0EA] cursor-pointer'
                                  }`}
                              >
                                {dayNum}
                              </button>
                              {!isPast && (
                                <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-emerald-400' : 'bg-stone-400'}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="hidden md:block w-px bg-[#E8E2D8] self-stretch" />

                    {/* SELECT TIME (Right 5 Cols) */}
                    <div className="md:col-span-4 flex flex-col gap-3 border-t md:border-t-0 pt-4 md:pt-0">
                      <label className="text-[10.5px] font-extrabold text-stone-500 uppercase tracking-widest">SELECT TIME</label>
                      <div className="flex flex-col gap-2.5">
                        {['10:30 AM', '1:00 PM', '3:30 PM', '5:00 PM'].map(timeStr => {
                          const isTimeSelected = selectedTimeSlot === timeStr && !isChangingTimezone;
                          return (
                            <button
                              key={timeStr}
                              type="button"
                              onClick={() => {
                                setSelectedTimeSlot(timeStr);
                                setIsChangingTimezone(false);
                                const mName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][calendarMonth];
                                setSelectedSlot({
                                  _id: `slot_${calendarSelectedDay}`,
                                  date: `${mName} ${calendarSelectedDay}`,
                                  time: timeStr,
                                  isBooked: false
                                });
                              }}
                              className={`w-full py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer text-center ${isTimeSelected
                                  ? 'bg-[#2D4536] text-white shadow-sm border border-[#2D4536]'
                                  : 'bg-[#F9F6F0] border border-[#E5E0D8] text-[#1C1A17] hover:bg-[#F4F0EA]'
                                }`}
                            >
                              {timeStr}
                            </button>
                          );
                        })}

                        <div
                          className={`w-full rounded-2xl p-3 transition-all border flex flex-col gap-2 ${isChangingTimezone
                              ? 'bg-[#2D4536] text-white border-[#2D4536] shadow-sm'
                              : 'bg-[#F9F6F0] border-[#E5E0D8] text-[#1C1A17] hover:bg-[#F4F0EA]'
                            }`}
                        >
                          <div
                            onClick={() => setIsChangingTimezone(true)}
                            className="flex items-center justify-between px-1 cursor-pointer font-extrabold text-xs sm:text-sm select-none"
                          >
                            <span className="flex items-center gap-1.5">
                              <svg className="w-4 h-4 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              <span>Custom Time</span>
                            </span>
                          </div>

                          {isChangingTimezone && (
                            <div className="pt-1 flex items-center gap-2">
                              <input
                                type="time"
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val) {
                                    const [hStr, mStr] = val.split(':');
                                    let h = parseInt(hStr, 10);
                                    const m = parseInt(mStr, 10);
                                    const ampm = h >= 12 ? 'PM' : 'AM';
                                    h = h % 12;
                                    h = h ? h : 12;
                                    const formattedTime = `${h}:${m < 10 ? '0' : ''}${m} ${ampm}`;
                                    setSelectedTimeSlot(formattedTime);
                                    const mName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][calendarMonth];
                                    setSelectedSlot({
                                      _id: `slot_${calendarSelectedDay}`,
                                      date: `${mName} ${calendarSelectedDay}`,
                                      time: formattedTime,
                                      isBooked: false
                                    });
                                  }
                                }}
                                className="w-full bg-white text-charcoal border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs font-extrabold outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-inner"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* STEP 2 NAV BUTTONS */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="px-5 py-2.5 bg-white border border-[#D5CEBF] hover:bg-[#FAF8F5] text-[#1C1A17] text-xs sm:text-sm font-bold rounded-full transition-all cursor-pointer shadow-2xs"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardStep(3)}
                      className="px-7 py-3 bg-[#2D4536] hover:bg-[#1E2E24] active:scale-[0.98] text-white text-xs sm:text-sm font-extrabold rounded-full shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>Next</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: REVIEW & PAYMENT CONFIRMATION */}
              {wizardStep === 3 && (
                <div className="flex flex-col gap-5 w-full animate-fadeIn">
                  {/* Booking Summary Card */}
                  <div className="bg-white/95 backdrop-blur-sm border border-[#E2DBD0] rounded-[24px] p-5 sm:p-6 flex flex-col gap-1 shadow-sm">
                    <h3 className="text-[10.5px] font-extrabold text-stone-400 uppercase tracking-[0.15em] border-b border-[#F0EBE1] pb-3 mb-1">FINAL BOOKING SUMMARY</h3>

                    <div className="divide-y divide-[#F5F2EB]">
                      <div className="flex justify-between items-center py-3">
                        <span className="text-xs sm:text-sm font-medium text-stone-500">Specialist</span>
                        <span className="font-serif text-sm sm:text-base font-bold text-[#1C1A17]">{selectedExpert.name}</span>
                      </div>

                      <div className="flex justify-between items-center py-3">
                        <span className="text-xs sm:text-sm font-medium text-stone-400">Scheduled Date & Time</span>
                        <span className="font-extrabold text-[#0D7855] text-xs sm:text-sm">
                          {selectedSlot?.date || 'Today'} • {selectedSlot?.time || selectedTimeSlot}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-3">
                        <span className="text-xs sm:text-sm font-medium text-stone-400">Consultation Mode</span>
                        <span className="font-extrabold text-[#1C1A17] text-xs sm:text-sm capitalize">
                          {bookingMode === 'tele-consult' || bookingMode === 'video' ? 'Tele-consult (Video Call)' : 'In-Clinic / In-Person Visit'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-3">
                        <span className="text-xs sm:text-sm font-medium text-stone-400">Pet Companion</span>
                        <span className="font-extrabold text-[#1C1A17] text-xs sm:text-sm capitalize">
                          {newPetInput ? customPetName : (selectedPetName || user?.pets?.[0]?.name)}
                        </span>
                      </div>

                      {medicalReportName && (
                        <div className="flex justify-between items-center py-3">
                          <span className="text-xs sm:text-sm font-medium text-stone-400">Attached History</span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg truncate max-w-[180px]">
                            ✓ {medicalReportName}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center py-3">
                        <span className="text-xs sm:text-sm font-medium text-stone-500">Consultation Fee</span>
                        <span className="font-sans text-sm sm:text-base font-extrabold text-[#1C1A17]">₹{selectedExpert.fee}</span>
                      </div>
                    </div>

                    <div className="mt-2 pt-3.5 border-t-2 border-[#F0EBE1] flex items-center justify-between">
                      <span className="font-sans text-base sm:text-lg font-extrabold text-[#1C1A17]">Total Payable Amount</span>
                      <span className="font-sans text-xl sm:text-2xl font-extrabold text-[#2D4536]">₹{selectedExpert.fee}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2.5 mt-1">
                    <button
                      onClick={() => {
                        const petName = newPetInput ? customPetName : (selectedPetName || user?.pets?.[0]?.name);
                        processRazorpayPayment({
                          amount: selectedExpert.fee,
                          receipt: `receipt_exp_${Date.now()}`,
                          name: `Specialist Consult - ${selectedExpert.name}`,
                          description: `Session fee for ${petName}`,
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
                      className="w-full py-3.5 bg-[#2D4536] hover:bg-[#1E2E24] active:scale-[0.98] text-white text-xs sm:text-sm md:text-base font-extrabold rounded-full shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Proceed to Pay ₹{selectedExpert.fee}</span>
                    </button>

                    <div className="flex items-center justify-between gap-2.5">
                      <button
                        type="button"
                        onClick={() => setWizardStep(2)}
                        className="px-5 py-2.5 bg-white border border-[#D5CEBF] hover:bg-[#FAF8F5] text-[#1C1A17] text-xs sm:text-sm font-bold rounded-full transition-all cursor-pointer shadow-2xs shrink-0"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={handleConfirmBooking}
                        className="flex-1 py-2.5 px-4 bg-white border border-[#DCD5C7] hover:bg-[#FAF8F5] active:scale-[0.98] text-[#1C1A17] text-xs sm:text-sm font-bold rounded-full shadow-2xs transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        Confirm Booking (Pay Later)
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
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
            <h2 className="font-serif font-extrabold text-xl text-[#2D4536]">Booking Confirmed!</h2>
            <p className="text-[10px] text-stone-500 font-semibold mt-1">Your specialist consultation has been scheduled.</p>
          </div>

          {/* Real Email confirmation summary */}
          <div className="bg-[#E8F0EA] border border-[#2D4536]/20 text-[#2D4536] rounded-xl px-4 py-2.5 text-[9.5px] font-bold w-full flex items-center justify-center gap-2">
            <span>🌿</span> A confirmation summary has been sent to your email.
          </div>

          {/* Session details */}
          <div className="w-full bg-white border border-[#F0EBE1] rounded-[24px] p-5 text-left flex flex-col gap-4 shadow-sm">
            <h4 className="text-[10px] font-extrabold text-[#2D4536] uppercase tracking-wider border-b border-stone-100 pb-2">Session Details</h4>
            
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
              <strong className="text-[#2D4536] text-[10px]">{confirmedAppt.bookingId}</strong>
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
              className="w-full py-3.5 bg-[#2D4536] hover:bg-[#1E2E24] text-white text-xs font-extrabold rounded-2xl shadow-sm transition-all"
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

      {/* Popup Alert Modal */}
      <PopupModal config={popupConfig} onClose={() => setPopupConfig(null)} />
    </>
  );
}

