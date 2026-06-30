'use client';

interface HeaderProps {
  deferredPrompt: any;
  onInstallClick: () => void;
}

export default function Header({ deferredPrompt, onInstallClick }: HeaderProps) {
  return (
    <header className="w-full max-w-2xl mx-auto px-4 pt-8 pb-4 flex justify-between items-center select-none">
      {/* Left Side: Brand Text */}
      <div className="flex flex-col">
        <span className="font-serif text-[28px] tracking-wide text-charcoal leading-none font-normal">MOHA</span>
        <span className="text-xs text-clay font-semibold mt-1">Mohalla of Humans & Animals</span>
      </div>

      {/* Right Side: Install Button & Bell Icon */}
      <div className="flex items-center gap-4">
        {deferredPrompt && (
          <button 
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-charcoal text-cream font-bold rounded-xl text-xs shadow-sm hover:bg-clay transition-all duration-200 cursor-pointer"
            onClick={onInstallClick}
          >
            Install
          </button>
        )}

        {/* Minimalist Notification Bell with solid red alert dot */}
        <div className="relative p-1 text-charcoal hover:text-clay transition-colors cursor-pointer" title="Notifications">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-rose-600 rounded-full border border-cream" />
        </div>
      </div>
    </header>
  );
}
