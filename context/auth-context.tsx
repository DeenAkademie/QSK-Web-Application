'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  refreshAuth: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const refreshAuth = async () => {
    try {
      setIsLoading(true);
      // Prüfe die aktuelle Session direkt von Supabase
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Fehler beim Abrufen der Session:', error);
        setUser(null);
        setSession(null);
        return;
      }

      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
        console.log('User authenticated:', data.session.user.email);
      } else {
        setUser(null);
        setSession(null);
        console.log('No active session');
      }
    } catch (error) {
      console.error(
        'Unerwarteter Fehler beim Abrufen der Authentifizierung:',
        error
      );
      setUser(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialer Auth-Check
  useEffect(() => {
    refreshAuth();

    // Auth-Status-Änderungen überwachen
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth state changed:', event, currentSession?.user?.email);

      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
      } else {
        setSession(null);
        setUser(null);
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    refreshAuth,
  };

  console.log('AuthProvider state:', {
    isAuthenticated: !!user,
    userEmail: user?.email,
    hasSession: !!session,
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
