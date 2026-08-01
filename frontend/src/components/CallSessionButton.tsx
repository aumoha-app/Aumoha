'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../lib/api';

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

  const fetchSessionStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/appointments/${appointment._id}/call`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
      }
    } catch (err) {
      console.error('Error fetching call status:', err);
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
    setRequesting(true);
    try {
      const res = await fetch(`${API_BASE}/appointments/${appointment._id}/call/request`, {
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
        const res = await fetch(`${API_BASE}/appointments/${appointment._id}/call/request`, {
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
      {requesting ? 'Connecting...' : '📞 Join Call Room'}
    </button>
  );
}
