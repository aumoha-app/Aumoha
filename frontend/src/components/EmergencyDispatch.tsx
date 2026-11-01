'use client';

import { useState, useRef, useEffect } from 'react';
import EmergencySubmitted from './EmergencySubmitted';
import { useAuth } from '../context/AuthContext';
import { loadLeaflet } from '../lib/leafletLoader';
import { API_BASE } from '../lib/api';

interface EmergencyDispatchProps {
  sosReason: string;
  setSosReason: (val: string) => void;
  emergencyType: string;
  setEmergencyType: (val: string) => void;
  sosSent: boolean;
  reportId?: string;
  onSubmitSos: (
    category: string,
    severity: 'critical' | 'urgent' | 'stable',
    reason: string,
    location: string,
    photo?: string,
    audio?: string
  ) => void;
  onResetSos: () => void;
}

export default function EmergencyDispatch({
  sosReason,
  setSosReason,
  emergencyType,
  setEmergencyType,
  sosSent,
  reportId,
  onSubmitSos,
  onResetSos
}: EmergencyDispatchProps) {
  const { user, token } = useAuth();

  // Stateful form components
  const [subTab, setSubTab] = useState<'report' | 'my-reports'>('report');
  const [myReports, setMyReports] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const [activeCategory, setActiveCategory] = useState<string>('Accident');
  const [locationMode, setLocationMode] = useState<'current' | 'manual'>('current');
  const [locationText, setLocationText] = useState<string>(user?.address || 'Saheed Nagar, Sector 45');
  const [currentAddress, setCurrentAddress] = useState<string>(user?.address || 'Saheed Nagar, Sector 45');
  const [severity, setSeverity] = useState<'critical' | 'urgent' | 'stable'>('critical');
  const [photoSelected, setPhotoSelected] = useState<boolean>(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>('');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPlayUrl, setAudioPlayUrl] = useState<string>('');
  const [micError, setMicError] = useState<string | null>(null);

  // Custom Confirmation Dialog States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
  } | null>(null);

  const openConfirmation = (config: any) => {
    setConfirmConfig(config);
    setIsConfirmOpen(true);
  };

  const closeConfirmation = () => {
    setIsConfirmOpen(false);
    setConfirmConfig(null);
  };

  // Hook to fetch initial browser geolocation and reverse-geocode it on component mount
  useEffect(() => {
    const fallbackAddr = user?.address || 'Saheed Nagar, Sector 45';
    if (user?.address) {
      setLocationText(user.address);
      setCurrentAddress(user.address);
    }
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
            headers: {
              'Accept-Language': 'en'
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.display_name) {
              const formattedLoc = `${data.display_name} [${lat.toFixed(6)}, ${lng.toFixed(6)}]`;
              setLocationText(formattedLoc);
              setCurrentAddress(formattedLoc);
            }
          }
        } catch (err) {
          console.warn('Reverse geocode failed:', err);
        }
      },
      (error) => {
        console.warn('Geolocation access failed or denied:', error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
    );
  }, [user?.address]);

  const reverseGeocode = async (lat: number, lng: number) => {
    setLocationText(`Fetching pinned address...`);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
        headers: {
          'Accept-Language': 'en'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) {
          setLocationText(`${data.display_name} [${lat.toFixed(6)}, ${lng.toFixed(6)}]`);
        } else {
          setLocationText(`Pinned Location: [${lat.toFixed(6)}, ${lng.toFixed(6)}]`);
        }
      } else {
        setLocationText(`Pinned Location: [${lat.toFixed(6)}, ${lng.toFixed(6)}]`);
      }
    } catch (err) {
      setLocationText(`Pinned Location: [${lat.toFixed(6)}, ${lng.toFixed(6)}]`);
    }
  };

  // Dynamic Leaflet Map loader & initialization
  useEffect(() => {
    if (locationMode !== 'manual') {
      if (locationMode === 'current') {
        setLocationText(currentAddress);
      }
      return;
    }

    let isMounted = true;
    let mapInstance: any = null;
    let markerInstance: any = null;

    const initMap = async () => {
      try {
        const L = await loadLeaflet();
        if (!isMounted) return;

        const defaultLat = 22.2587;
        const defaultLng = 84.8510; // Rourkela center

        const mapDiv = document.getElementById('leaflet-map');
        if (!mapDiv) return;

        if ((mapDiv as any)._leaflet_id) {
          delete (mapDiv as any)._leaflet_id;
        }

        mapInstance = L.map('leaflet-map').setView([defaultLat, defaultLng], 14);

        L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 20,
          attribution: '&copy; Google Maps'
        }).addTo(mapInstance);

        // Fix default marker icons loaded from CDN
        const DefaultIcon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41]
        });
        L.Marker.prototype.options.icon = DefaultIcon;

        // Create draggable marker
        markerInstance = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(mapInstance);

        setLocationText(`Pinned Location: [${defaultLat.toFixed(6)}, ${defaultLng.toFixed(6)}]`);
        reverseGeocode(defaultLat, defaultLng);

        // Drag event
        markerInstance.on('dragend', () => {
          const position = markerInstance.getLatLng();
          reverseGeocode(position.lat, position.lng);
        });

        // Click map event
        mapInstance.on('click', (e: any) => {
          const coords = e.latlng;
          markerInstance.setLatLng(coords);
          reverseGeocode(coords.lat, coords.lng);
        });
      } catch (err) {
        console.error('Failed to initialize dispatch Leaflet map:', err);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstance) {
        try {
          mapInstance.remove();
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, [locationMode, currentAddress]);

  const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Intercept and pass local states to the page submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!photoSelected || !photoFile) {
      setPhotoError('Emergency photo is required to submit a distress alert.');
      return;
    }

    setPhotoError(null);

    let photoBase64 = '';
    let audioBase64 = '';

    if (photoFile) {
      try {
        photoBase64 = await fileToBase64(photoFile);
      } catch (err) {
        console.error('Error converting photo to base64:', err);
      }
    }

    if (audioBlob) {
      try {
        audioBase64 = await fileToBase64(audioBlob);
      } catch (err) {
        console.error('Error converting audio to base64:', err);
      }
    }

    const finalReason = (sosReason && sosReason.trim()) ? sosReason : `${activeCategory} emergency reported`;
    onSubmitSos(activeCategory, severity, finalReason, locationText, photoBase64, audioBase64);
  };

  const fetchMyReports = async () => {
    if (!token) return;
    setIsHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sos/my`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMyReports(data.reports || []);
      }
    } catch (err) {
      console.error('Error fetching my reports:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleUpdateMyReportStatus = async (reportId: string, newStatus: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/sos/my/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchMyReports();
      } else {
        const errData = await response.json();
        openConfirmation({
          title: 'Action Failed',
          message: errData.message || 'Failed to update status.',
          confirmText: 'OK',
          onConfirm: () => {}
        });
      }
    } catch (err) {
      console.error('Error updating report status:', err);
      openConfirmation({
        title: 'Network Error',
        message: 'Network error. Unable to update status.',
        confirmText: 'OK',
        onConfirm: () => {}
      });
    }
  };

  const handleDeleteReport = (reportId: string) => {
    openConfirmation({
      title: 'Cancel Rescue Alert?',
      message: 'Are you sure you want to cancel and delete this emergency report? This action cannot be undone.',
      confirmText: 'Cancel Alert',
      cancelText: 'Keep Alert',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_BASE}/sos/my/${reportId}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (response.ok) {
            fetchMyReports();
          } else {
            const errData = await response.json();
            openConfirmation({
              title: 'Error',
              message: errData.message || 'Failed to delete emergency report.',
              confirmText: 'OK',
              onConfirm: () => {}
            });
          }
        } catch (err) {
          console.error(err);
          openConfirmation({
            title: 'Error',
            message: 'Network error. Unable to delete report.',
            confirmText: 'OK',
            onConfirm: () => {}
          });
        }
      }
    });
  };

  // Poll user's reports for real-time dispatch state tracking
  useEffect(() => {
    if (subTab === 'my-reports') {
      fetchMyReports();
      const interval = setInterval(fetchMyReports, 10000);
      return () => clearInterval(interval);
    }
  }, [subTab, token]);

  // File Upload Reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoSelected(true);
      setPhotoPreviewUrl(URL.createObjectURL(file));
      setPhotoError(null);
    }
  };

  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setMicError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioPlayUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Failed to access microphone:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError('Microphone permission denied. Please allow microphone access in your browser settings.');
      } else {
        setMicError('Failed to access microphone. Please check your recording device.');
      }
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleCategorySelect = (categoryName: string, distressType: string) => {
    setActiveCategory(categoryName);
    setEmergencyType(distressType);
  };

  if (sosSent) {
    return (
      <main className="w-full max-w-2xl mx-auto bg-[#F5F2EC] border border-[#EBE3D5] rounded-3xl p-6 md:p-8 shadow-xs flex flex-col gap-6 relative overflow-hidden transition-all duration-300">
        
        {/* Header Row: Title & Call 1962 Pill Button */}
        <div className="flex items-start justify-between gap-4 w-full relative z-10 select-none">
          <div className="flex flex-col min-w-0">
            <h1 className="font-serif text-2xl md:text-3xl text-[#1C1A17] font-normal leading-tight">Report Emergency</h1>
            <p className="text-xs text-stone-400 font-medium leading-normal mt-0.5">Share a few details to activate rescue near you.</p>
          </div>
          
          <a 
            href="tel:1962" 
            className="px-3.5 py-1.5 bg-[#9B1C1C] hover:bg-[#821414] active:scale-95 text-white font-bold rounded-full text-[10px] md:text-xs shrink-0 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-rose-200"
          >
            📞 Call 1962
          </a>
        </div>

        <EmergencySubmitted
          reportId={reportId}
          category={activeCategory}
          severity={severity}
          sosReason={sosReason}
          onBack={onResetSos}
          location={locationText}
        />
      </main>
    );
  }

  return (
    <main className="w-full max-w-2xl mx-auto bg-[#F5F2EC] border border-[#EBE3D5] rounded-3xl p-6 md:p-8 shadow-xs flex flex-col gap-6 relative overflow-hidden transition-all duration-300">

      {/* Header Row: Back Button, Title & Call 1962 Pill Button */}
      <div className="flex items-start justify-between gap-4 w-full relative z-10 select-none">
        <div className="flex flex-col min-w-0">
          <h1 className="font-serif text-2xl md:text-3xl text-[#1C1A17] font-normal leading-tight">Report Emergency</h1>
          <p className="text-xs text-stone-400 font-medium leading-normal mt-0.5">Share a few details to activate rescue near you.</p>
        </div>
        
        {/* Call 1962 button with red border */}
        <a 
          href="tel:1962" 
          className="px-3.5 py-1.5 bg-[#9B1C1C] hover:bg-[#821414] active:scale-95 text-white font-bold rounded-full text-[10px] md:text-xs shrink-0 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-rose-200"
        >
          Call 1962
        </a>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex border-b border-warmBeige/60 mb-2 select-none relative z-10">
        <button
          type="button"
          onClick={() => setSubTab('report')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            subTab === 'report'
              ? 'border-[#9B1C1C] text-[#9B1C1C]'
              : 'border-transparent text-stone-400 hover:text-[#9B1C1C]'
          }`}
        >
          Report Distress
        </button>
        <button
          type="button"
          onClick={() => setSubTab('my-reports')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            subTab === 'my-reports'
              ? 'border-[#4A5D4E] text-[#4A5D4E]'
              : 'border-transparent text-stone-400 hover:text-[#4A5D4E]'
          }`}
        >
          <span>My Reports</span>
          {myReports.length > 0 && (
            <span className="bg-[#4A5D4E] text-white text-[8px] px-1.5 py-0.5 rounded-full font-extrabold">
              {myReports.length}
            </span>
          )}
        </button>
      </div>

      {subTab === 'report' && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10 w-full">

        {/* Section 1: What happened? (2x4 Grid of cards) */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs md:text-sm font-bold text-charcoal select-none">1. What happened?</label>
          <div className="grid grid-cols-4 gap-2.5 w-full">
            
            {/* Grid 1: Accident (Active by default) */}
            <div 
              onClick={() => handleCategorySelect('Accident', 'Medical')}
              className={`rounded-[16px] p-2 flex flex-col items-center text-center gap-1.5 cursor-pointer transition-all border ${
                activeCategory === 'Accident'
                  ? 'bg-[#EAE4D8] border-[#9B1C1C] text-[#9B1C1C] shadow-2xs'
                  : 'bg-[#EFEBE3] border-[#EBE3D5] hover:border-[#9B1C1C]/60'
              }`}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" className="md:w-7 md:h-7 shrink-0" fill="none" stroke="#D95D39" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3C13 6.8 11.5 6 9.8 6H3c-1.1 0-2 .9-2 2v8c0 .6.4 1 1 1h2" />
                <circle cx="7" cy="17" r="2" />
                <circle cx="17" cy="17" r="2" />
                <path d="M12 9v4M12 17h.01" />
              </svg>
              <div>
                <h4 className="text-[10px] md:text-xs font-bold text-charcoal leading-tight">Accident</h4>
                <p className="text-[8px] md:text-[10px] text-stone-600 font-semibold leading-normal mt-0.5">Hit by vehicle</p>
              </div>
            </div>

            {/* Grid 2: Injury */}
            <div 
              onClick={() => handleCategorySelect('Injury', 'Medical')}
              className={`rounded-[16px] p-2 flex flex-col items-center text-center gap-1.5 cursor-pointer transition-all border ${
                activeCategory === 'Injury'
                  ? 'bg-[#EAE4D8] border-[#9B1C1C] text-[#9B1C1C] shadow-2xs'
                  : 'bg-[#EFEBE3] border-[#EBE3D5] hover:border-[#2D4536]/60'
              }`}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" className="md:w-7 md:h-7 shrink-0" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 3c-.5 0-1 .2-1.4.6L3.6 12.6c-.8.8-.8 2 0 2.8l4 4c.8.8 2 .8 2.8 0l9-9c.8-.8.8-2 0-2.8l-4-4c-.4-.4-.9-.6-1.4-.6Z" />
                <path d="m8.5 11.5 4 4M11.5 8.5l4 4" />
              </svg>
              <div>
                <h4 className="text-[10px] md:text-xs font-bold text-charcoal leading-tight">Injury</h4>
                <p className="text-[8px] md:text-[10px] text-stone-600 font-semibold leading-normal mt-0.5">Wounded animal</p>
              </div>
            </div>

            {/* Grid 3: Abuse */}
            <div 
              onClick={() => handleCategorySelect('Abuse', 'Safety')}
              className={`rounded-[16px] p-2 flex flex-col items-center text-center gap-1.5 cursor-pointer transition-all border ${
                activeCategory === 'Abuse'
                  ? 'bg-[#EAE4D8] border-[#9B1C1C] text-[#9B1C1C] shadow-2xs'
                  : 'bg-[#EFEBE3] border-[#EBE3D5] hover:border-[#9B1C1C]/60'
              }`}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" className="md:w-7 md:h-7 shrink-0" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2z" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <h4 className="text-[10px] md:text-xs font-bold text-charcoal leading-tight">Abuse</h4>
                <p className="text-[8px] md:text-[10px] text-stone-600 font-semibold leading-normal mt-0.5">Cruelty or harm</p>
              </div>
            </div>

            {/* Grid 4: Sick Animal */}
            <div 
              onClick={() => handleCategorySelect('Sick Animal', 'Medical')}
              className={`rounded-[16px] p-2 flex flex-col items-center text-center gap-1.5 cursor-pointer transition-all border ${
                activeCategory === 'Sick Animal'
                  ? 'bg-[#EAE4D8] border-[#9B1C1C] text-[#9B1C1C] shadow-2xs'
                  : 'bg-[#EFEBE3] border-[#EBE3D5] hover:border-[#9B1C1C]/60'
              }`}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" className="md:w-7 md:h-7 shrink-0" fill="none" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              <div>
                <h4 className="text-[10px] md:text-xs font-bold text-charcoal leading-tight">Sick Animal</h4>
                <p className="text-[8px] md:text-[10px] text-stone-600 font-semibold leading-normal mt-0.5">Unwell or weak</p>
              </div>
            </div>

            {/* Grid 5: Abandoned */}
            <div 
              onClick={() => handleCategorySelect('Abandoned', 'Safety')}
              className={`rounded-[16px] p-2 flex flex-col items-center text-center gap-1.5 cursor-pointer transition-all border ${
                activeCategory === 'Abandoned'
                  ? 'bg-[#EAE4D8] border-[#9B1C1C] text-[#9B1C1C] shadow-2xs'
                  : 'bg-[#EFEBE3] border-[#EBE3D5] hover:border-[#9B1C1C]/60'
              }`}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" className="md:w-7 md:h-7 shrink-0" fill="none" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              <div>
                <h4 className="text-[10px] md:text-xs font-bold text-charcoal leading-tight">Abandoned</h4>
                <p className="text-[8px] md:text-[10px] text-stone-600 font-semibold leading-normal mt-0.5">Left alone</p>
              </div>
            </div>

            {/* Grid 6: Stray */}
            <div 
              onClick={() => handleCategorySelect('Stray', 'General')}
              className={`rounded-[16px] p-2 flex flex-col items-center text-center gap-1.5 cursor-pointer transition-all border ${
                activeCategory === 'Stray'
                  ? 'bg-[#EAE4D8] border-[#9B1C1C] text-[#9B1C1C] shadow-2xs'
                  : 'bg-[#EFEBE3] border-[#EBE3D5] hover:border-[#2D4536]/60'
              }`}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" className="md:w-7 md:h-7 shrink-0" fill="none" stroke="#EA580C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
              <div>
                <h4 className="text-[10px] md:text-xs font-bold text-charcoal leading-tight">Stray</h4>
                <p className="text-[8px] md:text-[10px] text-stone-600 font-semibold leading-normal mt-0.5">No owner</p>
              </div>
            </div>

            {/* Grid 7: Lost Animal */}
            <div 
              onClick={() => handleCategorySelect('Lost Animal', 'General')}
              className={`rounded-[16px] p-2 flex flex-col items-center text-center gap-1.5 cursor-pointer transition-all border ${
                activeCategory === 'Lost Animal'
                  ? 'bg-[#EAE4D8] border-[#9B1C1C] text-[#9B1C1C] shadow-2xs'
                  : 'bg-[#EFEBE3] border-[#EBE3D5] hover:border-[#2D4536]/60'
              }`}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" className="md:w-7 md:h-7 shrink-0" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <div>
                <h4 className="text-[10px] md:text-xs font-bold text-charcoal leading-tight">Lost Animal</h4>
                <p className="text-[8px] md:text-[10px] text-stone-600 font-semibold leading-normal mt-0.5">Missing pet</p>
              </div>
            </div>

            {/* Grid 8: Other */}
            <div 
              onClick={() => handleCategorySelect('Other', 'General')}
              className={`rounded-[16px] p-2 flex flex-col items-center text-center gap-1.5 cursor-pointer transition-all border ${
                activeCategory === 'Other'
                  ? 'bg-[#EAE4D8] border-[#9B1C1C] text-[#9B1C1C] shadow-2xs'
                  : 'bg-[#EFEBE3] border-[#EBE3D5] hover:border-[#2D4536]/60'
              }`}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" className="md:w-7 md:h-7 shrink-0" fill="none" stroke="#4B5563" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div>
                <h4 className="text-[10px] md:text-xs font-bold text-charcoal leading-tight">Other</h4>
                <p className="text-[8px] md:text-[10px] text-stone-600 font-semibold leading-normal mt-0.5">Something else</p>
              </div>
            </div>

          </div>
        </div>

        {/* Section 2: Location Selection */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs md:text-sm font-bold text-charcoal select-none">2. Location</label>
          <div className="flex flex-col gap-2">
            
            {/* Top Bar: Use Current Location (Active default) */}
            <div 
              onClick={() => setLocationMode('current')}
              className={`rounded-2xl p-4 flex items-center justify-between cursor-pointer border transition-all ${
                locationMode === 'current'
                  ? 'bg-[#EAE4D8] border-[#2D4536]'
                  : 'bg-[#EFEBE3] border-[#EBE3D5]'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2D4536" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#2D4536]">
                  <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                  <circle cx="12" cy="10" r="3" fill="#2D4536" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-charcoal leading-tight">Use Current Location</span>
                  <span className="text-[10px] text-stone-600 font-semibold mt-0.5">{locationMode === 'current' ? locationText : 'Santi Nagar, Rourkela'}</span>
                </div>
              </div>
              
              {/* Radar target icon */}
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#2D4536" strokeWidth="2" className="text-[#2D4536]">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <line x1="12" y1="1" x2="12" y2="23" />
                <line x1="1" y1="12" x2="23" y2="12" />
              </svg>
            </div>

            {/* Bottom Bar: Pin Location Manually */}
            <div 
              onClick={() => setLocationMode('manual')}
              className={`rounded-2xl p-4 flex flex-col cursor-pointer border transition-all ${
                locationMode === 'manual'
                  ? 'bg-[#EAE4D8] border-[#2D4536]'
                  : 'bg-[#EFEBE3] border-[#EBE3D5]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#78716C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-stone-500">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-charcoal leading-tight">Pin Location Manually</span>
                    <span className="text-[10px] text-stone-500 font-semibold mt-0.5">Select on map</span>
                  </div>
                </div>
                {/* Right Chevron arrow */}
                <span className="text-stone-400 font-bold text-sm select-none mr-1">›</span>
              </div>

              {locationMode === 'manual' && (
                <div className="mt-3 w-full flex flex-col gap-2 relative z-10" onClick={(e) => e.stopPropagation()}>
                  <div id="leaflet-map" style={{ height: '180px' }} className="w-full rounded-xl border border-stone-200 bg-stone-100 shadow-inner" />
                  <div className="bg-white border border-stone-200 rounded-xl p-2.5 text-[10px] text-stone-600 leading-normal flex items-start gap-1.5 shadow-sm">
                    <span>📍</span>
                    <span className="font-semibold text-charcoal break-all">{locationText}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Add Photo Container (File input trigger) */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs md:text-sm font-bold text-charcoal select-none">
            3. Add Photo <span className="text-[#9B1C1C] font-bold ml-1">*</span>
          </label>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />

          {photoSelected ? (
            <div className="w-full bg-[#EFEBE3] border border-[#EBE3D5] rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xs select-none">
              <div className="flex items-center gap-3.5">
                <img 
                  src={photoPreviewUrl} 
                  alt="Attached preview" 
                  className="w-14 h-14 object-cover rounded-xl border border-[#EBE3D5] shadow-2xs"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-charcoal truncate">
                    {photoFile?.name || 'attached_image.jpg'}
                  </span>
                  <span className="text-[9px] text-[#2D4536] font-bold flex items-center gap-1 mt-0.5">
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" className="text-[#2D4536]">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Ready for upload ({( (photoFile?.size || 0) / 1024 / 1024 ).toFixed(2)} MB)
                  </span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => {
                  setPhotoFile(null);
                  setPhotoSelected(false);
                  setPhotoPreviewUrl('');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="p-2 bg-rose-50 hover:bg-rose-100/80 text-rose-600 rounded-xl transition-all cursor-pointer active:scale-95 shadow-2xs flex items-center justify-center shrink-0"
                title="Remove photo"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          ) : (
            <div 
              onClick={handlePhotoClick}
              className={`w-full bg-[#EFEBE3] hover:bg-[#EAE4D8] border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all select-none group ${
                photoError ? 'border-rose-400 bg-rose-50/30' : 'border-[#EBE3D5] hover:border-stone-400'
              }`}
            >
              <div className="p-3 bg-[#EAE4D8] rounded-full text-[#2D4536] group-hover:scale-105 transition-transform duration-200">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-xs font-bold text-charcoal">Upload Emergency Photo</span>
                <span className="text-[10px] text-stone-600 font-semibold mt-0.5">JPEG, PNG up to 10MB</span>
              </div>
            </div>
          )}

          {photoError && (
            <div className="w-full flex items-center gap-2 bg-[#FDF2F2] border border-[#F8B4B4] rounded-xl p-2.5 mt-1 text-[10px] text-rose-700 font-semibold select-none leading-normal">
              <span className="shrink-0 text-xs">⚠️</span>
              <span className="flex-1">{photoError}</span>
            </div>
          )}
        </div>

        {/* Section 4: Voice Note Recorder */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs md:text-sm font-bold text-charcoal select-none">4. Voice Note <span className="text-stone-500 font-normal">(optional)</span></label>
          
          {audioPlayUrl ? (
            <div className="w-full bg-[#EFEBE3] border border-[#EBE3D5] rounded-2xl p-4 flex flex-col gap-3 shadow-2xs select-none">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#EAE4D8] rounded-xl text-[#2D4536]">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    </svg>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-charcoal">Voice Note Recording</span>
                    <span className="text-[9px] text-[#2D4536] font-bold flex items-center gap-1 mt-0.5">
                      ✓ Saved & Ready to submit
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAudioBlob(null);
                    setAudioPlayUrl('');
                  }}
                  className="p-2 bg-rose-50 hover:bg-rose-100/80 text-rose-600 rounded-xl transition-all cursor-pointer active:scale-95 shadow-2xs flex items-center justify-center shrink-0"
                  title="Discard recording"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>

              <div className="w-full bg-[#EAE4D8] border border-[#EBE3D5] rounded-xl p-2 shadow-inner">
                <audio src={audioPlayUrl} controls className="w-full h-8 rounded-lg scale-90" />
              </div>
            </div>
          ) : (
            <div className="w-full bg-[#EFEBE3] border border-[#EBE3D5] rounded-2xl p-5 flex items-center justify-between gap-4 select-none relative overflow-hidden">
              {/* Animated visual wave lines during recording */}
              <div className="flex items-center gap-1 text-[#4A5D4E] min-w-[40px] opacity-40">
                <div className={`w-[3px] h-3 bg-current rounded-full transition-all duration-300 ${isRecording ? 'animate-bounce [animation-delay:0.1s]' : ''}`} />
                <div className={`w-[3px] h-5 bg-current rounded-full transition-all duration-300 ${isRecording ? 'animate-bounce [animation-delay:0.3s]' : ''}`} />
                <div className={`w-[3px] h-2 bg-current rounded-full transition-all duration-300 ${isRecording ? 'animate-bounce [animation-delay:0.5s]' : ''}`} />
              </div>

              {/* Center Recording Control Button */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-sm active:scale-95 ${
                    isRecording 
                      ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-200' 
                      : 'bg-clay text-white hover:bg-clay/90'
                  }`}
                >
                  {isRecording ? (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                    </svg>
                  )}
                </button>
                <div className="flex flex-col items-center text-center">
                  <span className="text-xs font-bold text-charcoal">
                    {isRecording ? "Recording Live Audio..." : "Tap to record voice"}
                  </span>
                  <span className="text-[9px] text-stone-400 font-semibold mt-0.5">
                    {isRecording ? "Tap square to stop" : "Describe coordinates and details"}
                  </span>
                </div>
              </div>

              {/* Animated visual wave lines during recording */}
              <div className="flex items-center gap-1 text-[#4A5D4E] min-w-[40px] opacity-40 justify-end">
                <div className={`w-[3px] h-2 bg-current rounded-full transition-all duration-300 ${isRecording ? 'animate-bounce [animation-delay:0.2s]' : ''}`} />
                <div className={`w-[3px] h-5 bg-current rounded-full transition-all duration-300 ${isRecording ? 'animate-bounce [animation-delay:0.4s]' : ''}`} />
                <div className={`w-[3px] h-3 bg-current rounded-full transition-all duration-300 ${isRecording ? 'animate-bounce [animation-delay:0.6s]' : ''}`} />
              </div>
            </div>
          )}

          {micError && (
            <div className="w-full flex items-start gap-2 bg-[#FDF2F2] border border-[#F8B4B4] rounded-xl p-2.5 mt-1 text-[10px] text-rose-700 font-semibold select-none leading-normal">
              <span className="shrink-0 text-xs mt-[1px]">⚠️</span>
              <span className="flex-1">{micError}</span>
            </div>
          )}
        </div>

        {/* Section 5: How serious is the situation? (Triage view) */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs md:text-sm font-bold text-charcoal select-none">5. How serious is the situation?</label>
          <div className="grid grid-cols-3 gap-2.5 w-full">
            
            {/* Triage 1: Critical (Red exclamation mark) */}
            <div 
              onClick={() => setSeverity('critical')}
              className={`rounded-2xl p-3 flex flex-col items-center text-center gap-2 cursor-pointer transition-all border ${
                severity === 'critical'
                  ? 'bg-[#FDF2F2] border-[#F8B4B4] shadow-sm'
                  : 'bg-[#FAF8F5]/30 border-stone-200 hover:border-[#F8B4B4]/50'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs select-none">
                !
              </div>
              <div>
                <h4 className="text-xs font-bold text-charcoal">Critical</h4>
                <p className="text-[9px] text-stone-400 font-semibold leading-tight mt-1">Life threatening / Needs immediate help</p>
              </div>
            </div>

            {/* Triage 2: Urgent (Amber clock) */}
            <div 
              onClick={() => setSeverity('urgent')}
              className={`rounded-2xl p-3 flex flex-col items-center text-center gap-2 cursor-pointer transition-all border ${
                severity === 'urgent'
                  ? 'bg-[#FFF8F1] border-[#FFE4E6]'
                  : 'bg-[#FAF8F5]/30 border-stone-200 hover:border-[#FFE4E6]/50'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs select-none">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-bold text-charcoal">Urgent</h4>
                <p className="text-[9px] text-stone-400 font-semibold leading-tight mt-1">Needs help soon / At risk</p>
              </div>
            </div>

            {/* Triage 3: Stable (Green checkmark) */}
            <div 
              onClick={() => setSeverity('stable')}
              className={`rounded-2xl p-3 flex flex-col items-center text-center gap-2 cursor-pointer transition-all border ${
                severity === 'stable'
                  ? 'bg-[#F0FDF4] border-[#BBF7D0]'
                  : 'bg-[#FAF8F5]/30 border-stone-200 hover:border-[#BBF7D0]/50'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs select-none">
                ✓
              </div>
              <div>
                <h4 className="text-xs font-bold text-charcoal">Stable</h4>
                <p className="text-[9px] text-stone-400 font-semibold leading-tight mt-1">Not critical / Can wait safely</p>
              </div>
            </div>

          </div>
        </div>

        {/* urgent description text area (replaces page.tsx standard input but references hook value) */}
        <div className="flex flex-col gap-1.5 mt-1 select-none">
          <label className="text-xs font-bold text-charcoal">
            Description of Emergency <span className="text-stone-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={sosReason}
            onChange={(e) => setSosReason(e.target.value)}
            placeholder="Describe what you see to help wardens prepare (e.g. animal size, visible symptoms, physical surroundings)..."
            className="bg-[#FCFAF7] border border-warmBeige rounded-xl p-3 text-sm text-charcoal outline-none focus:border-emergency min-h-[90px] resize-y transition-all"
          />
        </div>

        {/* Footer Action: Solid deep crimson button */}
        <button 
          type="submit" 
          className="w-full py-3.5 bg-[#9B1C1C] hover:bg-[#821414] active:scale-[0.99] text-white font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-200/50 transition-all cursor-pointer mt-3"
          disabled={sosSent}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-[-2px]">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          {sosSent ? "Broadcasting Distress Signal..." : "Activate Rescue Network"}
        </button>

      </form>
      )}

      {subTab === 'my-reports' && (
        <section className="flex flex-col gap-4 relative z-10 mt-1 select-none">
          <div className="flex items-center justify-between border-b border-[#EBE3D5] pb-3 mb-2">
            <div>
              <h3 className="font-serif text-lg text-charcoal font-medium">Distress Signals</h3>
              <p className="text-[10px] text-stone-400 font-semibold mt-0.5">Real-time status of your active rescue alerts</p>
            </div>
            <button
              type="button"
              onClick={fetchMyReports}
              className="p-2 bg-[#FCFAF7] border border-[#EBE3D5] text-[#4A5D4E] hover:bg-[#F5F2EC] rounded-full transition-all cursor-pointer flex items-center justify-center shadow-sm active:scale-95 shrink-0"
              title="Sync logs"
            >
              <svg className={`w-3.5 h-3.5 ${isHistoryLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>

          {isHistoryLoading && myReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-stone-400 select-none">
              <div className="w-6 h-6 rounded-full border-2 border-stone-200 border-t-[#4A5D4E] animate-spin" />
              <p className="text-[10px] font-bold">Retrieving tracking records...</p>
            </div>
          ) : myReports.length > 0 ? (
            <div className="flex flex-col gap-4">
              {myReports.map((report) => {
                let severityColor = 'bg-stone-50 border-stone-200 text-stone-600';
                if (report.severity === 'critical') severityColor = 'bg-rose-50 border-rose-100 text-rose-700';
                if (report.severity === 'urgent') severityColor = 'bg-amber-50 border-amber-100/80 text-amber-700';
                if (report.severity === 'stable') severityColor = 'bg-emerald-50 border-emerald-100/80 text-emerald-700';

                let statusBadgeColor = 'bg-stone-100 border-stone-200 text-stone-500';
                let statusLabel = 'Saved';
                let statusDot = 'bg-stone-400';
                
                if (report.status === 'active') {
                  statusBadgeColor = 'bg-rose-50 border-rose-100 text-rose-700';
                  statusLabel = 'Broadcasting Alert';
                  statusDot = 'bg-rose-600 animate-ping';
                } else if (report.status === 'dispatched') {
                  statusBadgeColor = 'bg-amber-50 border-amber-100 text-amber-700';
                  statusLabel = 'Wardens Dispatched';
                  statusDot = 'bg-amber-500';
                } else if (report.status === 'resolved') {
                  statusBadgeColor = 'bg-emerald-50 border-emerald-100 text-emerald-700';
                  statusLabel = 'Rescue Resolved';
                  statusDot = 'bg-emerald-600';
                }

                return (
                  <div
                    key={report._id}
                    className="bg-white border border-[#EBE3D5]/80 rounded-2xl p-5 flex flex-col gap-3.5 shadow-sm hover:shadow-md hover:border-[#DCD2C1] transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Dynamic side indicator border */}
                    <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${
                      report.status === 'active' ? 'bg-rose-500' : report.status === 'dispatched' ? 'bg-amber-400' : 'bg-emerald-500'
                    }`} />

                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                        {report.createdAt ? new Date(report.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just Now'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${severityColor}`}>
                          {report.severity.toUpperCase()}
                        </span>
                        <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadgeColor}`}>
                          {statusLabel}
                        </span>
                        {/* Delete Report Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteReport(report._id)}
                          className="p-1 rounded-lg bg-stone-50 border border-stone-200 text-stone-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center"
                          title="Delete Report"
                        >
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pl-1">
                      <h4 className="font-serif text-base text-charcoal font-medium leading-none">
                        {report.category} Emergency
                      </h4>
                      <p className="text-xs text-stone-500 italic bg-[#FCFAF7] border-l-2 border-stone-300 px-3 py-2 rounded-r-lg leading-relaxed">
                        &ldquo;{report.reason}&rdquo;
                      </p>
                    </div>

                    <div className="bg-[#FCFAF7] border border-[#F0EBE1] rounded-xl p-3 text-[10px] text-stone-600 flex items-start gap-2.5 mt-1 leading-normal">
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#9B1C1C] shrink-0 mt-0.5">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span className="break-words font-medium">{report.location}</span>
                    </div>

                    {/* Amazon-style Progress Tracker Stepper */}
                    {(() => {
                      let currentStep = 0; // 'active'
                      if (report.status === 'dispatched') currentStep = 1;
                      if (report.status === 'resolved') currentStep = 2;

                      const steps = [
                        { label: 'Alert Sent', desc: 'Signal Broadcasted' },
                        { label: 'Dispatched', desc: 'Wardens En Route' },
                        { label: 'Resolved', desc: 'Rescue Completed' }
                      ];

                      return (
                        <div className="mt-4 pt-4 border-t border-[#F0EBE1] flex flex-col gap-3 select-none">
                          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Rescue Progress Tracker</span>
                          
                          <div className="flex items-center justify-between relative mt-2 px-1 pb-2">
                            {/* Connecting Line background */}
                            <div className="absolute top-[10px] left-[16.6%] right-[16.6%] h-[2px] bg-stone-100 -z-0" />
                            {/* Connecting Line active fill */}
                            <div 
                              className="absolute top-[10px] left-[16.6%] h-[2px] bg-[#4A5D4E] transition-all duration-500 -z-0" 
                              style={{
                                width: currentStep === 0 ? '0%' : currentStep === 1 ? '33.3%' : '66.6%'
                              }}
                            />

                            {steps.map((step, idx) => {
                              const isCompleted = currentStep >= idx;
                              const isActive = currentStep === idx;
                              
                              let nodeBg = 'bg-stone-200';
                              if (isCompleted) {
                                nodeBg = isActive ? 'bg-[#9B1C1C]' : 'bg-[#4A5D4E]';
                              }

                              return (
                                <div key={idx} className="flex flex-col items-center gap-1.5 relative z-10 flex-1">
                                  {/* Circle indicator */}
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white transition-all duration-300 ${nodeBg} ${isActive ? 'ring-4 ring-rose-100 scale-110' : ''}`}>
                                    {isCompleted && !isActive ? '✓' : idx + 1}
                                  </div>
                                  
                                  {/* Label text */}
                                  <div className="text-center min-w-0">
                                    <p className={`text-[9.5px] font-bold ${isCompleted ? 'text-charcoal' : 'text-stone-400'} truncate`}>
                                      {step.label}
                                    </p>
                                    <p className="text-[8px] text-stone-400 mt-0.5 leading-tight">
                                      {isActive ? step.desc : ''}
                                      {!isActive && isCompleted ? 'Completed' : ''}
                                      {!isCompleted ? 'Pending' : ''}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* User status update controls */}
                          <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-[#F0EBE1]/60 flex-wrap select-none">
                            {report.status === 'active' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateMyReportStatus(report._id, 'dispatched')}
                                className="px-3 py-1.5 bg-[#FFF8F1] hover:bg-[#FFEAE1] border border-[#FFE4E6] text-amber-700 text-[10px] font-extrabold rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
                              >
                                Mark Dispatched
                              </button>
                            )}
                            {report.status !== 'resolved' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateMyReportStatus(report._id, 'resolved')}
                                className="px-3 py-1.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] border border-[#BBF7D0] text-emerald-700 text-[10px] font-extrabold rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
                              >
                                Mark Resolved
                              </button>
                            )}
                            {report.status !== 'active' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateMyReportStatus(report._id, 'active')}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 text-[10px] font-extrabold rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
                              >
                                Reopen Alert
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-[#EBE3D5] rounded-[20px] select-none bg-[#FCFAF7]">
              <p className="text-xs text-stone-400 font-semibold">You have not submitted any emergency reports yet.</p>
            </div>
          )}
        </section>
      )}

      {/* Custom Confirmation Dialog Modal */}
      {isConfirmOpen && confirmConfig && (
        <div className="fixed inset-0 z-50 bg-[#1C1A17]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-[#F0EBE1] shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col gap-1 text-center select-none">
              <h4 className="font-serif text-lg text-[#1C1A17] font-semibold">{confirmConfig.title}</h4>
              <p className="text-xs text-stone-400 font-medium leading-relaxed mt-1">{confirmConfig.message}</p>
            </div>
            
            <div className={`grid ${confirmConfig.cancelText ? 'grid-cols-2' : 'grid-cols-1'} gap-3 mt-2`}>
              {confirmConfig.cancelText && (
                <button
                  type="button"
                  onClick={closeConfirmation}
                  className="py-2.5 px-4 text-xs font-bold rounded-xl border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 transition-colors cursor-pointer text-center"
                >
                  {confirmConfig.cancelText}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  confirmConfig.onConfirm();
                  closeConfirmation();
                }}
                className={`py-2.5 px-4 text-xs font-bold rounded-xl text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer text-center ${
                  confirmConfig.isDestructive 
                    ? 'bg-red-600 hover:bg-red-750 shadow-sm' 
                    : 'bg-[#4A5D4E] hover:bg-[#3A4D3E] shadow-sm'
                }`}
              >
                {confirmConfig.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

