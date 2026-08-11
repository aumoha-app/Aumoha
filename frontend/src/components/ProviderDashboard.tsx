'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../lib/api';
import CallSessionButton from './CallSessionButton';
import AgoraCallModal from './AgoraCallModal';
import PopupModal, { PopupConfig } from './PopupModal';

interface Slot {
  _id?: string;
  date: string;
  time: string;
  isBooked?: boolean;
  bookedBy?: string | null;
}

interface Appointment {
  _id: string;
  bookingId: string;
  userEmail: string;
  petName: string;
  date: string;
  time: string;
  fee: number;
  mode: 'in-clinic' | 'tele-consult';
  type: 'vet' | 'expert';
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
  medicalDocument?: string;
  prescription?: string;
  prescriptionNotes?: string;
  createdAt: string;
}

interface ProviderProfile {
  _id: string;
  name: string;
  photo?: string;
  specialisation: string;
  category: string;
  experience: number;
  fee: number;
  bio?: string;
  phone?: string;
  email?: string;
  rating: number;
  reviewCount: number;
  isOnline: boolean;
  isApproved?: boolean;
  availableSlots: Slot[];
  specialtyTags?: string[];
}

interface Summary {
  total: number;
  confirmed: number;
  upcoming: number;
  totalEarnings: number;
}

type Tab = 'overview' | 'settings' | 'slots' | 'appointments';

