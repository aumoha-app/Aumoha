'use client';

import React from 'react';
import { CommunityUpdate, MemberRole } from '../types';

interface BlogDetailViewProps {
  selectedBlog: CommunityUpdate;
  onBack: () => void;
  joinedActivities: string[];
  toggleJoinActivity: (activityId: string, title: string) => void;
}

export default function BlogDetailView({
  selectedBlog,
  onBack,
  joinedActivities,
  toggleJoinActivity
}: BlogDetailViewProps) {
  
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

  const getCategoryDetails = (cat: string) => {
    switch (cat) {
      case 'feeding':
        return { label: 'Feeding Support', bg: 'bg-[#FFF3E0]', text: 'text-[#E65100]', icon: '🥣' };
      case 'event':
        return { label: 'Community Event', bg: 'bg-[#F3E5F5]', text: 'text-[#7B1FA2]', icon: '📅' };
      case 'awareness':
        return { label: 'Info & Awareness', bg: 'bg-[#E5F2E8]', text: 'text-[#3D5A45]', icon: '📖' };
      default:
        return { label: 'Community Update', bg: 'bg-[#ECEFF1]', text: 'text-[#37474F]', icon: '📣' };
    }
  };

  const roleInfo = getRoleColors(selectedBlog.authorRole);
  const catInfo = getCategoryDetails(selectedBlog.category);
  const isJoined = joinedActivities.includes(selectedBlog.id);

  return (
    <main className="w-full max-w-2xl mx-auto bg-white border border-warmBeige/40 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-6 relative overflow-hidden transition-all duration-300">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-4 select-none">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 active:scale-95 transition-all text-stone-600 font-semibold"
          title="Back to Updates"
        >
          ←
        </button>
        <h1 className="font-serif text-lg md:text-xl text-[#1C1A17] font-semibold text-center">Community Update</h1>
        <div className="w-9 h-9 pointer-events-none" />
      </div>

      {/* Author Profile Block */}
      <div className="flex items-center justify-between bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-cream border border-[#F0EBE1] flex items-center justify-center shadow-inner overflow-hidden shrink-0 select-none">
            {selectedBlog.avatar && selectedBlog.avatar.startsWith('http') ? (
              <img src={selectedBlog.avatar} alt={selectedBlog.author} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl">👤</span>
            )}
          </div>
          <div className="min-w-0">
            <span className="text-sm font-extrabold text-charcoal block leading-tight">{selectedBlog.author}</span>
            <div className="flex items-center gap-1.5 mt-1 select-none">
              <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider border ${roleInfo.bg} ${roleInfo.text} ${roleInfo.border}`}>
                {roleInfo.label}
              </span>
              <span className="text-[10px] text-stone-400 font-bold">•</span>
              <span className="text-[10px] text-stone-400 font-bold">{selectedBlog.time}</span>
            </div>
          </div>
        </div>

        {/* Share Button (placeholder for future action) */}
        <button
          onClick={() => alert('Link copied to clipboard!')}
          className="p-2 hover:bg-stone-100 rounded-xl transition-all cursor-pointer text-stone-400 hover:text-stone-600 shrink-0"
          title="Copy Link"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
        </button>
      </div>

      {/* Main Blog Post Content Area */}
      <div className="flex flex-col gap-4">
        
        {/* Category & Location Badges */}
        <div className="flex flex-wrap items-center gap-2 select-none">
          <span className={`text-[9px] font-extrabold px-2 py-1 rounded-full flex items-center gap-1 border ${catInfo.bg} ${catInfo.text} border-current/10`}>
            <span>{catInfo.icon}</span> {catInfo.label}
          </span>
          {selectedBlog.location && (
            <span className="text-[9px] font-bold text-stone-500 bg-stone-100 border border-stone-200/60 px-2 py-1 rounded-full flex items-center gap-1">
              📍 {selectedBlog.location}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="font-serif text-xl md:text-2xl text-charcoal font-semibold leading-snug">
          {selectedBlog.title}
        </h2>

        {/* Image Display */}
        {selectedBlog.image && (
          <div className="w-full rounded-2xl overflow-hidden border border-[#F0EBE1] shadow-xs max-h-[300px]">
            <img src={selectedBlog.image} alt={selectedBlog.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Description / Content Body */}
        <p className="text-sm text-[#4E4A42] leading-relaxed font-medium whitespace-pre-wrap">
          {selectedBlog.description}
        </p>
      </div>

      {/* Dynamic CTA Footer Section */}
      {selectedBlog.category === 'event' && (
        <div className="mt-4 border-t border-[#F0EBE1] pt-6 flex flex-col gap-3 select-none">
          <div className="bg-[#F8F9FA] rounded-2xl p-4 border border-[#ECEFF1] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Event Participation</span>
              <span className="text-xs text-charcoal font-semibold mt-0.5">
                {isJoined ? 'You are registered for this event!' : 'Join other animal lovers in this community event.'}
              </span>
            </div>
            <span className="text-xl">🐾</span>
          </div>

          <button
            onClick={() => toggleJoinActivity(selectedBlog.id, selectedBlog.title)}
            className={`w-full py-3.5 rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-98 ${
              isJoined 
                ? 'bg-stone-100 border border-stone-200 hover:bg-stone-200 text-stone-700' 
                : 'bg-[#3D5A45] hover:bg-[#2A3E31] text-white'
            }`}
          >
            {isJoined ? 'Cancel Registration' : 'Register / Join Event'}
          </button>

          {/* Registered Joinees List */}
          {selectedBlog.joinees && selectedBlog.joinees.length > 0 && (
            <div className="mt-4 bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl p-4 flex flex-col gap-3">
              <span className="text-[10px] text-stone-500 font-extrabold uppercase tracking-wider">
                Registered Attendants ({selectedBlog.joinees.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedBlog.joinees.map((joinee, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-2 bg-white border border-[#F0EBE1] pl-2 pr-3 py-1.5 rounded-full shadow-3xs"
                    title={`${joinee.userName} (${joinee.userEmail})`}
                  >
                    <div className="w-5 h-5 rounded-full bg-cream border border-[#F0EBE1] flex items-center justify-center overflow-hidden shrink-0">
                      {joinee.avatar && joinee.avatar.startsWith('http') ? (
                        <img src={joinee.avatar} alt={joinee.userName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px]">👤</span>
                      )}
                    </div>
                    <span className="text-xs text-charcoal font-bold">{joinee.userName}</span>
                    
                    {joinee.userPhone && (
                      <a
                        href={`tel:${joinee.userPhone}`}
                        className="ml-1 p-1 hover:bg-[#E8F5E9] active:scale-90 rounded-full transition-all text-[#2E7D32] flex items-center justify-center cursor-pointer border border-[#C8E6C9] hover:border-[#81C784]"
                        title={`Call ${joinee.userName} at ${joinee.userPhone}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.147-7.147c-.157-.441.009-.928.387-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                        </svg>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedBlog.category === 'feeding' && (
        <div className="mt-4 border-t border-[#F0EBE1] pt-6 flex flex-col gap-3 select-none">
          <div className="bg-[#FFF8E1] rounded-2xl p-4 border border-[#FFE082]/60 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-[#B78103] font-bold uppercase tracking-wider">Feeding Drive Support</span>
              <span className="text-xs text-charcoal font-semibold mt-0.5">
                Want to volunteer to help with feeding or donate supplies?
              </span>
            </div>
            <span className="text-xl">🥣</span>
          </div>
          
          <button
            onClick={() => alert('Support request shared with the feeding coordinator!')}
            className="w-full py-3.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-2xl transition-all shadow-sm active:scale-98"
          >
            Offer Feeding Help
          </button>
        </div>
      )}

    </main>
  );
}
