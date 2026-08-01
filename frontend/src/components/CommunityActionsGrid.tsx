'use client';

import React from 'react';
import { HeartHandshake, PlusCircle, CalendarDays } from 'lucide-react';

interface CommunityActionsGridProps {
  onAskNeighborClick?: () => void;
  onStartActivityClick?: () => void;
  onJoinEventClick?: () => void;
}

export default function CommunityActionsGrid({
  onAskNeighborClick,
  onStartActivityClick,
  onJoinEventClick
}: CommunityActionsGridProps) {
  const cards = [
    {
      id: 'ask-neighbor',
      title: 'Ask Neighbor Support',
      subtitle: 'Get help nearby',
      icon: <HeartHandshake className="w-8 h-8 md:w-9 md:h-9 text-[#A37B2C]" strokeWidth={1.8} />,
      bg: 'bg-[#FFFDF6]',
      border: 'border-[#F8EBCB]',
      onClick: onAskNeighborClick,
    },
    {
      id: 'start-activity',
      title: 'Start Activity',
      subtitle: 'Feeding, rescue or awareness',
      icon: <PlusCircle className="w-8 h-8 md:w-9 md:h-9 text-[#A37B2C]" strokeWidth={1.8} />,
      bg: 'bg-[#FFFDF6]',
      border: 'border-[#F8EBCB]',
      onClick: onStartActivityClick,
    },
    {
      id: 'join-event',
      title: 'Join Event',
      subtitle: 'Community events',
      icon: <CalendarDays className="w-8 h-8 md:w-9 md:h-9 text-[#A37B2C]" strokeWidth={1.8} />,
      bg: 'bg-[#FFFDF6]',
      border: 'border-[#F8EBCB]',
      onClick: onJoinEventClick,
    },
  ];

  return (
    <div className="w-full select-none my-1 flex flex-col gap-3">
      {/* Header Row matching brand section style */}
      <div className="flex items-center justify-between border-t border-[#F0EBE1] pt-3 mt-1 select-none">
        <span className="text-[11px] sm:text-xs uppercase tracking-widest text-[#B68A35] font-extrabold">
          Community Actions
        </span>
        <span className="text-[10px] sm:text-xs text-stone-500 font-bold">
          Get help, host & participate nearby
        </span>
      </div>

      {/* Feature Cards Grid (Single Horizontal Line Grid) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-5 w-full">
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={card.onClick}
            className={`${card.bg} ${card.border} border rounded-[20px] sm:rounded-[28px] p-2.5 sm:p-5 md:p-6 flex flex-col items-center justify-between text-center cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 min-h-[130px] sm:min-h-[160px] md:min-h-[175px]`}
          >
            {/* Top Icon Area */}
            <div className="flex-1 flex items-center justify-center pt-1 sm:pt-2">
              {card.icon}
            </div>

            {/* Bottom Text Area */}
            <div className="flex flex-col items-center justify-end pb-0.5 sm:pb-1">
              <h3 className="text-[11px] sm:text-sm md:text-base font-extrabold text-[#1C1A17] leading-tight max-w-[120px] sm:max-w-[150px]">
                {card.title}
              </h3>
              <p className="text-[10px] sm:text-[11px] md:text-xs text-stone-500 font-semibold leading-tight mt-1 line-clamp-2">
                {card.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
