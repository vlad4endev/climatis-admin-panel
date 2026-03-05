import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  useEffect(() => {
    // Set up auth state listener FIRST
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

        // Detect session expiry: user had a session but it's gone (not manual sign out)
        if (event === 'TOKEN_REFRESHED' && !currentSession && hadSessionRef.current) {
          setSessionExpired(true);
          if (!toastShownRef.current) {
            toastShownRef.current = true;
            toast.error("Сессия истекла. Пожалуйста, авторизуйтесь заново.", {
              duration: 10000,
            });
          }
        }

        if (event === 'SIGNED_OUT') {
          hadSessionRef.current = false;
          // If session expired caused the sign out, show message
          if (sessionExpired || (!currentSession && hadSessionRef.current)) {
            // already handled
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession) {
        hadSessionRef.current = true;
      }
      setLoading(false);
    });

    // Periodic session health check every 5 minutes
    const healthCheck = setInterval(async () => {
      if (!hadSessionRef.current) return;
      
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error || !currentSession) {
        if (hadSessionRef.current && !toastShownRef.current) {
          setSessionExpired(true);
          setUser(null);
          setSession(null);
          toastShownRef.current = true;
          toast.error("Сессия истекла. Пожалуйста, авторизуйтесь заново.", {
            duration: 10000,
          });
        }
      }
    }, 5 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(healthCheck);
    };
  }, []);

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
