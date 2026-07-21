'use client';

import { useState } from 'react';
import { CircleMember } from '../types';

interface MohallaNetworkProps {
  computedMembers: CircleMember[];
  dbSosReports: any[];
}

export default function MohallaNetwork({ computedMembers, dbSosReports }: MohallaNetworkProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Only show members with the role of 'rescuer'
  const rescuers = computedMembers.filter(m => m.role === 'rescuer');

  // Filter rescuers based on search query (name or location)
  const filteredRescuers = rescuers.filter(
    r =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.location || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSosCount = dbSosReports.filter(r => r.status === 'active' || r.status === 'dispatched').length;

  return (
    <div className="w-full flex flex-col gap-6 animate-scaleIn select-none">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-1 px-1">
        <h2 className="text-xl font-bold text-charcoal">Rescuers Network</h2>
        <p className="text-xs text-stone-500 font-medium leading-relaxed">
          Verified animal rescue experts in your area ready to respond to emergency dispatch calls.
        </p>
      </div>

      {/* STATS STRIP CARD */}
      <div className="bg-white border border-[#F0EBE1] rounded-[24px] p-5 shadow-xs flex items-center justify-between text-center divide-x divide-stone-100">
        <div className="flex-1 flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-400">Total Rescuers</span>
          <span className="text-2xl font-bold text-[#3D5A45] mt-1">{rescuers.length}</span>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-400">Available Now</span>
          <span className="text-2xl font-bold text-[#2E7D32] mt-1">
            {rescuers.length > 0 ? rescuers.length : 0}
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-400">Active SOS</span>
          <span className="text-2xl font-bold text-[#C85341] mt-1">{activeSosCount}</span>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative w-full">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search rescuers by name or location..."
          className="w-full pl-10 pr-4 py-3 bg-[#FDFBF8] border border-[#F0EBE1] rounded-2xl text-xs font-bold text-charcoal placeholder-stone-400 focus:outline-none focus:border-[#3D5A45]/40 transition-colors shadow-inner"
        />
      </div>

      {/* LIST OF RESCUERS */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-extrabold text-stone-400 uppercase tracking-wider">
            Verified Rescuers ({filteredRescuers.length})
          </h3>
        </div>

        {filteredRescuers.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredRescuers.map(rescuer => (
              <div
                key={rescuer.id}
                className="bg-white border border-[#F0EBE1] rounded-[24px] p-5 flex items-center justify-between hover:shadow-md hover:border-[#3D5A45]/30 transition-all duration-300 relative group"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar with dynamic ring */}
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-[#3D5A45]/5 to-[#B68A35]/5 border-2 border-[#EBE3D5] flex items-center justify-center shadow-inner relative shrink-0">
                    {rescuer.avatar && rescuer.avatar.startsWith('http') ? (
                      <img src={rescuer.avatar} alt={rescuer.name} className="w-full h-full object-cover" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-[#2E7D32]">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    )}
                    {/* Active/Online indicator dot */}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
                  </div>

                  {/* Name and Info */}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-charcoal">{rescuer.name}</span>
                      {rescuer.badge === 'trusted' && (
                        <span className="text-[9px] font-extrabold text-[#2E7D32] bg-[#E8F5E9] px-1.5 py-0.5 rounded border border-[#C8E6C9]">
                          Γ£ô Trusted
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-bold">
                      <span>{rescuer.location || 'Saheed Nagar'}</span>
                    </div>

                    {rescuer.joinedTime && (
                      <span className="text-[9px] text-stone-400 font-semibold mt-1">
                        Active helper for {rescuer.joinedTime} days
                      </span>
                    )}
                  </div>
                </div>

                {/* Dispatch / Contact CTA */}
                <button
                  onClick={() => alert(`Calling rescue responder ${rescuer.name}...`)}
                  className="p-3 bg-[#E8EFE9] text-[#2D4536] hover:bg-[#3D5A45] hover:text-white rounded-full transition-all duration-200 shadow-xs shrink-0 active:scale-95 border border-[#C8E6C9]/40"
                  aria-label={`Call ${rescuer.name}`}
                >
                  <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#FDFBF8] border border-[#F0EBE1] rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-2 shadow-xs">
            <span className="text-3xl">≡ƒ¢í∩╕Å</span>
            <h4 className="text-sm font-bold text-charcoal">No rescuers found</h4>
            <p className="text-xs text-stone-400 font-semibold max-w-xs">
              No verified rescuers match your search. Try adjusting the search query or coordinates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
