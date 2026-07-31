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
    <main className="w-full max-w-2xl mx-auto bg-white rounded-3xl p-4 md:p-8 flex flex-col gap-6 shadow-sm transition-all duration-300 font-sans text-charcoal">
      {/* Top Header Bar with Go Back Action */}
      <div className="flex items-center gap-3 pb-3 border-b border-[#F0EBE1] select-none">
        <button 
          onClick={() => setActiveTab ? setActiveTab('home') : window.history.back()} 
          className="w-10 h-10 rounded-full border border-[#EBE3D5] bg-[#FCFAF7] flex items-center justify-center hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-600">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div>
          <span className="text-[10px] text-stone-400 font-extrabold uppercase tracking-widest block">Pet Care Services</span>
          <h1 className="text-sm font-serif font-extrabold text-charcoal">Grooming & Care</h1>
        </div>
      </div>

      {/* Header Banner */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF2EE] px-3.5 py-1.5 text-[11px] font-extrabold text-terracotta border border-[#F5DFD8] uppercase tracking-[0.2em] select-none w-fit">
            <PawIcon className="w-3.5 h-3.5 text-terracotta" /> Pet Care Services
          </div>
          <h1 className="font-serif text-2xl md:text-4xl text-[#1C1A17] leading-tight font-semibold">
            Grooming, Boarding, Walking & Training
          </h1>
          <p className="max-w-2xl text-xs md:text-sm text-stone-600 font-medium leading-relaxed">
            Verified local caregivers and specialists tailored for every pet care need. Search, compare, and book trusted sessions instantly.
          </p>
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5 w-full pt-1">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search providers or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FCFAF7] border border-[#F0EBE1] focus:border-terracotta/50 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-charcoal font-semibold outline-none transition-all shadow-xs"
            />
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
          </div>

          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-[#FCFAF7] border border-[#F0EBE1] focus:border-terracotta/50 rounded-2xl pl-9 pr-8 py-2.5 text-xs text-charcoal font-semibold outline-none cursor-pointer appearance-none shadow-xs"
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
                  ? 'bg-terracotta border-terracotta text-white shadow-sm'
                  : 'bg-[#FCFAF7] border-[#F0EBE1] text-stone-600 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Services List Component */}
      <PetCareServices 
        activeFilter={activeFilter} 
        searchQuery={searchQuery}
        sortBy={sortBy}
      />
    </main>
  );
}
