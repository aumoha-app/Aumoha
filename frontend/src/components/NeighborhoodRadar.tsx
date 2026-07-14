'use client';

import { useAuth } from '../context/AuthContext';

interface NeighborhoodRadarProps {
  onEnterCircle?: () => void;
}

export default function NeighborhoodRadar({ onEnterCircle }: NeighborhoodRadarProps) {
  const { user } = useAuth();
  
  // Resolve user location name, fallback to Saheed Nagar
  const locationName = user?.address 
    ? (user.address.includes(',') ? user.address.split(',')[0] : user.address)
    : 'Saheed Nagar';

  return (
    <div className="w-full bg-[#FCFAF7] border border-warmBeige rounded-[20px] md:rounded-[28px] p-4 md:p-6 shadow-sm flex flex-row gap-3 md:gap-6 items-center justify-between select-none">
      
      {/* Left Column: Title, Stats, and Enter Circle Button */}
      <div className="flex-grow flex flex-col gap-2.5 md:gap-4 min-w-0">
        <div 
          onClick={onEnterCircle}
          className="flex flex-col select-none cursor-pointer group"
        >
          <span className="text-[8px] md:text-[10px] tracking-wider text-[#B68A35] font-bold uppercase leading-none">MOHA CIRCLE</span>
          <h2 className="font-serif text-base md:text-[28px] text-charcoal font-normal mt-0.5 md:mt-1 flex items-center gap-1 leading-none truncate group-hover:text-[#B68A35] transition-colors">
            {locationName}
            <span className="inline-flex items-center text-charcoal/40 font-sans text-xs md:text-xl font-light ml-0.5 select-none">›</span>
          </h2>
        </div>

        {/* Stats row with dividing lines */}
        <div className="flex items-center gap-2 md:gap-4 select-none">
          <div className="flex flex-col">
            <span className="text-xs md:text-[22px] font-bold text-charcoal leading-none">24</span>
            <span className="text-[8px] md:text-[11px] text-stone-400 font-semibold mt-0.5 md:mt-1 leading-none">Members</span>
          </div>
          <div className="w-[1px] h-4 md:h-7 bg-stone-200 shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs md:text-[22px] font-bold text-charcoal leading-none">142</span>
            <span className="text-[8px] md:text-[11px] text-stone-400 font-semibold mt-0.5 md:mt-1 leading-none">Rescues</span>
          </div>
          <div className="w-[1px] h-4 md:h-7 bg-stone-200 shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs md:text-[22px] font-bold text-charcoal leading-none">#3</span>
            <span className="text-[8px] md:text-[11px] text-stone-400 font-semibold mt-0.5 md:mt-1 leading-none">Rank</span>
          </div>
        </div>

        {/* Solid Gold Enter Circle Button */}
        <button 
          onClick={onEnterCircle}
          className="w-fit px-3 md:px-6 py-1.5 md:py-2.5 bg-[#B68A35] hover:bg-[#A37B2F] active:bg-[#8D6B28] text-white font-bold rounded-full text-[9px] md:text-xs flex items-center justify-center gap-1 transition-all duration-200 cursor-pointer shadow-sm shadow-[#B68A35]/15 shrink-0"
        >
          Enter <span className="hidden sm:inline">Circle</span> <span className="text-[10px] md:text-sm font-light leading-none">→</span>
        </button>
      </div>

      {/* Center Column: SVG Map Radar Visualizer (Circular on mobile, rounded card on desktop) */}
      <div 
        onClick={onEnterCircle}
        className="w-14 h-14 md:w-40 md:h-[130px] flex items-center justify-center overflow-hidden rounded-full md:rounded-[20px] shrink-0 bg-[#FAF8F5] border border-warmBeige/40 cursor-pointer hover:border-[#3D5A45]/30 transition-colors"
      >
        <svg viewBox="0 0 200 100" className="w-full h-full opacity-70">
          {/* Map streets */}
          <path d="M 0,20 Q 50,40 100,20 T 200,30" fill="none" stroke="#F1E8DC" strokeWidth="2.5" />
          <path d="M 30,0 L 50,100" fill="none" stroke="#F1E8DC" strokeWidth="2" />
          <path d="M 120,0 L 100,100" fill="none" stroke="#F1E8DC" strokeWidth="1.5" />
          <path d="M 0,70 L 200,60" fill="none" stroke="#F1E8DC" strokeWidth="3" />
          <path d="M 80,0 Q 120,40 150,100" fill="none" stroke="#F1E8DC" strokeWidth="2" />
          <path d="M 0,45 Q 100,45 200,45" fill="none" stroke="#F1E8DC" strokeWidth="1" strokeDasharray="3 3" />
          
          {/* Radar overlay */}
          <circle cx="100" cy="50" r="32" fill="#E8EFE9" fillOpacity="0.6" stroke="#D3E2D6" strokeWidth="1.2" />
          <circle cx="100" cy="50" r="20" fill="none" stroke="#D3E2D6" strokeWidth="0.8" strokeDasharray="2 2" />
          <circle cx="100" cy="50" r="9" fill="none" stroke="#D3E2D6" strokeWidth="0.8" />
          
          {/* Center Node Dot */}
          <circle cx="100" cy="50" r="3.5" fill="#3D5A45" />
          <circle cx="100" cy="50" r="8" fill="none" stroke="#3D5A45" strokeWidth="1" opacity="0.4" className="animate-ping" style={{ transformOrigin: '100px 50px' }} />
        </svg>
      </div>

      {/* Right Column: Wardens Avatar Stack */}
      <div 
        onClick={onEnterCircle}
        className="flex items-center gap-1.5 md:gap-3 shrink-0 cursor-pointer"
      >
        <div className="flex -space-x-2 md:-space-x-3.5 overflow-hidden select-none">
          <img
            src="/warden-1.png"
            alt="Warden 1"
            className="w-6 h-6 md:w-10 md:h-10 rounded-full border border-warmCard object-cover shadow-sm bg-stone-200"
          />
          <img
            src="/warden-2.png"
            alt="Warden 2"
            className="w-6 h-6 md:w-10 md:h-10 rounded-full border border-warmCard object-cover shadow-sm bg-stone-200"
          />
          <img
            src="/warden-3.png"
            alt="Warden 3"
            className="w-6 h-6 md:w-10 md:h-10 rounded-full border-2 border-warmCard object-cover shadow-sm bg-stone-200"
          />
        </div>
        <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-[#E3C69A] text-charcoal font-bold text-[9px] md:text-xs flex items-center justify-center shadow-sm select-none">
          +21
        </div>
      </div>

    </div>
  );
}
