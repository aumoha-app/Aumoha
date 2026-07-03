'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, AuthUser } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  firebaseUser: AuthUser | null;
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  isNewUser: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  syncProfile: (localData?: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = 'http://localhost:5001/api';

const getCachedProfile = (): UserProfile | null => {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('aumoha_profile_data');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
};

const getCachedToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('aumoha_auth_token');
  }
  return null;
};

const getIsLoggedIn = (): boolean => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('aumoha_is_logged_in') === 'true';
  }
  return false;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => getCachedProfile());
  const [token, setToken] = useState<string | null>(() => getCachedToken());
  const [firebaseUser, setFirebaseUser] = useState<AuthUser | null>(() => {
    const cachedProfile = getCachedProfile();
    const cachedToken = getCachedToken();
    if (cachedProfile && cachedToken) {
      return {
        uid: cachedProfile.firebaseUid || 'cached-uid',
        email: cachedProfile.email,
        getIdToken: async () => cachedToken
      } as AuthUser;
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    const cachedProfile = getCachedProfile();
    const cachedToken = getCachedToken();
    const isLoggedIn = getIsLoggedIn();
    if (cachedProfile && cachedToken) return false;
    if (!isLoggedIn) return false;
    return true;
  });
  const [isNewUser, setIsNewUser] = useState(false);

  // Sync user details with MongoDB backend (with network timeout protection)
  const syncProfile = async (localData?: UserProfile) => {
    if (localData) {
      setUser(localData);
      if (typeof window !== 'undefined') {
        localStorage.setItem('aumoha_profile_data', JSON.stringify(localData));
        localStorage.setItem('aumoha_is_logged_in', 'true');
      }
      return;
    }

    if (!firebaseUser) {
      setUser(null);
      setIsNewUser(false);
      return;
    }

    // Set up AbortController for a 3s request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      // Use cached token directly if available, otherwise fetch with a 1.5s timeout to prevent Google server hangs
      let idToken = token;
      if (!idToken) {
        idToken = await Promise.race([
          firebaseUser.getIdToken(),
          new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error('Token refresh timed out')), 1500)
          )
        ]);
        setToken(idToken);
        if (typeof window !== 'undefined') {
          localStorage.setItem('aumoha_auth_token', idToken);
        }
      }

      const res = await fetch(`${API_BASE}/auth/me`, {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.isNewUser) {
          setIsNewUser(true);
          setUser(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('aumoha_profile_data');
          }
        } else {
          setIsNewUser(false);
          setUser(data.user);
          if (typeof window !== 'undefined') {
            localStorage.setItem('aumoha_profile_data', JSON.stringify(data.user));
            localStorage.setItem('aumoha_is_logged_in', 'true');
          }
        }
      } else {
        console.error('Failed to sync profile from MongoDB backend');
        if (res.status === 401) {
          handleCacheClear();
        }
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.warn('Profile sync timed out. Operating on cached local data.');
      } else {
        console.error('Error syncing profile:', error);
      }
    }
  };

  const handleCacheClear = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aumoha_profile_data');
      localStorage.removeItem('aumoha_auth_token');
      localStorage.removeItem('aumoha_is_logged_in');
    }
    setUser(null);
    setToken(null);
    setIsNewUser(false);
  };

  useEffect(() => {
    // Fail-safe init timeout: If Firebase Auth takes more than 1.5s to respond, bypass the loading screen
    const initTimeout = setTimeout(() => {
      setLoading(currLoading => {
        if (currLoading) {
          console.warn('🕒 Firebase client initialization timed out. Bypassing loading screen.');
          return false;
        }
        return currLoading;
      });
    }, 1500);

    const unsubscribe = auth.onAuthStateChanged(async (fUser) => {
      clearTimeout(initTimeout);
      if (fUser) {
        setFirebaseUser(fUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('aumoha_is_logged_in', 'true');
        }
      } else {
        // Debounce unauth state check: If we expect a logged-in user, wait 450ms before showing the login screen.
        // This completely eliminates any layout flash when Firebase Auth client restores its session.
        const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('aumoha_is_logged_in') === 'true';
        if (isLoggedIn) {
          const timer = setTimeout(() => {
            setFirebaseUser(curr => {
              // If still null or using the fallback cached uid, we assume they are really logged out.
              if (curr === null || curr.uid === 'cached-uid') {
                handleCacheClear();
                setLoading(false);
                return null;
              }
              return curr;
            });
          }, 450);
          return () => clearTimeout(timer);
        } else {
          setFirebaseUser(null);
          handleCacheClear();
          setLoading(false);
        }
      }
    });

    return () => {
      clearTimeout(initTimeout);
      unsubscribe();
    };
  }, []);

  // Whenever firebaseUser changes, fetch profile in background
  useEffect(() => {
    if (firebaseUser) {
      syncProfile().finally(() => setLoading(false));
    }
  }, [firebaseUser]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('aumoha_is_logged_in', 'true');
    }
    try {
      await auth.signIn(email, password);
    } catch (error: any) {
      setLoading(false);
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('aumoha_is_logged_in', 'true');
    }
    try {
      await auth.signInWithGoogle();
    } catch (error: any) {
      setLoading(false);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('aumoha_is_logged_in', 'true');
    }
    try {
      await auth.signUp(email, password);
    } catch (error: any) {
      setLoading(false);
      throw new Error(error.message || 'Failed to sign up');
    }
  };

  const signOut = async () => {
    setLoading(true);
    handleCacheClear();
    try {
      await auth.signOut();
    } catch (error: any) {
      console.error('Failed to sign out:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        token,
        loading,
        isNewUser,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        syncProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
export type { AuthContextType };
