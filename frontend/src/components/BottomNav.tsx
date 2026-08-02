'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type TabType = 'home' | 'marketplace' | 'report' | 'circle' | 'profile' | 'petcare' | 'admin' | 'vetconsult' | 'expertsupport';

interface BottomNavProps {
  activeTab?: TabType;
  setActiveTab?: (tab: TabType) => void;
}

export default function BottomNav({ activeTab: propActiveTab, setActiveTab }: BottomNavProps) {
  const pathname = usePathname();

  // Determine active tab from current URL pathname or fallback prop
  let currentTab: TabType = 'home';
  if (pathname === '/marketplace') currentTab = 'marketplace';
  else if (pathname === '/sos' || pathname === '/report') currentTab = 'report';
  else if (pathname === '/circle') currentTab = 'circle';
  else if (pathname === '/profile') currentTab = 'profile';
  else if (pathname === '/pet-care') currentTab = 'petcare';
  else if (pathname === '/admin') currentTab = 'admin';
  else if (pathname === '/vet-consult') currentTab = 'vetconsult';
  else if (pathname === '/expert-support') currentTab = 'expertsupport';
  else if (propActiveTab) currentTab = propActiveTab;

  return (
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[500px] h-[72px] bg-warmCard/90 backdrop-blur-md border border-warmBeige rounded-2xl shadow-lg shadow-stone-200/50 grid grid-cols-5 items-center px-2 z-[1000] select-none">
      
      {/* Tab 1: Home */}
      <Link 
        href="/" 
        onClick={() => setActiveTab?.('home')}
        className={`flex flex-col items-center justify-center gap-1 w-full h-full text-stone-400 hover:text-clay transition-all cursor-pointer ${
          currentTab === 'home' ? 'text-terracotta hover:text-terracotta' : ''
        }`}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={currentTab === 'home' ? 'scale-110 drop-shadow-sm' : 'transition-transform'}>
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span className="text-[10px] font-bold">Home</span>
      </Link>

      {/* Tab 2: Marketplace */}
      <Link 
        href="/marketplace" 
        onClick={() => setActiveTab?.('marketplace')}
        className={`flex flex-col items-center justify-center gap-1 w-full h-full text-stone-400 hover:text-clay transition-all cursor-pointer ${
          currentTab === 'marketplace' ? 'text-terracotta hover:text-terracotta' : ''
        }`}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={currentTab === 'marketplace' ? 'scale-110 drop-shadow-sm' : 'transition-transform'}>
          <path d="M3 9h18M3 9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2M3 9v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9M9 22V12h6v10"/>
        </svg>
        <span className="text-[10px] font-bold">Marketplace</span>
      </Link>

      {/* Tab 3: SOS Center (FAB) */}
      <div className="h-full flex flex-col items-center justify-center -mt-6">
        <Link 
          href="/sos" 
          onClick={() => setActiveTab?.('report')}
          className={`w-[54px] h-[54px] rounded-full bg-[#C85341] text-white flex items-center justify-center font-extrabold text-sm tracking-wide shadow-md shadow-rose-200 border-4 border-[#FDFBF7] hover:scale-105 active:scale-95 transition-all cursor-pointer ${
            currentTab === 'report' ? 'bg-[#B04535] ring-2 ring-[#C85341]' : ''
          }`}
        >
          SOS
        </Link>
        <span className="text-[10px] font-bold text-emergency mt-1">Report</span>
      </div>

      {/* Tab 4: Circle */}
      <Link 
        href="/circle" 
        onClick={() => setActiveTab?.('circle')}
        className={`flex flex-col items-center justify-center gap-1 w-full h-full text-stone-400 hover:text-clay transition-all cursor-pointer ${
          currentTab === 'circle' ? 'text-terracotta hover:text-terracotta' : ''
        }`}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={currentTab === 'circle' ? 'scale-110 drop-shadow-sm' : 'transition-transform'}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <span className="text-[10px] font-bold">Circle</span>
      </Link>

      {/* Tab 5: Profile */}
      <Link 
        href="/profile" 
        onClick={() => setActiveTab?.('profile')}
        className={`flex flex-col items-center justify-center gap-1 w-full h-full text-stone-400 hover:text-clay transition-all cursor-pointer ${
          currentTab === 'profile' ? 'text-terracotta hover:text-terracotta' : ''
        }`}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={currentTab === 'profile' ? 'scale-110 drop-shadow-sm' : 'transition-transform'}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span className="text-[10px] font-bold">Profile</span>
      </Link>
    </nav>
  );
}
