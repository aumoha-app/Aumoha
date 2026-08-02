'use client';

import { useState } from 'react';
import PetCareServices, { ServiceType } from './PetCareServices';
import { 
  Scissors, 
  Home, 
  Footprints, 
  Award, 
  Sparkles, 
  Search, 
  SlidersHorizontal,
  MessageCircle,
  X,
  Send,
  Bot
} from 'lucide-react';
import { PawIcon } from './icons/PetIcons';

const FILTERS: { label: ServiceType; icon: React.ReactNode }[] = [
  { label: 'All', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { label: 'Grooming', icon: <Scissors className="w-3.5 h-3.5" /> },
  { label: 'Boarding', icon: <Home className="w-3.5 h-3.5" /> },
  { label: 'Walking', icon: <Footprints className="w-3.5 h-3.5" /> },
  { label: 'Training', icon: <Award className="w-3.5 h-3.5" /> }
];

interface PetCareFeatureProps {
  setActiveTab?: (tab: any) => void;
}

export default function PetCareFeature({ setActiveTab }: PetCareFeatureProps) {
  const [activeFilter, setActiveFilter] = useState<ServiceType>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'distance'>('rating');

  return (
    <main className="w-full max-w-2xl mx-auto bg-white rounded-[28px] overflow-hidden shadow-sm transition-all duration-300 font-sans text-charcoal">
      {/* Full-Bleed Hero Banner covering complete top */}
      <div className="relative">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#F5F2EC] via-[#EDE9E1] to-[#E8E3DA]">
          <div className="flex items-stretch min-h-[210px] md:min-h-[240px]">
            {/* Left: Text Content */}
            <div className="flex-1 flex flex-col justify-center gap-3 px-5 md:px-8 py-6 z-10">
              {/* Back button */}
              <button 
                onClick={() => setActiveTab ? setActiveTab('home') : window.history.back()} 
                className="w-9 h-9 rounded-full border border-[#2D4536]/15 bg-white/70 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors cursor-pointer mb-1"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-600">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <span className="text-[10px] font-extrabold text-[#2D4536] uppercase tracking-[0.2em] select-none">
                Pet Care
              </span>
              <h2 className="font-serif text-xl md:text-2xl text-[#1C1A17] leading-[1.15] font-semibold tracking-tight">
                Grooming, Boarding,<br /> Walking and Training
              </h2>
              <p className="max-w-[260px] text-[11px] md:text-xs text-stone-500 font-medium leading-relaxed">
                Verified caregivers and specialists for every pet care need.
              </p>
            </div>

            {/* Right: Hero Image */}
            <div className="w-[40%] md:w-[36%] relative shrink-0 flex items-end justify-end overflow-hidden">
              <img
                src="/expert_support_hero.png"
                alt="Pet care — eucalyptus vase and paw block"
                className="w-full h-full object-contain object-right-bottom scale-[1.15] translate-x-2 translate-y-2"
              />
            </div>
          </div>

          {/* Bottom fade into white content area */}
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent" />
        </div>
      </div>

      {/* Search, Sort & Filter Controls */}
      <div className="flex flex-col gap-4 px-4 md:px-8 pt-4">
        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5 w-full pt-1">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search providers or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FCFAF7] border border-[#F0EBE1] focus:border-[#2D4536]/50 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-charcoal font-semibold outline-none transition-all shadow-xs"
            />
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
          </div>

          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-[#FCFAF7] border border-[#F0EBE1] focus:border-[#2D4536]/50 rounded-2xl pl-9 pr-8 py-2.5 text-xs text-charcoal font-semibold outline-none cursor-pointer appearance-none shadow-xs"
            >
              <option value="rating">Sort: Highest Rating</option>
              <option value="price">Sort: Price (Low to High)</option>
            </select>
            <SlidersHorizontal className="absolute left-3 top-3 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-hide select-none">
          {FILTERS.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveFilter(item.label)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 border shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs ${
                activeFilter === item.label
                  ? 'bg-[#2D4536] border-[#2D4536] text-white shadow-sm'
                  : 'bg-[#FCFAF7] border-[#F0EBE1] text-stone-600 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Services List Component */}
      <div className="px-4 md:px-8 pb-6">
        <PetCareServices 
          activeFilter={activeFilter} 
          searchQuery={searchQuery}
          sortBy={sortBy}
        />
      </div>
    </main>
  );
}
