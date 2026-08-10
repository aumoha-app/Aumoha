export interface BackendInfo {
  appName: string;
  version: string;
  features: string[];
}

export interface CommunityPost {
  id: number;
  author: string;
  avatar: string;
  time: string;
  content: string;
  likes: number;
}

export interface Pet {
  _id?: string;
  name: string;
  photo?: string;
  type: string;
  breed?: string;
  age?: number;
  gender?: 'male' | 'female' | 'unknown';
  notes?: string;
}

export interface UserProfile {
  firebaseUid?: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  profilePic?: string;
  role?: 'normal' | 'admin' | 'rescuer' | 'doctor' | 'expert' | 'feeder' | 'volunteer' | 'paravet' | 'ngo' | string;
  rescueCount?: number;
  pets?: Pet[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  _id?: string;
  id?: number; // For compatibility
  category: 'food' | 'toys' | 'medical';
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  discountBadge: string | null;
  imageUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SosReport {
  _id?: string;
  userEmail: string;
  userPhone?: string;
  category: string;
  severity: 'critical' | 'urgent' | 'stable';
  location: string;
  reason: string;
  status: 'active' | 'dispatched' | 'resolved';
  photo?: string;
  audio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type MemberRole = 'all' | 'feeder' | 'rescuer' | 'volunteer' | 'paravet' | 'adopter' | 'normal' | 'official' | 'ngo';

export interface CircleMember {
  id: string;
  name: string;
  avatar: string;
  role: MemberRole;
  distance: string;
  distanceVal?: number;
  badge?: 'trusted' | 'level4' | 'level3' | 'available' | 'level5';
  joinedTime?: string;
  location?: string;
  lat?: number;
  lng?: number;
}

export interface ImpactMetrics {
  animalsHelped: number;
  rescues: number;
  animalsFed: number;
  adoptions: number;
  donations: number;
}

export interface CommunityUpdate {
  id: string;
  author: string;
  authorRole: MemberRole;
  avatar: string;
  time: string;
  category: 'help' | 'feeding' | 'event' | 'awareness' | 'lost' | 'all';
  title: string;
  description: string;
  image?: string;
  location?: string;
  distance?: string;
  distanceVal?: number;
  likes?: number;
  lat?: number;
  lng?: number;
  status?: 'active' | 'dispatched' | 'resolved';
  joinees?: Array<{
    userEmail: string;
    userName: string;
    avatar?: string;
    userPhone?: string;
  }>;
}

export interface CircleLeader {
  id: string;
  name: string;
  avatar: string;
  role: string;
  location: string;
  badge?: 'level5' | 'level4' | 'level3';
}

export interface Partner {
  id: string;
  name: string;
  logo: string;
  distance: string;
  type: string;
}


