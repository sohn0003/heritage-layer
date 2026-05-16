import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { hasProAccess as hasProAccessHelper, type SubscriptionTier } from '@/lib/entitlements';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  subscriptionTier: SubscriptionTier;
  hasProAccess: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshTier: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isAdmin: false,
  subscriptionTier: 'free',
  hasProAccess: false,
  loading: true,
  signOut: async () => {},
  refreshTier: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(true);
  const adminRef = useRef(false);

  const loadProfileAndRole = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    const admin = roles?.some(r => r.role === 'admin') ?? false;
    adminRef.current = admin;
    setIsAdmin(admin);
    if (admin) {
      setSubscriptionTier('enterprise');
    } else if (profile) {
      setSubscriptionTier((profile.subscription_tier as SubscriptionTier) ?? 'free');
    } else {
      setSubscriptionTier('free');
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => { loadProfileAndRole(session.user.id); }, 0);
      } else {
        setIsAdmin(false);
        adminRef.current = false;
        setSubscriptionTier('free');
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Realtime: subscriptions 테이블 변경 → 사용자 등급 재조회
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`subscriptions:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${user.id}` },
        () => { loadProfileAndRole(user.id); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshTier = async () => {
    if (user) await loadProfileAndRole(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isAdmin,
        subscriptionTier,
        hasProAccess: hasProAccessHelper(subscriptionTier),
        loading,
        signOut,
        refreshTier,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
