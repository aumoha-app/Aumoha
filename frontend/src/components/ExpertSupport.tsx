'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

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
  availableSlots: Slot[];
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

// Category Configuration
const CATEGORY_CONFIGS: Record<string, {
  title: string;
  subtitle: string;
  subFilters: string[];
  color: string;
  desc: string;
  filterGroup: 'Wellness' | 'Behaviour' | 'Therapy' | 'Holistic';
  bgGradient: string;
  icon: React.ReactNode;
}> = {
  'Nutritionist': {
    title: 'Nutritionists',
    subtitle: 'Custom diet formulation & healthy meal planning',
    subFilters: ['Puppy Diet', 'Weight Management', 'Raw Feeding', 'Available Today'],
    color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    bgGradient: 'from-emerald-500/10 to-emerald-600/5',
    desc: 'Balanced diet plans for better health.',
    filterGroup: 'Wellness',
    icon: (
      <svg className="w-5 h-5 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    )
  },
  'Animal Behaviourist': {
    title: 'Animal Behaviourists',
    subtitle: 'Canine & feline behavior rehabilitation',
    subFilters: ['Aggression', 'Separation Anxiety', 'Phobias', 'Available Today'],
    color: 'text-blue-700 bg-blue-50 border-blue-100',
    bgGradient: 'from-blue-500/10 to-blue-600/5',
    desc: 'Understand behaviour & build better bonds.',
    filterGroup: 'Behaviour',
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
    subtitle: 'Obedience foundation & trick training',
    subFilters: ['Puppy Training', 'Basic Obedience', 'Leash Pulling', 'Available Today'],
    color: 'text-amber-700 bg-amber-50 border-amber-100',
    bgGradient: 'from-amber-500/10 to-amber-600/5',
    desc: 'Positive training for obedience & skills.',
    filterGroup: 'Behaviour',
    icon: (
      <svg className="w-5 h-5 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    )
  },
  'Behaviourist': {
    title: 'Behaviour Specialists',
    subtitle: 'Desensitization and confidence building',
    subFilters: ['Fear Desensitization', 'Socialization', 'Hyperactivity', 'Available Today'],
    color: 'text-indigo-700 bg-indigo-50 border-indigo-100',
    bgGradient: 'from-indigo-500/10 to-indigo-600/5',
    desc: 'Address behavioural challenges.',
    filterGroup: 'Behaviour',
    icon: (
      <svg className="w-5 h-5 text-indigo-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    )
  },
  'Physiotherapist': {
    title: 'Physiotherapists',
    subtitle: 'Muscle recovery, senior comfort & massage',
    subFilters: ['Mobility', 'Injury Recovery', 'Senior Care', 'Post-Surgery'],
    color: 'text-orange-700 bg-orange-50 border-orange-100',
    bgGradient: 'from-orange-500/10 to-orange-600/5',
    desc: 'Pain relief, mobility & recovery care.',
    filterGroup: 'Therapy',
    icon: (
      <svg className="w-5 h-5 text-orange-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  },
  'Wellness & Palliative': {
    title: 'Wellness & Palliative Care',
    subtitle: 'Senior care guidance & comfort therapy',
    subFilters: ['Hospice Setup', 'Pain Relief', 'Senior Wellness', 'Available Today'],
    color: 'text-rose-700 bg-rose-50 border-rose-100',
    bgGradient: 'from-rose-500/10 to-rose-600/5',
    desc: 'Comfort, quality & holistic support.',
    filterGroup: 'Wellness',
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
    subtitle: 'Natural remedies and organic treatments',
    subFilters: ['Chronic Issues', 'Herbal Treatment', 'Holistic Wellness'],
    color: 'text-lime-700 bg-lime-50 border-lime-100',
    bgGradient: 'from-lime-500/10 to-lime-600/5',
    desc: 'Natural healing with gentle care.',
    filterGroup: 'Holistic',
    icon: (
      <svg className="w-5 h-5 text-lime-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    )
  },
  'Rehab Specialist': {
    title: 'Rehabilitation Specialists',
    subtitle: 'Post-injury therapeutic recoveries',
    subFilters: ['Joint Therapy', 'Laser Therapy', 'Post-Surgery Recovery'],
    color: 'text-cyan-700 bg-cyan-50 border-cyan-100',
    bgGradient: 'from-cyan-500/10 to-cyan-600/5',
    desc: 'Rehabilitation for injuries & surgeries.',
    filterGroup: 'Therapy',
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
    subtitle: 'Nursing care, medication assistance & grooming support',
    subFilters: ['Medication Assist', 'Basic Nursing', 'Elderly Care', 'Available Today'],
    color: 'text-purple-700 bg-purple-50 border-purple-100',
    bgGradient: 'from-purple-500/10 to-purple-600/5',
    desc: 'Expert care in the comfort of home.',
    filterGroup: 'Wellness',
    icon: (
      <svg className="w-5 h-5 text-purple-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  },
  'Communicator/Psychotherapist/Reiki Healing': {
    title: 'Communicators & Reiki Healers',
    subtitle: 'Telepathic consultations & spiritual distance healing',
    subFilters: ['Reiki Healing', 'Grief Counseling', 'Energy Balance', 'Available Today'],
    color: 'text-fuchsia-700 bg-fuchsia-50 border-fuchsia-100',
    bgGradient: 'from-fuchsia-500/10 to-fuchsia-600/5',
    desc: 'Telepathic bonds & spiritual energy healing.',
    filterGroup: 'Holistic',
    icon: (
      <svg className="w-5 h-5 text-fuchsia-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        <path d="M2 12h20" />
      </svg>
    )
  }
};

export default function ExpertSupport({ setActiveTab }: ExpertSupportProps) {
  const { token, user } = useAuth();

  // Navigation states
  const [currentView, setCurrentView] = useState<'home' | 'listing' | 'wizard' | 'confirmed'>('home');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('Nutritionist');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Home Filter Group: 'All' | 'Wellness' | 'Behaviour' | 'Therapy' | 'Holistic'
  const [homeGroup, setHomeGroup] = useState<'All' | 'Wellness' | 'Behaviour' | 'Therapy' | 'Holistic'>('All');

  // Listings states
  const [experts, setExperts] = useState<Expert[]>([]);
  const [listingSubFilter, setListingSubFilter] = useState<string | null>(null);
  const [isLoadingExperts, setIsLoadingExperts] = useState(false);

  // Wizard state: 8-step stepper
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

  // Post booking confirmation state
  const [confirmedAppt, setConfirmedAppt] = useState<Appointment | null>(null);

  // Interactive Quiz Modal
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizStep, setQuizStep] = useState(1);
  const [quizAnswers, setQuizAnswers] = useState({ petType: '', challenge: '' });

  // 1. Fetch experts from server
  const fetchExperts = async () => {
    setIsLoadingExperts(true);
    try {
      const res = await fetch('http://localhost:5001/api/vets');
      const data = await res.json();
      if (res.ok) {
        const allVets = data.vets || [];
        setExperts(allVets.filter((v: any) => v.category !== 'vet'));
      }
    } catch (err) {
      console.error('Error fetching experts:', err);
    } finally {
      setIsLoadingExperts(false);
    }
  };

  useEffect(() => {
    fetchExperts();
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
    const isThisCategory = exp.category === selectedCategoryKey;
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
    setWizardStep(2); // Move to Step 2: Mode
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
      const res = await fetch('http://localhost:5001/api/appointments', {
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

  // Add to Calendar simulator (.ics downloader)
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
    <div className="w-full flex flex-col gap-6 animate-scaleIn font-sans text-charcoal bg-[#FAF8F5] rounded-3xl p-4 md:p-6 shadow-sm min-h-[80vh]">
      
      {/* HEADER BAR WITH NAVIGATION BACK ACTION */}
      <div className="flex items-center gap-3 pb-3 border-b border-warmBeige/40 select-none">
        <button 
          onClick={() => {
            if (currentView === 'listing') {
              setCurrentView('home');
            } else if (currentView === 'wizard') {
              if (wizardStep > 1) {
                setWizardStep(prev => prev - 1);
              } else {
                setCurrentView('listing');
              }
            } else if (currentView === 'confirmed') {
              setCurrentView('home');
            } else {
              setActiveTab('home');
            }
          }} 
          className="w-10 h-10 rounded-full border border-warmBeige bg-white flex items-center justify-center hover:bg-warmBg transition-colors"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-600">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div>
          <span className="text-[10px] text-stone-400 font-extrabold uppercase tracking-widest block">Consult & Care</span>
          <h1 className="text-sm font-serif font-extrabold text-charcoal">Expert Support</h1>
        </div>
      </div>

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
                className="w-full bg-white border border-[#F0EBE1] rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-terracotta/40 shadow-sm"
              />
              <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            
            <button 
              onClick={() => handleStartQuiz()}
              className="px-4 bg-[#EBF5E9] hover:bg-[#C8E6C9] border border-[#E1EDE3] text-[#3D5A45] text-[10px] font-extrabold rounded-2xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
              </svg>
              Quiz Match
            </button>
          </div>

          {/* CATEGORY FILTER CHIPS */}
          <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-hide select-none">
            {(['All', 'Wellness', 'Behaviour', 'Therapy', 'Holistic'] as const).map(grp => (
              <button
                key={grp}
                onClick={() => setHomeGroup(grp)}
                className={`px-4 py-1.5 border rounded-full text-[10px] font-extrabold shrink-0 transition-all active:scale-95 flex items-center gap-1.5 ${
                  homeGroup === grp 
                    ? 'bg-[#3D5A45] border-[#3D5A45] text-white shadow-sm' 
                    : 'bg-white border-[#F0EBE1] text-stone-600 hover:border-stone-300'
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
              return (
                <div 
                  key={catKey}
                  onClick={() => {
                    setSelectedCategoryKey(catKey);
                    setListingSubFilter(null);
                    setCurrentView('listing');
                  }}
                  className="bg-white border border-[#F0EBE1] rounded-[24px] p-5 cursor-pointer hover:shadow-md transition-all group flex flex-col justify-between hover:scale-[1.01] hover:border-emerald-600/20"
                >
                  <div className="flex flex-col gap-3">
                    {/* SVG Icon circle wrapper */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${conf.color}`}>
                      {conf.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-charcoal group-hover:text-emerald-700 transition-colors">{catKey}</h4>
                      <p className="text-[10px] text-stone-500 font-semibold mt-1 leading-normal">{conf.desc}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 mt-2 border-t border-stone-50/50">
                    <span className="text-[8px] bg-stone-100 text-stone-500 rounded-md px-1.5 py-0.5 font-bold uppercase tracking-wider">{conf.filterGroup}</span>
                    <span className="text-[11px] font-bold text-stone-400 group-hover:text-emerald-600 transition-colors flex items-center gap-0.5">
                      Explore <span className="text-xs font-extrabold mt-0.5">→</span>
                    </span>
                  </div>
                </div>
              );
            })}
            {filteredCategoryKeys.length === 0 && (
              <div className="col-span-full text-center py-10 text-xs text-stone-400 font-semibold bg-white border border-dashed border-[#F0EBE1] rounded-3xl">
                No matching expert categories found. Try a different filter or search.
              </div>
            )}
          </div>

          {/* FIND MY EXPERT QUIZ BANNER */}
          <div className="bg-[#EBF5E9] border border-[#E1EDE3] rounded-[28px] p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mt-3 shadow-sm">
            <div className="text-left flex flex-col gap-1 max-w-sm">
              <h4 className="font-serif font-extrabold text-sm text-[#3D5A45]">Not sure who to book?</h4>
              <p className="text-[10px] text-stone-600 font-semibold leading-relaxed">Answer a few simple questions about your pet's behavioral or health concerns, and we'll instantly match you with the right specialist.</p>
            </div>
            <button
              onClick={() => handleStartQuiz()}
              className="px-5 py-2.5 bg-[#3D5A45] hover:bg-[#2A3E31] text-white text-[10px] font-extrabold rounded-xl transition-all shadow-sm shrink-0 active:scale-95 flex items-center gap-1.5"
            >
              Find My Expert <span>→</span>
            </button>
          </div>

        </div>
      )}

      {/* INTERACTIVE MATCH QUIZ DIALOG */}
      {isQuizOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-end md:items-center justify-center px-4 transition-all">
          <div className="bg-white rounded-t-3xl md:rounded-3xl p-6 w-full max-w-sm flex flex-col gap-5 shadow-xl border border-warmBeige">
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
                    className="p-3 border border-[#F0EBE1] hover:border-[#3D5A45] rounded-xl text-xs font-bold text-center bg-[#FCFAF7] hover:bg-white"
                  >
                    🐶 Dog
                  </button>
                  <button 
                    onClick={() => handleQuizAnswer('petType', 'cat')}
                    className="p-3 border border-[#F0EBE1] hover:border-[#3D5A45] rounded-xl text-xs font-bold text-center bg-[#FCFAF7] hover:bg-white"
                  >
                    🐱 Cat
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
                      className="p-2.5 border border-[#F0EBE1] hover:border-[#3D5A45] rounded-xl text-xs font-bold text-left bg-[#FCFAF7] hover:bg-white"
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
          <div className="bg-white border border-[#F0EBE1] rounded-[24px] p-5 shadow-sm flex items-center justify-between gap-4">
            <div>
              <span className="text-[8px] bg-emerald-50 border border-emerald-100 text-emerald-700 font-extrabold uppercase rounded px-2 py-0.5 tracking-wider">Specialist Directory</span>
              <h2 className="text-base font-serif font-extrabold text-charcoal mt-1">{activeCategoryConfig.title}</h2>
              <p className="text-[10px] text-stone-500 font-semibold mt-1 leading-normal">{activeCategoryConfig.subtitle}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-stone-50 border border-[#F0EBE1] flex items-center justify-center shrink-0 shadow-sm text-stone-700">
              {activeCategoryConfig.icon}
            </div>
          </div>

          {/* CATEGORY-SPECIFIC SUB-FILTER CHIPS */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide select-none">
            <button
              onClick={() => setListingSubFilter(null)}
              className={`px-3 py-1 border rounded-full text-[9px] font-extrabold shrink-0 transition-all ${
                listingSubFilter === null 
                  ? 'bg-[#3D5A45] border-[#3D5A45] text-white shadow-sm' 
                  : 'bg-white border-[#F0EBE1] text-stone-600'
              }`}
            >
              All Focuses
            </button>
            {activeCategoryConfig.subFilters.map(subF => (
              <button
                key={subF}
                onClick={() => setListingSubFilter(subF)}
                className={`px-3 py-1 border rounded-full text-[9px] font-extrabold shrink-0 transition-all ${
                  listingSubFilter === subF
                    ? 'bg-[#3D5A45] border-[#3D5A45] text-white shadow-sm' 
                    : 'bg-white border-[#F0EBE1] text-stone-600'
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

              return (
                <div 
                  key={exp._id}
                  className="bg-white border border-[#F0EBE1] rounded-[24px] p-4 flex flex-col gap-3.5 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-100 border border-[#F0EBE1] relative shrink-0">
                        {exp.photo ? (
                          <img src={exp.photo} alt={exp.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#E2E8F0] to-[#CBD5E1] flex items-center justify-center text-stone-600 font-bold text-sm">
                            {exp.name[0]}
                          </div>
                        )}
                        {exp.isOnline && (
                          <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 rounded-full border border-white"></span>
                        )}
                      </div>

                      {/* Bio Details */}
                      <div>
                        <h4 className="text-xs font-bold text-charcoal flex items-center gap-1">
                          {exp.name}
                          <svg className="w-3.5 h-3.5 text-blue-500 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        </h4>
                        <span className="text-[10px] text-stone-500 font-semibold block mt-0.5">{exp.specialisation}</span>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-stone-500">
                          <span className="text-amber-500">★</span>
                          <strong className="text-charcoal">{exp.rating}</strong>
                          <span>({exp.reviewCount} sessions)</span>
                          <span>•</span>
                          <span>{exp.experience} yrs exp</span>
                        </div>
                      </div>
                    </div>

                    {/* Price Tag styling */}
                    {!isTagForwardVariant && (
                      <div className="text-right flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Starts at</span>
                        <span className="text-sm font-extrabold text-emerald-700">₹{exp.fee}</span>
                      </div>
                    )}
                  </div>

                  {exp.bio && (
                    <p className="text-[10px] text-stone-600 leading-normal font-semibold pl-1 border-l-2 border-stone-200/50">
                      {exp.bio}
                    </p>
                  )}

                  {/* Specialty Tags */}
                  <div className="flex flex-wrap gap-1.5 select-none pl-1">
                    {exp.specialtyTags && exp.specialtyTags.map((tag, tIdx) => (
                      <span 
                        key={tIdx} 
                        className={`text-[8.5px] font-bold px-2 py-0.5 rounded-md border ${
                          tIdx === 0
                            ? 'bg-blue-50 border-blue-100 text-blue-600'
                            : tIdx === 1
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                              : 'bg-[#FCFAF7] border-[#F0EBE1] text-stone-500'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action CTA */}
                  <div className="flex justify-between items-center pt-2.5 border-t border-stone-50/50 mt-1">
                    {isTagForwardVariant ? (
                      <div className="text-left flex flex-col">
                        <span className="text-[8.5px] text-stone-400 font-extrabold uppercase tracking-wider">Consultation Fee</span>
                        <span className="text-xs font-extrabold text-charcoal">₹{exp.fee} / session</span>
                      </div>
                    ) : (
                      <div />
                    )}
                    <button
                      onClick={() => handleSelectExpert(exp)}
                      className="px-4.5 py-2 bg-[#3D5A45] hover:bg-[#2A3E31] text-white text-[10px] font-extrabold rounded-xl transition-all shadow-sm active:scale-95"
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

      {/* ==================== SCREEN 3: BOOKING WIZARD ==================== */}
      {currentView === 'wizard' && selectedExpert && (
        <div className="flex flex-col gap-5 w-full animate-fadeIn select-none">
          
          {/* STEP 2: MODE SELECTOR */}
          {wizardStep === 2 && (
            <div className="flex flex-col gap-5 w-full">
              <div className="bg-white border border-[#F0EBE1] p-5 rounded-[24px] shadow-sm">
                <span className="text-[8px] bg-blue-50 border border-blue-100 text-blue-600 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">Step 2 of 5</span>
                <h3 className="text-sm font-serif font-extrabold text-charcoal mt-1.5">Choose Session Mode</h3>
                <p className="text-[10px] text-stone-500 font-semibold mt-1">Select how you'd like to consult with {selectedExpert.name}:</p>
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { mode: 'chat', label: 'Chat', desc: 'Secure text consulting', icon: '💬' },
                    { mode: 'video', label: 'Video Call', desc: 'Face-to-face evaluation', icon: '📹' },
                    { mode: 'audio', label: 'Voice Call', desc: 'Direct audio support', icon: '📞' },
                    { mode: 'in-person', label: 'In-Clinic', desc: 'Visit our center location', icon: '🏥' }
                  ].map(m => (
                    <button
                      key={m.mode}
                      onClick={() => setBookingMode(m.mode as any)}
                      className={`p-3.5 border rounded-2xl text-left transition-all active:scale-95 flex flex-col gap-1 ${
                        bookingMode === m.mode 
                          ? 'bg-[#3D5A45]/5 border-[#3D5A45] text-charcoal shadow-sm' 
                          : 'bg-white border-[#F0EBE1] text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      <span className="text-lg">{m.icon}</span>
                      <strong className="text-xs block mt-1">{m.label}</strong>
                      <span className="text-[8.5px] text-stone-400 leading-tight block">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setWizardStep(3)}
                className="w-full py-3.5 bg-[#3D5A45] hover:bg-[#2A3E31] text-white text-xs font-extrabold rounded-2xl shadow-sm"
              >
                Continue to Concerns
              </button>
            </div>
          )}

          {/* STEP 3: CONCERN SELECTION */}
          {wizardStep === 3 && (
            <div className="flex flex-col gap-5 w-full">
              <div className="bg-white border border-[#F0EBE1] p-5 rounded-[24px] shadow-sm">
                <span className="text-[8px] bg-blue-50 border border-blue-100 text-blue-600 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">Step 3 of 5</span>
                <h3 className="text-sm font-serif font-extrabold text-charcoal mt-1.5">Specify Pet Concerns</h3>
                <p className="text-[10px] text-stone-500 font-semibold mt-1">Select focus tags and specify symptoms/notes:</p>

                {/* Concern Tags */}
                <div className="flex flex-wrap gap-2 mt-4 select-none">
                  {['Anxiety', 'Aggression', 'Hyperactivity', 'Eating habits', 'Injury recovery', 'Grooming assist', 'Post-Surgery', 'Diet plan'].map(tag => {
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
                        className={`px-3 py-1.5 border rounded-full text-[10px] font-bold transition-all ${
                          isSelected 
                            ? 'bg-[#3D5A45]/10 border-[#3D5A45] text-[#3D5A45] shadow-sm' 
                            : 'bg-white border-[#F0EBE1] text-stone-600'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4.5">
                  <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block mb-1.5">Consultation Notes (Optional)</label>
                  <textarea
                    rows={4}
                    value={concernText}
                    onChange={(e) => setConcernText(e.target.value)}
                    placeholder="e.g. My pet is anxious during thunderstorms and has stopped eating dry food since 2 days..."
                    className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl p-3 text-xs font-semibold focus:outline-none focus:border-terracotta/40"
                  />
                </div>
              </div>

              <button
                onClick={() => setWizardStep(4)}
                className="w-full py-3.5 bg-[#3D5A45] hover:bg-[#2A3E31] text-white text-xs font-extrabold rounded-2xl shadow-sm"
              >
                Continue to Date & Time
              </button>
            </div>
          )}

          {/* STEP 4: DATE & TIME SELECTOR */}
          {wizardStep === 4 && (
            <div className="flex flex-col gap-4 w-full">
              
              {/* Expert Summary Header */}
              <div className="bg-white border border-[#F0EBE1] rounded-[24px] p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-stone-100 border border-[#F0EBE1]">
                    {selectedExpert.photo ? (
                      <img src={selectedExpert.photo} alt={selectedExpert.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#E2E8F0] to-[#CBD5E1] flex items-center justify-center text-stone-600 font-bold text-xs">
                        {selectedExpert.name[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-charcoal">{selectedExpert.name}</h4>
                    <span className="text-[10px] text-stone-500 block font-semibold">{selectedExpert.specialisation}</span>
                  </div>
                </div>

                {/* Confidential Badge */}
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[8.5px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shrink-0">
                  <svg className="w-3 h-3 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Private & Confidential
                </div>
              </div>

              {/* Month calendar with dot-marked dates */}
              <div className="bg-white border border-[#F0EBE1] rounded-[28px] p-5 shadow-sm">
                <div className="flex justify-between items-center border-b border-stone-100 pb-2.5 mb-3.5">
                  <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest">Select a Date</span>
                  <span className="text-xs font-extrabold text-charcoal">May 2025</span>
                </div>

                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-stone-400 gap-y-3">
                  <span>SUN</span><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span>

                  <span className="opacity-30">27</span><span className="opacity-30">28</span><span className="opacity-30">29</span><span className="opacity-30">30</span>
                  <span className="p-2 cursor-pointer rounded-full hover:bg-stone-50 text-charcoal">1</span>
                  <span className="p-2 cursor-pointer rounded-full hover:bg-stone-50 text-charcoal">2</span>
                  <span className="p-2 cursor-pointer rounded-full hover:bg-stone-50 text-charcoal">3</span>
                  
                  <span className="p-2 cursor-pointer rounded-full hover:bg-stone-50 text-charcoal">4</span>
                  <span className="p-2 cursor-pointer rounded-full hover:bg-stone-50 text-charcoal">5</span>
                  <span className="p-2 cursor-pointer rounded-full hover:bg-stone-50 text-charcoal">6</span>
                  <span className="p-2 cursor-pointer rounded-full hover:bg-stone-50 text-charcoal">7</span>
                  <span className="p-2 cursor-pointer rounded-full hover:bg-stone-50 text-charcoal">8</span>
                  <span className="p-2 cursor-pointer rounded-full hover:bg-stone-50 text-charcoal">9</span>
                  <span className="p-2 cursor-pointer rounded-full hover:bg-stone-50 text-charcoal">10</span>

                  <span className="p-2 cursor-pointer rounded-full hover:bg-stone-50 text-charcoal">11</span>
                  <span className="p-2 cursor-pointer rounded-full hover:bg-stone-50 text-charcoal">12</span>
                  <span className="p-2 cursor-pointer rounded-full hover:bg-stone-50 text-charcoal">13</span>
                  <span className="p-2 cursor-pointer rounded-full hover:bg-stone-50 text-charcoal">14</span>
                  
                  {/* Selected Date: May 15 */}
                  <span className="relative p-2 cursor-pointer bg-[#3D5A45] text-white rounded-full flex flex-col items-center justify-center font-bold">
                    15
                    <span className="absolute bottom-1 w-1 h-1 bg-white rounded-full"></span>
                  </span>

                  <span className="relative p-2 cursor-pointer hover:bg-stone-50 text-charcoal flex flex-col items-center justify-center">
                    16
                    <span className="absolute bottom-1 w-1 h-1 bg-emerald-500 rounded-full"></span>
                  </span>
                  <span className="p-2 cursor-pointer rounded-full hover:bg-stone-50 text-charcoal">17</span>

                  <span className="p-2 cursor-pointer rounded-full hover:bg-stone-50 text-charcoal">18</span>
                  <span className="relative p-2 cursor-pointer hover:bg-stone-50 text-charcoal flex flex-col items-center justify-center">
                    19
                    <span className="absolute bottom-1 w-1 h-1 bg-emerald-500 rounded-full"></span>
                  </span>
                  <span className="relative p-2 cursor-pointer hover:bg-stone-50 text-charcoal flex flex-col items-center justify-center">
                    20
                    <span className="absolute bottom-1 w-1 h-1 bg-emerald-500 rounded-full"></span>
                  </span>
                  <span className="relative p-2 cursor-pointer hover:bg-stone-50 text-charcoal flex flex-col items-center justify-center">
                    21
                    <span className="absolute bottom-1 w-1 h-1 bg-emerald-500 rounded-full"></span>
                  </span>
                  <span className="relative p-2 cursor-pointer hover:bg-stone-50 text-charcoal flex flex-col items-center justify-center">
                    22
                    <span className="absolute bottom-1 w-1 h-1 bg-emerald-500 rounded-full"></span>
                  </span>
                  <span className="relative p-2 cursor-pointer hover:bg-stone-50 text-charcoal flex flex-col items-center justify-center">
                    23
                    <span className="absolute bottom-1 w-1 h-1 bg-emerald-500 rounded-full"></span>
                  </span>
                  <span className="p-2 cursor-pointer rounded-full hover:bg-stone-50 text-charcoal">24</span>

                  <span className="relative p-2 cursor-pointer hover:bg-stone-50 text-charcoal flex flex-col items-center justify-center">
                    25
                    <span className="absolute bottom-1 w-1 h-1 bg-emerald-500 rounded-full"></span>
                  </span>
                  <span className="relative p-2 cursor-pointer hover:bg-stone-50 text-charcoal flex flex-col items-center justify-center">
                    26
                    <span className="absolute bottom-1 w-1 h-1 bg-emerald-500 rounded-full"></span>
                  </span>
                  <span className="relative p-2 cursor-pointer hover:bg-stone-50 text-charcoal flex flex-col items-center justify-center">
                    27
                    <span className="absolute bottom-1 w-1 h-1 bg-emerald-500 rounded-full"></span>
                  </span>
                  <span className="relative p-2 cursor-pointer hover:bg-stone-50 text-charcoal flex flex-col items-center justify-center">
                    28
                    <span className="absolute bottom-1 w-1 h-1 bg-emerald-500 rounded-full"></span>
                  </span>
                  <span className="relative p-2 cursor-pointer hover:bg-stone-50 text-charcoal flex flex-col items-center justify-center">
                    29
                    <span className="absolute bottom-1 w-1 h-1 bg-emerald-500 rounded-full"></span>
                  </span>
                  <span className="relative p-2 cursor-pointer hover:bg-stone-50 text-charcoal flex flex-col items-center justify-center">
                    30
                    <span className="absolute bottom-1 w-1 h-1 bg-emerald-500 rounded-full"></span>
                  </span>
                  <span className="p-2 cursor-pointer rounded-full hover:bg-stone-50 text-charcoal">31</span>
                </div>
              </div>

              {/* Time slot grid picker */}
              <div className="bg-white border border-[#F0EBE1] rounded-[28px] p-5 shadow-sm">
                <div className="flex justify-between items-center border-b border-stone-100 pb-2 mb-3">
                  <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest">Select a Time</span>
                  
                  <select 
                    value={timeToggle}
                    onChange={(e) => setTimeToggle(e.target.value as any)}
                    className="bg-stone-50 border border-stone-200 text-xs font-bold px-2.5 py-1 rounded-xl focus:outline-none"
                  >
                    <option value="Morning">☀️ Morning</option>
                    <option value="Afternoon">🌤️ Afternoon</option>
                    <option value="Evening">🌙 Evening</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {selectedExpert.availableSlots && selectedExpert.availableSlots.map(slot => (
                    <button
                      key={slot._id}
                      type="button"
                      onClick={() => {
                        setSelectedSlot(slot);
                        setSelectedDate(slot.date);
                      }}
                      className={`py-3.5 border rounded-2xl text-xs font-bold text-center transition-all ${
                        selectedSlot?._id === slot._id
                          ? 'bg-[#3D5A45] border-[#3D5A45] text-white shadow-sm'
                          : 'bg-[#FCFAF7] border-[#F0EBE1] text-charcoal hover:bg-white'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                  {(!selectedExpert.availableSlots || selectedExpert.availableSlots.length === 0) && (
                    <span className="text-[10px] text-stone-400 font-semibold italic col-span-2 text-center py-2">No slots available for this doctor.</span>
                  )}
                </div>
              </div>

              {/* Session Duration Note */}
              <div className="bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl p-3.5 flex items-start gap-3">
                <span className="text-xl">📅</span>
                <div>
                  <strong className="text-[10px] text-charcoal block font-bold">Each session is 60 minutes</strong>
                  <span className="text-[9.5px] text-stone-500 font-semibold leading-normal block mt-0.5">
                    You'll have time to discuss, understand, and create a custom rehabilitation or diet plan for your pet.
                  </span>
                </div>
              </div>

              {/* Timezone display with Change option */}
              <div className="flex justify-between items-center px-1 text-[10px] text-stone-500 font-semibold">
                <span className="flex items-center gap-1">
                  🌐 All times are shown in <strong>{timezone}</strong>
                </span>
                
                {isChangingTimezone ? (
                  <select 
                    value={timezone}
                    onChange={(e) => {
                      setTimezone(e.target.value);
                      setIsChangingTimezone(false);
                    }}
                    className="bg-white border border-stone-200 rounded px-1 text-[9px] font-bold focus:outline-none"
                  >
                    <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                    <option value="America/New_York (EST)">America/New_York (EST)</option>
                    <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                  </select>
                ) : (
                  <button 
                    type="button"
                    onClick={() => setIsChangingTimezone(true)}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Booking Summary table trigger */}
              <button
                onClick={() => setWizardStep(5)}
                disabled={!selectedSlot}
                className="w-full py-3.5 bg-[#3D5A45] hover:bg-[#2A3E31] disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-2xl shadow-sm transition-all mt-2"
              >
                Continue to Summary
              </button>
            </div>
          )}

          {/* STEP 5: BOOKING SUMMARY */}
          {wizardStep === 5 && selectedSlot && (
            <div className="flex flex-col gap-4 w-full">
              
              {/* Pet Selector inside summary */}
              <div className="bg-white border border-[#F0EBE1] rounded-[24px] p-4 flex flex-col gap-2.5">
                <div className="flex justify-between items-center border-b border-stone-50 pb-2">
                  <label className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Select Pet Profile</label>
                  <button 
                    type="button"
                    onClick={() => setNewPetInput(!newPetInput)}
                    className="text-[9px] font-extrabold text-terracotta hover:underline"
                  >
                    {newPetInput ? 'Choose from list' : '+ Add Custom Pet'}
                  </button>
                </div>

                {newPetInput ? (
                  <input 
                    type="text"
                    placeholder="Enter custom pet name"
                    value={customPetName}
                    onChange={(e) => setCustomPetName(e.target.value)}
                    className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-xl px-3.5 py-2 text-xs focus:outline-none"
                  />
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {user?.pets && user.pets.map((pet: any) => (
                      <button
                        key={pet._id}
                        type="button"
                        onClick={() => setSelectedPetName(pet.name)}
                        className={`px-3 py-2 border rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                          selectedPetName === pet.name 
                            ? 'bg-[#3D5A45]/10 border-[#3D5A45] text-[#3D5A45] shadow-sm' 
                            : 'bg-white border-[#F0EBE1] text-stone-600'
                        }`}
                      >
                        🐶 {pet.name}
                      </button>
                    ))}
                    {(!user?.pets || user.pets.length === 0) && (
                      <span className="text-[9.5px] text-stone-400 italic">No registered pets found. Please specify custom.</span>
                    )}
                  </div>
                )}
              </div>

              {/* Invoice Table details */}
              <div className="bg-white border border-[#F0EBE1] rounded-[28px] p-5 shadow-sm flex flex-col gap-3">
                <h3 className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider border-b border-stone-100 pb-2">Consultation Invoice</h3>

                <table className="w-full text-xs font-semibold text-stone-600 border-collapse">
                  <tbody>
                    <tr className="border-b border-stone-100">
                      <td className="py-2.5 text-stone-400">Expert Care</td>
                      <td className="py-2.5 text-right font-extrabold text-charcoal">{selectedExpert.name}</td>
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="py-2.5 text-stone-400">Specialisation</td>
                      <td className="py-2.5 text-right font-extrabold text-stone-500">{selectedExpert.specialisation}</td>
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="py-2.5 text-stone-400">Date / Time</td>
                      <td className="py-2.5 text-right font-extrabold text-emerald-700">{selectedSlot.date} • {selectedSlot.time}</td>
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="py-2.5 text-stone-400">Session Mode</td>
                      <td className="py-2.5 text-right font-extrabold text-charcoal capitalize">{bookingMode}</td>
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="py-2.5 text-stone-400">Pet</td>
                      <td className="py-2.5 text-right font-extrabold text-charcoal capitalize">{newPetInput ? customPetName : selectedPetName}</td>
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="py-2.5 text-stone-400">Selected Concerns</td>
                      <td className="py-2.5 text-right font-extrabold text-charcoal max-w-[120px] truncate">{selectedConcerns.join(', ') || 'General Checkup'}</td>
                    </tr>
                    <tr className="pt-2">
                      <td className="py-3 text-charcoal font-extrabold text-sm">Consult Fee</td>
                      <td className="py-3 text-right font-extrabold text-blue-600 text-sm">₹{selectedExpert.fee}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Trigger reservation booking */}
              <button
                onClick={handleConfirmBooking}
                className="w-full py-4 bg-[#3D5A45] hover:bg-[#2A3E31] text-white text-xs font-extrabold rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Confirm & Book Specialist Consult <span>→</span>
              </button>

            </div>
          )}

          {/* STEPPERS PROCESS STEPS BAR DISPLAYED AT BOTTOM PERSISTENTLY */}
          <div className="w-full pt-4 mt-2 border-t border-stone-200/50 flex flex-col items-center gap-2 select-none">
            <div className="flex items-center gap-2.5">
              {[1, 2, 3, 4, 5].map(step => (
                <div key={step} className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold border transition-all ${
                    wizardStep === step
                      ? 'bg-[#3D5A45] border-[#3D5A45] text-white ring-4 ring-[#3D5A45]/10 shadow-sm'
                      : wizardStep > step
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-white border-stone-200 text-stone-400'
                  }`}>
                    {wizardStep > step ? '✓' : step}
                  </div>
                  {step < 5 && <div className={`w-8 h-0.5 ${wizardStep > step ? 'bg-emerald-300' : 'bg-stone-200'}`} />}
                </div>
              ))}
            </div>
            
            <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-widest mt-1">
              Step {wizardStep}: {
                wizardStep === 1 ? 'Choose Specialist' :
                wizardStep === 2 ? 'Session Mode' :
                wizardStep === 3 ? 'Pet Concerns' :
                wizardStep === 4 ? 'Choose Schedule' : 'Invoice Review'
              }
            </span>
          </div>

        </div>
      )}

      {/* ==================== SCREEN 4: BOOKING CONFIRMED SUCCESS SCREEN ==================== */}
      {currentView === 'confirmed' && confirmedAppt && (
        <div className="flex flex-col items-center justify-center text-center gap-6 py-6 w-full animate-fadeIn select-none">
          
          {/* Confetti Checkmark icon */}
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
            <h2 className="font-serif font-extrabold text-xl text-[#3D5A45]">Booking Confirmed!</h2>
            <p className="text-[10px] text-stone-500 font-semibold mt-1">Your specialist consultation has been scheduled.</p>
          </div>

          {/* Real Email confirmation banner */}
          <div className="bg-[#EBF5E9] border border-[#E1EDE3] text-[#3D5A45] rounded-xl px-4 py-2.5 text-[9.5px] font-bold w-full flex items-center justify-center gap-2">
            <span>🌿</span> A confirmation summary has been sent to your email.
          </div>

          {/* Session details */}
          <div className="w-full bg-white border border-[#F0EBE1] rounded-[24px] p-5 text-left flex flex-col gap-4 shadow-sm">
            <h4 className="text-[10px] font-extrabold text-[#3D5A45] uppercase tracking-wider border-b border-stone-100 pb-2">Session Details</h4>
            
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
            <button 
              onClick={() => {
                setActiveTab('vetconsult');
              }}
              className="w-full py-3.5 bg-[#3D5A45] hover:bg-[#2A3E31] text-white text-xs font-extrabold rounded-2xl shadow-sm transition-all"
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

    </div>
  );
}
