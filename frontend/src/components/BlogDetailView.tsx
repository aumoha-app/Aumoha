'use client';

import React, { useState } from 'react';
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
  const [copied, setCopied] = useState(false);
  
  const getRoleColors = (role: MemberRole) => {
    switch (role) {
      case 'ngo':
        return { bg: 'bg-[#E8F5E9]', text: 'text-[#2D4536]', border: 'border-[#C8E6C9]', label: 'NGO' };
      case 'feeder':
        return { bg: 'bg-[#E8F5E9]', text: 'text-[#2D4536]', border: 'border-[#C8E6C9]', label: 'Feeder' };
      case 'rescuer':
        return { bg: 'bg-[#E8F5E9]', text: 'text-[#2D4536]', border: 'border-[#C8E6C9]', label: 'Rescuer' };
      case 'volunteer':
        return { bg: 'bg-[#FCFAF7]', text: 'text-[#2D4536]', border: 'border-[#EBE3D5]', label: 'Volunteer' };
      case 'paravet':
        return { bg: 'bg-[#E8F5E9]', text: 'text-[#2D4536]', border: 'border-[#C8E6C9]', label: 'Paravet' };
      case 'adopter':
        return { bg: 'bg-[#FCFAF7]', text: 'text-[#2D4536]', border: 'border-[#EBE3D5]', label: 'Foster Home' };
      default:
        return { bg: 'bg-[#F5F2EC]', text: 'text-stone-500', border: 'border-[#EBE3D5]', label: 'Member' };
    }
  };

  const getCategoryDetails = (cat: string) => {
    switch (cat) {
      case 'feeding':
        return { label: 'Feeding Drive', bg: 'bg-[#E8F5E9]', text: 'text-[#2D4536]', icon: '🥣' };
      case 'event':
        return { label: 'Community Event', bg: 'bg-[#E8F5E9]', text: 'text-[#2D4536]', icon: '📅' };
      case 'awareness':
        return { label: 'Info & Awareness', bg: 'bg-[#FCFAF7]', text: 'text-[#2D4536]', icon: '📖' };
      default:
        return { label: 'Community Update', bg: 'bg-[#F5F2EC]', text: 'text-stone-500', icon: '📣' };
    }
  };

  const roleInfo = getRoleColors(selectedBlog.authorRole);
  const catInfo = getCategoryDetails(selectedBlog.category);
  const isJoined = joinedActivities.map(String).includes(String(selectedBlog.id));

  // Parse structured scheduled time from the description if it exists
  const descParts = (selectedBlog.description || '').split(/\n\n🕒 Scheduled: |\\n\\n🕒 Scheduled: /);
  const cleanDescription = descParts[0] || '';
  const scheduledTime = descParts[1] || '';

  const handleShareClick = () => {
    try {
      const shareUrl = window.location.origin + `?activity=${selectedBlog.id}`;
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy link:', err);
    }
  };

  return (
    <main className="w-full max-w-2xl mx-auto bg-white border border-[#EBE5DA] rounded-3xl p-5 md:p-8 flex flex-col gap-5 md:gap-6 relative overflow-hidden transition-all duration-300 select-none">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 active:scale-95 transition-all text-stone-600 font-semibold cursor-pointer shadow-3xs"
          title="Back to Updates"
        >
          <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="font-sans text-xs md:text-sm text-[#2E2A25] font-extrabold uppercase tracking-widest text-center">Community Update</h1>
        <div className="w-9 h-9 pointer-events-none" />
      </div>

      {/* Author Profile Block */}
      <div className="flex items-center justify-between bg-[#FCFAF8] border border-[#EBE5DA] rounded-2xl p-3 md:p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full border-2 border-white ring-2 ring-stone-200/50 flex items-center justify-center shadow-inner overflow-hidden shrink-0">
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
              <span className="text-stone-300 font-bold text-[9px]">•</span>
              <span className="text-[10px] text-stone-400 font-bold">{selectedBlog.time}</span>
            </div>
          </div>
        </div>

        {/* Share Button with copied tooltip state */}
        <div className="relative">
          <button
            onClick={handleShareClick}
            className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${copied ? 'bg-green-50 text-green-600' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'}`}
            title="Copy Link"
          >
            {copied ? (
              <svg className="w-5 h-5 text-green-600 animate-scale" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
            )}
          </button>
          {copied && (
            <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-stone-900 text-white text-[9px] font-bold rounded-md shadow-sm whitespace-nowrap animate-fade-in">
              Link Copied!
            </span>
          )}
        </div>
      </div>

      {/* Main Blog Post Content Area */}
      <div className="flex flex-col gap-4">
        
        {/* Category & Location Badges */}
        <div className="flex flex-wrap items-center gap-2 select-none">
          <span className={`text-[9.5px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 border ${catInfo.bg} ${catInfo.text} border-current/10 uppercase tracking-wider`}>
            <span>{catInfo.icon}</span> {catInfo.label}
          </span>
          {selectedBlog.location && (
            <span className="text-[9.5px] font-bold text-stone-500 bg-stone-50 border border-stone-200/60 px-2.5 py-1 rounded-lg flex items-center gap-1">
              📍 {selectedBlog.location}
            </span>
          )}
        </div>

        {/* Title - Auto-Capitalized */}
        <h2 className="font-serif text-xl md:text-3xl text-[#1C1A17] font-semibold leading-snug tracking-tight capitalize">
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
          {cleanDescription}
        </p>

        {/* Structured Scheduled Time Card */}
        {scheduledTime && (
          <div className="flex items-center gap-3 bg-stone-50 border border-stone-200/60 rounded-xl p-3 md:p-3.5 w-fit">
            <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-center text-[#2D4536] shrink-0 shadow-3xs">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider">Scheduled Time</span>
              <span className="text-xs text-stone-700 font-bold capitalize mt-0.5">{scheduledTime}</span>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic CTA Footer Section */}
      {(() => {
        const category = selectedBlog.category || 'event';
        let badgeHeader = 'Community Support';
        let notJoinedText = 'Offer support or volunteer for this community initiative.';
        let joinedText = 'You have offered support for this activity!';
        let categoryIcon = '🤝';
        let buttonNotJoinedLabel = 'Offer Support / Join';
        let buttonJoinedLabel = 'Cancel Support';
        let joineesHeader = 'Registered Participants';

        if (category === 'feeding') {
          badgeHeader = 'Feeding Drive Support';
          notJoinedText = 'Want to volunteer to help with feeding or donate supplies?';
          joinedText = 'You have registered to help with this feeding drive!';
          categoryIcon = '🥣';
          buttonNotJoinedLabel = 'Offer Feeding Help';
          buttonJoinedLabel = 'Cancel Feeding Support';
          joineesHeader = 'Registered Helpers & Feeders';
        } else if (category === 'event') {
          badgeHeader = 'Event Participation';
          notJoinedText = 'Join other animal lovers in this community event.';
          joinedText = 'You are registered for this event!';
          categoryIcon = '🐾';
          buttonNotJoinedLabel = 'Register / Join Event';
          buttonJoinedLabel = 'Cancel Registration';
          joineesHeader = 'Registered Attendants';
        }

        return (
          <div className="mt-2 border-t border-[#F0EBE1] pt-5 flex flex-col gap-3">
            <div className={`rounded-2xl p-4 border flex items-center justify-between transition-all duration-300 ${
              isJoined 
                ? 'bg-gradient-to-r from-[#F0F7F2] to-[#E8F3EB] border-[#C8E2CF] text-[#2E7D32]' 
                : 'bg-[#FCFAF8] border-[#EBE5DA] text-stone-600'
            }`}>
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-stone-400">{badgeHeader}</span>
                <span className={`text-xs font-bold mt-0.5 ${isJoined ? 'text-[#2E7D32]' : 'text-stone-700'}`}>
                  {isJoined ? joinedText : notJoinedText}
                </span>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-3xs shrink-0 select-none ${isJoined ? 'bg-white text-[#2E7D32]' : 'bg-stone-100 text-stone-400'}`}>
                {isJoined ? (
                  <svg className="w-4 h-4 text-[#2E7D32]" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <span className="text-sm">{categoryIcon}</span>
                )}
              </div>
            </div>

            <button
              onClick={() => toggleJoinActivity(selectedBlog.id, selectedBlog.title)}
              className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all active:scale-98 cursor-pointer ${
                isJoined 
                  ? 'bg-stone-50 border border-stone-200 hover:bg-stone-100 text-stone-600 shadow-sm' 
                  : 'bg-[#2D4536] hover:bg-[#1F3325] text-white shadow-xs hover:shadow-md'
              }`}
            >
              {isJoined ? buttonJoinedLabel : buttonNotJoinedLabel}
            </button>

            {/* Registered Joinees / Participants List */}
            {selectedBlog.joinees && selectedBlog.joinees.length > 0 && (
              <div className="mt-2 bg-[#FCFAF8] border border-[#EBE5DA] rounded-2xl p-4 flex flex-col gap-3">
                <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider">
                  {joineesHeader} ({selectedBlog.joinees.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedBlog.joinees.map((joinee, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-2 bg-white border border-[#EBE5DA] pl-2 pr-3 py-1 rounded-full shadow-3xs"
                      title={`${joinee.userName} (${joinee.userEmail})`}
                    >
                      <div className="w-5 h-5 rounded-full bg-cream border border-[#EBE5DA] flex items-center justify-center overflow-hidden shrink-0">
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
                          className="ml-1 p-1 bg-[#E8F5E9] text-[#2D4536] hover:bg-[#2D4536] hover:text-white border border-[#C8E6C9] hover:border-[#2D4536] rounded-full transition-all flex items-center justify-center cursor-pointer"
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
        );
      })()}

    </main>
  );
}
