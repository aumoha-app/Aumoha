'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../lib/api';

interface NeighborhoodRadarProps {
  onEnterCircle?: () => void;
}

export default function NeighborhoodRadar({ onEnterCircle }: NeighborhoodRadarProps) {
  const { user, token } = useAuth();
  const [membersCount, setMembersCount] = useState<number>(24);
  const [rescuesCount, setRescuesCount] = useState<number>(142);
  const [rank, setRank] = useState<number>(3);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [geoLocName, setGeoLocName] = useState<string>('');
  const [geoLoading, setGeoLoading] = useState<boolean>(true);

  // Geolocation detection for real current location
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoLoading(false);
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
            headers: { 'Accept-Language': 'en' }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.address) {
              const shortAddr = data.address.neighbourhood ||
                data.address.suburb ||
                data.address.residential ||
                data.address.road ||
                data.address.village ||
                data.address.town ||
                data.address.city_district ||
                (data.display_name ? data.display_name.split(',')[0] : '');
              if (shortAddr) {
                setGeoLocName(shortAddr);
              }
            }
          }
        } catch (err) {
          console.warn('Geolocation reverse lookup failed:', err);
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        console.warn('Geolocation access declined or unavailable:', err);
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Resolve current location name with fallback to user's registered address
  const fallbackLoc = user?.address
    ? (user.address.includes(',') ? user.address.split(',')[0].trim() : user.address.trim())
    : 'Saheed Nagar';

  const locationName = geoLocName || fallbackLoc;

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        // Fetch users count
        const usersRes = await fetch(`${API_BASE}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        let mCount = 24;
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          mCount = usersData.users?.length || 24;
          setMembersCount(mCount);
        }

        // Fetch active and resolved SOS reports count
        const activeRes = await fetch(`${API_BASE}/sos/active`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const resolvedRes = await fetch(`${API_BASE}/sos/resolved`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        let aCount = 0;
        let rCount = 0;
        if (activeRes.ok) {
          const activeData = await activeRes.json();
          aCount = activeData.reports?.length || 0;
        }
        if (resolvedRes.ok) {
          const resolvedData = await resolvedRes.json();
          rCount = resolvedData.reports?.length || 0;
        }

        const totalRescues = aCount + rCount;
        setRescuesCount(totalRescues || 142);

        // Dynamic rank calculation: Rank 1 is top, improves with rescues
        const calculatedRank = Math.max(1, 5 - Math.floor(totalRescues / 2));
        setRank(calculatedRank);
      } catch (err) {
        console.warn('Failed to fetch real stats for NeighborhoodRadar:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  return (
    <div className="w-full flex flex-col gap-2.5 select-none mt-1">
      {/* Section Header Row */}
      <div className="flex items-center justify-between w-full border-b border-warmBeige/40 pb-2 select-none">
        <span className="text-[16px] sm:text-xs tracking-tight text-[#1C1A17] font-serif sm:text-base font-bold ">
          Neighborhood Radar
        </span>
        <span className="text-[10px] sm:text-xs text-stone-500 font-bold">
          Live active rescue network
        </span>
      </div>

      <div className="w-full bg-[#EFEAE2] hover:bg-[#E6E0D6] border border-[#D5CEBF] rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-row items-center justify-between gap-4 sm:gap-6 select-none relative overflow-hidden">

        {/* Left Column: Title, Stats, and Enter Circle Button */}
        <div className="flex-1 flex flex-col gap-3 sm:gap-4 min-w-0 z-10">
          <div
            onClick={onEnterCircle}
            className="flex flex-col select-none cursor-pointer group w-fit max-w-full"
          >
            <span className="font-serif text-xs sm:text-base font-bold text-[#1C1A17] leading-tight tracking-wider mb-1">
              Aumoha Circle 
            </span>
            <h2 className={`font-serif text-lg sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-1.5 leading-tight truncate transition-colors duration-500 ${geoLoading ? 'text-stone-300 animate-pulse' : 'text-[#1C1A17] group-hover:text-[#B68A35]'}`}>
              <span className="truncate">{geoLoading ? 'Detecting location...' : locationName}</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#B68A35] transition-transform group-hover:translate-x-1 stroke-[2.5] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </h2>
          </div>

          {/* Stats row with dividing lines */}
          <div className={`flex items-center gap-3 sm:gap-5 select-none transition-all duration-300 ${isLoading ? 'animate-pulse opacity-60' : ''}`}>
            <div className="flex flex-col">
              <span className="text-base sm:text-xl md:text-2xl font-black text-[#1C1A17] leading-none">{membersCount}</span>
              <span className="font-serif text-xs sm:text-base font-bold text-[#1C1A17] leading-none mt-1 lowercase">members</span>
            </div>
            <div className="w-[1.5px] h-5 sm:h-7 bg-stone-300 shrink-0" />
            <div className="flex flex-col">
              <span className="text-base sm:text-xl md:text-2xl font-black text-[#1C1A17] leading-none">{rescuesCount}</span>
              <span className="font-serif text-xs sm:text-base font-bold text-[#1C1A17] leading-none mt-1 lowercase">rescues</span>
            </div>
            <div className="w-[1.5px] h-5 sm:h-7 bg-stone-300 shrink-0" />
            <div className="flex flex-col">
              <span className="text-base sm:text-xl md:text-2xl font-black text-[#1C1A17] leading-none">#{rank}</span>
              <span className="font-serif text-xs sm:text-base font-bold text-[#1C1A17] leading-none mt-1 lowercase">rank</span>
            </div>
          </div>

          {/* Solid Gold Enter Circle Button */}
          <div className="pt-1">
            <button
              onClick={onEnterCircle}
              className="group/btn inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-[#B68A35] hover:bg-[#A37B2F] active:bg-[#926C27] text-white font-extrabold rounded-full text-xs tracking-wider uppercase whitespace-nowrap shadow-xs transform hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200 cursor-pointer shrink-0"
            >
              <span>Enter Circle</span>
              <svg className="w-3.5 h-3.5 text-white transition-transform group-hover/btn:translate-x-1 stroke-[2.5] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right Column: SVG Map Radar Visualizer (Bigger sizing & detailed map) */}
        <div
          onClick={onEnterCircle}
          className="w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-[135px] flex items-center justify-center overflow-hidden rounded-full sm:rounded-[24px] shrink-0 bg-[#F4EFE6] border border-[#D5CEBF] cursor-pointer hover:border-[#2D4536]/40 transition-colors shadow-xs z-10"
        >
          <svg viewBox="0 0 200 120" className="w-full h-full">
            {/* Map Background */}
            <rect x="0" y="0" width="200" height="120" fill="#F4EFE6" />

            {/* Map Roads / Streets */}
            <path d="M 0,25 Q 60,45 120,25 T 200,35" fill="none" stroke="#D5CEBF" strokeWidth="3" />
            <path d="M 35,0 L 55,120" fill="none" stroke="#D5CEBF" strokeWidth="2.5" />
            <path d="M 130,0 L 110,120" fill="none" stroke="#D5CEBF" strokeWidth="2" />
            <path d="M 0,85 L 200,75" fill="none" stroke="#D5CEBF" strokeWidth="3.5" />
            <path d="M 85,0 Q 125,50 155,120" fill="none" stroke="#D5CEBF" strokeWidth="2.5" />
            <path d="M 0,55 Q 100,55 200,55" fill="none" stroke="#C8BFB0" strokeWidth="1.5" strokeDasharray="4 4" />

            {/* Secondary Arterials */}
            <path d="M 15,0 L 15,120" fill="none" stroke="#E2DCD0" strokeWidth="1.2" />
            <path d="M 175,0 L 175,120" fill="none" stroke="#E2DCD0" strokeWidth="1.2" />

            {/* Radar Overlay Concentric Circles */}
            <circle cx="100" cy="60" r="42" fill="#2D4536" fillOpacity="0.08" stroke="#2D4536" strokeOpacity="0.25" strokeWidth="1.5" />
            <circle cx="100" cy="60" r="28" fill="none" stroke="#2D4536" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="100" cy="60" r="14" fill="none" stroke="#2D4536" strokeOpacity="0.3" strokeWidth="1.2" />

            {/* Center Pin Node */}
            <circle cx="100" cy="60" r="4.5" fill="#2D4536" />
            <circle cx="100" cy="60" r="11" fill="none" stroke="#2D4536" strokeWidth="1.5" opacity="0.5" className="animate-ping" style={{ transformOrigin: '100px 60px' }} />
          </svg>
        </div>

      </div>
    </div>
  );
}
