'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../lib/api';
import TermsModal from './TermsModal';
import PrivacyPolicyModal from './PrivacyPolicyModal';

export default function OnboardingScreen() {
  const { firebaseUser, token, signOut, syncProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [role, setRole] = useState<'normal' | 'feeder' | 'rescuer' | 'volunteer' | 'paravet' | 'adopter' | ''>('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    setIsDetectingLocation(true);
    setAddress('Detecting location...');

    // Set a 5-second timeout for the reverse geocoding request and location detection
    const timeoutId = setTimeout(() => {
      setIsDetectingLocation(curr => {
        if (curr) {
          console.warn('Geolocation or reverse geocoding timed out.');
          setAddress('');
          return false;
        }
        return curr;
      });
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
            headers: {
              'Accept-Language': 'en'
            }
          });
          if (res.ok) {
            const data = await res.json();
            clearTimeout(timeoutId);
            setIsDetectingLocation(false);
            if (data.display_name) {
              setAddress(`${data.display_name} [${lat.toFixed(6)}, ${lng.toFixed(6)}]`);
            } else {
              setAddress('');
            }
          } else {
            clearTimeout(timeoutId);
            setIsDetectingLocation(false);
            setAddress('');
          }
        } catch (err) {
          clearTimeout(timeoutId);
          setIsDetectingLocation(false);
          setAddress('');
        }
      },
      (error) => {
        clearTimeout(timeoutId);
        setIsDetectingLocation(false);
        setAddress('');
        console.warn('Geolocation permission denied or failed:', error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => clearTimeout(timeoutId);
  }, []);

  const compressImage = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
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
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          callback(dataUrl);
        } else {
          callback(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (base64) => {
        setProfilePic(base64);
      });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    if (!fullName.trim() || !phone.trim() || !address.trim() || !role) {
      setError('Please fill in all required fields, including your role.');
      setIsSaving(false);
      return;
    }

    if (address === 'Detecting location...') {
      setError('Please wait for location detection or fill in your address manually.');
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          phone,
          address,
          profilePic,
          role,
          email: firebaseUser?.email || '',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Sync context profile state instantly using the returned user data
        await syncProfile(data.user);
      } else {
        const errData = await response.json();
        setError(errData.message || 'Failed to save profile. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Unable to connect to the backend server.');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-sm border border-[#F0EBE1] animate-scaleIn select-none mt-8 relative">
      
      {/* Back / Sign Out button on top left */}
      <button
        type="button"
        onClick={() => signOut()}
        disabled={isSaving}
        className="absolute top-5 left-5 w-8 h-8 rounded-xl border border-[#F0EBE1] bg-white hover:bg-stone-50 text-stone-500 hover:text-[#1C1A17] flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-sm"
        title="Cancel and Sign Out"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </button>

      {/* Onboarding Header */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-12 h-12 rounded-full bg-[#E8F5E9] flex items-center justify-center text-[#2E7D32] shadow-sm">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h1 className="font-serif text-2xl text-[#1C1A17] font-normal tracking-tight mt-1">Complete Your Profile</h1>
        <p className="text-xs text-stone-500 max-w-[320px]">
          We need a few details to establish your credentials on the Aumoha rescue network.
        </p>
      </div>

      {error && (
        <div className="bg-[#FDEDEC] border border-[#F5C2C2] text-[#C0392B] rounded-xl px-4 py-3 text-xs leading-relaxed font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Profile Pic Circle */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Profile Photo</span>
          
          <div className="relative group select-none">
            <div className="w-20 h-20 rounded-full overflow-hidden border border-warmBeige bg-gradient-to-br from-terracotta to-clay flex items-center justify-center text-[#FDFBF7] font-serif text-2xl shadow-sm relative">
              {profilePic ? (
                <img
                  src={profilePic}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{getInitials(fullName)}</span>
              )}

              {/* Photo Upload Overlay */}
              <div 
                onClick={triggerFileInput}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-200 text-white text-[9px] font-bold gap-1"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span>Upload</span>
              </div>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          <button 
            type="button"
            onClick={triggerFileInput}
            className="text-[11px] text-[#4A5D4E] hover:text-[#3A4D3E] font-bold transition-colors cursor-pointer"
          >
            Choose Image
          </button>
        </div>

        {/* Inputs list */}
        <div className="flex flex-col gap-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label htmlFor="fullName" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              id="fullName"
              placeholder="e.g. Aria Carter"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full bg-[#F5F3EF] rounded-xl py-2.5 px-3 text-xs text-[#1C1A17] border border-transparent focus:border-[#4A5D4E] focus:bg-white outline-none transition-all placeholder-stone-400 font-medium"
            />
          </div>

          {/* Email Address (Pre-filled read-only) */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              disabled
              value={firebaseUser?.email || ''}
              className="w-full bg-stone-100 rounded-xl py-2.5 px-3 text-xs text-stone-400 border border-transparent outline-none font-medium cursor-not-allowed"
            />
          </div>

          {/* Role Selection Dropdown */}
          <div className="flex flex-col gap-1">
            <label htmlFor="role" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Select Your Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              required
              className="w-full bg-[#F5F3EF] rounded-xl py-2.5 px-3 text-xs text-[#1C1A17] border border-transparent focus:border-[#4A5D4E] focus:bg-white outline-none transition-all font-medium cursor-pointer"
            >
              <option value="" disabled>Select your role</option>
              <option value="normal">Normal Member / Pet Parent</option>
              <option value="feeder">Feeder / Community Caretaker</option>
              <option value="rescuer">Rescuer / Welfare Activist</option>
              <option value="volunteer">Volunteer</option>
              <option value="paravet">Paravet / First Aid Provider</option>
              <option value="adopter">Foster / Adopter</option>
            </select>
            {(role === 'rescuer' || role === 'feeder' || role === 'paravet') && (
              <p className="text-[10.5px] text-[#A25F2A] font-semibold bg-[#FDF6F0] border border-[#F5E1D2] rounded-xl p-3 mt-1.5 leading-relaxed animate-fadeIn">
                ✨ Thank you for serving your community! Your profile will be listed in Mohalla Circle so nearby neighbors can reach out for emergency assistance.
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div className="flex flex-col gap-1">
            <label htmlFor="phone" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Phone Number</label>
            <input
              type="tel"
              id="phone"
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full bg-[#F5F3EF] rounded-xl py-2.5 px-3 text-xs text-[#1C1A17] border border-transparent focus:border-[#4A5D4E] focus:bg-white outline-none transition-all placeholder-stone-400 font-medium"
            />
          </div>

          {/* Home Address */}
          <div className="flex flex-col gap-1">
            <label htmlFor="address" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              Home Address {isDetectingLocation && <span className="text-[9px] text-[#4A5D4E] normal-case font-bold animate-pulse ml-1">(detecting...)</span>}
            </label>
            <textarea
              id="address"
              placeholder="e.g. Flat 101, Indiranagar, Bengaluru, KA"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              rows={3}
              disabled={isDetectingLocation}
              className="w-full bg-[#F5F3EF] rounded-xl py-2.5 px-3 text-xs text-[#1C1A17] border border-transparent focus:border-[#4A5D4E] focus:bg-white outline-none transition-all resize-none leading-relaxed placeholder-stone-400 font-medium disabled:opacity-60"
            />
          </div>
        </div>

        {/* Terms and Conditions Confirmation Checkbox */}
        <div className="flex items-start gap-2.5 pt-1">
          <input
            type="checkbox"
            id="onboarding-terms"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-[#2D4536] bg-[#F5F3EF] border-[#D5CEBF] rounded focus:ring-[#2D4536] cursor-pointer accent-[#2D4536]"
          />
          <label htmlFor="onboarding-terms" className="text-[11px] text-stone-600 leading-snug font-medium">
            I confirm my details and agree to the{' '}
            <button
              type="button"
              onClick={() => setIsTermsOpen(true)}
              className="text-[#2D4536] font-bold underline hover:text-[#1E2E24] cursor-pointer"
            >
              Terms &amp; Conditions
            </button>{' '}
            and{' '}
            <button
              type="button"
              onClick={() => setIsPrivacyOpen(true)}
              className="text-[#2D4536] font-bold underline hover:text-[#1E2E24] cursor-pointer"
            >
              Privacy Policy
            </button>{' '}
            (v1.0).
          </label>
        </div>

        {/* Submit Details Button */}
        <button
          type="submit"
          disabled={isSaving || !acceptedTerms}
          className="w-full py-3.5 bg-[#2A3E31] hover:bg-[#1E2E24] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-[#2A3E31]/10 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSaving ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving Profile...
            </>
          ) : (
            'Complete Registration'
          )}
        </button>
      </form>

      {/* Terms & Conditions Modal */}
      <TermsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        showAcceptButton={!acceptedTerms}
        onAccept={() => setAcceptedTerms(true)}
      />

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </div>
  );
}
