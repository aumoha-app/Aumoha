"use client";

import { useState } from 'react';
import PetCareServices, { ServiceType } from './PetCareServices';

const FILTERS: ServiceType[] = ['All', 'Grooming', 'Boarding', 'Walking', 'Training'];

export default function PetCareFeature() {
  const [activeFilter, setActiveFilter] = useState<ServiceType>('All');

  return (
    <main className="w-full max-w-2xl mx-auto bg-white rounded-3xl p-4 md:p-8 flex flex-col gap-6 shadow-sm transition-all duration-300">
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#F0F7EE] px-3 py-2 text-[11px] font-bold text-[#3D6B41] tracking-[0.22em] uppercase select-none w-fit">
            🐾 Pet Care
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-[#1C1A17] leading-tight">Grooming, boarding, walking, and training</h1>
          <p className="max-w-2xl text-sm md:text-base text-stone-600 font-medium leading-relaxed">
            Explore trusted local caregivers and specialists for every pet care need. Select a service type to find the right match quickly.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full px-4 py-2 text-xs md:text-sm font-semibold transition-all duration-200 border border-[#D4E8D0] ${
                activeFilter === filter ? 'bg-[#E0F2DD] text-[#3D6B41] shadow-sm' : 'bg-white text-stone-600 hover:bg-[#F5FAF3]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      <PetCareServices activeFilter={activeFilter} />

      <section className="rounded-[28px] border border-[#E0E8DD] bg-[#F5FAF3] p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm md:text-base font-bold text-[#1C1A17]">Need help choosing?</p>
          <p className="text-xs md:text-sm text-stone-600">Our advisors can match your pet with the right care plan.</p>
        </div>
        <button className="rounded-xl bg-[#4A9D6F] px-5 py-3 text-sm font-bold text-white hover:bg-[#3D7A56] transition-all">
          Chat Now
        </button>
      </section>
    </main>
  );
}

