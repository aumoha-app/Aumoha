import { useState, useEffect } from 'react';
import { CircleMember } from '../types';
import { API_BASE } from '../lib/api';
import RadiusSelector from './RadiusSelector';
import { 
  Users, 
  AlertTriangle, 
  Activity, 
  Trophy, 
  Share2, 
  Heart, 
  Stethoscope, 
  Truck, 
  Utensils, 
  Home, 
  MessageCircle, 
  Calendar, 
  Sprout, 
  UserPlus 
} from 'lucide-react';

interface MohallaImpactProps {
  computedMembers: CircleMember[];
  dbSosReports: any[];
  selectedLocation: string;
  getCoordinatesForLocation: (loc: string) => [number, number];
  selectedRadius?: number;
  onSelectRadius?: (radiusKm: number) => void;
}

export default function MohallaImpact({ 
  computedMembers, 
  dbSosReports, 
  selectedLocation, 
  getCoordinatesForLocation,
  selectedRadius = 10,
  onSelectRadius
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

  const radiusKm = selectedRadius === 0 ? 99999 : selectedRadius;

  const nearbyHelpers = computedMembers.filter(m => {
    if (m.role === 'normal' || m.role as string === 'member') return false;
    return (m.distanceVal ?? 9999) / 1000 <= radiusKm;
  });

  const activeSosCount = dbSosReports.filter(r => {
    if (r.status !== 'active') return false;
    return getReportDistance(r.location || '') <= radiusKm;
  }).length;

  const ongoingCareCount = dbSosReports.filter(r => {
    if (r.status !== 'dispatched') return false;
    return getReportDistance(r.location || '') <= radiusKm;
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
    <div className="w-full flex flex-col gap-4 sm:gap-5 animate-scaleIn select-none font-serif text-sm">
      {/* RADIUS SELECTOR BAR */}
      {onSelectRadius && (
        <div className="w-full bg-[#F5F2EC] border border-[#EBE3D5] rounded-2xl p-3 shadow-2xs font-sans">
          <RadiusSelector
            selectedRadius={selectedRadius}
            onSelectRadius={onSelectRadius}
          />
        </div>
      )}

      {/* STATS TILES CARD */}
      <div className="bg-[#F5F2EC] border border-[#EBE3D5] rounded-2xl sm:rounded-[24px] p-4 sm:p-5 shadow-xs flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#1C1A17] tracking-tight">This Month</h3>
            <span className="font-serif text-[10px] text-[#2D4536] uppercase tracking-wider font-bold mt-0.5 block">{currentMonthYear}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center mt-0.5 select-none">
          {/* Members Metric */}
          <div className="flex flex-col items-center">
            <span className="mb-1 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#EFEBE3] border border-[#EBE3D5] text-[#2D4536] shadow-2xs">
              <Users className="w-4 h-4 text-[#2D4536]" />
            </span>
            <span className="font-serif text-2xl sm:text-3xl font-extrabold text-[#2D4536] mt-0.5 leading-none">
              {nearbyHelpers.length}
            </span>
            <span className="font-serif text-xs sm:text-sm text-[#2D4536] font-bold block mt-1 leading-tight">Helpers</span>
            <span className="font-serif text-[10px] text-stone-600 font-medium block leading-tight mt-0.5">registered</span>
          </div>
          
          {/* Active SOS Metric */}
          <div className="flex flex-col items-center">
            <span className="mb-1 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#EFEBE3] border border-[#EBE3D5] text-[#2D4536] shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-[#2D4536]" />
            </span>
            <span className="font-serif text-2xl sm:text-3xl font-extrabold text-[#2D4536] mt-0.5 leading-none">{activeSosCount}</span>
            <span className="font-serif text-xs sm:text-sm text-[#2D4536] font-bold block mt-1 leading-tight">Emergencies</span>
            <span className="font-serif text-[10px] text-stone-600 font-medium block leading-tight mt-0.5">active SOS</span>
          </div>

          {/* Ongoing Care Metric */}
          <div className="flex flex-col items-center">
            <span className="mb-1 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#EFEBE3] border border-[#EBE3D5] text-[#2D4536] shadow-2xs">
              <Activity className="w-4 h-4 text-[#2D4536]" />
            </span>
            <span className="font-serif text-2xl sm:text-3xl font-extrabold text-[#2D4536] mt-0.5 leading-none">{ongoingCareCount}</span>
            <span className="font-serif text-xs sm:text-sm text-[#2D4536] font-bold block mt-1 leading-tight">Ongoing Care</span>
            <span className="font-serif text-[10px] text-stone-600 font-medium block leading-tight mt-0.5">dispatched</span>
          </div>
        </div>

        {/* Motivational message banner */}
        <div className="bg-[#EFEBE3] border border-[#EBE3D5] rounded-xl sm:rounded-2xl p-3 sm:p-3.5 flex flex-row items-center justify-between gap-3 mt-0.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <Trophy className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#2D4536] shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-serif font-bold text-[#1C1A17] text-xs sm:text-sm leading-tight truncate">You're making a difference!</span>
              <span className="font-serif text-stone-600 text-[10px] sm:text-xs font-medium leading-snug truncate mt-0.5">Keep going, you're helping build a kinder Mohalla.</span>
            </div>
          </div>
          <button
            onClick={handleShareDashboardClick}
            className="font-serif text-xs font-bold text-[#2D4536] hover:text-[#1F3325] flex items-center gap-1.5 bg-[#F5F2EC] border border-[#EBE3D5] px-3 py-1.5 rounded-xl active:scale-95 transition-all shadow-2xs cursor-pointer shrink-0"
          >
            <Share2 className="w-3.5 h-3.5 text-current" />
            Share
          </button>
        </div>
      </div>

      {/* DONATE CARD PANEL */}
      <div className="bg-[#F5F2EC] border border-[#EBE3D5] rounded-2xl sm:rounded-[24px] p-4 sm:p-5 shadow-xs flex flex-col gap-4">
        <div className="flex items-start gap-3">
          {/* Header Icon */}
          <div className="w-10 h-10 rounded-2xl bg-[#EFEBE3] border border-[#EBE3D5] flex items-center justify-center text-[#2D4536] shrink-0 shadow-2xs">
            <Heart className="w-5 h-5 fill-current text-[#2D4536]" />
          </div>
          <div className="flex-grow min-w-0">
            <h4 className="font-serif text-base sm:text-lg font-bold text-[#1C1A17] leading-snug">Donate to Amoha Circle</h4>
            <p className="font-serif text-xs sm:text-sm text-stone-600 font-medium leading-relaxed mt-1">
              Your donations directly support animal welfare in our community. Contributions fund our vital network of rescuers, feeders, and volunteers.
            </p>
          </div>
        </div>

        {/* Structured List of supported actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-0.5">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#EFEBE3] border border-[#EBE3D5] flex items-center justify-center shrink-0 mt-0.5">
              <Stethoscope className="w-3.5 h-3.5 text-[#2D4536]" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xs sm:text-sm font-bold text-[#1C1A17]">Medical Treatments</span>
              <span className="font-serif text-[11px] sm:text-xs text-stone-600 font-medium leading-snug">Critical medicines, vaccines, and paravet aid.</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#EFEBE3] border border-[#EBE3D5] flex items-center justify-center shrink-0 mt-0.5">
              <Truck className="w-3.5 h-3.5 text-[#2D4536]" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xs sm:text-sm font-bold text-[#1C1A17]">Rescue Transports</span>
              <span className="font-serif text-[11px] sm:text-xs text-stone-600 font-medium leading-snug">Ambulances and logistics to veterinary hospitals.</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#EFEBE3] border border-[#EBE3D5] flex items-center justify-center shrink-0 mt-0.5">
              <Utensils className="w-3.5 h-3.5 text-[#2D4536]" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xs sm:text-sm font-bold text-[#1C1A17]">Nutritious Feeding Drives</span>
              <span className="font-serif text-[11px] sm:text-xs text-stone-600 font-medium leading-snug">Daily feeding logs for community stray packs.</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#EFEBE3] border border-[#EBE3D5] flex items-center justify-center shrink-0 mt-0.5">
              <Home className="w-3.5 h-3.5 text-[#2D4536]" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xs sm:text-sm font-bold text-[#1C1A17]">Temporary Care Support</span>
              <span className="font-serif text-[11px] sm:text-xs text-stone-600 font-medium leading-snug">Safe foster spaces for dogs and cats in recovery.</span>
            </div>
          </div>
        </div>

        {/* WhatsApp Donate CTA Button */}
        <div className="flex flex-col gap-3.5 mt-0.5 items-center">
          <button
            onClick={handleWhatsAppClick}
            className="w-full py-3 bg-[#2D4536] hover:bg-[#1F3325] text-white rounded-2xl flex items-center justify-center gap-2 font-serif text-xs sm:text-sm font-bold transition-all duration-300 shadow-2xs hover:shadow-xs active:scale-[0.98] select-none cursor-pointer tracking-wider"
          >
            <MessageCircle className="w-4 h-4 fill-current text-white" />
            Contact on WhatsApp to Donate
          </button>
        </div>

        {/* Informational note about online payments */}
        <div className="bg-[#EFEBE3] border border-[#EBE3D5] rounded-2xl p-3.5 flex items-start gap-2.5 font-serif">
          <div className="w-7 h-7 rounded-xl bg-[#F5F2EC] border border-[#EBE3D5] flex items-center justify-center shrink-0 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-[#2D4536]" />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-serif font-bold text-[#1C1A17] text-xs sm:text-sm leading-tight">Online Tracking & Payments Coming Soon</span>
            <span className="font-serif text-[11px] sm:text-xs font-medium text-stone-600 leading-relaxed block mt-0.5">
              Secure payment integrations and live donation-to-rescue mapping logs will be added in our next release. For now, WhatsApp allows our volunteers to share direct receipts and updates on cases.
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER CALL TO ACTION */}
      <div className="bg-[#F5F2EC] border border-[#EBE3D5] rounded-2xl sm:rounded-[24px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 select-none">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-[#EFEBE3] border border-[#EBE3D5] flex items-center justify-center shrink-0 shadow-inner">
            <Sprout className="w-4 h-4 text-[#2D4536]" />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-serif font-bold text-[#2D4536] block text-xs sm:text-sm leading-tight">Stronger together. Kinder together.</span>
            <span className="font-serif text-stone-600 text-[11px] sm:text-xs font-medium leading-relaxed">Your actions today create a safer, happier tomorrow for animals.</span>
          </div>
        </div>
        <button
          onClick={handleInviteClick}
          className="w-full sm:w-auto px-4 py-2.5 bg-[#2D4536] hover:bg-[#1F3325] active:scale-95 text-white font-serif text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-white" />
          Invite Neighbors
        </button>
      </div>

    </div>
  );
}
