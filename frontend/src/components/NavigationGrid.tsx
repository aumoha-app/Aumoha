'use client';

interface NavigationGridProps {
  onGroomingClick?: () => void;
}

export default function NavigationGrid({ onGroomingClick }: NavigationGridProps) {
  return (
    <div className="w-full select-none">
      {/* 3-Column Responsive Grid Container (Locked columns, fits within screen width on mobile) */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 w-full">
        
        {/* Card 1: Vet Consultation */}
        <div className="bg-[#FCFAF7] border border-warmBeige rounded-[16px] md:rounded-[20px] p-3 md:p-5 flex flex-col items-center md:items-start gap-2.5 md:gap-4 hover:border-clay/40 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md group">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#F3EDE4] flex items-center justify-center text-clay transition-colors group-hover:bg-[#EAE1D5]">
            <svg viewBox="0 0 24 24" width="18" height="18" className="md:w-5 md:h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div className="flex flex-col items-center md:items-start gap-0.5 text-center md:text-left">
            <h3 className="text-[10px] md:text-sm font-bold text-charcoal leading-tight">Vet Consultation</h3>
            <p className="hidden md:block text-xs text-stone-500 leading-relaxed mt-1">Book appointments with verified vets.</p>
          </div>
        </div>

        {/* Card 2: Expert Support */}
        <div className="bg-[#FCFAF7] border border-warmBeige rounded-[16px] md:rounded-[20px] p-3 md:p-5 flex flex-col items-center md:items-start gap-2.5 md:gap-4 hover:border-clay/40 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md group">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#F3EDE4] flex items-center justify-center text-clay transition-colors group-hover:bg-[#EAE1D5]">
            <svg viewBox="0 0 24 24" width="18" height="18" className="md:w-5 md:h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="flex flex-col items-center md:items-start gap-0.5 text-center md:text-left">
            <h3 className="text-[10px] md:text-sm font-bold text-charcoal leading-tight">Expert Support</h3>
            <p className="hidden md:block text-xs text-stone-500 leading-relaxed mt-1">Get advice from specialists.</p>
          </div>
        </div>

        {/* Card 3: Grooming & Care */}
        <div onClick={onGroomingClick} className="bg-[#FCFAF7] border border-warmBeige rounded-[16px] md:rounded-[20px] p-3 md:p-5 flex flex-col items-center md:items-start gap-2.5 md:gap-4 hover:border-clay/40 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md group">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#F3EDE4] flex items-center justify-center text-clay transition-colors group-hover:bg-[#EAE1D5]">
            <svg viewBox="0 0 24 24" width="18" height="18" className="md:w-5 md:h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
          </div>
          <div className="flex flex-col items-center md:items-start gap-0.5 text-center md:text-left">
            <h3 className="text-[10px] md:text-sm font-bold text-charcoal leading-tight">Grooming & Care</h3>
            <p className="hidden md:block text-xs text-stone-500 leading-relaxed mt-1">Grooming, walking, boarding & more.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
