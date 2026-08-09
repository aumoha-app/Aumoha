'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';
import { DogIcon, CatIcon, BirdIcon, FishIcon, RabbitIcon, ReptileIcon, PawIcon } from './icons/PetIcons';
import { API_BASE } from '../lib/api';
import CallSessionButton from './CallSessionButton';
import AgoraCallModal from './AgoraCallModal';

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
    profilePic: '',
    role: 'normal'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom Confirmation Dialog States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
  } | null>(null);

  const openConfirmation = (config: any) => {
    setConfirmConfig(config);
    setIsConfirmOpen(true);
  };

  const closeConfirmation = () => {
    setIsConfirmOpen(false);
    setConfirmConfig(null);
  };

  // Pet management states
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [isPetSaving, setIsPetSaving] = useState(false);
  const [petError, setPetError] = useState<string | null>(null);
  const petFileInputRef = useRef<HTMLInputElement>(null);
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

  const getPetIcon = (type: string, sizeClass = "w-6 h-6 text-black") => {
    switch (type.toLowerCase()) {
      case 'dog': return <DogIcon className={sizeClass} />;
      case 'cat': return <CatIcon className={sizeClass} />;
      case 'bird': return <BirdIcon className={sizeClass} />;
      case 'fish': return <FishIcon className={sizeClass} />;
      case 'rabbit': return <RabbitIcon className={sizeClass} />;
      case 'reptile': return <ReptileIcon className={sizeClass} />;
      default: return <PawIcon className={sizeClass} />;
    }
  };

  const handleOpenPetModal = (pet?: any) => {
    setPetError(null);
    if (pet) {
      setSelectedPet(pet);
      setPetForm({
        name: pet.name || '',
        type: pet.type || 'Dog',
        photo: pet.photo || '',
        breed: pet.breed || '',
        age: pet.age,
        gender: pet.gender || 'unknown',
        notes: pet.notes || ''
      });
    } else {
      setSelectedPet(null);
      setPetForm({
        name: '',
        type: 'Dog',
        photo: '',
        breed: '',
        age: undefined,
        gender: 'unknown',
        notes: ''
      });
    }
    setIsPetModalOpen(true);
  };

  const handleClosePetModal = () => {
    setIsPetModalOpen(false);
    setSelectedPet(null);
    setPetError(null);
  };

  const handlePetFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, (base64) => {
        setPetForm(prev => ({ ...prev, photo: base64 }));
      });
    }
  };

  const handleSavePet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petForm.name.trim() || !petForm.type) {
      setPetError('Name and Pet Type are required.');
      return;
    }
    setIsPetSaving(true);
    setPetError(null);

    try {
      const response = await fetch(`${API_BASE}/auth/profile/pets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          _id: selectedPet?._id,
          name: petForm.name,
          type: petForm.type,
          photo: petForm.photo,
          breed: petForm.breed,
          age: petForm.age,
          gender: petForm.gender,
          notes: petForm.notes
        }),
      });

      if (response.ok) {
        await syncProfile();
        setIsPetModalOpen(false);
      } else {
        const errData = await response.json();
        setPetError(errData.message || 'Failed to save pet details.');
      }
    } catch (err) {
      console.error(err);
      setPetError('Network error. Unable to save pet profile.');
    } finally {
      setIsPetSaving(false);
    }
  };

  const handleDeletePet = (e: React.MouseEvent, petId: string) => {
    e.stopPropagation();

    const pet = user?.pets?.find(p => p._id === petId);
    const petName = pet ? pet.name : 'this pet';

    openConfirmation({
      title: 'Remove Pet?',
      message: `Are you sure you want to delete ${petName}'s profile? This action cannot be undone.`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        setIsPetSaving(true);
        try {
          const response = await fetch(`${API_BASE}/auth/profile/pets/${petId}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            }
          });

          if (response.ok) {
            await syncProfile();
          } else {
            const errData = await response.json();
            setError(errData.message || 'Failed to delete pet.');
          }
        } catch (err) {
          console.error(err);
          setError('Network error. Unable to delete pet profile.');
        } finally {
          setIsPetSaving(false);
        }
      }
    });
  };

  // Real activity & report stats states
  const [userSosCount, setUserSosCount] = useState<number>(0);
  const [userApptCount, setUserApptCount] = useState<number>(0);

  // Check if current user is admin whitelisted & fetch real user activity counts
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
          setIsAdmin(data.isAdmin);
        }
      })
      .catch(err => console.error('Failed to retrieve admin configuration in Profile:', err));

      // Fetch real SOS reports count for user
      fetch(`${API_BASE}/sos/my`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.reports) {
          setUserSosCount(data.reports.length);
        }
      })
      .catch(() => {});

      // Fetch real booked appointments count for user
      fetch(`${API_BASE}/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.appointments) {
          setUserApptCount(data.appointments.length);
        }
      })
      .catch(() => {});
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
        profilePic: user.profilePic || '',
        role: user.role || 'normal'
      });
    }
  }, [user]);

  const handleEditToggle = () => {
    if (isEditing && user) {
      setEditedProfile({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        profilePic: user.profilePic || '',
        role: user.role || 'normal'
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
      const response = await fetch(`${API_BASE}/auth/profile`, {
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
          role: editedProfile.role,
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
        if (!isEditing) {
          saveProfileDirectly(base64);
        }
      });
    }
  };

  const saveProfileDirectly = async (base64Pic: string) => {
    if (!user) return;
    try {
      await fetch(`${API_BASE}/auth/profile`, {
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
          role: user.role,
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

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Compute display stats dynamically based on real user data with defaults
  const rescueCount = user?.rescueCount || 12;
  const rescueResponses = user?.rescueCount ? Math.max(user.rescueCount, 4) : 4;
  const eventsJoined = user?.pets?.length ? user.pets.length + 2 : 3;
  const volunteerHours = rescueCount * 4 || 48;

  // Format address location nicely
  const displayLocation = user?.address ? user.address : 'Bhubaneswar, Odisha';

  if (!user) {
    return (
      <main className="w-full max-w-2xl mx-auto bg-[#FDFBF7] border border-[#EBE3D5] rounded-3xl p-4 md:p-8 flex flex-col gap-6 shadow-sm select-none animate-fadeIn">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-stone-200/80 animate-pulse" />
            <div className="h-6 w-32 bg-stone-200/80 rounded-lg animate-pulse" />
          </div>
          <div className="h-8 w-8 rounded-full bg-stone-200/80 animate-pulse" />
        </div>

        {/* Hero Card Skeleton */}
        <div className="w-full h-72 rounded-3xl bg-stone-200/80 animate-pulse" />

        {/* Pets Skeleton */}
        <div className="h-28 w-full rounded-2xl bg-stone-200/60 animate-pulse" />
      </main>
    );
  }

  return (
    <main className="w-full max-w-2xl mx-auto bg-[#FDFBF7] border border-[#EBE3D5] rounded-3xl p-4 md:p-8 flex flex-col gap-6 shadow-sm transition-all duration-300">

      {/* 1. TOP HEADER BAR (UX matching reference screenshot) */}
      <header className="flex items-center justify-between w-full select-none px-1">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => window.history.back()}
            className="w-9 h-9 rounded-full bg-[#FAF6F0] hover:bg-[#F5EFE6] border border-[#EBE3D5] flex items-center justify-center text-[#1C1A17] transition-all cursor-pointer"
            title="Go Back"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h1 className="font-serif text-2xl md:text-3xl text-[#1C1A17] font-semibold tracking-tight">My Profile</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Action Buttons */}
          {(user?.role === 'doctor' || user?.role === 'expert') && (
            <Link
              href="/provider"
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-emerald-200 bg-[#2D4536] hover:bg-[#1E2E24] text-white transition-all duration-200 cursor-pointer whitespace-nowrap shadow-xs flex items-center gap-1.5"
            >
              <span>🩺 Dashboard</span>
            </Link>
          )}
          {(user?.role === 'admin' || isAdmin) && onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-transparent bg-[#C86D51] hover:bg-[#B55C41] text-[#FDFBF7] transition-all duration-200 cursor-pointer whitespace-nowrap shadow-xs"
            >
              Admin
            </button>
          )}
          
          <button
            onClick={() => signOut()}
            className="w-9 h-9 rounded-full border border-red-200 bg-white text-red-500 hover:bg-red-50 transition-all flex items-center justify-center cursor-pointer shadow-xs"
            title="Sign Out"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-[#FDEDEC] border border-[#F5C2C2] text-[#C0392B] rounded-xl px-4 py-3 text-xs leading-relaxed font-semibold">
          {error}
        </div>
      )}

      {/* 2. HERO PROFILE HEADER CARD (Artistic Textured Background matching reference style) */}
      <div 
        className="w-full bg-[#1C1A17] text-[#FDFBF7] rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden flex flex-col items-center text-center border border-white/10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `linear-gradient(to bottom, rgba(28, 26, 23, 0.65), rgba(18, 16, 14, 0.85)), url('/profile_hero_bg.png')` }}
      >
        
        {/* Subtle Warm Glow Texture Accent */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#C86D51]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#E5A96A]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Profile Avatar Container with Floating Edit Badge */}
        <div className="relative mb-4 group">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-2 border-[#E5A96A]/60 bg-gradient-to-br from-[#4A5D4E] to-[#1C1A17] flex items-center justify-center text-[#FDFBF7] font-serif text-3xl md:text-4xl shadow-lg relative">
            {(isEditing ? editedProfile.profilePic : user.profilePic) ? (
              <img
                src={isEditing ? editedProfile.profilePic : user.profilePic}
                alt={user.fullName}
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

          {/* Edit Pencil Badge Button */}
          <button
            type="button"
            onClick={triggerFileInput}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#C86D51] hover:bg-[#B55C41] text-white flex items-center justify-center border-2 border-[#1C1A17] shadow-md transition-transform duration-200 active:scale-95 cursor-pointer"
            title="Change Profile Photo"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>

        {/* Name and Role Pill */}
        <div className="flex items-center justify-center gap-2.5 flex-wrap">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-[#FDFBF7]">
            {user.fullName}
          </h2>
          {user?.role && user.role !== 'normal' && user.role !== 'user' && (
            <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#C86D51]/30 border border-[#C86D51]/60 text-[#F5C2B3] shadow-xs select-none">
              {user.role}
            </span>
          )}
        </div>

        {/* Location Subtitle */}
        <p className="text-xs text-stone-300/80 font-medium mt-1 flex items-center gap-1">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#C86D51]">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{displayLocation}</span>
        </p>

        {/* 4-COLUMN STAT BAR (Real user rescue, report, consultation & pet metrics; visible for non-normal roles) */}
        {user?.role && user.role !== 'normal' && user.role !== 'user' && (
          <div className="w-full border-t border-white/10 pt-5 mt-6 grid grid-cols-4 divide-x divide-white/10 text-center select-none animate-fadeIn">
            <div className="flex flex-col items-center px-1">
              <span className="font-sans text-lg md:text-2xl font-black text-white leading-none">{userSosCount}</span>
              <span className="font-serif text-[10px] md:text-xs text-stone-300 font-medium mt-1 leading-tight">Reports Made</span>
            </div>

            <div className="flex flex-col items-center px-1">
              <span className="font-sans text-lg md:text-2xl font-black text-white leading-none">{user.rescueCount || 0}</span>
              <span className="font-serif text-[10px] md:text-xs text-stone-300 font-medium mt-1 leading-tight">Rescues Done</span>
            </div>

            <div className="flex flex-col items-center px-1">
              <span className="font-sans text-lg md:text-2xl font-black text-white leading-none">{userApptCount}</span>
              <span className="font-serif text-[10px] md:text-xs text-stone-300 font-medium mt-1 leading-tight">Consultations</span>
            </div>

            <div className="flex flex-col items-center px-1">
              <span className="font-sans text-lg md:text-2xl font-black text-white leading-none">{user.pets?.length || 0}</span>
              <span className="font-serif text-[10px] md:text-xs text-stone-300 font-medium mt-1 leading-tight">My Pets</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. EDIT PROFILE CARD BUTTON */}
      <button 
        type="button"
        onClick={() => handleEditToggle()}
        className="w-full bg-[#FAF4EC] hover:bg-[#F5ECE0] border border-[#F0E4D4] hover:border-[#C86D51]/40 rounded-2xl p-4 flex items-center justify-between shadow-xs transition-all duration-200 cursor-pointer select-none group text-left"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#C86D51]/15 text-[#C86D51] border border-[#C86D51]/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1C1A17] font-serif group-hover:text-[#C86D51] transition-colors">
              Edit Profile
            </h3>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              {user?.role && user.role !== 'normal' && user.role !== 'user'
                ? `Verified ${user.role.charAt(0).toUpperCase() + user.role.slice(1)} • Update contact info & location`
                : 'Update your name, contact details & home address'}
            </p>
          </div>
        </div>
        
        <div className="px-3.5 py-1.5 bg-[#4A5D4E] group-hover:bg-[#3A4D3E] text-[#FDFBF7] text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0">
          <span>{isEditing ? 'Cancel' : 'Edit'}</span>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </button>

      {/* EDIT PROFILE FORM DRAWER (Toggled when isEditing is true) */}
      {isEditing && (
        <form onSubmit={handleSave} className="bg-white border border-[#EBE3D5] rounded-3xl p-6 shadow-md flex flex-col gap-5 animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-center border-b border-[#F5F2EC] pb-3">
            <h3 className="font-serif text-lg text-[#1C1A17] font-bold">Edit Profile Credentials</h3>
            <button
              type="button"
              onClick={handleEditToggle}
              className="text-xs font-semibold text-stone-400 hover:text-stone-600"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="flex flex-col gap-1">
              <label htmlFor="role" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Role</label>
              <select
                id="role"
                name="role"
                value={editedProfile.role}
                onChange={(e) => setEditedProfile(prev => ({ ...prev, role: e.target.value as any }))}
                required
                className="w-full bg-[#F5F3EF] rounded-xl py-2 px-3 text-xs text-[#1C1A17] border border-transparent focus:border-[#4A5D4E] focus:bg-white outline-none transition-all cursor-pointer font-medium"
              >
                <option value="normal">Normal Member</option>
                <option value="rescuer">Certified Rescuer</option>
                <option value="ngo">Animal Welfare NGO</option>
                <option value="doctor">Veterinarian</option>
                <option value="volunteer">Volunteer</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="address" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Home Address / Location</label>
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

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleEditToggle}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-[#2A3E31] hover:bg-[#1E2E24] active:scale-[0.98] disabled:opacity-75 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
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
        </form>
      )}

      {/* 4. "MY ANIMALS" SECTION (Horizontal scroll matching reference screenshot) */}
      <section className="flex flex-col gap-3.5 select-none pt-2">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl text-[#1C1A17] font-semibold tracking-tight">My Animals</h3>
          <button
            type="button"
            onClick={() => handleOpenPetModal()}
            className="text-xs font-bold text-[#4A5D4E] hover:text-[#2A3E31] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Add Pet</span>
            <span className="text-base font-normal leading-none">+</span>
          </button>
        </div>

        {/* Horizontal Scrollable Pet Cards Row */}
        <div className="flex gap-3.5 overflow-x-auto pb-2 pt-1 scrollbar-none items-stretch">
          {user.pets && user.pets.map((pet) => (
            <div
              key={pet._id}
              onClick={() => handleOpenPetModal(pet)}
              className="bg-white hover:bg-[#FCFAF7] border border-[#EBE3D5] hover:border-[#4A5D4E]/40 rounded-2xl p-3.5 flex flex-col items-center text-center shadow-xs transition-all duration-200 shrink-0 w-36 sm:w-40 relative group cursor-pointer"
            >
              {/* Pet Photo */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#FAF6F0] border border-[#EBE3D5] flex items-center justify-center shrink-0 shadow-xs relative mb-2.5">
                {pet.photo ? (
                  <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  getPetIcon(pet.type, "w-9 h-9 text-[#1C1A17]")
                )}
              </div>

              {/* Pet Info */}
              <h4 className="font-serif text-[#1C1A17] font-bold text-sm truncate w-full">{pet.name}</h4>
              <p className="text-[11px] text-stone-500 font-medium truncate w-full mt-0.5">
                {pet.type} {pet.age !== undefined && pet.age !== null && `• ${pet.age} yrs`}
              </p>

              {/* Delete Button on Hover */}
              <button
                type="button"
                onClick={(e) => handleDeletePet(e, pet._id!)}
                className="absolute top-2 right-2 p-1 rounded-lg bg-white border border-[#EBE3D5] text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all cursor-pointer shadow-xs"
                title="Remove Pet"
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          ))}

          {/* Quick Add Pet Card Button (Dashed UI card from Reference image) */}
          <div
            onClick={() => handleOpenPetModal()}
            className="bg-[#FAF6F0] hover:bg-[#F5EFE6] border-2 border-dashed border-[#DED4C5] hover:border-[#4A5D4E] rounded-2xl p-3.5 flex flex-col items-center justify-center text-center transition-all duration-200 shrink-0 w-36 sm:w-40 cursor-pointer min-h-[148px] group"
          >
            <div className="w-10 h-10 rounded-full bg-white border border-[#EBE3D5] flex items-center justify-center text-[#4A5D4E] mb-2 group-hover:scale-105 transition-transform shadow-xs">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span className="font-serif text-xs font-bold text-[#1C1A17]">Add Pet</span>
          </div>
        </div>
      </section>

      {/* 5. QUICK SHORTCUTS SECTION (Real Functional App Routes) */}
      <section className="flex flex-col gap-3.5 select-none pt-2">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl text-[#1C1A17] font-semibold tracking-tight">Quick Shortcuts</h3>
          <span className="text-xs font-semibold text-stone-400">Direct Access</span>
        </div>

        {/* Real Shortcut Link Cards */}
        <div className="bg-white border border-[#EBE3D5] rounded-2xl p-2 flex flex-col divide-y divide-[#F5F2EC] shadow-xs">
          
          {/* Shortcut 1: Book Vet Consultation */}
          <Link 
            href="/vet-consult"
            className="p-3 hover:bg-[#FCFAF7] rounded-xl flex items-center justify-between gap-3 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-[#2D4536] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-[#1C1A17] group-hover:text-[#2D4536] transition-colors truncate">Book Vet Consultation</h4>
                <p className="text-[11px] text-stone-500 font-medium truncate mt-0.5">Video consult or clinic visit with top specialists</p>
              </div>
            </div>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400 group-hover:translate-x-0.5 transition-transform shrink-0">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>

          {/* Shortcut 2: Report SOS Emergency */}
          <Link 
            href="/sos"
            className="p-3 hover:bg-[#FCFAF7] rounded-xl flex items-center justify-between gap-3 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FAF2EE] border border-[#F5DFD8] text-[#C86D51] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <PawIcon className="w-5 h-5 text-[#C86D51]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-[#1C1A17] group-hover:text-[#C86D51] transition-colors truncate">Report SOS Emergency</h4>
                <p className="text-[11px] text-stone-500 font-medium truncate mt-0.5">Dispatch emergency rescue for animals in distress</p>
              </div>
            </div>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400 group-hover:translate-x-0.5 transition-transform shrink-0">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>

          {/* Shortcut 3: Mohalla Circle Network */}
          <Link 
            href="/circle"
            className="p-3 hover:bg-[#FCFAF7] rounded-xl flex items-center justify-between gap-3 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FAF6F0] border border-[#EBE3D5] text-[#4A5D4E] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-[#1C1A17] group-hover:text-[#4A5D4E] transition-colors truncate">Mohalla Circle Network</h4>
                <p className="text-[11px] text-stone-500 font-medium truncate mt-0.5">Connect with local feeders, rescuers & community updates</p>
              </div>
            </div>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400 group-hover:translate-x-0.5 transition-transform shrink-0">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>

          {/* Shortcut 4: Pet Care & Supplies Store */}
          <Link 
            href="/marketplace"
            className="p-3 hover:bg-[#FCFAF7] rounded-xl flex items-center justify-between gap-3 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-[#1C1A17] group-hover:text-purple-700 transition-colors truncate">Pet Care & Supplies Store</h4>
                <p className="text-[11px] text-stone-500 font-medium truncate mt-0.5">Browse food, health essentials & accessories</p>
              </div>
            </div>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400 group-hover:translate-x-0.5 transition-transform shrink-0">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>

        </div>
      </section>

      {/* 6. MOHALLA QUOTE BANNER CARD (Terracotta Warm Tint & Floral/Paw SVG Accent) */}
      <div className="w-full bg-gradient-to-r from-[#FAF2EE] via-[#FAF4EC] to-[#F5ECE0] border border-[#F0DED2] rounded-2xl p-5 shadow-xs relative overflow-hidden flex items-center justify-between select-none">
        <div className="flex gap-3 items-start pr-8 z-10">
          <span className="font-serif text-4xl text-[#C86D51] leading-none opacity-80 select-none">“</span>
          <p className="font-serif text-sm md:text-base text-[#1C1A17] font-semibold leading-snug italic mt-1">
            Small acts in our mohalla,<br />
            create a kinder world for animals.
          </p>
        </div>

        {/* Botanical / Paw Accent SVG on Right */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20 text-[#C86D51] pointer-events-none">
          <svg viewBox="0 0 100 100" width="80" height="80" fill="currentColor">
            <path d="M50,15 C55,30 65,35 80,40 C65,45 55,50 50,65 C45,50 35,45 20,40 C35,35 45,30 50,15 Z" />
            <circle cx="75" cy="70" r="8" />
            <circle cx="25" cy="70" r="6" />
          </svg>
        </div>
      </div>

      {/* 7. BOOKING HISTORY & MEDICAL / PRESCRIPTION HUB */}
      <section className="mt-2 border-t border-[#EBE3D5] pt-6 flex flex-col gap-4 select-none">
        <div>
          <h3 className="font-serif text-xl text-[#1C1A17] font-semibold tracking-tight">Booking History & Prescriptions</h3>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            View consultation logs, upload past medical reports, and retrieve official prescriptions
          </p>
        </div>

        <ProfileBookingHistory token={token} API_BASE={API_BASE} />
      </section>

      {/* 8. PET MODAL OVERLAY */}
      {isPetModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1C1A17]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#F0EBE1] shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            <header className="flex justify-between items-start">
              <div>
                <h3 className="font-serif text-xl text-[#1C1A17] font-bold tracking-tight">
                  {selectedPet ? 'Edit Pet Profile' : 'Add New Pet'}
                </h3>
                <p className="text-xs text-stone-400 font-medium mt-0.5">
                  {selectedPet ? 'Modify details of your companion' : 'Introduce a new member of your pet family'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClosePetModal}
                className="p-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer flex items-center justify-center"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            {petError && (
              <div className="bg-[#FDEDEC] border border-[#F5C2C2] text-[#C0392B] rounded-xl px-4 py-2.5 text-xs font-semibold">
                {petError}
              </div>
            )}

            <form onSubmit={handleSavePet} className="flex flex-col gap-4">
              <div className="flex flex-col items-center gap-2 select-none">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-[#EBE3D5] bg-[#F5F2EC] flex items-center justify-center shadow-inner relative">
                  {petForm.photo ? (
                    <img src={petForm.photo} alt="Pet Preview" className="w-full h-full object-cover" />
                  ) : (
                    getPetIcon(petForm.type, "w-10 h-10 text-black")
                  )}
                </div>

                <input
                  type="file"
                  ref={petFileInputRef}
                  onChange={handlePetFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => petFileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-white hover:bg-stone-50 border border-[#EBE3D5] text-[#1C1A17] font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                  >
                    Upload Photo
                  </button>
                  {petForm.photo && (
                    <button
                      type="button"
                      onClick={() => setPetForm(prev => ({ ...prev, photo: '' }))}
                      className="px-2.5 py-1 bg-white hover:bg-red-50 hover:border-red-200 border border-[#EBE3D5] text-red-500 font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="pet-name" className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Pet Name *</label>
                  <input
                    type="text"
                    id="pet-name"
                    value={petForm.name}
                    onChange={(e) => setPetForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="e.g. Max"
                    className="w-full bg-[#F5F3EF] rounded-xl py-2 px-3 text-xs text-[#1C1A17] border border-transparent focus:border-[#4A5D4E] focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="pet-type" className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Pet Type *</label>
                  <select
                    id="pet-type"
                    value={petForm.type}
                    onChange={(e) => setPetForm(prev => ({ ...prev, type: e.target.value }))}
                    required
                    className="w-full bg-[#F5F3EF] rounded-xl py-2 px-3 text-xs text-[#1C1A17] border border-transparent focus:border-[#4A5D4E] focus:bg-white outline-none transition-all cursor-pointer font-medium"
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

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="pet-breed" className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Breed</label>
                  <input
                    type="text"
                    id="pet-breed"
                    value={petForm.breed}
                    onChange={(e) => setPetForm(prev => ({ ...prev, breed: e.target.value }))}
                    placeholder="e.g. Beagle, Persian"
                    className="w-full bg-[#F5F3EF] rounded-xl py-2 px-3 text-xs text-[#1C1A17] border border-transparent focus:border-[#4A5D4E] focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="pet-age" className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Age (Years)</label>
                  <input
                    type="number"
                    id="pet-age"
                    min="0"
                    max="100"
                    step="1"
                    value={petForm.age === undefined ? '' : petForm.age}
                    onChange={(e) => setPetForm(prev => ({ ...prev, age: e.target.value === '' ? undefined : Number(e.target.value) }))}
                    placeholder="e.g. 3"
                    className="w-full bg-[#F5F3EF] rounded-xl py-2 px-3 text-xs text-[#1C1A17] border border-transparent focus:border-[#4A5D4E] focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Gender</span>
                <div className="grid grid-cols-3 gap-2">
                  {['male', 'female', 'unknown'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setPetForm(prev => ({ ...prev, gender: g as any }))}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer capitalize ${
                        petForm.gender === g
                          ? 'border-[#4A5D4E] bg-[#4A5D4E] text-[#FDFBF7]'
                          : 'border-stone-200 bg-white text-stone-500 hover:bg-stone-50'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="pet-notes" className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Notes / Medical Bio</label>
                <textarea
                  id="pet-notes"
                  rows={2}
                  value={petForm.notes}
                  onChange={(e) => setPetForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g. Friendly, allergic to chicken, vaccine up to date"
                  className="w-full bg-[#F5F3EF] rounded-xl py-2 px-3 text-xs text-[#1C1A17] border border-transparent focus:border-[#4A5D4E] focus:bg-white outline-none transition-all resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={handleClosePetModal}
                  disabled={isPetSaving}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPetSaving}
                  className="px-5 py-2 bg-[#2A3E31] hover:bg-[#1E2E24] active:scale-[0.98] disabled:opacity-75 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isPetSaving ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    selectedPet ? 'Save Changes' : 'Add Pet'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. CUSTOM CONFIRMATION DIALOG */}
      {isConfirmOpen && confirmConfig && (
        <div className="fixed inset-0 z-50 bg-[#1C1A17]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-[#F0EBE1] shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col gap-1 text-center select-none">
              <h4 className="font-serif text-lg text-[#1C1A17] font-semibold">{confirmConfig.title}</h4>
              <p className="text-xs text-stone-400 font-medium leading-relaxed mt-1">{confirmConfig.message}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={closeConfirmation}
                className="py-2.5 px-4 text-xs font-bold rounded-xl border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 transition-colors cursor-pointer text-center"
              >
                {confirmConfig.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmConfig.onConfirm();
                  closeConfirmation();
                }}
                className={`py-2.5 px-4 text-xs font-bold rounded-xl text-white shadow-xs transition-all active:scale-[0.98] cursor-pointer text-center ${
                  confirmConfig.isDestructive 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-[#4A5D4E] hover:bg-[#3A4D3E]'
                }`}
              >
                {confirmConfig.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENT: ProfileBookingHistory
// ─────────────────────────────────────────────────────────────────────────────
function ProfileBookingHistory({ token, API_BASE }: { token: string | null; API_BASE: string }) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [activeCallAppt, setActiveCallAppt] = useState<any | null>(null);

  const fetchBookings = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setAppointments(data.appointments || []);
      } else {
        setError(data.message || 'Failed to fetch bookings.');
      }
    } catch {
      setError('Network error. Failed to retrieve booking history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [token]);

  const handleDocumentUpload = (apptId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadingId(apptId);
      const reader = new FileReader();
      reader.onload = async (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        try {
          const res = await fetch(`${API_BASE}/appointments/${apptId}/medical-document`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ medicalDocument: base64 })
          });
          const data = await res.json();
          if (res.ok && data.status === 'success') {
            setAppointments(prev => prev.map(a => a._id === apptId ? { ...a, medicalDocument: base64 } : a));
          } else {
            alert(data.message || 'Failed to upload medical document.');
          }
        } catch {
          alert('Network error. Failed to upload medical document.');
        } finally {
          setUploadingId(null);
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleDownload = (base64String: string, filename: string) => {
    const link = document.createElement('a');
    link.href = base64String;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div className="text-stone-400 text-xs py-4 text-center">Loading booking history...</div>;
  }

  if (error || appointments.length === 0) {
    return (
      <div className="bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl p-6 text-center">
        <p className="text-xs text-stone-400 font-medium">{error || 'No consultations booked yet.'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {appointments.map((appt) => (
        <div key={appt._id} className="bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-sm font-semibold text-[#1C1A17]">{appt.vetName}</span>
                <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">
                  {appt.mode}
                </span>
              </div>
              <p className="text-[10px] text-stone-400 font-medium mt-0.5">{appt.date} • {appt.time}</p>
              <p className="text-[10px] text-stone-600 font-bold mt-1">Pet: {appt.petName}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-extrabold text-[#2D4536]">₹{appt.fee}</span>
              <p className="text-[9px] text-stone-400 mt-1 uppercase font-bold tracking-wider">{appt.status}</p>
            </div>
          </div>

          <div className="border-t border-stone-100 pt-3 flex flex-wrap gap-2 justify-between items-center">
            {/* Client Medical Reports */}
            <div className="flex items-center gap-1.5">
              {appt.medicalDocument ? (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">
                    ✓ Medical Info Uploaded
                  </span>
                  <button
                    onClick={() => handleDownload(appt.medicalDocument, `${appt.petName}_medical_history.jpg`)}
                    className="p-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 text-[10px] font-extrabold cursor-pointer"
                    title="Download Report"
                  >
                    ⬇
                  </button>
                  <button
                    onClick={() => handleDocumentUpload(appt._id)}
                    className="p-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-500 text-[10px] cursor-pointer"
                    title="Replace Report"
                  >
                    ✎ Change
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleDocumentUpload(appt._id)}
                  disabled={uploadingId === appt._id}
                  className="px-2.5 py-1 bg-white hover:bg-[#FAF6F0] border border-[#EBE3D5] text-[#1C1A17] font-bold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  {uploadingId === appt._id ? 'Uploading...' : '+ Upload Medical History'}
                </button>
              )}
            </div>

            {/* Prescription Retrieval */}
            <div>
              {appt.prescription ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#C86D51] font-extrabold bg-[#FAF2EE] border border-[#F5DFD8] px-2 py-1 rounded-lg">
                    💊 Prescription Ready
                  </span>
                  <button
                    onClick={() => handleDownload(appt.prescription, `${appt.petName}_prescription.jpg`)}
                    className="px-2.5 py-1 bg-[#2D4536] hover:bg-[#1E2E24] text-white font-bold text-[10px] rounded-lg cursor-pointer"
                  >
                    Download Prescription
                  </button>
                </div>
              ) : (
                <span className="text-[10px] text-stone-400 font-semibold italic">Prescription pending</span>
              )}
            </div>
          </div>

          {appt.prescriptionNotes && (
            <div className="bg-[#FAF8F5] border-l-2 border-[#2D4536] p-2 rounded text-[10.5px] text-stone-600 italic">
              <strong>Advice:</strong> "{appt.prescriptionNotes}"
            </div>
          )}

          {appt.mode === 'tele-consult' && appt.status !== 'cancelled' && (
            <CallSessionButton
              appointment={appt}
              onJoinCall={(a) => setActiveCallAppt(a)}
              className="mt-2"
            />
          )}
        </div>
      ))}

      {activeCallAppt && (
        <AgoraCallModal
          channelName={activeCallAppt.bookingId || activeCallAppt._id}
          appointment={activeCallAppt}
          onClose={() => setActiveCallAppt(null)}
        />
      )}
    </div>
  );
}
