'use client';

import { useState } from 'react';
import { CommunityUpdate, MemberRole } from '../types';

interface MohallaUpdatesProps {
  computedUpdates: CommunityUpdate[];
  setSelectedRequest: (request: CommunityUpdate) => void;
  joinedActivities: string[];
  toggleJoinActivity: (activityId: string, title: string) => void;
  updateFilter: string;
  setUpdateFilter: (filter: string) => void;
}

export default function MohallaUpdates({
  computedUpdates,
  setSelectedRequest,
  joinedActivities,
  toggleJoinActivity,
  updateFilter,
  setUpdateFilter
}: MohallaUpdatesProps) {

  const getRoleColors = (role: MemberRole) => {
    switch (role) {
      case 'feeder':
        return { bg: 'bg-[#FFF3E0]', text: 'text-[#E65100]', border: 'border-[#FFE0B2]', label: 'Feeder' };
      case 'rescuer':
        return { bg: 'bg-[#E8F5E9]', text: 'text-[#2E7D32]', border: 'border-[#C8E6C9]', label: 'Rescuer' };
      case 'volunteer':
        return { bg: 'bg-[#E3F2FD]', text: 'text-[#0D47A1]', border: 'border-[#BBDEFB]', label: 'Volunteer' };
      case 'paravet':
        return { bg: 'bg-[#F3E5F5]', text: 'text-[#7B1FA2]', border: 'border-[#E1BEE7]', label: 'Paravet' };
      case 'adopter':
        return { bg: 'bg-[#E0F2F1]', text: 'text-[#004D40]', border: 'border-[#B2DFDB]', label: 'Foster Home' };
      default:
        return { bg: 'bg-[#ECEFF1]', text: 'text-[#37474F]', border: 'border-[#CFD8DC]', label: 'Member' };
    }
  };

  const renderRoleIcon = (role: MemberRole, size = 'w-5 h-5') => {
    switch (role) {
      case 'feeder':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-[#E65100]`}>
            <path d="M12 2v4M12 18h.01M3 20h18M5 10a7 7 0 0 0 14 0H5z" />
          </svg>
        );
      case 'rescuer':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-[#2E7D32]`}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        );
      case 'volunteer':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-[#0D47A1]`}>
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        );
      case 'paravet':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-[#7B1FA2]`}>
            <path d="M4.82 17.22a3 3 0 1 1-3-3m0 0v-4a7 7 0 0 1 14 0v4m0-4V6a2 2 0 0 1 2-2h2m-6 13.22a3 3 0 1 1 3-3" />
          </svg>
        );
      case 'adopter':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-[#004D40]`}>
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-stone-500`}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
    }
  };

  const renderPostCard = (post: any) => {
    const roleInfo = getRoleColors(post.authorRole);
    const isSos = post.category === 'help';
    return (
      <div
        key={post.id}
        onClick={() => setSelectedRequest(post)}
        className="bg-white border border-[#F0EBE1] rounded-[24px] p-5 flex flex-col gap-4 hover:shadow-md transition-all duration-300 group cursor-pointer"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cream border border-[#F0EBE1] flex items-center justify-center shadow-inner shrink-0 overflow-hidden">
              {post.avatar && post.avatar.startsWith('http') ? (
                <img src={post.avatar} alt={post.author} className="w-full h-full object-cover" />
              ) : post.avatar === '🚨' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#C85341] animate-pulse">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              ) : (
                renderRoleIcon(post.authorRole, 'w-5 h-5')
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-charcoal">{post.author}</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase leading-none ${roleInfo.bg} ${roleInfo.text} border ${roleInfo.border}`}>
                  {roleInfo.label}
                </span>
              </div>
              <span className="text-[10px] text-stone-400 font-semibold">{post.time}</span>
            </div>
          </div>
          <button className="text-stone-400 hover:text-charcoal p-1">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex gap-4 items-start">
          <div className="flex-1">
            <h4 className="text-sm font-bold text-charcoal leading-snug group-hover:text-[#3D5A45] transition-colors">{post.title}</h4>
            <p className="text-xs text-stone-600 font-medium leading-relaxed mt-1 text-ellipsis overflow-hidden line-clamp-3">
              {post.description}
            </p>
          </div>
          {post.image && (
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 border border-[#F0EBE1] shrink-0 relative">
              <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Meta / Actions Footer */}
        <div className="flex items-center justify-between border-t border-[#F5F2EC] pt-3 text-[11px] text-stone-500 font-bold select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 bg-[#FCFAF7] px-2 py-1 rounded-lg">
              <svg className="w-3 h-3 text-[#C85341] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="10" r="3" />
                <path d="M12 21.7C12 21.7 4 14 4 10a8 8 0 0 1 16 0c0 4-8 11.7-8 11.7z" />
              </svg>
              {post.location}
            </span>

            {['feeding', 'event'].includes(post.category) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleJoinActivity(post.id, post.title);
                }}
                className={`px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold transition-all ${joinedActivities.includes(post.id)
                    ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]'
                    : 'bg-[#3D5A45] hover:bg-[#2A3E31] text-white'
                  }`}
              >
                {joinedActivities.includes(post.id) ? '✓ Joined' : 'Join Activity'}
              </button>
            )}
          </div>
          {post.category !== 'help' && (
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                <svg className="w-3.5 h-3.5 text-current shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
                {post.likes}
              </button>
              <button className="flex items-center gap-1 hover:text-[#3D5A45] transition-colors">
                <svg className="w-3.5 h-3.5 text-current shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Comment
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-scaleIn">
      {/* UPDATES CATEGORIES ROW FILTERS */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide select-none">
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
              <svg className={`w-3.5 h-3.5 ${colorClass || 'text-stone-500'}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            );
          } else if (cat.id === 'help') {
            svgIcon = (
              <svg className={`w-3.5 h-3.5 ${colorClass || 'text-[#C85341]'}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            );
          } else if (cat.id === 'feeding') {
            svgIcon = (
              <svg className={`w-3.5 h-3.5 ${colorClass || 'text-[#E65100]'}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M3 18c0-3 3-5 9-5s9 2 9 5H3z" />
                <path d="M12 6v3M9 7v2M15 7v2" />
              </svg>
            );
          } else if (cat.id === 'event') {
            svgIcon = (
              <svg className={`w-3.5 h-3.5 ${colorClass || 'text-[#7B1FA2]'}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            );
          } else if (cat.id === 'awareness') {
            svgIcon = (
              <svg className={`w-3.5 h-3.5 ${colorClass || 'text-[#3D5A45]'}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            );
          } else {
            svgIcon = (
              <svg className={`w-3.5 h-3.5 ${colorClass || 'text-stone-600'}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            );
          }

          return (
            <button
              key={cat.id}
              onClick={() => setUpdateFilter(cat.id)}
              className={`px-4 py-2 border rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shrink-0 active:scale-95 ${isSelected
                  ? 'bg-[#3D5A45] text-white border-[#3D5A45]'
                  : 'bg-white border-[#F0EBE1] text-stone-600 hover:border-stone-300'
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
    </div>
  );
}
