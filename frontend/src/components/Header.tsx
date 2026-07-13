'use client';

interface HeaderProps {
  deferredPrompt: any;
  onInstallClick: () => void;
}

export default function Header({ deferredPrompt, onInstallClick }: HeaderProps) {
  return (
    <header className="w-full max-w-2xl mx-auto px-4 pt-8 pb-4 flex justify-between items-center select-none">
      {/* Left Side: Brand Logo & Text */}
      <div className="flex items-center gap-3">
        <img 
          src="/logo.png" 
          alt="Aumoha Logo" 
          className="h-12 md:h-14 w-auto object-contain"
        />
        <div className="flex flex-col justify-center">
          <span className="font-serif text-[24px] md:text-[28px] tracking-normal text-charcoal leading-none font-normal lowercase">aumoha</span>
          <span className="text-[10px] md:text-xs text-clay font-semibold mt-1">Rescue • Protect • Care</span>
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
