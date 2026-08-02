'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CommunityUpdate, CircleMember, MemberRole } from '../types';
import { loadLeaflet } from '../lib/leafletLoader';
import { CameraIcon, ShieldIcon, SirenIcon } from './icons/PetIcons';
import { useAuth } from '../context/AuthContext';

interface SupportRequestDetailProps {
  selectedRequest: CommunityUpdate;
  onBack: () => void;
  selectedLocation: string;
  getCoordinatesForLocation: (loc: string) => [number, number];
  computedMembers: CircleMember[];
}

export default function SupportRequestDetail({
  selectedRequest,
  onBack,
  selectedLocation,
  getCoordinatesForLocation,
  computedMembers
}: SupportRequestDetailProps) {
  const { incrementRescueCount } = useAuth();
  const detailMapRef = useRef<any>(null);

  // Help Modal States
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [helpMessage, setHelpMessage] = useState<string>('');

  const requestAny = selectedRequest as any;
  const displayTitle = requestAny.animalCategory 
    ? (requestAny.animalCategory.charAt(0).toUpperCase() + requestAny.animalCategory.slice(1).toLowerCase()) 
    : (selectedRequest.title || 'Emergency Support');

  const displayDesc = selectedRequest.description || '';

  const rawPhone = requestAny.contactPhone || '9876543210';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const [selectedHelpOptions, setSelectedHelpOptions] = useState<string[]>(['vet']);

  const handleHelpToggle = (option: string) => {
    setSelectedHelpOptions(prev => 
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    );
  };

  useEffect(() => {
    const centerCoords = getCoordinatesForLocation(selectedLocation);
    const detailRequestCoords = getCoordinatesForLocation(selectedRequest.location || selectedLocation);
    let isMounted = true;
    let mapInstance: any = null;
    
    const detailPins = [
      { 
        name: selectedRequest.title, 
        avatar: '🚨', 
        role: 'help_needed', 
        lat: detailRequestCoords[0], 
        lng: detailRequestCoords[1], 
        distance: selectedRequest.distance 
      },
      ...computedMembers.map(m => {
        const mCoords = m.lat && m.lng ? [m.lat, m.lng] : getCoordinatesForLocation(m.address || selectedLocation);
        return {
          name: m.fullName || 'Rescuer',
          avatar: m.profilePic,
          role: m.role || 'rescuer',
          lat: mCoords[0],
          lng: mCoords[1],
          distance: m.distance,
          badge: m.badge
        };
      })
    ];

    const loadLeafletMap = (L: any, mapId: string, center: [number, number], pins: any[]) => {
      const mapContainer = document.getElementById(mapId);
      if (!mapContainer) return;

      if (detailMapRef.current) {
        try {
          detailMapRef.current.remove();
        } catch (e) {
          console.error(e);
        }
      }

      if ((mapContainer as any)._leaflet_id) {
        delete (mapContainer as any)._leaflet_id;
      }

      const map = L.map(mapId, { zoomControl: false }).setView(center, 14);
      mapInstance = map;
      detailMapRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }).addTo(map);

      // User node center dot
      const greenDotIcon = L.divIcon({
        className: 'custom-center-icon',
        html: `<div class="w-6 h-6 bg-white rounded-full border-2 border-[#3D5A45] shadow-md flex items-center justify-center">
                 <div class="w-3 h-3 bg-[#3D5A45] rounded-full"></div>
               </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      L.marker(center, { icon: greenDotIcon }).addTo(map);

      // Draw search radius ring
      L.circle(center, {
        color: '#2D4536',
        fillColor: '#3D5A45',
        fillOpacity: 0.08,
        radius: 1200,
        weight: 1,
        opacity: 0.55
      }).addTo(map);

      const getPinColor = (role: string) => {
        switch (role) {
          case 'feeder': return '#D32F2F';
          case 'rescuer': return '#E65100';
          case 'volunteer': return '#E91E63';
          case 'paravet': return '#7B1FA2';
          case 'adopter': return '#2E7D32';
          case 'help_needed': return '#C85341';
          default: return '#546E7A';
        }
      };

      const getPinIcon = (role: string) => {
        switch (role) {
          case 'feeder':
            return `<svg class="w-3.5 h-3.5 text-[#D32F2F]" fill="currentColor" viewBox="0 0 24 24"><path d="M2 20h20v2H2v-2zm2-2h16c0-4.42-3.58-8-8-8s-8 3.58-8 8zm8-10c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>`;
          case 'adopter':
            return `<svg class="w-3.5 h-3.5 text-[#2E7D32]" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>`;
          case 'paravet':
            return `<svg class="w-3.5 h-3.5 text-[#7B1FA2]" fill="currentColor" viewBox="0 0 24 24"><path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z"/></svg>`;
          case 'volunteer':
            return `<svg class="w-3.5 h-3.5 text-[#E91E63]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
          case 'rescuer':
            return `<svg class="w-3.5 h-3.5 text-[#E65100]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
          case 'help_needed':
            return `<svg class="w-3.5 h-3.5 text-[#C85341]" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>`;
          default:
            return `<svg class="w-3.5 h-3.5 text-[#546E7A]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
        }
      };
      const centerKey = `${center[0].toFixed(6)},${center[1].toFixed(6)}`;
      const coordinatesRegistry: { [key: string]: number } = {
        [centerKey]: 0
      };

      pins.forEach(pin => {
        let lat = pin.lat;
        let lng = pin.lng;
        const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
        if (coordinatesRegistry[key] !== undefined) {
          coordinatesRegistry[key] += 1;
          const count = coordinatesRegistry[key];
          const angle = count * (Math.PI / 4);
          const radius = 0.0006 * Math.ceil(count / 8);
          lat += Math.sin(angle) * radius;
          lng += Math.cos(angle) * radius;
        } else {
          coordinatesRegistry[key] = 0;
        }

        const color = getPinColor(pin.role);
        const iconHtml = (pin.avatar && pin.avatar.startsWith('http'))
          ? `<img src="${pin.avatar}" class="w-full h-full rounded-full object-cover" />`
          : getPinIcon(pin.role);

        const goldBadgeHtml = pin.badge
          ? `<div class="absolute -top-1 -right-1 w-4 h-4 bg-[#B68A35] rounded-full border border-white flex items-center justify-center text-[8px] text-white shadow-xs">★</div>`
          : '';

        const markerHtml = `
          <div class="flex flex-col items-center">
            <div class="relative w-9 h-11 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] active:scale-95 transition-all">
              <svg class="w-9 h-11" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 0C8.06 0 0 8.06 0 18C0 28.5 18 44 18 44C18 44 36 28.5 36 18C36 8.06 27.94 0 18 0Z" fill="${color}"/>
              </svg>
              <div class="absolute top-[3px] left-[3px] w-[30px] h-[30px] rounded-full bg-white flex items-center justify-center overflow-hidden">
                ${iconHtml}
              </div>
              ${goldBadgeHtml}
            </div>
            <div class="mt-1 text-center bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md border border-[#F0EBE1] shadow-xs leading-tight whitespace-nowrap">
              <div class="text-[9px] font-extrabold text-charcoal leading-none">${pin.name}</div>
              <div class="text-[8px] font-bold text-stone-500 mt-0.5 leading-none">${pin.distance || 'Nearby'}</div>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-member-pin',
          html: markerHtml,
          iconSize: [80, 80],
          iconAnchor: [40, 44]
        });

        L.marker([lat, lng], { icon: customIcon }).addTo(map);
      });
    };

    const initMap = async () => {
      try {
        const L = await loadLeaflet();
        if (!isMounted) return;
        loadLeafletMap(L, 'detail-map', detailRequestCoords, detailPins);
      } catch (err) {
        console.error('Failed to initialize detail Leaflet map:', err);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstance) {
        try {
          mapInstance.remove();
        } catch (e) {
          console.error(e);
        }
      }
      detailMapRef.current = null;
    };
  }, [selectedRequest, selectedLocation, computedMembers]);

  return (
    <div className="min-h-screen bg-[#FDFBF9] flex flex-col animate-scaleIn relative">
      {/* Navigation/Header bar */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-[#F0EBE1] px-4 py-3 z-20 flex items-center justify-between shadow-xs select-none">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-xl border border-[#F0EBE1] bg-white flex items-center justify-center hover:bg-stone-50 active:scale-95 transition-all text-charcoal font-bold"
          >
            ←
          </button>
          <div className="flex items-center gap-2">
            <span className="font-serif text-[17px] font-bold text-[#C85341]">Support Request</span>
          </div>
        </div>
      </div>

      {/* Content body */}
      <div className="flex-grow px-4 py-5 pb-24 w-full max-w-2xl mx-auto flex flex-col gap-5">
        
        {/* Card Hero */}
        <div className="bg-white border border-[#F0EBE1] rounded-[28px] p-6 shadow-sm flex flex-col md:flex-row gap-5.5 items-center justify-between">
          <div className="flex-grow flex flex-col gap-2 min-w-0">
            <h2 className="font-serif text-xl text-charcoal font-bold leading-snug">{displayTitle}</h2>
            <span className="text-xs text-stone-500 font-semibold flex items-start gap-1.5 mt-0.5 leading-relaxed">
              <svg className="w-3.5 h-3.5 text-[#C85341] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="10" r="3"/>
                <path d="M12 21.7C12 21.7 4 14 4 10a8 8 0 0 1 16 0c0 4-8 11.7-8 11.7z"/>
              </svg>
              <span className="break-words">{selectedRequest.location || 'Sector 4 Park, Saheed Nagar'}</span>
            </span>
            <p className="text-xs md:text-[13px] text-stone-600 font-medium leading-relaxed mt-1.5">
              {displayDesc}
            </p>
          </div>
          {selectedRequest.image ? (
            <div className="w-full md:w-[140px] h-[110px] rounded-2xl overflow-hidden bg-stone-100 border border-[#F0EBE1] relative shadow-inner shrink-0 select-none">
              <img src={selectedRequest.image} alt={displayTitle} className="w-full h-full object-cover" />
              <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded-full text-[9px] font-extrabold text-white flex items-center gap-1 shadow-sm">
                <CameraIcon className="w-3 h-3 text-white" /> 2
              </div>
            </div>
          ) : (
            <div className="w-full md:w-[140px] h-[110px] rounded-2xl bg-[#FCFAF7] border border-[#F0EBE1] relative flex items-center justify-center shrink-0 select-none text-stone-400 font-medium text-[11px] text-center p-3.5 shadow-xs">
              not provided
            </div>
          )}
        </div>

        {/* Proximity Map Card */}
        <div className="bg-white border border-[#F0EBE1] rounded-[28px] p-4 shadow-sm flex flex-col gap-3 relative">
          {/* Within 10 km Badge */}
          <div className="absolute top-6 right-6 bg-white/95 border border-[#F0EBE1] px-2.5 py-1 rounded-lg text-[9px] font-bold text-stone-600 flex items-center gap-1 z-20 shadow-xs select-none">
            <span>Within 10 km</span>
            <svg className="w-3 h-3 text-stone-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/>
            </svg>
          </div>
          
          <div id="detail-map" className="h-56 w-full rounded-2xl bg-stone-100 border border-[#F0EBE1] overflow-hidden z-10" />
          
          {/* Floating target locator action button at bottom right */}
          <button 
            onClick={() => {
              if (detailMapRef.current) {
                const detailRequestCoords = getCoordinatesForLocation(selectedRequest.location || selectedLocation);
                detailMapRef.current.setView(detailRequestCoords, 15);
              }
            }}
            className="absolute bottom-6 right-6 w-9 h-9 rounded-xl bg-white border border-[#F0EBE1] flex items-center justify-center hover:bg-stone-50 active:scale-95 transition-all z-20 shadow-sm"
          >
            <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>

        {/* Details Section */}
        <div className="bg-white border border-[#F0EBE1] rounded-[28px] p-6 shadow-sm">
          <h3 className="font-serif text-base font-bold text-charcoal pb-3 border-b border-[#F5F2EC] mb-4 flex items-center gap-2 select-none">
            <svg className="w-4 h-4 text-[#C85341]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            Details
          </h3>

          {/* Details Table */}
          <div className="flex flex-col text-xs">
            <div className="flex py-3.5 border-b border-stone-100 items-start">
              <div className="w-8.5 h-8.5 rounded-xl bg-rose-50 border border-rose-100/50 flex items-center justify-center shrink-0 mr-3.5 text-[#C85341] shadow-xs">
                <svg className="w-4.5 h-4.5 text-current" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="10" r="3"/>
                  <path d="M12 21.7C12 21.7 4 14 4 10a8 8 0 0 1 16 0c0 4-8 11.7-8 11.7z"/>
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-stone-400 uppercase tracking-wider text-[9px] leading-none">Location</span>
                <span className="text-charcoal font-semibold mt-1.5 leading-relaxed break-words">
                  {selectedRequest.location || 'Near Sector 4 Park entrance, Park Street'}
                  <a href="#map" onClick={() => {
                    if (detailMapRef.current) {
                      const detailRequestCoords = getCoordinatesForLocation(selectedRequest.location || selectedLocation);
                      detailMapRef.current.setView(detailRequestCoords, 16);
                    }
                  }} className="text-[#C85341] underline ml-2 font-bold hover:text-stone-700 whitespace-nowrap">View on map</a>
                </span>
              </div>
            </div>

            <div className="flex py-3.5 border-b border-stone-100 items-start">
              {(() => {
                const reqSeverity = (selectedRequest as any).severity || 'Moderate';
                const severityLabel = reqSeverity === 'critical' ? 'Critical' : reqSeverity === 'urgent' ? 'Urgent' : reqSeverity === 'stable' ? 'Stable' : 'Moderate';
                const severityColor = ['critical', 'urgent'].includes(reqSeverity) ? 'text-[#C85341]' : reqSeverity === 'stable' ? 'text-green-600' : 'text-amber-600';
                const severityBg = ['critical', 'urgent'].includes(reqSeverity) ? 'bg-rose-50 border-rose-100/50 text-[#C85341]' : reqSeverity === 'stable' ? 'bg-green-50 border-green-100/50 text-green-600' : 'bg-amber-50 border-amber-100/50 text-amber-600';
                const severityDesc = reqSeverity === 'critical' ? 'Needs immediate vet check' : reqSeverity === 'urgent' ? 'Needs vet check and care' : reqSeverity === 'stable' ? 'Stable condition' : 'Needs attention';
                return (
                  <>
                    <div className={`w-8.5 h-8.5 rounded-xl ${severityBg} border flex items-center justify-center shrink-0 mr-3.5 shadow-xs`}>
                      <svg className="w-4.5 h-4.5 text-current" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-extrabold text-stone-400 uppercase tracking-wider text-[9px] leading-none">Urgency</span>
                      <span className="font-semibold mt-1.5 leading-relaxed">
                        <span className={`${severityColor} font-bold`}>{severityLabel}</span>
                        <span className="text-stone-400 font-bold ml-2 text-[10px]">{severityDesc}</span>
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="flex py-3.5 border-b border-stone-100 items-start">
              <div className="w-8.5 h-8.5 rounded-xl bg-stone-50 border border-stone-200/50 flex items-center justify-center shrink-0 mr-3.5 text-stone-500 shadow-xs">
                <svg className="w-4.5 h-4.5 text-current" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <line x1="7" y1="8" x2="17" y2="8" />
                  <line x1="7" y1="12" x2="17" y2="12" />
                  <line x1="7" y1="16" x2="13" y2="16" />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-stone-400 uppercase tracking-wider text-[9px] leading-none">What Happened</span>
                <span className="text-charcoal font-semibold mt-1.5 leading-relaxed break-words">
                  {selectedRequest.description && selectedRequest.description.toLowerCase() !== 'n/a'
                    ? selectedRequest.description 
                    : 'No description provided.'}
                </span>
              </div>
            </div>

            <div className="flex py-3.5 items-start">
              <div className="w-8.5 h-8.5 rounded-xl bg-[#E8F5E9]/80 border border-[#C8E6C9]/50 flex items-center justify-center shrink-0 mr-3.5 text-[#2E7D32] shadow-xs">
                <svg className="w-4.5 h-4.5 text-current" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-stone-400 uppercase tracking-wider text-[9px] leading-none">Contact</span>
                <span className="text-charcoal font-bold mt-1.5 leading-normal">
                  {selectedRequest.author || 'Anonymous Reporter'} • {(selectedRequest as any).contactPhone || '9876 543 210'}
                  <span className="text-stone-400 font-semibold block mt-1 text-[10px]">Call or message for more details</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ways you can help Grid */}
        <div className="flex flex-col gap-3 select-none">
          <h3 className="font-serif text-lg font-bold text-charcoal px-1 mt-1">Ways you can help</h3>
          <div className="grid grid-cols-4 gap-2.5">
            {[
              { 
                id: 'vet', 
                title: 'Take to Vet', 
                icon: (
                  <svg className="w-6 h-6 text-[#3D5A45]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="4"/><path d="M16 8v0a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2M12 5v14M5 12h14"/>
                  </svg>
                ),
                desc: 'Provide medical assistance' 
              },
              { 
                id: 'transport', 
                title: 'Transport', 
                icon: (
                  <svg className="w-6 h-6 text-[#5E7A68]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
                  </svg>
                ),
                desc: 'Help in safe transport' 
              },
              { 
                id: 'foster', 
                title: 'Foster Care', 
                icon: (
                  <svg className="w-6 h-6 text-[#B68A35]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M12 17v0c-1.5-1.5-2.5-2.5-2.5-3.5 0-1.1.9-2 2-2s2 .9 2 2c0 1-1 2-2 3.5z"/>
                  </svg>
                ),
                desc: 'Provide temporary care' 
              },
              { 
                id: 'support', 
                title: 'Support', 
                icon: (
                  <svg className="w-6 h-6 text-[#C85341]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5c0-3.08 2.42-5.5 5.5-5.5 1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3c3.08 0 5.5 2.42 5.5 5.5 0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                ),
                desc: 'Contribute or share leads' 
              }
            ].map(opt => (
              <div 
                key={opt.id}
                onClick={() => {
                  setSelectedHelpOptions([opt.id]);
                  setShowHelpModal(true);
                }}
                className="bg-white border border-[#F0EBE1] hover:border-[#3D5A45]/40 hover:bg-[#FCFAF7] transition-all rounded-2xl p-3 flex flex-col items-center justify-between text-center cursor-pointer shadow-xs min-h-[110px]"
              >
                <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center shrink-0 mb-1.5">
                  {opt.icon}
                </div>
                <span className="text-xs font-bold text-charcoal leading-tight">{opt.title}</span>
                <span className="text-[9px] text-stone-400 font-semibold mt-1 leading-normal line-clamp-2">{opt.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col gap-3 mt-4">
          <button 
            onClick={() => setShowHelpModal(true)}
            className="w-full py-4 bg-[#2D4536] hover:bg-[#1C2C22] active:scale-98 text-white font-bold rounded-full text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm select-none"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5c0-3.08 2.42-5.5 5.5-5.5 1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3c3.08 0 5.5 2.42 5.5 5.5 0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            I can help
          </button>

        </div>
      </div>

      {/* --- OFFER YOUR HELP MODAL (Screen 5) --- */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-end md:items-center justify-center px-4 transition-all">
          <div className="bg-white w-full max-w-lg rounded-t-[32px] md:rounded-[32px] p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto scrollbar-hide animate-scaleIn select-none">
            
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
              <div className="w-8 h-8 pointer-events-none" />
            </div>

            {/* Informative Security Banner */}
            <div className="bg-[#FDF6F0] border border-[#FBE9E7] rounded-xl p-3.5 flex items-start gap-2.5">
              <ShieldIcon className="w-5 h-5 text-terracotta shrink-0 mt-0.5" />
              <p className="text-[11px] text-stone-600 font-medium leading-relaxed">
                Your help will be shared with the reporter and nearby helpers. You can choose one or more ways to help.
              </p>
            </div>

            {/* Multi-select Help Cards */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold text-charcoal">How would you like to help?</h4>
              {[
                { id: 'vet', title: 'Take to Vet', desc: 'Provide medical assistance' },
                { id: 'transport', title: 'Transport', desc: 'Help in safe transport' },
                { id: 'foster', title: 'Foster Care', desc: 'Provide temporary care' },
                { id: 'support', title: 'Support', desc: 'Contribute or share leads' }
              ].map(item => {
                const isChecked = selectedHelpOptions.includes(item.id);
                let svgIcon;
                if (item.id === 'vet') {
                  svgIcon = (
                    <svg className="w-5 h-5 text-[#3D5A45]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4.82 17.22a3 3 0 1 1-3-3m0 0v-4a7 7 0 0 1 14 0v4m0-4V6a2 2 0 0 1 2-2h2m-6 13.22a3 3 0 1 1 3-3" />
                    </svg>
                  );
                } else if (item.id === 'transport') {
                  svgIcon = (
                    <svg className="w-5 h-5 text-[#B68A35]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 .6.4 1 1 1h2" />
                      <circle cx="7" cy="17" r="2" />
                      <path d="M9 17h6" />
                      <circle cx="17" cy="17" r="2" />
                    </svg>
                  );
                } else if (item.id === 'foster') {
                  svgIcon = (
                    <svg className="w-5 h-5 text-[#2E7D32]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  );
                } else {
                  svgIcon = (
                    <svg className="w-5 h-5 text-[#E65100]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  );
                }
                return (
                  <div 
                    key={item.id}
                    onClick={() => handleHelpToggle(item.id)}
                    className={`border rounded-2xl p-3.5 flex items-center justify-between gap-4 cursor-pointer hover:border-[#3D5A45]/30 transition-all ${
                      isChecked ? 'bg-[#FCFAF7] border-[#3D5A45] shadow-sm' : 'border-[#F0EBE1] bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200/60 flex items-center justify-center shrink-0">
                        {svgIcon}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-charcoal block">{item.title}</span>
                        <span className="text-[10px] text-stone-400 font-semibold block mt-0.5 leading-tight">{item.desc}</span>
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

            {/* Action bar */}
            <div className="flex flex-col gap-2.5 mt-2">
              <div className="grid grid-cols-2 gap-2.5">
                <a 
                  href={`tel:${rawPhone}`}
                  className="py-3 border border-stone-200 hover:border-charcoal hover:bg-stone-50 active:scale-98 text-charcoal font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer text-center"
                >
                  <svg className="w-4 h-4 text-[#3D5A45] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Call Reporter
                </a>

                {(() => {
                  const selectedLabels = selectedHelpOptions.map(opt => {
                    if (opt === 'vet') return 'Take to Vet';
                    if (opt === 'transport') return 'Transport';
                    if (opt === 'foster') return 'Foster Care';
                    if (opt === 'support') return 'Support';
                    return '';
                  }).filter(Boolean).join(', ');

                  const waText = `Hi, I saw your animal emergency request "${displayTitle || 'SOS'}" on Aumoha Circle. I want to offer help${selectedLabels ? ` with: ${selectedLabels}` : ''}!${helpMessage ? ` Message: ${helpMessage}` : ''}`;

                  return (
                    <a 
                      href={`https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        incrementRescueCount();
                      }}
                      className="py-3 border border-[#E8EFE9] bg-[#E8EFE9]/30 hover:border-[#2E7D32]/40 hover:bg-[#E8EFE9]/60 active:scale-98 text-[#2D4536] font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer text-center"
                    >
                      <svg className="w-4 h-4 text-[#2E7D32] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21.3 3.7C19.1 1.5 16.2.3 13 .3 6.5.3 1.2 5.6 1.2 12.1c0 2.1.5 4.1 1.6 5.9L1 23.3l5.5-1.4c1.7 1 3.7 1.5 5.7 1.5 6.5 0 11.8-5.3 11.8-11.8 0-3.1-1.2-6.1-3.4-8.2zM13 21.6c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-3.8 1 1-3.7-.2-.4c-1-1.6-1.6-3.5-1.6-5.4 0-5.5 4.5-10 10-10 2.7 0 5.2 1.1 7.1 3 1.9 1.9 2.9 4.4 2.9 7.1-.1 5.5-4.6 10-10.1 10zM18.4 15c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.5-1.7-1.6-2-.2-.3 0-.5.1-.6s.3-.3.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4-.1-.5-.1-.1-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.7c-.2 0-.6.1-.9.4s-1 1-1 2.4c0 1.4 1 2.8 1.2 3 .1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 2-1.3.3-.6.3-1.2.2-1.3s-.3-.2-.6-.3z"/>
                      </svg>
                      WhatsApp
                    </a>
                  );
                })()}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
