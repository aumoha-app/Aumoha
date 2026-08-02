import { useState, useEffect } from 'react';
import { CircleMember } from '../types';
import { API_BASE } from '../lib/api';

interface MohallaImpactProps {
  computedMembers: CircleMember[];
  dbSosReports: any[];
  selectedLocation: string;
  getCoordinatesForLocation: (loc: string) => [number, number];
}

export default function MohallaImpact({ 
  computedMembers, 
  dbSosReports, 
  selectedLocation, 
  getCoordinatesForLocation 
}: MohallaImpactProps) {
  const [checkoutCountryCode, setCheckoutCountryCode] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/settings/checkout-phone`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success') {
            setCheckoutCountryCode(data.countryCode || '');
            setCheckoutPhone(data.phoneNumber || '');
          }
        }
      } catch (err) {
        console.warn('Failed to load checkout settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const getReportDistance = (reportLocation: string): number => {
    const coords = getCoordinatesForLocation(reportLocation || '');
    const userCoords = getCoordinatesForLocation(selectedLocation);
    const lat1 = userCoords[0];
    const lon1 = userCoords[1];
    const lat2 = coords[0];
    const lon2 = coords[1];
    
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const nearbyHelpers = computedMembers.filter(m => {
    if (m.role === 'normal' || m.role as string === 'member') return false;
    return (m.distanceVal ?? 9999) <= 10.0;
  });

  const activeSosCount = dbSosReports.filter(r => {
    if (r.status !== 'active') return false;
    return getReportDistance(r.location || '') <= 10.0;
  }).length;

  const ongoingCareCount = dbSosReports.filter(r => {
    if (r.status !== 'dispatched') return false;
    return getReportDistance(r.location || '') <= 10.0;
  }).length;

  const currentMonthYear = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  }).toUpperCase();

  const handleWhatsAppClick = () => {
    const cleanCountryCode = checkoutCountryCode.replace('+', '');
    const phoneNumber = checkoutPhone ? `${cleanCountryCode}${checkoutPhone}` : '919876543210';
    const message = encodeURIComponent("Hi! I would like to support Aumoha Circle with a donation. Please let me know how I can contribute.");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const handleInviteClick = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://aumoha.org';
    const shareData = {
      title: 'Join Aumoha Rescue Network!',
      text: 'Help rescue, feed and care for stray animals in our community. Join Aumoha Circle today!',
      url: shareUrl
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Aumoha Circle link copied to clipboard! Share it with your neighbors.');
      } catch (copyErr) {
        window.prompt('Copy this link to invite your neighbors:', shareUrl);
      }
    }
  };

  const handleShareDashboardClick = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://aumoha.org';
    const activeHelpersCount = computedMembers.filter(m => m.role !== 'normal' && m.role as string !== 'member').length;
    const shareData = {
      title: 'My Aumoha Impact Dashboard',
      text: `Check out our collective community impact on Aumoha this month: ${activeHelpersCount} helpers active, saving stray animals! Join us.`,
      url: shareUrl
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Impact dashboard link copied to clipboard!');
      } catch (copyErr) {
        window.prompt('Copy this link to share the impact dashboard:', shareUrl);
      }
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-scaleIn select-none font-serif text-base">
      
      {/* STATS TILES CARD */}
      <div className="bg-[#F5F2EC] border border-[#EBE3D5] rounded-2xl sm:rounded-[24px] p-3.5 xs:p-4.5 sm:p-6 shadow-xs flex flex-col gap-3.5 sm:gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-base xs:text-lg sm:text-xl font-bold text-[#1C1A17] tracking-tight">This Month</h3>
            <span className="font-serif text-[10px] xs:text-xs text-[#2D4536] uppercase tracking-wider font-bold mt-0.5 block">{currentMonthYear}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 xs:gap-3 sm:gap-4 text-center mt-1 select-none">
          {/* Members Metric */}
          <div className="flex flex-col items-center">
            <span className="mb-1 flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#EFEBE3] border border-[#EBE3D5] text-[#2D4536] shadow-2xs">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#2D4536]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span className="font-serif text-2xl xs:text-3xl sm:text-4xl font-extrabold text-[#2D4536] mt-1 leading-none">
              {nearbyHelpers.length}
            </span>
            <span className="font-serif text-xs xs:text-sm sm:text-base text-[#2D4536] font-bold block mt-1 leading-tight">Helpers</span>
            <span className="font-serif text-[10px] sm:text-xs text-stone-600 font-medium block leading-tight mt-0.5">registered</span>
          </div>
          
          {/* Active SOS Metric */}
          <div className="flex flex-col items-center">
            <span className="mb-1 flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#EFEBE3] border border-[#EBE3D5] text-[#2D4536] shadow-2xs">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#2D4536]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
            <span className="font-serif text-2xl xs:text-3xl sm:text-4xl font-extrabold text-[#2D4536] mt-1 leading-none">{activeSosCount}</span>
            <span className="font-serif text-xs xs:text-sm sm:text-base text-[#2D4536] font-bold block mt-1 leading-tight">Emergencies</span>
            <span className="font-serif text-[10px] sm:text-xs text-stone-600 font-medium block leading-tight mt-0.5">active SOS</span>
          </div>

          {/* Ongoing Care Metric */}
          <div className="flex flex-col items-center">
            <span className="mb-1 flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#EFEBE3] border border-[#EBE3D5] text-[#2D4536] shadow-2xs">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#2D4536]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4" /><path d="M16 8v0a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2M12 5v14M5 12h14" />
              </svg>
            </span>
            <span className="font-serif text-2xl xs:text-3xl sm:text-4xl font-extrabold text-[#2D4536] mt-1 leading-none">{ongoingCareCount}</span>
            <span className="font-serif text-xs xs:text-sm sm:text-base text-[#2D4536] font-bold block mt-1 leading-tight">Ongoing Care</span>
            <span className="font-serif text-[10px] sm:text-xs text-stone-600 font-medium block leading-tight mt-0.5">dispatched alerts</span>
          </div>
        </div>

        {/* Motivational message banner */}
        <div className="bg-[#EFEBE3] border border-[#EBE3D5] rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2.5 sm:gap-3 mt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#2D4536] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34M12 2a5 5 0 0 0-5 5v3c0 2.76 2.24 5 5 5s5-2.24 5-5V7a5 5 0 0 0-5-5z" />
            </svg>
            <div className="flex flex-col min-w-0">
              <span className="font-serif font-bold text-[#1C1A17] text-xs xs:text-sm sm:text-base leading-tight truncate">You're making a difference!</span>
              <span className="font-serif text-stone-600 text-[11px] xs:text-xs sm:text-sm font-medium leading-snug truncate mt-0.5">Keep going, you're helping build a kinder Mohalla.</span>
            </div>
          </div>
          <button
            onClick={handleShareDashboardClick}
            className="font-serif text-xs sm:text-sm font-bold text-[#2D4536] hover:text-[#1F3325] flex items-center gap-1.5 bg-[#F5F2EC] border border-[#EBE3D5] px-3 py-1.5 rounded-xl active:scale-95 transition-all shadow-2xs cursor-pointer shrink-0 self-end xs:self-center"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-current" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
            </svg>
            Share
          </button>
        </div>
      </div>

      {/* DONATE CARD PANEL */}
      <div className="bg-[#F5F2EC] border border-[#EBE3D5] rounded-2xl sm:rounded-[24px] p-4 xs:p-5 sm:p-6 shadow-xs flex flex-col gap-4.5 sm:gap-5">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Header Icon with dark forest green theme bg */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#EFEBE3] border border-[#EBE3D5] flex items-center justify-center text-[#2D4536] shrink-0 shadow-2xs">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <div className="flex-grow min-w-0">
            <h4 className="font-serif text-base sm:text-lg font-bold text-[#1C1A17] leading-snug">Donate to Amoha Circle</h4>
            <p className="font-serif text-xs sm:text-sm text-stone-600 font-medium leading-relaxed mt-1">
              Your donations directly support animal welfare in our community. Contributions fund our vital network of rescuers, feeders, and volunteers to cover immediate costs.
            </p>
          </div>
        </div>

        {/* Structured List of supported actions (Grid format for visual clarity) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 px-0.5">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="w-7 h-7 rounded-full bg-[#EFEBE3] border border-[#EBE3D5] flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-3.5 h-3.5 text-[#2D4536]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M4.82 17.22a3 3 0 1 1-3-3m0 0v-4a7 7 0 0 1 14 0v4m0-4V6a2 2 0 0 1 2-2h2m-6 13.22a3 3 0 1 1 3-3" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xs xs:text-sm sm:text-base font-bold text-[#1C1A17]">Medical Treatments</span>
              <span className="font-serif text-[11px] xs:text-xs sm:text-sm text-stone-600 font-medium leading-snug">Critical medicines, vaccines, and paravet aid.</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="w-7 h-7 rounded-full bg-[#EFEBE3] border border-[#EBE3D5] flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-3.5 h-3.5 text-[#2D4536]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 .6.4 1 1 1h2" />
                <circle cx="7" cy="17" r="2" />
                <path d="M9 17h6" />
                <circle cx="17" cy="17" r="2" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xs xs:text-sm sm:text-base font-bold text-[#1C1A17]">Rescue Transports</span>
              <span className="font-serif text-[11px] xs:text-xs sm:text-sm text-stone-600 font-medium leading-snug">Ambulances and logistics to veterinary hospitals.</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="w-7 h-7 rounded-full bg-[#EFEBE3] border border-[#EBE3D5] flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-3.5 h-3.5 text-[#2D4536]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M12 2v4M12 18h.01M3 20h18M5 10a7 7 0 0 0 14 0H5z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xs xs:text-sm sm:text-base font-bold text-[#1C1A17]">Nutritious Feeding Drives</span>
              <span className="font-serif text-[11px] xs:text-xs sm:text-sm text-stone-600 font-medium leading-snug">Daily feeding logs for community stray packs.</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="w-7 h-7 rounded-full bg-[#EFEBE3] border border-[#EBE3D5] flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-3.5 h-3.5 text-[#2D4536]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xs xs:text-sm sm:text-base font-bold text-[#1C1A17]">Temporary Care Support</span>
              <span className="font-serif text-[11px] xs:text-xs sm:text-sm text-stone-600 font-medium leading-snug">Safe foster spaces for dogs and cats in recovery.</span>
            </div>
          </div>
        </div>

        {/* WhatsApp Donate CTA Button */}
        <div className="flex flex-col gap-3 mt-1 items-center">
          <button
            onClick={handleWhatsAppClick}
            className="w-full py-3.5 bg-[#2D4536] hover:bg-[#1F3325] text-white rounded-2xl flex items-center justify-center gap-2.5 font-serif text-xs sm:text-sm font-bold transition-all duration-300 shadow-2xs hover:shadow-xs active:scale-[0.98] select-none cursor-pointer tracking-wider"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97C16.59 2.028 14.11 1.002 11.99 1.002c-5.43 0-9.85 4.37-9.854 9.8-.001 1.714.463 3.39 1.343 4.88l-.997 3.64 3.735-.978zM15.8 12.9c-.2-.1-1.2-.6-1.39-.7-.19-.07-.33-.1-.47.1-.14.2-.54.7-.66.82-.12.14-.24.16-.44.06-.2-.1-.84-.31-1.6-1-.59-.52-.99-1.17-1.1-1.37-.11-.2-.01-.3.09-.4.09-.09.2-.24.3-.36.1-.12.14-.2.2-.33.06-.14.03-.26-.01-.36-.05-.1-.47-1.17-.65-1.6-.17-.4-.35-.34-.48-.34-.13 0-.27-.01-.41-.01s-.38.05-.58.27c-.2.21-.75.74-.75 1.8s.77 2.09.88 2.24c.11.15 1.51 2.31 3.66 3.24.51.22.91.35 1.22.45.52.16.99.14 1.36.09.41-.06 1.2-.49 1.37-.97.17-.47.17-.88.12-.97-.05-.1-.19-.15-.39-.25z" />
            </svg>
            Contact on WhatsApp to Donate
          </button>
        </div>

        {/* Informational note about online payments */}
        <div className="bg-[#EFEBE3] border border-[#EBE3D5] rounded-2xl p-3.5 sm:p-4 flex items-start gap-3 font-serif">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#F5F2EC] border border-[#EBE3D5] flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2D4536]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-serif font-bold text-[#1C1A17] text-xs sm:text-sm leading-tight">Online Tracking & Payments Coming Soon</span>
            <span className="font-serif text-[11px] xs:text-xs sm:text-sm font-medium text-stone-600 leading-relaxed block mt-0.5">
              Secure payment integrations and live donation-to-rescue mapping logs will be added in our next release. For now, WhatsApp allows our volunteers to share direct receipts and updates on cases.
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER CALL TO ACTION */}
      <div className="bg-[#F5F2EC] border border-[#EBE3D5] rounded-2xl sm:rounded-[24px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#EFEBE3] border border-[#EBE3D5] flex items-center justify-center shrink-0 shadow-inner">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#2D4536]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M12 22V12M12 12c-4.42 0-8-3.58-8-8 4.42 0 8 3.58 8 8zm0 0c4.42 0 8-3.58 8-8-4.42 0-8 3.58-8 8z" />
            </svg>
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-serif font-bold text-[#2D4536] block text-xs xs:text-sm sm:text-base leading-tight">Stronger together. Kinder together.</span>
            <span className="font-serif text-stone-600 text-[11px] xs:text-xs sm:text-sm font-medium leading-relaxed">Your actions today create a safer, happier tomorrow for animals.</span>
          </div>
        </div>
        <button
          onClick={handleInviteClick}
          className="w-full sm:w-auto px-4 py-2.5 bg-[#2D4536] hover:bg-[#1F3325] active:scale-95 text-white font-serif text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Invite Neighbors
        </button>
      </div>

    </div>
  );
}
