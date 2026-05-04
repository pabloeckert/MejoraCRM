import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { DEMO_OWNER, DEMO_SELLER } from "@/demo/demoData";

type AppRole = Database["public"]["Enums"]["app_role"];

/** Set to true to bypass Supabase auth and use demo data */
export const DEMO_MODE = true;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  profile: { full_name: string; avatar_url: string | null } | null;
  loading: boolean;
  signOut: () => Promise<void>;
  /** Demo mode only — toggle between owner and seller */
  demoRole: "admin" | "vendedor";
  toggleDemoRole: () => void;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  demoRole: "admin",
  toggleDemoRole: () => {},
  isDemo: false,
});

export const useAuth = () => useContext(AuthContext);

/* ── Demo mock objects ────────────────────────────────────────── */

function makeDemoUser(id: string, email: string): User {
  return {
    id,
    email,
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
    role: "authenticated",
  } as User;
}

function makeDemoSession(user: User): Session {
  return {
    access_token: "demo-token",
    refresh_token: "demo-refresh",
    expires_in: 3600,
    token_type: "bearer",
    user,
  } as Session;
}

/* ── Provider ─────────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoRole, setDemoRole] = useState<"admin" | "vendedor">("admin");

  /* ── Demo mode init ──────────────────────────────────────── */
  useEffect(() => {
    if (!DEMO_MODE) return;
    const demo = demoRole === "admin" ? DEMO_OWNER : DEMO_SELLER;
    const u = makeDemoUser(demo.id, demo.email);
    setUser(u);
    setSession(makeDemoSession(u));
    setRole(demo.role as AppRole);
    setProfile({ full_name: demo.full_name, avatar_url: null });
    setLoading(false);
  }, [demoRole]);

  /* ── Real Supabase auth (only when DEMO_MODE = false) ────── */
  const fetchUserData = async (userId: string) => {
    const [roleRes, profileRes] = await Promise.all([
      supabase.rpc("get_user_role", { _user_id: userId }),
      supabase.from("profiles").select("full_name, avatar_url").eq("user_id", userId).single(),
    ]);
    if (roleRes.data) setRole(roleRes.data);
    if (profileRes.data) setProfile(profileRes.data);
  };

  useEffect(() => {
    if (DEMO_MODE) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setRole(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (!DEMO_MODE) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
  };

  const toggleDemoRole = useCallback(() => {
    setDemoRole((prev) => (prev === "admin" ? "vendedor" : "admin"));
  }, []);

  return (
    <AuthContext.Provider value={{
      user, session, role, profile, loading, signOut,
      demoRole, toggleDemoRole, isDemo: DEMO_MODE,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
