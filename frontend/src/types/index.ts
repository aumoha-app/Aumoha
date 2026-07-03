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
  createdAt?: string;
  updatedAt?: string;
}

