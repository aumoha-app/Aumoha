import { useState, useEffect } from 'react';
import { LayoutGrid, Shield, Utensils, Stethoscope, Home, Heart, Search, PhoneCall, Building2 } from 'lucide-react';
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
  const [selectedProfileMember, setSelectedProfileMember] = useState<CircleMember | null>(null);

  // Lock background scrolling when member profile modal is active
  useEffect(() => {
    if (selectedProfileMember) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedProfileMember]);

  // Define role pills
  const rolesList: { id: MemberRole | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'ngo', label: 'NGOs' },
    { id: 'rescuer', label: 'Rescuers' },
    { id: 'feeder', label: 'Feeders' },
    { id: 'paravet', label: 'Paravets' },
    { id: 'adopter', label: 'Foster Homes' },
    { id: 'volunteer', label: 'Volunteers' }
  ];

  // Helper to resolve role colors & display text
  const getRoleColors = (role: MemberRole) => {
    switch (role) {
      case 'ngo':
        return { bg: 'bg-[#E5E0D4]', text: 'text-[#2D4536]', border: 'border-[#D3CCBE]', label: 'NGO' };
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
      ngo: 'text-terracotta',
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
      case 'ngo':
        return <Building2 className={`w-3.5 h-3.5 ${colorClass}`} />;
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

  // Filter members based on search query (name or location) and sort by distance ascending (closest first)
  const searchedMembers = filteredMembers
    .filter(
      m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.location || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => (a.distanceVal ?? Infinity) - (b.distanceVal ?? Infinity));

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
                  onClick={() => setSelectedProfileMember(member)}
                  className="bg-[#F5F2EC] hover:bg-[#EFEBE3] border border-[#EBE3D5] rounded-[24px] p-4 sm:p-5 flex items-center justify-between hover:shadow-md hover:border-stone-300 transition-all duration-300 relative group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Avatar */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-white/80 border-2 border-white/60 flex items-center justify-center shadow-inner relative shrink-0">
                      {member.avatar && member.avatar.startsWith('http') ? (
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-serif text-base sm:text-lg font-bold text-[#2D4536]">{member.name.charAt(0)}</span>
                      )}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(`Calling rescue responder ${member.name}...`);
                    }}
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

      {/* MEMBER PROFILE MODAL */}
      {selectedProfileMember && (
        <div 
          onClick={() => setSelectedProfileMember(null)}
          className="fixed inset-0 z-[4000] bg-[#1C1A17]/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-[32px] max-w-md w-full max-h-[82vh] sm:max-h-[85vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200 text-left relative flex flex-col my-auto"
          >
            
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#2D4536] to-[#4A5D4E] p-6 text-white relative shrink-0">
              <button
                onClick={() => setSelectedProfileMember(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>

              <div className="flex items-center gap-4 pt-2">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-white/20 border-2 border-white/80 flex items-center justify-center shrink-0 shadow-md relative">
                  {selectedProfileMember.avatar && selectedProfileMember.avatar.startsWith('http') ? (
                    <img src={selectedProfileMember.avatar} alt={selectedProfileMember.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-serif text-2xl font-bold text-white">{selectedProfileMember.name.charAt(0)}</span>
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif text-xl font-bold text-white leading-tight truncate">{selectedProfileMember.name}</h3>
                    {selectedProfileMember.badge && (
                      <span className="bg-amber-400/90 text-stone-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        ★ Verified
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-white/80 font-medium mt-0.5 capitalize">
                    {getRoleColors(selectedProfileMember.role).label} Community Helper
                  </span>
                </div>
              </div>
            </div>

            {/* Body Content */}
            <div className="p-6 flex flex-col gap-5 overflow-y-auto">
              
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-[#EBE3D5] rounded-2xl p-3.5 flex flex-col gap-1">
                  <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Role Type</span>
                  <span className="text-xs font-bold text-[#2D4536] capitalize">
                    {getRoleColors(selectedProfileMember.role).label}
                  </span>
                </div>

                <div className="bg-white border border-[#EBE3D5] rounded-2xl p-3.5 flex flex-col gap-1">
                  <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Tenure</span>
                  <span className="text-xs font-bold text-stone-700">
                    {selectedProfileMember.joinedTime ? `${selectedProfileMember.joinedTime} days active` : 'Active Helper'}
                  </span>
                </div>
              </div>

              {/* Location Box */}
              <div className="bg-white border border-[#EBE3D5] rounded-2xl p-4 flex flex-col gap-1.5">
                <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-[#2D4536]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Primary Area / Location
                </span>
                <p className="text-xs font-semibold text-stone-800 leading-relaxed">
                  {(selectedProfileMember.location || 'Saheed Nagar, Rourkela, Odisha').replace(/\[.*?\]/g, '').trim()}
                </p>
                {selectedProfileMember.distance && (
                  <span className="text-[10px] font-bold text-[#2D4536] bg-[#E8F5E9] border border-[#C8E6C9] px-2 py-0.5 rounded-md self-start mt-1">
                    📍 {selectedProfileMember.distance} away
                  </span>
                )}
              </div>

              {/* Bio / Impact Note */}
              <div className="bg-[#FAF6F0] border border-[#EBE3D5] rounded-2xl p-4">
                <span className="text-[10px] font-extrabold text-[#2D4536] uppercase tracking-wider block mb-1">About Helper</span>
                <p className="text-xs text-stone-600 font-medium leading-relaxed">
                  Verified animal welfare volunteer in the Mohalla Network. Active responder for local feeding drives, rescue calls, and emergency assistance.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => {
                    alert(`Connecting call to ${selectedProfileMember.name}...`);
                  }}
                  className="flex-1 py-3 bg-[#2D4536] hover:bg-[#1E2E24] text-white text-xs font-extrabold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call {selectedProfileMember.name.split(' ')[0]}</span>
                </button>

                <button
                  onClick={() => setSelectedProfileMember(null)}
                  className="px-5 py-3 bg-white border border-[#D5CEBF] hover:bg-[#FAF8F5] text-stone-700 text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-2xs"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
