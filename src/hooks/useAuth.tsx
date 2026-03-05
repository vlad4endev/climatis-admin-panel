import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  sessionExpired: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const hadSessionRef = useRef(false);
  const toastShownRef = useRef(false);

  const handleSessionExpired = useCallback(() => {
    if (!toastShownRef.current && hadSessionRef.current) {
      setSessionExpired(true);
      setUser(null);
      setSession(null);
      toastShownRef.current = true;
      toast.error("Сессия истекла. Перенаправление на страницу авторизации...", {
        duration: 3000,
      });
      // Redirect after a short delay so user sees the message
      setTimeout(() => {
        window.location.href = "/auth";
      }, 1500);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);

        if (currentSession) {
          hadSessionRef.current = true;
          setSessionExpired(false);
          toastShownRef.current = false;
        }

        if (event === 'TOKEN_REFRESHED' && !currentSession && hadSessionRef.current) {
          handleSessionExpired();
        }

        if (event === 'SIGNED_OUT') {
          hadSessionRef.current = false;
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession) {
        hadSessionRef.current = true;
      }
      setLoading(false);
    });

    const healthCheck = setInterval(async () => {
      if (!hadSessionRef.current) return;
      
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error || !currentSession) {
        handleSessionExpired();
      }
    }, 30 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(healthCheck);
    };
  }, [handleSessionExpired]);

  const signOut = async () => {
    hadSessionRef.current = false;
    toastShownRef.current = false;
    setSessionExpired(false);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, sessionExpired, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
