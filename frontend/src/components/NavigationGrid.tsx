'use client';

interface NavigationGridProps {
  onGroomingClick?: () => void;
  onVetConsultationClick?: () => void;
  onExpertSupportClick?: () => void;
}

export default function NavigationGrid({ onGroomingClick, onVetConsultationClick, onExpertSupportClick }: NavigationGridProps) {
  const items = [
    {
      id: 1,
      title: 'Vet Consultation',
      icon: '/vetConsultation.png',
      onClick: onVetConsultationClick,
    },
    {
      id: 2,
      title: 'Expert Support',
      icon: '/experSupport.png',
      onClick: onExpertSupportClick,
    },
    {
      id: 3,
      title: 'Grooming & Care',
      icon: '/groominAndCare.png',
      onClick: onGroomingClick,
    },
  ];

  return (
    <div className="w-full select-none flex flex-col gap-3">
      {/* Header Row: Title */}
      <div className="flex items-center justify-between w-full border-b border-warmBeige/40 pb-2 select-none">
        <span className="text-[10px] md:text-xs uppercase tracking-widest text-[#B68A35] font-bold">Consult and Care</span>
      </div>

      {/* 3-Column Compact Bubble Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 w-full py-1">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={item.onClick}
            className="flex flex-col items-center justify-start cursor-pointer"
          >
            {/* Compact Flat Bubble Container */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-[#FAF2EE] flex items-center justify-center">
              <img
                src={item.icon}
                alt={item.title}
                className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 object-contain"
                style={{ filter: 'brightness(0) saturate(100%) invert(18%) sepia(45%) saturate(1100%) hue-rotate(345deg) brightness(85%) contrast(95%)' }}
              />
            </div>

            {/* Label below Bubble */}
            <h3 className="mt-1.5 text-[10px] sm:text-xs md:text-xs font-bold text-charcoal leading-tight text-center max-w-[90px] sm:max-w-[110px]">
              {item.title}
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
}

