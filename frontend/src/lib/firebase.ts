import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword as fbSignIn,
  createUserWithEmailAndPassword as fbCreateUser,
  signOut as fbSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser,
  Auth as FirebaseAuth
} from 'firebase/auth';

// Firebase Client Configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDufBr2osnn0ESj0WLC37nvebIa_jfWFWM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "aumoha-2a158.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "aumoha-2a158",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "aumoha-2a158.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1011938669291",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1011938669291:web:7aa3c464b9f0a0016b84ae"
};

const hasFirebaseClientConfig = true; // Use real Firebase config by default now

let app;
let realAuth: FirebaseAuth | null = null;

if (hasFirebaseClientConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    realAuth = getAuth(app);
    console.log('🔥 Firebase client SDK initialized successfully');
  } catch (error) {
    console.error('❌ Firebase client SDK initialization failed:', error);
  }
} else {
  console.log('⚠️ Firebase client environment variables missing. Running in client mock mode.');
}

// Interface for Auth User (Works for both Firebase User and Mock User)
export interface AuthUser {
  uid: string;
  email: string | null;
  getIdToken: () => Promise<string>;
}

// Client Side Mock Auth System
class MockAuthSystem {
  private currentUser: AuthUser | null = null;
  private listeners: Array<(user: AuthUser | null) => void> = [];

  constructor() {
    // Load existing mock session from sessionStorage if available
    if (typeof window !== 'undefined') {
      const savedUser = sessionStorage.getItem('aumoha_mock_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          this.currentUser = this.createMockUserObj(parsed.uid, parsed.email);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  private createMockUserObj(uid: string, email: string): AuthUser {
    return {
      uid,
      email,
      getIdToken: async () => `mock-token-${uid.replace('mock-uid-', '')}:${email}`
    };
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void) {
    this.listeners.push(callback);
    // Execute immediately with current value
    setTimeout(() => callback(this.currentUser), 0);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.currentUser));
  }

  async signIn(email: string): Promise<AuthUser> {
    const emailPrefix = email.split('@')[0] || 'default';
    const mockUid = `mock-uid-${emailPrefix}`;
    this.currentUser = this.createMockUserObj(mockUid, email);
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('aumoha_mock_user', JSON.stringify({ uid: mockUid, email }));
    }
    
    this.notify();
    return this.currentUser;
  }

  async signUp(email: string): Promise<AuthUser> {
    return this.signIn(email);
  }

  async signOut() {
    this.currentUser = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('aumoha_mock_user');
    }
    this.notify();
  }
}

const mockAuthInstance = new MockAuthSystem();

// Wrapper functions that automatically handle Firebase vs Mock Mode
export const auth = {
  onAuthStateChanged: (callback: (user: AuthUser | null) => void) => {
    if (realAuth) {
      return realAuth.onAuthStateChanged((user) => {
        if (user) {
          callback({
            uid: user.uid,
            email: user.email,
            getIdToken: () => user.getIdToken()
          });
        } else {
          callback(null);
        }
      });
    } else {
      return mockAuthInstance.onAuthStateChanged(callback);
    }
  },
  
  signIn: async (email: string, password: string): Promise<AuthUser> => {
    if (realAuth) {
      const credential = await fbSignIn(realAuth, email, password);
      return {
        uid: credential.user.uid,
        email: credential.user.email,
        getIdToken: () => credential.user.getIdToken()
      };
    } else {
      return mockAuthInstance.signIn(email);
    }
  },

  signInWithGoogle: async (): Promise<AuthUser> => {
    if (realAuth) {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(realAuth, provider);
      return {
        uid: credential.user.uid,
        email: credential.user.email,
        getIdToken: () => credential.user.getIdToken()
      };
    } else {
      return mockAuthInstance.signIn('google.user@example.com');
    }
  },

  signUp: async (email: string, password: string): Promise<AuthUser> => {
    if (realAuth) {
      const credential = await fbCreateUser(realAuth, email, password);
      return {
        uid: credential.user.uid,
        email: credential.user.email,
        getIdToken: () => credential.user.getIdToken()
      };
    } else {
      return mockAuthInstance.signUp(email);
    }
  },

  signOut: async (): Promise<void> => {
    if (realAuth) {
      await fbSignOut(realAuth);
    } else {
      await mockAuthInstance.signOut();
    }
  },

  isMock: !hasFirebaseClientConfig
};
export type { FirebaseAuth };
