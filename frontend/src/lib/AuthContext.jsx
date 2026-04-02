import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, auth as vitaplateAuth } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]                       = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth]     = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadUser(session.user);
      else setIsLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadUser(session.user);
      else { setUser(null); setIsAuthenticated(false); setIsLoadingAuth(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUser = async (supabaseUser) => {
    try {
      const dbUser = await vitaplateAuth.me().catch(() => null);
      setUser({
        id:        supabaseUser.id,
        email:     supabaseUser.email,
        full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0],
        ...dbUser,
      });
      setIsAuthenticated(true);
    } catch {
      setUser({ id: supabaseUser.id, email: supabaseUser.email, full_name: supabaseUser.email?.split('@')[0] });
      setIsAuthenticated(true);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const login          = async ({ email, password }) => { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; };
  const loginWithGoogle = async () => { const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/Dashboard` } }); if (error) throw error; };
  const signup         = async ({ email, password, fullName }) => { const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } }); if (error) throw error; };
  const logout         = async () => { await supabase.auth.signOut(); setUser(null); setIsAuthenticated(false); };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoadingAuth, login, loginWithGoogle, signup, logout, currentUser: user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;
