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

  const getPetIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'dog': return '🐶';
      case 'cat': return '🐱';
      case 'bird': return '🐦';
      case 'fish': return '🐟';
      case 'rabbit': return '🐰';
      case 'reptile': return '🦎';
      default: return '🐾';
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
      const response = await fetch('http://localhost:5001/api/auth/profile/pets', {
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
    e.stopPropagation(); // Avoid triggering open modal edit

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
          const response = await fetch(`http://localhost:5001/api/auth/profile/pets/${petId}`, {
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
        profilePic: user.profilePic || '',
        role: user.role || 'normal'
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

                {/* Role selection dropdown in edit mode */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="role" className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Role</label>
                  <select
                    id="role"
                    name="role"
                    value={editedProfile.role}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, role: e.target.value as 'rescuer' | 'normal' }))}
                    required
                    className="w-full bg-[#F5F3EF] rounded-xl py-2 px-3 text-xs text-[#1C1A17] border border-transparent focus:border-[#4A5D4E] focus:bg-white outline-none transition-all cursor-pointer font-medium"
                  >
                    <option value="normal">Normal</option>
                    <option value="rescuer">Rescuer</option>
                  </select>
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
                <div className="flex items-center gap-3">
                  <h2 className="font-serif text-xl md:text-2xl font-normal text-[#1C1A17] leading-tight">
                    {user.fullName}
                  </h2>
                  {user.role === 'rescuer' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] shadow-sm select-none">
                      Rescuer
                    </span>
                  )}
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

      {/* 3. MY PETS SECTION */}
      <section className="mt-4 border-t border-[#FAF6F0] pt-6 flex flex-col gap-4 select-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl text-[#1C1A17] font-normal tracking-tight">My Pets</h3>
            <p className="text-[10px] text-stone-400 font-medium leading-normal mt-0.5 max-w-md">
              Manage your pet profiles for emergency care and boarding
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenPetModal()}
            className="px-3.5 py-1.5 bg-[#4A5D4E] hover:bg-[#3A4D3E] text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Pet
          </button>
        </div>

        {/* Pet List grid */}
        {!user.pets || user.pets.length === 0 ? (
          <div className="bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-[#FAF6F0] border border-[#EBE3D5] flex items-center justify-center text-[#4A5D4E] mx-auto mb-2.5">
              🐾
            </div>
            <p className="text-xs text-[#1C1A17] font-semibold">No pets added yet</p>
            <p className="text-[10px] text-stone-400 mt-0.5">Share details about your companions by clicking the Add Pet button.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {user.pets.map((pet) => (
              <div 
                key={pet._id}
                onClick={() => handleOpenPetModal(pet)}
                className="bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl p-4 flex gap-3.5 items-center hover:shadow-md hover:border-[#4A5D4E]/30 transition-all duration-300 cursor-pointer relative group"
              >
                {/* Pet Photo */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-terracotta/20 to-clay/20 border border-[#EBE3D5] flex items-center justify-center shrink-0 shadow-sm relative">
                  {pet.photo ? (
                    <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">{getPetIcon(pet.type)}</span>
                  )}
                </div>

                {/* Pet Details */}
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-serif text-[#1C1A17] font-semibold text-sm truncate">{pet.name}</h4>
                    <span className="inline-flex px-1.5 py-0.5 text-[8px] font-extrabold uppercase bg-[#FAF6F0] text-[#4A5D4E] border border-[#EBE3D5] rounded">
                      {pet.type}
                    </span>
                  </div>
                  {pet.breed && (
                    <p className="text-[10px] text-stone-500 font-medium truncate">{pet.breed}</p>
                  )}
                  <div className="flex gap-2 text-[10px] text-stone-400 font-medium mt-0.5">
                    {pet.age !== undefined && pet.age !== null && <span>{pet.age} {pet.age === 1 ? 'yr' : 'yrs'} old</span>}
                    {pet.age !== undefined && pet.age !== null && pet.gender !== 'unknown' && <span className="text-stone-300">|</span>}
                    {pet.gender !== 'unknown' && <span className="capitalize">{pet.gender}</span>}
                  </div>
                </div>

                {/* Delete button (stop propagation so card click doesn't trigger edit) */}
                <button
                  type="button"
                  onClick={(e) => handleDeletePet(e, pet._id!)}
                  disabled={isPetSaving}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-white border border-[#EBE3D5] text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer shadow-sm"
                  title="Remove Pet"
                >
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. PET MODAL OVERLAY */}
      {isPetModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1C1A17]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#F0EBE1] shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            <header className="flex justify-between items-start">
              <div>
                <h3 className="font-serif text-xl text-[#1C1A17] font-normal tracking-tight">
                  {selectedPet ? 'Edit Pet Profile' : 'Add New Pet'}
                </h3>
                <p className="text-[10px] text-stone-400 font-medium mt-0.5">
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
              <div className="bg-[#FDEDEC] border border-[#F5C2C2] text-[#C0392B] rounded-xl px-4 py-2.5 text-[10px] font-semibold">
                {petError}
              </div>
            )}

            <form onSubmit={handleSavePet} className="flex flex-col gap-4">
              {/* Photo Upload Container */}
              <div className="flex flex-col items-center gap-2 select-none">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-[#EBE3D5] bg-gradient-to-br from-terracotta/10 to-clay/10 flex items-center justify-center shadow-inner relative">
                  {petForm.photo ? (
                    <img src={petForm.photo} alt="Pet Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">{getPetIcon(petForm.type)}</span>
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

              {/* Name & Type Grid */}
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

              {/* Breed & Age Grid */}
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

              {/* Gender Radio Select */}
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

              {/* Notes */}
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

              {/* Submit Buttons */}
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
                  className="px-5 py-2 bg-[#2A3E31] hover:bg-[#1E2E24] active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
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

      {/* 5. CUSTOM CONFIRMATION DIALOG */}
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
                className={`py-2.5 px-4 text-xs font-bold rounded-xl text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer text-center ${
                  confirmConfig.isDestructive 
                    ? 'bg-red-600 hover:bg-red-750 shadow-sm' 
                    : 'bg-[#4A5D4E] hover:bg-[#3A4D3E] shadow-sm'
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
