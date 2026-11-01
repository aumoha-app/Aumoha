'use client';

import { useState, useEffect, ReactNode } from 'react';
import Header from './Header';
import { usePathname } from 'next/navigation';
import { EVENT_MODE } from '../lib/eventMode';
import { EventFeaturePreview, eventPreviewPaths } from './EventFeaturePreview';
import BottomNav from './BottomNav';
import { useAuth } from '../context/AuthContext';
import AuthScreen from './AuthScreen';
import OnboardingScreen from './OnboardingScreen';
import PopupModal, { PopupConfig } from './PopupModal';

interface AppShellProps {
  children: ReactNode;
  backdropImage?: string;
  bgColor?: string;
}

export default function AppShell({ children, backdropImage, bgColor = '#F5F2EC' }: AppShellProps) {
  const { firebaseUser, loading, isNewUser } = useAuth();
  const pathname = usePathname();
  const publicEventPage = EVENT_MODE && (pathname === '/' || eventPreviewPaths.has(pathname));
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [popupConfig, setPopupConfig] = useState<PopupConfig | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install: ${outcome}`);
      setDeferredPrompt(null);
    } else {
      setPopupConfig({
        title: 'Install Aumoha App',
        message: 'To install Aumoha on your device:\n\n1. Open browser menu (⋮ or Share ⎋)\n2. Tap "Add to Home Screen" or "Install App"',
        type: 'info',
        confirmText: 'Got It'
      });
    }
  };

  if (!mounted || (loading && !publicEventPage)) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center font-sans select-none">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <img
            src="/running_sketch_dog.png"
            alt="Loading..."
            className="w-20 h-20 object-contain animate-small-hop"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-charcoal relative overflow-hidden" style={{ backgroundColor: bgColor }}>
      {popupConfig && <PopupModal config={popupConfig} onClose={() => setPopupConfig(null)} />}

      {/* Full-Screen Backdrop Layer - Extended height so it covers full hero section */}
      {backdropImage && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="relative w-full h-[720px] sm:h-[840px] md:h-[950px] overflow-hidden">
            <img
              src={backdropImage}
              alt="Soft sunlight backdrop"
              className="w-full h-full object-cover object-[75%_top] sm:object-top opacity-90 mix-blend-multiply"
            />
            {/* Soft Dissolve Gradient Overlay from below */}
            <div className="absolute inset-x-0 bottom-0 h-36 sm:h-52" style={{ background: `linear-gradient(to top, ${bgColor} 0%, ${bgColor}e6 40%, ${bgColor}80 75%, transparent 100%)` }} />
          </div>
        </div>
      )}

      {publicEventPage && <div className="relative z-20 border-b border-[#E8E2D8] bg-[#FFF8EF] px-4 py-3 text-center text-xs text-stone-700">Aumoha event preview · Consultations, orders and payments open later.</div>}
      {/* GLOBAL TOP BRAND HEADER */}
      <Header onInstallClick={handleInstallClick} />

      {/* MAIN CONTENT AREA */}
      <div className="flex-grow w-full max-w-3xl md:max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 pt-1 sm:pt-2 pb-24 sm:pb-32 relative z-10">
        {publicEventPage ? (pathname === '/' ? children : <EventFeaturePreview path={pathname} />) : !firebaseUser ? (
          <AuthScreen />
        ) : isNewUser ? (
          <OnboardingScreen />
        ) : (
          children
        )}
      </div>

      {/* BOTTOM TAB NAVIGATION BAR */}
      {(publicEventPage || (firebaseUser && !isNewUser)) && (
        <BottomNav />
      )}
    </div>
  );
}

