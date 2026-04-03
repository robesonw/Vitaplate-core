import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]                           = useState(null);
  const [isAuthenticated, setIsAuthenticated]     = useState(false);
  const [isLoadingAuth, setIsLoadingAuth]         = useState(true);
  // Keep these for App.jsx compatibility
  const [isLoadingPublicSettings]                 = useState(false);
  const [authError, setAuthError]                 = useState(null);

  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadUser(session.user);
      else {
        setIsLoadingAuth(false);
        // No session — trigger auth_required so App.jsx redirects to login
        setAuthError({ type: 'auth_required' });
      }
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthError(null);
        loadUser(session.user);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        setAuthError({ type: 'auth_required' });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUser = async (supabaseUser) => {
    try {
      setUser({
        id:        supabaseUser.id,
        email:     supabaseUser.email,
        full_name: supabaseUser.user_metadata?.full_name
                   || supabaseUser.user_metadata?.name
                   || supabaseUser.email?.split('@')[0],
        avatar_url: supabaseUser.user_metadata?.avatar_url,
      });
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (err) {
      console.error('Failed to load user:', err);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Called by App.jsx when authError.type === 'auth_required'
  const navigateToLogin = () => {
    // Handled inline — Login component renders in place of app
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/Dashboard`,
      },
    });
    if (error) throw error;
  };

  const loginWithEmail = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signupWithEmail = async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      currentUser: user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      navigateToLogin,
      loginWithGoogle,
      loginWithEmail,
      login: loginWithEmail,
      signup: signupWithEmail,
      logout,
    }}>
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
