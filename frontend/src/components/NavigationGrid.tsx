'use client';

interface NavigationGridProps {
  onGroomingClick?: () => void;
  onVetConsultationClick?: () => void;
}

export default function NavigationGrid({ onGroomingClick, onVetConsultationClick }: NavigationGridProps) {
  return (
    <div className="w-full select-none flex flex-col gap-3">
      {/* Header Row: Title */}
      <div className="flex items-center justify-between w-full border-b border-warmBeige/40 pb-2 select-none">
        <span className="text-[10px] md:text-xs uppercase tracking-widest text-[#B68A35] font-bold">Consult and Care</span>
      </div>

      {/* 3-Column Responsive Grid Container (Locked columns, fits within screen width on mobile) */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 w-full">
        
        {/* Card 1: Vet Consultation */}
        <div 
          onClick={onVetConsultationClick}
          className="bg-[#FCFAF7] border border-[#EBE3D5]/65 rounded-[18px] md:rounded-[22px] px-2 py-4 md:p-4.5 flex flex-col items-center justify-center hover:border-blue-500/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md group"
        >
          {/* Circle container for icon */}
          <div className="w-11 h-11 md:w-14 md:h-14 rounded-full bg-white border border-[#EBE3D5] flex items-center justify-center transition-colors group-hover:bg-[#FCFAF7] shadow-sm overflow-hidden">
            <img 
              src="/vetConsultation.png" 
              alt="Vet Consultation" 
              className="w-7 h-7 md:w-9 md:h-9 object-contain"
            />
          </div>
          
          {/* Title and Badge */}
          <div className="flex flex-row items-center gap-1.5 justify-center mt-3.5 md:mt-4 w-full">
            <div className="hidden md:flex w-4 h-4 md:w-4.5 md:h-4.5 rounded-full bg-blue-600 text-white items-center justify-center text-[9px] md:text-[10px] font-bold shadow-sm select-none shrink-0">
              1
            </div>
            <h3 className="text-[10px] md:text-xs font-bold text-charcoal leading-tight text-center md:text-left whitespace-normal md:whitespace-nowrap">Vet Consultation</h3>
          </div>
        </div>

        {/* Card 2: Expert Support */}
        <div className="bg-[#FCFAF7] border border-[#EBE3D5]/65 rounded-[18px] md:rounded-[22px] px-2 py-4 md:p-4.5 flex flex-col items-center justify-center hover:border-[#7059E2]/30 hover:scale-[1.02] transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md group">
          {/* Circle container for icon */}
          <div className="w-11 h-11 md:w-14 md:h-14 rounded-full bg-white border border-[#EBE3D5] flex items-center justify-center transition-colors group-hover:bg-[#FCFAF7] shadow-sm overflow-hidden">
            <img 
              src="/experSupport.png" 
              alt="Expert Support" 
              className="w-7 h-7 md:w-9 md:h-9 object-contain"
            />
          </div>
          
          {/* Title and Badge */}
          <div className="flex flex-row items-center gap-1.5 justify-center mt-3.5 md:mt-4 w-full">
            <div className="hidden md:flex w-4 h-4 md:w-4.5 md:h-4.5 rounded-full bg-[#7059E2] text-white items-center justify-center text-[9px] md:text-[10px] font-bold shadow-sm select-none shrink-0">
              2
            </div>
            <h3 className="text-[10px] md:text-xs font-bold text-charcoal leading-tight text-center md:text-left whitespace-normal md:whitespace-nowrap">Expert Support</h3>
          </div>
        </div>

        {/* Card 3: Grooming & Care */}
        <div onClick={onGroomingClick} className="bg-[#FCFAF7] border border-[#EBE3D5]/65 rounded-[18px] md:rounded-[22px] px-2 py-4 md:p-4.5 flex flex-col items-center justify-center hover:border-[#4A9D6F]/30 hover:scale-[1.02] transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md group">
          {/* Circle container for icon */}
          <div className="w-11 h-11 md:w-14 md:h-14 rounded-full bg-white border border-[#EBE3D5] flex items-center justify-center transition-colors group-hover:bg-[#FCFAF7] shadow-sm overflow-hidden">
            <img 
              src="/groominAndCare.png" 
              alt="Grooming & Care" 
              className="w-7 h-7 md:w-9 md:h-9 object-contain"
            />
          </div>
          
          {/* Title and Badge */}
          <div className="flex flex-row items-center gap-1.5 justify-center mt-3.5 md:mt-4 w-full">
            <div className="hidden md:flex w-4 h-4 md:w-4.5 md:h-4.5 rounded-full bg-[#4A9D6F] text-white items-center justify-center text-[9px] md:text-[10px] font-bold shadow-sm select-none shrink-0">
              3
            </div>
            <h3 className="text-[10px] md:text-xs font-bold text-charcoal leading-tight text-center md:text-left whitespace-normal md:whitespace-nowrap">Grooming & Care</h3>
          </div>
        </div>

      </div>
    </div>
  );
}
