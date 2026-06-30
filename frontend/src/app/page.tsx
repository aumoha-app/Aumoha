'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import NavigationGrid from '../components/NavigationGrid';
import NeighborhoodRadar from '../components/NeighborhoodRadar';
import Marketplace from '../components/Marketplace';
import EmergencyDispatch from '../components/EmergencyDispatch';
import CommunityBoard from '../components/CommunityBoard';
import Profile from '../components/Profile';
import BottomNav from '../components/BottomNav';
import { BackendInfo, CommunityPost } from '../types';

export default function Home() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'home' | 'marketplace' | 'report' | 'community' | 'profile'>('home');

  // General App / Connection States
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [backendStatus, setBackendStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');
  const [backendInfo, setBackendInfo] = useState<BackendInfo | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  // SOS specific state
  const [sosReason, setSosReason] = useState<string>('');
  const [sosSent, setSosSent] = useState<boolean>(false);
  const [emergencyType, setEmergencyType] = useState<string>('General');

  // Community dynamic posts state
  const [newPostText, setNewPostText] = useState<string>('');
  const [posts, setPosts] = useState<CommunityPost[]>([
    {
      id: 1,
      author: "Aria Carter",
      avatar: "AC",
      time: "2 hours ago",
      content: "Just configured the PWA caching schema. The offline loads are blazing fast now! 🚀",
      likes: 12
    },
    {
      id: 2,
      author: "Marcus Vance",
      avatar: "MV",
      time: "5 hours ago",
      content: "Is anyone else experiencing CORS response lags on localhost:5001? Or is it just my local configurations?",
      likes: 4
    }
  ]);

  useEffect(() => {
    // 1. Sync online status
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Check if PWA is already installed
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }

      // 2. Handle PWA installation prompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };
      
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // 3. Monitor PWA installation success
      const handleAppInstalled = () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
        console.log('🎉 PWA successfully installed!');
      };
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  // 4. Fetch backend API connection details
  useEffect(() => {
    const checkBackend = async () => {
      try {
        setBackendStatus('connecting');
        const res = await fetch('http://localhost:5001/api/info', { mode: 'cors' });
        if (res.ok) {
          const data = await res.json();
          setBackendInfo(data);
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } catch (err) {
        setBackendStatus('offline');
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install: ${outcome}`);
    setDeferredPrompt(null);
  };

  // SOS submission handler
  const triggerSOS = (e: React.FormEvent) => {
    e.preventDefault();
    setSosSent(true);
    setTimeout(() => {
      setSosSent(false);
      setSosReason('');
      alert("🚨 Simulated SOS Transmission Success: Local emergency dispatch notified with location telemetry!");
    }, 3000);
  };

  // Community post submit
  const submitPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;
    
    const newPost: CommunityPost = {
      id: posts.length + 1,
      author: "Developer (You)",
      avatar: "DY",
      time: "Just now",
      content: newPostText,
      likes: 0
    };
    
    setPosts([newPost, ...posts]);
    setNewPostText('');
  };

  const handleLike = (id: number) => {
    setPosts(posts.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
  };

  return (
    <div className="flex flex-col min-h-screen bg-cream text-charcoal">
      
      {/* GLOBAL TOP BRAND HEADER */}
      <Header deferredPrompt={deferredPrompt} onInstallClick={handleInstallClick} />

      {/* MAIN CONTENT AREA */}
      <div className="flex-grow w-full max-w-2xl mx-auto px-4 py-4 pb-28">
        
        {/* HOME TAB SCREEN */}
        {activeTab === 'home' && (
          <div className="flex flex-col gap-6">
            <HeroSection />
            <NavigationGrid />
            <NeighborhoodRadar />
          </div>
        )}

        {/* MARKETPLACE TAB SCREEN */}
        {activeTab === 'marketplace' && <Marketplace />}

        {/* REPORT / SOS TAB SCREEN */}
        {activeTab === 'report' && (
          <EmergencyDispatch 
            sosReason={sosReason}
            setSosReason={setSosReason}
            emergencyType={emergencyType}
            setEmergencyType={setEmergencyType}
            sosSent={sosSent}
            onSubmitSos={triggerSOS}
          />
        )}

        {/* COMMUNITY TAB SCREEN */}
        {activeTab === 'community' && (
          <CommunityBoard 
            posts={posts}
            newPostText={newPostText}
            setNewPostText={setNewPostText}
            onSubmitPost={submitPost}
            onLikePost={handleLike}
          />
        )}

        {/* PROFILE TAB SCREEN */}
        {activeTab === 'profile' && <Profile />}
        
      </div>

      {/* BOTTOM TAB NAVIGATION BAR */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
    </div>
  );
}
