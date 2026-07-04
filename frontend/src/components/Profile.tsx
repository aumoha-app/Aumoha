'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';

interface ProfileProps {
  onOpenAdmin?: () => void;
}

export default function Profile({ onOpenAdmin }: ProfileProps) {
  const { user, token, signOut, syncProfile } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    profilePic: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if current user is admin whitelisted
  useEffect(() => {
    if (token) {
      fetch('http://localhost:5001/api/auth/admin-config', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setIsAdmin(data.isAdmin);
        }
      })
      .catch(err => console.error('Failed to retrieve admin configuration in Profile:', err));
    } else {
      setIsAdmin(false);
    }
  }, [token]);

  // Initialize editedProfile when user is fetched
  useEffect(() => {
    if (user) {
      setEditedProfile({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        profilePic: user.profilePic || ''
      });
    }
  }, [user]);

  const handleEditToggle = () => {
    if (isEditing && user) {
      // Cancel edit: reset editedProfile to current profile
      setEditedProfile({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        profilePic: user.profilePic || ''
      });
    }
    setError(null);
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5001/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: editedProfile.fullName,
          phone: editedProfile.phone,
          address: editedProfile.address,
          profilePic: editedProfile.profilePic,
          email: editedProfile.email,
        }),
      });

      if (response.ok) {
        await syncProfile();
        setIsEditing(false);
      } else {
        const errData = await response.json();
        setError(errData.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Unable to save changes to the server.');
    } finally {
      setIsSaving(false);
    }
  };

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
        setEditedProfile(prev => ({ ...prev, profilePic: base64 }));

        // If not editing, save immediately
        if (!isEditing) {
          saveProfileDirectly(base64);
        }
      });
    }
  };

  const saveProfileDirectly = async (base64Pic: string) => {
    if (!user) return;
    try {
      await fetch('http://localhost:5001/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: user.fullName,
          phone: user.phone,
          address: user.address,
          profilePic: base64Pic,
          email: user.email,
        }),
      });
      await syncProfile();
    } catch (err) {
      console.error('Error auto-saving profile pic:', err);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Get initials for profile picture fallback
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (!user) {
    return (
      <main className="w-full max-w-2xl mx-auto bg-white rounded-3xl p-6 text-center select-none">
        <p className="text-xs text-stone-400 font-semibold">No profile data found.</p>
      </main>
    );
  }

  return (
    <main className="w-full max-w-2xl mx-auto bg-white rounded-3xl p-4 md:p-8 flex flex-col gap-6 shadow-sm transition-all duration-300">

      {/* 1. HEADER: Title, Edit & Logout Buttons */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full select-none px-1">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-[#1C1A17] font-normal tracking-tight">My Profile</h1>
          <p className="text-xs text-stone-400 font-medium mt-1 leading-normal max-w-md">Manage your pet rescuer identification credentials</p>
        </div>

        <div className="flex gap-2.5 sm:self-auto self-start shrink-0">
          {isAdmin && onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-transparent bg-terracotta hover:bg-terracotta/90 text-[#FDFBF7] transition-all duration-200 cursor-pointer whitespace-nowrap shadow-sm"
            >
              Admin Panel
            </button>
          )}
          <button
            onClick={handleEditToggle}
            disabled={isSaving}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-200 cursor-pointer whitespace-nowrap ${isEditing
                ? 'border-stone-200 bg-white text-stone-500 hover:bg-stone-50'
                : 'border-[#4A5D4E] bg-[#4A5D4E] hover:bg-[#3A4D3E] text-[#FDFBF7]'
              }`}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>

          <button
            onClick={() => signOut()}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-red-200 bg-white text-red-500 hover:bg-red-50 hover:border-red-300 transition-all duration-200 cursor-pointer whitespace-nowrap"
          >
            Sign Out
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-[#FDEDEC] border border-[#F5C2C2] text-[#C0392B] rounded-xl px-4 py-3 text-xs leading-relaxed font-semibold">
          {error}
        </div>
      )}

      {/* 2. PROFILE DETAILS CARD / FORM */}
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <div className="bg-[#FCFAF7] border border-[#F0EBE1] rounded-[24px] p-5 md:p-6 flex flex-col items-center md:items-start md:flex-row gap-6 relative">

          {/* Profile Pic Container */}
          <div className="flex flex-col items-center gap-3 shrink-0 select-none">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-warmBeige bg-gradient-to-br from-terracotta to-clay flex items-center justify-center text-[#FDFBF7] font-serif text-3xl shadow-sm relative">
              {(isEditing ? editedProfile.profilePic : user.profilePic) ? (
                <img
                  src={isEditing ? editedProfile.profilePic : user.profilePic}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{getInitials(isEditing ? editedProfile.fullName : user.fullName)}</span>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {/* Action buttons (only in Edit mode) */}
            {isEditing && (
              <div className="flex flex-col gap-1.5 w-24">
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="w-full px-2 py-1 bg-white hover:bg-stone-50 border border-[#EBE3D5] text-[#1C1A17] font-bold text-[10px] rounded-lg transition-colors cursor-pointer text-center"
                >
                  Upload
                </button>
                {(editedProfile.profilePic) && (
                  <button
                    type="button"
                    onClick={() => setEditedProfile(prev => ({ ...prev, profilePic: '' }))}
                    className="w-full px-2 py-1 bg-white hover:bg-red-50 hover:border-red-200 border border-[#EBE3D5] text-red-500 hover:text-red-600 font-bold text-[10px] rounded-lg transition-colors cursor-pointer text-center"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="flex-1 w-full flex flex-col gap-4">
            {isEditing ? (
              // EDIT MODE FORM FIELDS
              <div className="grid grid-cols-1 gap-4">
                {/* Full Name */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="fullName" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={editedProfile.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-[#F5F3EF] rounded-xl py-2 px-3 text-xs text-[#1C1A17] border border-transparent focus:border-[#4A5D4E] focus:bg-white outline-none transition-all"
                  />
                </div>

                {/* Email & Phone grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={editedProfile.email}
                      className="w-full bg-stone-100 rounded-xl py-2 px-3 text-xs text-stone-400 border border-transparent outline-none cursor-not-allowed"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="phone" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={editedProfile.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-[#F5F3EF] rounded-xl py-2 px-3 text-xs text-[#1C1A17] border border-transparent focus:border-[#4A5D4E] focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Home Address */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="address" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Home Address</label>
                  <textarea
                    id="address"
                    name="address"
                    value={editedProfile.address}
                    onChange={handleInputChange}
                    required
                    rows={2}
                    className="w-full bg-[#F5F3EF] rounded-xl py-2 px-3 text-xs text-[#1C1A17] border border-transparent focus:border-[#4A5D4E] focus:bg-white outline-none transition-all resize-none leading-relaxed"
                  />
                </div>

                {/* Save button */}
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-[#2A3E31] hover:bg-[#1E2E24] active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              // READ-ONLY VIEW MODE
              <div className="flex flex-col gap-3.5 w-full">
                <div>
                  <h2 className="font-serif text-xl md:text-2xl font-normal text-[#1C1A17] leading-tight">
                    {user.fullName}
                  </h2>
                </div>

                <div className="h-px bg-[#EBE3D5] my-1" />

                {/* Informational grid items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF6F0] border border-[#EBE3D5] flex items-center justify-center text-[#4A5D4E] shrink-0">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider leading-none">Email Address</span>
                      <p className="text-xs text-[#1C1A17] font-medium truncate mt-0.5">{user.email}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF6F0] border border-[#EBE3D5] flex items-center justify-center text-[#4A5D4E] shrink-0">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider leading-none">Phone Number</span>
                      <p className="text-xs text-[#1C1A17] font-medium truncate mt-0.5">{user.phone}</p>
                    </div>
                  </div>

                  {/* Address (Spans Full Width on MD screens) */}
                  <div className="flex items-start gap-2.5 md:col-span-2">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF6F0] border border-[#EBE3D5] flex items-center justify-center text-[#4A5D4E] shrink-0">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider leading-none">Home Address</span>
                      <p className="text-xs text-[#1C1A17] font-medium leading-normal mt-0.5">{user.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </main>
  );
}
