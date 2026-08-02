'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../lib/api';

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

  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('');
  const [isSavingSlots, setIsSavingSlots] = useState(false);
  const [slotMsg, setSlotMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [apptFilter, setApptFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  const fetchProviderData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/provider/me`, { headers: getAuthHeaders() });
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
    if (token) fetchProviderData();
  }, [token]);

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
        body: JSON.stringify({ slots }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setSlots(data.slots || slots);
        setSlotMsg({ type: 'success', text: 'Slots saved successfully!' });
        setTimeout(() => setSlotMsg(null), 3000);
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
        <button onClick={fetchProviderData} className="mt-4 w-full py-2.5 bg-[#2D4536] text-white text-sm font-bold rounded-2xl hover:bg-[#1E2E24] transition-all cursor-pointer">Retry</button>
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
            <p className="text-[11px] text-white/50 font-semibold uppercase tracking-widest mb-0.5">Provider Portal</p>
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
              <h3 className="text-sm font-extrabold text-stone-800 mb-3">Your Profile</h3>
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
              {provider.bio && <p className="mt-3 text-xs text-stone-500 leading-relaxed border-t border-stone-100 pt-3">{provider.bio}</p>}
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
            <button onClick={fetchProviderData} className="w-full py-3 bg-white border border-[#EBE3D5] hover:bg-stone-50 text-stone-600 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer">Refresh Dashboard</button>
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
    </div>
  );
}
