'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DogIcon, LockIcon } from './icons/PetIcons';
import { API_BASE } from '../lib/api';

// Define Interface types
interface Slot {
  _id: string;
  date: string;
  time: string;
  isBooked: boolean;
  bookedBy?: string;
}

interface Vet {
  _id: string;
  name: string;
  photo?: string;
  specialisation: string;
  category?: string;
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
  type?: 'vet' | 'expert';
  petName: string;
  petId?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
  bookingId: string;
  createdAt: string;
}

interface VetConsultationProps {
  setActiveTab: (tab: any) => void;
}

export default function VetConsultation({ setActiveTab }: VetConsultationProps) {
  const { token, user } = useAuth();
  
  // Navigation tabs
  const [subTab, setSubTab] = useState<'book' | 'tele' | 'my-appts' | 'admin'>('book');
  const [currentView, setCurrentView] = useState<'home' | 'directory' | 'confirm' | 'confirmed'>('home');

  // Directory Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  // Selection states for booking flow
  const [vets, setVets] = useState<Vet[]>([]);
  const [selectedVet, setSelectedVet] = useState<Vet | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [bookingMode, setBookingMode] = useState<'in-clinic' | 'tele-consult'>('in-clinic');
  const [selectedPetName, setSelectedPetName] = useState('');
  const [newPetInput, setNewPetInput] = useState(false);
  const [customPetName, setCustomPetName] = useState('');

  // Post-booking confirmed screen state
  const [confirmedAppt, setConfirmedAppt] = useState<Appointment | null>(null);

  // Appointments List states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // Active Interactive Drawers/Modals
  const [isReschedulingAppt, setIsReschedulingAppt] = useState<Appointment | null>(null);
  const [rescheduleSlotId, setRescheduleSlotId] = useState('');
  const [isAddingNotesAppt, setIsAddingNotesAppt] = useState<Appointment | null>(null);
  const [noteText, setNoteText] = useState('');
  
  // All Slots viewer modal state
  const [isViewingAllSlotsVet, setIsViewingAllSlotsVet] = useState<Vet | null>(null);

  // Role Security Checking
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isAddingVet, setIsAddingVet] = useState(false);
  const [isEditingVet, setIsEditingVet] = useState<Vet | null>(null);

  // Admin Vet Form State
  const [vetFormName, setVetFormName] = useState('');
  const [vetFormSpecialty, setVetFormSpecialty] = useState('General Practice');
  const [vetFormCategory, setVetFormCategory] = useState('vet');
  const [vetFormEmail, setVetFormEmail] = useState('');
  const [vetFormPhone, setVetFormPhone] = useState('');
  const [vetFormExp, setVetFormExp] = useState('');
  const [vetFormFee, setVetFormFee] = useState('');
  const [vetFormBio, setVetFormBio] = useState('');
  const [vetFormOnline, setVetFormOnline] = useState(false);
  const [vetFormSlots, setVetFormSlots] = useState<{ date: string; time: string }[]>([
    { date: 'Today', time: '10:00 AM' },
    { date: 'Today', time: '2:00 PM' },
    { date: 'Tomorrow', time: '11:00 AM' }
  ]);

  // Loading States
  const [isLoadingVets, setIsLoadingVets] = useState(false);
  const [isLoadingAppts, setIsLoadingAppts] = useState(false);

  // 1. Fetch Vets from API
  const fetchVets = async () => {
    setIsLoadingVets(true);
    try {
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE}/vets`, { headers });
      const data = await res.json();
      if (res.ok) {
        setVets(data.vets || []);
      }
    } catch (err) {
      console.error('Error fetching vets:', err);
    } finally {
      setIsLoadingVets(false);
    }
  };

  // 2. Fetch User Appointments
  const fetchAppointments = async () => {
    if (!token) return;
    setIsLoadingAppts(true);
    try {
      const res = await fetch(`${API_BASE}/appointments`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setAppointments(data.appointments || []);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setIsLoadingAppts(false);
    }
  };

  // Check if current user is admin whitelisted
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
      .catch(err => console.error('Failed to retrieve admin configuration in Consult & Care:', err));
    } else {
      setIsAdminUser(false);
    }
  }, [token]);

  // Admin Pass Verification
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
    fetchVets();
    fetchAppointments();

    const cachedPass = sessionStorage.getItem('aumoha_admin_password');
    if (cachedPass) {
      verifyAdminPass(cachedPass);
    }
  }, [token]);

  // Setup default pet from user context
  useEffect(() => {
    if (user?.pets && user.pets.length > 0) {
      setSelectedPetName(user.pets[0].name);
    }
  }, [user]);

  // Specialisation mock definitions with inline gradient SVGs
  const specialisations = [
    {
      id: 'General Practice',
      name: 'General Practice',
      desc: 'Routine care & checkups',
      colorClass: 'bg-gradient-to-br from-[#FAF2EE] to-[#F5DFD8]/50 border border-[#F5DFD8]',
      icon: (
        <svg className="w-5 h-5 text-terracotta" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M8 11h8M12 7v8" />
        </svg>
      )
    },
    {
      id: 'Surgery',
      name: 'Surgery',
      desc: 'Soft tissue & major surgeries',
      colorClass: 'bg-gradient-to-br from-[#FAF2EE] to-[#F5DFD8]/50 border border-[#F5DFD8]',
      icon: (
        <svg className="w-5 h-5 text-terracotta" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      )
    },
    {
      id: 'Dermatology',
      name: 'Dermatology',
      desc: 'Skin, coat & allergy care',
      colorClass: 'bg-gradient-to-br from-[#FCFAF7] to-[#F5F2EC]/50 border border-[#EBE3D5]',
      icon: (
        <svg className="w-5 h-5 text-clay" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z" />
          <path d="M12 10V22M8 14h8M6 18h12" />
        </svg>
      )
    },
    {
      id: 'Dentistry',
      name: 'Dentistry',
      desc: 'Teeth & oral health',
      colorClass: 'bg-gradient-to-br from-[#FCFAF7] to-[#F5F2EC]/50 border border-[#EBE3D5]',
      icon: (
        <svg className="w-5 h-5 text-clay" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 12c.5-2 1.5-4 4-4s3.5 2 4 4c.5 2-1 4-2.5 5.5s-2 1.5-3.5 1.5S7 17.5 7 12z" />
          <path d="M12 8c.5-1.5 1.5-3 2.5-3s2.5 1.5 2.5 3" />
        </svg>
      )
    },
    {
      id: 'Cardiology',
      name: 'Cardiology',
      desc: 'Heart & circulation care',
      colorClass: 'bg-gradient-to-br from-[#FAF2EE] to-[#F5DFD8]/50 border border-[#F5DFD8]',
      icon: (
        <svg className="w-5 h-5 text-terracotta" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.5 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      )
    },
    {
      id: 'Orthopedics',
      name: 'Orthopedics',
      desc: 'Bone, joint & mobility care',
      colorClass: 'bg-gradient-to-br from-[#FCFAF7] to-[#F5F2EC]/50 border border-[#EBE3D5]',
      icon: (
        <svg className="w-5 h-5 text-clay" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
        </svg>
      )
    },
    {
      id: 'Exotic Pet Care',
      name: 'Exotic Pet Care',
      desc: 'Birds, reptiles & small mammals',
      colorClass: 'bg-gradient-to-br from-[#FCFAF7] to-[#F5F2EC]/50 border border-[#EBE3D5]',
      icon: (
        <svg className="w-5 h-5 text-clay" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          <path d="M2 12h20" />
        </svg>
      )
    },
    {
      id: 'Oncology',
      name: 'Oncology',
      desc: 'Cancer care & management',
      colorClass: 'bg-gradient-to-br from-[#FCFAF7] to-[#F5F2EC]/50 border border-[#EBE3D5]',
      icon: (
        <svg className="w-5 h-5 text-clay" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
        </svg>
      )
    }
  ];

  // Filters logic
  const computedVets = vets.filter(v => {
    const isVet = v.category === 'vet' || !v.category;
    if (!isVet) return false;

    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.specialisation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty ? v.specialisation === selectedSpecialty : true;
    const matchesTeleconsult = subTab === 'tele' ? v.isOnline : true;

    return matchesSearch && matchesSpecialty && matchesTeleconsult;
  });

  // Action: Pick Vet & Slot to Start booking
  const handleStartBooking = (vet: Vet, slot: Slot) => {
    setSelectedVet(vet);
    setSelectedSlot(slot);
    setBookingMode(subTab === 'tele' ? 'tele-consult' : 'in-clinic');
    
    if (user?.pets && user.pets.length > 0) {
      setSelectedPetName(user.pets[0].name);
      setNewPetInput(false);
    } else {
      setSelectedPetName('');
      setNewPetInput(true);
    }
    
    setCurrentView('confirm');
  };

  // Action: Confirm Appointment Book Request
  const handleConfirmAppointment = async () => {
    if (!token || !selectedVet || !selectedSlot) return;

    const petName = newPetInput ? customPetName : selectedPetName;
    if (!petName.trim()) {
      alert('Please specify the name of your pet.');
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
          vetId: selectedVet._id,
          slotId: selectedSlot._id,
          mode: bookingMode,
          petName: petName.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setConfirmedAppt(data.appointment);
        setCurrentView('confirmed');
        fetchVets();
        fetchAppointments();
      } else {
        alert(data.message || 'Failed to complete booking.');
      }
    } catch (err) {
      console.error(err);
      alert('Network connection error booking appointment.');
    }
  };

  // Action: Cancel Appointment
  const handleCancelAppointment = async (appt: Appointment) => {
    if (!token) return;
    const confirm = window.confirm(`Are you sure you want to cancel your appointment with ${appt.vetName}?`);
    if (!confirm) return;

    try {
      const res = await fetch(`${API_BASE}/appointments/${appt._id}/cancel`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchAppointments();
        fetchVets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Action: Submit Reschedule Appointment
  const handleSubmitReschedule = async () => {
    if (!token || !isReschedulingAppt || !rescheduleSlotId) return;

    try {
      const res = await fetch(`${API_BASE}/appointments/${isReschedulingAppt._id}/reschedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          newSlotId: rescheduleSlotId
        })
      });
      if (res.ok) {
        setIsReschedulingAppt(null);
        setRescheduleSlotId('');
        fetchAppointments();
        fetchVets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Action: Submit Notes update
  const handleSubmitNotes = async () => {
    if (!token || !isAddingNotesAppt) return;

    try {
      const res = await fetch(`${API_BASE}/appointments/${isAddingNotesAppt._id}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          notes: noteText
        })
      });
      if (res.ok) {
        setIsAddingNotesAppt(null);
        setNoteText('');
        fetchAppointments();
      }
    } catch (err) {
      console.error(err);
    }
  };



  // Admin Vet Actions
  const handleSaveVet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !vetFormName || !vetFormExp || !vetFormFee) return;

    const body = {
      name: vetFormName,
      specialisation: vetFormSpecialty,
      category: vetFormCategory,
      email: vetFormEmail,
      phone: vetFormPhone,
      experience: Number(vetFormExp),
      fee: Number(vetFormFee),
      bio: vetFormBio,
      isOnline: vetFormOnline,
      availableSlots: vetFormSlots
    };

    try {
      const method = isEditingVet ? 'PUT' : 'POST';
      const endpoint = isEditingVet ? `${API_BASE}/vets/${isEditingVet._id}` : `${API_BASE}/vets`;
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
        setIsAddingVet(false);
        setIsEditingVet(null);
        resetVetForm();
        fetchVets();
      } else {
        const d = await res.json();
        alert(d.message || 'Action failed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteVet = async (vetId: string) => {
    if (!token) return;
    const confirm = window.confirm('Are you sure you want to delete this vet profile?');
    if (!confirm) return;

    try {
      const res = await fetch(`${API_BASE}/vets/${vetId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-admin-password': adminPassword
        }
      });
      if (res.ok) {
        fetchVets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleApproveVet = async (vet: Vet) => {
    if (!token) return;
    const currentApproval = vet.isApproved !== false;
    const nextApproval = !currentApproval;
    const confirm = window.confirm(`Are you sure you want to ${nextApproval ? 'approve' : 'unapprove'} ${vet.name}?`);
    if (!confirm) return;

    try {
      const res = await fetch(`${API_BASE}/vets/${vet._id}`, {
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
        fetchVets();
      } else {
        const d = await res.json();
        alert(d.message || 'Action failed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetVetForm = () => {
    setVetFormName('');
    setVetFormSpecialty('General Practice');
    setVetFormCategory('vet');
    setVetFormEmail('');
    setVetFormPhone('');
    setVetFormExp('');
    setVetFormFee('');
    setVetFormBio('');
    setVetFormOnline(false);
    setVetFormSlots([
      { date: 'Today', time: '10:00 AM' },
      { date: 'Today', time: '2:00 PM' },
      { date: 'Tomorrow', time: '11:00 AM' }
    ]);
  };

  const handleEditVetClick = (vet: Vet) => {
    setIsEditingVet(vet);
    setVetFormName(vet.name);
    setVetFormSpecialty(vet.specialisation);
    setVetFormCategory(vet.category || 'vet');
    setVetFormEmail(vet.email || '');
    setVetFormPhone(vet.phone || '');
    setVetFormExp(vet.experience.toString());
    setVetFormFee(vet.fee.toString());
    setVetFormBio(vet.bio || '');
    setVetFormOnline(vet.isOnline);
    setVetFormSlots(vet.availableSlots.map(s => ({ date: s.date, time: s.time })));
    setIsAddingVet(true);
  };

  return (
    <div className="w-full flex flex-col gap-5 sm:gap-6 animate-fadeIn select-none font-sans text-[#1C1A17] pb-4">
      
      {/* 1. SEAMLESS HERO HEADER CONTAINER */}
      <div className="relative rounded-[28px] sm:rounded-[36px] overflow-hidden border border-[#D5CEBF] shadow-xs w-full bg-[#EFEAE2]">
        <img 
          src="/VetCareHero.png" 
          alt="Vet Care" 
          className="w-full h-auto object-cover block"
        />

        {/* Back Button Floating on Top Left */}
        <div className="absolute top-4 left-4 sm:top-5 sm:left-5 z-10 select-none">
          <button 
            onClick={() => {
              if (currentView !== 'home') {
                setCurrentView('home');
              } else {
                setActiveTab('home');
              }
            }} 
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/80 bg-[#F5F2EC]/90 backdrop-blur-md flex items-center justify-center hover:bg-white transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-800">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        {/* Gated Admin Panel Button Top Right */}
        {isAdminUser && (
          <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-10 select-none">
            <button 
              onClick={() => {
                setSubTab('admin');
                setCurrentView('home');
              }}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border text-[10.5px] font-extrabold flex items-center gap-1.5 transition-all backdrop-blur-md cursor-pointer ${
                subTab === 'admin' 
                  ? 'bg-[#C85341] border-[#C85341] text-white shadow-xs' 
                  : 'border-[#D5CEBF] bg-[#F5F2EC]/85 hover:bg-white text-[#C85341]'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Admin Panel
            </button>
          </div>
        )}
      </div>

      {/* 2. SEARCH BAR */}
      {currentView === 'home' && subTab !== 'admin' && (
        <div className="flex gap-2 w-full mt-0.5">
          <div className="relative flex-grow">
            <input 
              type="text"
              placeholder="Search vets, clinics, specialities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#EFEAE2] border border-[#D5CEBF] focus:border-[#2D4536] rounded-2xl pl-9 xs:pl-10 pr-3 xs:pr-4 py-2.5 xs:py-3 text-xs sm:text-sm text-[#1C1A17] placeholder-stone-600 outline-none transition-all font-sans font-medium shadow-2xs"
            />
            <svg className="absolute left-3 xs:left-3.5 top-3 xs:top-3.5 w-3.5 xs:w-4 h-3.5 xs:h-4 text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          
          <button 
            type="button"
            onClick={() => setCurrentView('directory')}
            className="w-10 xs:w-11 h-10 xs:h-11 bg-[#EFEAE2] border border-[#D5CEBF] hover:bg-[#E6E0D6] active:scale-95 transition-all rounded-2xl flex items-center justify-center shadow-2xs shrink-0 cursor-pointer"
          >
            <svg className="w-4 h-4 text-stone-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
          </button>
        </div>
      )}

      {/* 3. CATEGORY FILTER PILLS RAIL */}
      {currentView === 'home' && subTab !== 'admin' && (
        <div className="flex items-center gap-1.5 xs:gap-2 overflow-x-auto pb-1 scrollbar-hide select-none w-full">
          <button
            onClick={() => setSelectedSpecialty(null)}
            className={`px-3 xs:px-4 py-1.5 xs:py-2 rounded-full text-[11px] xs:text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs ${
              selectedSpecialty === null
                ? 'bg-[#2D4536] text-white'
                : 'bg-[#EFEAE2] border border-[#D5CEBF] text-[#1C1A17] hover:bg-[#E6E0D6]'
            }`}
          >
            All
          </button>
          {['General Practice', 'Skin', 'Dental', 'Surgery', 'Cardiology'].map(specName => (
            <button
              key={specName}
              onClick={() => setSelectedSpecialty(selectedSpecialty === specName ? null : specName)}
              className={`px-3 xs:px-4 py-1.5 xs:py-2 rounded-full text-[11px] xs:text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-2xs ${
                selectedSpecialty === specName
                  ? 'bg-[#2D4536] text-white font-bold'
                  : 'bg-[#EFEAE2] border border-[#D5CEBF] text-[#1C1A17] hover:bg-[#E6E0D6]'
              }`}
            >
              {specName}
            </button>
          ))}
        </div>
      )}

      {/* 4. SECTION TITLE HEADER: Available near you */}
      {currentView === 'home' && subTab !== 'admin' && (
        <div className="flex items-end justify-between px-0.5 xs:px-1 mt-0.5 select-none gap-2">
          <div>
            <h2 className="font-serif text-lg xs:text-xl sm:text-2xl font-bold text-[#1C1A17] tracking-tight">Available near you</h2>
            <p className="text-[11px] xs:text-xs text-stone-500 font-medium mt-0.5">Verified professionals in your area</p>
          </div>
          <button 
            onClick={() => setCurrentView('directory')}
            className="text-[11px] xs:text-xs text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1 cursor-pointer transition-colors shrink-0 max-w-[130px] xs:max-w-none truncate"
          >
            <span className="text-[#2D4536]">📍</span>
            <span className="truncate">Rourkela, Sector 4</span>
            <span className="text-xs shrink-0">›</span>
          </button>
        </div>
      )}

      {/* 5. VET DOCTOR CARDS (RESPONSIVE MOBILE DESIGN) */}
      {currentView === 'home' && subTab !== 'admin' && (
        <div className="flex flex-col gap-3.5 xs:gap-4.5 w-full select-none">
          {(computedVets.length > 0 ? computedVets : [
            {
              _id: 'vet-1',
              name: 'Dr. Rohit Nanda',
              specialisation: 'Dermatology & Oncology',
              experience: 12,
              fee: 600,
              bio: 'Gentle healing. For a longer, healthier life.',
              rating: 4.6,
              reviewCount: 96,
              photo: '/warden-1.png',
              availableSlots: [
                { _id: 's1', date: 'Today', time: '10:30 AM', isBooked: false },
                { _id: 's2', date: 'Today', time: '1:00 PM', isBooked: false },
                { _id: 's3', date: 'Today', time: '3:30 PM', isBooked: false }
              ]
            },
            {
              _id: 'vet-2',
              name: 'Dr. Ananya Patra',
              specialisation: 'Small Animal & Surgery',
              experience: 8,
              fee: 400,
              bio: 'Compassion in every consultation.',
              rating: 4.8,
              reviewCount: 128,
              photo: '/warden-2.png',
              availableSlots: [
                { _id: 's4', date: 'Today', time: '9:00 AM', isBooked: false },
                { _id: 's5', date: 'Today', time: '11:00 AM', isBooked: false },
                { _id: 's6', date: 'Today', time: '4:30 PM', isBooked: false }
              ]
            }
          ]).map((vet: any, vetIndex: number) => (
            <div 
              key={vet._id || vetIndex}
              className="bg-[#F5F2EC] border border-[#EBE3D5] rounded-2xl sm:rounded-[24px] overflow-hidden shadow-xs flex flex-col"
            >
              {/* Upper Details Row */}
              <div className="flex flex-row items-stretch min-h-[135px] xs:min-h-[145px] sm:min-h-[160px]">
                {/* Left Side Portrait Photo */}
                <div className="w-24 xs:w-32 sm:w-40 md:w-44 bg-[#EAE4D8] relative shrink-0 overflow-hidden">
                  <img 
                    src={vet.photo || (vetIndex === 0 ? '/warden-1.png' : '/warden-2.png')} 
                    alt={vet.name} 
                    className="w-full h-full object-cover object-top" 
                  />
                </div>

                {/* Right Side Doctor Information */}
                <div className="p-2.5 xs:p-3.5 sm:p-4.5 flex flex-col justify-between flex-grow min-w-0">
                  <div className="flex flex-col gap-0.5 xs:gap-1">
                    {/* Header Row: Doctor Name + VET badge + Heart icon */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="font-serif text-sm xs:text-base sm:text-lg font-bold text-[#1C1A17] truncate">{vet.name}</h4>
                        <span className="bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded-full text-[8px] xs:text-[9px] font-extrabold uppercase shrink-0">VET</span>
                      </div>
                      <button className="text-stone-400 hover:text-rose-500 transition-colors p-0.5 xs:p-1 cursor-pointer shrink-0">
                        <svg className="w-3.5 xs:w-4 h-3.5 xs:h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </button>
                    </div>

                    {/* Specialization */}
                    <span className="text-[11px] xs:text-xs text-stone-600 font-medium leading-tight truncate">{vet.specialisation}</span>

                    {/* Rating & Experience */}
                    <div className="flex flex-wrap items-center gap-1 text-[10.5px] xs:text-xs text-stone-600 font-medium mt-0.5">
                      <span className="text-amber-500 font-bold">★ {vet.rating || 4.6}</span>
                      <span className="text-stone-500 text-[10px] xs:text-[11px]">({vet.reviewCount || 96})</span>
                      <span className="text-stone-300">|</span>
                      <span className="text-[10.5px] xs:text-xs">{vet.experience || 10} yrs exp</span>
                    </div>

                    {/* Quote */}
                    <p className="text-[10.5px] xs:text-xs italic text-stone-600 font-serif leading-snug mt-0.5 line-clamp-1">
                      "{vet.bio || (vetIndex === 0 ? 'Gentle healing. For a longer, healthier life.' : 'Compassion in every consultation.')}"
                    </p>
                  </div>

                  {/* Price Tag */}
                  <div className="text-right mt-1">
                    <span className="font-serif text-sm xs:text-base sm:text-lg font-bold text-[#1C1A17]">₹{vet.fee || (vetIndex === 0 ? 600 : 400)}</span>
                    <span className="text-[9.5px] xs:text-[10px] text-stone-500 font-medium block">In-clinic</span>
                  </div>
                </div>
              </div>

              {/* Lower Slot Bar */}
              <div className="p-2.5 xs:p-3 bg-[#EFEBE3] border-t border-[#EBE3D5] flex items-center justify-between gap-1.5 xs:gap-2.5 select-none">
                <span className="text-[11px] xs:text-xs font-bold text-[#1C1A17] pl-0.5 xs:pl-1 shrink-0">Today</span>

                <div className="flex items-center gap-1.5 xs:gap-2 overflow-x-auto scrollbar-hide">
                  {(vet.availableSlots && vet.availableSlots.length > 0 ? vet.availableSlots : [
                    { _id: 's1', time: vetIndex === 0 ? '10:30 AM' : '9:00 AM' },
                    { _id: 's2', time: vetIndex === 0 ? '1:00 PM' : '11:00 AM' },
                    { _id: 's3', time: vetIndex === 0 ? '3:30 PM' : '4:30 PM' }
                  ]).slice(0, 3).map((slot: any, slotIdx: number) => (
                    <button
                      key={slot._id || slotIdx}
                      onClick={() => handleStartBooking(vet, slot)}
                      className={`px-2.5 xs:px-3.5 py-1 xs:py-1.5 rounded-full text-[10.5px] xs:text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95 ${
                        slotIdx === 1
                          ? 'bg-[#2D4536] text-white shadow-2xs'
                          : 'bg-[#F5F2EC] border border-[#EBE3D5] text-[#1C1A17] hover:bg-[#EAE4D8]'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setIsViewingAllSlotsVet(vet)}
                  className="text-[10.5px] xs:text-xs font-bold text-stone-600 hover:text-stone-900 shrink-0 cursor-pointer pr-0.5 xs:pr-1 whitespace-nowrap"
                >
                  View all →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================== SCREEN 2 & 6: VET LIST DIRECTORY SCREEN ==================== */}
      {currentView === 'directory' && (
        <div className="flex flex-col gap-5 w-full animate-fadeIn">
          
          {/* SEARCH BAR WITH FILTERS */}
          <div className="flex gap-2 w-full">
            <div className="relative flex-grow">
              <input 
                type="text"
                placeholder="Search vets, specialties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-terracotta/40 shadow-sm"
              />
              <svg className="absolute left-3 top-3.5 w-4 h-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            
            <button 
              type="button"
              onClick={() => { setSelectedSpecialty(null); setSearchQuery(''); }}
              className="px-3.5 py-2.5 bg-[#FCFAF7] border border-[#F0EBE1] text-[10px] font-bold rounded-2xl flex items-center gap-1.5 shadow-sm text-stone-600 hover:bg-stone-50 transition-all shrink-0 active:scale-95"
            >
              Reset
            </button>
          </div>

          {/* ACTIVE SPECIALTY FILTER CHIPS */}
          <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-hide select-none">
            <button
              type="button"
              onClick={() => setSelectedSpecialty(null)}
              className={`px-4 py-2 border rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer active:scale-95 shadow-xs ${
                selectedSpecialty === null 
                  ? 'bg-terracotta border-terracotta text-white shadow-sm' 
                  : 'bg-white border-[#F0EBE1] text-stone-600 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
              All Specialties
            </button>
            {specialisations.map(spec => (
              <button
                key={spec.id}
                type="button"
                onClick={() => setSelectedSpecialty(spec.id)}
                className={`px-4 py-2 border rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer active:scale-95 shadow-xs ${
                  selectedSpecialty === spec.id
                    ? 'bg-terracotta border-terracotta text-white shadow-sm' 
                    : 'bg-white border-[#F0EBE1] text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                {spec.name}
              </button>
            ))}
          </div>

          {/* VETS DIRECTORY CARDS LIST */}
          <div className="flex flex-col gap-4 w-full">
            {isLoadingVets ? (
              <div className="w-full text-center py-10 text-xs text-stone-500 font-semibold">Loading doctors directory...</div>
            ) : computedVets.length === 0 ? (
              <div className="w-full text-center py-10 text-xs text-stone-500 font-semibold border border-dashed border-[#F0EBE1] rounded-2xl bg-[#FCFAF7]">
                No doctors matching selected specialties found.
              </div>
            ) : computedVets.map(vet => (
              <div 
                key={vet._id}
                className="bg-[#EFEAE2] border border-[#D5CEBF] rounded-[24px] p-4 flex flex-col gap-3.5 shadow-sm"
              >
                {/* Vet Header card section */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-stone-100 border border-[#F0EBE1]/60 relative shrink-0">
                      {vet.photo ? (
                        <img src={vet.photo} alt={vet.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#E2E8F0] to-[#CBD5E1] flex items-center justify-center text-stone-600 font-bold text-sm">
                          {vet.name.split(' ').map(n => n[0]).join('').replace('Dr.', '')}
                        </div>
                      )}
                      {vet.isOnline && (
                        <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border border-white"></span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-charcoal flex items-center gap-1.5">
                        {vet.name}
                      </h4>
                      <span className="text-[10px] text-stone-500 font-semibold block mt-0.5">{vet.specialisation} • {vet.experience} yrs</span>
                      
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-amber-500 text-[10px]">★</span>
                        <span className="text-[10px] font-extrabold text-charcoal">{vet.rating}</span>
                        <span className="text-[9.5px] text-stone-400 font-semibold">({vet.reviewCount} reviews)</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1.5">
                    <span className="text-sm font-extrabold text-terracotta">₹{vet.fee}</span>
                    <div className="flex gap-1">
                      <span className="text-[8px] bg-[#FCFAF7] text-clay border border-[#EBE3D5] rounded-md px-1.5 py-0.5 font-bold uppercase">Today</span>
                      <span className="text-[8px] bg-[#FAF2EE] text-terracotta border border-[#F5DFD8] rounded-md px-1.5 py-0.5 font-bold uppercase">Online</span>
                    </div>
                  </div>
                </div>

                {/* Available slots picker inside the card */}
                <div className="flex flex-col gap-2.5 pt-2.5 border-t border-stone-100">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider">Next Available Slots</span>
                    {/* View all slots triggers a nice modal sheet */}
                    <button 
                      type="button"
                      onClick={() => setIsViewingAllSlotsVet(vet)}
                      className="text-[9px] font-extrabold text-terracotta hover:underline"
                    >
                      View all slots ›
                    </button>
                  </div>
                  
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {vet.availableSlots && vet.availableSlots.filter(s => !s.isBooked).slice(0, 4).map((slot, index) => (
                      <button
                        key={slot._id}
                        onClick={() => handleStartBooking(vet, slot)}
                        className={`px-3.5 py-2 border rounded-xl text-[10px] font-bold text-center transition-all shrink-0 active:scale-95 flex flex-col gap-0.5 min-w-[70px] ${
                          index === 0
                            ? 'bg-terracotta border-terracotta text-white shadow-sm hover:bg-[#c2502f]'
                            : 'bg-[#FCFAF7] border-[#F0EBE1] text-charcoal hover:bg-white'
                        }`}
                      >
                        <span className={`text-[8px] opacity-75 font-bold ${index === 0 ? 'text-white/80' : 'text-stone-400'}`}>{slot.date}</span>
                        <span>{slot.time}</span>
                      </button>
                    ))}
                    {(!vet.availableSlots || vet.availableSlots.filter(s => !s.isBooked).length === 0) && (
                      <span className="text-[9.5px] text-stone-400 font-semibold italic py-1 pl-1">No slots available. Contact clinic for schedules.</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* VIEW ALL AVAILABLE SLOTS BOTTOM SHEET MODAL */}
          {isViewingAllSlotsVet && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-end md:items-center justify-center px-4 transition-all">
              <div className="bg-white rounded-t-3xl md:rounded-3xl p-5 w-full max-w-sm flex flex-col gap-4 shadow-xl border border-warmBeige">
                <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                  <h3 className="text-xs font-extrabold text-stone-500 uppercase">All Available Slots</h3>
                  <button 
                    type="button"
                    onClick={() => setIsViewingAllSlotsVet(null)}
                    className="text-stone-400 hover:text-stone-600 font-extrabold text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="text-[10px] text-stone-500 font-semibold mb-1">
                  Select an appointment slot with <strong>{isViewingAllSlotsVet.name}</strong>:
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pb-1">
                  {isViewingAllSlotsVet.availableSlots.filter(s => !s.isBooked).map(slot => (
                    <button
                      key={slot._id}
                      type="button"
                      onClick={() => {
                        handleStartBooking(isViewingAllSlotsVet, slot);
                        setIsViewingAllSlotsVet(null);
                      }}
                      className="p-2.5 border border-[#F0EBE1] hover:border-terracotta/30 bg-[#FCFAF7] hover:bg-white rounded-xl text-[10px] font-bold text-terracotta text-center transition-all active:scale-95 flex flex-col gap-0.5"
                    >
                      <span className="text-[8px] text-stone-400 font-bold">{slot.date}</span>
                      <span>{slot.time}</span>
                    </button>
                  ))}
                  {isViewingAllSlotsVet.availableSlots.filter(s => !s.isBooked).length === 0 && (
                    <span className="text-[10px] text-stone-400 font-semibold italic col-span-2 text-center py-2">No other slots are currently available.</span>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ==================== SCREEN 3: CONFIRM BOOKING FLOW ==================== */}
      {currentView === 'confirm' && selectedVet && selectedSlot && (
        <div className="flex flex-col gap-5 w-full animate-fadeIn">
          
          {/* Selected Vet Summary Card */}
          <div className="bg-[#FCFAF7] border border-[#F0EBE1] rounded-[24px] p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-100 border border-[#F0EBE1] relative shrink-0">
              {selectedVet.photo ? (
                <img src={selectedVet.photo} alt={selectedVet.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#E2E8F0] to-[#CBD5E1] flex items-center justify-center text-stone-600 font-bold text-sm">
                  {selectedVet.name.split(' ').map(n => n[0]).join('').replace('Dr.', '')}
                </div>
              )}
              {selectedVet.isOnline && (
                <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 rounded-full border border-white"></span>
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold text-charcoal">{selectedVet.name}</h4>
              <span className="text-[10px] text-stone-500 font-semibold block mt-0.5">{selectedVet.specialisation}</span>
            </div>
          </div>

          {/* Consultation Mode Picker */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider px-1">Consultation Mode</label>
            <div className="grid grid-cols-2 bg-[#FCFAF7] border border-[#F0EBE1] p-1 rounded-2xl w-full">
              <button 
                type="button"
                onClick={() => setBookingMode('in-clinic')}
                className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                  bookingMode === 'in-clinic' ? 'bg-white shadow-sm text-terracotta border border-[#EBE3D5]/20' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                In-Clinic Consult
              </button>
              <button 
                type="button"
                onClick={() => setBookingMode('tele-consult')}
                className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                  bookingMode === 'tele-consult' ? 'bg-white shadow-sm text-terracotta border border-[#EBE3D5]/20' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                Tele-Consult (Online)
              </button>
            </div>
          </div>

          {/* Pet Picker */}
          <div className="flex flex-col gap-2.5 bg-white border border-[#F0EBE1] rounded-[24px] p-4 shadow-sm">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Select Pet</label>
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
                placeholder="Enter pet name (e.g. Bruno)"
                value={customPetName}
                onChange={(e) => setCustomPetName(e.target.value)}
                className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-terracotta/40"
              />
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {user?.pets && user.pets.map((pet: any) => (
                  <button
                    key={pet._id}
                    type="button"
                    onClick={() => setSelectedPetName(pet.name)}
                    className={`px-4 py-2.5 border rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                      selectedPetName === pet.name 
                        ? 'bg-[#FAF2EE] border-terracotta text-terracotta shadow-sm' 
                        : 'bg-white border-[#F0EBE1] text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <DogIcon className="w-4 h-4 text-terracotta" /> {pet.name}
                  </button>
                ))}
                {(!user?.pets || user.pets.length === 0) && (
                  <span className="text-[10px] text-stone-400 font-semibold italic">No registered pets found. Add a custom name.</span>
                )}
              </div>
            )}
          </div>

          {/* Booking Summary Table */}
          <div className="bg-white border border-[#F0EBE1] rounded-[28px] p-5 flex flex-col gap-3 shadow-sm">
            <h3 className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider border-b border-stone-100 pb-2">Booking Summary</h3>
            
            <table className="w-full border-collapse text-xs font-semibold text-stone-600">
              <tbody>
                <tr className="border-b border-stone-100">
                  <td className="py-2.5 text-stone-400 font-medium">Vet</td>
                  <td className="py-2.5 text-right font-extrabold text-charcoal">{selectedVet.name}</td>
                </tr>
                <tr className="border-b border-stone-100">
                  <td className="py-2.5 text-stone-400 font-medium">Date / Time</td>
                  <td className="py-2.5 text-right font-extrabold text-emerald-700">{selectedSlot.date} • {selectedSlot.time}</td>
                </tr>
                <tr className="border-b border-stone-100">
                  <td className="py-2.5 text-stone-400 font-medium">Mode</td>
                  <td className="py-2.5 text-right font-extrabold text-charcoal capitalize">{bookingMode}</td>
                </tr>
                <tr className="border-b border-stone-100">
                  <td className="py-2.5 text-stone-400 font-medium">Pet</td>
                  <td className="py-2.5 text-right font-extrabold text-charcoal flex items-center justify-end gap-1.5">
                    <span>{newPetInput ? customPetName : selectedPetName}</span>
                    {/* Inline Vector SVG for Dog Icon */}
                    <svg className="w-3.5 h-3.5 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 5.172A2 2 0 0 0 8.586 4.5H5.414A2 2 0 0 0 4 5.172L2 7.172A2 2 0 0 0 1.5 8.586V14a2 2 0 0 0 2 2h1v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2h1a2 2 0 0 0 2-2v-5.414a2 2 0 0 0-.586-1.414L10 5.172z" />
                    </svg>
                  </td>
                </tr>
                <tr className="border-b border-stone-100">
                  <td className="py-2.5 text-stone-400 font-medium">Consultation Fee</td>
                  <td className="py-2.5 text-right font-extrabold text-charcoal">₹{selectedVet.fee}</td>
                </tr>
                <tr className="pt-2">
                  <td className="py-3 text-charcoal font-extrabold text-sm">Total</td>
                  <td className="py-3 text-right font-extrabold text-terracotta text-sm">₹{selectedVet.fee}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Confirm Appointment CTA */}
          <button 
            onClick={handleConfirmAppointment}
            className="w-full py-3.5 bg-terracotta hover:bg-[#c2502f] text-white text-xs font-extrabold rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Confirm Appointment <span>→</span>
          </button>

        </div>
      )}

      {/* ==================== SCREEN 4: BOOKING CONFIRMED SUCCESS ==================== */}
      {currentView === 'confirmed' && confirmedAppt && (
        <div className="flex flex-col items-center justify-center text-center gap-6 py-6 w-full animate-fadeIn select-none">
          
          {/* Confetti Accent Checkmark */}
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 z-10">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            
            {/* Sparkle SVG shapes floating */}
            <svg className="absolute -top-3 -left-3 w-5 h-5 text-amber-400 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <svg className="absolute -bottom-3 -right-3 w-4 h-4 text-rose-400 animate-ping" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>

          <div>
            <h2 className="font-serif font-extrabold text-xl text-terracotta">Booking Confirmed!</h2>
            <p className="text-[10px] text-stone-500 font-semibold mt-1 max-w-[280px] mx-auto">
              Your appointment request is scheduled. A confirmation email has been dispatched.
            </p>
          </div>

          {/* Details Summary Card */}
          <div className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-[24px] p-5 text-left flex flex-col gap-2.5">
            <span className="text-[8px] font-extrabold text-terracotta uppercase tracking-widest block">Summary Card</span>
            
            <div className="flex justify-between items-center text-xs font-semibold text-stone-600 border-b border-stone-100 pb-2">
              <span className="text-stone-400">Doctor</span>
              <span className="font-extrabold text-charcoal">{confirmedAppt.vetName}</span>
            </div>

            <div className="flex justify-between items-center text-xs font-semibold text-stone-600 border-b border-stone-100 pb-2">
              <span className="text-stone-400">Date / Time</span>
              <span className="font-extrabold text-emerald-700">{confirmedAppt.date} • {confirmedAppt.time}</span>
            </div>

            <div className="flex justify-between items-center text-xs font-semibold text-stone-600 border-b border-stone-100 pb-2">
              <span className="text-stone-400">Fee Mode</span>
              <span className="font-extrabold text-charcoal">₹{confirmedAppt.fee} ({confirmedAppt.mode === 'tele-consult' ? 'Online' : 'In-Clinic'})</span>
            </div>

            <div className="flex justify-between items-center text-xs font-semibold text-stone-600 pt-0.5">
              <span className="text-stone-400">Booking ID</span>
              <span className="font-extrabold text-terracotta">{confirmedAppt.bookingId}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col gap-2.5 w-full mt-2">
            <button 
              onClick={() => {
                setSubTab('my-appts');
                setCurrentView('home');
              }}
              className="w-full py-3 bg-terracotta hover:bg-[#c2502f] text-white text-xs font-extrabold rounded-2xl shadow-sm transition-all"
            >
              View Appointments
            </button>
            <button 
              onClick={() => {
                setCurrentView('home');
              }}
              className="w-full py-3 bg-white border border-[#F0EBE1] hover:bg-stone-50 text-stone-600 text-xs font-extrabold rounded-2xl shadow-sm transition-all"
            >
              Back to Consult Home
            </button>
          </div>

        </div>
      )}

      {/* ==================== SCREEN 5: MY APPOINTMENTS LIST ==================== */}
      {currentView === 'home' && subTab === 'my-appts' && (
        <div className="flex flex-col gap-4 w-full animate-fadeIn">
          
          <h3 className="text-xs font-extrabold text-stone-400 uppercase tracking-wider px-1">Upcoming Appointments</h3>

          {isLoadingAppts ? (
            <div className="w-full text-center py-8 text-xs text-stone-500 font-semibold">Loading appointments list...</div>
          ) : appointments.length === 0 ? (
            <div className="w-full text-center py-10 text-xs text-stone-500 font-semibold border border-dashed border-[#F0EBE1] rounded-2xl bg-[#FCFAF7]">
              You don't have any booked vet appointments.
            </div>
          ) : (
            <div className="flex flex-col gap-4 w-full">
              {appointments.map(appt => (
                <div 
                  key={appt._id}
                  className="bg-white border border-[#F0EBE1] rounded-[24px] p-4 flex flex-col gap-3 shadow-sm relative overflow-hidden"
                >
                  {/* Left accent bar matching status */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    appt.status === 'cancelled' 
                      ? 'bg-rose-400' 
                      : appt.status === 'confirmed' 
                        ? 'bg-emerald-600' 
                        : 'bg-amber-400'
                  }`} />

                  {/* Header info */}
                  <div className="flex justify-between items-start pl-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-charcoal">{appt.vetName}</h4>
                        {appt.type === 'expert' ? (
                          <span className="text-[7.5px] font-extrabold uppercase bg-[#FAF2EE] text-terracotta border border-[#F5DFD8] rounded px-1 shrink-0">Specialist</span>
                        ) : (
                          <span className="text-[7.5px] font-extrabold uppercase bg-[#FCFAF7] text-clay border border-[#EBE3D5] rounded px-1 shrink-0">Vet</span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-500 font-semibold block mt-0.5">{appt.vetSpecialisation}</span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase ${
                      appt.status === 'cancelled'
                        ? 'bg-rose-50 text-rose-600 border border-rose-100'
                        : appt.status === 'confirmed'
                          ? 'bg-[#FAF2EE] text-terracotta border border-[#F5DFD8]'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {appt.status}
                    </span>
                  </div>

                  {/* Metadata Row with High Quality SVGs */}
                  <div className="flex flex-col md:flex-row gap-3 md:items-center pl-1 bg-[#FCFAF7] border border-[#F0EBE1] rounded-xl p-2.5 text-[10px] text-stone-600 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 5.172A2 2 0 0 0 8.586 4.5H5.414A2 2 0 0 0 4 5.172L2 7.172A2 2 0 0 0 1.5 8.586V14a2 2 0 0 0 2 2h1v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2h1a2 2 0 0 0 2-2v-5.414a2 2 0 0 0-.586-1.414L10 5.172z" />
                      </svg>
                      <strong>For:</strong> {appt.petName}
                    </div>
                    
                    <div className="hidden md:block text-stone-300">|</div>
                    
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <strong>Slot:</strong> {appt.date} • {appt.time}
                    </div>

                    <div className="hidden md:block text-stone-300">|</div>

                    <div className="flex items-center gap-1.5 text-terracotta">
                      <svg className="w-3.5 h-3.5 text-terracotta" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <rect x="2" y="6" width="20" height="12" rx="2" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <strong>Fee:</strong> ₹{appt.fee} ({appt.mode === 'tele-consult' ? 'Tele-consult' : 'In-Clinic'})
                    </div>
                  </div>

                  {appt.notes && (
                    <div className="pl-1 text-[9.5px] text-stone-500 italic">
                      <strong>Notes:</strong> {appt.notes}
                    </div>
                  )}

                  {/* Booking Actions Row with Vector SVGs */}
                  {appt.status !== 'cancelled' && (
                    <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => {
                          setIsReschedulingAppt(appt);
                          const originalVet = vets.find(v => v.name === appt.vetName);
                          if (originalVet) {
                            setSelectedVet(originalVet);
                          }
                        }}
                        className="py-2 border border-warmBeige text-terracotta hover:bg-stone-50 rounded-xl text-[9px] font-extrabold text-center transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-3 h-3 text-terracotta" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        Reschedule
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNotesAppt(appt);
                          setNoteText(appt.notes || '');
                        }}
                        className="py-2 border border-warmBeige text-stone-600 hover:bg-stone-50 rounded-xl text-[9px] font-extrabold text-center transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-3 h-3 text-stone-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        Add Notes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelAppointment(appt)}
                        className="py-2 border border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl text-[9px] font-extrabold text-center transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-3 h-3 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        </svg>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ==================== ACTION MODAL: RESCHEDULE SLOT PICKER ==================== */}
      {isReschedulingAppt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-end md:items-center justify-center px-4 transition-all">
          <div className="bg-white rounded-t-3xl md:rounded-3xl p-5 w-full max-w-sm flex flex-col gap-4 shadow-xl border border-warmBeige">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <h3 className="text-xs font-extrabold text-stone-500 uppercase">Reschedule Appointment</h3>
              <button 
                onClick={() => { setIsReschedulingAppt(null); setSelectedVet(null); setRescheduleSlotId(''); }}
                className="text-stone-400 hover:text-stone-600 font-extrabold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-stone-500 font-semibold leading-relaxed">
              Pick a new available slot for <strong>{isReschedulingAppt.vetName}</strong>:
            </div>

            {selectedVet && selectedVet.availableSlots ? (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pb-1">
                {selectedVet.availableSlots.filter(s => !s.isBooked).map(slot => (
                  <button
                    key={slot._id}
                    type="button"
                    onClick={() => setRescheduleSlotId(slot._id)}
                    className={`p-2.5 border rounded-xl text-[10px] font-bold text-center transition-all active:scale-95 ${
                      rescheduleSlotId === slot._id
                        ? 'bg-terracotta border-terracotta text-white shadow-sm'
                        : 'bg-white border-[#F0EBE1] text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <div>{slot.date}</div>
                    <div className="text-[8px] opacity-75 mt-0.5">{slot.time}</div>
                  </button>
                ))}
                {selectedVet.availableSlots.filter(s => !s.isBooked).length === 0 && (
                  <span className="text-[10px] text-stone-400 font-semibold italic col-span-2">No other slots are currently available.</span>
                )}
              </div>
            ) : (
              <span className="text-[10px] text-stone-400 font-semibold italic">Retrieving vet schedules...</span>
            )}

            <button
              onClick={handleSubmitReschedule}
              disabled={!rescheduleSlotId}
              className="w-full py-3 bg-terracotta hover:bg-[#c2502f] disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-2xl shadow-sm transition-all"
            >
              Update Rescheduled Slot
            </button>
          </div>
        </div>
      )}

      {/* ==================== ACTION MODAL: ADD / EDIT NOTES ==================== */}
      {isAddingNotesAppt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-end md:items-center justify-center px-4 transition-all">
          <div className="bg-white rounded-t-3xl md:rounded-3xl p-5 w-full max-w-sm flex flex-col gap-4 shadow-xl border border-warmBeige">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <h3 className="text-xs font-extrabold text-stone-500 uppercase">Consultation Notes</h3>
              <button 
                onClick={() => { setIsAddingNotesAppt(null); setNoteText(''); }}
                className="text-stone-400 hover:text-stone-600 font-extrabold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-stone-500 font-semibold">
              Add symptoms, medical history, or details for <strong>{isAddingNotesAppt.vetName}</strong>:
            </div>

            <textarea 
              rows={4}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. Needs a rabies booster shot. Experiencing mild skin rash since 2 days..."
              className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl p-3 text-xs font-semibold focus:outline-none focus:border-terracotta/40"
            />

            <button
              onClick={handleSubmitNotes}
              className="w-full py-3 bg-terracotta hover:bg-[#c2502f] text-white text-xs font-extrabold rounded-2xl shadow-sm transition-all"
            >
              Save Consultation Notes
            </button>
          </div>
        </div>
      )}

      {/* ==================== SCREEN 6: VET ADMINISTRATION CONTROLS ==================== */}
      {currentView === 'home' && subTab === 'admin' && (
        <div className="flex flex-col gap-5 w-full animate-fadeIn select-none">
          
          {!isAdminAuthenticated ? (
            <div className="bg-white border border-[#F0EBE1] rounded-[28px] p-6 shadow-sm flex flex-col gap-4 items-center justify-center text-center max-w-xs mx-auto my-6">
              <div className="w-12 h-12 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-600 shrink-0">
                <LockIcon className="w-6 h-6 text-terracotta" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-charcoal">Admin Credentials Verification</h4>
                <p className="text-[9.5px] text-stone-400 font-semibold mt-1">Please enter your whitelist administrator passcode to configure doctor directory.</p>
              </div>

              <input 
                type="password"
                placeholder="Enter admin passcode"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl px-4 py-2.5 text-xs text-center font-bold focus:outline-none"
              />

              {adminError && <span className="text-[9px] text-rose-500 font-bold block">{adminError}</span>}

              <button 
                onClick={() => verifyAdminPass(adminPassword)}
                className="w-full py-2.5 bg-terracotta hover:bg-[#c2502f] text-white text-xs font-bold rounded-2xl shadow-sm"
              >
                Unlock Directory Settings
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 w-full">
              
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest">Active Vet Registry</span>
                <button
                  onClick={() => {
                    setIsEditingVet(null);
                    resetVetForm();
                    setIsAddingVet(true);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold shadow-sm"
                >
                  + Add Vet Profile
                </button>
              </div>

              {/* LIST VETS FOR EDIT/DELETE */}
              <div className="flex flex-col gap-3.5">
                {vets.map(vet => (
                  <div key={vet._id} className="bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-stone-100 border border-[#F0EBE1] flex items-center justify-center font-bold text-stone-600 text-xs">
                        {vet.photo ? (
                          <img src={vet.photo} alt={vet.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#E2E8F0] to-[#CBD5E1] flex items-center justify-center text-stone-600 font-bold text-sm">
                            {vet.name.split(' ').map(n => n[0]).join('').replace('Dr.', '')}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-charcoal">{vet.name}</h4>
                        <span className="text-[9.5px] text-stone-500 font-semibold block">{vet.specialisation}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleApproveVet(vet)}
                        className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold border transition-colors ${
                          vet.isApproved !== false
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'
                            : 'bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-100'
                        }`}
                      >
                        {vet.isApproved !== false ? 'Approved' : 'Pending'}
                      </button>
                      <button
                        onClick={() => handleEditVetClick(vet)}
                        className="px-2.5 py-1.5 bg-white border border-warmBeige hover:bg-stone-50 text-stone-600 rounded-lg text-[9px] font-bold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteVet(vet._id)}
                        className="px-2.5 py-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 rounded-lg text-[9px] font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ADD/EDIT VET FORM MODAL */}
              {isAddingVet && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-end md:items-center justify-center px-4 transition-all">
                  <form 
                    onSubmit={handleSaveVet}
                    className="bg-white rounded-t-3xl md:rounded-3xl p-5 w-full max-w-md flex flex-col gap-4 shadow-xl border border-warmBeige max-h-[85vh] overflow-y-auto"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                      <h3 className="text-xs font-extrabold text-stone-500 uppercase">{isEditingVet ? 'Edit Doctor Profile' : 'Add Doctor Profile'}</h3>
                      <button 
                        type="button"
                        onClick={() => { setIsAddingVet(false); setIsEditingVet(null); resetVetForm(); }}
                        className="text-stone-400 hover:text-stone-600 font-extrabold text-xs"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block mb-1">Vet Full Name</label>
                        <input 
                          type="text"
                          required
                          placeholder="Dr. Sima Rath"
                          value={vetFormName}
                          onChange={(e) => setVetFormName(e.target.value)}
                          className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block mb-1">Category / Role</label>
                          <select
                            value={vetFormCategory}
                            onChange={(e) => setVetFormCategory(e.target.value)}
                            className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                          >
                            <option value="vet">Veterinarian</option>
                            <option value="Nutritionist">Nutritionist</option>
                            <option value="Animal Behaviourist">Animal Behaviourist</option>
                            <option value="Trainer">Trainer</option>
                            <option value="Behaviourist">Behaviourist</option>
                            <option value="Physiotherapist">Physiotherapist</option>
                            <option value="Wellness & Palliative">Wellness & Palliative</option>
                            <option value="Homeopathy Vet">Homeopathy Vet</option>
                            <option value="Rehab Specialist">Rehab Specialist</option>
                            <option value="At-Home Support">At-Home Support</option>
                            <option value="Communicator/Psychotherapist/Reiki Healing">Reiki Healing / Communicator</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block mb-1">Specialisation / Title</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. General Practice, Canine Behavior"
                            value={vetFormSpecialty}
                            onChange={(e) => setVetFormSpecialty(e.target.value)}
                            className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block mb-1">Email Address</label>
                          <input 
                            type="email"
                            placeholder="doctor@aumoha.com"
                            value={vetFormEmail}
                            onChange={(e) => setVetFormEmail(e.target.value)}
                            className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block mb-1">Phone Number</label>
                          <input 
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={vetFormPhone}
                            onChange={(e) => setVetFormPhone(e.target.value)}
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
                            value={vetFormExp}
                            onChange={(e) => setVetFormExp(e.target.value)}
                            className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block mb-1">Consultation Fee (₹)</label>
                          <input 
                            type="number"
                            required
                            placeholder="400"
                            value={vetFormFee}
                            onChange={(e) => setVetFormFee(e.target.value)}
                            className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox"
                          id="vetFormOnline"
                          checked={vetFormOnline}
                          onChange={(e) => setVetFormOnline(e.target.checked)}
                          className="w-4 h-4 rounded border-stone-300 text-terracotta focus:ring-terracotta"
                        />
                        <label htmlFor="vetFormOnline" className="text-[10px] font-bold text-stone-600 cursor-pointer">Online / Tele-consult Availability</label>
                      </div>

                      <div>
                        <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block mb-1">Biography / Info</label>
                        <textarea 
                          rows={2}
                          placeholder="Short description of clinical specialties..."
                          value={vetFormBio}
                          onChange={(e) => setVetFormBio(e.target.value)}
                          className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-xl p-3 text-xs font-semibold focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block">Available Slots</label>
                          <button
                            type="button"
                            onClick={() => setVetFormSlots([...vetFormSlots, { date: 'Today', time: '10:00 AM' }])}
                            className="text-[9px] font-extrabold text-emerald-600 hover:underline"
                          >
                            + Add Time Slot
                          </button>
                        </div>

                        <div className="flex flex-col gap-2 max-h-32 overflow-y-auto pb-1">
                          {vetFormSlots.map((s, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <select
                                value={s.date}
                                onChange={(e) => {
                                  const updated = [...vetFormSlots];
                                  updated[idx].date = e.target.value;
                                  setVetFormSlots(updated);
                                }}
                                className="bg-[#FCFAF7] border border-[#F0EBE1] rounded-lg px-2 py-1 text-[10px] font-semibold flex-grow"
                              >
                                <option value="Today">Today</option>
                                <option value="Tomorrow">Tomorrow</option>
                              </select>
                              <input 
                                type="text"
                                value={s.time}
                                onChange={(e) => {
                                  const updated = [...vetFormSlots];
                                  updated[idx].time = e.target.value;
                                  setVetFormSlots(updated);
                                }}
                                className="bg-[#FCFAF7] border border-[#F0EBE1] rounded-lg px-2 py-1 text-[10px] font-semibold w-24 text-center"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...vetFormSlots];
                                  updated.splice(idx, 1);
                                  setVetFormSlots(updated);
                                }}
                                className="text-rose-500 font-bold text-xs px-1"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-terracotta hover:bg-[#c2502f] text-white text-xs font-extrabold rounded-2xl shadow-sm transition-all"
                    >
                      {isEditingVet ? 'Save Changes' : 'Create Vet Profile'}
                    </button>
                  </form>
                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}
