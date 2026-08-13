'use client';

import { useState, useEffect } from 'react';
import { StethoscopeIcon, LeafIcon, UserIcon, UsersIcon } from './icons/PetIcons';
import NeighborhoodRadar from './NeighborhoodRadar';
import MarketplaceCategories from './MarketplaceCategories';
import { API_BASE } from '../lib/api';

interface MinimalHomeProps {
  userName?: string;
  onSosClick: () => void;
  onVetCareClick: () => void;
  onExpertSupportClick: () => void;
  onPetServicesClick: () => void;
  onCommunityClick: (view?: string) => void;
  onMarketplaceClick?: () => void;
}

export default function MinimalHome({
  userName = 'Ananya',
  onSosClick,
  onVetCareClick,
  onExpertSupportClick,
  onPetServicesClick,
  onCommunityClick,
  onMarketplaceClick
}: MinimalHomeProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Impact Section Live metrics state
  const [impactCounts, setImpactCounts] = useState({
    rescued: 0,
    active: 0,
    pending: 0
  });

  useEffect(() => {
    const fetchImpact = async () => {
      try {
        const res = await fetch(`${API_BASE}/sos/stats`);
        if (res.ok) {
          const data = await res.json();
          if (data.stats) {
            setImpactCounts(data.stats);
            return;
          }
        }
        // Public fallback using active and resolved endpoints
        const [activeRes, resolvedRes] = await Promise.all([
          fetch(`${API_BASE}/sos/active`).then(r => r.ok ? r.json() : { reports: [] }),
          fetch(`${API_BASE}/sos/resolved`).then(r => r.ok ? r.json() : { reports: [] })
        ]);
        const activeReports = activeRes.reports || [];
        const resolvedReports = resolvedRes.reports || [];

        setImpactCounts({
          rescued: resolvedReports.length,
          active: activeReports.filter((r: any) => r.status === 'dispatched' || r.status === 'in_progress').length,
          pending: activeReports.filter((r: any) => r.status === 'active' || r.status === 'pending').length
        });
      } catch (err) {
        console.warn('Error fetching live impact stats:', err);
      }
    };
    fetchImpact();
  }, []);

  // Extract first name
  const firstName = userName ? userName.split(' ')[0] : 'Ananya';

  return (
    <div className="w-full flex flex-col gap-6 animate-fadeIn select-none font-sans pb-4">
      {/* 1. TOP GREETING & HERO TITLE */}
      <div className="flex flex-col gap-3 pt-2">
        <div>
          <span className="text-stone-700 font-serif text-sm sm:text-base tracking-wide block font-semibold">
            Good morning,
          </span>
          <h2 className="font-serif text-stone-900 font-extrabold text-lg sm:text-xl leading-tight">
            {firstName}
          </h2>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold leading-[1.15] text-[#1C1A17] tracking-tight mt-2">
          Care for them.<br />
          Better, together.
        </h1>
      </div>

      {/* 2. SEARCH BAR */}
      <div
        onClick={onExpertSupportClick}
        className="relative z-10 w-full cursor-pointer group"
      >
        <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#2D4536] group-hover:scale-110 transition-transform duration-200">
          <svg className="w-5 h-5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          readOnly
          value={searchQuery}
          onClick={onExpertSupportClick}
          onFocus={onExpertSupportClick}
          placeholder="Search care, experts, services..."
          className="w-full pl-12 pr-4 py-3.5 bg-[#EFEAE2] hover:bg-[#E6E0D6] border border-[#D5CEBF] focus:border-[#2D4536] rounded-2xl text-xs sm:text-sm text-[#1C1A17] placeholder-stone-600 focus:outline-none transition-all font-sans font-semibold shadow-2xs cursor-pointer"
        />
      </div>

      {/* 3. SOS • EMERGENCY SECTION */}
      <div
        onClick={onSosClick}
        className="w-full relative z-10 py-2 sm:py-3 flex flex-row items-center justify-between gap-4 cursor-pointer group select-none min-h-[180px] sm:min-h-[210px]"
      >
        {/* Left Column: Text & Terracotta CTA Arrow */}
        <div className="flex flex-col items-start max-w-[310px] xs:max-w-[350px] sm:max-w-[400px]">
          <span className="text-[10.5px] sm:text-xs font-sans font-extrabold text-[#C85341] tracking-widest uppercase leading-none mb-2.5">
            SOS • EMERGENCY
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#1C1A17] font-extrabold leading-[1.15] mb-2">
            Need help<br />right now?
          </h3>
          <p className="text-xs sm:text-sm text-stone-700 font-bold leading-relaxed mb-4">
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

        <div className="relative flex items-center justify-center shrink-0 w-48 xs:w-56 sm:w-68 md:w-76 h-[220px] sm:h-[260px]">
        </div>
      </div>

      {/* 4. SUBTLE LANDING PAGE IMPACT SECTION */}
      <div className="w-full bg-[#EFEAE2] border border-[#D5CEBF] rounded-2xl sm:rounded-[24px] p-4 sm:p-5 flex flex-col gap-3.5 shadow-2xs font-sans select-none">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-base sm:text-lg font-extrabold text-[#1C1A17] tracking-tight">
            Community Impact
          </h3>
          <button
            onClick={() => onCommunityClick('updates')}
            className="bg-[#E89552]/10 hover:bg-[#E89552]/20 border border-[#E89552]/40 text-[#9A4B1A] text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
          >
            <span>Detailed Updates</span>
            <span className="text-xs font-bold">→</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center pt-0.5">
          {/* Metric 1: Rescued */}
          <div className="bg-[#FAF8F5] border border-[#D5CEBF] rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center shadow-2xs">
            <div className="w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-full bg-[#2D4536]/10 text-[#2D4536] flex items-center justify-center mb-1.5">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <span className="font-serif text-xl sm:text-2xl font-extrabold text-[#1C1A17] leading-none">
              {impactCounts.rescued}
            </span>
            <span className="text-[11px] sm:text-xs font-extrabold text-[#2D4536] mt-1 leading-tight">
              Rescued
            </span>
            <span className="text-[9.5px] sm:text-[10.5px] text-stone-600 font-bold block leading-tight mt-0.5">
              Animals safe
            </span>
          </div>

          {/* Metric 2: Active */}
          <div className="bg-[#FAF8F5] border border-[#D5CEBF] rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center shadow-2xs">
            <div className="w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-full bg-[#2D4536]/10 text-[#2D4536] flex items-center justify-center mb-1.5">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span className="font-serif text-xl sm:text-2xl font-extrabold text-[#1C1A17] leading-none">
              {impactCounts.active}
            </span>
            <span className="text-[11px] sm:text-xs font-extrabold text-[#2D4536] mt-1 leading-tight">
              Active
            </span>
            <span className="text-[9.5px] sm:text-[10.5px] text-stone-600 font-bold block leading-tight mt-0.5">
              In progress
            </span>
          </div>

          {/* Metric 3: Pending */}
          <div className="bg-[#FAF8F5] border border-[#D5CEBF] rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-center shadow-2xs">
            <div className="w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-full bg-[#2D4536]/10 text-[#2D4536] flex items-center justify-center mb-1.5">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="font-serif text-xl sm:text-2xl font-extrabold text-[#1C1A17] leading-none">
              {impactCounts.pending}
            </span>
            <span className="text-[11px] sm:text-xs font-extrabold text-[#2D4536] mt-1 leading-tight">
              Pending
            </span>
            <span className="text-[9.5px] sm:text-[10.5px] text-stone-600 font-bold block leading-tight mt-0.5">
              Queued
            </span>
          </div>
        </div>
      </div>

      {/* 5. SECTION HEADER */}
      <h3 className="font-serif text-base sm:text-xl text-[#1C1A17] font-extrabold tracking-tight pt-1">
        How can we help today?
      </h3>

      {/* 6. 2x2 SERVICES & ACTION TILES GRID */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Tile 1: Vet Care */}
        <div
          onClick={onVetCareClick}
          className="bg-[#EFEAE2] hover:bg-[#E6E0D6] border border-[#D5CEBF] rounded-2xl sm:rounded-[24px] p-3.5 sm:p-5 flex flex-row items-center gap-2.5 sm:gap-4 h-full min-h-[88px] sm:min-h-[108px] transition-all duration-200 cursor-pointer shadow-2xs group"
        >
          <div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center text-[#2D4536] shrink-0 group-hover:scale-105 transition-transform">
            <StethoscopeIcon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
          </div>
          <div className="flex flex-col min-w-0 justify-center">
            <span className="font-serif text-xs sm:text-base font-extrabold text-[#1C1A17] leading-tight">
              Vet Care
            </span>
            <span className="text-[10.5px] sm:text-xs text-stone-700 font-sans font-bold mt-0.5 leading-snug">
              Medical help
            </span>
          </div>
        </div>

        {/* Tile 2: Expert Support */}
        <div
          onClick={onExpertSupportClick}
          className="bg-[#EFEAE2] hover:bg-[#E6E0D6] border border-[#D5CEBF] rounded-2xl sm:rounded-[24px] p-3.5 sm:p-5 flex flex-row items-center gap-2.5 sm:gap-4 h-full min-h-[88px] sm:min-h-[108px] transition-all duration-200 cursor-pointer shadow-2xs group"
        >
          <div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center text-[#2D4536] shrink-0 group-hover:scale-105 transition-transform">
            <LeafIcon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
          </div>
          <div className="flex flex-col min-w-0 justify-center">
            <span className="font-serif text-xs sm:text-base font-extrabold text-[#1C1A17] leading-tight">
              Expert Support
            </span>
            <span className="text-[10.5px] sm:text-xs text-stone-700 font-sans font-bold mt-0.5 leading-snug">
              Wellness & behaviour
            </span>
          </div>
        </div>

        {/* Tile 3: Pet Services */}
        <div
          onClick={onPetServicesClick}
          className="bg-[#EFEAE2] hover:bg-[#E6E0D6] border border-[#D5CEBF] rounded-2xl sm:rounded-[24px] p-3.5 sm:p-5 flex flex-row items-center gap-2.5 sm:gap-4 h-full min-h-[88px] sm:min-h-[108px] transition-all duration-200 cursor-pointer shadow-2xs group"
        >
          <div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center text-[#2D4536] shrink-0 group-hover:scale-105 transition-transform">
            <UserIcon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
          </div>
          <div className="flex flex-col min-w-0 justify-center">
            <span className="font-serif text-xs sm:text-base font-extrabold text-[#1C1A17] leading-tight">
              Pet Services
            </span>
            <span className="text-[10.5px] sm:text-xs text-stone-700 font-sans font-bold mt-0.5 leading-snug">
              Grooming, training & more
            </span>
          </div>
        </div>

        {/* Tile 4: Community */}
        <div
          onClick={() => onCommunityClick('home')}
          className="bg-[#EFEAE2] hover:bg-[#E6E0D6] border border-[#D5CEBF] rounded-2xl sm:rounded-[24px] p-3.5 sm:p-5 flex flex-row items-center gap-2.5 sm:gap-4 h-full min-h-[88px] sm:min-h-[108px] transition-all duration-200 cursor-pointer shadow-2xs group"
        >
          <div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center text-[#2D4536] shrink-0 group-hover:scale-105 transition-transform">
            <UsersIcon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
          </div>
          <div className="flex flex-col min-w-0 justify-center">
            <span className="font-serif text-xs sm:text-base font-extrabold text-[#1C1A17] leading-tight">
              Community
            </span>
            <span className="text-[10.5px] sm:text-xs text-stone-700 font-sans font-bold mt-0.5 leading-snug">
              Mohalla circles
            </span>
          </div>
        </div>
      </div>

      {/* 7. MOHA CIRCLE NEIGHBORHOOD RADAR CARD */}
      <NeighborhoodRadar onEnterCircle={onCommunityClick} />

      {/* 8. MARKETPLACE QUICK ACTIONS */}
      <MarketplaceCategories onExploreMoreClick={onMarketplaceClick || (() => { })} />
    </div>
  );
}
