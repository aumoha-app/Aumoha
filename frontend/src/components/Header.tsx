'use client';

interface HeaderProps {
  deferredPrompt: any;
  onInstallClick: () => void;
}

export default function Header({ deferredPrompt, onInstallClick }: HeaderProps) {
  return (
    <header className="w-full max-w-3xl md:max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-4 flex justify-between items-center select-none relative z-10">
      {/* Brand Logo Lockup connected seamlessly to icon */}
      <div className="flex flex-col items-center sm:items-start select-none">
        {/* Top Icon sitting right on top & connecting seamlessly into text */}
        <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3">
          <img 
            src="/icon.png" 
            alt="Aumoha Icon" 
            className="h-16 sm:h-18 md:h-20 w-auto object-contain mix-blend-multiply -mb-2 sm:mb-0"
          />
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <h1 className="font-serif text-3xl sm:text-3xl md:text-4xl text-[#3D2B1F] font-normal uppercase tracking-[0.18em] leading-none">
              AUMOHA
            </h1>
            
            {/* Elegant Divider Line with Centered Dot */}
            <div className="flex items-center gap-2 w-full my-1.5 opacity-85">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#B8860B]/60 to-[#B8860B]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#B8860B] shrink-0" />
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#B8860B]/60 to-[#B8860B]" />
            </div>

            {/* Subtitle: Mohalla of Humans & Animals */}
            <span className="font-serif text-xs sm:text-xs text-[#4A3222] tracking-[0.12em] font-medium leading-tight">
              Mohalla of Humans &amp; Animals
            </span>

            {/* Tagline: RESCUE • PROTECT • CARE */}
            <span className="text-[9px] sm:text-[10px] text-[#C85341] font-bold tracking-[0.25em] uppercase mt-1">
              RESCUE &bull; PROTECT &bull; CARE
            </span>
          </div>
        </div>
      </div>


      {/* Right Side: Install Button */}
      <div className="flex items-center gap-4">
        {deferredPrompt && (
          <button 
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-charcoal text-cream font-bold rounded-xl text-xs shadow-sm hover:bg-clay transition-all duration-200 cursor-pointer"
            onClick={onInstallClick}
          >
            Install
          </button>
        )}
      </div>
    </header>
  );
}
