'use client';

import { useState, useEffect, useRef } from 'react';
import { CommunityUpdate, MemberRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { ClockIcon } from './icons/PetIcons';
import { API_BASE } from '../lib/api';

interface MohallaUpdatesProps {
  computedUpdates: CommunityUpdate[];
  setSelectedRequest: (request: CommunityUpdate) => void;
  updateFilter: string;
  setUpdateFilter: (filter: string) => void;
  currentUser: any;
  refreshUpdates: () => void;
  triggerStartActivity?: boolean;
  onStartActivityTriggered?: () => void;
}

export default function MohallaUpdates({
  computedUpdates,
  setSelectedRequest,
  updateFilter,
  setUpdateFilter,
  currentUser,
  refreshUpdates,
  triggerStartActivity,
  onStartActivityTriggered
}: MohallaUpdatesProps) {
  const { token } = useAuth();

  // Modal States
  const [showActivityModal, setShowActivityModal] = useState<boolean>(false);

  useEffect(() => {
    if (triggerStartActivity) {
      setShowActivityModal(true);
      onStartActivityTriggered?.();
    }
  }, [triggerStartActivity, onStartActivityTriggered]);

  const [activityTitle, setActivityTitle] = useState<string>('');
  const [activityCategory, setActivityCategory] = useState<'feeding' | 'help' | 'event' | 'awareness'>('feeding');
  const [activityLocation, setActivityLocation] = useState<string>('');
  const [activityDesc, setActivityDesc] = useState<string>('');
  const [activityTime, setActivityTime] = useState<string>('');
  const [activityPhoto, setActivityPhoto] = useState<File | null>(null);
  const [activityPhotoPreview, setActivityPhotoPreview] = useState<string>('');
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const activityFileInputRef = useRef<HTMLInputElement>(null);

  const handleActivityFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setActivityPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setActivityPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert('You must be logged in to post updates.');
      return;
    }
    if (!activityTitle || !activityLocation || !activityTime || !activityDesc) {
      alert('Please fill out all required fields (Category, Title, Location/Venue, Time, and Description).');
      return;
    }
    if (!activityPhotoPreview) {
      alert('Photo is mandatory! Please select and upload a photo or banner.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: editingActivityId || undefined,
          category: activityCategory,
          title: activityTitle,
          description: `${activityDesc}\n\n🕒 Scheduled: ${activityTime}`,
          location: activityLocation,
          image: activityPhotoPreview || ''
        })
      });

      if (response.ok) {
        alert(editingActivityId ? 'Community activity updated successfully!' : 'Community activity started successfully!');
        
        // Reset states
        setActivityTitle('');
        setActivityLocation('');
        setActivityDesc('');
        setActivityTime('');
        setActivityPhoto(null);
        setActivityPhotoPreview('');
        setEditingActivityId(null);
        setShowActivityModal(false);

        // Refresh feed
        refreshUpdates();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to save community activity.');
      }
    } catch (err) {
      console.error('Error saving activity:', err);
      alert('Network error. Failed to save community activity.');
    }
  };

  const handleEditPost = (postId: string) => {
    const post = computedUpdates.find(act => act.id === postId);
    if (!post) return;

    setEditingActivityId(postId);
    setActivityCategory(post.category as any);
    setActivityTitle(post.title);
    setActivityLocation(post.location || '');

    // Parse description and schedule time
    const parts = post.description.split('\n\n🕒 Scheduled: ');
    setActivityDesc(parts[0] || '');
    setActivityTime(parts[1] || '');

    setActivityPhoto(null);
    setActivityPhotoPreview(post.image || '');
    setShowActivityModal(true);
  };

  const handleDeletePost = async (postId: string, category: string) => {
    if (!token) return;
    try {
      let url = `${API_BASE}/activities/${postId}`;
      if (category === 'help') {
        url = `${API_BASE}/sos/my/${postId}`;
      }
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert(category === 'help' ? 'Emergency report canceled successfully!' : 'Community activity deleted successfully!');
        refreshUpdates();
      } else {
        const errData = await response.json();
        alert(errData.message || 'Failed to delete post.');
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Network error. Failed to delete post.');
    }
  };

  const getRoleColors = (role: MemberRole) => {
    switch (role) {
      case 'feeder':
        return { bg: 'bg-[#E5E0D4]', text: 'text-[#2D4536]', border: 'border-[#D3CCBE]', label: 'Feeder' };
      case 'rescuer':
        return { bg: 'bg-[#E5E0D4]', text: 'text-[#2D4536]', border: 'border-[#D3CCBE]', label: 'Rescuer' };
      case 'volunteer':
        return { bg: 'bg-[#E5E0D4]', text: 'text-[#2D4536]', border: 'border-[#D3CCBE]', label: 'Volunteer' };
      case 'paravet':
        return { bg: 'bg-[#E5E0D4]', text: 'text-[#2D4536]', border: 'border-[#D3CCBE]', label: 'Paravet' };
      case 'adopter':
        return { bg: 'bg-[#E5E0D4]', text: 'text-[#2D4536]', border: 'border-[#D3CCBE]', label: 'Foster Home' };
      default:
        return { bg: 'bg-[#E5E0D4]', text: 'text-[#2D4536]', border: 'border-[#D3CCBE]', label: 'Member' };
    }
  };

  const renderRoleIcon = (role: MemberRole, size = 'w-5 h-5') => {
    switch (role) {
      case 'feeder':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-[#2D4536]`}>
            <path d="M12 2v4M12 18h.01M3 20h18M5 10a7 7 0 0 0 14 0H5z" />
          </svg>
        );
      case 'rescuer':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-[#2D4536]`}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        );
      case 'volunteer':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-[#2D4536]`}>
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        );
      case 'paravet':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-[#2D4536]`}>
            <path d="M4.82 17.22a3 3 0 1 1-3-3m0 0v-4a7 7 0 0 1 14 0v4m0-4V6a2 2 0 0 1 2-2h2m-6 13.22a3 3 0 1 1 3-3" />
          </svg>
        );
      case 'adopter':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-[#2D4536]`}>
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-[#2D4536]`}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
    }
  };

  const renderPostCard = (post: any) => {
    const roleInfo = getRoleColors(post.authorRole);
    const parts = (post.description || '').split(/\n\n🕒 Scheduled: |\\n\\n🕒 Scheduled: /);
    const displayDesc = parts[0] || '';
    const displayTime = parts[1] || '';

    return (
      <div
        key={post.id}
        onClick={() => setSelectedRequest(post)}
        className="w-full bg-[#F5F2EC] hover:bg-[#EFEBE3] border border-[#EBE3D5] hover:border-stone-300 rounded-2xl sm:rounded-[24px] p-3.5 sm:p-4.5 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-start gap-2.5 group select-none"
      >
        {/* Author Header (1 line space above photo WITH DP) */}
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar DP Circle */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 border border-[#EBE3D5] flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
              {post.avatar && post.avatar.startsWith('http') ? (
                <img src={post.avatar} alt={post.author} className="w-full h-full object-cover" />
              ) : post.avatar === '🚨' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#2D4536] animate-pulse">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              ) : (
                <span className="font-serif text-xs font-bold text-[#2D4536]">{(post.author || 'U').charAt(0)}</span>
              )}
            </div>

            <span className="font-serif text-sm font-bold text-charcoal truncate">{post.author}</span>
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider leading-none ${roleInfo.bg} ${roleInfo.text} border ${roleInfo.border} shrink-0`}>
              {roleInfo.label}
            </span>
          </div>
          <span className="text-xs text-stone-400 font-medium shrink-0 ml-2">{post.time}</span>
        </div>

        {/* Top Photo Box */}
        <div className="w-full h-44 sm:h-52 rounded-xl md:rounded-2xl overflow-hidden bg-white/70 border border-[#EBE3D5] flex items-center justify-center relative shrink-0">
          {post.image ? (
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#EFEBE3] border border-[#EBE3D5] text-stone-400 p-3 text-center gap-1.5">
              <div className="w-10 h-10 rounded-full bg-[#E5E0D4] flex items-center justify-center text-stone-400">
                <svg className="w-5 h-5 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                  <line x1="3" y1="3" x2="21" y2="21" stroke="#2D4536" strokeWidth="2" />
                </svg>
              </div>
              <span className="text-[11px] font-bold text-stone-500">No photo</span>
            </div>
          )}

        </div>

        {/* Info Box (Full width Title, Actions, Location & Description) */}
        <div className="pt-0.5 flex flex-col gap-1.5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-serif text-base sm:text-lg font-bold text-charcoal leading-snug group-hover:text-[#2D4536] transition-colors line-clamp-2 w-full">
              {(post.title || '').replace(/&/g, 'and')}
            </h4>

            {currentUser && (
              post.author === currentUser.fullName ||
              post.author === 'You' ||
              (post.contactPhone && post.contactPhone === currentUser.phone) ||
              post.userEmail === currentUser.email
            ) && (
              <div className="flex items-center gap-0.5 shrink-0">
                {!post.id.startsWith('sos_') && !post.id.startsWith('fallback_') && post.category !== 'help' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditPost(post.id);
                    }}
                    className="text-stone-500 hover:text-[#2D4536] p-1.5 hover:bg-stone-200/50 rounded-lg transition-all active:scale-90"
                    title="Edit Post"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this post?')) {
                      handleDeletePost(post.id, post.category);
                    }
                  }}
                  className="text-stone-500 hover:text-[#C85341] p-1.5 hover:bg-rose-100/50 rounded-lg transition-all active:scale-90"
                  title="Delete Post"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Time Badge below Title */}
          {(displayTime || post.time) && (
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-stone-600 font-semibold mt-0.5">
              <svg className="w-3.5 h-3.5 text-[#2D4536] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="bg-white border border-[#EBE3D5] text-stone-800 text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-3xs">
                {displayTime || post.time}
              </span>
            </div>
          )}

          {/* Location Subtitle with Pin Icon */}
          <div className="flex items-start gap-1 text-[11px] sm:text-xs text-stone-600 font-semibold mt-0.5">
            <svg className="w-3.5 h-3.5 text-[#2D4536] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="10" r="3" />
              <path d="M12 21.7C12 21.7 4 14 4 10a8 8 0 0 1 16 0c0 4-8 11.7-8 11.7z" />
            </svg>
            <span className="line-clamp-2 leading-tight">{(post.location || 'Sector 45, Gurugram').replace(/\[.*?\]/g, '').trim()}</span>
          </div>

          {/* Description text snippet */}
          {displayDesc && (
            <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed mt-1 text-ellipsis overflow-hidden line-clamp-2 whitespace-pre-line">
              {displayDesc}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-5 animate-scaleIn">
      {/* UPDATES CATEGORIES ROW FILTERS */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide select-none w-full justify-between">
        {[
          { id: 'all', label: 'All Updates' },
          { id: 'help', label: 'Help & Rescue' },
          { id: 'feeding', label: 'Feeding' },
          { id: 'event', label: 'Events' },
          { id: 'awareness', label: 'Awareness' }
        ].map(cat => {
          const isSelected = updateFilter === cat.id;
          const colorClass = isSelected ? 'text-current' : '';
          let svgIcon;

          if (cat.id === 'all') {
            svgIcon = (
              <svg className={`w-3.5 h-3.5 ${colorClass || 'text-[#2D4536]'}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            );
          } else if (cat.id === 'help') {
            svgIcon = (
              <svg className={`w-3.5 h-3.5 ${colorClass || 'text-[#2D4536]'}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            );
          } else if (cat.id === 'feeding') {
            svgIcon = (
              <svg className={`w-3.5 h-3.5 ${colorClass || 'text-[#2D4536]'}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M3 18c0-3 3-5 9-5s9 2 9 5H3z" />
                <path d="M12 6v3M9 7v2M15 7v2" />
              </svg>
            );
          } else if (cat.id === 'event') {
            svgIcon = (
              <svg className={`w-3.5 h-3.5 ${colorClass || 'text-[#2D4536]'}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            );
          } else if (cat.id === 'awareness') {
            svgIcon = (
              <svg className={`w-3.5 h-3.5 ${colorClass || 'text-[#2D4536]'}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            );
          } else {
            svgIcon = (
              <svg className={`w-3.5 h-3.5 ${colorClass || 'text-[#2D4536]'}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            );
          }

          return (
            <button
              key={cat.id}
              onClick={() => setUpdateFilter(cat.id)}
              className={`px-3.5 py-1.5 border rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-xs shrink-0 active:scale-95 cursor-pointer ${isSelected
                ? 'bg-[#2D4536] text-white border-[#2D4536]'
                : 'bg-[#F5F2EC] border-[#EBE3D5] text-stone-600 hover:bg-[#EFEBE3]'
              }`}
            >
              {svgIcon}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* UPDATES FEED LIST */}
      <div className="flex flex-col gap-4">
        {computedUpdates
          .filter(u => updateFilter === 'all' || u.category === updateFilter)
          .map(renderPostCard)}
      </div>

      {/* --- START COMMUNITY ACTIVITY MODAL --- */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-end md:items-center justify-center px-4 pb-24 md:pb-0 transition-all">
          <form
            onSubmit={handleCreateActivity}
            className="bg-white w-full max-w-lg rounded-2xl md:rounded-[32px] p-6 shadow-2xl flex flex-col gap-5 max-h-[80vh] overflow-y-auto animate-scaleIn select-none pb-8"
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[#F0EBE1] pb-3.5">
              <button
                type="button"
                onClick={() => {
                  setActivityTitle('');
                  setActivityLocation('');
                  setActivityDesc('');
                  setActivityTime('');
                  setActivityPhoto(null);
                  setActivityPhotoPreview('');
                  setEditingActivityId(null);
                  setShowActivityModal(false);
                }}
                className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 active:scale-90"
              >
                ←
              </button>
              <h3 className="font-serif text-lg text-charcoal font-semibold">
                {editingActivityId ? 'Edit Community Activity' : 'Start Community Activity'}
              </h3>
              <div className="w-8 h-8 pointer-events-none" />
            </div>

            {/* Inputs */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Activity Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'feeding', label: 'Feeding' },
                    { id: 'help', label: 'Help & Rescue' },
                    { id: 'event', label: 'Events' },
                    { id: 'awareness', label: 'Awareness' }
                  ].map(cat => {
                    const isSelected = activityCategory === cat.id;
                    let icon;
                    if (cat.id === 'feeding') {
                      icon = (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-4 h-4">
                          <path d="M12 2v4M12 18h.01M3 20h18M5 10a7 7 0 0 0 14 0H5z" />
                        </svg>
                      );
                    } else if (cat.id === 'help') {
                      icon = (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-4 h-4">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      );
                    } else if (cat.id === 'event') {
                      icon = (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-4 h-4">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      );
                    } else {
                      icon = (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-4 h-4">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                      );
                    }
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActivityCategory(cat.id as any)}
                        className={`py-2 px-1.5 border rounded-xl font-bold flex flex-col items-center justify-center gap-1 active:scale-95 transition-all text-[10px] ${
                          isSelected
                            ? 'bg-[#2D4536] border-[#2D4536] text-white shadow-xs'
                            : 'bg-white border-[#F0EBE1] text-stone-500 hover:border-stone-300'
                        }`}
                      >
                        {icon}
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Activity Title</label>
                <input
                  type="text"
                  placeholder="e.g. Stray Feeding Drive"
                  value={activityTitle}
                  onChange={(e) => setActivityTitle(e.target.value)}
                  className="w-full bg-stone-50 border border-[#F0EBE1] rounded-xl py-2.5 px-3.5 text-xs text-charcoal outline-none focus:border-[#3D5A45] transition-all font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Location / Venue</label>
                <input
                  type="text"
                  placeholder="e.g. Central Park"
                  value={activityLocation}
                  onChange={(e) => setActivityLocation(e.target.value)}
                  className="w-full bg-stone-50 border border-[#F0EBE1] rounded-xl py-2.5 px-3.5 text-xs text-charcoal outline-none focus:border-[#3D5A45] transition-all font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Date & Time</label>
                <input
                  type="text"
                  placeholder="e.g. Sunday, 5:00 PM"
                  value={activityTime}
                  onChange={(e) => setActivityTime(e.target.value)}
                  className="w-full bg-stone-50 border border-[#F0EBE1] rounded-xl py-2.5 px-3.5 text-xs text-charcoal outline-none focus:border-[#3D5A45] transition-all font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Description</label>
                <textarea
                  rows={3}
                  placeholder="What is this activity about? Describe requirements..."
                  value={activityDesc}
                  onChange={(e) => setActivityDesc(e.target.value)}
                  className="w-full bg-stone-50 border border-[#F0EBE1] rounded-xl py-2.5 px-3.5 text-xs text-charcoal outline-none focus:border-[#3D5A45] transition-all font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    Add Photo / Banner <span className="text-stone-400 font-extrabold">*</span>
                  </label>
                  <span className="text-[10px] font-extrabold text-stone-500 bg-stone-100 px-2 py-0.5 rounded border border-stone-200 uppercase">
                    Required
                  </span>
                </div>
                
                <input 
                  type="file" 
                  ref={activityFileInputRef} 
                  onChange={handleActivityFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />

                {activityPhotoPreview ? (
                  <div className="w-full bg-[#FCFAF7] border border-[#EBE3D5] rounded-2xl p-3 flex items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <img 
                        src={activityPhotoPreview} 
                        alt="Attached activity banner" 
                        className="w-12 h-12 object-cover rounded-xl border border-[#EBE3D5] shadow-xs"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-charcoal truncate">
                          {activityPhoto?.name || 'attached_photo.jpg'}
                        </span>
                        <span className="text-[8px] text-[#4A5D4E] font-bold mt-0.5">
                          Photo Attached ✓
                        </span>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setActivityPhoto(null);
                        setActivityPhotoPreview('');
                        if (activityFileInputRef.current) activityFileInputRef.current.value = '';
                      }}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all active:scale-95 flex items-center justify-center shrink-0"
                      title="Remove photo"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => activityFileInputRef.current?.click()}
                    className="w-full bg-[#FCFAF7] hover:bg-[#F5F2EC] border-2 border-dashed border-[#2D4536]/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-[#2D4536]/50 transition-all select-none group"
                  >
                    <div className="p-2 bg-[#E8F0EA] rounded-full text-[#2D4536] group-hover:scale-105 transition-transform duration-200">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-extrabold text-[#2D4536]">Upload Photo or Banner</span>
                    <span className="text-[9px] text-stone-400 font-semibold">Click to select an image from your device</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Actions Footer */}
            <div className="sticky bottom-0 bg-white pt-3 pb-1 border-t border-[#F0EBE1] flex gap-3 mt-2 z-10">
              <button
                type="button"
                onClick={() => {
                  setActivityTitle('');
                  setActivityLocation('');
                  setActivityDesc('');
                  setActivityTime('');
                  setActivityPhoto(null);
                  setActivityPhotoPreview('');
                  setEditingActivityId(null);
                  setShowActivityModal(false);
                }}
                className="flex-1 py-3 bg-[#FCFAF7] border border-[#F0EBE1] hover:border-stone-300 text-stone-600 font-bold rounded-2xl text-xs active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-[#2D4536] hover:bg-[#1E2E24] text-white font-bold rounded-2xl text-xs active:scale-95 transition-all shadow-md shadow-[#2D4536]/15 cursor-pointer"
              >
                {editingActivityId ? 'Save Changes' : 'Launch Activity'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FAB (Floating Plus) Button */}
      <DraggableFAB onTrigger={() => setShowActivityModal(true)} />
    </div>
  );
}

interface DraggableFABProps {
  onTrigger: () => void;
}

function DraggableFAB({ onTrigger }: DraggableFABProps) {
  const [position, setPosition] = useState({ x: -1, y: -1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  const getContentBounds = () => {
    const screenWidth = window.innerWidth;
    const contentWidth = Math.min(screenWidth, 672);
    const leftBoundary = (screenWidth - contentWidth) / 2 + 16;
    const rightBoundary = screenWidth - (screenWidth - contentWidth) / 2 - 16;
    return { leftBoundary, rightBoundary, contentWidth };
  };

  useEffect(() => {
    const updatePosition = () => {
      const { rightBoundary } = getContentBounds();
      setPosition({
        x: rightBoundary - 56,
        y: window.innerHeight - 160
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    hasMoved.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    elementStartPos.current = { x: position.x, y: position.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasMoved.current = true;
    }

    let newX = elementStartPos.current.x + dx;
    let newY = elementStartPos.current.y + dy;

    const { leftBoundary, rightBoundary } = getContentBounds();
    const buttonSize = 56;

    newX = Math.max(leftBoundary, Math.min(rightBoundary - buttonSize, newX));
    newY = Math.max(16, Math.min(window.innerHeight - buttonSize - 16, newY));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (!hasMoved.current) {
      onTrigger();
      return;
    }

    const { leftBoundary, rightBoundary, contentWidth } = getContentBounds();
    const buttonSize = 56;
    const midPoint = leftBoundary + (contentWidth - 32) / 2;
    const currentX = position.x;

    let targetX = leftBoundary;
    if (currentX + buttonSize / 2 > midPoint) {
      targetX = rightBoundary - buttonSize;
    }

    setPosition(prev => ({
      x: targetX,
      y: prev.y
    }));
  };

  const style: React.CSSProperties = {
    position: 'fixed',
    left: position.x >= 0 ? `${position.x}px` : 'auto',
    top: position.y >= 0 ? `${position.y}px` : 'auto',
    right: position.x >= 0 ? 'auto' : '16px',
    bottom: position.y >= 0 ? 'auto' : '160px',
    zIndex: 1900,
    touchAction: 'none',
    transition: isDragging ? 'none' : 'left 0.3s cubic-bezier(0.19, 1, 0.22, 1), top 0.3s cubic-bezier(0.19, 1, 0.22, 1)'
  };

  return (
    <div
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`w-14 h-14 rounded-full bg-[#2D4536] hover:bg-[#1E3024] text-white flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing transition-all select-none hover:scale-105 active:scale-95 ${
        isDragging ? 'shadow-2xl scale-105' : 'shadow-md'
      }`}
    >
      <svg className="w-6 h-6 text-white stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </div>
  );
}
