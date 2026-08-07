import { useState } from 'react';
import { LayoutGrid, Shield, Utensils, Stethoscope, Home, Heart, Search, PhoneCall } from 'lucide-react';
import { CircleMember, MemberRole } from '../types';
import RadiusSelector from './RadiusSelector';

interface MohallaNetworkProps {
  computedMembers: CircleMember[];
  dbSosReports: any[];
  resolvedSosCount?: number;
  memberFilter: MemberRole | 'all';
  setMemberFilter: (filter: MemberRole | 'all') => void;
  selectedRadius?: number;
  onSelectRadius?: (radiusKm: number) => void;
}

export default function MohallaNetwork({
  computedMembers,
  dbSosReports,
  resolvedSosCount = 0,
  memberFilter,
  setMemberFilter,
  selectedRadius = 10,
  onSelectRadius
}: MohallaNetworkProps) {
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
        return { bg: 'bg-[#E5E0D4]', text: 'text-[#2D4536]', border: 'border-[#D3CCBE]', label: 'Feeder' };
      case 'rescuer':
        return { bg: 'bg-[#E5E0D4]', text: 'text-[#2D4536]', border: 'border-[#D3CCBE]', label: 'Rescuer' };
      case 'volunteer':
        return { bg: 'bg-[#E5E0D4]', text: 'text-[#2D4536]', border: 'border-[#D3CCBE]', label: 'Volunteer' };
      case 'paravet':
        return { bg: 'bg-[#E5E0D4]', text: 'text-[#2D4536]', border: 'border-[#D3CCBE]', label: 'Paravet' };
      case 'adopter':
        return { bg: 'bg-[#E5E0D4]', text: 'text-[#2D4536]', border: 'border-[#D3CCBE]', label: 'Foster Home' };
      case 'official':
        return { bg: 'bg-[#E5E0D4]', text: 'text-[#2D4536]', border: 'border-[#D3CCBE]', label: 'Official' };
      default:
        return { bg: 'bg-[#E5E0D4]', text: 'text-[#2D4536]', border: 'border-[#D3CCBE]', label: 'Member' };
    }
  };

  const getFilterIcon = (id: MemberRole | 'all', isActive: boolean) => {
    const colorClass = isActive ? 'text-white' : {
      all: 'text-stone-500',
      rescuer: 'text-terracotta',
      feeder: 'text-terracotta',
      paravet: 'text-terracotta',
      adopter: 'text-clay',
      volunteer: 'text-clay',
      normal: 'text-stone-500',
      official: 'text-terracotta'
    }[id];

    switch (id) {
      case 'all':
        return <LayoutGrid className={`w-3.5 h-3.5 ${colorClass}`} />;
      case 'rescuer':
        return <Shield className={`w-3.5 h-3.5 ${colorClass}`} />;
      case 'feeder':
        return <Utensils className={`w-3.5 h-3.5 ${colorClass}`} />;
      case 'paravet':
        return <Stethoscope className={`w-3.5 h-3.5 ${colorClass}`} />;
      case 'adopter':
        return <Home className={`w-3.5 h-3.5 ${colorClass}`} />;
      case 'volunteer':
        return <Heart className={`w-3.5 h-3.5 ${colorClass}`} />;
      default:
        return null;
    }
  };

  const radiusMeters = selectedRadius === 0 ? Infinity : selectedRadius * 1000;

  // Filter members based on selected role filter and radius
  const filteredMembers = computedMembers.filter(m => {
    if (m.role === 'normal' || m.role as string === 'member') return false;
    if (selectedRadius !== 0 && m.distanceVal !== undefined && m.distanceVal > radiusMeters) return false;
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
    <div className="w-full flex flex-col gap-5 animate-scaleIn select-none">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-1 px-1">
        <h2 className="font-serif text-lg sm:text-xl font-bold text-charcoal">Mohalla Circle Network</h2>
        <p className="text-xs sm:text-sm text-stone-500 font-medium leading-relaxed">
          Find and coordinate with verified helpers, rescuers, paravets, and feeders in your local community.
        </p>
      </div>

      {/* RADIUS SELECTOR BAR */}
      {onSelectRadius && (
        <div className="w-full bg-[#F5F2EC] border border-[#EBE3D5] rounded-2xl p-3 shadow-2xs">
          <RadiusSelector
            selectedRadius={selectedRadius}
            onSelectRadius={onSelectRadius}
          />
        </div>
      )}

      {/* STATS STRIP CARD (#F5F2EC Box Color with clean spacing) */}
      <div className="bg-[#F5F2EC] border border-[#EBE3D5] rounded-[24px] p-4 sm:p-5 shadow-xs flex items-center justify-between text-center divide-x divide-[#EBE3D5]">
        <div className="flex-1 px-1 flex flex-col items-center">
          <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-stone-500">Total Members</span>
          <span className="font-serif text-2xl sm:text-3xl font-extrabold text-terracotta mt-1">
            {computedMembers.filter(m => m.role !== 'normal' && m.role as string !== 'member').length}
          </span>
        </div>
        <div className="flex-1 px-1 flex flex-col items-center">
          <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-stone-500">Resolved SOS</span>
          <span className="font-serif text-2xl sm:text-3xl font-extrabold text-clay mt-1">
            {resolvedSosCount}
          </span>
        </div>
        <div className="flex-1 px-1 flex flex-col items-center">
          <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-stone-500">Active SOS</span>
          <span className="font-serif text-2xl sm:text-3xl font-extrabold text-emergency mt-1">{activeSosCount}</span>
        </div>
      </div>

      {/* ROLE FILTER TABS / PILLS */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {rolesList.map(r => {
          const isActive = memberFilter === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setMemberFilter(r.id)}
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full border transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#3D5A45] border-[#3D5A45] text-white shadow-xs'
                  : 'bg-[#F5F2EC] border-[#EBE3D5] text-stone-600 hover:bg-[#EFEBE3]'
              }`}
            >
              {getFilterIcon(r.id, isActive)}
              <span>{r.label}</span>
            </button>
          );
        })}
      </div>

      {/* SEARCH BAR (#F5F2EC Box Color) */}
      <div className="relative w-full">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-stone-400" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${memberFilter === 'all' ? 'members' : memberFilter + 's'} by name or location...`}
          className="w-full pl-10 pr-4 py-2.5 bg-[#F5F2EC] border border-[#EBE3D5] rounded-2xl text-xs sm:text-sm font-semibold text-charcoal placeholder-stone-400 focus:outline-none focus:border-[#3D5A45]/50 transition-colors shadow-inner"
        />
      </div>

      {/* LIST OF MEMBERS */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-serif text-sm sm:text-base font-bold text-charcoal tracking-wide">
            Verified {memberFilter === 'all' ? 'Circle Members' : `${rolesList.find(rl => rl.id === memberFilter)?.label}`} ({searchedMembers.length})
          </h3>
        </div>

        {searchedMembers.length > 0 ? (
          <div className="grid grid-cols-1 gap-3.5">
            {searchedMembers.map(member => {
              const roleDetails = getRoleColors(member.role);
              return (
                <div
                  key={member.id}
                  className="bg-[#F5F2EC] hover:bg-[#EFEBE3] border border-[#EBE3D5] rounded-[24px] p-4 sm:p-5 flex items-center justify-between hover:shadow-md hover:border-stone-300 transition-all duration-300 relative group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Avatar with dynamic ring */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-white/80 border-2 border-white/60 flex items-center justify-center shadow-inner relative shrink-0">
                      {member.avatar && member.avatar.startsWith('http') ? (
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-serif text-base sm:text-lg font-bold text-[#2D4536]">{member.name.charAt(0)}</span>
                      )}
                      {/* Active/Online indicator dot */}
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
                    </div>

                    {/* Name and Info */}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif text-base font-bold text-charcoal">{member.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleDetails.bg} ${roleDetails.text} ${roleDetails.border}`}>
                          {roleDetails.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-stone-600 font-semibold max-w-[220px] sm:max-w-md">
                        <span className="line-clamp-2 leading-snug">
                          {(member.location || 'Saheed Nagar').replace(/\[.*?\]/g, '').trim()}
                        </span>
                      </div>

                      {member.joinedTime && (
                        <span className="text-[11px] text-stone-400 font-medium mt-0.5">
                          Active helper for {member.joinedTime} days
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dispatch / Contact CTA */}
                  <button
                    onClick={() => alert(`Calling rescue responder ${member.name}...`)}
                    className="p-3 bg-white/80 text-[#2D4536] hover:bg-[#2D4536] hover:text-white rounded-full transition-all duration-200 shadow-xs shrink-0 active:scale-95 border border-white/60 cursor-pointer"
                    aria-label={`Call ${member.name}`}
                  >
                    <PhoneCall className="w-4 h-4 text-current" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#F5F2EC] border border-[#EBE3D5] rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-2 shadow-xs">
            <span className="text-3xl">👥</span>
            <h4 className="font-serif text-base font-bold text-charcoal">No members found</h4>
            <p className="text-xs sm:text-sm text-stone-500 max-w-xs">
              No verified members match your search or filters. Try adjusting the search query or coordinates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
