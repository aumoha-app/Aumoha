'use client';

import { useState } from 'react';
import { CircleMember, MemberRole } from '../types';

interface MohallaNetworkProps {
  computedMembers: CircleMember[];
  dbSosReports: any[];
  resolvedSosCount?: number;
  memberFilter: MemberRole | 'all';
  setMemberFilter: (filter: MemberRole | 'all') => void;
}

export default function MohallaNetwork({ computedMembers, dbSosReports, resolvedSosCount = 0, memberFilter, setMemberFilter }: MohallaNetworkProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Define role pills
  const rolesList: { id: MemberRole | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'rescuer', label: 'Rescuers' },
    { id: 'feeder', label: 'Feeders' },
    { id: 'paravet', label: 'Paravets' },
    { id: 'adopter', label: 'Foster Homes' },
    { id: 'volunteer', label: 'Volunteers' }
  ];

  // Helper to resolve role colors & display text
  const getRoleColors = (role: MemberRole) => {
    switch (role) {
      case 'feeder':
        return { bg: 'bg-[#FFF3E0]', text: 'text-[#E65100]', border: 'border-[#FFE0B2]', label: 'Feeder', icon: '🥣' };
      case 'rescuer':
        return { bg: 'bg-[#E8F5E9]', text: 'text-[#2E7D32]', border: 'border-[#C8E6C9]', label: 'Rescuer', icon: '🛡️' };
      case 'volunteer':
        return { bg: 'bg-[#E3F2FD]', text: 'text-[#0D47A1]', border: 'border-[#BBDEFB]', label: 'Volunteer', icon: '❤️' };
      case 'paravet':
        return { bg: 'bg-[#F3E5F5]', text: 'text-[#7B1FA2]', border: 'border-[#E1BEE7]', label: 'Paravet', icon: '🩺' };
      case 'adopter':
        return { bg: 'bg-[#E0F2F1]', text: 'text-[#004D40]', border: 'border-[#B2DFDB]', label: 'Foster Home', icon: '🏠' };
      case 'official':
        return { bg: 'bg-[#FFF8E1]', text: 'text-[#B68A35]', border: 'border-[#FFE082]', label: 'Official', icon: '✦' };
      default:
        return { bg: 'bg-[#ECEFF1]', text: 'text-[#37474F]', border: 'border-[#CFD8DC]', label: 'Member', icon: '👤' };
    }
  };

  const getFilterIcon = (id: MemberRole | 'all', isActive: boolean) => {
    const colorClass = isActive ? 'text-white' : {
      all: 'text-stone-500',
      rescuer: 'text-[#2E7D32]',
      feeder: 'text-[#E65100]',
      paravet: 'text-[#7B1FA2]',
      adopter: 'text-[#004D40]',
      volunteer: 'text-[#0D47A1]',
      normal: 'text-stone-500',
      official: 'text-[#B68A35]'
    }[id];

    switch (id) {
      case 'all':
        return (
          <svg className={`w-3.5 h-3.5 ${colorClass}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
        );
      case 'rescuer':
        return (
          <svg className={`w-3.5 h-3.5 ${colorClass}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        );
      case 'feeder':
        return (
          <svg className={`w-3.5 h-3.5 ${colorClass}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M12 2v4M12 18h.01M3 20h18M5 10a7 7 0 0 0 14 0H5z" />
          </svg>
        );
      case 'paravet':
        return (
          <svg className={`w-3.5 h-3.5 ${colorClass}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M4.82 17.22a3 3 0 1 1-3-3m0 0v-4a7 7 0 0 1 14 0v4m0-4V6a2 2 0 0 1 2-2h2m-6 13.22a3 3 0 1 1 3-3" />
          </svg>
        );
      case 'adopter':
        return (
          <svg className={`w-3.5 h-3.5 ${colorClass}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      case 'volunteer':
        return (
          <svg className={`w-3.5 h-3.5 ${colorClass}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Filter members based on selected role filter
  const filteredMembers = computedMembers.filter(m => {
    if (m.role === 'normal' || m.role as string === 'member') return false;
    if (memberFilter !== 'all' && m.role !== memberFilter) return false;
    return true;
  });

  // Filter members based on search query (name or location)
  const searchedMembers = filteredMembers.filter(
    m =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.location || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSosCount = dbSosReports.filter(r => r.status === 'active').length;

  return (
    <div className="w-full flex flex-col gap-6 animate-scaleIn select-none">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-1 px-1">
        <h2 className="text-xl font-bold text-charcoal">Mohalla Circle Network</h2>
        <p className="text-xs text-stone-500 font-medium leading-relaxed">
          Find and coordinate with verified helpers, rescuers, paravets, and feeders in your local community.
        </p>
      </div>

      {/* STATS STRIP CARD */}
      <div className="bg-white border border-[#F0EBE1] rounded-[24px] p-5 shadow-xs flex items-center justify-between text-center divide-x divide-stone-100">
        <div className="flex-1 flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-400">Total Members</span>
          <span className="text-2xl font-bold text-[#3D5A45] mt-1">
            {computedMembers.filter(m => m.role !== 'normal' && m.role as string !== 'member').length}
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-400">Resolved SOS</span>
          <span className="text-2xl font-bold text-[#2E7D32] mt-1">
            {resolvedSosCount}
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-400">Active SOS</span>
          <span className="text-2xl font-bold text-[#C85341] mt-1">{activeSosCount}</span>
        </div>
      </div>

      {/* ROLE FILTER TABS / PILLS */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
        {rolesList.map(r => {
          const isActive = memberFilter === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setMemberFilter(r.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#3D5A45] border-[#3D5A45] text-white shadow-sm'
                  : 'bg-white border-[#F0EBE1] text-stone-500 hover:bg-stone-50'
              }`}
            >
              {getFilterIcon(r.id, isActive)}
              <span>{r.label}</span>
            </button>
          );
        })}
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
          placeholder={`Search ${memberFilter === 'all' ? 'members' : memberFilter + 's'} by name or location...`}
          className="w-full pl-10 pr-4 py-3 bg-[#FDFBF8] border border-[#F0EBE1] rounded-2xl text-xs font-bold text-charcoal placeholder-stone-400 focus:outline-none focus:border-[#3D5A45]/40 transition-colors shadow-inner"
        />
      </div>

      {/* LIST OF MEMBERS */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-extrabold text-stone-400 uppercase tracking-wider">
            Verified {memberFilter === 'all' ? 'Circle Members' : `${rolesList.find(rl => rl.id === memberFilter)?.label}`} ({searchedMembers.length})
          </h3>
        </div>

        {searchedMembers.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {searchedMembers.map(member => {
              const roleDetails = getRoleColors(member.role);
              return (
                <div
                  key={member.id}
                  className="bg-white border border-[#F0EBE1] rounded-[24px] p-5 flex items-center justify-between hover:shadow-md hover:border-[#3D5A45]/30 transition-all duration-300 relative group"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar with dynamic ring */}
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-[#3D5A45]/5 to-[#B68A35]/5 border-2 border-[#EBE3D5] flex items-center justify-center shadow-inner relative shrink-0">
                      {member.avatar && member.avatar.startsWith('http') ? (
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">{roleDetails.icon}</span>
                      )}
                      {/* Active/Online indicator dot */}
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
                    </div>

                    {/* Name and Info */}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-charcoal">{member.name}</span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${roleDetails.bg} ${roleDetails.text} ${roleDetails.border}`}>
                          {roleDetails.icon} {roleDetails.label}
                        </span>
                        {member.badge === 'trusted' && (
                          <span className="text-[9px] font-extrabold text-[#2E7D32] bg-[#E8F5E9] px-1.5 py-0.5 rounded border border-[#C8E6C9]">
                            ✓ Trusted
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-bold">
                        <span>{member.location || 'Saheed Nagar'}</span>
                      </div>

                      {member.joinedTime && (
                        <span className="text-[9px] text-stone-400 font-semibold mt-1">
                          Active helper for {member.joinedTime} days
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dispatch / Contact CTA */}
                  <button
                    onClick={() => alert(`Calling rescue responder ${member.name}...`)}
                    className="p-3 bg-[#E8EFE9] text-[#2D4536] hover:bg-[#3D5A45] hover:text-white rounded-full transition-all duration-200 shadow-xs shrink-0 active:scale-95 border border-[#C8E6C9]/40"
                    aria-label={`Call ${member.name}`}
                  >
                    <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#FDFBF8] border border-[#F0EBE1] rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-2 shadow-xs">
            <span className="text-3xl">👥</span>
            <h4 className="text-sm font-bold text-charcoal">No members found</h4>
            <p className="text-xs text-stone-400 font-semibold max-w-xs">
              No verified members match your search or filters. Try adjusting the search query or coordinates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
