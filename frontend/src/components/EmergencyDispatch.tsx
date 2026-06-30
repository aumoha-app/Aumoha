'use client';

import { useState, useRef } from 'react';
import EmergencySubmitted from './EmergencySubmitted';

interface EmergencyDispatchProps {
  sosReason: string;
  setSosReason: (val: string) => void;
  emergencyType: string;
  setEmergencyType: (val: string) => void;
  sosSent: boolean;
  onSubmitSos: (e: React.FormEvent) => void;
  onResetSos: () => void;
}

export default function EmergencyDispatch({
  sosReason,
  setSosReason,
  emergencyType,
  setEmergencyType,
  sosSent,
  onSubmitSos,
  onResetSos
}: EmergencyDispatchProps) {
  // Stateful form components
  const [activeCategory, setActiveCategory] = useState<string>('Accident');
  const [locationMode, setLocationMode] = useState<'current' | 'manual'>('current');
  const [severity, setSeverity] = useState<'critical' | 'urgent' | 'stable'>('critical');
  const [photoSelected, setPhotoSelected] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  // File Upload Reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPhotoSelected(true);
    }
  };

  const toggleRecording = () => {
    setIsRecording(prev => !prev);
  };

  const handleCategorySelect = (categoryName: string, distressType: string) => {
    setActiveCategory(categoryName);
    setEmergencyType(distressType);
  };

  if (sosSent) {
    return (
      <main className="w-full max-w-2xl mx-auto bg-white border border-warmBeige/40 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-6 relative overflow-hidden transition-all duration-300">
        {/* Atmospheric Accent: Leaf photo overlay */}
        <div className="absolute top-0 right-0 pointer-events-none select-none w-44 h-44 z-0 opacity-40 translate-x-4 -translate-y-4">
          <img
            src="/leaf-accent.png"
            alt="Leaf Accent"
            className="w-full h-full object-contain object-right-top mix-blend-multiply"
          />
        </div>
        
        {/* Header Row: Title & Call 1962 Pill Button */}
        <div className="flex items-start justify-between gap-4 w-full relative z-10 select-none">
          <div className="flex flex-col min-w-0">
            <h1 className="font-serif text-2xl md:text-3xl text-[#1C1A17] font-normal leading-tight">Report Emergency</h1>
            <p className="text-xs text-stone-400 font-medium leading-normal mt-0.5">Share a few details to activate rescue near you.</p>
          </div>
          
          <a 
            href="tel:1962" 
            className="px-3.5 py-1.5 bg-[#9B1C1C] hover:bg-[#821414] active:scale-95 text-white font-bold rounded-full text-[10px] md:text-xs shrink-0 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-rose-200"
          >
            📞 Call 1962
          </a>
        </div>

        <EmergencySubmitted
          category={activeCategory}
          severity={severity}
          sosReason={sosReason}
          onBack={onResetSos}
        />
      </main>
    );
  }

  return (
    <main className="w-full max-w-2xl mx-auto bg-white border border-warmBeige/40 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-6 relative overflow-hidden transition-all duration-300">
      
      {/* Atmospheric Accent: Leaf photo overlay */}
      <div className="absolute top-0 right-0 pointer-events-none select-none w-44 h-44 z-0 opacity-40 translate-x-4 -translate-y-4">
        <img
          src="/leaf-accent.png"
          alt="Leaf Accent"
          className="w-full h-full object-contain object-right-top mix-blend-multiply"
        />
      </div>

      {/* Header Row: Back Button, Title & Call 1962 Pill Button */}
      <div className="flex items-start justify-between gap-4 w-full relative z-10 select-none">
        <div className="flex flex-col min-w-0">
          <h1 className="font-serif text-2xl md:text-3xl text-[#1C1A17] font-normal leading-tight">Report Emergency</h1>
          <p className="text-xs text-stone-400 font-medium leading-normal mt-0.5">Share a few details to activate rescue near you.</p>
        </div>
        
        {/* Call 1962 button with red border */}
        <a 
          href="tel:1962" 
          className="px-3.5 py-1.5 bg-[#9B1C1C] hover:bg-[#821414] active:scale-95 text-white font-bold rounded-full text-[10px] md:text-xs shrink-0 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-rose-200"
        >
          📞 Call 1962
        </a>
      </div>

      {/* Form Submission Wrapper */}
      <form onSubmit={onSubmitSos} className="flex flex-col gap-6 relative z-10 w-full">

        {/* Section 1: What happened? (2x4 Grid of cards) */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs md:text-sm font-bold text-charcoal select-none">1. What happened?</label>
          <div className="grid grid-cols-4 gap-2.5 w-full">
            
            {/* Grid 1: Accident (Active by default) */}
            <div 
              onClick={() => handleCategorySelect('Accident', 'Medical')}
              className={`rounded-[16px] p-2 flex flex-col items-center text-center gap-1.5 cursor-pointer transition-all border ${
                activeCategory === 'Accident'
                  ? 'bg-[#FDF2F2] border-[#F8B4B4] shadow-sm'
                  : 'bg-white border-stone-200 hover:border-[#F8B4B4]/60'
              }`}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" className="md:w-7 md:h-7 shrink-0 text-red-600" fill="none" stroke="#D95D39" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3C13 6.8 11.5 6 9.8 6H3c-1.1 0-2 .9-2 2v8c0 .6.4 1 1 1h2" />
                <circle cx="7" cy="17" r="2" />
                <circle cx="17" cy="17" r="2" />
                <path d="M5 17h10M9 6v4M13 6v4" />
                <path d="m18 5 2 2M21 4l-1 3" strokeWidth="2.2" />
              </svg>
              <div>
                <h4 className="text-[10px] md:text-xs font-bold text-charcoal leading-tight">Accident</h4>
                <p className="text-[8px] md:text-[10px] text-stone-400 font-semibold leading-normal mt-0.5">Hit by vehicle</p>
              </div>
            </div>

            {/* Grid 2: Injury */}
            <div 
              onClick={() => handleCategorySelect('Injury', 'Medical')}
              className={`rounded-[16px] p-2 flex flex-col items-center text-center gap-1.5 cursor-pointer transition-all border ${
                activeCategory === 'Injury'
                  ? 'bg-[#FDF2F2] border-[#F8B4B4] shadow-sm'
                  : 'bg-white border-stone-200 hover:border-[#BBF7D0]/60'
              }`}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" className="md:w-7 md:h-7 shrink-0 text-emerald-600" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="9" width="20" height="6" rx="2" transform="rotate(-45 12 12)" />
                <path d="m11 11 1 1M12 10l1 1" />
              </svg>
              <div>
                <h4 className="text-[10px] md:text-xs font-bold text-charcoal leading-tight">Injury</h4>
                <p className="text-[8px] md:text-[10px] text-stone-400 font-semibold leading-normal mt-0.5">Wounded animal</p>
              </div>
            </div>

            {/* Grid 3: Abuse */}
            <div 
              onClick={() => handleCategorySelect('Abuse', 'Safety')}
              className={`rounded-[16px] p-2 flex flex-col items-center text-center gap-1.5 cursor-pointer transition-all border ${
                activeCategory === 'Abuse'
                  ? 'bg-[#FDF2F2] border-[#F8B4B4] shadow-sm'
                  : 'bg-white border-stone-200 hover:border-[#F8B4B4]/60'
              }`}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" className="md:w-7 md:h-7 shrink-0 text-red-700" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 10a2 2 0 0 0-2-2v0a2 2 0 0 0-2-2v0a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0a2 2 0 0 0-2 2v8a5 5 0 0 0 5 5h3a5 5 0 0 0 5-5V10Z" />
                <path d="M8 14H6a2 2 0 0 1-2-2V8a2 2 0 0 1 4 0" />
              </svg>
              <div>
                <h4 className="text-[10px] md:text-xs font-bold text-charcoal leading-tight">Abuse</h4>
                <p className="text-[8px] md:text-[10px] text-stone-400 font-semibold leading-normal mt-0.5">Cruelty or harm</p>
              </div>
            </div>

            {/* Grid 4: Sick Animal */}
            <div 
              onClick={() => handleCategorySelect('Sick Animal', 'Medical')}
              className={`rounded-[16px] p-2 flex flex-col items-center text-center gap-1.5 cursor-pointer transition-all border ${
                activeCategory === 'Sick Animal'
                  ? 'bg-[#FDF2F2] border-[#F8B4B4] shadow-sm'
                  : 'bg-white border-stone-200 hover:border-[#C4B5FD]/60'
              }`}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" className="md:w-7 md:h-7 shrink-0 text-purple-600" fill="none" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="6" />
                <path d="M12 2v4M12 18v4M4 12h4M16 12h4M6.3 6.3l2.9 2.9M14.8 14.8l2.9 2.9M6.3 17.7l2.9-2.9M14.8 9.2l2.9-2.9" />
              </svg>
              <div>
                <h4 className="text-[10px] md:text-xs font-bold text-charcoal leading-tight">Sick Animal</h4>
                <p className="text-[8px] md:text-[10px] text-stone-400 font-semibold leading-normal mt-0.5">Unwell or weak</p>
              </div>
            </div>

            {/* Grid 5: Abandoned */}
            <div 
              onClick={() => handleCategorySelect('Abandoned', 'Safety')}
              className={`rounded-[16px] p-2 flex flex-col items-center text-center gap-1.5 cursor-pointer transition-all border ${
                activeCategory === 'Abandoned'
                  ? 'bg-[#FDF2F2] border-[#F8B4B4] shadow-sm'
                  : 'bg-white border-stone-200 hover:border-[#FCD34D]/60'
              }`}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" className="md:w-7 md:h-7 shrink-0 text-amber-800" fill="none" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <div>
                <h4 className="text-[10px] md:text-xs font-bold text-charcoal leading-tight">Abandoned</h4>
                <p className="text-[8px] md:text-[10px] text-stone-400 font-semibold leading-normal mt-0.5">Left alone</p>
              </div>
            </div>

            {/* Grid 6: Stray */}
            <div 
              onClick={() => handleCategorySelect('Stray', 'General')}
              className={`rounded-[16px] p-2 flex flex-col items-center text-center gap-1.5 cursor-pointer transition-all border ${
                activeCategory === 'Stray'
                  ? 'bg-[#FDF2F2] border-[#F8B4B4] shadow-sm'
                  : 'bg-white border-stone-200 hover:border-[#F97316]/60'
              }`}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" className="md:w-7 md:h-7 shrink-0 text-orange-600" fill="none" stroke="#EA580C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3.5-.5 1.5-1 2.12-1 3.5a2.5 2.5 0 0 0 2.5 2.5ZM15.5 14.5a2.5 2.5 0 0 0 2.5-2.5c0-1.38-.5-2-1-3.5-.5 1.5-1 2.12-1 3.5a2.5 2.5 0 0 0 2.5 2.5Z" />
                <path d="M12 21a4 4 0 0 0 4-4c0-2-1.5-3-2-5.5-.5 2.5-2 3.5-2 5.5a4 4 0 0 0 4 4Z" />
              </svg>
              <div>
                <h4 className="text-[10px] md:text-xs font-bold text-charcoal leading-tight">Stray</h4>
                <p className="text-[8px] md:text-[10px] text-stone-400 font-semibold leading-normal mt-0.5">No owner</p>
              </div>
            </div>

            {/* Grid 7: Lost Animal */}
            <div 
              onClick={() => handleCategorySelect('Lost Animal', 'General')}
              className={`rounded-[16px] p-2 flex flex-col items-center text-center gap-1.5 cursor-pointer transition-all border ${
                activeCategory === 'Lost Animal'
                  ? 'bg-[#FDF2F2] border-[#F8B4B4] shadow-sm'
                  : 'bg-white border-stone-200 hover:border-stone-400/60'
              }`}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" className="md:w-7 md:h-7 shrink-0 text-gray-500" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="13" r="3" />
                <circle cx="6" cy="9" r="2" />
                <circle cx="18" cy="9" r="2" />
                <circle cx="9" cy="5" r="2" />
                <circle cx="15" cy="5" r="2" />
              </svg>
              <div>
                <h4 className="text-[10px] md:text-xs font-bold text-charcoal leading-tight">Lost Animal</h4>
                <p className="text-[8px] md:text-[10px] text-stone-400 font-semibold leading-normal mt-0.5">Missing pet</p>
              </div>
            </div>

            {/* Grid 8: Other */}
            <div 
              onClick={() => handleCategorySelect('Other', 'General')}
              className={`rounded-[16px] p-2 flex flex-col items-center text-center gap-1.5 cursor-pointer transition-all border ${
                activeCategory === 'Other'
                  ? 'bg-[#FDF2F2] border-[#F8B4B4] shadow-sm'
                  : 'bg-white border-stone-200 hover:border-stone-400/60'
              }`}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" className="md:w-7 md:h-7 shrink-0 text-gray-600" fill="none" stroke="#4B5563" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="6" cy="12" r="1.5" />
                <circle cx="18" cy="12" r="1.5" />
              </svg>
              <div>
                <h4 className="text-[10px] md:text-xs font-bold text-charcoal leading-tight">Other</h4>
                <p className="text-[8px] md:text-[10px] text-stone-400 font-semibold leading-normal mt-0.5">Something else</p>
              </div>
            </div>

          </div>
        </div>

        {/* Section 2: Location Selection */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs md:text-sm font-bold text-charcoal select-none">2. Location</label>
          <div className="flex flex-col gap-2">
            
            {/* Top Bar: Use Current Location (Active default) */}
            <div 
              onClick={() => setLocationMode('current')}
              className={`rounded-2xl p-4 flex items-center justify-between cursor-pointer border transition-all ${
                locationMode === 'current'
                  ? 'bg-[#F1F5F2] border-[#C2D6C6]'
                  : 'bg-white border-stone-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-emerald-700">
                  <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                  <circle cx="12" cy="10" r="3" fill="#047857" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-charcoal leading-tight">Use Current Location</span>
                  <span className="text-[10px] text-stone-500 font-semibold mt-0.5">Santi Nagar, Rourkela</span>
                </div>
              </div>
              
              {/* Radar target icon */}
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#047857" strokeWidth="2" className="text-emerald-700">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <line x1="12" y1="1" x2="12" y2="23" />
                <line x1="1" y1="12" x2="23" y2="12" />
              </svg>
            </div>

            {/* Bottom Bar: Pin Location Manually */}
            <div 
              onClick={() => setLocationMode('manual')}
              className={`rounded-2xl p-4 flex items-center justify-between cursor-pointer border transition-all ${
                locationMode === 'manual'
                  ? 'bg-[#F1F5F2] border-[#C2D6C6]'
                  : 'bg-white border-stone-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#78716C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-stone-500">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-charcoal leading-tight">Pin Location Manually</span>
                  <span className="text-[10px] text-stone-500 font-semibold mt-0.5">Select on map</span>
                </div>
              </div>
              {/* Right Chevron arrow */}
              <span className="text-stone-400 font-bold text-sm select-none mr-1">›</span>
            </div>

          </div>
        </div>

        {/* Section 3: Add Photo Container (File input trigger) */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs md:text-sm font-bold text-charcoal select-none">3. Add Photo <span className="text-stone-400 font-normal">(optional)</span></label>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />

          <div 
            onClick={handlePhotoClick}
            className="w-full bg-[#FCFAF7] border border-warmBeige rounded-[20px] p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-clay/40 transition-all select-none"
          >
            {/* Camera line icon */}
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-charcoal">
                {photoSelected ? "✓ Photo Attached Successfully" : "Tap to add photo"}
              </span>
              <span className="text-[10px] text-stone-500 mt-0.5">Helps rescuers understand better</span>
            </div>
            
            <span className="text-[10px] text-stone-400 underline hover:text-charcoal mt-1">Skip for now</span>
          </div>
        </div>

        {/* Section 4: Voice Note Recorder */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs md:text-sm font-bold text-charcoal select-none">4. Voice Note <span className="text-stone-400 font-normal">(optional)</span></label>
          
          <div className="w-full bg-[#FAF6F0] rounded-[20px] p-5 flex items-center justify-between gap-4 select-none relative overflow-hidden">
            {/* Left Soundwave Vector Lines */}
            <div className={`flex items-center gap-0.5 text-stone-300 opacity-60 ${isRecording ? 'animate-pulse' : ''}`}>
              <div className="w-[2px] h-3 bg-current" />
              <div className="w-[2px] h-5 bg-current" />
              <div className="w-[2px] h-7 bg-current" />
              <div className="w-[2px] h-4 bg-current" />
              <div className="w-[2px] h-2 bg-current" />
            </div>

            {/* Center microphone recording button */}
            <div className="flex flex-col items-center gap-2">
              <div 
                onClick={toggleRecording}
                className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                  isRecording 
                    ? 'bg-red-700 scale-105 shadow-md shadow-red-200 animate-pulse text-white' 
                    : 'bg-[#D95D39] text-white hover:bg-red-700 shadow-sm active:scale-95'
                }`}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                </svg>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-charcoal">
                  {isRecording ? "🔴 Recording Voice Note..." : "Tap to record"}
                </span>
                <span className="text-[10px] text-stone-500 mt-0.5">Describe what you see</span>
              </div>
              <span className="text-[10px] text-stone-400 underline hover:text-charcoal mt-1">Skip instead</span>
            </div>

            {/* Right Soundwave Vector Lines */}
            <div className={`flex items-center gap-0.5 text-stone-300 opacity-60 ${isRecording ? 'animate-pulse' : ''}`}>
              <div className="w-[2px] h-2 bg-current" />
              <div className="w-[2px] h-4 bg-current" />
              <div className="w-[2px] h-7 bg-current" />
              <div className="w-[2px] h-5 bg-current" />
              <div className="w-[2px] h-3 bg-current" />
            </div>
          </div>
        </div>

        {/* Section 5: How serious is the situation? (Triage view) */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs md:text-sm font-bold text-charcoal select-none">5. How serious is the situation?</label>
          <div className="grid grid-cols-3 gap-2.5 w-full">
            
            {/* Triage 1: Critical (Red exclamation mark) */}
            <div 
              onClick={() => setSeverity('critical')}
              className={`rounded-2xl p-3 flex flex-col items-center text-center gap-2 cursor-pointer transition-all border ${
                severity === 'critical'
                  ? 'bg-[#FDF2F2] border-[#F8B4B4] shadow-sm'
                  : 'bg-[#FAF8F5]/30 border-stone-200 hover:border-[#F8B4B4]/50'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs select-none">
                !
              </div>
              <div>
                <h4 className="text-xs font-bold text-charcoal">Critical</h4>
                <p className="text-[9px] text-stone-400 font-semibold leading-tight mt-1">Life threatening / Needs immediate help</p>
              </div>
            </div>

            {/* Triage 2: Urgent (Amber clock) */}
            <div 
              onClick={() => setSeverity('urgent')}
              className={`rounded-2xl p-3 flex flex-col items-center text-center gap-2 cursor-pointer transition-all border ${
                severity === 'urgent'
                  ? 'bg-[#FFF8F1] border-[#FFE4E6]'
                  : 'bg-[#FAF8F5]/30 border-stone-200 hover:border-[#FFE4E6]/50'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs select-none">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-bold text-charcoal">Urgent</h4>
                <p className="text-[9px] text-stone-400 font-semibold leading-tight mt-1">Needs help soon / At risk</p>
              </div>
            </div>

            {/* Triage 3: Stable (Green checkmark) */}
            <div 
              onClick={() => setSeverity('stable')}
              className={`rounded-2xl p-3 flex flex-col items-center text-center gap-2 cursor-pointer transition-all border ${
                severity === 'stable'
                  ? 'bg-[#F0FDF4] border-[#BBF7D0]'
                  : 'bg-[#FAF8F5]/30 border-stone-200 hover:border-[#BBF7D0]/50'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs select-none">
                ✓
              </div>
              <div>
                <h4 className="text-xs font-bold text-charcoal">Stable</h4>
                <p className="text-[9px] text-stone-400 font-semibold leading-tight mt-1">Not critical / Can wait safely</p>
              </div>
            </div>

          </div>
        </div>

        {/* urgent description text area (replaces page.tsx standard input but references hook value) */}
        <div className="flex flex-col gap-1.5 mt-1 select-none">
          <label className="text-xs font-bold text-charcoal">Description of Emergency</label>
          <textarea
            value={sosReason}
            onChange={(e) => setSosReason(e.target.value)}
            placeholder="Describe what you see to help wardens prepare (e.g. animal size, visible symptoms, physical surroundings)..."
            className="bg-[#FCFAF7] border border-warmBeige rounded-xl p-3 text-sm text-charcoal outline-none focus:border-emergency min-h-[90px] resize-y transition-all"
            required
          />
        </div>

        {/* Footer Action: Solid deep crimson button */}
        <button 
          type="submit" 
          className="w-full py-3.5 bg-[#9B1C1C] hover:bg-[#821414] active:scale-[0.99] text-white font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-200/50 transition-all cursor-pointer mt-3"
          disabled={sosSent}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-[-2px]">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          {sosSent ? "🚨 Broadcasting Distress Signal..." : "Activate Rescue Network"}
        </button>

      </form>
    </main>
  );
}
