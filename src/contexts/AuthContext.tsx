import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient, Session, User, SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

// ── Supabase client (singleton) ──
const supabaseUrl = `https://${projectId}.supabase.co`;

// Robust check for localStorage availability (Safari Private Mode fix)
const checkStorage = () => {
  try {
    const test = '__storage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

const supabase: SupabaseClient = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    persistSession: checkStorage(), // Only persist if storage is allowed
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export { supabase };

// ── Types ──
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ──
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Determine admin role from user metadata
  const isAdmin = !!(
    user?.app_metadata?.role === 'admin' ||
    user?.user_metadata?.role === 'admin'
  );

  useEffect(() => {
    // 1. Restore existing session on mount
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    // 2. Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Sign Up ──
  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || email.split('@')[0] },
      },
    });
    if (error) {
      return { error: translateAuthError(error.message) };
    }
    return { error: null };
  };

  // ── Sign In ──
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: translateAuthError(error.message) };
    }
    return { error: null };
  };

  // ── Sign Out ──
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    localStorage.removeItem('health_app_current_patient_id');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// ── Translate Supabase error messages to Arabic ──
function translateAuthError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
  if (msg.includes('User already registered')) return 'هذا البريد الإلكتروني مسجل بالفعل';
  if (msg.includes('Password should be at least')) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
  if (msg.includes('Unable to validate email')) return 'البريد الإلكتروني غير صالح';
  if (msg.includes('Email not confirmed')) return 'يرجى تأكيد بريدك الإلكتروني أولاً';
  if (msg.includes('rate limit')) return 'محاولات كثيرة، يرجى الانتظار قليلاً';
  return msg;
}
