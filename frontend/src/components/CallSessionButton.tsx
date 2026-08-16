'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../lib/api';
import { isAppointmentExpired } from '../lib/appointmentUtils';

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
      // Silent catch during background polling or server restarts
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appointment && appointment.mode === 'tele-consult') {
      fetchSessionStatus();
      const interval = setInterval(fetchSessionStatus, 4000);
      return () => clearInterval(interval);
    }
  }, [appointment, token]);

  const handleRequestCall = async () => {
    if (!targetId) return;
    setRequesting(true);
    try {
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
    } catch (err) {
      console.error('Error requesting call:', err);
    } finally {
      setRequesting(false);
    }
  };

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

  if (!appointment || appointment.mode !== 'tele-consult') {
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

  // If call was completed/ended
  if (session && session.status === 'ended') {
    return (
      <div className={`w-full py-2.5 bg-stone-100 text-stone-500 text-xs font-bold rounded-2xl text-center border border-stone-200 ${className || ''}`}>
        ✓ Call Ended
      </div>
    );
  }

  // Active / Ready / Direct Join Button
  return (
    <button
      type="button"
      onClick={handleDirectJoin}
      disabled={requesting}
      className={`w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${className || ''}`}
    >
      {requesting ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span>Join Call Room</span>
        </>
      )}
    </button>
  );
}
