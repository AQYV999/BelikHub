// mobile/src/auth/AuthProvider.tsx
// Unified authentication context with seamless Real API <-> Demo Mode switching
// Produces useAuth() and useApi() hooks

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Role, UserProfile } from '../api/types';
import { BelikHubClient, createApiClient, createDemoApiClient } from '../api/client';
import { demoStore } from '../demo/demoStore';
import {
  getFirebaseAuth,
  getIdToken,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fbSignOut,
  onAuthStateChanged,
  isFirebaseConfigured
} from './firebase';

export interface AuthContextValue {
  user: UserProfile | null;
  roles: Role[];
  activeRole: Role;
  setActiveRole: (role: Role) => void;
  isDemoMode: boolean;
  enterDemoMode: (role?: Role) => void;
  exitDemoMode: () => void;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  completeOnboarding: (data: any) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const ApiContext = createContext<BelikHubClient | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
  initialDemoMode?: boolean;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  initialDemoMode = false
}) => {
  const defaultDemo = initialDemoMode;

  const [isDemoMode, setIsDemoMode] = useState<boolean>(defaultDemo);
  const [activeRole, setActiveRoleState] = useState<Role>('warga');
  const [user, setUser] = useState<UserProfile | null>(() => {
    return defaultDemo ? demoStore.getActiveDemoUser() : null;
  });
  const [loading, setLoading] = useState<boolean>(false);

  // Initialize demo API client
  const demoApiClient = useMemo(() => createDemoApiClient(demoStore), []);

  // Initialize real API client
  const realApiClient = useMemo(
    () => createApiClient(() => getIdToken()),
    []
  );

  const activeApiClient: BelikHubClient = isDemoMode ? demoApiClient : realApiClient;

  // Sync demo user on activeRole or isDemoMode change
  useEffect(() => {
    if (isDemoMode) {
      demoStore.setActiveDemoRole(activeRole);
      const demoUser = demoStore.getActiveDemoUser();
      setUser(demoUser);
      setLoading(false);
    }
  }, [isDemoMode, activeRole]);

  // Real Firebase Auth listener
  useEffect(() => {
    if (isDemoMode) return;

    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await realApiClient.getMe();
          setUser(profile);
          if (profile.roles && profile.roles.length > 0) {
            setActiveRoleState(profile.roles[0]);
          }
        } catch (error) {
          console.warn('AuthProvider: Failed to fetch profile after login:', error);
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Pengguna',
            points: 0,
            roles: ['warga'],
            role: 'user'
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDemoMode, realApiClient]);

  const setActiveRole = (role: Role) => {
    setActiveRoleState(role);
    if (isDemoMode) {
      demoStore.setActiveDemoRole(role);
      setUser(demoStore.getActiveDemoUser());
    }
  };

  const enterDemoMode = (role?: Role) => {
    const targetRole = role || 'warga';
    demoStore.setActiveDemoRole(targetRole);
    setActiveRoleState(targetRole);
    setIsDemoMode(true);
    setUser(demoStore.getActiveDemoUser());
    setLoading(false);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    const auth = getFirebaseAuth();
    if (!auth?.currentUser) {
      setUser(null);
    }
  };

  const signIn = async (email: string, pass: string) => {
    if (isDemoMode) {
      const match = demoStore.findUserByEmail(email);
      if (match) {
        setUser(match);
        if (match.roles && match.roles.length > 0) {
          setActiveRoleState(match.roles[0]);
          demoStore.setActiveDemoRole(match.roles[0]);
        }
        return;
      }
      throw new Error(`Pengguna demo dengan email ${email} tidak ditemukan`);
    }
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth is not configured');
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const profile = await realApiClient.getMe();
      setUser(profile);
      if (profile.roles && profile.roles.length > 0) {
        setActiveRoleState(profile.roles[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, pass: string) => {
    if (isDemoMode) {
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth is not configured');
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      const profile = await realApiClient.getMe().catch(() => null);
      if (profile) {
        setUser(profile);
        if (profile.roles && profile.roles.length > 0) {
          setActiveRoleState(profile.roles[0]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (isDemoMode) {
      enterDemoMode('warga');
      return;
    }
    const auth = getFirebaseAuth();
    if (auth) {
      await fbSignOut(auth);
    }
    setUser(null);
  };

  const refreshProfile = async () => {
    if (isDemoMode) {
      setUser(demoStore.getActiveDemoUser());
      return;
    }
    try {
      const profile = await realApiClient.getMe();
      setUser(profile);
    } catch (e) {
      console.warn('refreshProfile error:', e);
    }
  };

  const completeOnboarding = async (data: any) => {
    const res = await activeApiClient.onboarding(data);
    if (res.user) {
      setUser(res.user);
      if (data.role) {
        setActiveRoleState(data.role);
      }
    }
  };

  const roles: Role[] = useMemo(() => {
    if (user?.roles && user.roles.length > 0) {
      return user.roles;
    }
    return ['warga'];
  }, [user]);

  const authValue: AuthContextValue = {
    user,
    roles,
    activeRole,
    setActiveRole,
    isDemoMode,
    enterDemoMode,
    exitDemoMode,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    completeOnboarding,
    loading
  };

  return (
    <AuthContext.Provider value={authValue}>
      <ApiContext.Provider value={activeApiClient}>{children}</ApiContext.Provider>
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export function useApi(): BelikHubClient {
  const ctx = useContext(ApiContext);
  if (!ctx) {
    throw new Error('useApi must be used within an AuthProvider');
  }
  return ctx;
}
