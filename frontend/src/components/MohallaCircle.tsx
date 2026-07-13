'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  CircleMember, 
  CommunityUpdate, 
  CircleLeader, 
  Partner, 
  ImpactMetrics, 
  MemberRole 
} from '../types';
import { getDistance, DistanceInfo } from '../lib/proximity';

interface MohallaCircleProps {
  onNavigate?: (tab: string) => void;
  userAddress?: string;
  setActiveTab?: (tab: any) => void;
  view?: 'home' | 'members' | 'impact' | 'updates';
}

export default function MohallaCircle({ onNavigate, userAddress = 'Sector 45, Gurugram', setActiveTab, view }: MohallaCircleProps) {
  const [activeView, setActiveView] = useState<'home' | 'members' | 'impact' | 'updates'>(view || 'home');

  useEffect(() => {
    if (view) {
      setActiveView(view);
    }
  }, [view]);
  const [memberFilter, setMemberFilter] = useState<MemberRole>('all');
  const [updateFilter, setUpdateFilter] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState('Saheed Nagar, Sector 45');
  
  // Navigation states for sub-screens
  const [selectedRequest, setSelectedRequest] = useState<CommunityUpdate | null>(null);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [helpMessage, setHelpMessage] = useState<string>('');
  const [selectedHelpOptions, setSelectedHelpOptions] = useState<string[]>(['vet']);
  
  // Help Form State
  const [helpSubmitted, setHelpSubmitted] = useState<boolean>(false);
  
  // Maps instances
  const homeMapRef = useRef<any>(null);
  const membersMapRef = useRef<any>(null);
  const detailMapRef = useRef<any>(null);

  // Mock data matching screens
  const impactMetrics: ImpactMetrics = {
    animalsHelped: 28,
    rescues: 16,
    animalsFed: 312,
    adoptions: 6,
    donations: 8450
  };

  const members: CircleMember[] = [
    { id: '1', name: 'Neha J.', avatar: '👩‍🦰', role: 'feeder', distance: '800 m', badge: 'trusted', location: 'Sector 4 Park', lat: 28.4595, lng: 77.0266, joinedTime: '3' },
    { id: '2', name: 'Ankit', avatar: '👨‍🦲', role: 'rescuer', distance: '1.2 km', badge: 'level4', location: 'Downtown Area', lat: 28.4625, lng: 77.0306, joinedTime: '12' },
    { id: '3', name: 'Rita', avatar: '👩‍🦱', role: 'feeder', distance: '500 m', badge: 'level3', location: 'Market Area', lat: 28.4575, lng: 77.0246, joinedTime: '5' },
    { id: '4', name: 'Dr. Meera', avatar: '👩‍⚕️', role: 'paravet', distance: '2.5 km', badge: 'available', location: 'Clinic Zone', lat: 28.4715, lng: 77.0356, joinedTime: '22' },
    { id: '5', name: 'Pooja S.', avatar: '👩‍🤝‍👩', role: 'volunteer', distance: '3.0 km', location: 'North Zone', lat: 28.4805, lng: 77.0206, joinedTime: '8' },
    { id: '6', name: 'Vikas P.', avatar: '👨‍💼', role: 'rescuer', distance: '2.8 km', location: 'East Zone', lat: 28.4505, lng: 77.0456, joinedTime: '15' },
  ];

  const circleLeaders: CircleLeader[] = [
    { id: '1', name: 'Sunita R.', avatar: '👩‍🦳', role: 'Community Warden', location: 'Sector 4 & 5', badge: 'level5' },
    { id: '2', name: 'Vikas P.', avatar: '👨‍💼', role: 'Rescue Lead', location: 'Sector 4', badge: 'level4' },
    { id: '3', name: 'Pooja S.', avatar: '👩‍🤝‍👩', role: 'Feeding Coordinator', location: 'Sector 4', badge: 'level4' },
  ];

  const partners: Partner[] = [
    { id: '1', name: 'AU Moha Vet Clinic', logo: '🏥', distance: '2.1 km', type: 'Veterinary' },
    { id: '2', name: 'Paws & Claws NGO', logo: '🐾', distance: '3.2 km', type: 'NGO' },
    { id: '3', name: 'Happy Paws Shelter', logo: '🏠', distance: '2.8 km', type: 'Shelter' },
    { id: '4', name: 'City Animal Helpline', logo: '☎️', distance: '24x7 Support', type: 'Support' },
  ];

  const updates: CommunityUpdate[] = [
    {
      id: '1',
      author: 'Neha J.',
      authorRole: 'feeder',
      avatar: '👩‍🦰',
      time: '10 mins ago',
      category: 'help',
      title: 'Injured dog near Park Street',
      description: 'A limping brown dog was seen near the park entrance. Needs medical help.',
      image: '/hero-dog.png',
      location: 'Sector 4 Park',
      distance: '800 m',
      likes: 12
    },
    {
      id: '2',
      author: 'Ankit',
      authorRole: 'rescuer',
      avatar: '👨‍🦲',
      time: '35 mins ago',
      category: 'help',
      title: 'Rescue completed successfully',
      description: 'The injured dog has been moved to a vet clinic for treatment.',
      image: '/hero-golden-retriever.png',
      location: 'Veterinary Care Center',
      distance: '1.5 km',
      likes: 8
    },
    {
      id: '3',
      author: 'Rita',
      authorRole: 'feeder',
      avatar: '👩‍🦱',
      time: '1 hr ago',
      category: 'feeding',
      title: 'Evening feeding completed',
      description: 'Fed 12 dogs near Sector 4 Park.',
      image: '/marketplace-food.png',
      location: 'Sector 4 Park',
      distance: '500 m',
      likes: 15
    },
    {
      id: '4',
      author: 'Mohalla Foster Network',
      authorRole: 'adopter',
      avatar: '🏠',
      time: '2 hrs ago',
      category: 'feeding',
      title: '2 new foster homes available',
      description: 'Safe temporary homes ready for dogs in need.',
      image: '/product-1.png',
      location: 'Within 3 km',
      distance: '3.0 km',
      likes: 4
    },
  ];

  const events = [
    { id: 'e1', date: '18 May', title: 'Free Vaccination Camp', time: '8:00 AM - 12:00 PM', location: 'Sector 4 Community Park', image: '/vetConsultation.png' },
    { id: 'e2', date: '25 May', title: 'Clean Streets, Safe Paws', time: '7:30 AM - 10:30 AM', location: 'Park Street Area', image: '/groominAndCare.png' },
    { id: 'e3', date: '01 Jun', title: 'Adoption Meet', time: '11:00 AM - 3:00 PM', location: 'AU Moha Center', image: '/experSupport.png' }
  ];

  // Dynamically calculate distance using getDistance from proximity.ts
  const computedMembers = members.map(m => {
    const distInfo = getDistance(selectedLocation, m.location || '');
    return {
      ...m,
      distance: distInfo.display,
      distanceVal: distInfo.distanceVal
    };
  });

  const computedUpdates = updates.map(u => {
    const distInfo = getDistance(selectedLocation, u.location || '');
    return {
      ...u,
      distance: distInfo.display,
      distanceVal: distInfo.distanceVal
    };
  });

  // Role style mappings (color palette: elegant, HSL tailored matching screenshots)
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
      default:
        return { bg: 'bg-[#ECEFF1]', text: 'text-[#37474F]', border: 'border-[#CFD8DC]', label: 'Member', icon: '👤' };
    }
  };

  const getBadgeText = (badge?: string) => {
    if (!badge) return '';
    switch (badge) {
      case 'trusted': return '✓ Trusted';
      case 'available': return '🌙 Available tonight';
      case 'level5': return '⭐ Level 5';
      case 'level4': return '⭐ Level 4';
      case 'level3': return '⭐ Level 3';
      default: return badge;
    }
  };

  // CDN Leaflet loading logic (checks if loaded, loads on demand, cleans up)
  const loadLeafletMap = (mapId: string, center: [number, number], pins: any[], setInstanceRef: any) => {
    const win = window as any;
    
    const init = (L: any) => {
      const mapContainer = document.getElementById(mapId);
      if (!mapContainer) return;
      
      // Cleanup previous map on the same element if it exists
      if (setInstanceRef.current) {
        try {
          setInstanceRef.current.remove();
        } catch (e) {
          console.error(e);
        }
      }

      const map = L.map(mapId, { zoomControl: false }).setView(center, 14);
      setInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      // User node center dot (Green dot)
      const greenDotIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-5 h-5 bg-[#3D5A45] rounded-full border-4 border-white shadow-md flex items-center justify-center">
                 <div class="w-2 h-2 bg-white rounded-full animate-ping"></div>
               </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      L.marker(center, { icon: greenDotIcon }).addTo(map);

      // Draw search radius ring (e.g. 1.5 km)
      L.circle(center, {
        color: '#3D5A45',
        fillColor: '#E8EFE9',
        fillOpacity: 0.15,
        radius: 1500,
        weight: 1.5,
        dashArray: '4, 4'
      }).addTo(map);

      // Add pins
      pins.forEach(pin => {
        const roleInfo = getRoleColors(pin.role);
        
        let markerHtml = '';
        if (pin.role === 'help_needed') {
          // Urgent Red pin
          markerHtml = `<div class="flex flex-col items-center">
            <div class="w-9 h-9 rounded-full bg-[#C85341] border border-white flex items-center justify-center text-white text-sm shadow-md animate-bounce">
              🚨
            </div>
            <div class="bg-white/95 px-2 py-0.5 rounded-full border border-stone-200 text-[9px] font-bold text-charcoal mt-1 whitespace-nowrap shadow-sm">
              Help Needed: ${pin.distance || '800m'}
            </div>
          </div>`;
        } else {
          // Custom Role pin with avatar inside and label
          markerHtml = `<div class="flex flex-col items-center">
            <div class="w-8 h-8 rounded-full ${roleInfo.bg} border-2 ${roleInfo.border} flex items-center justify-center text-base shadow-md relative">
              ${pin.avatar || roleInfo.icon}
              ${pin.badge ? `<span class="absolute -top-1.5 -right-1.5 text-[8px] bg-yellow-400 rounded-full w-3.5 h-3.5 flex items-center justify-center">⭐</span>` : ''}
            </div>
            <div class="bg-white/95 px-2 py-0.5 rounded-full border border-stone-200 text-[9px] font-bold text-charcoal mt-1 whitespace-nowrap shadow-sm">
              ${pin.name}: ${pin.distance}
            </div>
          </div>`;
        }

        const customIcon = L.divIcon({
          className: 'custom-member-pin',
          html: markerHtml,
          iconSize: [60, 60],
          iconAnchor: [30, 45]
        });

        const marker = L.marker([pin.lat, pin.lng], { icon: customIcon }).addTo(map);
        
        marker.on('click', () => {
          if (pin.role === 'help_needed') {
            const req = computedUpdates.find(u => u.id === '1') || computedUpdates[0];
            setSelectedRequest(req);
          } else {
            // Filter members tab to this member or role
            setActiveView('members');
            setMemberFilter(pin.role);
          }
        });
      });
    };

    if (win.L) {
      init(win.L);
      return;
    }

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      if (win.L) init(win.L);
    };
    document.body.appendChild(script);
  };

  // Load maps based on active sub-screen
  useEffect(() => {
    if (selectedRequest) {
      // Load Detail Screen Map (Screen 6)
      const detailPins = [
        { name: 'Neha J.', avatar: '👩‍🦰', role: 'feeder', lat: 28.4595, lng: 77.0266, distance: '800 m' },
        { name: 'Ankit', avatar: '👨‍', role: 'rescuer', lat: 28.4625, lng: 77.0306, distance: '1.2 km' },
        { name: 'Rita', avatar: '👩‍🦱', role: 'feeder', lat: 28.4575, lng: 77.0246, distance: '500 m' }
      ];
      setTimeout(() => {
        loadLeafletMap('detail-map', [28.4605, 77.0286], detailPins, detailMapRef);
      }, 100);
    } else if (activeView === 'home') {
      // Load Home Map (Screen 1)
      const homePins = [
        { name: 'Rita', avatar: '👩‍🦱', role: 'feeder', lat: 28.4575, lng: 77.0246, distance: '500 m' },
        { name: 'Ankit', avatar: '👨‍', role: 'rescuer', lat: 28.4625, lng: 77.0306, distance: '1.2 km' },
        { name: 'Paravet', avatar: '🩺', role: 'paravet', lat: 28.4715, lng: 77.0356, distance: '2.5 km' },
        { name: 'Foster Home', avatar: '🏠', role: 'adopter', lat: 28.4805, lng: 77.0206, distance: '2 within 3 km' },
        { name: 'Help Needed', avatar: '🚨', role: 'help_needed', lat: 28.4595, lng: 77.0266, distance: '800 m' }
      ];
      setTimeout(() => {
        loadLeafletMap('home-map', [28.4605, 77.0286], homePins, homeMapRef);
      }, 100);
    } else if (activeView === 'members') {
      // Load Member Network Map (Screen 2)
      const memberPins = computedMembers.map(m => ({
        name: m.name,
        avatar: m.avatar,
        role: m.role,
        lat: m.lat || 28.4605,
        lng: m.lng || 77.0286,
        distance: m.distance,
        badge: m.badge
      }));
      setTimeout(() => {
        loadLeafletMap('members-map', [28.4605, 77.0286], memberPins, membersMapRef);
      }, 100);
    }

    return () => {
      // Clean up maps
      if (homeMapRef.current) { homeMapRef.current.remove(); homeMapRef.current = null; }
      if (membersMapRef.current) { membersMapRef.current.remove(); membersMapRef.current = null; }
      if (detailMapRef.current) { detailMapRef.current.remove(); detailMapRef.current = null; }
    };
  }, [activeView, selectedRequest]);

  const handleHelpToggle = (option: string) => {
    setSelectedHelpOptions(prev => 
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    );
  };

  const handleSendHelp = () => {
    setHelpSubmitted(true);
    setTimeout(() => {
      setHelpSubmitted(false);
      setShowHelpModal(false);
      alert('Help request accepted! The reporter has been notified and will coordinate with you.');
    }, 1200);
  };

  // Shared component: Member Scroll/List Card
  const renderMemberCard = (member: any) => {
    const roleInfo = getRoleColors(member.role);
    return (
      <div 
        key={member.id} 
        className="bg-white border border-[#F0EBE1] rounded-2xl p-4 flex gap-4 items-center hover:shadow-md hover:border-[#3D5A45]/30 transition-all duration-300 cursor-pointer relative group shrink-0 w-[180px] select-none"
        onClick={() => {
          setActiveView('members');
          setMemberFilter(member.role);
        }}
      >
        <div className="flex flex-col items-center w-full text-center">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-terracotta/10 to-clay/10 border border-[#EBE3D5] flex items-center justify-center shadow-inner relative mb-2">
            <span className="text-3xl">{member.avatar}</span>
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <span className="text-xs font-bold text-charcoal truncate w-full">{member.name}</span>
          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase mt-1 leading-none ${roleInfo.bg} ${roleInfo.text} border ${roleInfo.border}`}>
            {roleInfo.label}
          </span>
          <span className="text-[10px] text-stone-500 font-bold mt-1.5 flex items-center gap-0.5">
            📍 {member.distance}
          </span>
          {member.badge && (
            <span className="text-[9px] font-bold text-[#B68A35] mt-1 italic">
              {getBadgeText(member.badge)}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Shared component: Post card
  const renderPostCard = (post: any) => {
    const roleInfo = getRoleColors(post.authorRole);
    return (
      <div 
        key={post.id} 
        onClick={() => setSelectedRequest(post)}
        className="bg-white border border-[#F0EBE1] rounded-[24px] p-5 flex flex-col gap-4 hover:shadow-md transition-all duration-300 group cursor-pointer"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cream border border-[#F0EBE1] flex items-center justify-center text-xl shadow-inner shrink-0">
              {post.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-charcoal">{post.author}</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase leading-none ${roleInfo.bg} ${roleInfo.text} border ${roleInfo.border}`}>
                  {roleInfo.label}
                </span>
              </div>
              <span className="text-[10px] text-stone-400 font-semibold">{post.time}</span>
            </div>
          </div>
          <button className="text-stone-400 hover:text-charcoal p-1">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex gap-4 items-start">
          <div className="flex-1">
            <h4 className="text-sm font-bold text-charcoal leading-snug group-hover:text-[#3D5A45] transition-colors">{post.title}</h4>
            <p className="text-xs text-stone-600 font-medium leading-relaxed mt-1 text-ellipsis overflow-hidden line-clamp-3">
              {post.description}
            </p>
          </div>
          {post.image && (
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 border border-[#F0EBE1] shrink-0 relative">
              <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
              <div className="absolute bottom-1 right-1 bg-black/60 px-1 py-0.5 rounded text-[8px] font-extrabold text-white flex items-center gap-0.5">
                🖼️ 2
              </div>
            </div>
          )}
        </div>

        {/* Meta / Actions Footer */}
        <div className="flex items-center justify-between border-t border-[#F5F2EC] pt-3 text-[11px] text-stone-500 font-bold select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 bg-[#FCFAF7] px-2 py-1 rounded-lg">📍 {post.location}</span>
            <span className="text-[#3D5A45]">{post.distance}</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
              <span>❤️</span> {post.likes}
            </button>
            <button className="flex items-center gap-1 hover:text-[#3D5A45] transition-colors">
              <span>💬</span> Comment
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- RENDER SUPPORT REQUEST DETAIL SUB-PAGE (Screen 6) ---
  if (selectedRequest) {
    const roleInfo = getRoleColors(selectedRequest.authorRole);
    return (
      <div className="min-h-screen bg-warmBg flex flex-col animate-scaleIn relative">
        {/* Navigation/Header bar */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-[#F0EBE1] px-4 py-4 z-20 flex items-center justify-between shadow-sm">
          <button 
            onClick={() => setSelectedRequest(null)}
            className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 active:scale-95 transition-all"
          >
            ←
          </button>
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm font-bold text-charcoal">Support Request</span>
            <span className="px-2 py-0.5 rounded bg-rose-50 text-red-600 border border-rose-100 text-[9px] font-extrabold uppercase animate-pulse">
              Active
            </span>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 active:scale-95 transition-all">
              📤
            </button>
            <button className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 active:scale-95 transition-all">
              ⋮
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-grow px-4 py-5 pb-24 w-full max-w-2xl mx-auto flex flex-col gap-6">
          
          {/* Card Hero */}
          <div className="bg-white border border-[#F0EBE1] rounded-[28px] p-6 shadow-sm flex flex-col md:flex-row gap-5">
            <div className="flex-grow flex flex-col gap-2 min-w-0">
              <h2 className="font-serif text-2xl text-charcoal font-normal">{selectedRequest.title}</h2>
              <span className="text-xs text-stone-500 font-bold flex items-center gap-1 mt-1">
                📍 {selectedRequest.location}, Saheed Nagar
              </span>
              <p className="text-xs text-stone-600 font-medium leading-relaxed mt-2">
                {selectedRequest.description}
              </p>
            </div>
            {selectedRequest.image && (
              <div className="w-full md:w-36 h-36 rounded-2xl overflow-hidden bg-stone-100 border border-[#F0EBE1] relative shadow-inner shrink-0 select-none">
                <img src={selectedRequest.image} alt={selectedRequest.title} className="w-full h-full object-cover" />
                <div className="absolute bottom-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[10px] font-extrabold text-white flex items-center gap-0.5">
                  📷 2
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-4 gap-2.5">
            <div className="bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl p-3 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-stone-400">Reported</span>
              <span className="text-[10px] font-bold text-charcoal mt-1">10 mins ago</span>
            </div>
            <div className="bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl p-3 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-stone-400">Reporter</span>
              <span className="text-[10px] font-bold text-charcoal mt-1">{selectedRequest.author}</span>
            </div>
            <div className="bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl p-3 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-stone-400">Proximity</span>
              <span className="text-[10px] font-bold text-[#3D5A45] mt-1">{selectedRequest.distance}</span>
            </div>
            <div className="bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl p-3 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-stone-400">Notified</span>
              <span className="text-[10px] font-bold text-[#B68A35] mt-1">3 Neighbors</span>
            </div>
          </div>

          {/* Proximity Map Card */}
          <div className="bg-white border border-[#F0EBE1] rounded-[28px] p-4 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-charcoal flex items-center gap-1.5">
                🌍 Proximity Map
              </span>
              <span className="text-[10px] font-extrabold text-[#3D5A45] uppercase tracking-widest bg-[#E8EFE9] px-2 py-0.5 rounded-full border border-[#C8E6C9]">
                Within 3 km radius
              </span>
            </div>
            <div id="detail-map" className="h-56 w-full rounded-2xl bg-stone-100 border border-[#F0EBE1] overflow-hidden z-10" />
          </div>

          {/* Tabs Details Section */}
          <div className="bg-white border border-[#F0EBE1] rounded-[28px] p-5 shadow-sm">
            <div className="flex gap-4 border-b border-[#F0EBE1] pb-3 mb-4 select-none text-xs font-bold text-stone-400">
              <span className="text-[#3D5A45] border-b-2 border-[#3D5A45] pb-3 -mb-3.5 cursor-pointer">Details</span>
              <span className="hover:text-charcoal cursor-pointer">Help Needed</span>
              <span className="hover:text-charcoal cursor-pointer flex items-center gap-1">Updates <span className="bg-rose-100 text-rose-700 px-1 rounded-full text-[9px]">2</span></span>
              <span className="hover:text-charcoal cursor-pointer">Nearby Support</span>
            </div>

            {/* Tab: Details Table */}
            <div className="flex flex-col gap-3.5 mt-2 text-xs">
              <div className="flex py-1.5 border-b border-[#F9F7F2]">
                <span className="w-28 font-bold text-stone-400 uppercase tracking-wider shrink-0">Location</span>
                <span className="text-charcoal font-medium">Near Sector 4 Park entrance, Park Street <a href="#map" className="text-[#B68A35] underline ml-1.5">View on map</a></span>
              </div>
              <div className="flex py-1.5 border-b border-[#F9F7F2]">
                <span className="w-28 font-bold text-stone-400 uppercase tracking-wider shrink-0">Animal Info</span>
                <span className="text-charcoal font-medium">Brown Indie Dog • Adult • Medium <span className="text-stone-400 font-semibold block mt-0.5">Limping on front leg</span></span>
              </div>
              <div className="flex py-1.5 border-b border-[#F9F7F2]">
                <span className="w-28 font-bold text-stone-400 uppercase tracking-wider shrink-0">Urgency</span>
                <span className="text-red-600 font-bold flex items-center gap-1.5">
                  ⚠️ Moderate <span className="text-stone-400 font-normal italic">Needs vet check and care</span>
                </span>
              </div>
              <div className="flex py-1.5 border-b border-[#F9F7F2]">
                <span className="w-28 font-bold text-stone-400 uppercase tracking-wider shrink-0">What Happened</span>
                <span className="text-charcoal font-medium">Seen limping and having difficulty walking.</span>
              </div>
              <div className="flex py-1.5">
                <span className="w-28 font-bold text-stone-400 uppercase tracking-wider shrink-0">Contact</span>
                <span className="text-charcoal font-bold">{selectedRequest.author} • 9876 543 210 <span className="text-stone-400 font-medium block mt-0.5">Call or message for more details</span></span>
              </div>
            </div>
          </div>

          {/* Ways you can help Grid */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-charcoal px-1">Ways you can help</h3>
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { id: 'vet', title: 'Take to Vet', icon: '🩺', desc: 'Provide medical assistance' },
                { id: 'transport', title: 'Transport', icon: '🚗', desc: 'Help in safe transport' },
                { id: 'foster', title: 'Foster Care', icon: '🏠', desc: 'Provide temporary care' },
                { id: 'support', title: 'Support', icon: '🤝', desc: 'Contribute or share leads' }
              ].map(opt => (
                <div 
                  key={opt.id}
                  onClick={() => {
                    setSelectedHelpOptions([opt.id]);
                    setShowHelpModal(true);
                  }}
                  className="bg-white border border-[#F0EBE1] hover:border-[#3D5A45]/40 hover:bg-[#FCFAF7] transition-all rounded-2xl p-4 flex flex-col items-center justify-between text-center cursor-pointer shadow-sm"
                >
                  <span className="text-3xl">{opt.icon}</span>
                  <span className="text-xs font-bold text-charcoal mt-2 leading-tight">{opt.title}</span>
                  <span className="text-[9px] text-stone-400 font-semibold mt-1 leading-normal">{opt.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col gap-3 mt-4">
            <button 
              onClick={() => setShowHelpModal(true)}
              className="w-full py-3.5 bg-[#3D5A45] hover:bg-[#2A3E31] active:scale-98 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-[#3D5A45]/15"
            >
              <span>🤝</span> I can help
            </button>
            <button 
              onClick={() => alert(`Broadcasting support request to neighbors within 3 km...`)}
              className="w-full py-3 bg-[#FCFAF7] border border-[#F0EBE1] hover:border-stone-300 active:scale-98 text-stone-600 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>💬</span> Ask neighbors for support
            </button>
          </div>
        </div>

        {/* --- OFFER YOUR HELP MODAL (Screen 5) --- */}
        {showHelpModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-end md:items-center justify-center px-4 transition-all">
            <div className="bg-white w-full max-w-lg rounded-t-[32px] md:rounded-[32px] p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto animate-scaleIn select-none">
              
              {/* Context Header */}
              <div className="flex justify-between items-center border-b border-[#F0EBE1] pb-3.5">
                <button 
                  onClick={() => setShowHelpModal(false)}
                  className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 active:scale-90"
                >
                  ←
                </button>
                <div className="text-center">
                  <h3 className="font-serif text-lg text-charcoal font-semibold">Offer Your Help</h3>
                  <span className="text-[10px] text-stone-400 font-bold block mt-0.5 truncate max-w-[200px]">
                    {selectedRequest.title}
                  </span>
                </div>
                <button 
                  onClick={() => setShowHelpModal(false)}
                  className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center hover:bg-rose-50 hover:text-red-500 active:scale-90 text-sm font-semibold"
                >
                  ✕
                </button>
              </div>

              {/* Informative Security Banner */}
              <div className="bg-[#FDF6F0] border border-[#FBE9E7] rounded-xl p-3.5 flex items-start gap-2.5">
                <span className="text-lg">🛡️</span>
                <p className="text-[11px] text-stone-600 font-medium leading-relaxed">
                  Your help will be shared with the reporter and nearby helpers. You can choose one or more ways to help.
                </p>
              </div>

              {/* Multi-select Help Cards */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-charcoal">How would you like to help?</h4>
                {[
                  { id: 'vet', title: 'Take to Vet', icon: '🩺', desc: 'Provide medical assistance', time: '2.3 km away • 12 min' },
                  { id: 'transport', title: 'Transport', icon: '🚗', desc: 'Help in safe transport', time: '1.1 km away • 6 min' },
                  { id: 'foster', title: 'Foster Care', icon: '🏠', desc: 'Provide temporary care', time: 'Within 5 km' },
                  { id: 'support', title: 'Support', icon: '🤝', desc: 'Contribute or share leads', time: 'Share info, supplies, or funds' }
                ].map(item => {
                  const isChecked = selectedHelpOptions.includes(item.id);
                  return (
                    <div 
                      key={item.id}
                      onClick={() => handleHelpToggle(item.id)}
                      className={`border rounded-2xl p-3.5 flex items-center justify-between gap-4 cursor-pointer hover:border-[#3D5A45]/30 transition-all ${
                        isChecked ? 'bg-[#FCFAF7] border-[#3D5A45] shadow-sm' : 'border-[#F0EBE1] bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200/60 flex items-center justify-center text-xl shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-charcoal block">{item.title}</span>
                          <span className="text-[10px] text-stone-400 font-semibold block mt-0.5 leading-tight">{item.desc}</span>
                          <span className="text-[9px] text-[#3D5A45] font-extrabold block mt-1">📍 {item.time}</span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isChecked ? 'bg-[#3D5A45] border-[#3D5A45] text-white' : 'border-stone-300 bg-white'
                      }`}>
                        {isChecked && '✓'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Textarea */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-charcoal">Add a message (optional)</h4>
                  <span className="text-[10px] text-stone-400 font-semibold">{helpMessage.length}/200</span>
                </div>
                <textarea 
                  value={helpMessage}
                  onChange={(e) => setHelpMessage(e.target.value.slice(0, 200))}
                  placeholder="Tell the reporter how you can help..."
                  className="bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl p-3.5 text-xs text-charcoal outline-none focus:border-[#3D5A45]/40 min-h-[70px] resize-none"
                />
              </div>

              {/* Coordinator Avatar Row */}
              <div className="flex flex-col gap-2.5">
                <h4 className="text-xs font-bold text-charcoal">Coordinate with nearby helpers</h4>
                <p className="text-[10px] text-stone-400 font-medium">These neighbors are also helping:</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { name: 'Neha J.', role: 'Reporter', dist: '800 m away', avatar: '👩‍🦰' },
                    { name: 'Ankit', role: 'Rescuer', dist: '1.2 km away', avatar: '👨‍' },
                    { name: 'Rita', role: 'Feeder', dist: '500 m away', avatar: '👩‍🦱' }
                  ].map((h, i) => (
                    <div key={i} className="bg-white border border-[#F0EBE1] rounded-xl p-2 flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full bg-cream border border-stone-200 flex items-center justify-center text-lg relative mb-1 shrink-0">
                        {h.avatar}
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></div>
                      </div>
                      <span className="text-[10px] font-bold text-charcoal truncate w-full">{h.name}</span>
                      <span className="text-[8px] font-semibold text-stone-400 leading-none mt-0.5">{h.role}</span>
                      <span className="text-[8px] font-extrabold text-[#3D5A45] mt-1 leading-none">{h.dist}</span>
                    </div>
                  ))}
                  <div className="bg-white border border-dashed border-stone-300 rounded-xl p-2 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center text-xs font-bold text-stone-500 shrink-0">
                      +2
                    </div>
                    <span className="text-[8px] font-bold text-stone-500 mt-2 block">Helpers nearby</span>
                    <button className="text-[8px] text-[#B68A35] font-extrabold underline block leading-none mt-1">View all</button>
                  </div>
                </div>
              </div>

              {/* Urgent Clock Banner */}
              <div className="bg-[#FFF3E0] border border-[#FFE0B2] rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span>⏱️</span>
                  <div>
                    <span className="font-bold text-[#E65100] block text-[10px] leading-tight">Response time matters.</span>
                    <span className="text-stone-600 text-[10px] leading-normal font-semibold">Please act as soon as possible. Thank you!</span>
                  </div>
                </div>
                <span className="text-rose-500 text-lg">❤️</span>
              </div>

              {/* Action bar */}
              <div className="flex flex-col gap-2.5 mt-2">
                <button 
                  onClick={handleSendHelp}
                  disabled={helpSubmitted}
                  className="w-full py-3.5 bg-[#3D5A45] hover:bg-[#2A3E31] disabled:opacity-50 active:scale-98 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  {helpSubmitted ? (
                    <span className="animate-pulse">Sending Help Offer...</span>
                  ) : (
                    <>
                      <span>✈️</span> Send My Help
                    </>
                  )}
                </button>
                <a 
                  href="tel:+919876543210"
                  className="w-full py-3 border border-stone-200 hover:border-charcoal hover:bg-stone-50 active:scale-98 text-charcoal font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer text-center"
                >
                  <span>📞</span> Call Reporter
                </a>
              </div>

            </div>
          </div>
        )}
      </div>
    );
  }

  // --- RENDER MAIN TAB VIEWS ---
  return (
    <div className="w-full flex flex-col gap-6 select-none animate-fadeIn">

      {/* TOP HEADER TITLE BLOCK (Screen 1 Custom) */}
      {activeView === 'home' && (
        <div className="w-full flex flex-col gap-4 border-b border-[#F0EBE1] pb-5 select-none">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-xl shadow-sm text-rose-500">
                🏘️
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-serif text-charcoal font-normal">Mohalla Circle</h1>
                <p className="text-[10px] md:text-xs text-stone-500 font-semibold mt-0.5">Your local animal support network</p>
              </div>
            </div>
            
            {/* Top-right Profile Shortcut Link */}
            <button 
              onClick={() => setActiveTab?.('profile')}
              className="w-10 h-10 rounded-full border border-[#F0EBE1] bg-[#FCFAF7] flex items-center justify-center hover:shadow-sm active:scale-95 transition-all text-lg shrink-0"
              title="View Profile"
            >
              👤
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 mt-2">
            {/* Location Selector Dropdown */}
            <div className="flex items-center gap-1.5 text-charcoal">
              <span className="text-lg">📍</span>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <select 
                    value={selectedLocation} 
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="text-sm font-bold bg-transparent border-none outline-none cursor-pointer text-charcoal select-none pr-1"
                  >
                    <option value="Saheed Nagar, Sector 45">Saheed Nagar</option>
                    <option value="Sector 4, Gurugram">Sector 4</option>
                    <option value="Downtown Area, Gurugram">Downtown Area</option>
                    <option value="Market Area, Gurugram">Market Area</option>
                  </select>
                  <span className="text-[10px] text-stone-400">▼</span>
                </div>
                <span className="text-[10px] text-stone-400 font-bold leading-none -mt-0.5">Sector 45, Gurugram</span>
              </div>
            </div>

            {/* Total Members count pill */}
            <button 
              onClick={() => {
                setActiveView('members');
                setMemberFilter('all');
              }}
              className="px-3.5 py-1.5 bg-rose-50/50 border border-rose-100 hover:bg-rose-50 text-red-600 font-bold rounded-full text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span>👥</span> 138 Members
            </button>
          </div>
        </div>
      )}

      {/* TOP HEADER FOR SUB-TABS (Screen 2, 3, 4 Back button headers) */}
      {activeView !== 'home' && (
        <div className="w-full flex items-center justify-between border-b border-[#F0EBE1] pb-5">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveView('home')}
              className="w-9 h-9 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 active:scale-95 transition-all text-sm font-bold"
            >
              ←
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-serif text-charcoal font-semibold capitalize">
                {activeView === 'members' ? 'Members & Network' : activeView === 'impact' ? 'Mohalla Impact' : 'Community Updates'}
              </h1>
              <p className="text-[9px] md:text-[10px] text-stone-500 font-bold leading-tight mt-0.5">
                {activeView === 'members' ? 'Warden, Feeders, and Rescuers around you' : activeView === 'impact' ? 'Our community, our impact' : "What's happening in your Mohalla"}
              </p>
            </div>
          </div>
          {activeView === 'updates' ? (
            <button className="w-9 h-9 rounded-full border border-[#F0EBE1] flex items-center justify-center relative shrink-0">
              🔔
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
            </button>
          ) : (
            <button className="w-9 h-9 rounded-full border border-[#F0EBE1] flex items-center justify-center text-sm">
              👥
            </button>
          )}
        </div>
      )}

      {/* TABS SELECTOR (Matches Header Style) */}
      <div className="w-full border-b border-[#F5F2EC] flex select-none text-xs font-bold text-stone-400 -mt-2">
        {[
          { id: 'home', label: 'Home', icon: '🏠' },
          { id: 'members', label: 'Network', icon: '👥' },
          { id: 'updates', label: 'Updates', icon: '📰' },
          { id: 'impact', label: 'Impact', icon: '❤️' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveView(t.id as any)}
            className={`flex-1 pb-3 text-center transition-all ${
              activeView === t.id 
                ? 'text-[#3D5A45] border-b-2 border-[#3D5A45]' 
                : 'hover:text-charcoal border-b border-transparent'
            }`}
          >
            <span className="mr-1">{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ==================== 1. HOME VIEW (Screen 1) ==================== */}
      {activeView === 'home' && (
        <div className="w-full flex flex-col gap-6 animate-scaleIn">
          
          {/* RADIUS MAP CARD */}
          <div className="bg-white border border-[#F0EBE1] rounded-[28px] p-4.5 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-extrabold text-charcoal flex items-center gap-1.5">
                🌐 Proximity Map
              </span>
              <span className="text-[10px] font-extrabold text-[#3D5A45] uppercase tracking-widest bg-[#E8EFE9] px-2.5 py-0.5 rounded-full border border-[#C8E6C9]">
                Saheed Nagar
              </span>
            </div>
            {/* Map Element */}
            <div id="home-map" className="h-64 w-full rounded-2xl bg-stone-50 border border-[#F0EBE1] overflow-hidden z-10" />
            
            {/* Color Coded Map Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-2.5 text-[9px] font-bold text-stone-500 border-t border-[#F5F2EC] pt-3 px-1 mt-1 justify-center">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#E65100]"></span> Feeders</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32]"></span> Rescuers</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0D47A1]"></span> Volunteers</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#7B1FA2]"></span> Paravets</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#004D40]"></span> Foster/Adopter</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#C85341] animate-pulse"></span> Help Needed</span>
            </div>
          </div>

          {/* CHIPS FILTER SLIDER */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide select-none">
            {[
              { id: 'all', label: 'All', icon: '🎛️' },
              { id: 'feeder', label: 'Feeders', icon: '🥣' },
              { id: 'rescuer', label: 'Rescuers', icon: '🛡️' },
              { id: 'volunteer', label: 'Volunteers', icon: '❤️' },
              { id: 'adopter', label: 'Adopters', icon: '🏠' },
              { id: 'paravet', label: 'Paravets', icon: '🩺' },
              { id: 'lost', label: 'Lost & Found', icon: '🔍' },
              { id: 'event', label: 'Events', icon: '📅' },
              { id: 'help', label: 'Support Requests', icon: '🚨' }
            ].map(chip => (
              <button
                key={chip.id}
                onClick={() => {
                  if (chip.id === 'lost' || chip.id === 'event' || chip.id === 'help') {
                    setActiveView('updates');
                    setUpdateFilter(chip.id);
                  } else {
                    setActiveView('members');
                    setMemberFilter(chip.id as any);
                  }
                }}
                className="px-4 py-2 border border-[#F0EBE1] hover:border-stone-300 bg-white text-stone-600 font-bold rounded-full text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0 active:scale-95"
              >
                <span>{chip.icon}</span> {chip.label}
              </button>
            ))}
          </div>

          {/* NEARBY ACTIVITY FEED LIST */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-charcoal">Nearby Activity</h3>
              <button 
                onClick={() => setActiveView('updates')}
                className="text-xs font-bold text-[#B68A35] flex items-center gap-0.5 hover:underline"
              >
                View all <span>›</span>
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              {computedUpdates.slice(0, 5).map(renderPostCard)}
            </div>
          </div>

          {/* QUICK ACTIONS GRID */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-charcoal px-1">Quick Actions</h3>
            <div className="grid grid-cols-4 gap-3">
              <button 
                onClick={() => setActiveTab?.('report')}
                className="bg-[#FCECE9] border border-[#FCE2DF] hover:scale-[1.02] transition-all rounded-[24px] p-4 flex flex-col items-center justify-between text-center min-h-[110px] shadow-sm group active:scale-98"
              >
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-600 text-lg shadow-sm border border-[#FCE2DF]">⚠️</div>
                <span className="text-[11px] font-extrabold text-[#C85341] mt-2 block">Report Issue</span>
                <span className="text-[8px] text-[#C85341]/60 font-semibold block mt-0.5 leading-tight">Cruelty or emergency</span>
              </button>
              <button 
                onClick={() => {
                  alert('Opening Ask Neighbor Support helper...');
                }}
                className="bg-[#FFF3E0] border border-[#FFE0B2] hover:scale-[1.02] transition-all rounded-[24px] p-4 flex flex-col items-center justify-between text-center min-h-[110px] shadow-sm group active:scale-98"
              >
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#E65100] text-lg shadow-sm border border-[#FFE0B2]">👤</div>
                <span className="text-[11px] font-extrabold text-[#E65100] mt-2 block">Ask Support</span>
                <span className="text-[8px] text-[#E65100]/60 font-semibold block mt-0.5 leading-tight">Get help nearby</span>
              </button>
              <button 
                onClick={() => {
                  setActiveView('updates');
                  alert('Opening create activity form...');
                }}
                className="bg-[#E8F5E9] border border-[#C8E6C9] hover:scale-[1.02] transition-all rounded-[24px] p-4 flex flex-col items-center justify-between text-center min-h-[110px] shadow-sm group active:scale-98"
              >
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#2E7D32] text-lg shadow-sm border border-[#C8E6C9]">＋</div>
                <span className="text-[11px] font-extrabold text-[#2E7D32] mt-2 block">Start Activity</span>
                <span className="text-[8px] text-[#2E7D32]/60 font-semibold block mt-0.5 leading-tight">Feeding, rescue</span>
              </button>
              <button 
                onClick={() => {
                  setActiveView('updates');
                  setUpdateFilter('event');
                }}
                className="bg-[#F3E5F5] border border-[#E1BEE7] hover:scale-[1.02] transition-all rounded-[24px] p-4 flex flex-col items-center justify-between text-center min-h-[110px] shadow-sm group active:scale-98"
              >
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#7B1FA2] text-lg shadow-sm border border-[#E1BEE7]">📅</div>
                <span className="text-[11px] font-extrabold text-[#7B1FA2] mt-2 block">Join Event</span>
                <span className="text-[8px] text-[#7B1FA2]/60 font-semibold block mt-0.5 leading-tight">Community events</span>
              </button>
            </div>
          </div>

        </div>
      )}


      {/* ==================== 2. MEMBERS & NETWORK VIEW (Screen 2) ==================== */}
      {activeView === 'members' && (
        <div className="w-full flex flex-col gap-6 animate-scaleIn">
          
          {/* STATS STRIP CARD */}
          <div className="bg-white border border-[#F0EBE1] rounded-[24px] p-4 shadow-sm flex items-center justify-between text-center divide-x divide-stone-100 select-none">
            <div className="flex-1 flex flex-col items-center">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-stone-400">Total Members</span>
              <span className="text-xl font-bold text-charcoal mt-1">138</span>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-stone-400">New This Month</span>
              <span className="text-xl font-bold text-[#3D5A45] mt-1">+18</span>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-stone-400">Active Today</span>
              <span className="text-xl font-bold text-[#B68A35] mt-1">16</span>
            </div>
          </div>

          {/* MEMBER ROLE SLIDE FILTERS */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide select-none">
            {(['all', 'feeder', 'rescuer', 'volunteer', 'paravet', 'adopter'] as MemberRole[]).map(role => {
              const roleInfo = getRoleColors(role);
              const count = role === 'all' ? computedMembers.length : computedMembers.filter(m => m.role === role).length;
              return (
                <button
                  key={role}
                  onClick={() => setMemberFilter(role)}
                  className={`px-4 py-2 border rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shrink-0 active:scale-95 ${
                    memberFilter === role 
                      ? 'bg-[#3D5A45] text-white border-[#3D5A45]' 
                      : 'bg-white border-[#F0EBE1] text-stone-600 hover:border-stone-300'
                  }`}
                >
                  <span>{roleInfo.icon}</span>
                  {role === 'all' ? 'All Members' : roleInfo.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1 ${
                    memberFilter === role ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* CORE CONTRIBUTORS ROW (Horizontal scroll) */}
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-bold text-charcoal px-1">Core Contributors</h3>
              <p className="text-[10px] text-stone-400 px-1 font-semibold leading-none mt-0.5">Trusted & Experienced members nearby</p>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-hide">
              {computedMembers
                .filter(m => m.badge === 'trusted' || m.badge === 'level5' || m.badge === 'level4')
                .map(renderMemberCard)}
            </div>
          </div>

          {/* RECENT JOINERS ROW */}
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-bold text-charcoal px-1">Recent Joiners</h3>
              <p className="text-[10px] text-stone-400 px-1 font-semibold leading-none mt-0.5">Welcoming new helpers to the circle</p>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-hide">
              {computedMembers
                .slice()
                .sort((a, b) => parseInt(a.joinedTime || '0') - parseInt(b.joinedTime || '0'))
                .map(m => (
                  <div 
                    key={m.id}
                    className="bg-white border border-[#F0EBE1] rounded-2xl p-4 flex flex-col items-center text-center w-[130px] shrink-0 hover:shadow-md transition-all duration-300 select-none cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center text-2xl relative shadow-inner mb-1.5">
                      {m.avatar}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></span>
                    </div>
                    <span className="text-xs font-bold text-charcoal truncate w-full">{m.name}</span>
                    <span className="text-[9px] font-bold text-stone-400 uppercase leading-none mt-0.5">{getRoleColors(m.role).label}</span>
                    <span className="text-[8px] font-extrabold text-[#3D5A45] mt-1.5 leading-none bg-[#E8EFE9] px-1.5 py-0.5 rounded border border-[#C8E6C9]">
                      Joined {m.joinedTime}d ago
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* NETWORK MAP CARD */}
          <div className="bg-white border border-[#F0EBE1] rounded-[28px] p-4.5 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-charcoal flex items-center gap-1.5">
                🌍 Member Network Map
              </span>
              <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest bg-stone-50 px-2.5 py-0.5 rounded-full border border-stone-200/60">
                Live Proximity
              </span>
            </div>
            <div id="members-map" className="h-56 w-full rounded-2xl bg-stone-50 border border-[#F0EBE1] overflow-hidden z-10" />
          </div>

        </div>
      )}


      {/* ==================== 3. MOHALLA IMPACT VIEW (Screen 3) ==================== */}
      {activeView === 'impact' && (
        <div className="w-full flex flex-col gap-6 animate-scaleIn">
          
          {/* STATS TILES CARD */}
          <div className="bg-white border border-[#F0EBE1] rounded-[28px] p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-charcoal">This Month</h3>
                <span className="text-[9px] text-stone-400 uppercase tracking-widest font-extrabold mt-0.5 block">May 2026</span>
              </div>
              <button className="text-xs font-bold text-[#B68A35] flex items-center gap-0.5 hover:underline">
                View all impact <span>›</span>
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center mt-1 select-none">
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1 flex items-center justify-center w-8 h-8 rounded-full bg-rose-50 border border-rose-100">🐾</span>
                <span className="text-sm font-bold text-charcoal mt-1.5">{impactMetrics.animalsHelped}</span>
                <span className="text-[9px] text-stone-500 font-bold block mt-1">Helped</span>
                <span className="text-[7.5px] text-stone-400 font-semibold block leading-tight mt-0.5">rescued & fed</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1 flex items-center justify-center w-8 h-8 rounded-full bg-[#E8F5E9] border border-[#C8E6C9]">❤️</span>
                <span className="text-sm font-bold text-[#2E7D32] mt-1.5">{impactMetrics.rescues}</span>
                <span className="text-[9px] text-stone-500 font-bold block mt-1">Rescues</span>
                <span className="text-[7.5px] text-stone-400 font-semibold block leading-tight mt-0.5">successful</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1 flex items-center justify-center w-8 h-8 rounded-full bg-[#FFF3E0] border border-[#FFE0B2]">🥣</span>
                <span className="text-sm font-bold text-charcoal mt-1.5">{impactMetrics.animalsFed}</span>
                <span className="text-[9px] text-stone-500 font-bold block mt-1">Fed</span>
                <span className="text-[7.5px] text-stone-400 font-semibold block leading-tight mt-0.5">daily count</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1 flex items-center justify-center w-8 h-8 rounded-full bg-[#E0F2F1] border border-[#B2DFDB]">🏠</span>
                <span className="text-sm font-bold text-[#004D40] mt-1.5">{impactMetrics.adoptions}</span>
                <span className="text-[9px] text-stone-500 font-bold block mt-1">Adoptions</span>
                <span className="text-[7.5px] text-stone-400 font-semibold block leading-tight mt-0.5">new homes</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1 flex items-center justify-center w-8 h-8 rounded-full bg-[#F3E5F5] border border-[#E1BEE7]">🤝</span>
                <span className="text-sm font-bold text-charcoal mt-1.5">₹{impactMetrics.donations.toLocaleString()}</span>
                <span className="text-[9px] text-stone-500 font-bold block mt-1">Donations</span>
                <span className="text-[7.5px] text-stone-400 font-semibold block leading-tight mt-0.5">raised</span>
              </div>
            </div>

            {/* Motivational message banner */}
            <div className="bg-[#FCFAF7] border border-[#F0EBE1] rounded-xl p-3 flex justify-between items-center text-xs mt-2">
              <div className="flex items-center gap-2">
                <span>🏆</span>
                <div>
                  <span className="font-bold text-charcoal block text-[10px] leading-tight">You're making a difference!</span>
                  <span className="text-stone-500 text-[10px] font-semibold leading-normal">Keep going, you're helping build a kinder Mohalla.</span>
                </div>
              </div>
              <button 
                onClick={() => alert('Sharing impact dashboard to social media...')}
                className="text-[10px] font-extrabold text-[#3D5A45] hover:text-[#2A3E31] flex items-center gap-0.5 bg-white border border-[#EBE3D5] px-2.5 py-1.5 rounded-lg active:scale-95 transition-all shadow-sm"
              >
                <span>📤</span> Share
              </button>
            </div>
          </div>

          {/* ACTIVE MEMBERS NEARBY SECTION */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-charcoal">Active Members Nearby</h3>
              <button 
                onClick={() => { setActiveView('members'); setMemberFilter('all'); }}
                className="text-xs font-bold text-[#B68A35] hover:underline"
              >
                View all members <span>›</span>
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {computedMembers.map(renderMemberCard)}
            </div>
          </div>

          {/* CIRCLE LEADERS SECTION */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-charcoal">Our Circle Leaders</h3>
              <button 
                onClick={() => alert('Viewing all leaders...')}
                className="text-xs font-bold text-[#B68A35] hover:underline"
              >
                View all leaders <span>›</span>
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {circleLeaders.map(leader => (
                <div 
                  key={leader.id} 
                  className="bg-white border border-[#F0EBE1] rounded-2xl p-4 flex gap-3.5 items-center hover:shadow-md transition-all duration-300 shrink-0 w-[200px] select-none"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[#FAF6F0] border border-[#EBE3D5] flex items-center justify-center shadow-inner relative shrink-0">
                    <span className="text-2xl">{leader.avatar}</span>
                    <span className="absolute bottom-0 right-0 text-[10px] bg-yellow-400 rounded-full w-4.5 h-4.5 flex items-center justify-center border border-white">⭐</span>
                  </div>
                  <div className="min-w-0 flex flex-col">
                    <span className="text-xs font-bold text-charcoal truncate">{leader.name}</span>
                    <span className="text-[9px] text-[#B68A35] font-extrabold uppercase mt-0.5 leading-none">{leader.role}</span>
                    <span className="text-[9px] text-stone-400 font-semibold truncate mt-1">📍 {leader.location}</span>
                    <span className="text-[8px] font-extrabold text-[#3D5A45] uppercase tracking-wider mt-1 block bg-[#E8EFE9] w-fit px-1.5 py-0.5 rounded">
                      {getBadgeText(leader.badge)}
                    </span>
                  </div>
                </div>
              ))}
              <div className="bg-white border border-dashed border-[#F0EBE1] rounded-2xl p-4 flex flex-col items-center justify-center text-center w-[130px] shrink-0 hover:shadow-md transition-all select-none">
                <span className="text-2xl">👥</span>
                <span className="text-[10px] font-bold text-stone-400 mt-2 block">+5 Leaders</span>
                <button className="text-[9px] text-[#B68A35] font-extrabold underline block leading-none mt-1">View all</button>
              </div>
            </div>
          </div>

          {/* TRUSTED PARTNERS SECTION */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-charcoal">Trusted Partners</h3>
              <button 
                onClick={() => alert('Viewing all partners...')}
                className="text-xs font-bold text-[#B68A35] hover:underline"
              >
                View all partners <span>›</span>
              </button>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {partners.map(partner => (
                <div 
                  key={partner.id} 
                  className="bg-white border border-[#F0EBE1] hover:border-[#3D5A45]/40 hover:bg-[#FCFAF7] transition-all rounded-2xl p-3.5 flex flex-col items-center text-center w-[125px] shrink-0 shadow-sm cursor-pointer select-none"
                >
                  <span className="text-3xl">{partner.logo}</span>
                  <span className="text-xs font-bold text-charcoal mt-2 truncate w-full">{partner.name}</span>
                  <span className="text-[9px] text-stone-400 font-bold block mt-0.5">{partner.type}</span>
                  <span className="text-[9px] text-[#3D5A45] font-extrabold block mt-2">📍 {partner.distance}</span>
                </div>
              ))}
              <div 
                onClick={() => alert('Become a Partner form...')}
                className="bg-white border border-dashed border-[#F0EBE1] hover:bg-[#FCFAF7] transition-all rounded-2xl p-3.5 flex flex-col items-center justify-center text-center w-[125px] shrink-0 shadow-sm cursor-pointer select-none"
              >
                <span className="text-3xl text-rose-500">❤️</span>
                <span className="text-xs font-bold text-stone-500 mt-2 block">Become a</span>
                <span className="text-xs font-extrabold text-[#3D5A45] block leading-none mt-0.5 underline">Partner</span>
              </div>
            </div>
          </div>

          {/* FOOTER CALL TO ACTION */}
          <div className="bg-[#E8EFE9] border border-[#C8E6C9] rounded-[24px] p-5 flex items-center justify-between gap-4 select-none">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌱</span>
              <div>
                <span className="font-bold text-[#3D5A45] block text-xs md:text-sm">Stronger together. Kinder together.</span>
                <span className="text-stone-600 text-[10px] md:text-xs font-semibold leading-normal">Your actions today create a safer, happier tomorrow for animals.</span>
              </div>
            </div>
            <button 
              onClick={() => alert('Opening neighbor invite link share...')}
              className="px-4 py-2 bg-[#3D5A45] hover:bg-[#2A3E31] active:scale-95 text-white text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm shrink-0"
            >
              <span>👥</span> Invite Neighbors
            </button>
          </div>

        </div>
      )}


      {/* ==================== 4. COMMUNITY UPDATES VIEW (Screen 4) ==================== */}
      {activeView === 'updates' && (
        <div className="w-full flex flex-col gap-6 animate-scaleIn">
          
          {/* UPDATES CATEGORIES ROW FILTERS */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide select-none">
            {[
              { id: 'all', icon: '🎛️', label: 'All Updates' },
              { id: 'help', icon: '🆘', label: 'Help & Rescue' },
              { id: 'feeding', icon: '🥣', label: 'Feeding' },
              { id: 'event', icon: '📅', label: 'Events' },
              { id: 'awareness', icon: '🎓', label: 'Awareness' },
              { id: 'lost', icon: '🔍', label: 'Lost & Found' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setUpdateFilter(cat.id)}
                className={`px-4 py-2 border rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shrink-0 active:scale-95 ${
                  updateFilter === cat.id 
                    ? 'bg-[#3D5A45] text-white border-[#3D5A45]' 
                    : 'bg-white border-[#F0EBE1] text-stone-600 hover:border-stone-300'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* UPDATES FEED LIST */}
          <div className="flex flex-col gap-4">
            {computedUpdates
              .filter(u => updateFilter === 'all' || u.category === updateFilter)
              .map(renderPostCard)}
          </div>

          {/* PROMO BANNER CAROUSEL MOCKUP */}
          <div className="bg-[#FCFAF7] border border-[#F0EBE1] rounded-[28px] p-5 shadow-sm relative overflow-hidden flex flex-col md:flex-row gap-4 items-center justify-between select-none">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-2xl text-rose-500 shrink-0">
                📣
              </div>
              <div className="min-w-0">
                <span className="text-xs font-extrabold text-charcoal block">Awareness Drive This Sunday</span>
                <span className="text-[10px] text-stone-500 font-semibold block leading-normal mt-0.5">Join our "Be Kind to Animals" street awareness drive.</span>
              </div>
            </div>
            
            <button 
              onClick={() => alert('Showing Awareness Drive details...')}
              className="px-3.5 py-1.5 bg-[#C85341] hover:bg-[#B04535] text-white text-[10px] font-bold rounded-lg transition-all shadow-sm shrink-0"
            >
              View Details
            </button>
            
            {/* Carousel dots indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C85341]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-stone-300"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-stone-300"></span>
            </div>
          </div>

          {/* ONGOING EVENTS SECTION (Horizontal Scroll) */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-charcoal">Ongoing Events</h3>
              <button 
                onClick={() => alert('Viewing all events...')}
                className="text-xs font-bold text-[#B68A35] hover:underline"
              >
                View all <span>›</span>
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {events.map(event => (
                <div 
                  key={event.id}
                  onClick={() => alert(`RSVP for ${event.title}...`)}
                  className="bg-white border border-[#F0EBE1] hover:border-[#3D5A45]/40 hover:shadow-md transition-all duration-300 rounded-[24px] p-3 w-[220px] shrink-0 flex flex-col gap-2.5 cursor-pointer select-none"
                >
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-stone-100 border border-[#F0EBE1]/60 relative shrink-0">
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-[#C85341] text-white px-2 py-1 rounded-lg text-center shadow-md">
                      <span className="text-[9px] font-bold block leading-none">MAY</span>
                      <span className="text-xs font-extrabold block leading-none mt-0.5">{event.date.split(' ')[0]}</span>
                    </div>
                  </div>
                  <div className="px-1 flex flex-col">
                    <span className="text-xs font-bold text-charcoal leading-snug truncate">{event.title}</span>
                    <span className="text-[9.5px] text-stone-500 font-bold mt-1.5">⏱️ {event.time}</span>
                    <span className="text-[9.5px] text-[#3D5A45] font-extrabold mt-1">📍 {event.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* FIXED INVITE BUTTON ON UPDATES/MAP SCREENS (Matching screen 3) */}
      {(activeView === 'updates' || activeView === 'members') && (
        <div className="fixed bottom-28 right-4 z-50">
          <button 
            onClick={() => alert('Opening neighbor invite link share...')}
            className="bg-[#3D5A45] hover:bg-[#2A3E31] active:scale-95 text-white rounded-full px-4 py-3 font-extrabold shadow-lg flex items-center gap-2 text-xs transition-all duration-200 border border-white/10"
          >
            <span>👥</span> Invite Neighbors
          </button>
        </div>
      )}

    </div>
  );
}
