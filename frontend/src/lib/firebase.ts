import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword as fbSignIn,
  createUserWithEmailAndPassword as fbCreateUser,
  signOut as fbSignOut,
  signInWithPopup,
  sendEmailVerification,
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
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
}

// Authentication failures are surfaced to the UI; never manufacture a local login.
function requireAuth(): FirebaseAuth {
  if (!realAuth) throw new Error('Authentication service is not configured');
  return realAuth;
}
function wrapUser(user: FirebaseUser): AuthUser {
  return { uid: user.uid, email: user.email, getIdToken: (forceRefresh) => user.getIdToken(forceRefresh) };
}
export const auth = {
  onAuthStateChanged: (callback: (user: AuthUser | null) => void) => {
    if (!realAuth) { callback(null); return () => {}; }
    return realAuth.onIdTokenChanged(user => callback(user?.emailVerified ? wrapUser(user) : null));
  },
  getIdToken: async (): Promise<string> => {
    const user = requireAuth().currentUser;
    if (!user) throw new Error('Please sign in before making a payment');
    return user.getIdToken();
  },
  signIn: async (email: string, password: string): Promise<AuthUser> => {
    const result = await fbSignIn(requireAuth(), email, password);
    if (!result.user.emailVerified) {
      await sendEmailVerification(result.user);
      await fbSignOut(requireAuth());
      throw new Error('Verify your email using the link sent to your inbox, then sign in again.');
    }
    return wrapUser(result.user);
  },
  signUp: async (email: string, password: string): Promise<AuthUser> => {
    const result = await fbCreateUser(requireAuth(), email, password);
    await sendEmailVerification(result.user);
    await fbSignOut(requireAuth());
    throw new Error('Account created. Verify your email using the link sent to your inbox, then sign in.');
  },
  signInWithGoogle: async (): Promise<AuthUser> =>
    wrapUser((await signInWithPopup(requireAuth(), new GoogleAuthProvider())).user),
  signOut: async (): Promise<void> => { await fbSignOut(requireAuth()); },
  get isMock(): boolean { return false; }
};
export type { FirebaseAuth };
