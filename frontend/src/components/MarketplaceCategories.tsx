'use client';

interface MarketplaceCategoriesProps {
  onExploreMoreClick: () => void;
}

export default function MarketplaceCategories({ onExploreMoreClick }: MarketplaceCategoriesProps) {
  const items = [
    {
      id: 1,
      title: 'Food',
      subtitle: 'Meals & treats',
      icon: '/real-pet-food.png',
    },
    {
      id: 2,
      title: 'Toys',
      subtitle: 'Gear & fun',
      icon: '/real-pet-toy.png',
    },
    {
      id: 3,
      title: 'Medical',
      subtitle: 'Supplements & care',
      icon: '/real-pet-med.png',
    },
    {
      id: 4,
      title: 'More',
      subtitle: 'Explore store',
      isMore: true,
    },
  ];

  return (
    <div className="w-full flex flex-col gap-3 mt-2 select-none">
      {/* Header Row */}
      <div className="flex items-center justify-between w-full border-b border-[#D8D0C0] pb-2 select-none">
        <span className="font-serif text-base sm:text-xl text-[#1C1A17] font-bold tracking-tight">
          Marketplace
        </span>
      </div>

      {/* 2x2 Grid of 4 Cards (Title on Left, Direct Photo Cutout on Right) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={onExploreMoreClick}
            className="bg-[#EFEAE2] hover:bg-[#E6E0D6] border border-[#D5CEBF] rounded-2xl sm:rounded-[24px] p-3.5 sm:p-5 flex flex-row items-center justify-between gap-2.5 h-full min-h-[96px] sm:min-h-[120px] transition-all duration-200 cursor-pointer shadow-2xs group relative overflow-hidden"
          >
            {/* Left Column: Title & Subtitle */}
            <div className="flex flex-col min-w-0 justify-center z-10 max-w-[55%]">
              <span className="font-serif text-xs sm:text-base font-bold text-[#1C1A17] leading-tight group-hover:text-[#C85341] transition-colors">
                {item.title}
              </span>
              <span className="text-[10.5px] sm:text-xs text-stone-600 font-sans font-medium mt-0.5 leading-snug">
                {item.subtitle}
              </span>
            </div>

            {/* Right Column: Direct Photo Cutout (No Circle Wrapper, Bigger Sizing) */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center z-10">
              {item.isMore ? (
                <div className="w-10 h-10 rounded-full bg-[#EAE4D8] flex items-center justify-center text-[#2D4536]">
                  <svg className="w-6 h-6 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="19" cy="12" r="1" />
                    <circle cx="5" cy="12" r="1" />
                  </svg>
                </div>
              ) : (
                <img
                  src={item.icon}
                  alt={item.title}
                  className="w-full h-full object-contain drop-shadow-xs group-hover:scale-105 transition-transform duration-300"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

