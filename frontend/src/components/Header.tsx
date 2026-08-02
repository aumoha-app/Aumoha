'use client';

interface HeaderProps {
  deferredPrompt: any;
  onInstallClick: () => void;
}

export default function Header({ deferredPrompt, onInstallClick }: HeaderProps) {
  return (
    <header className="w-full max-w-3xl md:max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-4 flex justify-between items-center select-none relative z-10">
      {/* Left Side: Brand Logo & Text */}
      <div className="flex items-center gap-0">
        <img 
          src="/icon.png" 
          alt="Aumoha Logo" 
          className="h-14 sm:h-16 md:h-18 w-auto object-contain mix-blend-multiply transition-all"
        />
        <div className="flex flex-col justify-center">
          <span className="font-[family-name:var(--font-cormorant)] text-[28px] sm:text-[32px] md:text-[36px] tracking-tight text-[#1C1A17] leading-none font-bold capitalize">Aumoha</span>
          <span className="text-[9px] md:text-[10px] text-[#2D4536] font-extrabold mt-1 tracking-[0.16em] uppercase">Rescue • Protect • Care</span>
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
