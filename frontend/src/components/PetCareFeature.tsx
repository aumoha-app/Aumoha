"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface Slot {
  _id: string;
  date: string;
  time: string;
  isBooked: boolean;
  bookedBy?: string;
}

interface Provider {
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
  location?: string;
  availableSlots: Slot[];
  email?: string;
  phone?: string;
}

interface Appointment {
  _id: string;
  bookingId: string;
  vetName: string;
  vetSpecialisation: string;
  vetPhoto?: string;
  date: string;
  time: string;
  fee: number;
  petName: string;
  status: string;
}

interface PetCareFeatureProps {
  setActiveTab: (tab: any) => void;
}

export default function PetCareFeature({ setActiveTab }: PetCareFeatureProps) {
  const { token, user } = useAuth();
  
  // Navigation / View States
  const [view, setView] = useState<'dashboard' | 'list' | 'detail' | 'confirmed'>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<'Grooming' | 'Boarding' | 'Walking' | 'Training' | null>(null);
  
  // Data States
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedPetName, setSelectedPetName] = useState('Bruno');
  const [isNewPet, setIsNewPet] = useState(false);
  const [customPetName, setCustomPetName] = useState('');
  
  // Booking confirmation response state
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);
  const [isBookingLoading, setIsBookingLoading] = useState(false);

  // List Filters
  const [activeTagsFilter, setActiveTagsFilter] = useState<{
    homeVisit: boolean;
    atPlace: boolean;
    availableToday: boolean;
  }>({
    homeVisit: false,
    atPlace: false,
    availableToday: false
  });

  // Fetch providers from backend
  const fetchProviders = async () => {
    setIsLoading(true);
    try {
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('http://localhost:5001/api/vets', { headers });
      const data = await res.json();
      if (res.ok) {
        setProviders(data.vets || []);
      }
    } catch (err) {
      console.error('Error fetching care providers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [token]);

  // Set default pet from user context if available
  useEffect(() => {
    if (user?.pets && user.pets.length > 0) {
      setSelectedPetName(user.pets[0].name);
    }
  }, [user]);

  // Filter providers by category and toggled tags
  const getFilteredProviders = () => {
    if (!selectedCategory) return [];
    
    // Exact match on category (e.g. Grooming, Boarding, Walking, Training)
    let list = providers.filter(p => p.category === selectedCategory);
    
    if (activeTagsFilter.homeVisit) {
      list = list.filter(p => p.specialtyTags?.some(t => t.toLowerCase().includes('home visit')));
    }
    if (activeTagsFilter.atPlace) {
      list = list.filter(p => p.specialtyTags?.some(t => t.toLowerCase().includes('place') || t.toLowerCase().includes('studio') || t.toLowerCase().includes('clinic') || t.toLowerCase().includes('boarding')));
    }
    if (activeTagsFilter.availableToday) {
      list = list.filter(p => p.specialtyTags?.some(t => t.toLowerCase().includes('today')) || p.availableSlots.some(s => s.date === 'Today' && !s.isBooked));
    }
    
    return list;
  };

  // Perform booking request
  const handleConfirmBooking = async () => {
    if (!selectedProvider || !selectedSlot) {
      alert('Please select an available time slot.');
      return;
    }
    
    const petName = isNewPet ? customPetName.trim() : selectedPetName;
    if (!petName) {
      alert('Please provide or select a pet name.');
      return;
    }

    setIsBookingLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vetId: selectedProvider._id,
          slotId: selectedSlot._id,
          petName,
          mode: 'in-clinic', // default mode for service
          type: 'vet' // matches schema enum
        })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setConfirmedBooking(data.appointment);
        setView('confirmed');
        // Refresh local list to mark slot as booked
        fetchProviders();
      } else {
        alert(data.message || 'Failed to complete booking.');
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      alert('Network error. Unable to complete booking.');
    } finally {
      setIsBookingLoading(false);
    }
  };

  // Reset booking state
  const handleCloseConfirmation = () => {
    setView('dashboard');
    setSelectedCategory(null);
    setSelectedProvider(null);
    setSelectedSlot(null);
    setConfirmedBooking(null);
  };

  return (
    <main className="w-full max-w-2xl mx-auto bg-[#FCFAF7] border border-[#EBE6DD] rounded-[32px] p-4 md:p-8 flex flex-col gap-6 shadow-sm transition-all duration-300 relative overflow-hidden">
      
      {/* 1. DASHBOARD VIEW */}
      {view === 'dashboard' && (
        <>
          <section className="relative w-full pb-4 select-none min-h-[160px] flex flex-col justify-between z-10">
            <div className="flex justify-between items-start w-full">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF3EB] px-3 py-1.5 text-[10px] font-extrabold text-[#3E6D49] tracking-wider uppercase select-none shadow-sm">
                🐾 Grooming & Care
              </div>
              <button
                onClick={() => setActiveTab('home')}
                className="w-10 h-10 rounded-full border border-warmBeige bg-white flex items-center justify-center hover:bg-stone-50 transition-colors shadow-sm cursor-pointer"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
            </div>
            
            <div className="flex flex-col gap-2 mt-4 max-w-[62%]">
              <h1 className="font-serif text-3xl md:text-4xl text-[#1C1A17] font-extrabold leading-tight">
                Grooming they&apos;ll love.
              </h1>
              <p className="text-xs md:text-sm text-stone-500 font-semibold leading-relaxed mt-1">
                Certified groomers, at-home care, walk-time support, and training—all with love.
              </p>
            </div>

            {/* Blended Grooming Hero Image */}
            <div className="absolute right-0 bottom-0 top-6 w-[42%] max-w-[220px] pointer-events-none select-none overflow-hidden z-0 flex items-end justify-end">
              <img 
                src="/grooming_hero.png" 
                alt="Grooming Hero" 
                className="max-h-[96%] max-w-[100%] object-contain object-right-bottom opacity-95 mix-blend-multiply"
              />
            </div>
          </section>

          {/* Highlights Grid */}
          <div className="grid grid-cols-3 gap-2 bg-white border border-[#EBE6DD] rounded-[24px] p-5 text-center shadow-sm select-none z-10 relative">
            <div className="flex flex-col items-center gap-2 border-r border-[#EBE6DD]/70 px-1">
              <div className="w-9 h-9 rounded-full bg-[#EBF5EB] text-[#3E6D49] flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 11 11 13 15 9" />
                </svg>
              </div>
              <span className="text-[10px] md:text-[11px] font-bold text-charcoal leading-snug">Verified Professionals</span>
            </div>
            
            <div className="flex flex-col items-center gap-2 border-r border-[#EBE6DD]/70 px-1">
              <div className="w-9 h-9 rounded-full bg-[#EBF5EB] text-[#3E6D49] flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21a9 9 0 0 0 9-9c0-1.7-.5-3.3-1.3-4.7" />
                  <circle cx="12" cy="12" r="3.5" />
                  <circle cx="12" cy="7.5" r="1" fill="currentColor" />
                </svg>
              </div>
              <span className="text-[10px] md:text-[11px] font-bold text-charcoal leading-snug">Pet-safe Products</span>
            </div>
            
            <div className="flex flex-col items-center gap-2 px-1">
              <div className="w-9 h-9 rounded-full bg-[#EBF5EB] text-[#3E6D49] flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <span className="text-[10px] md:text-[11px] font-bold text-charcoal leading-snug">Easy Scheduling</span>
            </div>
          </div>

          {/* Services Section */}
          <section className="flex flex-col gap-3 select-none z-10 relative">
            <h2 className="text-lg font-serif text-[#1C1A17] font-bold">Services</h2>
            <div className="flex flex-col gap-3.5">
              
              {/* Card 1: Grooming */}
              <div 
                onClick={() => { setSelectedCategory('Grooming'); setView('list'); }}
                className="bg-white border border-[#EBE6DD] rounded-[24px] p-3 flex items-center justify-between hover:border-[#3E6D49]/30 hover:shadow-md transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#EBF3EB] flex items-center justify-center text-[#3E6D49] shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="6" cy="6" r="3" />
                      <circle cx="6" cy="18" r="3" />
                      <line x1="9.8" y1="8.2" x2="20" y2="18.4" />
                      <line x1="9.8" y1="15.8" x2="20" y2="5.6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-serif font-bold text-[#1C1A17] group-hover:text-[#3E6D49] transition-colors">Grooming</h3>
                    <p className="text-[11px] text-stone-500 font-semibold mt-0.5">Bath, coat care, trimming & styling</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-28 h-18 md:w-32 md:h-20 rounded-[16px] overflow-hidden border border-[#EBE6DD] bg-stone-50 shadow-sm">
                    <img src="/warden-1.png" alt="Grooming" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-stone-400 group-hover:text-[#3E6D49] transform group-hover:translate-x-0.5 transition-all pr-1">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 2: Walk & Exercise */}
              <div 
                onClick={() => { setSelectedCategory('Walking'); setView('list'); }}
                className="bg-white border border-[#EBE6DD] rounded-[24px] p-3 flex items-center justify-between hover:border-[#3E6D49]/30 hover:shadow-md transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#EBF3EB] flex items-center justify-center text-[#3E6D49] shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="7" r="1.5" />
                      <path d="M12 9v5.5l-1.5 2M12 14.5l2.5 2.5" />
                      <path d="M4 18h4.5c.8 0 1.5-.7 1.5-1.5v-3c0-.8-.7-1.5-1.5-1.5H4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-serif font-bold text-[#1C1A17] group-hover:text-[#3E6D49] transition-colors">Walk & Exercise</h3>
                    <p className="text-[11px] text-stone-500 font-semibold mt-0.5">Daily walks, playtime & activity care</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-28 h-18 md:w-32 md:h-20 rounded-[16px] overflow-hidden border border-[#EBE6DD] bg-stone-50 shadow-sm">
                    <img src="/warden-2.png" alt="Walk & Exercise" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-stone-400 group-hover:text-[#3E6D49] transform group-hover:translate-x-0.5 transition-all pr-1">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 3: Boarding & Daycare */}
              <div 
                onClick={() => { setSelectedCategory('Boarding'); setView('list'); }}
                className="bg-white border border-[#EBE6DD] rounded-[24px] p-3 flex items-center justify-between hover:border-[#3E6D49]/30 hover:shadow-md transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#EBF3EB] flex items-center justify-center text-[#3E6D49] shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <circle cx="12" cy="13" r="2.5" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-serif font-bold text-[#1C1A17] group-hover:text-[#3E6D49] transition-colors">Boarding & Daycare</h3>
                    <p className="text-[11px] text-stone-500 font-semibold mt-0.5">Safe stays, daycare & companionship</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-28 h-18 md:w-32 md:h-20 rounded-[16px] overflow-hidden border border-[#EBE6DD] bg-stone-50 shadow-sm">
                    <img src="/warden-3.png" alt="Boarding & Daycare" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-stone-400 group-hover:text-[#3E6D49] transform group-hover:translate-x-0.5 transition-all pr-1">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 4: Training */}
              <div 
                onClick={() => { setSelectedCategory('Training'); setView('list'); }}
                className="bg-white border border-[#EBE6DD] rounded-[24px] p-3 flex items-center justify-between hover:border-[#3E6D49]/30 hover:shadow-md transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#EBF3EB] flex items-center justify-center text-[#3E6D49] shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c0 2 2.5 3 6 3s6-1 6-3v-5" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-serif font-bold text-[#1C1A17] group-hover:text-[#3E6D49] transition-colors">Training</h3>
                    <p className="text-[11px] text-stone-500 font-semibold mt-0.5">Obedience, puppy basics & behavior support</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-28 h-18 md:w-32 md:h-20 rounded-[16px] overflow-hidden border border-[#EBE6DD] bg-stone-50 shadow-sm">
                    <img src="/product-4.png" alt="Training" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-stone-400 group-hover:text-[#3E6D49] transform group-hover:translate-x-0.5 transition-all pr-1">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Expert Helper Banner */}
          <section className="bg-white border border-[#EBE6DD] rounded-[24px] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2 shadow-sm select-none z-10 relative">
            <div className="flex items-center gap-4 flex-grow">
              <div className="w-11 h-11 rounded-full bg-[#EBF3EB] text-[#3E6D49] flex items-center justify-center shadow-sm shrink-0">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <circle cx="9" cy="10" r="1.2" fill="currentColor" />
                  <circle cx="15" cy="10" r="1.2" fill="currentColor" />
                </svg>
              </div>
              <div className="text-left flex flex-col gap-0.5">
                <p className="text-sm font-bold text-charcoal">Not sure what your pet needs?</p>
                <p className="text-xs text-stone-500 font-semibold">Chat with our care experts.</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('expertsupport')}
              className="rounded-full bg-[#37543D] hover:bg-[#2D4532] px-6 py-2.5 text-xs font-extrabold text-white transition-all shadow-sm shrink-0 active:scale-95 text-center cursor-pointer"
            >
              Chat Now
            </button>
          </section>
        </>
      )}

      {/* 2. LIST VIEW */}
      {view === 'list' && (
        <>
          {/* Header Row */}
          <div className="flex items-center justify-between w-full border-b border-[#EBE3D5] pb-3 select-none">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('dashboard')}
                className="p-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer mr-1"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className="text-[10px] md:text-xs uppercase tracking-widest text-[#3D6B41] font-bold">Grooming & Care</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 select-none">
            <h1 className="font-serif text-2xl text-[#1C1A17] font-semibold leading-tight">
              Choose a trusted {
                selectedCategory === 'Grooming' ? 'groomer' : 
                selectedCategory === 'Boarding' ? 'daycare host' :
                selectedCategory === 'Walking' ? 'dog walker' : 'trainer'
              } for {isNewPet ? (customPetName || 'your pet') : selectedPetName}
            </h1>
            <p className="text-xs text-stone-500 mt-1">Personalised care. Calm experience. Happy pet.</p>
          </div>

          {/* Active Pet Card & Select Dropdown */}
          <div className="bg-[#FCFAF7] border border-[#EBE3D5] rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border border-[#EBE3D5] bg-white flex items-center justify-center shrink-0 text-xl">
                🐕
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-xs font-bold text-stone-400 leading-none">ACTIVE PET</p>
                <h4 className="font-serif text-base text-[#1C1A17] font-semibold mt-1">
                  {isNewPet ? (customPetName || 'Unnamed Pet') : selectedPetName}
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {user?.pets && !isNewPet ? (
                    <span>
                      {user.pets.find(p => p.name === selectedPetName)?.breed || 'Mixed Breed'} • {user.pets.find(p => p.name === selectedPetName)?.age || 'Adult'} yrs
                    </span>
                  ) : (
                    <span>Golden Retriever • 3 yrs • 28 kg</span>
                  )}
                </p>
              </div>
            </div>

            {/* Pet Switcher UI */}
            {user?.pets && user.pets.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-2 border-t border-[#EBE3D5]/60">
                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Switch Pet:</span>
                <div className="flex flex-wrap gap-1.5">
                  {user.pets.map((pet) => (
                    <button
                      key={pet._id || pet.name}
                      onClick={() => { setSelectedPetName(pet.name); setIsNewPet(false); }}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        selectedPetName === pet.name && !isNewPet
                          ? 'bg-[#3D6B41] text-white border-[#3D6B41]'
                          : 'bg-white text-stone-600 border-[#EBE3D5] hover:bg-stone-50'
                      }`}
                    >
                      {pet.name}
                    </button>
                  ))}
                  <button
                    onClick={() => setIsNewPet(true)}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      isNewPet
                        ? 'bg-[#3D6B41] text-white border-[#3D6B41]'
                        : 'bg-white text-stone-600 border-[#EBE3D5] hover:bg-stone-50'
                    }`}
                  >
                    + Custom Name
                  </button>
                </div>
              </div>
            )}

            {isNewPet && (
              <div className="flex flex-col gap-1 pt-2 border-t border-[#EBE3D5]/60">
                <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Enter Pet Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Bruno"
                  value={customPetName}
                  onChange={(e) => setCustomPetName(e.target.value)}
                  className="bg-white rounded-lg border border-[#EBE3D5] px-3 py-2 text-xs outline-none focus:border-[#3D6B41]"
                />
              </div>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 py-1 select-none">
            <button
              onClick={() => setActiveTagsFilter(prev => ({ ...prev, homeVisit: !prev.homeVisit }))}
              className={`rounded-full px-4 py-2 text-[11px] font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                activeTagsFilter.homeVisit
                  ? 'bg-[#E0F2DD] text-[#3D6B41] border-[#3D6B41]'
                  : 'bg-white text-stone-600 border-[#EBE3D5] hover:bg-stone-50'
              }`}
            >
              <span>🏠</span> Home Visit
            </button>
            <button
              onClick={() => setActiveTagsFilter(prev => ({ ...prev, atPlace: !prev.atPlace }))}
              className={`rounded-full px-4 py-2 text-[11px] font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                activeTagsFilter.atPlace
                  ? 'bg-[#E0F2DD] text-[#3D6B41] border-[#3D6B41]'
                  : 'bg-white text-stone-600 border-[#EBE3D5] hover:bg-stone-50'
              }`}
            >
              <span>📍</span> At Specialist&apos;s Place
            </button>
            <button
              onClick={() => setActiveTagsFilter(prev => ({ ...prev, availableToday: !prev.availableToday }))}
              className={`rounded-full px-4 py-2 text-[11px] font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                activeTagsFilter.availableToday
                  ? 'bg-[#E0F2DD] text-[#3D6B41] border-[#3D6B41]'
                  : 'bg-white text-stone-600 border-[#EBE3D5] hover:bg-stone-50'
              }`}
            >
              <span>📅</span> Available Today
            </button>
          </div>

          {/* List of service providers */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-stone-400 select-none">
              <div className="w-8 h-8 rounded-full border-4 border-stone-200 border-t-[#3D6B41] animate-spin" />
              <p className="text-xs font-semibold">Finding local specialists...</p>
            </div>
          ) : getFilteredProviders().length > 0 ? (
            <div className="flex flex-col gap-4">
              {getFilteredProviders().map((prov) => (
                <div key={prov._id} className="bg-[#FCFAF7] border border-[#E8E4DB] rounded-[24px] p-4 flex flex-col md:flex-row gap-4 hover:shadow-md transition-all duration-300">
                  {/* Photo container */}
                  <div className="w-full md:w-32 h-32 rounded-[18px] bg-white border border-[#EBE3D5] overflow-hidden shrink-0">
                    <img 
                      src={prov.photo || '/sairaj_avatar.png'} 
                      alt={prov.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = '/sairaj_avatar.png'; }}
                    />
                  </div>

                  {/* Profile info */}
                  <div className="flex-grow flex flex-col justify-between min-w-0">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-lg text-[#1C1A17] font-bold leading-none truncate">{prov.name}</h3>
                        <span className="text-emerald-600 text-xs shrink-0 select-none" title="Verified Specialist">✓</span>
                      </div>
                      
                      <p className="text-xs text-stone-500 font-medium">{prov.specialisation}</p>
                      
                      {/* Rating details */}
                      <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5 select-none">
                        <span className="flex items-center gap-0.5 font-bold text-amber-500">★ {prov.rating || '5.0'}</span>
                        <span>({prov.reviewCount || '0'} reviews)</span>
                        <span>•</span>
                        <span>{prov.location || '2.1 km away'}</span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mt-1.5 select-none">
                        {prov.specialtyTags?.map((tag) => (
                          <span key={tag} className="text-[9px] font-bold px-2 py-0.5 rounded bg-white text-stone-500 border border-[#EBE3D5]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#EBE3D5]/40 mt-3 pt-3">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-stone-400 leading-none select-none">STARTS AT</span>
                        <span className="text-sm font-extrabold text-[#1C1A17] mt-0.5">₹{prov.fee}</span>
                      </div>
                      <button
                        onClick={() => { setSelectedProvider(prov); setView('detail'); }}
                        className="px-4 py-2 bg-[#3D6B41] hover:bg-[#2F5232] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                      >
                        View Profile
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-[#EBE3D5] rounded-2xl select-none">
              <p className="text-sm text-stone-400 font-semibold">No active specialists found matching your search.</p>
            </div>
          )}
        </>
      )}

      {/* 3. DETAIL VIEW */}
      {view === 'detail' && selectedProvider && (
        <>
          {/* Header Row */}
          <div className="flex items-center justify-between w-full border-b border-[#EBE3D5] pb-3 select-none">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('list')}
                className="p-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer mr-1"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className="text-[10px] md:text-xs uppercase tracking-widest text-[#3D6B41] font-bold">Profile Detail</span>
            </div>
          </div>

          {/* Provider Overview Card */}
          <div className="flex flex-col gap-5">
            <div className="flex gap-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white border border-[#EBE3D5] overflow-hidden shrink-0">
                <img 
                  src={selectedProvider.photo || '/sairaj_avatar.png'} 
                  alt={selectedProvider.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h2 className="font-serif text-xl text-[#1C1A17] font-bold leading-tight truncate">{selectedProvider.name}</h2>
                <p className="text-xs text-stone-500 font-medium mt-0.5">{selectedProvider.specialisation}</p>
                <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-1 select-none">
                  <span>💼 {selectedProvider.experience} yrs exp</span>
                  <span>•</span>
                  <span>📍 {selectedProvider.location || '2.1 km away'}</span>
                </div>
              </div>
            </div>

            {/* Specialty Tags */}
            <div className="flex flex-wrap gap-1.5 select-none">
              {selectedProvider.specialtyTags?.map((tag) => (
                <span key={tag} className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#E0F2DD] text-[#3D6B41]">
                  {tag}
                </span>
              ))}
            </div>

            {/* About / Bio */}
            {selectedProvider.bio && (
              <div className="flex flex-col gap-1.5">
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider select-none">ABOUT SPECIALIST</h4>
                <p className="text-xs text-stone-600 leading-relaxed font-medium">
                  {selectedProvider.bio}
                </p>
              </div>
            )}

            {/* Selection details */}
            <div className="border-t border-[#EBE3D5] pt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between select-none">
                <span className="text-xs font-bold text-stone-500">Service Category:</span>
                <span className="text-xs font-bold text-[#1C1A17] bg-[#F5F3EF] px-2.5 py-1 rounded-lg border border-[#EBE3D5] uppercase tracking-wider">{selectedProvider.category}</span>
              </div>
              <div className="flex items-center justify-between select-none">
                <span className="text-xs font-bold text-stone-500">Booking Fee:</span>
                <span className="text-sm font-extrabold text-[#1C1A17]">₹{selectedProvider.fee}</span>
              </div>
            </div>

            {/* Time Slots Grid Selection */}
            <div className="flex flex-col gap-2 pt-2 select-none">
              <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">AVAILABLE TIME SLOTS *</h4>
              {selectedProvider.availableSlots && selectedProvider.availableSlots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedProvider.availableSlots.map((slot) => {
                    const isSelected = selectedSlot?._id === slot._id;
                    return (
                      <button
                        key={slot._id}
                        type="button"
                        disabled={slot.isBooked}
                        onClick={() => setSelectedSlot(slot)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          slot.isBooked
                            ? 'bg-stone-50 border-stone-150 text-stone-300 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-[#3D6B41] text-white border-[#3D6B41] shadow-sm'
                            : 'bg-white border-[#EBE3D5] text-[#1C1A17] hover:border-[#3D6B41]'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider">{slot.date}</span>
                        <span className="text-xs font-extrabold mt-0.5">{slot.time}</span>
                        {slot.isBooked && (
                          <span className="text-[8px] font-bold uppercase text-red-500 mt-1 select-none">Booked</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 bg-stone-50 border border-stone-150 rounded-xl select-none">
                  <p className="text-[11px] text-stone-400 font-semibold">No available time slots listed. Contact specialist directly.</p>
                </div>
              )}
            </div>

            {/* Confirm Book Button */}
            <div className="border-t border-[#EBE3D5] pt-4 mt-2">
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={!selectedSlot || isBookingLoading}
                className="w-full py-3.5 rounded-xl bg-[#3D6B41] hover:bg-[#2F5232] disabled:opacity-50 text-white text-sm font-bold shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                {isBookingLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Completing Booking...
                  </>
                ) : (
                  <>
                    Confirm Booking for {isNewPet ? (customPetName || 'Pet') : selectedPetName}
                  </>
                )}
              </button>
            </div>

          </div>
        </>
      )}

      {/* 4. CONFIRMED SCREEN VIEW */}
      {view === 'confirmed' && confirmedBooking && (
        <section className="flex flex-col items-center justify-center text-center py-8 px-4 animate-in fade-in zoom-in duration-300">
          {/* Checkmark Container */}
          <div className="w-16 h-16 rounded-full bg-[#E0F2DD] text-[#3D6B41] flex items-center justify-center text-3xl shadow-sm select-none">
            ✓
          </div>

          <h2 className="font-serif text-2xl text-[#1C1A17] font-semibold mt-4">Booking Confirmed!</h2>
          <p className="text-xs text-stone-500 mt-1.5 leading-relaxed max-w-sm">
            Your appointment has been registered successfully. A booking confirmation email and WhatsApp text details have been dispatched.
          </p>

          {/* Ticket/Invoice Card details */}
          <div className="bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl p-5 w-full max-w-sm mt-6 flex flex-col gap-3.5 text-left text-xs shadow-sm">
            <div className="flex items-center justify-between border-b border-[#EBE3D5]/80 pb-2">
              <span className="font-bold text-stone-400 uppercase tracking-wider text-[9px]">Booking ID</span>
              <span className="font-extrabold text-[#1C1A17]">{confirmedBooking.bookingId}</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="font-bold text-stone-400 uppercase tracking-wider text-[9px]">Caregiver / Specialist</span>
              <p className="font-serif text-sm font-bold text-[#1C1A17]">{confirmedBooking.vetName}</p>
              <p className="text-[11px] text-stone-500 mt-0.5">{confirmedBooking.vetSpecialisation}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-[#EBE3D5]/80 pt-3">
              <div className="flex flex-col">
                <span className="font-bold text-stone-400 uppercase tracking-wider text-[9px]">Date & Time</span>
                <span className="font-bold text-[#1C1A17] mt-0.5">{confirmedBooking.date} at {confirmedBooking.time}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-stone-400 uppercase tracking-wider text-[9px]">Active Pet</span>
                <span className="font-bold text-[#1C1A17] mt-0.5">{confirmedBooking.petName}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#EBE3D5]/80 pt-3">
              <span className="font-bold text-stone-400 uppercase tracking-wider text-[9px]">Fee Paid</span>
              <span className="font-extrabold text-sm text-[#3D6B41]">₹{confirmedBooking.fee}</span>
            </div>
          </div>

          {/* Back button */}
          <button
            onClick={handleCloseConfirmation}
            className="mt-8 px-8 py-3 bg-[#3D6B41] hover:bg-[#2F5232] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            Back to Grooming & Care
          </button>
        </section>
      )}

    </main>
  );
}
