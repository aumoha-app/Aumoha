'use client';

import { useState, useEffect, ReactNode } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import { useAuth } from '../context/AuthContext';
import AuthScreen from './AuthScreen';
import OnboardingScreen from './OnboardingScreen';

interface AppShellProps {
  children: ReactNode;
  backdropImage?: string;
  bgColor?: string;
}

export default function AppShell({ children, backdropImage, bgColor = '#F5F2EC' }: AppShellProps) {
  const { firebaseUser, loading, isNewUser } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

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
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install: ${outcome}`);
    setDeferredPrompt(null);
  };

  if (!mounted || loading) {
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
      {/* Full-Screen Backdrop Layer - ONLY rendered on homepage or when explicitly provided */}
      {backdropImage && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="relative w-full h-[460px] sm:h-[540px] overflow-hidden">
            <img
              src={backdropImage}
              alt="Soft sunlight backdrop"
              className="w-full h-full object-cover object-[75%_top] sm:object-top opacity-90 mix-blend-multiply"
            />
            {/* Soft Smudge Dissolve Gradient Overlay from below */}
            <div className="absolute inset-x-0 bottom-0 h-24 sm:h-36" style={{ background: `linear-gradient(to top, ${bgColor} 0%, ${bgColor}f0 35%, ${bgColor}99 70%, transparent 100%)` }} />
          </div>
        </div>
      )}

      {/* GLOBAL TOP BRAND HEADER */}
      <Header deferredPrompt={deferredPrompt} onInstallClick={handleInstallClick} />

      {/* MAIN CONTENT AREA */}
      <div className="flex-grow w-full max-w-3xl md:max-w-5xl lg:max-w-6xl mx-auto px-3 sm:px-6 pt-1 sm:pt-2 pb-24 sm:pb-32 relative z-10">
        {!firebaseUser ? (
          <AuthScreen />
        ) : isNewUser ? (
          <OnboardingScreen />
        ) : (
          children
        )}
      </div>

      {/* BOTTOM TAB NAVIGATION BAR */}
      {firebaseUser && !isNewUser && (
        <BottomNav />
      )}
    </div>
  );
}
