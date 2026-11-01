'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, AuthUser } from '../lib/firebase';
import { UserProfile } from '../types';
import { API_BASE } from '../lib/api';

interface AuthContextType {
  firebaseUser: AuthUser | null;
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  isProvider: boolean;
  vetProfile: any | null;
  isNewUser: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  syncProfile: (localData?: UserProfile) => Promise<void>;
  incrementRescueCount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);



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
  const [isProvider, setIsProvider] = useState(false);
  const [vetProfile, setVetProfile] = useState<any | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<AuthUser | null>(null);
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
      setIsNewUser(false);
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
      const idToken = await firebaseUser.getIdToken();
      setToken(idToken);
      if (typeof window !== 'undefined') localStorage.setItem('aumoha_auth_token', idToken);

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
          // Check if this user is a vet/expert provider (non-blocking)
          checkProviderStatus(idToken || '');
        }
      } else if (res.status === 401) {
        // Try refreshing token once before clearing cache
        try {
          if (firebaseUser && typeof firebaseUser.getIdToken === 'function') {
            const freshToken = await firebaseUser.getIdToken(true);
            if (freshToken && freshToken !== idToken) {
              setToken(freshToken);
              if (typeof window !== 'undefined') {
                localStorage.setItem('aumoha_auth_token', freshToken);
              }
              const retryRes = await fetch(`${API_BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${freshToken}` }
              });
              if (retryRes.ok) {
                const retryData = await retryRes.json();
                setUser(retryData.user);
                checkProviderStatus(freshToken);
                return;
              }
            }
          }
        } catch {
          // Token refresh failed
        }
        handleCacheClear();
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn('Unable to refresh profile:', error);
    }
  };

  // Check if this user is a vet/expert by calling /api/provider/me
  const checkProviderStatus = async (idToken: string) => {
    if (!idToken) return;
    try {
      const res = await fetch(`${API_BASE}/provider/me`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const prof = data.provider || data.vet;
        if (data.status === 'success' && prof) {
          setIsProvider(true);
          setVetProfile(prof);
        } else {
          setIsProvider(false);
          setVetProfile(null);
        }
      } else {
        setIsProvider(false);
        setVetProfile(null);
      }
    } catch {
      setIsProvider(false);
      setVetProfile(null);
    }
  };

  const handleCacheClear = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aumoha_profile_data');
      localStorage.removeItem('aumoha_auth_token');
      localStorage.removeItem('aumoha_is_logged_in');
      sessionStorage.removeItem('aumoha_admin_password');
    }
    setUser(null);
    setToken(null);
    setFirebaseUser(null);
    setIsNewUser(false);
    setIsProvider(false);
    setVetProfile(null);
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

    const unsubscribe = auth.onAuthStateChanged((fUser) => {
      clearTimeout(initTimeout);
      if (fUser) {
        const cached = getCachedProfile();
        if (cached && cached.firebaseUid !== fUser.uid) {
          setUser(null);
          setToken(null);
          setIsProvider(false);
          setVetProfile(null);
          localStorage.removeItem('aumoha_profile_data');
          localStorage.removeItem('aumoha_auth_token');
        }
        setFirebaseUser(fUser);
        localStorage.setItem('aumoha_is_logged_in', 'true');
      } else {
        handleCacheClear();
        setLoading(false);
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

  const incrementRescueCount = async () => {
    if (user) {
      const updatedUser: UserProfile = {
        ...user,
        rescueCount: (user.rescueCount || 0) + 1
      };
      setUser(updatedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('aumoha_profile_data', JSON.stringify(updatedUser));
      }
      if (token) {
        try {
          await fetch(`${API_BASE}/auth/increment-rescue`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (err) {
          console.warn('Failed to sync rescue count to server:', err);
        }
      }
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
        isProvider,
        vetProfile,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        syncProfile,
        incrementRescueCount,
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

