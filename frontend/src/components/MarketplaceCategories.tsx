'use client';

interface MarketplaceCategoriesProps {
  onExploreMoreClick: () => void;
}

export default function MarketplaceCategories({ onExploreMoreClick }: MarketplaceCategoriesProps) {
  return (
    <div className="w-full flex flex-col gap-3 mt-1">
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

      {/* 3-Column Responsive Grid (No overflow, fits completely) */}
      <div className="grid grid-cols-3 gap-2.5 md:gap-4 w-full">
        {/* Category 1: Food */}
        <div 
          onClick={onExploreMoreClick}
          className="bg-[#FCFAF7] border border-warmBeige rounded-[16px] md:rounded-[20px] p-3 md:p-5 flex flex-col items-center md:items-start gap-2.5 md:gap-4 hover:border-clay/40 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md group"
        >
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#F3EDE4] flex items-center justify-center text-clay transition-colors group-hover:bg-[#EAE1D5] shrink-0">
            <svg viewBox="0 0 24 24" width="18" height="18" className="md:w-5 md:h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h18M3 12a9 9 0 0 0 18 0M6 12v3a6 6 0 0 0 12 0v-3" />
            </svg>
          </div>
          <div className="flex flex-col items-center md:items-start gap-0.5 text-center md:text-left">
            <h3 className="text-xs md:text-sm font-bold text-charcoal leading-tight">Food</h3>
            <p className="text-[9px] md:text-xs text-stone-500 leading-tight mt-0.5 md:mt-1 font-medium">Healthy & natural</p>
          </div>
        </div>

        {/* Category 2: Toys */}
        <div 
          onClick={onExploreMoreClick}
          className="bg-[#FCFAF7] border border-warmBeige rounded-[16px] md:rounded-[20px] p-3 md:p-5 flex flex-col items-center md:items-start gap-2.5 md:gap-4 hover:border-clay/40 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md group"
        >
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#F3EDE4] flex items-center justify-center text-clay transition-colors group-hover:bg-[#EAE1D5] shrink-0">
            <svg viewBox="0 0 24 24" width="18" height="18" className="md:w-5 md:h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M6.2 6.2c2.4 2.4 2.4 6.4 0 8.8M17.8 6.2c-2.4 2.4-2.4 6.4 0 8.8" />
            </svg>
          </div>
          <div className="flex flex-col items-center md:items-start gap-0.5 text-center md:text-left">
            <h3 className="text-xs md:text-sm font-bold text-charcoal leading-tight">Toys</h3>
            <p className="text-[9px] md:text-xs text-stone-500 leading-tight mt-0.5 md:mt-1 font-medium">Enrichment & fun</p>
          </div>
        </div>

        {/* Category 3: Medical */}
        <div 
          onClick={onExploreMoreClick}
          className="bg-[#FCFAF7] border border-warmBeige rounded-[16px] md:rounded-[20px] p-3 md:p-5 flex flex-col items-center md:items-start gap-2.5 md:gap-4 hover:border-clay/40 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md group"
        >
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#F3EDE4] flex items-center justify-center text-clay transition-colors group-hover:bg-[#EAE1D5] shrink-0">
            <svg viewBox="0 0 24 24" width="18" height="18" className="md:w-5 md:h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </div>
          <div className="flex flex-col items-center md:items-start gap-0.5 text-center md:text-left">
            <h3 className="text-xs md:text-sm font-bold text-charcoal leading-tight">Medical</h3>
            <p className="text-[9px] md:text-xs text-stone-500 leading-tight mt-0.5 md:mt-1 font-medium">Health & essentials</p>
          </div>
        </div>

        {/* Category 4: Care & Grooming */}
        <div 
          onClick={onExploreMoreClick}
          className="bg-[#FCFAF7] border border-warmBeige rounded-[16px] md:rounded-[20px] p-3 md:p-5 flex flex-col items-center md:items-start gap-2.5 md:gap-4 hover:border-clay/40 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md group"
        >
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#F3EDE4] flex items-center justify-center text-clay transition-colors group-hover:bg-[#EAE1D5] shrink-0">
            <svg viewBox="0 0 24 24" width="18" height="18" className="md:w-5 md:h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7.5C4 5.57 5.57 4 7.5 4h9c1.93 0 3.5 1.57 3.5 3.5v9c0 1.93-1.57 3.5-3.5 3.5h-9C5.57 20 4 18.43 4 16.5v-9ZM8 9.5h8M8 12.5h8M8 15.5h5" />
            </svg>
          </div>
          <div className="flex flex-col items-center md:items-start gap-0.5 text-center md:text-left">
            <h3 className="text-xs md:text-sm font-bold text-charcoal leading-tight">Care & Grooming</h3>
            <p className="text-[9px] md:text-xs text-stone-500 leading-tight mt-0.5 md:mt-1 font-medium">Grooming, boarding, walking & training</p>
          </div>
        </div>
      </div>
    </div>
  );
}
