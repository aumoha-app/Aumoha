'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import NeighborhoodRadar from '../components/NeighborhoodRadar';
import Marketplace from '../components/Marketplace';
import PetCareFeature from '../components/PetCareFeature';
import EmergencyDispatch from '../components/EmergencyDispatch';
import MohallaCircle from '../components/MohallaCircle';
import Profile from '../components/Profile';
import BottomNav from '../components/BottomNav';
import VetConsultation from '../components/VetConsultation';
import ExpertSupport from '../components/ExpertSupport';
import { BackendInfo, CommunityPost } from '../types';
import { useAuth } from '../context/AuthContext';
import AuthScreen from '../components/AuthScreen';
import OnboardingScreen from '../components/OnboardingScreen';
import MinimalHome from '../components/MinimalHome';
import AdminDashboard from '../components/AdminDashboard';
import { API_BASE } from '../lib/api';



export default function Home() {
  const { firebaseUser, user, loading, isNewUser, token } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'home' | 'marketplace' | 'report' | 'circle' | 'profile' | 'petcare' | 'admin' | 'vetconsult' | 'expertsupport'>('home');


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
        const res = await fetch(`${API_BASE}/info`, { mode: 'cors' });
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
  const triggerSOS = async (
    category: string,
    severity: 'critical' | 'urgent' | 'stable',
    reason: string,
    location: string,
    photo?: string,
    audio?: string
  ) => {
    try {
      const response = await fetch(`${API_BASE}/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category,
          severity,
          reason,
          location: location || 'Santi Nagar, Rourkela',
          photo,
          audio
        })
      });

      if (response.ok) {
        setSosSent(true);
      } else {
        const err = await response.json();
        alert(err.message || 'Failed to submit SOS alert.');
      }
    } catch (err) {
      console.error('Error submitting SOS:', err);
      alert('Network error submitting SOS report.');
    }
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

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center font-sans select-none">
        {/* Sketch Dog Small Hops Loader without text */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <img
            src="/running_sketch_dog.png"
            alt="Loading..."
            className="w-24 h-24 object-contain animate-small-hop"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#CEC7BE] flex flex-col font-sans text-charcoal relative overflow-hidden">
      {/* Full-Screen Backdrop Layer for Home Screen */}
      {activeTab === 'home' && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="relative w-full h-[48%] overflow-hidden">
            <img
              src="/backdrop-sunlight.png"
              alt="Full screen warm sunlight backdrop"
              className="w-full h-full object-cover object-top opacity-50 mix-blend-multiply"
            />
            {/* Top White Transparent Gradient Overlay (fading down from white to opacity 0) */}
            <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-white/85 via-white/35 to-transparent pointer-events-none" />
            {/* Soft Smudge Gradient Overlay to dissolve sharp horizontal divider */}
            <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#CEC7BE] via-[#CEC7BE]/70 to-transparent" />
          </div>
        </div>
      )}
      
      {/* GLOBAL TOP BRAND HEADER */}
      <Header deferredPrompt={deferredPrompt} onInstallClick={handleInstallClick} />

      {/* MAIN CONTENT AREA */}
      <div className="flex-grow w-full max-w-2xl mx-auto px-4 py-4 pb-28 relative z-10">
        
        {!firebaseUser ? (
          <AuthScreen />
        ) : isNewUser ? (
          <OnboardingScreen />
        ) : (
          <>
            {/* HOME TAB SCREEN */}
            {activeTab === 'home' && (
              <main className="w-full max-w-2xl mx-auto flex flex-col gap-6 transition-all duration-300">
                <MinimalHome
                  userName={user?.fullName || 'Ananya'}
                  onSosClick={() => setActiveTab('report')}
                  onVetCareClick={() => setActiveTab('vetconsult')}
                  onExpertSupportClick={() => setActiveTab('expertsupport')}
                  onPetServicesClick={() => setActiveTab('petcare')}
                  onCommunityClick={() => setActiveTab('circle')}
                />
              </main>
            )}

            {/* CIRCLE TAB SCREEN */}
            {activeTab === 'circle' && (
              <MohallaCircle setActiveTab={setActiveTab} userAddress={user?.address} />
            )}

            {/* PET CARE FEATURE SCREEN */}
            {activeTab === 'petcare' && <PetCareFeature setActiveTab={setActiveTab} />}

            {/* VET CONSULTATION TABS */}
            {activeTab === 'vetconsult' && (
              <VetConsultation setActiveTab={setActiveTab} />
            )}

            {/* EXPERT SUPPORT FEATURE SCREEN */}
            {activeTab === 'expertsupport' && (
              <ExpertSupport setActiveTab={setActiveTab} />
            )}

            {/* MARKETPLACE TAB SCREEN */}
            {activeTab === 'marketplace' && <Marketplace onOpenAdmin={() => setActiveTab('admin')} />}

            {/* REPORT / SOS TAB SCREEN */}
            {activeTab === 'report' && (
              <EmergencyDispatch 
                sosReason={sosReason}
                setSosReason={setSosReason}
                emergencyType={emergencyType}
                setEmergencyType={setEmergencyType}
                sosSent={sosSent}
                onSubmitSos={triggerSOS}
                onResetSos={() => {
                  setSosSent(false);
                  setSosReason('');
                  setActiveTab('home');
                }}
              />
            )}

            {/* PROFILE TAB SCREEN */}
            {activeTab === 'profile' && (
              <Profile onOpenAdmin={() => setActiveTab('admin')} />
            )}

            {/* ADMIN DASHBOARD SCREEN */}
            {activeTab === 'admin' && (
              <AdminDashboard onClose={() => setActiveTab('profile')} />
            )}

          </>
        )}
        
      </div>

      {/* BOTTOM TAB NAVIGATION BAR */}
      {firebaseUser && !isNewUser && (
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
      
    </div>
  );
}
