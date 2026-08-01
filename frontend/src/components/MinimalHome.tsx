'use client';

import { useState } from 'react';
import { StethoscopeIcon, LeafIcon, UserIcon, UsersIcon } from './icons/PetIcons';
import NeighborhoodRadar from './NeighborhoodRadar';

interface MinimalHomeProps {
  userName?: string;
  onSosClick: () => void;
  onVetCareClick: () => void;
  onExpertSupportClick: () => void;
  onPetServicesClick: () => void;
  onCommunityClick: () => void;
}

export default function MinimalHome({
  userName = 'Ananya',
  onSosClick,
  onVetCareClick,
  onExpertSupportClick,
  onPetServicesClick,
  onCommunityClick
}: MinimalHomeProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Extract first name
  const firstName = userName ? userName.split(' ')[0] : 'Ananya';

  return (
    <div className="w-full flex flex-col gap-6 animate-fadeIn select-none font-sans pb-4">
      {/* 1. TOP GREETING & HERO TITLE */}
      <div className="flex flex-col gap-3 pt-2">
        <div>
          <span className="text-stone-700 font-serif text-sm sm:text-base tracking-wide block">
            Good morning,
          </span>
          <h2 className="font-serif text-stone-900 font-bold text-lg sm:text-xl leading-tight">
            {firstName}
          </h2>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium leading-[1.15] text-[#1C1A17] tracking-tight mt-2">
          Care for them.<br />
          Better, together.
        </h1>
      </div>

      {/* 2. SEARCH BAR */}
      <div className="relative z-10 w-full">
        <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-500">
          <svg className="w-4 h-4 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search care, experts, services..."
          className="w-full pl-11 pr-4 py-3.5 bg-[#FAF7F2]/90 backdrop-blur-xs border-2 border-[#D5CEBF] focus:border-[#C85341] rounded-2xl text-xs sm:text-sm text-[#1C1A17] placeholder-stone-500 focus:outline-none transition-all font-sans font-medium shadow-2xs"
        />
      </div>

      {/* 3. SOS • EMERGENCY SECTION */}
      <div 
        onClick={onSosClick}
        className="w-full relative z-10 py-2 sm:py-3 flex flex-row items-center justify-between gap-4 cursor-pointer group select-none min-h-[180px] sm:min-h-[210px]"
      >
        {/* Left Column: Text & Terracotta CTA Arrow */}
        <div className="flex flex-col items-start max-w-[210px] xs:max-w-[250px] sm:max-w-[300px]">
          <span className="text-[10.5px] sm:text-xs font-sans font-extrabold text-[#C85341] tracking-widest uppercase leading-none mb-2.5">
            SOS • EMERGENCY
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#1C1A17] font-semibold leading-[1.15] mb-2">
            Need help<br />right now?
          </h3>
          <p className="text-xs sm:text-sm text-stone-700 font-medium leading-relaxed mb-4">
            Report an animal<br />in need.
          </p>

          {/* Terracotta Circular Arrow Button */}
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#C85341] hover:bg-[#b04332] flex items-center justify-center text-white shadow-md active:scale-95 transition-all group-hover:translate-x-1 duration-300">
            <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </div>

        {/* Right Column: Laying Dog Image (Bigger sizing & deep shadow) */}
        <div className="flex items-center justify-end shrink-0">
          <img 
            src="/laying-dog.png" 
            alt="Laying Dog" 
            className="w-48 xs:w-58 sm:w-69 md:w-80 h-auto max-h-[250px] sm:max-h-[270px] object-contain group-hover:scale-105 transition-transform duration-500 mix-blend-multiply drop-shadow-[0_14px_28px_rgba(20,15,10,0.5)]"
          />
        </div>
      </div>

      {/* 4. SECTION HEADER */}
      <h3 className="font-serif text-base sm:text-xl text-[#1C1A17] font-bold tracking-tight pt-1">
        How can we help today?
      </h3>

      {/* 5. 2x2 SERVICES & ACTION TILES GRID */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Tile 1: Vet Care */}
        <div
          onClick={onVetCareClick}
          className="bg-[#F8F5EE] hover:bg-[#F3EEE4] border-2 border-[#D2CBBA] hover:border-[#2D4536] active:border-[#2D4536] rounded-2xl sm:rounded-[24px] p-3.5 sm:p-5 flex flex-row items-center gap-2.5 sm:gap-4 h-full min-h-[88px] sm:min-h-[108px] transition-all duration-200 cursor-pointer shadow-2xs group"
        >
          <div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center text-[#2D4536] shrink-0 group-hover:scale-105 transition-transform">
            <StethoscopeIcon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.8]" />
          </div>
          <div className="flex flex-col min-w-0 justify-center">
            <span className="font-serif text-xs sm:text-base font-bold text-[#1C1A17] leading-tight">
              Vet Care
            </span>
            <span className="text-[10.5px] sm:text-xs text-stone-600 font-sans font-medium mt-0.5 leading-snug">
              Medical help
            </span>
          </div>
        </div>

        {/* Tile 2: Expert Support */}
        <div
          onClick={onExpertSupportClick}
          className="bg-[#F8F5EE] hover:bg-[#F3EEE4] border-2 border-[#D2CBBA] hover:border-[#2D4536] active:border-[#2D4536] rounded-2xl sm:rounded-[24px] p-3.5 sm:p-5 flex flex-row items-center gap-2.5 sm:gap-4 h-full min-h-[88px] sm:min-h-[108px] transition-all duration-200 cursor-pointer shadow-2xs group"
        >
          <div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center text-[#2D4536] shrink-0 group-hover:scale-105 transition-transform">
            <LeafIcon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.8]" />
          </div>
          <div className="flex flex-col min-w-0 justify-center">
            <span className="font-serif text-xs sm:text-base font-bold text-[#1C1A17] leading-tight">
              Expert Support
            </span>
            <span className="text-[10.5px] sm:text-xs text-stone-600 font-sans font-medium mt-0.5 leading-snug">
              Wellness & behaviour
            </span>
          </div>
        </div>

        {/* Tile 3: Pet Services */}
        <div
          onClick={onPetServicesClick}
          className="bg-[#F8F5EE] hover:bg-[#F3EEE4] border-2 border-[#D2CBBA] hover:border-[#2D4536] active:border-[#2D4536] rounded-2xl sm:rounded-[24px] p-3.5 sm:p-5 flex flex-row items-center gap-2.5 sm:gap-4 h-full min-h-[88px] sm:min-h-[108px] transition-all duration-200 cursor-pointer shadow-2xs group"
        >
          <div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center text-[#2D4536] shrink-0 group-hover:scale-105 transition-transform">
            <UserIcon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.8]" />
          </div>
          <div className="flex flex-col min-w-0 justify-center">
            <span className="font-serif text-xs sm:text-base font-bold text-[#1C1A17] leading-tight">
              Pet Services
            </span>
            <span className="text-[10.5px] sm:text-xs text-stone-600 font-sans font-medium mt-0.5 leading-snug">
              Grooming, training & more
            </span>
          </div>
        </div>

        {/* Tile 4: Community */}
        <div
          onClick={onCommunityClick}
          className="bg-[#F8F5EE] hover:bg-[#F3EEE4] border-2 border-[#2D4536] rounded-2xl sm:rounded-[24px] p-3.5 sm:p-5 flex flex-row items-center gap-2.5 sm:gap-4 h-full min-h-[88px] sm:min-h-[108px] transition-all duration-200 cursor-pointer shadow-2xs group"
        >
          <div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center text-[#2D4536] shrink-0 group-hover:scale-105 transition-transform">
            <UsersIcon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.8]" />
          </div>
          <div className="flex flex-col min-w-0 justify-center">
            <span className="font-serif text-xs sm:text-base font-bold text-[#1C1A17] leading-tight">
              Community
            </span>
            <span className="text-[10.5px] sm:text-xs text-stone-600 font-sans font-medium mt-0.5 leading-snug">
              Mohalla circles
            </span>
          </div>
        </div>
      </div>

      {/* 6. MOHA CIRCLE NEIGHBORHOOD RADAR CARD */}
      <NeighborhoodRadar onEnterCircle={onCommunityClick} />
    </div>
  );
}
