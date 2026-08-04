'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DogIcon, LockIcon } from './icons/PetIcons';
import { API_BASE } from '../lib/api';
import { processRazorpayPayment } from '../lib/razorpay';
import AgoraCallModal from './AgoraCallModal';
import CallSessionButton from './CallSessionButton';
import PaymentModal from './PaymentModal';


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
  medicalDocument?: string;
  prescription?: string;
  prescriptionNotes?: string;
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
  // Selection states for booking flow
  const [vets, setVets] = useState<Vet[]>([]);
  const [selectedVet, setSelectedVet] = useState<Vet | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [bookingMode, setBookingMode] = useState<'in-clinic' | 'tele-consult'>('in-clinic');
  const [selectedPetName, setSelectedPetName] = useState('');
  const [newPetInput, setNewPetInput] = useState(false);
  const [customPetName, setCustomPetName] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [bookingMonth, setBookingMonth] = useState(new Date().getMonth());
  const [bookingYear, setBookingYear] = useState(new Date().getFullYear());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number>(new Date().getDate());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('1:00 PM');
  
  // Medical document / Old report upload state
  const [medicalReportBase64, setMedicalReportBase64] = useState<string>('');
  const [medicalReportName, setMedicalReportName] = useState<string>('');
  const [uploadingDocApptId, setUploadingDocApptId] = useState<string | null>(null);

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

  // Post-booking confirmed screen state
  const [confirmedAppt, setConfirmedAppt] = useState<Appointment | null>(null);
  const [activeCallAppt, setActiveCallAppt] = useState<Appointment | null>(null);

  // Appointments List states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // Active Interactive Drawers/Modals
  const [isReschedulingAppt, setIsReschedulingAppt] = useState<Appointment | null>(null);
  const [rescheduleSlotId, setRescheduleSlotId] = useState('');
  const [isAddingNotesAppt, setIsAddingNotesAppt] = useState<Appointment | null>(null);
  const [noteText, setNoteText] = useState('');
  
  // Location State
  const [currentLocation, setCurrentLocation] = useState<string>('Detecting location...');


  // Auto-detect Geolocation / User Profile Location
  useEffect(() => {
    if (user?.address) {
      setCurrentLocation(user.address);
    } else if ((user as any)?.location) {
      setCurrentLocation((user as any).location);
    }

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            if (res.ok) {
              const data = await res.json();
              const area = data.address?.suburb || data.address?.neighbourhood || data.address?.residential || data.address?.subdistrict || data.address?.town || data.address?.city;
              const city = data.address?.city || data.address?.town || data.address?.state_district || data.address?.state;
              if (area && city && area !== city) {
                setCurrentLocation(`${area}, ${city}`);
              } else if (area || city) {
                setCurrentLocation(area || city);
              }
            }
          } catch (err) {
            console.warn('Reverse geocoding error:', err);
          }
        },
        (err) => {
          console.warn('Geolocation denied or failed:', err);
          if (!user?.address && !(user as any)?.location) {
            setCurrentLocation('Sector 4, Rourkela');
          }
        },
        { timeout: 6000 }
      );
    }
  }, [user]);

  // All Slots viewer modal state & calendar picker states
  const [isViewingAllSlotsVet, setIsViewingAllSlotsVet] = useState<Vet | null>(null);
  const [modalSelectedDate, setModalSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [modalSelectedTime, setModalSelectedTime] = useState<string>('10:30 AM');

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
          petName: petName.trim(),
          medicalDocument: medicalReportBase64
        })
      });

      const data = await res.json();
      if (res.ok) {
        setConfirmedAppt(data.appointment);
        setCurrentView('confirmed');
        setMedicalReportBase64('');
        setMedicalReportName('');
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

  // Action: Upload medical document for existing appointment
  const handleUploadExistingMedicalDoc = async (apptId: string, base64Data: string) => {
    if (!token || !base64Data) return;
    setUploadingDocApptId(apptId);
    try {
      const res = await fetch(`${API_BASE}/appointments/${apptId}/medical-document`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ medicalDocument: base64Data })
      });
      const data = await res.json();
      if (res.ok) {
        setAppointments(prev => prev.map(a => a._id === apptId ? { ...a, medicalDocument: base64Data } : a));
      } else {
        alert(data.message || 'Failed to upload report.');
      }
    } catch (err) {
      console.error('Error uploading medical doc:', err);
    } finally {
      setUploadingDocApptId(null);
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
    <>
    <div className="w-full flex flex-col gap-5 sm:gap-6 animate-fadeIn select-none font-sans text-[#1C1A17] pb-4">

      
      {/* 1. SEAMLESS HERO IMAGE COVERING FULL CONTAINER WIDTH (ZERO TOP SPACE GAP) */}
      <div className="relative -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-3 overflow-hidden min-h-[210px] xs:min-h-[240px] sm:min-h-[300px] flex flex-col justify-between pt-3 px-4 pb-4 xs:pt-4 xs:px-5 xs:pb-5 sm:pt-5 sm:px-7 sm:pb-6 select-none">
        {/* Background Image Absolute Covering Full Width */}
        <img 
          src="/VetCareHero.png" 
          alt="Vet Care Hero" 
          className="absolute inset-0 w-full h-full object-cover object-center z-0"
        />

        {/* Floating Top Bar (Back Button & Admin Trigger) */}
        <div className="relative z-10 flex items-center justify-between w-full">
          <button 
            onClick={() => {
              if (currentView !== 'home') {
                setCurrentView('home');
              } else {
                setActiveTab('home');
              }
            }} 
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/80 bg-[#F5F2EC]/90 backdrop-blur-md flex items-center justify-center hover:bg-white transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-800">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Gated Admin Panel Button */}
          {isAdminUser && (
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
          )}
        </div>

        {/* HERO TYPOGRAPHY TEXT BLOCK - MATCHING SCREENSHOT EXACTLY */}
        <div className="relative z-10 flex flex-col gap-1 max-w-[260px] xs:max-w-[310px] sm:max-w-[380px] mt-4 sm:mt-6 -translate-y-12">
          <span className="text-[10.5px] sm:text-xs font-bold tracking-[0.18em] text-[#6E685E] uppercase">
            VET CARE
          </span>
          <h2 className="font-serif text-xl xs:text-2xl sm:text-3xl font-normal text-[#1C1A17] leading-[1.15] tracking-tight">
            Find the right care for your companion.
          </h2>
          <p className="text-[11px] sm:text-xs text-[#5C564C] font-sans font-medium leading-snug mt-0.5">
            Expert medical care, when they need it.
          </p>
        </div>
      </div>

      {/* 2. SEARCH BAR */}
      {currentView === 'home' && subTab !== 'admin' && (
        <div className="w-full mt-0.5">
          <div className="relative w-full">
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
        <div className="flex items-end justify-between px-0.5 xs:px-1 mt-1 mb-0.5 select-none gap-2">
          <div>
            <h2 className="font-serif text-xl xs:text-2xl sm:text-3xl font-normal text-[#1C1A17] tracking-tight">Available near you</h2>
            <p className="text-xs sm:text-sm text-stone-500 font-sans mt-0.5">Verified professionals in your area</p>
          </div>
          <button 
            onClick={() => setCurrentView('directory')}
            className="text-xs sm:text-sm text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1 cursor-pointer transition-colors shrink-0 max-w-[170px] xs:max-w-none truncate pb-0.5"
          >
            <svg className="w-3.5 h-3.5 text-stone-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span className="truncate">{currentLocation}</span>
            <span className="text-xs shrink-0 text-stone-400">›</span>
          </button>
        </div>
      )}

      {/* 5. VET DOCTOR CARDS (EXACT BLUEPRINT MATCH) */}
      {currentView === 'home' && subTab !== 'admin' && (
        <div className="flex flex-col gap-4 sm:gap-5 w-full select-none">
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
              className="bg-[#F5F2EC] border border-[#E7E0D3] rounded-2xl sm:rounded-[28px] overflow-hidden shadow-2xs flex flex-col"
            >
              {/* Upper Details Row */}
              <div className="flex flex-row items-stretch min-h-[140px] xs:min-h-[155px] sm:min-h-[175px]">
                {/* Left Side Portrait Photo */}
                <div className="w-24 xs:w-32 sm:w-44 max-w-[32%] sm:max-w-[40%] bg-[#EAE4D8] relative shrink-0 overflow-hidden">
                  <img 
                    src={vet.photo || (vetIndex === 0 ? '/warden-1.png' : '/warden-2.png')} 
                    alt={vet.name} 
                    className="w-full h-full object-cover object-top" 
                  />
                </div>

                {/* Right Side Doctor Information */}
                <div className="p-3 xs:p-4 sm:p-5 flex flex-col justify-between flex-grow min-w-0">
                  <div className="flex flex-col gap-1">
                    {/* Header Row: Doctor Name + VET badge */}
                    <div className="flex items-center gap-2 min-w-0">
                      <h4 className="font-serif text-base xs:text-lg sm:text-xl font-normal text-[#1C1A17] truncate">{vet.name}</h4>
                      <span className="bg-[#E8E2D6] text-stone-600 px-2 py-0.5 rounded-full text-[9px] xs:text-[10px] font-bold uppercase tracking-wider shrink-0">VET</span>
                    </div>

                    {/* Specialization */}
                    <span className="text-xs sm:text-sm text-stone-600 font-medium leading-tight truncate">{vet.specialisation}</span>

                    {/* Rating & Experience */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-600 font-medium mt-0.5">
                      <span className="text-[#D97706] font-bold">★ {vet.rating || 4.6}</span>
                      <span className="text-stone-500 font-normal">({vet.reviewCount || 96} reviews)</span>
                      <span className="text-stone-300 font-light">|</span>
                      <span className="text-stone-600 font-medium">{vet.experience || 12} yrs experience</span>
                    </div>

                    {/* Quote */}
                    <p className="text-xs sm:text-sm italic text-stone-600 font-serif leading-snug mt-1 line-clamp-1">
                      "{vet.bio || (vetIndex === 0 ? 'Gentle healing. For a longer, healthier life.' : 'Compassion in every consultation.')}"
                    </p>
                  </div>

                  {/* Price Tag */}
                  <div className="text-right mt-1">
                    <span className="font-serif text-base xs:text-lg sm:text-xl font-bold text-[#1C1A17]">₹{vet.fee || (vetIndex === 0 ? 600 : 400)}</span>
                    <span className="text-[10px] xs:text-xs text-stone-500 font-normal block">In-clinic</span>
                  </div>
                </div>
              </div>

              {/* Lower Slot Bar */}
              <div className="px-3 py-2.5 sm:px-5 sm:py-3 bg-[#EDE8DE] border-t border-[#E7E0D3] flex items-center justify-between gap-1.5 xs:gap-2.5 select-none min-w-0">
                <span className="text-xs sm:text-sm font-bold text-[#1C1A17] pl-0.5 shrink-0">Today</span>

                <div className="flex-1 min-w-0 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide py-0.5 px-0.5">
                  {(vet.availableSlots && vet.availableSlots.length > 0 ? vet.availableSlots : [
                    { _id: 's1', time: vetIndex === 0 ? '10:30 AM' : '9:00 AM' },
                    { _id: 's2', time: vetIndex === 0 ? '1:00 PM' : '11:00 AM' },
                    { _id: 's3', time: vetIndex === 0 ? '3:30 PM' : '2:00 PM' }
                  ]).slice(0, 3).map((slot: any, slotIdx: number) => (
                    <button
                      key={slot._id || slotIdx}
                      onClick={() => handleStartBooking(vet, slot)}
                      className="px-2.5 xs:px-3.5 sm:px-4 py-1.5 rounded-full text-[11px] xs:text-xs font-semibold transition-all shrink-0 cursor-pointer active:scale-95 whitespace-nowrap bg-white border border-[#DCD5C7] text-[#1C1A17] hover:bg-[#F5F2EC]"
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const defaultSlot = vet.availableSlots?.[0] || {
                      _id: `slot_${new Date().getDate()}`,
                      date: `Today`,
                      time: '10:30 AM',
                      isBooked: false
                    };
                    handleStartBooking(vet, defaultSlot);
                  }}
                  className="text-[11px] xs:text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-900 shrink-0 cursor-pointer whitespace-nowrap flex items-center gap-0.5 pl-0.5"
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
                    {/* View all slots triggers calendar date & time picker modal */}
                    <button 
                      type="button"
                      onClick={() => setIsViewingAllSlotsVet(vet)}
                      className="text-[9px] font-extrabold text-terracotta hover:underline cursor-pointer"
                    >
                      View all slots ›
                    </button>
                  </div>
                  
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {vet.availableSlots && vet.availableSlots.filter(s => !s.isBooked).slice(0, 4).map((slot, index) => (
                      <button
                        key={slot._id}
                        onClick={() => handleStartBooking(vet, slot)}
                        className="px-3.5 py-2 border border-[#F0EBE1] bg-[#FCFAF7] hover:bg-white text-charcoal rounded-xl text-[10px] font-bold text-center transition-all shrink-0 active:scale-95 flex flex-col gap-0.5 min-w-[70px]"
                      >
                        <span className="text-[8px] opacity-75 font-bold text-stone-400">{slot.date}</span>
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
          <div className="flex flex-col gap-2.5">
            <label className="text-[10.5px] font-extrabold text-stone-500 uppercase tracking-widest px-1">CONSULTATION MODE</label>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
              {/* In-clinic Card */}
              <button 
                type="button"
                onClick={() => setBookingMode('in-clinic')}
                className={`p-4 sm:p-5 rounded-2xl sm:rounded-[22px] text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[120px] ${
                  bookingMode === 'in-clinic'
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

                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    bookingMode === 'in-clinic'
                      ? 'bg-[#2D4536] border-2 border-[#2D4536]'
                      : 'border-2 border-stone-300'
                  }`}>
                    {bookingMode === 'in-clinic' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                <div className="mt-3">
                  <h4 className="font-serif text-sm sm:text-base font-bold text-[#1C1A17] leading-tight">In-clinic</h4>
                  <p className="text-[11px] sm:text-xs text-stone-500 font-medium mt-0.5">Visit the clinic</p>
                </div>
              </button>

              {/* Tele-consult Card */}
              <button 
                type="button"
                onClick={() => setBookingMode('tele-consult')}
                className={`p-4 sm:p-5 rounded-2xl sm:rounded-[22px] text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[120px] ${
                  bookingMode === 'tele-consult'
                    ? 'bg-[#F4F0EA] border-2 border-[#2D4536] shadow-sm'
                    : 'bg-[#F9F6F0] border border-[#E5E0D8] hover:bg-[#F5F1EA]'
                }`}
              >
                <div className="flex items-start justify-between w-full">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-[#2D4536]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="14" height="12" rx="3" />
                    <path d="M16 10l5-3v10l-5-3" />
                  </svg>

                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    bookingMode === 'tele-consult'
                      ? 'bg-[#2D4536] border-2 border-[#2D4536]'
                      : 'border-2 border-stone-300'
                  }`}>
                    {bookingMode === 'tele-consult' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
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
            <label className="text-[10.5px] font-extrabold text-stone-500 uppercase tracking-widest px-1">SELECT PET</label>
            
            {/* Selected Pet Card */}
            <div className="bg-[#F4F0EA] border border-[#E5E0D8] rounded-[22px] p-4 flex items-center justify-between w-full shadow-2xs">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-200 border border-[#D5CEBF] shrink-0">
                  <img 
                    src={user?.pets?.[0]?.photo || 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=200'} 
                    alt={selectedPetName || 'Pet'} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div>
                  <h4 className="font-serif text-base font-bold text-[#1C1A17] leading-tight">
                    {newPetInput ? (customPetName || 'Snow') : (selectedPetName || user?.pets?.[0]?.name || 'Snow')}
                  </h4>
                  <p className="text-xs text-stone-500 font-medium mt-0.5">
                    {user?.pets?.[0]?.breed || 'Golden Retriever'} • {user?.pets?.[0]?.age ? `${user.pets[0].age} yrs` : '3 yrs'} • {user?.pets?.[0]?.gender || 'Male'}
                  </p>
                </div>
              </div>
              <div className="w-6 h-6 text-stone-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Add another pet button */}
            <button 
              type="button"
              onClick={() => {
                setPetError(null);
                setPetForm({ name: '', type: 'Dog', photo: '', breed: '', age: undefined, gender: 'unknown', notes: '' });
                setIsPetModalOpen(true);
              }}
              className="w-full py-3.5 px-4 border-2 border-dashed border-[#DCD5C7] rounded-[22px] bg-transparent hover:bg-[#F5F2EC] text-[#1C1A17] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span className="text-base font-bold">+</span>
              <span>Add another pet</span>
            </button>
          </div>

          {/* UPLOAD OLD MEDICAL REPORT SECTION */}
          <div className="flex flex-col gap-2.5 w-full bg-[#FAF8F5] border border-[#E8E2D8] rounded-[24px] p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-[10.5px] font-extrabold text-stone-500 uppercase tracking-widest">
                📄 UPLOAD OLD MEDICAL REPORT / PREVIOUS PRESCRIPTION (OPTIONAL)
              </label>
              <span className="text-[9px] text-stone-400 font-semibold">Image or PDF</span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium">Share your pet's past medical records with {selectedVet.name} in advance for better consultation context.</p>
            <div className="flex items-center gap-3">
              <label className="px-4 py-2.5 bg-white border border-[#D5CEBF] hover:bg-[#F5F2EC] text-[#1C1A17] text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-2xs">
                <span>📤 Choose File</span>
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

          {/* SELECT DATE & SELECT TIME SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 w-full bg-[#FAF8F5] border border-[#E8E2D8] rounded-[26px] p-5 shadow-2xs">
            
            {/* SELECT DATE (Left 7 Cols) */}
            <div className="md:col-span-7 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-[10.5px] font-extrabold text-stone-500 uppercase tracking-widest">SELECT DATE</label>
              </div>

              {/* Month Header & Nav */}
              <div className="flex items-center justify-between pt-1">
                <span className="font-serif text-sm font-bold text-[#1C1A17]">
                  {['January','February','March','April','May','June','July','August','September','October','November','December'][bookingMonth]} {bookingYear}
                </span>
                <button 
                  type="button" 
                  onClick={() => {
                    if (bookingMonth === 11) {
                      setBookingMonth(0);
                      setBookingYear(prev => prev + 1);
                    } else {
                      setBookingMonth(prev => prev + 1);
                    }
                  }}
                  className="w-6 h-6 rounded-full hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-all cursor-pointer font-bold text-xs"
                >
                  ›
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 text-center">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                  <span key={d} className="text-[9px] font-bold text-stone-400 uppercase py-1">{d}</span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-y-1 text-center">
                {Array.from({ length: new Date(bookingYear, bookingMonth, 1).getDay() }).map((_, i) => (
                  <span key={`blank-${i}`} />
                ))}
                {Array.from({ length: new Date(bookingYear, bookingMonth + 1, 0).getDate() }).map((_, i) => {
                  const dayNum = i + 1;
                  const isSelected = selectedCalendarDay === dayNum;
                  const isPast = new Date().getMonth() === bookingMonth && new Date().getFullYear() === bookingYear && dayNum < new Date().getDate();
                  
                  return (
                    <div key={dayNum} className="flex flex-col items-center justify-center">
                      <button
                        type="button"
                        disabled={isPast}
                        onClick={() => {
                          setSelectedCalendarDay(dayNum);
                          const mName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][bookingMonth];
                          const dateStr = `${mName} ${dayNum}`;
                          if (selectedVet) {
                            setSelectedSlot({
                              _id: `slot_${dayNum}`,
                              date: dateStr,
                              time: selectedTimeSlot,
                              isBooked: false
                            });
                          }
                        }}
                        className={`w-8 h-8 rounded-full text-xs font-bold transition-all flex items-center justify-center ${
                          isPast 
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

            {/* Vertical Separator for Desktop */}
            <div className="hidden md:block w-px bg-[#E8E2D8] self-stretch" />

            {/* SELECT TIME (Right 5 Cols) */}
            <div className="md:col-span-4 flex flex-col gap-3 border-t md:border-t-0 pt-4 md:pt-0">
              <label className="text-[10.5px] font-extrabold text-stone-500 uppercase tracking-widest">SELECT TIME</label>

              <div className="flex flex-col gap-2.5">
                {['10:30 AM', '1:00 PM', '3:30 PM', '5:00 PM'].map(timeStr => {
                  const isTimeSelected = selectedTimeSlot === timeStr;
                  return (
                    <button
                      key={timeStr}
                      type="button"
                      onClick={() => {
                        setSelectedTimeSlot(timeStr);
                        if (selectedVet) {
                          const mName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][bookingMonth];
                          setSelectedSlot({
                            _id: `slot_${selectedCalendarDay}`,
                            date: `${mName} ${selectedCalendarDay}`,
                            time: timeStr,
                            isBooked: false
                          });
                        }
                      }}
                      className={`w-full py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer text-center ${
                        isTimeSelected
                          ? 'bg-[#2D4536] text-white shadow-sm border border-[#2D4536]'
                          : 'bg-[#F9F6F0] border border-[#E5E0D8] text-[#1C1A17] hover:bg-[#F4F0EA]'
                      }`}
                    >
                      {timeStr}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Booking Summary Card */}
          <div className="bg-white/95 backdrop-blur-sm border border-[#E2DBD0] rounded-[24px] p-5 sm:p-6 flex flex-col gap-1 shadow-sm">
            <h3 className="text-[10.5px] font-extrabold text-stone-400 uppercase tracking-[0.15em] border-b border-[#F0EBE1] pb-3 mb-1">BOOKING SUMMARY</h3>
            
            <div className="divide-y divide-[#F5F2EB]">
              {/* Vet Row */}
              <div className="flex justify-between items-center py-3">
                <span className="text-xs sm:text-sm font-medium text-stone-500">Vet</span>
                <span className="font-serif text-sm sm:text-base font-bold text-[#1C1A17]">{selectedVet.name}</span>
              </div>

              {/* Date / Time Row */}
              <div className="flex justify-between items-center py-3">
                <span className="text-xs sm:text-sm font-medium text-stone-400">Date / Time</span>
                <span className="font-extrabold text-[#0D7855] text-xs sm:text-sm">
                  {selectedSlot.date} • {selectedSlot.time}
                </span>
              </div>

              {/* Mode Row */}
              <div className="flex justify-between items-center py-3">
                <span className="text-xs sm:text-sm font-medium text-stone-400">Mode</span>
                <span className="font-extrabold text-[#1C1A17] text-xs sm:text-sm capitalize">
                  {bookingMode === 'tele-consult' ? 'Tele-consult' : 'In-Clinic'}
                </span>
              </div>

              {/* Pet Row */}
              <div className="flex justify-between items-center py-3">
                <span className="text-xs sm:text-sm font-medium text-stone-400">Pet</span>
                <span className="font-extrabold text-[#1C1A17] text-xs sm:text-sm capitalize">
                  {newPetInput ? customPetName : selectedPetName}
                </span>
              </div>

              {/* Fee Row */}
              <div className="flex justify-between items-center py-3">
                <span className="text-xs sm:text-sm font-medium text-stone-500">Consultation Fee</span>
                <span className="font-serif text-sm sm:text-base font-bold text-[#1C1A17]">₹{selectedVet.fee}</span>
              </div>
            </div>

            {/* Total Row Highlight Box */}
            <div className="mt-2 pt-3.5 border-t-2 border-[#F0EBE1] flex items-center justify-between">
              <span className="font-serif text-base sm:text-lg font-extrabold text-[#1C1A17]">Total</span>
              <span className="font-serif text-xl sm:text-2xl font-extrabold text-[#2D4536]">₹{selectedVet.fee}</span>
            </div>
          </div>

          {/* Confirm & Pay Action Buttons */}
          <div className="flex flex-col gap-3 mt-1">
            <button 
              onClick={() => {
                if (!selectedVet || !selectedSlot) return;
                const petName = newPetInput ? customPetName : selectedPetName;
                processRazorpayPayment({
                  amount: selectedVet.fee,
                  receipt: `receipt_vet_${Date.now()}`,
                  name: `Vet Consultation - ${selectedVet.name}`,
                  description: `Consultation fee for ${petName}`,
                  prefill: {
                    name: user?.fullName || '',
                    email: user?.email || '',
                    contact: user?.phone || '',
                  },
                  onSuccess: () => {
                    handleConfirmAppointment();
                  }
                });
              }}
              className="w-full py-4 bg-[#2D4536] hover:bg-[#1E2E24] active:scale-[0.98] text-white text-xs sm:text-sm font-extrabold rounded-[20px] shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              <span>Proceed to Pay ₹{selectedVet.fee} Online</span>
              <span className="text-emerald-300 font-bold text-sm">→</span>
            </button>
            
            <button 
              onClick={handleConfirmAppointment}
              className="w-full py-3.5 bg-white border border-[#DCD5C7] hover:bg-[#FAF8F5] active:scale-[0.98] text-[#1C1A17] text-xs sm:text-sm font-bold rounded-[20px] shadow-2xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21h18M5 21V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14M9 21v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4" />
              </svg>
              <span>Pay at Clinic / Book Direct</span>
            </button>
          </div>

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
            <h2 className="font-serif font-extrabold text-xl text-[#2D4536]">Booking Confirmed!</h2>
            <p className="text-[10px] text-stone-500 font-semibold mt-1 max-w-[280px] mx-auto">
              Your appointment request is scheduled. A confirmation email has been dispatched.
            </p>
          </div>

          {/* Details Summary Card */}
          <div className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-[24px] p-5 text-left flex flex-col gap-2.5">
            <span className="text-[8px] font-extrabold text-[#2D4536] uppercase tracking-widest block">Summary Card</span>
            
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
              <span className="font-extrabold text-[#2D4536]">{confirmedAppt.bookingId}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col gap-2.5 w-full mt-2">
            {confirmedAppt.mode === 'tele-consult' && (
              <CallSessionButton 
                appointment={confirmedAppt} 
                onJoinCall={(appt) => setActiveCallAppt(appt)} 
              />
            )}
            <button 
              onClick={() => {
                setSubTab('my-appts');
                setCurrentView('home');
              }}
              className="w-full py-3 bg-[#2D4536] hover:bg-[#1E2E24] text-white text-xs font-extrabold rounded-2xl shadow-sm transition-all cursor-pointer"
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

                  {/* Medical Report / History Attachment Section */}
                  <div className="bg-[#FAF8F5] border border-[#F0EBE1] rounded-xl p-2.5 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-stone-600 font-bold flex items-center gap-1">
                        📄 Patient Medical Report / History
                      </span>
                      <label className="text-[9px] text-[#2D4536] hover:underline font-extrabold cursor-pointer">
                        {uploadingDocApptId === appt._id ? 'Uploading...' : appt.medicalDocument ? 'Replace File 🔄' : '+ Upload Report'}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          disabled={uploadingDocApptId === appt._id}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                handleUploadExistingMedicalDoc(appt._id, ev.target?.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    {appt.medicalDocument ? (
                      <div className="flex items-center justify-between bg-white border border-stone-200 rounded-lg p-2 text-[10px]">
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          ✓ Document attached
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = appt.medicalDocument!;
                            link.download = `${appt.petName}_medical_history.jpg`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded cursor-pointer"
                        >
                          Download ⬇
                        </button>
                      </div>
                    ) : (
                      <span className="text-[9.5px] text-stone-400 italic">No report attached yet. Upload to share with vet.</span>
                    )}
                  </div>

                  {/* Issued Prescription Section */}
                  {appt.prescription ? (
                    <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-2.5 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-emerald-800 font-extrabold flex items-center gap-1">
                          💊 Doctor's Official Prescription
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = appt.prescription!;
                            link.download = `${appt.petName}_prescription.jpg`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[9px] font-extrabold rounded-md shadow-2xs cursor-pointer"
                        >
                          Download Rx ⬇
                        </button>
                      </div>
                      {appt.prescriptionNotes && (
                        <p className="text-[10px] text-emerald-900 font-medium italic bg-white/70 p-2 rounded-lg border border-emerald-100">
                          "{appt.prescriptionNotes}"
                        </p>
                      )}
                    </div>
                  ) : null}

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
                  {appt.status === 'confirmed' && appt.mode === 'tele-consult' && (
                    <CallSessionButton 
                      appointment={appt} 
                      onJoinCall={(a) => setActiveCallAppt(a)} 
                      className="mt-2"
                    />
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

      {activeCallAppt && (
        <AgoraCallModal 
          appointmentId={activeCallAppt._id} 
          onClose={() => setActiveCallAppt(null)} 
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
                    await fetch(`${API_BASE}/auth/me`, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    setSelectedPetName(petForm.name);
                    setIsPetModalOpen(false);
                    window.location.reload(); // Quick refresh to sync auth context
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

      {/* VIEW ALL AVAILABLE SLOTS & CALENDAR DATE/TIME PICKER MODAL (GLOBAL ROOT LEVEL) */}
      {isViewingAllSlotsVet && (
        <div className="fixed inset-0 bg-[#1C1A17]/65 backdrop-blur-md z-[2000] flex items-center justify-center p-4 transition-all animate-fadeIn">
          <div className="bg-[#FAF8F5] border border-[#EFEAE2] w-full max-w-lg rounded-[28px] shadow-2xl p-6 flex flex-col gap-4">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-[#E8E2D8]">
              <div>
                <h3 className="font-serif text-base font-bold text-[#1C1A17]">Select Date & Time</h3>
                <p className="text-xs text-stone-500 font-medium mt-0.5">Booking with <strong className="text-[#2D4536]">{isViewingAllSlotsVet.name}</strong></p>
              </div>
              <button 
                type="button"
                onClick={() => setIsViewingAllSlotsVet(null)}
                className="w-8 h-8 rounded-full bg-stone-200/60 hover:bg-stone-300/80 text-stone-600 font-extrabold text-xs flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            {/* SELECT DATE & TIME GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 w-full bg-white border border-[#E8E2D8] rounded-[22px] p-4">
              
              {/* SELECT DATE (Left 7 Cols) */}
              <div className="sm:col-span-7 flex flex-col gap-2.5">
                <label className="text-[10.5px] font-extrabold text-stone-500 uppercase tracking-widest">SELECT DATE</label>

                {/* Month Header */}
                <div className="flex items-center justify-between">
                  <span className="font-serif text-xs font-bold text-[#1C1A17]">
                    {['January','February','March','April','May','June','July','August','September','October','November','December'][bookingMonth]} {bookingYear}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (bookingMonth === 11) {
                        setBookingMonth(0);
                        setBookingYear(prev => prev + 1);
                      } else {
                        setBookingMonth(prev => prev + 1);
                      }
                    }}
                    className="w-5 h-5 rounded-full hover:bg-stone-100 text-stone-600 flex items-center justify-center transition-all cursor-pointer font-bold text-xs"
                  >
                    ›
                  </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 text-center">
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                    <span key={d} className="text-[8.5px] font-bold text-stone-400 uppercase py-0.5">{d}</span>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-y-1 text-center">
                  {Array.from({ length: new Date(bookingYear, bookingMonth, 1).getDay() }).map((_, i) => (
                    <span key={`blank-${i}`} />
                  ))}
                  {Array.from({ length: new Date(bookingYear, bookingMonth + 1, 0).getDate() }).map((_, i) => {
                    const dayNum = i + 1;
                    const isSelected = selectedCalendarDay === dayNum;
                    const isPast = new Date().getMonth() === bookingMonth && new Date().getFullYear() === bookingYear && dayNum < new Date().getDate();
                    
                    return (
                      <div key={dayNum} className="flex flex-col items-center justify-center">
                        <button
                          type="button"
                          disabled={isPast}
                          onClick={() => setSelectedCalendarDay(dayNum)}
                          className={`w-7 h-7 rounded-full text-[11px] font-bold transition-all flex items-center justify-center ${
                            isPast 
                              ? 'text-stone-300 cursor-not-allowed'
                              : isSelected
                                ? 'bg-[#2D4536] text-white shadow-2xs font-extrabold'
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

              {/* SELECT TIME (Right 5 Cols) */}
              <div className="sm:col-span-5 flex flex-col gap-2.5 border-t sm:border-t-0 sm:border-l border-[#E8E2D8] pt-3 sm:pt-0 sm:pl-3">
                <label className="text-[10.5px] font-extrabold text-stone-500 uppercase tracking-widest">SELECT TIME</label>

                <div className="flex flex-col gap-2">
                  {['10:30 AM', '1:00 PM', '3:30 PM', '5:00 PM'].map(timeStr => {
                    const isTimeSelected = selectedTimeSlot === timeStr;
                    return (
                      <button
                        key={timeStr}
                        type="button"
                        onClick={() => setSelectedTimeSlot(timeStr)}
                        className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center ${
                          isTimeSelected
                            ? 'bg-[#2D4536] text-white shadow-sm border border-[#2D4536]'
                            : 'bg-[#F9F6F0] border border-[#E5E0D8] text-[#1C1A17] hover:bg-[#F4F0EA]'
                        }`}
                      >
                        {timeStr}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Confirm Action Button */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setIsViewingAllSlotsVet(null)}
                className="flex-1 py-3 bg-white border border-[#DCD5C7] hover:bg-[#FAF8F5] text-stone-700 text-xs font-bold rounded-2xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const mName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][bookingMonth];
                  const chosenSlot = {
                    _id: `slot_${selectedCalendarDay}_${selectedTimeSlot}`,
                    date: `${mName} ${selectedCalendarDay}`,
                    time: selectedTimeSlot,
                    isBooked: false
                  };
                  handleStartBooking(isViewingAllSlotsVet, chosenSlot);
                  setIsViewingAllSlotsVet(null);
                }}
                className="flex-[2] py-3 bg-[#2D4536] hover:bg-[#1E2E24] text-white text-xs font-extrabold rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Confirm Date & Time</span>
                <span>→</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
    </>
  );
}


