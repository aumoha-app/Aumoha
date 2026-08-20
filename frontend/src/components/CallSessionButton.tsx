'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../lib/api';
import { isAppointmentExpired, isAppointmentTimeReached } from '../lib/appointmentUtils';

interface CallSessionButtonProps {
  appointment: any;
  onJoinCall: (appointment: any) => void;
  className?: string;
}

export default function CallSessionButton({ appointment, onJoinCall, className }: CallSessionButtonProps) {
  const { token } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [requesting, setRequesting] = useState<boolean>(false);
  const [nowTime, setNowTime] = useState<number>(Date.now());

  const targetId = appointment ? (appointment.bookingId || appointment._id) : '';

  const fetchSessionStatus = async () => {
    if (!targetId) return;
    try {
      const res = await fetch(`${API_BASE}/appointments/${targetId}/call`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
      }
    } catch {
      // Silent catch during background polling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appointment) {
      fetchSessionStatus();
      const interval = setInterval(() => {
        fetchSessionStatus();
        setNowTime(Date.now());
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [appointment, token]);

  const handleDirectJoin = async () => {
    if (requesting) return;
    setRequesting(true);
    try {
      if (!session || session.status === 'requested') {
        const res = await fetch(`${API_BASE}/appointments/${targetId}/call/request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ callType: 'video' })
        });
        if (res.ok) {
          const data = await res.json();
          setSession(data.session);
        }
      }
      onJoinCall(appointment);
    } catch (err) {
      console.error('Error joining call:', err);
      onJoinCall(appointment);
    } finally {
      setRequesting(false);
    }
  };

  if (!appointment) {
    return null;
  }

  if (loading) {
    return (
      <div className={`py-2.5 px-4 bg-stone-100 text-stone-400 text-xs font-bold rounded-2xl text-center animate-pulse ${className || ''}`}>
        Checking call status...
      </div>
    );
  }

  const isExpired = isAppointmentExpired(appointment);

  if (isExpired) {
    return (
      <div className={`w-full py-2.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-2xl text-center border border-slate-200 ${className || ''}`}>
        ✓ Meeting Ended (Happened)
      </div>
    );
  }

  if (session && session.status === 'ended') {
    return (
      <div className={`w-full py-2.5 bg-stone-100 text-stone-500 text-xs font-bold rounded-2xl text-center border border-stone-200 ${className || ''}`}>
        ✓ Call Ended
      </div>
    );
  }

  // Instant consultations & tele-consultations are immediately joinable
  const isTimeReached = appointment.isInstant || isAppointmentTimeReached(appointment);

  return (
    <button
      type="button"
      onClick={handleDirectJoin}
      disabled={requesting}
      className={`w-full py-3.5 bg-[#2D4536] hover:bg-[#1E2E24] active:scale-[0.99] text-white text-xs font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${className || ''}`}
    >
      {requesting ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Connecting to Call Room...</span>
        </>
      ) : (
        <>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          <span>Join Call Room</span>
        </>
      )}
    </button>
  );
}
