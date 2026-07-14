'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

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

  // Admin Dashboard States
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isAddingVet, setIsAddingVet] = useState(false);
  const [isEditingVet, setIsEditingVet] = useState<Vet | null>(null);

  // Admin Vet Form State
  const [vetFormName, setVetFormName] = useState('');
  const [vetFormSpecialty, setVetFormSpecialty] = useState('General Practice');
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
      const res = await fetch('http://localhost:5001/api/vets');
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
      const res = await fetch('http://localhost:5001/api/appointments', {
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

  useEffect(() => {
    fetchVets();
    fetchAppointments();

    // Recover cached admin password if active in session
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
      icon: (
        <svg className="w-6 h-6 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M8 11h8M12 7v8" />
        </svg>
      )
    },
    {
      id: 'Surgery',
      name: 'Surgery',
      desc: 'Soft tissue & major surgeries',
      icon: (
        <svg className="w-6 h-6 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      icon: (
        <svg className="w-6 h-6 text-orange-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z" />
          <path d="M12 10V22M8 14h8M6 18h12" />
        </svg>
      )
    },
    {
      id: 'Dentistry',
      name: 'Dentistry',
      desc: 'Teeth & oral health',
      icon: (
        <svg className="w-6 h-6 text-cyan-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 12c.5-2 1.5-4 4-4s3.5 2 4 4c.5 2-1 4-2.5 5.5s-2 1.5-3.5 1.5S7 17.5 7 12z" />
          <path d="M12 8c.5-1.5 1.5-3 2.5-3s2.5 1.5 2.5 3" />
        </svg>
      )
    },
    {
      id: 'Cardiology',
      name: 'Cardiology',
      desc: 'Heart & circulation care',
      icon: (
        <svg className="w-6 h-6 text-rose-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.5 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      )
    },
    {
      id: 'Orthopedics',
      name: 'Orthopedics',
      desc: 'Bone, joint & mobility care',
      icon: (
        <svg className="w-6 h-6 text-indigo-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
        </svg>
      )
    },
    {
      id: 'Exotic Pet Care',
      name: 'Exotic Pet Care',
      desc: 'Birds, reptiles & small mammals',
      icon: (
        <svg className="w-6 h-6 text-teal-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      icon: (
        <svg className="w-6 h-6 text-purple-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
        </svg>
      )
    }
  ];

  // Filters logic
  const computedVets = vets.filter(v => {
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
    
    // Pick default pet name or input custom one
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
      const res = await fetch('http://localhost:5001/api/appointments', {
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
        // Refresh listings
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
      const res = await fetch(`http://localhost:5001/api/appointments/${appt._id}/cancel`, {
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
      const res = await fetch(`http://localhost:5001/api/appointments/${isReschedulingAppt._id}/reschedule`, {
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
      const res = await fetch(`http://localhost:5001/api/appointments/${isAddingNotesAppt._id}/notes`, {
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

  // Admin Pass Verification
  const verifyAdminPass = async (pass: string) => {
    setAdminError(null);
    try {
      const res = await fetch('http://localhost:5001/api/auth/verify-admin', {
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

  // Admin Vet Actions
  const handleSaveVet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !vetFormName || !vetFormExp || !vetFormFee) return;

    const body = {
      name: vetFormName,
      specialisation: vetFormSpecialty,
      experience: Number(vetFormExp),
      fee: Number(vetFormFee),
      bio: vetFormBio,
      isOnline: vetFormOnline,
      availableSlots: vetFormSlots
    };

    try {
      const method = isEditingVet ? 'PUT' : 'POST';
      const endpoint = isEditingVet ? `http://localhost:5001/api/vets/${isEditingVet._id}` : 'http://localhost:5001/api/vets';
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
      const res = await fetch(`http://localhost:5001/api/vets/${vetId}`, {
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

  const resetVetForm = () => {
    setVetFormName('');
    setVetFormSpecialty('General Practice');
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
    setVetFormExp(vet.experience.toString());
    setVetFormFee(vet.fee.toString());
    setVetFormBio(vet.bio || '');
    setVetFormOnline(vet.isOnline);
    setVetFormSlots(vet.availableSlots.map(s => ({ date: s.date, time: s.time })));
    setIsAddingVet(true);
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-scaleIn select-none font-sans text-charcoal bg-white rounded-3xl p-4 md:p-6 shadow-sm">
      
      {/* 1. TOP HEADER NAV WITH BACK BUTTON */}
      <div className="flex items-center justify-between w-full pb-3 border-b border-warmBeige/40 select-none">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (currentView !== 'home') {
                setCurrentView('home');
              } else {
                setActiveTab('home');
              }
            }} 
            className="w-10 h-10 rounded-full border border-warmBeige flex items-center justify-center hover:bg-warmBg transition-colors"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-600">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h1 className="text-xs uppercase tracking-wider font-extrabold text-[#B68A35]">Consult & Care</h1>
            <span className="text-[10px] text-stone-500 font-semibold mt-0.5 block">Expert care for every pet need</span>
          </div>
        </div>

        {/* Quick Admin Toggle Icon */}
        <button 
          onClick={() => {
            setSubTab('admin');
            setCurrentView('home');
          }}
          className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${
            subTab === 'admin' 
              ? 'bg-[#3D5A45] border-[#3D5A45] text-white' 
              : 'border-warmBeige hover:bg-warmBg text-[#3D5A45]'
          }`}
        >
          🔐 Admin Panel
        </button>
      </div>

      {/* 2. SUB-TABS SELECTOR FOR FLOW STATES */}
      {currentView === 'home' && (
        <div className="grid grid-cols-3 bg-[#FCFAF7] border border-[#F0EBE1] p-1 rounded-2xl w-full select-none shadow-sm">
          <button 
            onClick={() => { setSubTab('book'); setSelectedSpecialty(null); }}
            className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              subTab === 'book' ? 'bg-white shadow-sm text-terracotta' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Book
          </button>
          
          <button 
            onClick={() => { setSubTab('tele'); setSelectedSpecialty(null); }}
            className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              subTab === 'tele' ? 'bg-white shadow-sm text-terracotta' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
            Tele-consult
          </button>

          <button 
            onClick={() => setSubTab('my-appts')}
            className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              subTab === 'my-appts' ? 'bg-white shadow-sm text-terracotta' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            My Appts
          </button>
        </div>
      )}

      {/* ==================== SCREEN 1: CONSULT & CARE HOME ==================== */}
      {currentView === 'home' && subTab !== 'my-appts' && subTab !== 'admin' && (
        <div className="flex flex-col gap-6 w-full animate-fadeIn">
          
          {/* SEARCH BAR */}
          <div className="relative w-full">
            <input 
              type="text"
              placeholder="Search for specialisations, vets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold focus:outline-none focus:border-terracotta/40 shadow-sm"
            />
            <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          {/* HERO BANNER */}
          <div className="bg-gradient-to-br from-[#EBF5E9] to-[#C8E6C9] border border-[#E1EDE3] rounded-[28px] p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5 max-w-[280px]">
              <h2 className="font-serif font-extrabold text-lg text-[#3D5A45] leading-tight">Compassionate care, expert advice</h2>
              <p className="text-[10px] text-stone-600 font-semibold leading-relaxed">Connect with trusted veterinary experts for your pet's wellness diagnostics.</p>
              <button 
                onClick={() => setCurrentView('directory')}
                className="mt-2.5 px-4.5 py-2 bg-[#3D5A45] hover:bg-[#2A3E31] text-white text-[11px] font-extrabold rounded-xl transition-all shadow-sm self-start"
              >
                Let's Consult
              </button>
            </div>
            <div className="w-[120px] h-[90px] relative shrink-0 flex items-center justify-center bg-white/40 rounded-2xl overflow-hidden border border-white/20">
              <svg className="w-14 h-14 text-[#3D5A45]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.5 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          </div>

          {/* BROWSE BY SPECIALISATION GRID */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-extrabold text-stone-400 uppercase tracking-wider">Browse by Specialisation</h3>
              <button 
                onClick={() => { setSelectedSpecialty(null); setCurrentView('directory'); }}
                className="text-[10px] font-bold text-terracotta hover:underline"
              >
                View all ›
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
              {specialisations.map(spec => (
                <div 
                  key={spec.id}
                  onClick={() => {
                    setSelectedSpecialty(spec.id);
                    setCurrentView('directory');
                  }}
                  className="bg-[#FCFAF7] border border-[#F0EBE1] hover:border-terracotta/20 rounded-[20px] p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-white border border-[#F0EBE1] flex items-center justify-center shadow-sm shrink-0 mb-3 group-hover:bg-[#FCFAF7] transition-colors">
                    {spec.icon}
                  </div>
                  <span className="text-[11px] font-bold block text-charcoal">{spec.name}</span>
                  <span className="text-[9px] text-stone-500 font-semibold block leading-normal mt-0.5">{spec.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TOP RATED VETS LIST */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-extrabold text-stone-400 uppercase tracking-wider">Top Rated Vets</h3>
              <button 
                onClick={() => { setSelectedSpecialty(null); setCurrentView('directory'); }}
                className="text-[10px] font-bold text-terracotta hover:underline"
              >
                View all ›
              </button>
            </div>

            <div className="flex flex-col gap-3 w-full">
              {isLoadingVets ? (
                <div className="w-full text-center py-6 text-xs text-stone-500 font-semibold">Loading vets list...</div>
              ) : computedVets.slice(0, 3).map(vet => (
                <div 
                  key={vet._id}
                  onClick={() => { setSelectedSpecialty(vet.specialisation); setCurrentView('directory'); }}
                  className="bg-white border border-[#F0EBE1] hover:border-terracotta/20 rounded-2xl p-3 flex items-center justify-between hover:shadow-sm cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-100 border border-[#F0EBE1] relative shrink-0">
                      <div className="w-full h-full bg-gradient-to-br from-[#E2E8F0] to-[#CBD5E1] flex items-center justify-center text-stone-600 font-bold text-sm">
                        {vet.name.split(' ').map(n => n[0]).join('').replace('Dr.', '')}
                      </div>
                      {vet.isOnline && (
                        <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white"></span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-charcoal">{vet.name}</h4>
                      <span className="text-[10px] text-stone-500 block font-semibold mt-0.5">{vet.specialisation}</span>
                      <span className="text-[9.5px] text-stone-400 block font-semibold">{vet.experience} yrs experience</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      <span className="text-amber-500 text-xs">★</span>
                      <span className="text-[10px] font-extrabold text-charcoal">{vet.rating}</span>
                      <span className="text-[9px] text-stone-400 font-semibold">({vet.reviewCount})</span>
                    </div>
                    <svg className="w-4 h-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
              <svg className="absolute left-3 top-3 w-4 h-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            
            <button 
              onClick={() => { setSelectedSpecialty(null); setSearchQuery(''); }}
              className="px-3.5 py-2.5 bg-[#FCFAF7] border border-[#F0EBE1] text-xs font-bold rounded-2xl flex items-center gap-1.5 shadow-sm text-stone-600 hover:bg-stone-50 transition-all shrink-0 active:scale-95"
            >
              Reset
            </button>
          </div>

          {/* ACTIVE SPECIALTY FILTER CHIPS */}
          <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-hide">
            <button
              onClick={() => setSelectedSpecialty(null)}
              className={`px-3.5 py-1.5 border rounded-full text-[10px] font-extrabold shrink-0 transition-all active:scale-95 ${
                selectedSpecialty === null 
                  ? 'bg-[#3D5A45] border-[#3D5A45] text-white shadow-sm' 
                  : 'bg-white border-[#F0EBE1] text-stone-600 hover:border-stone-300'
              }`}
            >
              All Specialties
            </button>
            {specialisations.map(spec => (
              <button
                key={spec.id}
                onClick={() => setSelectedSpecialty(spec.id)}
                className={`px-3.5 py-1.5 border rounded-full text-[10px] font-extrabold shrink-0 transition-all active:scale-95 ${
                  selectedSpecialty === spec.id
                    ? 'bg-[#3D5A45] border-[#3D5A45] text-white shadow-sm' 
                    : 'bg-white border-[#F0EBE1] text-stone-600 hover:border-stone-300'
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
                className="bg-white border border-[#F0EBE1] rounded-[24px] p-4 flex flex-col gap-3 shadow-sm"
              >
                {/* Vet Header card section */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-stone-100 border border-[#F0EBE1]/60 relative shrink-0">
                      <div className="w-full h-full bg-gradient-to-br from-[#E2E8F0] to-[#CBD5E1] flex items-center justify-center text-stone-600 font-bold text-sm">
                        {vet.name.split(' ').map(n => n[0]).join('').replace('Dr.', '')}
                      </div>
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

                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-sm font-extrabold text-terracotta">₹{vet.fee}</span>
                    <span className="text-[8px] bg-emerald-50/80 text-emerald-700 border border-emerald-100 rounded-full px-2 py-0.5 font-bold uppercase">Online</span>
                  </div>
                </div>

                {/* Available slots picker inside the card */}
                <div className="flex flex-col gap-2 pt-2 border-t border-stone-100">
                  <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider">Next Available Slots</span>
                  
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {vet.availableSlots && vet.availableSlots.filter(s => !s.isBooked).slice(0, 4).map((slot, index) => (
                      <button
                        key={slot._id}
                        onClick={() => handleStartBooking(vet, slot)}
                        className={`px-3 py-2 border rounded-xl text-[10px] font-bold text-center transition-all shrink-0 active:scale-95 flex flex-col gap-0.5 min-w-[70px] ${
                          index === 0
                            ? 'bg-[#3D5A45] border-[#3D5A45] text-white shadow-sm hover:bg-[#2A3E31]'
                            : 'bg-white border-[#F0EBE1] text-[#3D5A45] hover:border-stone-300'
                        }`}
                      >
                        <span className="text-[8px] opacity-75 font-semibold">{slot.date}</span>
                        <span>{slot.time}</span>
                      </button>
                    ))}
                    {(!vet.availableSlots || vet.availableSlots.filter(s => !s.isBooked).length === 0) && (
                      <span className="text-[9px] text-stone-400 font-semibold italic py-1">No slots available. Contact clinic for schedule.</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ==================== SCREEN 3: CONFIRM BOOKING FLOW ==================== */}
      {currentView === 'confirm' && selectedVet && selectedSlot && (
        <div className="flex flex-col gap-5 w-full animate-fadeIn">
          
          {/* Selected Vet Summary Card */}
          <div className="bg-[#FCFAF7] border border-[#F0EBE1] rounded-[24px] p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-100 border border-[#F0EBE1] relative shrink-0">
              <div className="w-full h-full bg-gradient-to-br from-[#E2E8F0] to-[#CBD5E1] flex items-center justify-center text-stone-600 font-bold text-sm">
                {selectedVet.name.split(' ').map(n => n[0]).join('').replace('Dr.', '')}
              </div>
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
                  bookingMode === 'in-clinic' ? 'bg-white shadow-sm text-[#3D5A45]' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                In-Clinic Consult
              </button>
              <button 
                type="button"
                onClick={() => setBookingMode('tele-consult')}
                className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                  bookingMode === 'tele-consult' ? 'bg-white shadow-sm text-[#3D5A45]' : 'text-stone-500 hover:text-stone-700'
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
                        ? 'bg-[#3D5A45]/10 border-[#3D5A45] text-[#3D5A45] shadow-sm' 
                        : 'bg-white border-[#F0EBE1] text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <span>🐶</span> {pet.name}
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
                  <td className="py-2.5 text-right font-extrabold text-charcoal">{newPetInput ? customPetName : selectedPetName}</td>
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
            className="w-full py-3.5 bg-[#3D5A45] hover:bg-[#2A3E31] text-white text-xs font-extrabold rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
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
            <h2 className="font-serif font-extrabold text-xl text-[#3D5A45]">Booking Confirmed!</h2>
            <p className="text-[10px] text-stone-500 font-semibold mt-1 max-w-[280px] mx-auto">
              Your appointment request is scheduled. A confirmation email has been dispatched.
            </p>
          </div>

          {/* Details Summary Card */}
          <div className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-[24px] p-5 text-left flex flex-col gap-2.5">
            <span className="text-[8px] font-extrabold text-[#3D5A45] uppercase tracking-widest block">Summary Card</span>
            
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
              className="w-full py-3 bg-[#3D5A45] hover:bg-[#2A3E31] text-white text-xs font-extrabold rounded-2xl shadow-sm transition-all"
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
                      <h4 className="text-xs font-bold text-charcoal">{appt.vetName}</h4>
                      <span className="text-[10px] text-stone-500 font-semibold block mt-0.5">{appt.vetSpecialisation}</span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase ${
                      appt.status === 'cancelled'
                        ? 'bg-rose-50 text-rose-600 border border-rose-100'
                        : appt.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {appt.status}
                    </span>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex flex-col md:flex-row gap-2 md:items-center pl-1 bg-[#FCFAF7] border border-[#F0EBE1] rounded-xl p-2 text-[10px] text-stone-600 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span>🐶</span> <strong>For:</strong> {appt.petName}
                    </div>
                    <div className="hidden md:block text-stone-300">|</div>
                    <div className="flex items-center gap-1.5">
                      <span>📅</span> <strong>Slot:</strong> {appt.date} • {appt.time}
                    </div>
                    <div className="hidden md:block text-stone-300">|</div>
                    <div className="flex items-center gap-1.5 text-terracotta">
                      <span>💵</span> <strong>Fee:</strong> ₹{appt.fee} ({appt.mode === 'tele-consult' ? 'Tele-consult' : 'In-Clinic'})
                    </div>
                  </div>

                  {appt.notes && (
                    <div className="pl-1 text-[9.5px] text-stone-500 italic">
                      <strong>Notes:</strong> {appt.notes}
                    </div>
                  )}

                  {/* Booking Actions Row */}
                  {appt.status !== 'cancelled' && (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-100">
                      <button
                        onClick={() => {
                          setIsReschedulingAppt(appt);
                          const originalVet = vets.find(v => v.name === appt.vetName);
                          if (originalVet) {
                            setSelectedVet(originalVet);
                          }
                        }}
                        className="py-2 border border-warmBeige text-[#3D5A45] hover:bg-stone-50 rounded-xl text-[9px] font-bold text-center transition-all active:scale-95"
                      >
                        ⏱️ Reschedule
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingNotesAppt(appt);
                          setNoteText(appt.notes || '');
                        }}
                        className="py-2 border border-warmBeige text-stone-600 hover:bg-stone-50 rounded-xl text-[9px] font-bold text-center transition-all active:scale-95"
                      >
                        📝 Add Notes
                      </button>
                      <button
                        onClick={() => handleCancelAppointment(appt)}
                        className="py-2 border border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl text-[9px] font-bold text-center transition-all active:scale-95"
                      >
                        🗑️ Cancel
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
                        ? 'bg-[#3D5A45] border-[#3D5A45] text-white shadow-sm'
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
              className="w-full py-3 bg-[#3D5A45] hover:bg-[#2A3E31] disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-2xl shadow-sm transition-all"
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
              className="w-full py-3 bg-[#3D5A45] hover:bg-[#2A3E31] text-white text-xs font-extrabold rounded-2xl shadow-sm transition-all"
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
              <div className="w-12 h-12 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center text-xl shrink-0">
                🔐
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
                className="w-full py-2.5 bg-[#3D5A45] hover:bg-[#2A3E31] text-white text-xs font-bold rounded-2xl shadow-sm"
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
                        {vet.name.split(' ').map(n => n[0]).join('').replace('Dr.', '')}
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-charcoal">{vet.name}</h4>
                        <span className="text-[9.5px] text-stone-500 font-semibold block">{vet.specialisation}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
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
                          <label className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block mb-1">Specialisation</label>
                          <select
                            value={vetFormSpecialty}
                            onChange={(e) => setVetFormSpecialty(e.target.value)}
                            className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                          >
                            {specialisations.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
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
                      </div>

                      <div className="grid grid-cols-2 gap-3">
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
                        <div className="flex items-center gap-2 mt-4.5">
                          <input 
                            type="checkbox"
                            id="vetFormOnline"
                            checked={vetFormOnline}
                            onChange={(e) => setVetFormOnline(e.target.checked)}
                            className="w-4 h-4 rounded border-stone-300 text-[#3D5A45] focus:ring-[#3D5A45]"
                          />
                          <label htmlFor="vetFormOnline" className="text-[10px] font-bold text-stone-600 cursor-pointer">Online / Tele-consult</label>
                        </div>
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
                      className="w-full py-3 bg-[#3D5A45] hover:bg-[#2A3E31] text-white text-xs font-extrabold rounded-2xl shadow-sm transition-all"
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
