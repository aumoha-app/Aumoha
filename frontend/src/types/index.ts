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

export interface UserProfile {
  firebaseUid?: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  profilePic?: string;
  role?: 'rescuer' | 'normal';
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


