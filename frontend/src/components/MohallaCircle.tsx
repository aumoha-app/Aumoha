'use client';

import { useState, useEffect, useRef } from 'react';
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
    case 'feeder':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-[#E65100]`}>
          <path d="M12 2v4M12 18h.01M3 20h18M5 10a7 7 0 0 0 14 0H5z" />
        </svg>
      );
    case 'rescuer':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-[#2E7D32]`}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case 'volunteer':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-[#0D47A1]`}>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      );
    case 'paravet':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-[#7B1FA2]`}>
          <path d="M4.82 17.22a3 3 0 1 1-3-3m0 0v-4a7 7 0 0 1 14 0v4m0-4V6a2 2 0 0 1 2-2h2m-6 13.22a3 3 0 1 1 3-3" />
        </svg>
      );
    case 'adopter':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-[#004D40]`}>
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
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-[#C85341]`}>
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
    case 'ngo':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={`${size} text-[#2E7D32]`}>
          <path d="M12 14c-1.66 0-3 1.34-3 3 0 2 2 3.5 3 4.5 1-1 3-2.5 3-4.5 0-1.66-1.34-3-3-3zm-4.5-2.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm9 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm-11-4C4.67 7.5 4 8.17 4 9s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5S6.33 7.5 5.5 7.5zm13 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM12 2c-.83 0-1.5.67-1.5 1.5S11.17 5 12 5s1.5-.67 1.5-1.5S12.83 2 12 2z" fill="currentColor" />
        </svg>
      );
    case 'shelter':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-[#004D40]`}>
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`${size} text-[#0D47A1]`}>
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
  const [activeView, setActiveView] = useState<'home' | 'members' | 'impact' | 'updates'>(view || 'home');

  useEffect(() => {
    if (view) {
      setActiveView(view);
    }
  }, [view]);
  const [memberFilter, setMemberFilter] = useState<MemberRole>('all');
  const [updateFilter, setUpdateFilter] = useState<string>('all');
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

  const toggleJoinEvent = (eventId: string, eventTitle: string) => {
    setJoinedEvents(prev => {
      const isJoined = prev.includes(eventId);
      const updated = isJoined ? prev.filter(id => id !== eventId) : [...prev, eventId];
      localStorage.setItem('joinedEvents', JSON.stringify(updated));
      alert(isJoined ? `Unregistered from ${eventTitle}` : `Successfully registered for ${eventTitle}!`);
      return updated;
    });
  };

  const toggleJoinActivity = async (activityId: string, title: string) => {
    if (!token) return;
    const isCurrentlyJoined = joinedActivities.includes(activityId);
    const action = isCurrentlyJoined ? 'leave' : 'join';
    try {
      const res = await fetch(`http://localhost:5001/api/activities/${activityId}/${action}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setJoinedActivities(prev => {
          const updated = isCurrentlyJoined ? prev.filter(id => id !== activityId) : [...prev, activityId];
          localStorage.setItem('joinedActivities', JSON.stringify(updated));
          return updated;
        });

        if (selectedBlog && selectedBlog.id === activityId) {
          setSelectedBlog(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              joinees: data.activity?.joinees || []
            };
          });
        }

        refreshUpdates();
        alert(isCurrentlyJoined ? `Left activity: ${title}` : `Joined activity: ${title}!`);
      } else {
        const errData = await res.json();
        alert(`Failed to update activity status: ${errData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed to toggle join activity:', err);
      alert('Error updating activity status. Please try again.');
    }
  }; const [deviceCoords, setDeviceCoords] = useState<[number, number] | null>(null);
  const [deviceAddress, setDeviceAddress] = useState<string>('');

  useEffect(() => {
    if (!navigator.geolocation) return;
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
              const cityStr = data.address.city || data.address.town || data.address.state_district || 'Gurugram';
              const fullAddr = `${shortAddr}, ${cityStr}`;
              setDeviceAddress(fullAddr);
              setSelectedLocation(fullAddr);
            }
          }
        } catch (err) {
          console.warn('Failed to reverse geocode device location:', err);
        }
      },
      (error) => {
        console.warn('Browser geolocation access failed:', error);
      }
    );
  }, []);

  const getCoordinatesForLocation = (location: string): [number, number] => {
    const clean = (location || '').toLowerCase();
    if (deviceAddress && clean.includes(deviceAddress.split(',')[0].toLowerCase())) {
      if (deviceCoords) return deviceCoords;
    }
    return getCoordinatesForLocationShared(location, deviceCoords || undefined);
  };

  useEffect(() => {
    if (userAddress && !deviceAddress) {
      setSelectedLocation(userAddress);
    }
  }, [userAddress, deviceAddress]);

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



  const { token, user } = useAuth();
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [dbSosReports, setDbSosReports] = useState<any[]>([]);
  const [resolvedSosCount, setResolvedSosCount] = useState<number>(0);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);

  const refreshUpdates = async () => {
    if (!token) return;
    try {
      const actRes = await fetch('http://localhost:5001/api/activities', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (actRes.ok) {
        const actData = await actRes.json();
        setDbActivities(actData.activities || []);
      }

      const sosRes = await fetch('http://localhost:5001/api/sos/active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (sosRes.ok) {
        const sosData = await sosRes.json();
        setDbSosReports(sosData.reports || []);
      }

      const resolvedRes = await fetch('http://localhost:5001/api/sos/resolved', {
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
        const userRes = await fetch('http://localhost:5001/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          setDbUsers(userData.users || []);
        }

        const sosRes = await fetch('http://localhost:5001/api/sos/active', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (sosRes.ok) {
          const sosData = await sosRes.json();
          setDbSosReports(sosData.reports || []);
        }

        const resolvedRes = await fetch('http://localhost:5001/api/sos/resolved', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resolvedRes.ok) {
          const resolvedData = await resolvedRes.json();
          setResolvedSosCount(resolvedData.reports?.length || 0);
        }

        const actRes = await fetch('http://localhost:5001/api/activities', {
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

  const dbMappedUsers = dbUsers.map(u => ({
    id: u._id,
    name: u.fullName,
    avatar: u.profilePic || '',
    role: (u.role || 'normal') as MemberRole,
    location: u.address || 'Saheed Nagar',
    badge: u.role === 'rescuer' ? ('trusted' as const) : undefined,
    joinedTime: u.createdAt
      ? Math.max(1, Math.round((Date.now() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24))).toString()
      : '1'
  }));

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
  });

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



  // Role style mappings (color palette: elegant, HSL tailored matching screenshots)
  const getRoleColors = (role: MemberRole) => {
    switch (role) {
      case 'feeder':
        return { bg: 'bg-[#FFF3E0]', text: 'text-[#E65100]', border: 'border-[#FFE0B2]', label: 'Feeder', icon: '🥣' };
      case 'rescuer':
        return { bg: 'bg-[#E8F5E9]', text: 'text-[#2E7D32]', border: 'border-[#C8E6C9]', label: 'Rescuer', icon: '🛡️' };
      case 'volunteer':
        return { bg: 'bg-[#E3F2FD]', text: 'text-[#0D47A1]', border: 'border-[#BBDEFB]', label: 'Volunteer', icon: '❤️' };
      case 'paravet':
        return { bg: 'bg-[#F3E5F5]', text: 'text-[#7B1FA2]', border: 'border-[#E1BEE7]', label: 'Paravet', icon: '🩺' };
      case 'adopter':
        return { bg: 'bg-[#E0F2F1]', text: 'text-[#004D40]', border: 'border-[#B2DFDB]', label: 'Foster Home', icon: '🏠' };
      default:
        return { bg: 'bg-[#ECEFF1]', text: 'text-[#37474F]', border: 'border-[#CFD8DC]', label: 'Member', icon: '👤' };
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
        return `<svg viewBox="0 0 24 24" fill="none" stroke="#E65100" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M12 2v4M12 18h.01M3 20h18M5 10a7 7 0 0 0 14 0H5z" /></svg>`;
      case 'rescuer':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="#2E7D32" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>`;
      case 'volunteer':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="#0D47A1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>`;
      case 'paravet':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="#7B1FA2" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M4.82 17.22a3 3 0 1 1-3-3m0 0v-4a7 7 0 0 1 14 0v4m0-4V6a2 2 0 0 1 2-2h2m-6 13.22a3 3 0 1 1 3-3" /></svg>`;
      case 'adopter':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="#004D40" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>`;
      case 'help_needed':
      case 'incident':
        return `<svg viewBox="0 0 24 24" fill="none" stroke="#C85341" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-5.5 h-5.5 animate-pulse"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>`;
      default:
        return `<svg viewBox="0 0 24 24" fill="none" stroke="#37474F" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>`;
    }
  };

  // CDN Leaflet loading logic (checks if loaded, loads on demand, cleans up)
  const loadLeafletMap = (L: any, mapId: string, center: [number, number], pins: any[], setInstanceRef: any) => {
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

    const map = L.map(mapId, { zoomControl: false }).setView(center, 14);
    setInstanceRef.current = map;

    // CartoDB Positron clean light cream style map layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);

    // User node center dot (White circle with dark green center dot)
    const greenDotIcon = L.divIcon({
      className: 'custom-center-icon',
      html: `<div class="w-6 h-6 bg-white rounded-full border-2 border-[#3D5A45] shadow-md flex items-center justify-center">
               <div class="w-3 h-3 bg-[#3D5A45] rounded-full"></div>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    L.marker(center, { icon: greenDotIcon }).addTo(map);

    // Draw search radius ring (e.g. 1.2 km soft green outline/fill)
    L.circle(center, {
      color: '#81C784',
      fillColor: '#C8E6C9',
      fillOpacity: 0.2,
      radius: 1200,
      weight: 1.5
    }).addTo(map);

    const getPinColor = (role: string) => {
      switch (role) {
        case 'feeder': return '#D32F2F';
        case 'rescuer': return '#E65100';
        case 'volunteer': return '#E91E63';
        case 'paravet': return '#7B1FA2';
        case 'adopter': return '#2E7D32';
        case 'help_needed': return '#C85341';
        default: return '#546E7A';
      }
    };

    const getPinIcon = (role: string) => {
      switch (role) {
        case 'feeder':
          return `<svg class="w-3.5 h-3.5 text-[#D32F2F]" fill="currentColor" viewBox="0 0 24 24"><path d="M2 20h20v2H2v-2zm2-2h16c0-4.42-3.58-8-8-8s-8 3.58-8 8zm8-10c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>`;
        case 'adopter':
          return `<svg class="w-3.5 h-3.5 text-[#2E7D32]" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>`;
        case 'paravet':
          return `<svg class="w-3.5 h-3.5 text-[#7B1FA2]" fill="currentColor" viewBox="0 0 24 24"><path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z"/></svg>`;
        case 'volunteer':
          return `<svg class="w-3.5 h-3.5 text-[#E91E63]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
        case 'rescuer':
          return `<svg class="w-3.5 h-3.5 text-[#E65100]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
        case 'help_needed':
          return `<svg class="w-3.5 h-3.5 text-[#C85341]" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>`;
        default:
          return `<svg class="w-3.5 h-3.5 text-[#546E7A]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
      }
    };

    // Add pins
    const centerKey = `${center[0].toFixed(6)},${center[1].toFixed(6)}`;
    const coordinatesRegistry: { [key: string]: number } = {
      [centerKey]: 0
    };

    pins.forEach(pin => {
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
          // Load Home Map (Screen 1)
          const activeReportsPins = computedUpdates
            .filter(u => u.category === 'help' && u.status === 'active')
            .map(u => ({
              id: u.id,
              name: ((u as any).animalCategory || u.title || 'Emergency').replace(/^\w/, (c: string) => c.toUpperCase()),
              avatar: '🚨',
              role: 'help_needed',
              lat: u.lat || centerCoords[0],
              lng: u.lng || centerCoords[1],
              distance: u.distance
            }));

          const homePins = [...activeReportsPins];
          loadLeafletMap(L, 'home-map', centerCoords, homePins, homeMapRef);
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
  }, [activeView, selectedRequest, computedMembers, computedUpdates, selectedLocation]);



  const renderEventGraphic = (id: string) => {
    switch (id) {
      case 'e1': // Vaccination Camp
        return (
          <div className="w-full h-full bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB] flex items-center justify-center relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-[#0D47A1]">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <span className="absolute bottom-2 right-2 bg-white/90 text-[#0D47A1] text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-[#BBDEFB]">🏥 VACCINE</span>
          </div>
        );
      case 'e2': // Clean Streets, Safe Paws
        return (
          <div className="w-full h-full bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] flex items-center justify-center relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-[#2E7D32]">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="absolute bottom-2 right-2 bg-white/90 text-[#2E7D32] text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-[#C8E6C9]">🌱 CLEANUP</span>
          </div>
        );
      case 'e3': // Adoption Meet
        return (
          <div className="w-full h-full bg-gradient-to-br from-[#FFF3E0] to-[#FFE0B2] flex items-center justify-center relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-[#E65100]">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="absolute bottom-2 right-2 bg-white/90 text-[#E65100] text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-[#FFE0B2]">🏠 ADOPTION</span>
          </div>
        );
      default:
        return (
          <div className="w-full h-full bg-gradient-to-br from-[#ECEFF1] to-[#CFD8DC] flex items-center justify-center">
            <span className="text-2xl">📅</span>
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

  const renderSimpleActivityCard = (post: any) => {
    const isSos = post.category === 'help';
    const isRescuer = post.authorRole === 'rescuer';
    const isAdopter = post.authorRole === 'adopter';
    const isParavet = post.authorRole === 'paravet';

    const parts = (post.description || '').split(/\n\n🕒 Scheduled: |\\n\\n🕒 Scheduled: /);
    const displayDesc = parts[0] || '';
    const displayTime = parts[1] || '';
    const isActivity = post.category !== 'help';

    let avatarIcon = null;

    if (post.avatar && post.avatar.startsWith('http')) {
      avatarIcon = <img src={post.avatar} alt={post.author} className="w-full h-full object-cover" />;
    } else if (isSos) {
      avatarIcon = (
        <div className="w-full h-full bg-[#FCECE9] flex items-center justify-center text-[#C85341] shrink-0">
          <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M11 5L6 9H2v6h4l5 4V5zm8 7c0-2.21-1.29-4.13-3-5.06v10.12c1.71-.93 3-2.85 3-5.06z" />
          </svg>
        </div>
      );
    } else if (isRescuer) {
      avatarIcon = (
        <div className="w-full h-full bg-[#E8F5E9] flex items-center justify-center text-xl overflow-hidden relative">
          🧑
        </div>
      );
    } else if (isAdopter) {
      avatarIcon = (
        <div className="w-full h-full bg-[#FFF8E1] flex items-center justify-center text-[#B68A35] shrink-0">
          <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <path d="M12 17v0c-1.5-1.5-2.5-2.5-2.5-3.5 0-1.1.9-2 2-2s2 .9 2 2c0 1-1 2-2 3.5z" />
          </svg>
        </div>
      );
    } else if (isParavet) {
      avatarIcon = (
        <div className="w-full h-full bg-[#F3E5F5] flex items-center justify-center text-[#7B1FA2] shrink-0">
          <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <path d="M12 8v8M8 12h8" />
          </svg>
        </div>
      );
    } else {
      avatarIcon = (
        <div className="w-full h-full bg-[#F5F2EC] flex items-center justify-center text-xl overflow-hidden relative">
          👥
        </div>
      );
    }

    let infoColor = 'text-stone-500';
    if (post.category === 'help') infoColor = 'text-[#C85341]';
    else if (post.category === 'feeding') infoColor = 'text-[#E65100]';
    else if (post.category === 'event') infoColor = 'text-[#7B1FA2]';
    else if (post.category === 'awareness') infoColor = 'text-[#3D5A45]';

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
        className="bg-white border border-[#F0EBE1] hover:border-stone-300 rounded-[20px] p-3 flex items-center justify-between gap-3 hover:shadow-xs transition-all duration-300 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-[#F0EBE1] flex items-center justify-center bg-stone-50 relative shadow-inner">
            {avatarIcon}
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-bold text-charcoal tracking-tight leading-snug line-clamp-1">
              {post.title}
            </span>
            <span className="text-[11px] text-stone-400 font-semibold mt-0.5 leading-none line-clamp-1">
              {isSos ? post.description : displayDesc}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex flex-col items-end text-right">
            <span className={`text-[11px] font-bold ${infoColor} leading-none`}>
              {isActivity ? (displayTime || post.time) : post.distance}
            </span>
            <span className="text-[10px] text-stone-400 font-semibold mt-1 leading-none">
              {isActivity ? (post.category.charAt(0).toUpperCase() + post.category.slice(1)) : post.time}
            </span>
          </div>
          <svg className="w-4 h-4 text-stone-400 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    );
  };

  // --- RENDER MAIN TAB VIEWS ---
  return (
    <div className="w-full flex flex-col gap-6 select-none animate-fadeIn">

      {/* TABS SELECTOR (Matches Header Style) */}
      <div className="w-full border-b border-[#F5F2EC] flex select-none text-xs font-bold text-stone-400">
        {[
          {
            id: 'home',
            label: 'Home',
            icon: (
              <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            )
          },
          {
            id: 'members',
            label: 'Network',
            icon: (
              <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
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
              <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
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
              <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            )
          }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveView(t.id as any)}
            className={`flex-1 pb-3 text-center transition-all flex items-center justify-center gap-1.5 ${activeView === t.id
                ? 'text-[#3D5A45] border-b-2 border-[#3D5A45]'
                : 'hover:text-charcoal border-b border-transparent'
              }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* TOP HEADER TITLE BLOCK (Screen 1 Custom) */}
      {activeView === 'home' && (
        <div className="w-full flex items-center justify-between border-b border-[#F0EBE1] pb-5 select-none">
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
        <div className="w-full flex flex-col gap-6 animate-scaleIn">

          {/* RADIUS MAP CARD */}
          <div className="bg-white border border-[#F0EBE1] rounded-[28px] p-4.5 shadow-sm flex flex-col gap-3">
            {/* Map Element */}
            <div id="home-map" className="h-64 w-full rounded-2xl bg-stone-50 border border-[#F0EBE1] overflow-hidden z-10" />
          </div>


          {/* NEARBY ACTIVITY FEED LIST */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-charcoal">Nearby Activity</h3>
              <button
                onClick={() => setActiveView('updates')}
                className="text-xs font-bold text-[#B68A35] flex items-center gap-0.5 hover:underline"
              >
                View all <span>›</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {computedUpdates
                .filter(u => u.category !== 'help' || u.status === 'active')
                .slice(0, 5)
                .map(renderSimpleActivityCard)}
            </div>
          </div>

          {/* QUICK ACTIONS GRID */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-charcoal px-1">Quick Actions</h3>
            <div className="grid grid-cols-4 gap-3 select-none">
              <button
                onClick={() => setActiveTab?.('report')}
                className="bg-[#FFF5F5] border border-[#FFE8E8] hover:scale-[1.02] transition-all rounded-[24px] p-3.5 flex flex-col items-center justify-between text-center min-h-[135px] shadow-xs group active:scale-98"
              >
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  <svg className="w-8 h-8 text-[#C85341]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div className="flex flex-col gap-1 mt-auto">
                  <span className="text-[11px] font-bold text-charcoal leading-tight">Report Issue</span>
                  <span className="text-[8px] text-stone-400 font-semibold leading-tight">Cruelty or emergency</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveView('members');
                }}
                className="bg-[#FFFBF2] border border-[#FDF0D5] hover:scale-[1.02] transition-all rounded-[24px] p-3.5 flex flex-col items-center justify-between text-center min-h-[135px] shadow-xs group active:scale-98"
              >
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  <svg className="w-8 h-8 text-[#B68A35]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="flex flex-col gap-1 mt-auto">
                  <span className="text-[11px] font-bold text-charcoal leading-tight">Ask Neighbor Support</span>
                  <span className="text-[8px] text-stone-400 font-semibold leading-tight">Get help nearby</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveView('updates');
                  setStartActivityOnUpdates(true);
                }}
                className="bg-[#F4F9F5] border border-[#E5F2E8] hover:scale-[1.02] transition-all rounded-[24px] p-3.5 flex flex-col items-center justify-between text-center min-h-[135px] shadow-xs group active:scale-98"
              >
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  <svg className="w-8 h-8 text-[#3D5A45]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                <div className="flex flex-col gap-1 mt-auto">
                  <span className="text-[11px] font-bold text-charcoal leading-tight">Start Activity</span>
                  <span className="text-[8px] text-stone-400 font-semibold leading-tight">Feeding, rescue or awareness</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveView('updates');
                  setUpdateFilter('event');
                }}
                className="bg-[#FAF7FD] border border-[#F1EBFA] hover:scale-[1.02] transition-all rounded-[24px] p-3.5 flex flex-col items-center justify-between text-center min-h-[135px] shadow-xs group active:scale-98"
              >
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  <svg className="w-8 h-8 text-[#7B1FA2]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
                  </svg>
                </div>
                <div className="flex flex-col gap-1 mt-auto">
                  <span className="text-[11px] font-bold text-charcoal leading-tight">Join Event</span>
                  <span className="text-[8px] text-stone-400 font-semibold leading-tight">Community events</span>
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
        />
      )}


      {/* ==================== 3. MOHALLA IMPACT VIEW (Screen 3) ==================== */}
      {activeView === 'impact' && (
        <MohallaImpact
          computedMembers={computedMembers}
          dbSosReports={dbSosReports}
          selectedLocation={selectedLocation}
          getCoordinatesForLocation={getCoordinatesForLocation}
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
        />
      )}

    </div>
  );
}
