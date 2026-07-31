'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';
import { ClipboardIcon, ShieldIcon, MapPinIcon } from './icons/PetIcons';

interface EmergencySubmittedProps {
  category: string;
  severity: 'critical' | 'urgent' | 'stable';
  sosReason: string;
  onBack: () => void;
  location: string;
}

export default function EmergencySubmitted({
  category,
  severity,
  sosReason,
  onBack,
  location
}: EmergencySubmittedProps) {
  const [copied, setCopied] = useState(false);
  const { token } = useAuth();
  const [rescuers, setRescuers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const getKeywordMatches = (addr1: string, addr2: string): number => {
    if (!addr1 || !addr2) return 0;
    
    const stopWords = new Set([
      'near', 'opp', 'opposite', 'road', 'street', 'lane', 'flat', 'house', 
      'apartment', 'building', 'floor', 'block', 'sector', 'area', 'beside', 
      'behind', 'at', 'in', 'of', 'and', 'the', 'to', 'for', 'with', 'by'
    ]);

    const cleanWords = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word));
    };

    const words1 = cleanWords(addr1);
    const words2 = new Set(cleanWords(addr2));

    let matchCount = 0;
    for (const word of words1) {
      if (words2.has(word)) {
        matchCount++;
      }
    }
    return matchCount;
  };

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    fetch('http://localhost:5001/api/users/rescuers', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch rescuers');
        return res.json();
      })
      .then(data => {
        if (data.status === 'success' && data.rescuers) {
          // Sort rescuers based on location keyword match
          const sorted = [...data.rescuers].sort((a, b) => {
            const matchA = getKeywordMatches(location, a.address || '');
            const matchB = getKeywordMatches(location, b.address || '');
            return matchB - matchA; // descending order of matches
          });
          setRescuers(sorted);
        }
      })
      .catch(err => console.error('Error fetching rescuers:', err))
      .finally(() => setLoading(false));
  }, [token, location]);

  const totalPages = Math.ceil(rescuers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRescuers = rescuers.slice(startIndex, startIndex + itemsPerPage);

  // Generate a mock cryptographic grid case ID
  const [caseId] = useState(() => 'AUM-' + Math.floor(1000 + Math.random() * 9000));

  const handleShare = () => {
    const mockUrl = `https://aumoha.app/rescue/${caseId}`;
    if (navigator.share) {
      navigator.share({
        title: 'Aumoha Rescue Signal',
        text: `Urgent: Distress category ${category} reported. Responders heading to location coordinates.`,
        url: mockUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(mockUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 items-center select-none relative z-10 py-2">
      
      {/* CSS Confetti keyframes styling injection */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes popConfettiLeft {
          0% {
            transform: translate(0, 0) scale(0) rotate(0deg);
            opacity: 0;
          }
          12% {
            opacity: 1;
          }
          85% {
            opacity: 0.95;
          }
          100% {
            transform: translate(var(--tw-pop-x), var(--tw-pop-y)) scale(1.1) rotate(var(--tw-pop-r));
            opacity: 0;
          }
        }
        @keyframes popConfettiRight {
          0% {
            transform: translate(0, 0) scale(0) rotate(0deg);
            opacity: 0;
          }
          12% {
            opacity: 1;
          }
          85% {
            opacity: 0.95;
          }
          100% {
            transform: translate(var(--tw-pop-x), var(--tw-pop-y)) scale(1.1) rotate(var(--tw-pop-r));
            opacity: 0;
          }
        }
        .animate-confetti-left {
          animation: popConfettiLeft 1.6s cubic-bezier(0.1, 0.85, 0.2, 1) forwards;
        }
        .animate-confetti-right {
          animation: popConfettiRight 1.6s cubic-bezier(0.1, 0.85, 0.2, 1) forwards;
        }
      `}} />

      {/* Confetti Emitters (Aligned vertically with the checkmark, shooting inward from the outer margins of the card) */}
      <div className="absolute top-4 left-[-24px] right-[-24px] md:left-[-32px] md:right-[-32px] h-24 pointer-events-none select-none z-0">
        
        {/* Left Side Cannon Emitter */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4">
          <div className="absolute animate-confetti-left w-2.5 h-3.5 bg-[#D98A53] rounded-tr-md rounded-bl-md" style={{ '--tw-pop-x': '190px', '--tw-pop-y': '-35px', '--tw-pop-r': '120deg', animationDelay: '0s' } as any} />
          <div className="absolute animate-confetti-left w-2 h-2 bg-[#4B6E52] rounded-full" style={{ '--tw-pop-x': '160px', '--tw-pop-y': '-20px', '--tw-pop-r': '-45deg', animationDelay: '0.05s' } as any} />
          <div className="absolute animate-confetti-left w-1.5 h-3 bg-[#A3B899] rounded-tl-md rounded-br-md" style={{ '--tw-pop-x': '210px', '--tw-pop-y': '-10px', '--tw-pop-r': '80deg', animationDelay: '0.1s' } as any} />
          <div className="absolute animate-confetti-left w-3 h-1.5 bg-[#D3A075] rounded-tr-sm rounded-bl-sm" style={{ '--tw-pop-x': '180px', '--tw-pop-y': '20px', '--tw-pop-r': '-60deg', animationDelay: '0.15s' } as any} />
          <div className="absolute animate-confetti-left w-2 h-3.5 bg-[#4B6E52] rounded-tr-lg rounded-bl-lg" style={{ '--tw-pop-x': '230px', '--tw-pop-y': '-30px', '--tw-pop-r': '90deg', animationDelay: '0.08s' } as any} />
          <div className="absolute animate-confetti-left w-2 h-2 bg-[#B89873] rounded-full" style={{ '--tw-pop-x': '200px', '--tw-pop-y': '15px', '--tw-pop-r': '-85deg', animationDelay: '0.12s' } as any} />
          <div className="absolute animate-confetti-left w-2 h-3 bg-[#A3B899] rounded-tr-md rounded-bl-md" style={{ '--tw-pop-x': '170px', '--tw-pop-y': '30px', '--tw-pop-r': '140deg', animationDelay: '0.02s' } as any} />
          <div className="absolute animate-confetti-left w-2 h-2 bg-[#D98A53] rounded-full" style={{ '--tw-pop-x': '220px', '--tw-pop-y': '-15px', '--tw-pop-r': '-110deg', animationDelay: '0.18s' } as any} />
          <div className="absolute animate-confetti-left w-1.5 h-3 bg-[#4B6E52] rounded-tl-md rounded-br-md" style={{ '--tw-pop-x': '240px', '--tw-pop-y': '-5px', '--tw-pop-r': '170deg', animationDelay: '0.06s' } as any} />
          <div className="absolute animate-confetti-left w-3 h-2 bg-[#A3B899] rounded-tr-sm rounded-bl-sm" style={{ '--tw-pop-x': '195px', '--tw-pop-y': '10px', '--tw-pop-r': '-135deg', animationDelay: '0.22s' } as any} />
          <div className="absolute animate-confetti-left w-2 h-3 bg-[#D98A53] rounded-tr-md rounded-bl-md" style={{ '--tw-pop-x': '205px', '--tw-pop-y': '-25px', '--tw-pop-r': '100deg', animationDelay: '0.14s' } as any} />
          <div className="absolute animate-confetti-left w-2 h-2 bg-[#4B6E52] rounded-full" style={{ '--tw-pop-x': '185px', '--tw-pop-y': '25px', '--tw-pop-r': '-50deg', animationDelay: '0.2s' } as any} />
        </div>

        {/* Right Side Cannon Emitter */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4">
          <div className="absolute animate-confetti-right w-2.5 h-3.5 bg-[#D98A53] rounded-tr-md rounded-bl-md" style={{ '--tw-pop-x': '-190px', '--tw-pop-y': '-35px', '--tw-pop-r': '-120deg', animationDelay: '0s' } as any} />
          <div className="absolute animate-confetti-right w-2 h-2 bg-[#4B6E52] rounded-full" style={{ '--tw-pop-x': '-160px', '--tw-pop-y': '-20px', '--tw-pop-r': '45deg', animationDelay: '0.05s' } as any} />
          <div className="absolute animate-confetti-right w-1.5 h-3 bg-[#A3B899] rounded-tl-md rounded-br-md" style={{ '--tw-pop-x': '-210px', '--tw-pop-y': '-10px', '--tw-pop-r': '-80deg', animationDelay: '0.1s' } as any} />
          <div className="absolute animate-confetti-right w-3 h-1.5 bg-[#D3A075] rounded-tr-sm rounded-bl-sm" style={{ '--tw-pop-x': '-180px', '--tw-pop-y': '20px', '--tw-pop-r': '60deg', animationDelay: '0.15s' } as any} />
          <div className="absolute animate-confetti-right w-2 h-3.5 bg-[#4B6E52] rounded-tr-lg rounded-bl-lg" style={{ '--tw-pop-x': '-230px', '--tw-pop-y': '-30px', '--tw-pop-r': '-90deg', animationDelay: '0.08s' } as any} />
          <div className="absolute animate-confetti-right w-2 h-2 bg-[#B89873] rounded-full" style={{ '--tw-pop-x': '-200px', '--tw-pop-y': '15px', '--tw-pop-r': '85deg', animationDelay: '0.12s' } as any} />
          <div className="absolute animate-confetti-right w-2 h-3 bg-[#A3B899] rounded-tr-md rounded-bl-md" style={{ '--tw-pop-x': '-170px', '--tw-pop-y': '30px', '--tw-pop-r': '-140deg', animationDelay: '0.02s' } as any} />
          <div className="absolute animate-confetti-right w-2 h-2 bg-[#D98A53] rounded-full" style={{ '--tw-pop-x': '-220px', '--tw-pop-y': '-15px', '--tw-pop-r': '110deg', animationDelay: '0.18s' } as any} />
          <div className="absolute animate-confetti-right w-1.5 h-3 bg-[#4B6E52] rounded-tl-md rounded-br-md" style={{ '--tw-pop-x': '-240px', '--tw-pop-y': '-5px', '--tw-pop-r': '-170deg', animationDelay: '0.06s' } as any} />
          <div className="absolute animate-confetti-right w-3 h-2 bg-[#A3B899] rounded-tr-sm rounded-bl-sm" style={{ '--tw-pop-x': '-195px', '--tw-pop-y': '10px', '--tw-pop-r': '135deg', animationDelay: '0.22s' } as any} />
          <div className="absolute animate-confetti-right w-2 h-3 bg-[#D98A53] rounded-tr-md rounded-bl-md" style={{ '--tw-pop-x': '-205px', '--tw-pop-y': '-25px', '--tw-pop-r': '-100deg', animationDelay: '0.14s' } as any} />
          <div className="absolute animate-confetti-right w-2 h-2 bg-[#4B6E52] rounded-full" style={{ '--tw-pop-x': '-185px', '--tw-pop-y': '25px', '--tw-pop-r': '50deg', animationDelay: '0.2s' } as any} />
        </div>

      </div>

      {/* Checkmark circle container */}
      <div className="relative flex items-center justify-center w-24 h-24 mt-4 select-none">
        
        {/* Soft pastel green circle checkmark container */}
        <div className="w-20 h-20 rounded-full bg-[#E2EFE5] border border-[#A9CBB3] flex items-center justify-center shrink-0 z-10 shadow-sm">
          <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#235830" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-[#235830]">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>

      {/* 2. Headline and Subtext */}
      <div className="text-center flex flex-col gap-1 px-2 select-none">
        <h1 className="font-serif text-2xl md:text-3xl text-[#1C1A17] font-semibold">Emergency Reported!</h1>
        <p className="text-xs text-stone-500 font-medium leading-relaxed mt-1 px-4">
          Thank you! Your report has been shared.
        </p>
      </div>

      {/* 3. Safety Guidelines (While Waiting) */}
      <div className="w-full bg-[#FCFAF7] border border-warmBeige rounded-2xl p-4.5 flex flex-col gap-3 select-none mt-2">
        <span className="text-[10px] uppercase tracking-widest text-[#B68A35] font-extrabold border-b border-warmBeige/40 pb-2 flex items-center gap-1.5">
          <ClipboardIcon className="w-3.5 h-3.5 text-[#B68A35]" /> Safety Guidelines (While Waiting)
        </span>
        
        <ul className="flex flex-col gap-2.5 text-stone-600 text-[11px] leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-[#B68A35] font-bold text-xs mt-0.5">•</span>
            <span><strong>Stay Nearby:</strong> Keep a safe distance but remain near the animal so responders can spot you easily.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#B68A35] font-bold text-xs mt-0.5">•</span>
            <span><strong>Minimize Movement:</strong> Avoid moving an injured animal to prevent worsening pain or bone fractures.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#B68A35] font-bold text-xs mt-0.5">•</span>
            <span><strong>Offer Solitude:</strong> Keep traffic, other street animals, and onlookers away to reduce stress on the patient.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#B68A35] font-bold text-xs mt-0.5">•</span>
            <span><strong>Fresh Water:</strong> You may offer a clean bowl of water if the animal is fully conscious and willing.</span>
          </li>
        </ul>
      </div>

      {/* 4. Case Summary Details */}
      <div className="w-full flex justify-between bg-stone-50 border border-stone-200/50 rounded-xl p-3 text-xs text-stone-500 select-none">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] uppercase font-bold text-stone-400">Distress Category</span>
          <span className="font-bold text-charcoal">{category}</span>
        </div>
        <div className="w-[1px] bg-stone-200" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] uppercase font-bold text-stone-400">Triage Severity</span>
          <span className={`font-bold uppercase ${
            severity === 'critical' ? 'text-red-600' : severity === 'urgent' ? 'text-amber-600' : 'text-emerald-600'
          }`}>{severity}</span>
        </div>
        <div className="w-[1px] bg-stone-200" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] uppercase font-bold text-stone-400">Case ID</span>
          <span className="font-mono font-bold text-charcoal">{caseId}</span>
        </div>
      </div>

      {/* 5. Actions: Share Button & Back to Dashboard */}
      <div className="w-full flex gap-3 mt-2">
        {/* Share Button */}
        <button 
          onClick={handleShare}
          className="flex-1 py-2.5 border border-stone-200 hover:border-charcoal font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-white text-charcoal active:scale-95 shadow-sm"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-[-2px]">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
          </svg>
          {copied ? "Link Copied!" : "Share Alert"}
        </button>

        {/* Back to Dashboard Button */}
        <button 
          onClick={onBack}
          className="flex-grow py-2.5 bg-[#2A3E31] hover:bg-[#1E2E24] active:scale-95 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-[#2A3E31]/10"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Cancel Request Link */}
      <span 
        onClick={onBack}
        className="text-[10px] text-stone-400 hover:text-red-600 transition-colors cursor-pointer select-none underline text-center mt-1"
      >
        Cancel Rescue Request
      </span>

      {/* 4.5. Rescuers Contact Directory */}
      <div className="w-full bg-[#FCFAF7] border border-[#F0EBE1] rounded-2xl p-4.5 flex flex-col gap-3 select-none">
        <span className="text-[10px] uppercase tracking-widest text-[#4A5D4E] font-extrabold border-b border-[#F0EBE1] pb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldIcon className="w-3.5 h-3.5 text-[#4A5D4E]" /> Contact Rescuers
          </span>
          {loading && <span className="text-[9px] text-[#4A5D4E] lowercase animate-pulse font-normal">Loading rescuers...</span>}
        </span>

        {rescuers.length === 0 ? (
          <p className="text-[11px] text-stone-400 font-medium py-2 text-center">
            {loading ? 'Searching for active rescuers...' : 'No active rescuers found.'}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              {paginatedRescuers.map((rescuer, idx) => {
                const isNearby = getKeywordMatches(location, rescuer.address || '') > 0;
                return (
                  <div key={idx} className="bg-white border border-[#F0EBE1] rounded-xl p-3 flex items-center justify-between gap-3 shadow-sm hover:border-stone-300 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-terracotta to-clay flex items-center justify-center text-[#FDFBF7] text-xs font-serif shadow-sm shrink-0">
                        {rescuer.profilePic ? (
                          <img src={rescuer.profilePic} alt={rescuer.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{rescuer.fullName.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <span className="text-xs font-bold text-charcoal flex items-center gap-1.5 truncate">
                          {rescuer.fullName}
                          {isNearby && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase select-none shrink-0 bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]">
                              Nearby
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-stone-500 truncate mt-0.5 flex items-center gap-1" title={rescuer.address}>
                          <MapPinIcon className="w-3 h-3 text-stone-400 shrink-0" /> {rescuer.address}
                        </span>
                      </div>
                    </div>
                    {/* Call Button */}
                    <a
                      href={`tel:${rescuer.phone}`}
                      className="px-3 py-1.5 bg-[#4A5D4E] hover:bg-[#3A4D3E] active:scale-95 text-[#FDFBF7] text-[10.5px] font-extrabold rounded-xl flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                    >
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-[-1px]">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      Call
                    </a>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#F0EBE1] pt-2.5 mt-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 text-[10px] font-extrabold text-[#4A5D4E] bg-white border border-[#EBE3D5] hover:bg-stone-50 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-all cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-[10px] text-stone-500 font-semibold">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 text-[10px] font-extrabold text-[#4A5D4E] bg-white border border-[#EBE3D5] hover:bg-stone-50 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-all cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
