'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  CircleMember,
  CommunityUpdate,
  CircleLeader,
  Partner,
  ImpactMetrics,
  MemberRole
} from '../types';
import { getDistance, DistanceInfo, getCoordinatesForLocation as getCoordinatesForLocationShared, getDistanceBetweenCoordinates } from '../lib/proximity';
import { useAuth } from '../context/AuthContext';
import SupportRequestDetail from './SupportRequestDetail';
import MohallaNetwork from './MohallaNetwork';
import MohallaUpdates from './MohallaUpdates';
import BlogDetailView from './BlogDetailView';
import MohallaImpact from './MohallaImpact';
import { loadLeaflet } from '../lib/leafletLoader';
import { CalendarIcon, SyringeIcon, LeafIcon, HouseIcon } from './icons/PetIcons';
import PopupModal, { PopupConfig } from './PopupModal';
import { MapPinOff, AlertTriangle, Users, PlusCircle, CalendarDays } from 'lucide-react';
import { API_BASE } from '../lib/api';
import RadiusSelector from './RadiusSelector';


const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hrs ago`;
  return `${Math.floor(hrs / 24)} days ago`;
};

const renderRoleIcon = (role: MemberRole, size = 'w-6 h-6') => {
  switch (role) {
    case 'ngo':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-terracotta`}>
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
        </svg>
      );
    case 'feeder':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-terracotta`}>
          <path d="M12 2v4M12 18h.01M3 20h18M5 10a7 7 0 0 0 14 0H5z" />
        </svg>
      );
    case 'rescuer':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-terracotta`}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case 'volunteer':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-clay`}>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      );
    case 'paravet':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-terracotta`}>
          <path d="M4.82 17.22a3 3 0 1 1-3-3m0 0v-4a7 7 0 0 1 14 0v4m0-4V6a2 2 0 0 1 2-2h2m-6 13.22a3 3 0 1 1 3-3" />
        </svg>
      );
    case 'adopter':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-clay`}>
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-stone-500`}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
  }
};

