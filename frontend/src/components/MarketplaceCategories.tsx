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
          className="bg-[#FCFAF7] border border-[#EBE3D5]/65 rounded-[18px] md:rounded-[22px] px-2 py-4 md:p-4.5 flex flex-col items-center justify-center hover:border-blue-500/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md group"
        >
          {/* Circle container for icon */}
          <div className="w-11 h-11 md:w-14 md:h-14 rounded-full bg-white border border-[#EBE3D5] flex items-center justify-center transition-colors group-hover:bg-[#FCFAF7] shadow-sm overflow-hidden">
            <img 
              src="/marketplace-food.png" 
              alt="Food" 
              className="w-7 h-7 md:w-9 md:h-9 object-contain"
            />
          </div>
          
          {/* Title and Badge */}
          <div className="flex flex-row items-center gap-1.5 justify-center mt-3.5 md:mt-4 w-full">
            <div className="hidden md:flex w-4 h-4 md:w-4.5 md:h-4.5 rounded-full bg-[#D95D39] text-white items-center justify-center text-[9px] md:text-[10px] font-bold shadow-sm select-none shrink-0">
              1
            </div>
            <h3 className="text-[10px] md:text-xs font-bold text-charcoal leading-tight text-center md:text-left whitespace-normal md:whitespace-nowrap">Marketplace - Food</h3>
          </div>
          
          {/* Decorative Divider Line */}
          <div className="hidden md:block w-6 h-[1.5px] bg-gradient-to-r from-orange-400 to-[#D95D39] rounded-full mt-1.5" />
          
          {/* Description */}
          <p className="hidden md:block text-center text-[9px] md:text-[10.5px] text-[#4A453E] font-medium mt-2 md:mt-2.5 leading-relaxed max-w-[130px]">
            Nutritious food,<br />trusted brands.
          </p>
        </div>

        {/* Category 2: Toys */}
        <div 
          onClick={onExploreMoreClick}
          className="bg-[#FCFAF7] border border-[#EBE3D5]/65 rounded-[18px] md:rounded-[22px] px-2 py-4 md:p-4.5 flex flex-col items-center justify-center hover:border-yellow-500/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md group"
        >
          {/* Circle container for icon */}
          <div className="w-11 h-11 md:w-14 md:h-14 rounded-full bg-white border border-[#EBE3D5] flex items-center justify-center transition-colors group-hover:bg-[#FCFAF7] shadow-sm overflow-hidden">
            <img 
              src="/marketplace-toys.png" 
              alt="Toys" 
              className="w-7 h-7 md:w-9 md:h-9 object-contain"
            />
          </div>
          
          {/* Title and Badge */}
          <div className="flex flex-row items-center gap-1.5 justify-center mt-3.5 md:mt-4 w-full">
            <div className="hidden md:flex w-4 h-4 md:w-4.5 md:h-4.5 rounded-full bg-[#D99B26] text-white items-center justify-center text-[9px] md:text-[10px] font-bold shadow-sm select-none shrink-0">
              2
            </div>
            <h3 className="text-[10px] md:text-xs font-bold text-charcoal leading-tight text-center md:text-left whitespace-normal md:whitespace-nowrap">Marketplace - Toys</h3>
          </div>
          
          {/* Decorative Divider Line */}
          <div className="hidden md:block w-6 h-[1.5px] bg-gradient-to-r from-yellow-400 to-[#D99B26] rounded-full mt-1.5" />
          
          {/* Description */}
          <p className="hidden md:block text-center text-[9px] md:text-[10.5px] text-[#4A453E] font-medium mt-2 md:mt-2.5 leading-relaxed max-w-[130px]">
            Fun, safe and<br />enriching essentials.
          </p>
        </div>

        {/* Category 3: Medical */}
        <div 
          onClick={onExploreMoreClick}
          className="bg-[#FCFAF7] border border-[#EBE3D5]/65 rounded-[18px] md:rounded-[22px] px-2 py-4 md:p-4.5 flex flex-col items-center justify-center hover:border-teal-500/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md group"
        >
          {/* Circle container for icon */}
          <div className="w-11 h-11 md:w-14 md:h-14 rounded-full bg-white border border-[#EBE3D5] flex items-center justify-center transition-colors group-hover:bg-[#FCFAF7] shadow-sm overflow-hidden">
            <img 
              src="/marketplace-med.png" 
              alt="Medical" 
              className="w-7 h-7 md:w-9 md:h-9 object-contain"
            />
          </div>
          
          {/* Title and Badge */}
          <div className="flex flex-row items-center gap-1.5 justify-center mt-3.5 md:mt-4 w-full">
            <div className="hidden md:flex w-4 h-4 md:w-4.5 md:h-4.5 rounded-full bg-[#138A8A] text-white items-center justify-center text-[9px] md:text-[10px] font-bold shadow-sm select-none shrink-0">
              3
            </div>
            <h3 className="text-[10px] md:text-xs font-bold text-charcoal leading-tight text-center md:text-left whitespace-normal md:whitespace-nowrap">Marketplace - Medical</h3>
          </div>
          
          {/* Decorative Divider Line */}
          <div className="hidden md:block w-6 h-[1.5px] bg-gradient-to-r from-teal-400 to-[#138A8A] rounded-full mt-1.5" />
          
          {/* Description */}
          <p className="hidden md:block text-center text-[7.8px] md:text-[9.2px] text-[#4A453E] font-medium mt-2 md:mt-2.5 leading-snug max-w-[130px]">
            Medicines, supplements<br />& vet-prescribed essentials.
          </p>
        </div>
      </div>
    </div>
  );
}
