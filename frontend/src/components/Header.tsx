'use client';

interface HeaderProps {
  deferredPrompt: any;
  onInstallClick: () => void;
}

export default function Header({ deferredPrompt, onInstallClick }: HeaderProps) {
  return (
    <header className="w-full max-w-3xl md:max-w-4xl mx-auto px-3 sm:px-6 pt-1.5 xs:pt-2 sm:pt-3 pb-1 sm:pb-2 flex justify-between items-center select-none relative z-10">
      {/* Left Side: Brand Logo & Text */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <img 
          src="/icon.png" 
          alt="Aumoha Logo" 
          className="h-10 xs:h-11 sm:h-13 md:h-15 w-auto object-contain mix-blend-multiply transition-all brightness-80 contrast-130 saturate-70"
        />
        <div className="flex flex-col justify-center">
          <span className="font-[family-name:var(--font-cormorant)] text-[22px] xs:text-[24px] sm:text-[28px] md:text-[32px] tracking-tight text-[#4D3A33] leading-none font-bold capitalize">Aumoha</span>
          <span className="text-[8px] xs:text-[8.5px] sm:text-[9px] md:text-[9.5px] text-[#1C1A17] font-extrabold tracking-[0.16em] uppercase">Rescue • Protect • Care</span>
        </div>
      </div>


      {/* Right Side: Install Button */}
      <div className="flex items-center gap-4">
        {deferredPrompt && (
          <button 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-charcoal text-cream font-bold rounded-xl text-xs shadow-sm hover:bg-clay transition-all duration-200 cursor-pointer"
            onClick={onInstallClick}
          >
            Install
          </button>
        )}
      </div>
    </header>
  );
}