const renderPartnerIcon = (type: string, size = 'w-7 h-7') => {
  switch (type.toLowerCase()) {
    case 'veterinary':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-terracotta`}>
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
    case 'ngo':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={`${size} text-clay`}>
          <path d="M12 14c-1.66 0-3 1.34-3 3 0 2 2 3.5 3 4.5 1-1 3-2.5 3-4.5 0-1.66-1.34-3-3-3zm-4.5-2.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm9 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm-11-4C4.67 7.5 4 8.17 4 9s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5S6.33 7.5 5.5 7.5zm13 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM12 2c-.83 0-1.5.67-1.5 1.5S11.17 5 12 5s1.5-.67 1.5-1.5S12.83 2 12 2z" fill="currentColor" />
        </svg>
      );
    case 'shelter':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-clay`}>
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-clay`}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      );
  }
};

interface MohallaCircleProps {
  onNavigate?: (tab: string) => void;
  userAddress?: string;
  setActiveTab?: (tab: any) => void;
  view?: 'home' | 'members' | 'impact' | 'updates';
}

export default function MohallaCircle({ onNavigate, userAddress = 'Sector 45, Gurugram', setActiveTab, view }: MohallaCircleProps) {
  const { token, user } = useAuth();
  const [activeView, setActiveView] = useState<'home' | 'members' | 'impact' | 'updates'>(view || 'home');

  useEffect(() => {
    if (view) {
      setActiveView(view);
    }
  }, [view]);
  const [memberFilter, setMemberFilter] = useState<MemberRole>('all');
  const [updateFilter, setUpdateFilter] = useState<string>('all');
  const [selectedRadius, setSelectedRadius] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('aumoha_radius_km');
      return saved ? parseInt(saved, 10) : 10;
    } catch {
      return 10;
    }
  });

  const handleRadiusChange = (radiusKm: number) => {
    setSelectedRadius(radiusKm);
    try {
      localStorage.setItem('aumoha_radius_km', String(radiusKm));
    } catch (e) {
      console.warn('Failed to save radius preference:', e);
    }
  };

  const [selectedLocation, setSelectedLocation] = useState(userAddress || 'Saheed Nagar, Sector 45');
  const [joinedEvents, setJoinedEvents] = useState<string[]>([]);
  const [joinedActivities, setJoinedActivities] = useState<string[]>([]);
  const [dbActivities, setDbActivities] = useState<any[]>([]);
  const [startActivityOnUpdates, setStartActivityOnUpdates] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedEvents = localStorage.getItem('joinedEvents');
      if (savedEvents) setJoinedEvents(JSON.parse(savedEvents));

      const savedActivities = localStorage.getItem('joinedActivities');
      if (savedActivities) setJoinedActivities(JSON.parse(savedActivities));
    } catch (e) {
      console.warn('Failed to load local storage state:', e);
    }
  }, []);

  const [popupConfig, setPopupConfig] = useState<PopupConfig | null>(null);

  const toggleJoinEvent = (eventId: string, eventTitle: string) => {
    setJoinedEvents(prev => {
      const isJoined = prev.includes(eventId);
      const updated = isJoined ? prev.filter(id => id !== eventId) : [...prev, eventId];
      localStorage.setItem('joinedEvents', JSON.stringify(updated));
      setPopupConfig({
        title: isJoined ? 'Event Unregistered' : 'Event Registered!',
        message: isJoined ? `Unregistered from ${eventTitle}` : `Successfully registered for ${eventTitle}!`,
        type: 'success'
      });
      return updated;
    });
  };

  const toggleJoinActivity = async (activityId: string, title: string) => {
    const stringId = String(activityId);
    const isCurrentlyJoined = joinedActivities.map(String).includes(stringId);
    const action = isCurrentlyJoined ? 'leave' : 'join';

    // 1. Update joinedActivities array immediately
    setJoinedActivities(prev => {
      const updated = isCurrentlyJoined 
        ? prev.filter(id => String(id) !== stringId) 
        : [...prev, stringId];
      localStorage.setItem('joinedActivities', JSON.stringify(updated));
      return updated;
    });

    // 2. Update selectedBlog joinees list immediately
    if (selectedBlog && String(selectedBlog.id) === stringId) {
      setSelectedBlog(prev => {
        if (!prev) return prev;
        const currentJoinees = prev.joinees || [];
        const userEmail = user?.email || 'helper@aumoha.org';
        const userName = user?.fullName || 'Volunteer Helper';
        const userPhone = user?.phone || '';
        
        let newJoinees;
        if (isCurrentlyJoined) {
          newJoinees = currentJoinees.filter(j => j.userEmail !== userEmail && j.userName !== userName);
        } else {
          newJoinees = [...currentJoinees, { 
            userEmail, 
            userName, 
            userPhone, 
            avatar: user?.profilePic || '' 
          }];
        }
        return {
          ...prev,
          joinees: newJoinees
        };
      });
    }

    // 3. Sync to backend if token exists
    if (token) {
      try {
        const res = await fetch(`${API_BASE}/activities/${activityId}/${action}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (selectedBlog && String(selectedBlog.id) === stringId && data.activity?.joinees) {
            setSelectedBlog(prev => (prev ? { ...prev, joinees: data.activity.joinees } : prev));
          }
          refreshUpdates();
        }
      } catch (err) {
        console.warn('Failed to sync join activity with server:', err);
      }
    }
  }; const [deviceCoords, setDeviceCoords] = useState<[number, number] | null>(null);
  const [deviceAddress, setDeviceAddress] = useState<string>('');

  const getCoordinatesForLocation = (location: string): [number, number] => {
    const clean = (location || '').toLowerCase();
    if (deviceAddress && clean.includes(deviceAddress.split(',')[0].toLowerCase())) {
      if (deviceCoords) return deviceCoords;
    }
    return getCoordinatesForLocationShared(location, deviceCoords || undefined);
  };

  // When user.address changes, immediately set it as selectedLocation
  // so the map re-centers, then try to refine with browser GPS
  useEffect(() => {
    const fallbackAddr = user?.address || userAddress || 'Koel Nagar, Sundargarh';
    // Always set fallback immediately so map doesn't stay stale
    if (!deviceAddress) {
      setSelectedLocation(fallbackAddr);
    }

    // Try to refine with browser GPS
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setDeviceCoords([lat, lng]);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
            headers: { 'Accept-Language': 'en' }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.display_name) {
              const shortAddr = data.address.neighbourhood || data.address.suburb || data.address.road || data.display_name.split(',')[0];
              const cityStr = data.address.city || data.address.town || data.address.state_district || '';
              const fullAddr = cityStr ? `${shortAddr}, ${cityStr}` : shortAddr;
              setDeviceAddress(fullAddr);
              setSelectedLocation(fullAddr);
            }
          }
        } catch (err) {
          console.warn('Failed to reverse geocode device location:', err);
        }
      },
      () => {
        // GPS denied — fallback already set above
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
    );
  }, [user?.address, userAddress]);

  // Navigation states for sub-screens
  const [selectedRequest, setSelectedRequest] = useState<CommunityUpdate | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<CommunityUpdate | null>(null);

  const handleSelectRequestOrBlog = (post: CommunityUpdate) => {
    if (post.category === 'help') {
      setSelectedRequest(post);
    } else {
      setSelectedBlog(post);
    }
  };

  // Maps instances
  const homeMapRef = useRef<any>(null);
  const membersMapRef = useRef<any>(null);



  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [dbSosReports, setDbSosReports] = useState<any[]>([]);
  const [resolvedSosCount, setResolvedSosCount] = useState<number>(0);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);

  const refreshUpdates = async () => {
    if (!token) return;
    try {
      const actRes = await fetch(`${API_BASE}/activities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (actRes.ok) {
        const actData = await actRes.json();
        setDbActivities(actData.activities || []);
      }

      const sosRes = await fetch(`${API_BASE}/sos/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (sosRes.ok) {
        const sosData = await sosRes.json();
        setDbSosReports(sosData.reports || []);
      }

      const resolvedRes = await fetch(`${API_BASE}/sos/resolved`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resolvedRes.ok) {
        const resolvedData = await resolvedRes.json();
        setResolvedSosCount(resolvedData.reports?.length || 0);
      }
    } catch (err) {
      console.warn('Failed to refresh updates:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        const userRes = await fetch(`${API_BASE}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          setDbUsers(userData.users || []);
        }

        const sosRes = await fetch(`${API_BASE}/sos/active`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (sosRes.ok) {
          const sosData = await sosRes.json();
          setDbSosReports(sosData.reports || []);
        }

        const resolvedRes = await fetch(`${API_BASE}/sos/resolved`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resolvedRes.ok) {
          const resolvedData = await resolvedRes.json();
          setResolvedSosCount(resolvedData.reports?.length || 0);
        }

        const actRes = await fetch(`${API_BASE}/activities`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (actRes.ok) {
          const actData = await actRes.json();
          setDbActivities(actData.activities || []);
        }
      } catch (err) {
        console.warn('Failed to fetch Mohalla Circle database data:', err);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const [nowTs] = useState(() => Date.now());
  const dbMappedUsers = useMemo(() => {
    return dbUsers.map(u => ({
      id: u._id,
      name: u.fullName,
      avatar: u.profilePic || '',
      role: (u.role || 'normal') as MemberRole,
      location: u.address || 'Saheed Nagar',
      badge: u.role === 'rescuer' ? ('trusted' as const) : undefined,
      joinedTime: u.createdAt
        ? Math.max(1, Math.round((nowTs - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24))).toString()
        : '1'
    }));
  }, [dbUsers, nowTs]);

  const allMembers = dbMappedUsers;

  const computedMembers: CircleMember[] = allMembers.map(m => {
    const coords = getCoordinatesForLocation(m.location || '');
    const centerCoords = getCoordinatesForLocation(selectedLocation);
    const distInfo = getDistanceBetweenCoordinates(centerCoords, coords);
    return {
      id: m.id,
      name: m.name,
      avatar: m.avatar,
      role: m.role,
      location: m.location,
      badge: m.badge || undefined,
      joinedTime: m.joinedTime,
      distance: distInfo.display,
      distanceVal: distInfo.distanceVal,
      lat: coords[0],
      lng: coords[1]
    };
  }).sort((a, b) => (a.distanceVal ?? Infinity) - (b.distanceVal ?? Infinity));

  const dbMappedReports = dbSosReports.map(r => {
    const user = dbUsers.find(u => u.phone === r.userPhone || u.email === r.userEmail);
    const authorName = user ? user.fullName : (r.userPhone || 'Anonymous Reporter');
    return {
      id: r._id,
      author: authorName,
      authorRole: (user?.role || 'volunteer') as MemberRole,
      avatar: user?.profilePic || '🚨',
      time: formatTime(r.createdAt),
      category: 'help' as const,
      title: r.category ? (r.category.charAt(0).toUpperCase() + r.category.slice(1)) : 'Animal Emergency',
      description: r.reason || r.description || `SOS Alert: ${r.category} severity issue.`,
      image: r.photo || '',
      location: r.location || 'Saheed Nagar',
      likes: 0,
      animalCategory: r.category,
      severity: r.severity,
      contactPhone: r.userPhone || user?.phone || '9876 543 210',
      createdAt: r.createdAt,
      status: r.status
    };
  });

  const dbMappedActivities = dbActivities.map(act => ({
    id: act._id,
    author: act.authorName || 'Anonymous User',
    authorRole: (act.authorRole || 'volunteer') as MemberRole,
    avatar: act.avatar || '',
    time: formatTime(act.createdAt),
    category: act.category,
    title: act.title,
    description: act.description,
    image: act.image || '',
    location: act.location || 'Saheed Nagar',
    likes: act.likes || 0,
    userEmail: act.userEmail,
    createdAt: act.createdAt,
    joinees: act.joinees || []
  }));

  const allUpdates = [...dbMappedReports, ...dbMappedActivities].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  const computedUpdates: CommunityUpdate[] = allUpdates.map(u => {
    const coords = getCoordinatesForLocation(u.location || '');
    const centerCoords = getCoordinatesForLocation(selectedLocation);
    const distInfo = getDistanceBetweenCoordinates(centerCoords, coords);
    return {
      id: u.id,
      author: u.author,
      authorRole: u.authorRole,
      avatar: u.avatar,
      time: u.time,
      category: u.category,
      title: u.title,
      description: u.description,
      image: u.image,
      location: u.location,
      likes: u.likes,
      distance: distInfo.display,
      distanceVal: distInfo.distanceVal,
      lat: coords[0],
      lng: coords[1],
      animalCategory: (u as any).animalCategory,
      severity: (u as any).severity,
      contactPhone: (u as any).contactPhone,
      status: (u as any).status,
      joinees: (u as any).joinees
    };
  });



  // Role style mappings (matching dark green theme)
  const getRoleColors = (role: MemberRole) => {
    switch (role) {
      case 'ngo':
        return { bg: 'bg-[#E5E0D4]', text: 'text-[#2D4536]', border: 'border-[#D3CCBE]', label: 'NGO' };
      case 'feeder':
        return { bg: 'bg-[#E5E0D4]', text: 'text-[#2D4536]', border: 'border-[#D3CCBE]', label: 'Feeder' };
      case 'rescuer':
        return { bg: 'bg-[#E5E0D4]', text: 'text-[#2D4536]', border: 'border-[#D3CCBE]', label: 'Rescuer' };
      case 'volunteer':
        return { bg: 'bg-[#E5E0D4]', text: 'text-[#2D4536]', border: 'border-[#D3CCBE]', label: 'Volunteer' };
      case 'paravet':
        return { bg: 'bg-[#E5E0D4]', text: 'text-[#2D4536]', border: 'border-[#D3CCBE]', label: 'Paravet' };
      case 'adopter':
        return { bg: 'bg-[#E5E0D4]', text: 'text-[#2D4536]', border: 'border-[#D3CCBE]', label: 'Foster Home' };
      default:
        return { bg: 'bg-[#E5E0D4]', text: 'text-[#2D4536]', border: 'border-[#D3CCBE]', label: 'Member' };
    }
  };

  const getBadgeText = (badge?: string) => {
    if (!badge) return '';
    switch (badge) {
      case 'trusted': return '✓ Trusted';
      case 'available': return '🌙 Available tonight';
      case 'level5': return '⭐ Level 5';
      case 'level4': return '⭐ Level 4';
      case 'level3': return '⭐ Level 3';
      default: return badge;
    }
  };

  const getSvgIconString = (roleOrType: string) => {
    const clean = (roleOrType || '').toLowerCase();
    switch (clean) {
      case 'feeder':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="#D95D39" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M12 2v4M12 18h.01M3 20h18M5 10a7 7 0 0 0 14 0H5z" /></svg>`;
      case 'rescuer':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="#D95D39" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>`;
      case 'volunteer':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="#8C5E45" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>`;
      case 'paravet':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="#D95D39" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M4.82 17.22a3 3 0 1 1-3-3m0 0v-4a7 7 0 0 1 14 0v4m0-4V6a2 2 0 0 1 2-2h2m-6 13.22a3 3 0 1 1 3-3" /></svg>`;
      case 'adopter':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="#8C5E45" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>`;
      case 'help_needed':
      case 'incident':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="#C23B22" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-5.5 h-5.5 animate-pulse"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>`;
      default:
        return `<svg viewBox="0 0 24 24" fill="none" stroke="#8C5E45" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>`;
    }
  };

  // CDN Leaflet loading logic (checks if loaded, loads on demand, cleans up)
  const loadLeafletMap = (L: any, mapId: string, center: [number, number], pins: any[], setInstanceRef: any, radiusKm: number = 10) => {
    const mapContainer = document.getElementById(mapId);
    if (!mapContainer) return;

    // Cleanup previous map on the same element if it exists
    if (setInstanceRef.current) {
      try {
        setInstanceRef.current.remove();
      } catch (e) {
        console.error(e);
      }
    }

    // Cleanup internal Leaflet id to prevent "Map container is already initialized" error
    if ((mapContainer as any)._leaflet_id) {
      delete (mapContainer as any)._leaflet_id;
    }

    let zoomLevel = 12;
    if (radiusKm === 1) zoomLevel = 15;
    else if (radiusKm === 2) zoomLevel = 14;
    else if (radiusKm === 5) zoomLevel = 13;
    else if (radiusKm === 10) zoomLevel = 12;
    else if (radiusKm === 25) zoomLevel = 10;
    else if (radiusKm === 0) zoomLevel = 9;

    const map = L.map(mapId, { zoomControl: false }).setView(center, zoomLevel);
    setInstanceRef.current = map;

    // Google Maps Standard layer
    L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20,
      attribution: '&copy; Google Maps'
    }).addTo(map);

    // User node center dot (White circle with dark forest green center dot)
    const greenDotIcon = L.divIcon({
      className: 'custom-center-icon',
      html: `<div class="w-6 h-6 bg-white rounded-full border-2 border-[#2D4536] shadow-md flex items-center justify-center">
               <div class="w-3 h-3 bg-[#2D4536] rounded-full"></div>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    L.marker(center, { icon: greenDotIcon }).addTo(map);

    // Draw search radius ring (Forest green outline & soft green tint)
    const ringRadiusMeters = radiusKm === 0 ? 50000 : radiusKm * 1000;
    L.circle(center, {
      color: '#2D4536',
      fillColor: '#3D5A45',
      fillOpacity: 0.08,
      radius: ringRadiusMeters,
      weight: 1.5,
      opacity: 0.6
    }).addTo(map);

    const getPinColor = (role: string) => {
      switch (role) {
        case 'feeder': return '#D95D39';
        case 'rescuer': return '#D95D39';
        case 'volunteer': return '#8C5E45';
        case 'paravet': return '#D95D39';
        case 'adopter': return '#8C5E45';
        case 'help_needed': return '#C23B22';
        default: return '#8C5E45';
      }
    };

    const getPinIcon = (role: string) => {
      switch (role) {
        case 'feeder':
          return `<svg class="w-3.5 h-3.5 text-[#D95D39]" fill="currentColor" viewBox="0 0 24 24"><path d="M2 20h20v2H2v-2zm2-2h16c0-4.42-3.58-8-8-8s-8 3.58-8 8zm8-10c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>`;
        case 'adopter':
          return `<svg class="w-3.5 h-3.5 text-[#8C5E45]" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>`;
        case 'paravet':
          return `<svg class="w-3.5 h-3.5 text-[#D95D39]" fill="currentColor" viewBox="0 0 24 24"><path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z"/></svg>`;
        case 'volunteer':
          return `<svg class="w-3.5 h-3.5 text-[#8C5E45]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
        case 'rescuer':
          return `<svg class="w-3.5 h-3.5 text-[#D95D39]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
        case 'help_needed':
          return `<svg class="w-3.5 h-3.5 text-[#C23B22]" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>`;
        default:
          return `<svg class="w-3.5 h-3.5 text-[#8C5E45]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
      }
    };

    // Add pins (Filter pins to only render those within active radius)
    const centerKey = `${center[0].toFixed(6)},${center[1].toFixed(6)}`;
    const coordinatesRegistry: { [key: string]: number } = {
      [centerKey]: 0
    };

    pins.forEach(pin => {
      // Check radius threshold
      if (radiusKm > 0 && pin.distanceVal !== undefined && pin.distanceVal > ringRadiusMeters) {
        return; // Skip pin outside radius
      }

      let lat = pin.lat;
      let lng = pin.lng;
      const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
      if (coordinatesRegistry[key] !== undefined) {
        coordinatesRegistry[key] += 1;
        const count = coordinatesRegistry[key];
        const angle = count * (Math.PI / 4);
        const radius = 0.0006 * Math.ceil(count / 8);
        lat += Math.sin(angle) * radius;
        lng += Math.cos(angle) * radius;
      } else {
        coordinatesRegistry[key] = 0;
      }

      const color = getPinColor(pin.role);
      const iconHtml = (pin.avatar && pin.avatar.startsWith('http'))
        ? `<img src="${pin.avatar}" class="w-full h-full rounded-full object-cover" />`
        : getPinIcon(pin.role);

      // Gold badge star
      const goldBadgeHtml = pin.badge
        ? `<div class="absolute -top-1 -right-1 w-4 h-4 bg-[#B68A35] rounded-full border border-white flex items-center justify-center text-[8px] text-white shadow-xs">★</div>`
        : '';

      const markerHtml = `
        <div class="flex flex-col items-center">
          <div class="relative w-9 h-11 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] active:scale-95 transition-all">
            <!-- Pin SVG -->
            <svg class="w-9 h-11" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 0C8.06 0 0 8.06 0 18C0 28.5 18 44 18 44C18 44 36 28.5 36 18C36 8.06 27.94 0 18 0Z" fill="${color}"/>
            </svg>
            <!-- White inner circle -->
            <div class="absolute top-[3px] left-[3px] w-[30px] h-[30px] rounded-full bg-white flex items-center justify-center overflow-hidden">
              ${iconHtml}
            </div>
            <!-- Star Badge -->
            ${goldBadgeHtml}
          </div>
          <!-- Label -->
          <div class="mt-1 text-center bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md border border-[#F0EBE1] shadow-xs leading-tight whitespace-nowrap">
            <div class="text-[9px] font-extrabold text-charcoal leading-none">${pin.name}</div>
            <div class="text-[8px] font-bold text-stone-500 mt-0.5 leading-none">${pin.distance || 'Nearby'}</div>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-member-pin',
        html: markerHtml,
        iconSize: [80, 80],
        iconAnchor: [40, 44]
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        if (pin.role === 'help_needed' && pin.id) {
          const req = computedUpdates.find(u => u.id === pin.id);
          if (req) {
            setSelectedRequest(req);
          }
        } else {
          // Filter members tab to this member or role
          setActiveView('members');
          setMemberFilter(pin.role);
        }
      });
    });
  };

  // Load maps based on active sub-screen
  useEffect(() => {
    const centerCoords = getCoordinatesForLocation(selectedLocation);
    let isMounted = true;

    const initMap = async () => {
      try {
        const L = await loadLeaflet();
        if (!isMounted) return;

        if (activeView === 'home') {
          // Load Home Map (Screen 1) with both Emergency Reports & Rescuers/Members
          const activeReportsPins = computedUpdates
            .filter(u => u.category === 'help' && u.status === 'active')
            .map(u => ({
              id: u.id,
              name: ((u as any).animalCategory || u.title || 'Emergency').replace(/^\w/, (c: string) => c.toUpperCase()),
              avatar: '🚨',
              role: 'help_needed',
              lat: u.lat || centerCoords[0],
              lng: u.lng || centerCoords[1],
              distance: u.distance,
              distanceVal: u.distanceVal
            }));

          const rescuerPins = computedMembers
            .filter(m => m.role === 'rescuer')
            .map(m => {
              const mCoords = m.lat && m.lng ? [m.lat, m.lng] : getCoordinatesForLocationShared(m.location || '', centerCoords);
              return {
                id: m.id,
                name: m.name || 'Rescuer',
                avatar: m.avatar,
                role: m.role || 'rescuer',
                lat: mCoords[0],
                lng: mCoords[1],
                distance: m.distance,
                distanceVal: m.distanceVal,
                badge: m.badge
              };
            });

          const homePins = [...activeReportsPins, ...rescuerPins];
          loadLeafletMap(L, 'home-map', centerCoords, homePins, homeMapRef, selectedRadius);
        }
      } catch (err) {
        console.error('Failed to initialize Leaflet map:', err);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      // Clean up maps
      if (homeMapRef.current) {
        try {
          homeMapRef.current.remove();
        } catch (e) {
          console.error(e);
        }
        homeMapRef.current = null;
      }
      if (membersMapRef.current) {
        try {
          membersMapRef.current.remove();
        } catch (e) {
          console.error(e);
        }
        membersMapRef.current = null;
      }
    };
  }, [activeView, selectedRequest, computedMembers, computedUpdates, selectedLocation, selectedRadius]);



  const renderEventGraphic = (id: string) => {
    switch (id) {
      case 'e1': // Vaccination Camp
        return (
          <div className="w-full h-full bg-gradient-to-br from-[#FAF2EE] to-[#F5DFD8] flex items-center justify-center relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-terracotta">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <span className="absolute bottom-2 right-2 bg-white/90 text-terracotta text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-[#F5DFD8] flex items-center gap-1">
              <SyringeIcon className="w-3 h-3 text-terracotta" /> VACCINE
            </span>
          </div>
        );
      case 'e2': // Clean Streets, Safe Paws
        return (
          <div className="w-full h-full bg-gradient-to-br from-[#FCFAF7] to-[#F5F2EC] flex items-center justify-center relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-clay">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="absolute bottom-2 right-2 bg-white/90 text-clay text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-[#EBE3D5] flex items-center gap-1">
              <LeafIcon className="w-3 h-3 text-clay" /> CLEANUP
            </span>
          </div>
        );
      case 'e3': // Adoption Meet
        return (
          <div className="w-full h-full bg-gradient-to-br from-[#FCFAF7] to-[#F5F2EC] flex items-center justify-center relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-clay">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="absolute bottom-2 right-2 bg-white/90 text-clay text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-[#EBE3D5] flex items-center gap-1">
              <HouseIcon className="w-3 h-3 text-clay" /> ADOPTION
            </span>
          </div>
        );
      default:
        return (
          <div className="w-full h-full bg-gradient-to-br from-[#ECEFF1] to-[#CFD8DC] flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-stone-500" />
          </div>
        );
    }
  };

  // --- RENDER SUPPORT REQUEST DETAIL SUB-PAGE (Screen 6) ---
  if (selectedRequest) {
    return (
      <SupportRequestDetail
        selectedRequest={selectedRequest}
        onBack={() => setSelectedRequest(null)}
        selectedLocation={selectedLocation}
        getCoordinatesForLocation={getCoordinatesForLocation}
        computedMembers={computedMembers}
      />
    );
  }

  // --- RENDER BLOG DETAIL SUB-PAGE ---
  if (selectedBlog) {
    return (
      <BlogDetailView
        selectedBlog={selectedBlog}
        onBack={() => setSelectedBlog(null)}
        joinedActivities={joinedActivities}
        toggleJoinActivity={toggleJoinActivity}
      />
    );
  }

  const renderChipIcon = (id: string) => {
    switch (id) {
      case 'all':
        return (
          <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
        );
      case 'feeder':
        return (
          <svg className="w-4 h-4 text-[#C85341]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M3 18c0-3 3-5 9-5s9 2 9 5H3z" />
            <path d="M12 6v3M9 7v2M15 7v2" />
          </svg>
        );
      case 'rescuer':
        return (
          <svg className="w-4 h-4 text-[#6A5ACD]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 14.5l-2.4-2.4A1.7 1.7 0 0 1 12 9.7a1.7 1.7 0 0 1 2.4 2.4z" />
          </svg>
        );
      case 'volunteer':
        return (
          <svg className="w-4 h-4 text-[#5E7A68]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case 'adopter':
        return (
          <svg className="w-4 h-4 text-[#B68A35]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <path d="M12 17v0c-1.5-1.5-2.5-2.5-2.5-3.5 0-1.1.9-2 2-2s2 .9 2 2c0 1-1 2-2 3.5z" />
          </svg>
        );
      case 'paravet':
        return (
          <svg className="w-4 h-4 text-[#7B1FA2]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <path d="M12 8v8M8 12h8" />
          </svg>
        );
      case 'lost':
        return (
          <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        );
      case 'event':
        return (
          <svg className="w-4 h-4 text-[#C85341]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
          </svg>
        );
      case 'help':
        return (
          <svg className="w-4 h-4 text-[#C85341]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M11 5L6 9H2v6h4l5 4V5zm8 7c0-2.21-1.29-4.13-3-5.06v10.12c1.71-.93 3-2.85 3-5.06z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderNearbyActivityCard = (post: any) => {
    const isSos = post.category === 'help';
    const parts = (post.description || '').split(/\n\n🕒 Scheduled: |\\n\\n🕒 Scheduled: /);
    const displayDesc = parts[0] || '';
    const displayTime = parts[1] || '';
    const isActivity = post.category !== 'help';

    let categoryBadgeText = post.category ? post.category.charAt(0).toUpperCase() + post.category.slice(1) : 'Activity';
    if (isSos) categoryBadgeText = 'Emergency';

    return (
      <div
        key={post.id}
        onClick={() => {
          if (post.category === 'help') {
            setSelectedRequest(post);
          } else {
            setActiveView('updates');
            setUpdateFilter(post.category);
          }
        }}
        className="w-64 sm:w-72 shrink-0 snap-start bg-[#F5F2EC] hover:bg-[#EFEBE3] border border-[#EBE3D5] hover:border-stone-300 rounded-2xl sm:rounded-[24px] p-3.5 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-start gap-2 group select-none"
      >
        {/* Photo Box */}
        <div className="w-full h-36 rounded-xl md:rounded-2xl overflow-hidden bg-white/70 border border-[#EBE3D5] flex items-center justify-center relative shrink-0">
          {post.image ? (
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#F7F4EE] border border-[#EBE3D5] text-stone-400 p-3 text-center gap-1.5">
              <div className="w-9 h-9 rounded-full bg-[#EFEBE4] flex items-center justify-center text-stone-400">
                <svg className="w-5 h-5 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                  <line x1="3" y1="3" x2="21" y2="21" stroke="#C23B22" strokeWidth="2" />
                </svg>
              </div>
              <span className="text-[11px] font-bold text-stone-500">Photo not found</span>
            </div>
          )}

        </div>

        {/* Info Box (Full width Title & Location subtitle at top) */}
        <div className="pt-1 flex flex-col gap-1 min-w-0">
          <h4 className="font-serif text-base sm:text-lg font-bold text-charcoal leading-snug group-hover:text-[#3D5A45] transition-colors line-clamp-2 w-full">
            {(post.title || '').replace(/&/g, 'and')}
          </h4>

          {/* Time Badge below Title */}
          {(isActivity ? (displayTime || post.time) : post.distance) && (
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-stone-600 font-semibold mt-0.5">
              <svg className="w-3.5 h-3.5 text-[#3D5A45] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="bg-white border border-[#EBE3D5] text-stone-800 text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-3xs">
                {isActivity ? (displayTime || post.time || 'Upcoming') : (post.distance || 'Nearby')}
              </span>
            </div>
          )}
          <div className="flex items-start gap-1 text-[11px] text-stone-600 font-semibold mt-0.5">
            <svg className="w-3 h-3 text-[#3D5A45] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="10" r="3" />
              <path d="M12 21.7C12 21.7 4 14 4 10a8 8 0 0 1 16 0c0 4-8 11.7-8 11.7z" />
            </svg>
            <span className="line-clamp-2 leading-tight">{(post.location || 'Sector 45, Gurugram').replace(/\[.*?\]/g, '').trim()}</span>
          </div>
        </div>
      </div>
    );
  };

  // --- SKELETAL LOADER COMPONENT FOR AUMOHA CIRCLE ---
  const renderSkeletalLoader = () => (
    <div className="w-full flex flex-col gap-6 select-none animate-fadeIn">
      {/* Navigation Tabs Skeleton */}
      <div className="w-full border-b border-[#F5F2EC] flex gap-4 pb-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-8 w-24 bg-stone-200/70 rounded-xl animate-pulse" />
        ))}
      </div>


      {/* Interactive Map Box Skeleton */}
      <div className="w-full aspect-[16/9] min-h-[220px] rounded-3xl bg-[#F5F2EC] border border-[#EBE3D5] p-5 flex flex-col justify-between relative overflow-hidden animate-pulse">
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-stone-300/80" />
            <div className="flex flex-col gap-1.5">
              <div className="h-4 w-32 bg-stone-300/80 rounded" />
              <div className="h-3 w-20 bg-stone-300/60 rounded" />
            </div>
          </div>
          <div className="h-7 w-24 bg-stone-300/70 rounded-xl" />
        </div>
      </div>

      {/* Section Title Skeleton */}
      <div className="flex justify-between items-center pt-2">
        <div className="h-4 w-40 bg-stone-200/80 rounded animate-pulse" />
        <div className="h-3 w-20 bg-stone-200/70 rounded animate-pulse" />
      </div>

      {/* Cards List Skeleton */}
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white border border-[#F0EBE1] rounded-[20px] p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full">
              <div className="w-11 h-11 rounded-2xl bg-stone-200/80 animate-pulse shrink-0" />
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-4 w-3/4 bg-stone-200/80 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-stone-200/70 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-6 w-16 bg-stone-200/70 rounded-lg animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );

  if (isDataLoading) {
    return renderSkeletalLoader();
  }

  // --- RENDER MAIN TAB VIEWS ---
  return (
    <div className="w-full flex flex-col gap-6 select-none animate-fadeIn">

      {/* TABS SELECTOR (Matches Header Style) */}
      <div className="w-full flex select-none text-xs sm:text-sm font-extrabold text-stone-500">
        {[
          {
            id: 'home',
            label: 'Home',
            icon: (
              <svg className="w-3.5 h-3.5 text-current" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            )
          },
          {
            id: 'members',
            label: 'Network',
            icon: (
              <svg className="w-3.5 h-3.5 text-current" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            )
          },
          {
            id: 'updates',
            label: 'Updates',
            icon: (
              <svg className="w-3.5 h-3.5 text-current" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <line x1="7" y1="8" x2="17" y2="8" />
                <line x1="7" y1="12" x2="17" y2="12" />
                <line x1="7" y1="16" x2="13" y2="16" />
              </svg>
            )
          },
          {
            id: 'impact',
            label: 'Impact',
            icon: (
              <svg className="w-3.5 h-3.5 text-current" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            )
          }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveView(t.id as any)}
            className={`flex-1 pb-2 text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeView === t.id
                ? 'text-[#2D4536] border-b-2 border-[#2D4536] font-extrabold text-xs sm:text-sm'
                : 'text-stone-700 hover:text-stone-900 border-b-2 border-transparent font-bold text-xs sm:text-sm opacity-85 hover:opacity-100'
              }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* TOP HEADER TITLE BLOCK (Screen 1 Custom) */}
      {activeView === 'home' && (
        <div className="w-full flex items-center justify-between select-none">
          {/* Location Selector (Styled exactly like mockup) */}
          <div className="flex items-center gap-2 select-none">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 text-[#2D4536]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="10" r="3" />
                <path d="M12 21.7C12 21.7 4 14 4 10a8 8 0 0 1 16 0c0 4-8 11.7-8 11.7z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-[17px] font-bold text-[#2D4536] tracking-tight">
                  {selectedLocation.includes(',') ? selectedLocation.split(',')[0] : selectedLocation}
                </span>
                <svg className="w-3.5 h-3.5 text-[#2D4536] stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              <span className="text-xs text-stone-500 font-semibold mt-1 leading-none">
                {selectedLocation.includes(',') ? selectedLocation.substring(selectedLocation.indexOf(',') + 1).trim() : 'Sector 45, Gurugram'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 1. HOME VIEW (Screen 1) ==================== */}
      {activeView === 'home' && (
        <div className="w-full flex flex-col gap-5 animate-scaleIn">

          {/* RADIUS SELECTOR BAR */}
          <div className="w-full bg-[#F5F2EC] border border-[#EBE3D5] rounded-2xl p-3 shadow-2xs">
            <RadiusSelector
              selectedRadius={selectedRadius}
              onSelectRadius={handleRadiusChange}
            />
          </div>

          {/* RADIUS MAP CARD (Clean borderless map) */}
          <div id="home-map" className="h-64 sm:h-72 w-full rounded-2xl sm:rounded-[24px] bg-[#EFEBE4] overflow-hidden shadow-xs z-10 [&_.leaflet-tile-pane]:sepia-[0.18] [&_.leaflet-tile-pane]:brightness-[0.98] [&_.leaflet-tile-pane]:contrast-[0.97]" />

          {/* NEARBY ACTIVITY FEED LIST (Horizontally Scrollable) */}
          <div className="flex flex-col gap-3 select-none">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-base font-bold text-charcoal">Nearby Activity</h3>
                <span className="text-[11px] font-extrabold text-[#D95D39] bg-[#FDF6ED] border border-[#E89552]/40 px-2 py-0.5 rounded-md">
                  {selectedRadius === 0 ? 'All' : `Within ${selectedRadius} km`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveView('updates')}
                  className="text-xs font-bold text-[#B68A35] flex items-center gap-0.5 hover:underline cursor-pointer"
                >
                  View all <span>›</span>
                </button>
              </div>
            </div>

            {/* Horizontal Scroll Cards Row or Radius Empty State */}
            {(() => {
              const filteredNearby = computedUpdates
                .filter(u => u.category !== 'help' || u.status === 'active')
                .filter(u => selectedRadius === 0 || (u.distanceVal === undefined || u.distanceVal <= selectedRadius * 1000));

              if (filteredNearby.length === 0) {
                return (
                  <div className="w-full bg-[#F5F2EC] border border-[#EBE3D5] rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-2 shadow-xs">
                    <div className="w-10 h-10 rounded-full bg-[#E5E0D4] flex items-center justify-center text-[#2D4536] shrink-0 mb-0.5">
                      <MapPinOff className="w-5 h-5 stroke-[2]" />
                    </div>
                    <h4 className="font-serif text-sm sm:text-base font-bold text-charcoal">No cases found within {selectedRadius} km</h4>
                    <p className="text-xs text-stone-500 max-w-xs font-medium">No active cases or activities nearby right now.</p>
                    <button
                      onClick={() => handleRadiusChange(selectedRadius === 1 ? 5 : selectedRadius === 5 ? 10 : 25)}
                      className="mt-1 px-4 py-1.5 bg-[#2D4536] text-white rounded-full text-xs font-bold hover:bg-[#1E2E24] transition-all cursor-pointer shadow-xs"
                    >
                      Expand Radius
                    </button>
                  </div>
                );
              }

              return (
                <div
                  id="nearby-activity-scroll-container"
                  className="flex gap-3.5 overflow-x-auto pb-2 pt-1 scrollbar-hide snap-x snap-mandatory select-none"
                >
                  {filteredNearby.slice(0, 5).map(renderNearbyActivityCard)}
                </div>
              );
            })()}
          </div>

          {/* QUICK ACTIONS GRID (2x2 Grid Structure for both Mobile & Desktop) */}
          <div className="flex flex-col gap-3">
            <h3 className="font-serif text-base font-bold text-charcoal px-1">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 select-none">
              {/* Card 1: Report Issue */}
              <button
                onClick={() => setActiveTab?.('report')}
                className="bg-[#F5F2EC] hover:bg-[#EFEBE3] border border-[#EBE3D5] hover:border-stone-300 transition-all rounded-2xl sm:rounded-[24px] p-3.5 sm:p-5 flex items-center gap-3 sm:gap-4 text-left shadow-xs group active:scale-98 cursor-pointer"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 text-[#2D4536]">
                  <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-[#2D4536] stroke-[1.8]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-serif text-xs sm:text-lg font-bold text-charcoal leading-snug group-hover:text-[#2D4536] transition-colors truncate">
                    Report Issue
                  </span>
                  <span className="text-[10px] sm:text-xs text-stone-500 font-semibold mt-0.5 leading-tight line-clamp-2">
                    Cruelty, injury or emergency
                  </span>
                </div>
              </button>

              {/* Card 2: Ask Neighbor Support */}
              <button
                onClick={() => {
                  setActiveView('members');
                }}
                className="bg-[#F5F2EC] hover:bg-[#EFEBE3] border border-[#EBE3D5] hover:border-stone-300 transition-all rounded-2xl sm:rounded-[24px] p-3.5 sm:p-5 flex items-center gap-3 sm:gap-4 text-left shadow-xs group active:scale-98 cursor-pointer"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 text-[#2D4536]">
                  <Users className="w-6 h-6 sm:w-7 sm:h-7 text-[#2D4536] stroke-[1.8]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-serif text-xs sm:text-lg font-bold text-charcoal leading-snug group-hover:text-[#2D4536] transition-colors truncate">
                    Ask Neighbor Support
                  </span>
                  <span className="text-[10px] sm:text-xs text-stone-500 font-semibold mt-0.5 leading-tight line-clamp-2">
                    Get help nearby
                  </span>
                </div>
              </button>

              {/* Card 3: Start Activity */}
              <button
                onClick={() => {
                  setActiveView('updates');
                  setStartActivityOnUpdates(true);
                }}
                className="bg-[#F5F2EC] hover:bg-[#EFEBE3] border border-[#EBE3D5] hover:border-stone-300 transition-all rounded-2xl sm:rounded-[24px] p-3.5 sm:p-5 flex items-center gap-3 sm:gap-4 text-left shadow-xs group active:scale-98 cursor-pointer"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 text-[#2D4536]">
                  <PlusCircle className="w-6 h-6 sm:w-7 sm:h-7 text-[#2D4536] stroke-[1.8]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-serif text-xs sm:text-lg font-bold text-charcoal leading-snug group-hover:text-[#2D4536] transition-colors truncate">
                    Start Activity
                  </span>
                  <span className="text-[10px] sm:text-xs text-stone-500 font-semibold mt-0.5 leading-tight line-clamp-2">
                    Feeding, rescue or awareness
                  </span>
                </div>
              </button>

              {/* Card 4: Join Event */}
              <button
                onClick={() => {
                  setActiveView('updates');
                  setUpdateFilter('event');
                }}
                className="bg-[#F5F2EC] hover:bg-[#EFEBE3] border border-[#EBE3D5] hover:border-stone-300 transition-all rounded-2xl sm:rounded-[24px] p-3.5 sm:p-5 flex items-center gap-3 sm:gap-4 text-left shadow-xs group active:scale-98 cursor-pointer"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 text-[#2D4536]">
                  <CalendarDays className="w-6 h-6 sm:w-7 sm:h-7 text-[#2D4536] stroke-[1.8]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-serif text-xs sm:text-lg font-bold text-charcoal leading-snug group-hover:text-[#2D4536] transition-colors truncate">
                    Join Event
                  </span>
                  <span className="text-[10px] sm:text-xs text-stone-500 font-semibold mt-0.5 leading-tight line-clamp-2">
                    Community events
                  </span>
                </div>
              </button>
            </div>
          </div>

        </div>
      )}


      {/* ==================== 2. MEMBERS & NETWORK VIEW (Screen 2) ==================== */}
      {activeView === 'members' && (
        <MohallaNetwork 
          computedMembers={computedMembers} 
          dbSosReports={dbSosReports} 
          resolvedSosCount={resolvedSosCount}
          memberFilter={memberFilter}
          setMemberFilter={setMemberFilter}
          selectedRadius={selectedRadius}
          onSelectRadius={handleRadiusChange}
        />
      )}


      {/* ==================== 3. MOHALLA IMPACT VIEW (Screen 3) ==================== */}
      {activeView === 'impact' && (
        <MohallaImpact
          computedMembers={computedMembers}
          dbSosReports={dbSosReports}
          selectedLocation={selectedLocation}
          getCoordinatesForLocation={getCoordinatesForLocation}
          selectedRadius={selectedRadius}
          onSelectRadius={handleRadiusChange}
        />
      )}


      {/* ==================== 4. COMMUNITY UPDATES VIEW (Screen 4) ==================== */}
      {activeView === 'updates' && (
        <MohallaUpdates
          computedUpdates={computedUpdates}
          setSelectedRequest={handleSelectRequestOrBlog}
          updateFilter={updateFilter}
          setUpdateFilter={setUpdateFilter}
          currentUser={user}
          refreshUpdates={refreshUpdates}
          triggerStartActivity={startActivityOnUpdates}
          onStartActivityTriggered={() => setStartActivityOnUpdates(false)}
          selectedRadius={selectedRadius}
          onSelectRadius={handleRadiusChange}
        />
      )}

      {/* Popup Alert Modal */}
      <PopupModal config={popupConfig} onClose={() => setPopupConfig(null)} />
    </div>
  );
}
