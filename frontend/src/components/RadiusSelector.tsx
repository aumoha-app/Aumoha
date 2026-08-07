'use client';

import React from 'react';

interface RadiusSelectorProps {
  selectedRadius: number; // in km (1, 2, 5, 10, 25, or 0 for All)
  onSelectRadius: (radiusKm: number) => void;
  className?: string;
}

export function RadiusSelector({ selectedRadius, onSelectRadius, className = '' }: RadiusSelectorProps) {
  const options = [
    { value: 1, label: '1 km' },
    { value: 5, label: '5 km' },
    { value: 10, label: '10 km' },
    { value: 25, label: '25 km' },
    { value: 0, label: 'All' }
  ];

  return (
    <div className={`flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-hide select-none ${className}`}>
      <span className="font-serif text-sm font-bold text-[#2D4536] shrink-0">
        Radius:
      </span>
      <div className="flex items-center gap-1.5 shrink-0">
        {options.map((opt) => {
          const isSelected = selectedRadius === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelectRadius(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-2xs border ${
                isSelected
                  ? 'bg-[#FDF6ED] text-[#9A4B1A] border-[#E89552] ring-1 ring-[#E89552]/40 shadow-xs'
                  : 'bg-[#F5F2EC] text-stone-600 border-[#EBE3D5] hover:bg-[#EFEBE3] hover:text-stone-900'
              }`}
            >
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default RadiusSelector;
