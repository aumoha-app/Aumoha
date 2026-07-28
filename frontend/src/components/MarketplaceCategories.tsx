'use client';

interface MarketplaceCategoriesProps {
  onExploreMoreClick: () => void;
}

export default function MarketplaceCategories({ onExploreMoreClick }: MarketplaceCategoriesProps) {
  const items = [
    {
      id: 1,
      title: 'Food',
      icon: '/marketplace-food.png',
    },
    {
      id: 2,
      title: 'Toys',
      icon: '/marketplace-toys.png',
    },
    {
      id: 3,
      title: 'Medical',
      icon: '/marketplace-med.png',
    },
  ];

  return (
    <div className="w-full flex flex-col gap-3 mt-1 select-none">
      {/* Header Row: Title & Explore More Button */}
      <div className="flex items-center justify-between w-full border-b border-warmBeige/40 pb-2 select-none">
        <span className="text-[10px] md:text-xs uppercase tracking-widest text-[#B68A35] font-bold">Market Categories</span>
        <button 
          onClick={onExploreMoreClick}
          className="text-[10px] md:text-xs text-stone-400 font-bold hover:text-clay transition-all duration-200 cursor-pointer flex items-center gap-1 leading-none"
        >
          Explore More <span className="text-xs md:text-sm font-light">→</span>
        </button>
      </div>

      {/* 3-Column Compact Bubble Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 w-full py-1">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={onExploreMoreClick}
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

