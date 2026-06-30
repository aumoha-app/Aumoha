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
