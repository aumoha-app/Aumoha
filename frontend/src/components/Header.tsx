'use client';

interface HeaderProps {
  onInstallClick: () => void;
}

export default function Header({ onInstallClick }: HeaderProps) {
  return (
    <header className="w-full max-w-3xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 pt-2 sm:pt-3 pb-2 flex justify-between items-center select-none relative z-20">
      {/* Left Side: Brand Logo & Text */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <img 
          src="/icon.png" 
          alt="Aumoha Logo" 
          className="h-10 sm:h-12 md:h-14 w-auto object-contain mix-blend-multiply transition-all brightness-90 contrast-120"
        />
        <div className="flex flex-col justify-center">
          <span className="font-[family-name:var(--font-cormorant)] text-2xl sm:text-3xl md:text-4xl tracking-tight text-[#4D3A33] leading-none font-bold capitalize">Aumoha</span>
          <span className="text-[8px] sm:text-[9.5px] text-[#1C1A17] font-extrabold tracking-[0.18em] uppercase">Rescue • Protect • Care</span>
        </div>
      </div>

      {/* Right Side: Always-Visible Install Button */}
      <div className="flex items-center gap-3">
        <button 
          type="button"
          onClick={onInstallClick}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-[#4D3A33] hover:bg-[#392A24] active:scale-95 text-[#FDFBF7] font-extrabold rounded-xl text-xs sm:text-sm shadow-sm transition-all duration-200 cursor-pointer border border-[#392A24]/30"
          title="Install Aumoha Web App"
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F3D7C6] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="whitespace-nowrap font-sans font-bold">Install</span>
        </button>
      </div>
    </header>
  );
}
