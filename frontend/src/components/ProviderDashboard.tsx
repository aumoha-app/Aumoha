'use client';

import { useState, useEffect } from 'react';
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
  rating: number;
  reviewCount: number;
  isOnline: boolean;
  availableSlots: Slot[];
  email?: string;
}

interface Summary {
  total: number;
  confirmed: number;
  upcoming: number;
  totalEarnings: number;
}

type Tab = 'overview' | 'appointments' | 'slots';

export default function ProviderDashboard() {
  const { user, token } = useAuth();
  const [popupConfig, setPopupConfig] = useState<PopupConfig | null>(null);

  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('vet1');
  const [activeCallAppt, setActiveCallAppt] = useState<Appointment | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('');
  const [isSavingSlots, setIsSavingSlots] = useState(false);
  const [slotMsg, setSlotMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [apptFilter, setApptFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');

  // Prescription modal and upload state
  const [selectedApptForPrescription, setSelectedApptForPrescription] = useState<Appointment | null>(null);
  const [prescriptionNotesText, setPrescriptionNotesText] = useState('');
  const [prescriptionPhotoBase64, setPrescriptionPhotoBase64] = useState('');
  const [isSavingPrescription, setIsSavingPrescription] = useState(false);


  // Doctor Profile Editing State
  const [isEditingProfileModal, setIsEditingProfileModal] = useState(false);
  const [editBioText, setEditBioText] = useState('');
  const [editFeeVal, setEditFeeVal] = useState('');
  const [editExpVal, setEditExpVal] = useState('');
  const [editSpecialisationText, setEditSpecialisationText] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  const handleSaveProfile = async () => {
    if (!provider) return;
    setIsSavingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/provider/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          providerId: provider._id,
          bio: editBioText,
          fee: Number(editFeeVal),
          experience: Number(editExpVal),
          specialisation: editSpecialisationText
        })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setProvider(prev => prev ? {
          ...prev,
          bio: editBioText,
          fee: Number(editFeeVal),
          experience: Number(editExpVal),
          specialisation: editSpecialisationText
        } : prev);
        setIsEditingProfileModal(false);
      } else {
        setPopupConfig({ message: data.message || 'Failed to update profile.', type: 'error' });
      }
    } catch {
      setPopupConfig({ message: 'Network error updating profile.', type: 'error' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const fetchProviderData = async (targetId?: string) => {
    setIsLoading(true);
    setError(null);
    const pId = targetId || selectedProviderId;
    try {
      const res = await fetch(`${API_BASE}/provider/me?providerId=${pId}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setProvider(data.provider);
        setAppointments(data.appointments || []);
        setSummary(data.summary);
        setSlots(data.provider.availableSlots || []);
      } else {
        setError(data.message || 'Failed to load provider data.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchProviderData(selectedProviderId);
  }, [token, selectedProviderId]);

  const toggleOnline = async () => {
    if (!provider) return;
    setIsTogglingOnline(true);
    try {
      const res = await fetch(`${API_BASE}/provider/availability`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isOnline: !provider.isOnline }),
      });
      const data = await res.json();
      if (res.ok) setProvider(prev => prev ? { ...prev, isOnline: data.isOnline } : prev);
    } catch {
      console.error('Failed to toggle availability');
    } finally {
      setIsTogglingOnline(false);
    }
  };

  const addSlot = () => {
    if (!newSlotDate || !newSlotTime) return;
    if (slots.some(s => s.date === newSlotDate && s.time === newSlotTime)) return;
    setSlots(prev => [...prev, { date: newSlotDate, time: newSlotTime, isBooked: false }]);
    setNewSlotDate('');
    setNewSlotTime('');
  };

  const removeSlot = (idx: number) => setSlots(prev => prev.filter((_, i) => i !== idx));

  const saveSlots = async () => {
    setIsSavingSlots(true);
    setSlotMsg(null);
    try {
      const res = await fetch(`${API_BASE}/provider/slots`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ slots, providerId: provider?._id || selectedProviderId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSlotMsg({ type: 'success', text: 'Free slots saved successfully!' });
        if (data.slots) setSlots(data.slots);
      } else {
        setSlotMsg({ type: 'error', text: data.message || 'Failed to save slots.' });
      }
    } catch {
      setSlotMsg({ type: 'error', text: 'Network error saving slots.' });
    } finally {
      setIsSavingSlots(false);
    }
  };

  const filteredAppts = apptFilter === 'all' ? appointments : appointments.filter(a => a.status === apptFilter);
  const statusColor = (s: string) =>
    s === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : s === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500';
  const todayStr = new Date().toISOString().split('T')[0];

  if (isLoading) return (
    <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-stone-400">
        <div className="w-10 h-10 rounded-full border-4 border-stone-200 border-t-[#2D4536] animate-spin" />
        <p className="text-sm font-semibold">Loading your dashboard...</p>
      </div>
    </div>
  );

  if (error || !provider) return (
    <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-lg border border-[#EBE3D5]">
        <div className="text-4xl mb-4">🩺</div>
        <h2 className="text-lg font-extrabold text-stone-800 mb-2">Provider Account Not Found</h2>
        <p className="text-sm text-stone-500 mb-4">{error || 'No provider profile linked to this email. Contact admin.'}</p>
        <p className="text-xs text-stone-400 bg-stone-50 rounded-xl p-3 font-mono">{user?.email}</p>
        <button onClick={() => fetchProviderData()} className="mt-4 w-full py-2.5 bg-[#2D4536] text-white text-sm font-bold rounded-2xl hover:bg-[#1E2E24] transition-all cursor-pointer">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F1EB]">
      {/* HEADER */}
      <div className="bg-[#1C2A20] text-white px-5 pt-10 pb-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #4A7C59 0%, transparent 60%)' }} />
        <div className="relative flex items-center gap-4 max-w-2xl mx-auto">
          <div className="relative shrink-0">
            <img src={provider.photo || '/sairaj_avatar.png'} alt={provider.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-lg" />
            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#1C2A20] ${provider.isOnline ? 'bg-emerald-400' : 'bg-stone-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[11px] text-white/50 font-semibold uppercase tracking-widest">Provider Portal</p>
              <select
                value={selectedProviderId}
                onChange={(e) => {
                  setSelectedProviderId(e.target.value);
                  fetchProviderData(e.target.value);
                }}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-lg outline-none cursor-pointer"
              >
                <option value="vet1" className="bg-stone-900 text-white">Dr. Ananya Patra (Vet)</option>
                <option value="vet2" className="bg-stone-900 text-white">Dr. Rohit Nanda (Vet)</option>
                <option value="vet3" className="bg-stone-900 text-white">Dr. Meera Iyer (Vet)</option>
                <option value="exp1" className="bg-stone-900 text-white">Rohan Verma (Nutritionist)</option>
                <option value="exp2" className="bg-stone-900 text-white">Dr. Ananya Rao (Behaviourist)</option>
                <option value="exp5" className="bg-stone-900 text-white">John (Physiotherapist)</option>
              </select>
            </div>
            <h1 className="text-xl font-extrabold text-white leading-tight truncate">{provider.name}</h1>
            <p className="text-sm text-white/70 font-medium truncate">{provider.specialisation}</p>
          </div>
          <button onClick={toggleOnline} disabled={isTogglingOnline} className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${provider.isOnline ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30' : 'bg-stone-500/20 border-stone-400/30 text-stone-300 hover:bg-stone-500/30'}`}>
            {isTogglingOnline ? <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : <span className={`w-2 h-2 rounded-full ${provider.isOnline ? 'bg-emerald-400' : 'bg-stone-400'}`} />}
            {provider.isOnline ? 'Online' : 'Offline'}
          </button>
        </div>
        {summary && (
          <div className="relative mt-5 max-w-2xl mx-auto grid grid-cols-3 gap-3">
            {[{ label: 'Total Bookings', value: summary.total }, { label: 'Confirmed', value: summary.confirmed }, { label: 'Earnings', value: `Rs.${summary.totalEarnings.toLocaleString('en-IN')}` }].map(({ label, value }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
                <p className="text-lg font-extrabold text-white">{value}</p>
                <p className="text-[10px] text-white/50 font-semibold mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TAB NAV */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex">
          {(['overview', 'appointments', 'slots'] as Tab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-xs font-bold capitalize transition-all border-b-2 cursor-pointer ${activeTab === tab ? 'border-[#2D4536] text-[#2D4536]' : 'border-transparent text-stone-400 hover:text-stone-600'}`}>
              {tab === 'overview' ? 'Overview' : tab === 'appointments' ? 'Bookings' : 'My Slots'}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-2xl mx-auto px-4 py-5 flex flex-col gap-4 pb-24">

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <>
            <div className="bg-white rounded-3xl border border-[#EBE3D5] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-stone-800">Your Profile</h3>
                <button
                  type="button"
                  onClick={() => {
                    setEditBioText(provider.bio || '');
                    setEditFeeVal(String(provider.fee));
                    setEditExpVal(String(provider.experience));
                    setEditSpecialisationText(provider.specialisation || '');
                    setIsEditingProfileModal(true);
                  }}
                  className="px-3 py-1.5 bg-[#2D4536] hover:bg-[#1E2E24] text-white text-[11px] font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span>Edit Profile & Bio</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { label: 'Category', value: provider.category === 'vet' ? 'Veterinarian' : provider.category },
                  { label: 'Experience', value: `${provider.experience} years` },
                  { label: 'Consultation Fee', value: `Rs.${provider.fee}` },
                  { label: 'Rating', value: `${provider.rating} (${provider.reviewCount} reviews)` },
                  { label: 'Email', value: provider.email || user?.email || '-' },
                  { label: 'Free Slots', value: `${provider.availableSlots?.filter(s => !s.isBooked).length || 0} available` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                    <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="font-extrabold text-stone-800 leading-tight text-xs">{value}</p>
                  </div>
                ))}
              </div>
              {provider.bio && (
                <div className="mt-3 pt-3 border-t border-stone-100">
                  <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider mb-1">Doctor Description / Bio</p>
                  <p className="text-xs text-stone-600 leading-relaxed font-medium">{provider.bio}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-[#EBE3D5] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-stone-800">Upcoming Bookings</h3>
                <button onClick={() => setActiveTab('appointments')} className="text-[11px] font-bold text-[#2D4536] hover:underline cursor-pointer">View All</button>
              </div>
              {appointments.filter(a => a.status !== 'cancelled').slice(0, 3).length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-6">No upcoming bookings yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {appointments.filter(a => a.status !== 'cancelled').slice(0, 3).map(appt => (
                    <div key={appt._id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-100">
                      <div className="w-8 h-8 rounded-full bg-[#2D4536]/10 flex items-center justify-center text-base shrink-0">🐾</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-extrabold text-stone-800 truncate">{appt.petName}</p>
                        <p className="text-[10px] text-stone-400">{appt.date} · {appt.time}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-extrabold text-[#2D4536]">Rs.{appt.fee}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusColor(appt.status)}`}>{appt.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => fetchProviderData()} className="w-full py-3 bg-white border border-[#EBE3D5] hover:bg-stone-50 text-stone-600 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer">Refresh Dashboard</button>
          </>
        )}

        {/* APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'confirmed', 'pending', 'cancelled'] as const).map(f => (
                <button key={f} onClick={() => setApptFilter(f)} className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all capitalize cursor-pointer ${apptFilter === f ? 'bg-[#2D4536] text-white' : 'bg-white border border-stone-200 text-stone-500 hover:border-stone-300'}`}>
                  {f} ({f === 'all' ? appointments.length : appointments.filter(a => a.status === f).length})
                </button>
              ))}
            </div>
            {filteredAppts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-stone-200 py-12 text-center">
                <p className="text-xs font-bold text-stone-400">No {apptFilter !== 'all' ? apptFilter : ''} bookings found.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredAppts.map(appt => (
                  <div key={appt._id} className="bg-white rounded-3xl border border-[#EBE3D5] p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-extrabold text-stone-800">🐾 {appt.petName}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusColor(appt.status)}`}>{appt.status}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500 capitalize">{appt.mode}</span>
                        </div>
                        <p className="text-[11px] text-stone-500 truncate">Owner: {appt.userEmail}</p>
                        <p className="text-[11px] text-stone-500 mt-0.5">{appt.date} · {appt.time}</p>
                        {appt.notes && <p className="text-[10px] text-stone-400 mt-1.5 italic bg-stone-50 rounded-lg px-2 py-1">"{appt.notes}"</p>}

                        {/* Medical Document upload / view (if uploaded by pet owner) */}
                        {appt.medicalDocument && (
                          <div className="mt-2.5 flex items-center gap-2">
                            <span className="text-[10px] text-stone-500 font-bold">📄 Patient History File:</span>
                            <button
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = appt.medicalDocument!;
                                link.download = `${appt.petName}_history.jpg`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="px-2 py-1 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-[9px] font-extrabold rounded-lg cursor-pointer"
                            >
                              Download File ⬇
                            </button>
                          </div>
                        )}

                        {/* Prescription Upload Actions */}
                        <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center gap-2">
                          {appt.prescription ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                ✓ Prescription Issued
                              </span>
                              <button
                                onClick={() => {
                                  setSelectedApptForPrescription(appt);
                                  setPrescriptionNotesText(appt.prescriptionNotes || '');
                                  setPrescriptionPhotoBase64(appt.prescription || '');
                                }}
                                className="text-[9px] text-[#2D4536] hover:underline font-bold cursor-pointer"
                              >
                                Edit / View details
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedApptForPrescription(appt);
                                setPrescriptionNotesText('');
                                setPrescriptionPhotoBase64('');
                              }}
                              className="px-3 py-1 bg-[#2D4536] hover:bg-[#1E2E24] text-white text-[10px] font-extrabold rounded-lg cursor-pointer"
                            >
                              + Issue Prescription
                            </button>
                          )}
                        </div>

                        {/* Direct Video Call Join Button */}
                        {appt.mode === 'tele-consult' && appt.status !== 'cancelled' && (
                          <div className="mt-2.5">
                            <CallSessionButton
                              appointment={appt}
                              onJoinCall={(a) => setActiveCallAppt(a)}
                            />
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-extrabold text-[#2D4536]">Rs.{appt.fee}</p>
                        <p className="text-[9px] text-stone-400 mt-0.5">{appt.type === 'vet' ? 'Vet Visit' : 'Expert Session'}</p>
                        <p className="text-[9px] text-stone-300 mt-1">#{appt.bookingId?.slice(-6)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* SLOTS */}
        {activeTab === 'slots' && (
          <>
            <div className="bg-white rounded-3xl border border-[#EBE3D5] p-5 shadow-sm">
              <h3 className="text-sm font-extrabold text-stone-800 mb-1">Add Available Slot</h3>
              <p className="text-[11px] text-stone-400 mb-4">Select a date and time to open a new booking slot for clients.</p>
              <div className="flex gap-2">
                <input type="date" min={todayStr} value={newSlotDate} onChange={e => setNewSlotDate(e.target.value)} className="flex-1 bg-stone-50 rounded-xl py-2.5 px-3 text-xs text-stone-800 border border-stone-200 focus:border-[#2D4536] outline-none" />
                <input type="time" value={newSlotTime} onChange={e => setNewSlotTime(e.target.value)} className="w-32 bg-stone-50 rounded-xl py-2.5 px-3 text-xs text-stone-800 border border-stone-200 focus:border-[#2D4536] outline-none" />
                <button onClick={addSlot} disabled={!newSlotDate || !newSlotTime} className="px-4 py-2 bg-[#2D4536] hover:bg-[#1E2E24] disabled:bg-stone-200 disabled:text-stone-400 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer">+ Add</button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#EBE3D5] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-stone-800">Current Slots ({slots.length})</h3>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">{slots.filter(s => !s.isBooked).length} free</span>
              </div>
              {slots.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-8">No slots defined yet. Add some above.</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                  {slots.map((slot, idx) => (
                    <div key={idx} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${slot.isBooked ? 'bg-amber-50 border-amber-200' : 'bg-stone-50 border-stone-100'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${slot.isBooked ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                        <div>
                          <p className="text-xs font-bold text-stone-800">{slot.date}</p>
                          <p className="text-[10px] text-stone-400">{slot.time}</p>
                        </div>
                      </div>
                      {slot.isBooked ? (
                        <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Booked</span>
                      ) : (
                        <button onClick={() => removeSlot(idx)} className="text-[10px] font-bold text-stone-400 hover:text-red-500 transition-colors cursor-pointer px-2 py-0.5 rounded-lg hover:bg-red-50">Remove</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {slotMsg && (
              <div className={`px-4 py-3 rounded-2xl text-xs font-semibold ${slotMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                {slotMsg.text}
              </div>
            )}

            <button onClick={saveSlots} disabled={isSavingSlots} className="w-full py-3.5 bg-[#2D4536] hover:bg-[#1E2E24] disabled:opacity-60 text-white text-sm font-extrabold rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
              {isSavingSlots ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : 'Save All Slots'}
            </button>
          </>
        )}
      </div>

      {/* PRESCRIPTION SUBMISSION MODAL OVERLAY */}
      {selectedApptForPrescription && (
        <div className="fixed inset-0 z-50 bg-[#1C1A17]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#F0EBE1] shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            <header className="flex justify-between items-start">
              <div>
                <h3 className="font-serif text-lg text-[#1C1A17] font-semibold">Issue Prescription</h3>
                <p className="text-[10px] text-stone-400 font-medium mt-0.5">
                  Set prescription details and upload a photo for {selectedApptForPrescription.petName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApptForPrescription(null)}
                className="p-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                ✕
              </button>
            </header>

            <div className="flex flex-col gap-4">
              {/* Photo attachment upload */}
              <div className="flex flex-col items-center gap-2 select-none">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border border-[#EBE3D5] bg-[#F5F2EC] flex items-center justify-center shadow-inner relative">
                  {prescriptionPhotoBase64 ? (
                    <img src={prescriptionPhotoBase64} alt="Prescription Attachment" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-stone-400">No image attached</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const fileInput = document.createElement('input');
                      fileInput.type = 'file';
                      fileInput.accept = 'image/*';
                      fileInput.onchange = (e: any) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            setPrescriptionPhotoBase64(evt.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      fileInput.click();
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-stone-50 border border-[#EBE3D5] text-[#1C1A17] font-bold text-[10px] rounded-lg cursor-pointer"
                  >
                    Upload Photo
                  </button>
                  {prescriptionPhotoBase64 && (
                    <button
                      type="button"
                      onClick={() => setPrescriptionPhotoBase64('')}
                      className="px-2.5 py-1 bg-white hover:bg-red-50 hover:border-red-200 border border-[#EBE3D5] text-red-500 font-bold text-[10px] rounded-lg cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Prescription Notes */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Prescription Advice & Notes</label>
                <textarea
                  rows={4}
                  value={prescriptionNotesText}
                  onChange={(e) => setPrescriptionNotesText(e.target.value)}
                  placeholder="Enter medical instructions, dosage advice, etc."
                  className="w-full bg-[#F5F3EF] rounded-xl py-2 px-3 text-xs text-[#1C1A17] border border-transparent focus:border-[#4A5D4E] focus:bg-white outline-none resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedApptForPrescription(null)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-stone-200 bg-white text-stone-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setIsSavingPrescription(true);
                    try {
                      const res = await fetch(`${API_BASE}/provider/appointments/${selectedApptForPrescription._id}/prescription`, {
                        method: 'PUT',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({
                          prescription: prescriptionPhotoBase64,
                          prescriptionNotes: prescriptionNotesText
                        })
                      });
                      const data = await res.json();
                      if (res.ok && data.status === 'success') {
                        setAppointments(prev => prev.map(a => a._id === selectedApptForPrescription._id ? { ...a, prescription: prescriptionPhotoBase64, prescriptionNotes: prescriptionNotesText } : a));
                        setSelectedApptForPrescription(null);
                      } else {
                        setPopupConfig({ message: data.message || 'Failed to save prescription.', type: 'error' });
                      }
                    } catch {
                      setPopupConfig({ message: 'Network error. Failed to save prescription.', type: 'error' });
                    } finally {
                      setIsSavingPrescription(false);
                    }
                  }}
                  disabled={isSavingPrescription || (!prescriptionPhotoBase64.trim() && !prescriptionNotesText.trim())}
                  className="px-5 py-2 bg-[#2D4536] hover:bg-[#1E2E24] text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isSavingPrescription ? 'Saving...' : 'Save & Notify User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOCTOR PROFILE EDITING MODAL */}
      {isEditingProfileModal && (
        <div className="fixed inset-0 z-50 bg-[#1C1A17]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#F0EBE1] shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            <header className="flex justify-between items-start border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-serif text-lg text-[#1C1A17] font-bold">Edit Doctor Profile & Bio</h3>
                <p className="text-[11px] text-stone-400 font-medium mt-0.5">
                  Update your public profile info & description visible to clients during booking.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingProfileModal(false)}
                className="p-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                ✕
              </button>
            </header>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Doctor Bio / Description</label>
                <textarea
                  rows={4}
                  value={editBioText}
                  onChange={(e) => setEditBioText(e.target.value)}
                  placeholder="Describe your medical background, treatment philosophy, or specialisations..."
                  className="w-full bg-[#F5F3EF] rounded-xl p-3 text-xs text-[#1C1A17] border border-[#EBE3D5] focus:border-[#2D4536] focus:bg-white outline-none resize-none font-medium leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={editFeeVal}
                    onChange={(e) => setEditFeeVal(e.target.value)}
                    className="w-full bg-[#F5F3EF] rounded-xl py-2 px-3 text-xs text-[#1C1A17] font-bold border border-[#EBE3D5] focus:border-[#2D4536] focus:bg-white outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Experience (Years)</label>
                  <input
                    type="number"
                    value={editExpVal}
                    onChange={(e) => setEditExpVal(e.target.value)}
                    className="w-full bg-[#F5F3EF] rounded-xl py-2 px-3 text-xs text-[#1C1A17] font-bold border border-[#EBE3D5] focus:border-[#2D4536] focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Specialisation / Title</label>
                <input
                  type="text"
                  value={editSpecialisationText}
                  onChange={(e) => setEditSpecialisationText(e.target.value)}
                  className="w-full bg-[#F5F3EF] rounded-xl py-2 px-3 text-xs text-[#1C1A17] font-bold border border-[#EBE3D5] focus:border-[#2D4536] focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsEditingProfileModal(false)}
                className="px-4 py-2.5 text-xs font-bold rounded-xl border border-stone-200 bg-white text-stone-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="px-6 py-2.5 bg-[#2D4536] hover:bg-[#1E2E24] text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-sm transition-all disabled:opacity-50"
              >
                {isSavingProfile ? 'Saving Changes...' : 'Save Profile & Bio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AGORA VIDEO CALL MODAL FOR DOCTOR / EXPERT */}
      {activeCallAppt && (
        <AgoraCallModal
          channelName={activeCallAppt.bookingId || activeCallAppt._id}
          appointment={activeCallAppt}
          onClose={() => {
            const finishedAppt = activeCallAppt;
            setActiveCallAppt(null);
            if (finishedAppt && !finishedAppt.prescription) {
              setSelectedApptForPrescription(finishedAppt);
              setPrescriptionNotesText('');
              setPrescriptionPhotoBase64('');
            }
          }}
        />
      )}

      {/* Popup Alert Modal */}
      <PopupModal config={popupConfig} onClose={() => setPopupConfig(null)} />
    </div>
  );
}