export default function ProviderDashboard() {
  const { user, token } = useAuth();
  const [popupConfig, setPopupConfig] = useState<PopupConfig | null>(null);

  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCallAppt, setActiveCallAppt] = useState<Appointment | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);

  // Doctor Self-Edit Profile State
  const [editName, setEditName] = useState('');
  const [editSpecialisation, setEditSpecialisation] = useState('');
  const [editCategory, setEditCategory] = useState<'vet' | 'expert'>('vet');
  const [editFee, setEditFee] = useState<number | string>(500);
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [editTags, setEditTags] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setEditPhoto(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          setEditPhoto(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Slots Management State
  const [slots, setSlots] = useState<Slot[]>([]);
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('');
  const [isSavingSlots, setIsSavingSlots] = useState(false);
  const [slotMsg, setSlotMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Bulk Schedule Generator State
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkEndDate, setBulkEndDate] = useState('');
  const [bulkStartTime, setBulkStartTime] = useState('09:00');
  const [bulkEndTime, setBulkEndTime] = useState('17:00');
  const [bulkInterval, setBulkInterval] = useState(30);
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);

  // Appointment Filters & Prescription State
  const [apptFilter, setApptFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
  const [selectedApptForPrescription, setSelectedApptForPrescription] = useState<Appointment | null>(null);
  const [prescriptionNotesText, setPrescriptionNotesText] = useState('');
  const [prescriptionPhotoBase64, setPrescriptionPhotoBase64] = useState('');
  const [isSavingPrescription, setIsSavingPrescription] = useState(false);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  });

  const fetchProviderData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/provider/me`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.status === 'success' && data.vet) {
        const vet = data.vet;
        setProvider(vet);
        setSlots(vet.availableSlots || []);
        setEditName(vet.name || '');
        setEditSpecialisation(vet.specialisation || '');
        setEditCategory(vet.category === 'expert' ? 'expert' : 'vet');
        setEditFee(vet.fee ?? 500);
        setEditPhone(vet.phone || '');
        setEditBio(vet.bio || '');
        setEditPhoto(vet.photo || '');
        setEditTags(vet.specialtyTags?.join(', ') || '');

        // Fetch appointments for this doctor
        fetchAppointments(vet._id);
      } else {
        setError(data.message || 'No Doctor profile found linked to this email account.');
      }
    } catch (err) {
      console.error('Error fetching doctor profile:', err);
      setError('Connection error. Unable to load doctor profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAppointments = async (vetId: string) => {
    try {
      const res = await fetch(`${API_BASE}/appointments?vetId=${vetId}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const appts: Appointment[] = data.appointments || [];
        setAppointments(appts);

        // Compute summary metrics
        const confirmed = appts.filter(a => a.status === 'confirmed').length;
        const upcoming = appts.filter(a => a.status === 'confirmed' && new Date(a.date) >= new Date(new Date().setHours(0,0,0,0))).length;
        const totalEarnings = appts.filter(a => a.status === 'confirmed').reduce((sum, a) => sum + (a.fee || 0), 0);
        setSummary({
          total: appts.length,
          confirmed,
          upcoming,
          totalEarnings
        });
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProviderData();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const toggleOnlineStatus = async () => {
    if (!provider) return;
    setIsTogglingOnline(true);
    try {
      const newStatus = !provider.isOnline;
      const res = await fetch(`${API_BASE}/provider/me/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isOnline: newStatus })
      });
      if (res.ok) {
        setProvider(prev => prev ? { ...prev, isOnline: newStatus } : null);
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    } finally {
      setIsTogglingOnline(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider) return;
    setIsSavingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/provider/me/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editName,
          specialisation: editSpecialisation,
          category: editCategory,
          fee: Number(editFee),
          phone: editPhone,
          bio: editBio,
          photo: editPhoto,
          specialtyTags: editTags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setProvider(data.vet);
        setPopupConfig({ title: 'Profile Updated', message: 'Your doctor profile has been saved successfully.', type: 'success' });
      } else {
        setPopupConfig({ title: 'Update Failed', message: data.message || 'Unable to save changes.', type: 'error' });
      }
    } catch (err) {
      setPopupConfig({ title: 'Network Error', message: 'Connection issue while saving profile.', type: 'error' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddSlot = () => {
    if (!newSlotDate || !newSlotTime) return;
    if (slots.some(s => s.date === newSlotDate && s.time === newSlotTime)) {
      setSlotMsg({ type: 'error', text: 'This time slot already exists.' });
      return;
    }
    const newSlotItem: Slot = {
      _id: `slot_${Date.now()}`,
      date: newSlotDate,
      time: newSlotTime,
      isBooked: false
    };
    setSlots(prev => [...prev, newSlotItem]);
    setNewSlotDate('');
    setNewSlotTime('');
    setSlotMsg(null);
  };

  const handleRemoveSlot = (index: number) => {
    setSlots(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveSlots = async () => {
    setIsSavingSlots(true);
    setSlotMsg(null);
    try {
      const res = await fetch(`${API_BASE}/provider/me/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ availableSlots: slots })
      });
      const data = await res.json();
      if (res.ok) {
        setSlotMsg({ type: 'success', text: 'Available time slots updated live!' });
        if (data.vet?.availableSlots) setSlots(data.vet.availableSlots);
      } else {
        setSlotMsg({ type: 'error', text: data.message || 'Failed to save slots.' });
      }
    } catch (err) {
      setSlotMsg({ type: 'error', text: 'Network error saving slots.' });
    } finally {
      setIsSavingSlots(false);
    }
  };

  const handleGenerateBulkSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkStartDate || !bulkEndDate || !bulkStartTime || !bulkEndTime) {
      setSlotMsg({ type: 'error', text: 'Please specify start/end dates and times.' });
      return;
    }

    setIsGeneratingBulk(true);
    setSlotMsg(null);

    // Compute date array between start & end
    const dateList: string[] = [];
    let curr = new Date(bulkStartDate);
    const end = new Date(bulkEndDate);
    while (curr <= end) {
      dateList.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }

    try {
      const res = await fetch(`${API_BASE}/provider/me/slots/bulk`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          dates: dateList,
          startTime: bulkStartTime,
          endTime: bulkEndTime,
          intervalMinutes: Number(bulkInterval)
        })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setSlots(data.vet.availableSlots || []);
        setSlotMsg({ type: 'success', text: `Generated ${data.addedCount} time slots successfully!` });
      } else {
        setSlotMsg({ type: 'error', text: data.message || 'Failed to generate bulk slots.' });
      }
    } catch (err) {
      setSlotMsg({ type: 'error', text: 'Connection error while generating bulk schedule.' });
    } finally {
      setIsGeneratingBulk(false);
    }
  };

  const handleSavePrescription = async () => {
    if (!selectedApptForPrescription) return;
    setIsSavingPrescription(true);
    try {
      const res = await fetch(`${API_BASE}/appointments/${selectedApptForPrescription._id}/notes`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          prescription: prescriptionPhotoBase64,
          prescriptionNotes: prescriptionNotesText
        })
      });
      if (res.ok) {
        setPopupConfig({ title: 'Prescription Saved', message: 'Digital prescription sent to patient successfully.', type: 'success' });
        setSelectedApptForPrescription(null);
        if (provider) fetchAppointments(provider._id);
      } else {
        setPopupConfig({ title: 'Save Failed', message: 'Could not upload prescription.', type: 'error' });
      }
    } catch (err) {
      setPopupConfig({ title: 'Error', message: 'Network error saving prescription.', type: 'error' });
    } finally {
      setIsSavingPrescription(false);
    }
  };

  const filteredAppts = apptFilter === 'all' ? appointments : appointments.filter(a => a.status === apptFilter);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-4 border-stone-200 border-t-[#D96B43] animate-spin mb-4" />
        <p className="text-xs font-bold text-stone-600 uppercase tracking-widest">Loading Doctor Portal...</p>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-warmBeige shadow-xl text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-base font-extrabold text-charcoal mb-2">Doctor Profile Not Linked</h3>
          <p className="text-xs text-stone-500 font-medium mb-6 leading-relaxed">
            {error || 'Your logged in account is not registered as a doctor or expert yet. Please contact the platform admin to register your email.'}
          </p>
          <button
            onClick={() => fetchProviderData()}
            className="w-full py-3 bg-terracotta hover:bg-[#c2502f] text-white text-xs font-extrabold rounded-2xl transition-all shadow-md"
          >
            Retry Verification
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-charcoal pb-24">
      {popupConfig && <PopupModal config={popupConfig} onClose={() => setPopupConfig(null)} />}

      {/* Active Call Modal */}
      {activeCallAppt && (
        <AgoraCallModal
          appointmentId={activeCallAppt.bookingId || activeCallAppt._id}
          appointment={activeCallAppt}
          onClose={() => setActiveCallAppt(null)}
        />
      )}

      {/* Dashboard Top Navigation Header */}
      <header className="bg-white border-b border-warmBeige sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              {provider.photo ? (
                <img src={provider.photo} alt={provider.name} className="w-12 h-12 rounded-2xl object-cover border border-warmBeige" />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-terracotta/10 text-terracotta font-extrabold flex items-center justify-center text-lg">
                  {provider.name.charAt(0)}
                </div>
              )}
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${provider.isOnline ? 'bg-emerald-500' : 'bg-stone-300'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-charcoal">{provider.name}</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-terracotta/10 text-terracotta">
                  {provider.category === 'expert' ? 'Specialist Expert' : 'Veterinary Surgeon'}
                </span>
                {provider.isApproved === false && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-amber-100 text-amber-700">
                    Pending Verification
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 font-medium mt-0.5">{provider.specialisation} • Fee: ₹{provider.fee}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Online / Offline Switch */}
            <button
              onClick={toggleOnlineStatus}
              disabled={isTogglingOnline}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-extrabold transition-all border shadow-sm ${
                provider.isOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {provider.isOnline ? 'Online for Consultations' : 'Offline'}
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="max-w-6xl mx-auto px-4 flex gap-2 overflow-x-auto border-t border-stone-100 pt-2 pb-1">
          {[
            { id: 'overview', label: 'Overview & Analytics', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { id: 'settings', label: 'Profile & Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
            { id: 'slots', label: 'Bulk Availability & Slots', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { id: 'appointments', label: 'Appointments & Prescriptions', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as Tab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-terracotta text-white shadow-md'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
              </svg>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 pt-6">

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-warmBeige shadow-sm">
                <div className="w-10 h-10 rounded-2xl bg-terracotta/10 text-terracotta flex items-center justify-center mb-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-[11px] font-extrabold uppercase text-stone-400 tracking-wider">Total Revenue</p>
                <h3 className="text-xl font-black text-charcoal mt-1">₹{summary?.totalEarnings || 0}</h3>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-warmBeige shadow-sm">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-[11px] font-extrabold uppercase text-stone-400 tracking-wider">Confirmed Bookings</p>
                <h3 className="text-xl font-black text-charcoal mt-1">{summary?.confirmed || 0}</h3>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-warmBeige shadow-sm">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-[11px] font-extrabold uppercase text-stone-400 tracking-wider">Upcoming Consults</p>
                <h3 className="text-xl font-black text-charcoal mt-1">{summary?.upcoming || 0}</h3>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-warmBeige shadow-sm">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-[11px] font-extrabold uppercase text-stone-400 tracking-wider">Free Slots Open</p>
                <h3 className="text-xl font-black text-charcoal mt-1">{slots.filter(s => !s.isBooked).length}</h3>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white p-6 rounded-3xl border border-warmBeige shadow-sm">
              <h2 className="text-sm font-extrabold text-charcoal mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Doctor Workspace Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('slots')}
                  className="p-4 rounded-2xl border border-stone-200 bg-[#FCFAF7] hover:border-terracotta text-left flex items-start gap-3 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-terracotta/10 text-terracotta flex items-center justify-center shrink-0 group-hover:bg-terracotta group-hover:text-white transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-charcoal">Generate Bulk Slots</h4>
                    <p className="text-[11px] text-stone-500 font-medium mt-0.5">Create recurring weekly availability schedule.</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className="p-4 rounded-2xl border border-stone-200 bg-[#FCFAF7] hover:border-terracotta text-left flex items-start gap-3 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-terracotta/10 text-terracotta flex items-center justify-center shrink-0 group-hover:bg-terracotta group-hover:text-white transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-charcoal">Edit Consultation Fee & Bio</h4>
                    <p className="text-[11px] text-stone-500 font-medium mt-0.5">Update consultation fee (₹) and specialty description.</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('appointments')}
                  className="p-4 rounded-2xl border border-stone-200 bg-[#FCFAF7] hover:border-terracotta text-left flex items-start gap-3 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-terracotta/10 text-terracotta flex items-center justify-center shrink-0 group-hover:bg-terracotta group-hover:text-white transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-charcoal">Start Tele-Consultation</h4>
                    <p className="text-[11px] text-stone-500 font-medium mt-0.5">Launch live video call room with pet parent.</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROFILE & SELF-SERVICE SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-warmBeige shadow-sm max-w-3xl mx-auto">
            <h2 className="text-base font-extrabold text-charcoal mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
              Doctor Profile & Self-Service Settings
            </h2>
            <p className="text-xs text-stone-500 font-medium mb-6">Update your public consultation fee, bio, phone number, and specialisations.</p>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Doctor Profile Avatar Upload Section */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-[#FCFAF7] border border-stone-200 rounded-3xl mb-6">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-terracotta shadow-sm bg-stone-100 shrink-0">
                  <img
                    src={editPhoto || provider.photo || '/sairaj_avatar.png'}
                    alt={provider.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-2 text-center sm:text-left">
                  <div>
                    <h4 className="text-xs font-black text-charcoal">Doctor Profile Photo</h4>
                    <p className="text-[11px] text-stone-500 font-medium">Upload a clear professional photo for patient booking cards.</p>
                  </div>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <div className="flex gap-2 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-white hover:bg-stone-50 border border-stone-300 text-charcoal text-xs font-extrabold rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4 text-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Change Photo
                    </button>
                    {editPhoto && (
                      <button
                        type="button"
                        onClick={() => setEditPhoto(provider.photo || '/sairaj_avatar.png')}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-600 uppercase mb-1">Full Name & Title</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FCFAF7] border border-stone-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-terracotta"
                  placeholder="e.g. Dr. Ananya Patra"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-stone-600 uppercase mb-1">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={editFee}
                    onChange={e => setEditFee(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FCFAF7] border border-stone-200 rounded-2xl text-xs font-extrabold focus:outline-none focus:border-terracotta"
                    placeholder="500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-stone-600 uppercase mb-1">Specialisation / Title</label>
                  <input
                    type="text"
                    value={editSpecialisation}
                    onChange={e => setEditSpecialisation(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FCFAF7] border border-stone-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-terracotta"
                    placeholder="e.g. Veterinary Dermatologist"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-stone-600 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FCFAF7] border border-stone-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-terracotta"
                    placeholder="+91 9876543210"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-stone-600 uppercase mb-1">Doctor Category</label>
                  <select
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value as any)}
                    className="w-full px-4 py-3 bg-[#FCFAF7] border border-stone-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-terracotta"
                  >
                    <option value="vet">Veterinary Surgeon (Vet)</option>
                    <option value="expert">Specialist Expert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-600 uppercase mb-1">Specialty Tags (Comma Separated)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={e => setEditTags(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FCFAF7] border border-stone-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-terracotta"
                  placeholder="Dermatology, Surgery, Vaccination, Nutrition"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-600 uppercase mb-1">Bio / Profile Description</label>
                <textarea
                  rows={4}
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  className="w-full p-4 bg-[#FCFAF7] border border-stone-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-terracotta leading-relaxed"
                  placeholder="Describe your qualifications, experience, and consultation philosophy..."
                />
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full py-3.5 bg-terracotta hover:bg-[#c2502f] text-white text-xs font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isSavingProfile ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Profile Settings
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: BULK AVAILABILITY & TIME SLOTS */}
        {activeTab === 'slots' && (
          <div className="space-y-6">
            {/* Bulk Schedule Generator Form */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-warmBeige shadow-sm">
              <h2 className="text-base font-extrabold text-charcoal mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Bulk Weekly Schedule Generator
              </h2>
              <p className="text-xs text-stone-500 font-medium mb-6">Select date range, daily working hours, and interval duration to generate recurring consultation slots in bulk.</p>

              <form onSubmit={handleGenerateBulkSlots} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block text-[11px] font-extrabold text-stone-600 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    value={bulkStartDate}
                    onChange={e => setBulkStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FCFAF7] border border-stone-200 rounded-xl text-xs font-bold focus:outline-none focus:border-terracotta"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-stone-600 uppercase mb-1">End Date</label>
                  <input
                    type="date"
                    value={bulkEndDate}
                    onChange={e => setBulkEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FCFAF7] border border-stone-200 rounded-xl text-xs font-bold focus:outline-none focus:border-terracotta"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-stone-600 uppercase mb-1">Start Time</label>
                  <input
                    type="time"
                    value={bulkStartTime}
                    onChange={e => setBulkStartTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FCFAF7] border border-stone-200 rounded-xl text-xs font-bold focus:outline-none focus:border-terracotta"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-stone-600 uppercase mb-1">End Time</label>
                  <input
                    type="time"
                    value={bulkEndTime}
                    onChange={e => setBulkEndTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FCFAF7] border border-stone-200 rounded-xl text-xs font-bold focus:outline-none focus:border-terracotta"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-stone-600 uppercase mb-1">Interval (Mins)</label>
                  <select
                    value={bulkInterval}
                    onChange={e => setBulkInterval(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-[#FCFAF7] border border-stone-200 rounded-xl text-xs font-bold focus:outline-none focus:border-terracotta"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>

                <div className="md:col-span-5 pt-2">
                  <button
                    type="submit"
                    disabled={isGeneratingBulk}
                    className="w-full py-3 bg-terracotta hover:bg-[#c2502f] text-white text-xs font-extrabold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    {isGeneratingBulk ? 'Generating Slots...' : 'Generate Recurring Bulk Slots'}
                  </button>
                </div>
              </form>
            </div>

            {/* Individual Slot Management */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-warmBeige shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-extrabold text-charcoal">Available Time Slots ({slots.length})</h3>
                  <p className="text-xs text-stone-500 font-medium">Add individual custom slots or review existing booked/unbooked slots.</p>
                </div>

                <button
                  onClick={handleSaveSlots}
                  disabled={isSavingSlots}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isSavingSlots ? 'Saving...' : 'Save Slots Live'}
                </button>
              </div>

              {slotMsg && (
                <div className={`p-3.5 rounded-2xl text-xs font-bold mb-4 ${slotMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                  {slotMsg.text}
                </div>
              )}

              {/* Add Custom Single Slot */}
              <div className="flex flex-col md:flex-row items-center gap-3 p-4 bg-[#FCFAF7] border border-stone-200 rounded-2xl mb-6">
                <input
                  type="date"
                  value={newSlotDate}
                  onChange={e => setNewSlotDate(e.target.value)}
                  className="w-full md:w-48 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold"
                />
                <input
                  type="text"
                  placeholder="e.g. 10:00 AM"
                  value={newSlotTime}
                  onChange={e => setNewSlotTime(e.target.value)}
                  className="w-full md:w-48 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold"
                />
                <button
                  onClick={handleAddSlot}
                  className="w-full md:w-auto px-5 py-2 bg-charcoal hover:bg-stone-800 text-white text-xs font-extrabold rounded-xl transition-all"
                >
                  Add Single Slot
                </button>
              </div>

              {/* Slots Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {slots.length === 0 ? (
                  <p className="col-span-full text-xs text-stone-400 italic text-center py-6">No time slots created yet. Use the bulk generator above to create slots.</p>
                ) : (
                  slots.map((s, idx) => (
                    <div
                      key={s._id || idx}
                      className={`p-3 rounded-2xl border text-center relative group transition-all ${
                        s.isBooked
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : 'bg-[#FCFAF7] border-stone-200 text-charcoal hover:border-terracotta'
                      }`}
                    >
                      <span className="block text-[10px] font-extrabold uppercase text-stone-400">{s.date}</span>
                      <span className="block text-xs font-black mt-0.5">{s.time}</span>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase mt-1 ${s.isBooked ? 'bg-rose-200 text-rose-800' : 'bg-emerald-100 text-emerald-700'}`}>
                        {s.isBooked ? 'Booked' : 'Free'}
                      </span>

                      {!s.isBooked && (
                        <button
                          onClick={() => handleRemoveSlot(idx)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-stone-700 hover:bg-rose-600 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: APPOINTMENTS & PRESCRIPTIONS */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            {/* Filter bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-warmBeige shadow-sm">
              <h2 className="text-sm font-extrabold text-charcoal flex items-center gap-2">
                <svg className="w-5 h-5 text-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Patient Consultations ({filteredAppts.length})
              </h2>

              <div className="flex gap-2">
                {(['all', 'confirmed', 'pending', 'cancelled'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setApptFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold capitalize transition-all ${
                      apptFilter === st
                        ? 'bg-charcoal text-white shadow-sm'
                        : 'bg-[#FCFAF7] text-stone-600 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Appointment List */}
            <div className="space-y-4">
              {filteredAppts.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-warmBeige text-center">
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">No consultations found matching criteria</p>
                </div>
              ) : (
                filteredAppts.map(a => (
                  <div key={a._id} className="bg-white p-6 rounded-3xl border border-warmBeige shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-terracotta transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                          {a.bookingId || a._id.slice(-6)}
                        </span>
                        <span className="text-xs font-black text-charcoal">Patient: {a.petName}</span>
                        <span className="text-[11px] font-bold text-stone-400">• Mode: {a.mode}</span>
                      </div>

                      <div className="text-xs font-semibold text-stone-600 flex items-center gap-4">
                        <span>📅 Date: {a.date}</span>
                        <span>⏰ Time: {a.time}</span>
                        <span>💰 Fee: ₹{a.fee}</span>
                      </div>

                      {a.notes && (
                        <p className="text-xs text-stone-500 bg-[#FCFAF7] p-3 rounded-2xl border border-stone-200 italic">
                          "Client Notes: {a.notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      {a.mode === 'tele-consult' && (
                        <CallSessionButton
                          appointment={a}
                          onJoinCall={() => setActiveCallAppt(a)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-sm"
                        />
                      )}

                      <button
                        onClick={() => {
                          setSelectedApptForPrescription(a);
                          setPrescriptionNotesText(a.prescriptionNotes || '');
                          setPrescriptionPhotoBase64(a.prescription || '');
                        }}
                        className="px-4 py-2 bg-[#FCFAF7] hover:bg-stone-100 text-charcoal border border-stone-200 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 text-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        E-Prescription
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* E-PRESCRIPTION MODAL */}
      {selectedApptForPrescription && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-warmBeige animate-scaleIn">
            <h3 className="text-base font-extrabold text-charcoal mb-1">Issue E-Prescription</h3>
            <p className="text-xs text-stone-500 font-medium mb-4">Patient: {selectedApptForPrescription.petName} ({selectedApptForPrescription.bookingId})</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-stone-600 uppercase mb-1">Prescription Notes / Advice</label>
                <textarea
                  rows={4}
                  value={prescriptionNotesText}
                  onChange={e => setPrescriptionNotesText(e.target.value)}
                  className="w-full p-3.5 bg-[#FCFAF7] border border-stone-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-terracotta leading-relaxed"
                  placeholder="Enter medical instructions, dosage, and diagnostic recommendations..."
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-600 uppercase mb-1">Prescription Photo Upload (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setPrescriptionPhotoBase64(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs text-stone-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-terracotta/10 file:text-terracotta hover:file:bg-terracotta/20"
                />
              </div>

              {prescriptionPhotoBase64 && (
                <div className="mt-2 relative">
                  <img src={prescriptionPhotoBase64} alt="Prescription Preview" className="max-h-32 rounded-xl border object-contain mx-auto" />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSavePrescription}
                  disabled={isSavingPrescription}
                  className="flex-1 py-3 bg-terracotta hover:bg-[#c2502f] text-white text-xs font-extrabold rounded-2xl transition-all shadow-md"
                >
                  {isSavingPrescription ? 'Saving...' : 'Send Prescription'}
                </button>
                <button
                  onClick={() => setSelectedApptForPrescription(null)}
                  className="px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-extrabold rounded-2xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
