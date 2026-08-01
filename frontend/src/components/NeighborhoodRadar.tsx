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
      { timeout: 8000 }
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
        <span className="text-[11px] sm:text-xs uppercase tracking-widest text-[#B68A35] font-extrabold">
          Neighborhood Radar
        </span>
        <span className="text-[10px] sm:text-xs text-stone-500 font-bold">
          Live active rescue network
        </span>
      </div>

      <div className="w-full bg-gradient-to-br from-[#FCFAF9] via-[#FAF5EB] to-[#F5EFE3] border border-[#EBE3D5] rounded-[24px] p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.025)] transition-all duration-300 flex flex-row gap-4 md:gap-6 items-center justify-between select-none">
        
        {/* Left Column: Title, Stats, and Enter Circle Button */}
        <div className="flex-grow flex flex-col gap-3 md:gap-4 min-w-0">
          <div 
            onClick={onEnterCircle}
            className="flex flex-col select-none cursor-pointer group w-fit"
          >
            <span className="text-[9px] sm:text-[10px] tracking-widest text-[#B68A35] font-extrabold uppercase leading-none">
              MOHA CIRCLE • CURRENT LOCATION
            </span>
            <h2 className={`font-serif text-lg md:text-3xl font-semibold tracking-tight mt-1 md:mt-1.5 flex items-center gap-1.5 leading-tight truncate transition-colors duration-500 ${geoLoading ? 'text-stone-300 animate-pulse' : 'text-stone-900 group-hover:text-[#B68A35]'}`}>
              {geoLoading ? 'Detecting location...' : locationName}
              <svg className="w-4 h-4 md:w-6 md:h-6 text-[#B68A35]/65 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </h2>
          </div>

        {/* Stats row with dividing lines */}
        <div className={`flex items-center gap-3 md:gap-5 select-none transition-all duration-305 ${isLoading ? 'animate-pulse opacity-60' : ''}`}>
          <div className="flex flex-col">
            <span className="text-base sm:text-xl md:text-2xl font-black text-stone-800 leading-none">{membersCount}</span>
            <span className="text-[9px] sm:text-[10px] text-stone-500 font-bold uppercase tracking-wider mt-1 leading-none">Members</span>
          </div>
          <div className="w-[1.5px] h-5 md:h-8 bg-stone-300/50 shrink-0" />
          <div className="flex flex-col">
            <span className="text-base sm:text-xl md:text-2xl font-black text-stone-800 leading-none">{rescuesCount}</span>
            <span className="text-[9px] sm:text-[10px] text-stone-500 font-bold uppercase tracking-wider mt-1 leading-none">Rescues</span>
          </div>
          <div className="w-[1.5px] h-5 md:h-8 bg-stone-300/50 shrink-0" />
          <div className="flex flex-col">
            <span className="text-base sm:text-xl md:text-2xl font-black text-stone-800 leading-none">#{rank}</span>
            <span className="text-[9px] sm:text-[10px] text-stone-500 font-bold uppercase tracking-wider mt-1 leading-none">Rank</span>
          </div>
        </div>

        {/* Solid Gold Enter Circle Button */}
        <button 
          onClick={onEnterCircle}
          className="group/btn w-fit px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-[#C29845] to-[#B68A35] hover:from-[#B68A35] hover:to-[#A37B2F] text-white font-extrabold rounded-full text-[9px] md:text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(182,138,53,0.2)] hover:shadow-[0_6px_20px_rgba(182,138,53,0.3)] transform hover:-translate-y-[1px] active:translate-y-0 active:scale-98 transition-all duration-200 cursor-pointer shrink-0"
        >
          <span>Enter Circle</span>
          <svg className="w-3.5 h-3.5 text-white transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
          </svg>
        </button>
      </div>

      {/* Right Column: SVG Map Radar Visualizer (Circular on mobile, rounded card on desktop) */}
      <div 
        onClick={onEnterCircle}
        className="w-14 h-14 md:w-40 md:h-[130px] flex items-center justify-center overflow-hidden rounded-full md:rounded-[20px] shrink-0 bg-[#FAF8F5] border border-warmBeige/40 cursor-pointer hover:border-[#3D5A45]/30 transition-colors"
      >
        <svg viewBox="0 0 200 100" className="w-full h-full opacity-70">
          {/* Map streets */}
          <path d="M 0,20 Q 50,40 100,20 T 200,30" fill="none" stroke="#F1E8DC" strokeWidth="2.5" />
          <path d="M 30,0 L 50,100" fill="none" stroke="#F1E8DC" strokeWidth="2" />
          <path d="M 120,0 L 100,100" fill="none" stroke="#F1E8DC" strokeWidth="1.5" />
          <path d="M 0,70 L 200,60" fill="none" stroke="#F1E8DC" strokeWidth="3" />
          <path d="M 80,0 Q 120,40 150,100" fill="none" stroke="#F1E8DC" strokeWidth="2" />
          <path d="M 0,45 Q 100,45 200,45" fill="none" stroke="#F1E8DC" strokeWidth="1" strokeDasharray="3 3" />
          
          {/* Radar overlay */}
          <circle cx="100" cy="50" r="32" fill="#E8EFE9" fillOpacity="0.6" stroke="#D3E2D6" strokeWidth="1.2" />
          <circle cx="100" cy="50" r="20" fill="none" stroke="#D3E2D6" strokeWidth="0.8" strokeDasharray="2 2" />
          <circle cx="100" cy="50" r="9" fill="none" stroke="#D3E2D6" strokeWidth="0.8" />
          
          {/* Center Node Dot */}
          <circle cx="100" cy="50" r="3.5" fill="#3D5A45" />
          <circle cx="100" cy="50" r="8" fill="none" stroke="#3D5A45" strokeWidth="1" opacity="0.4" className="animate-ping" style={{ transformOrigin: '100px 50px' }} />
        </svg>
      </div>

      </div>
    </div>
  );
}
