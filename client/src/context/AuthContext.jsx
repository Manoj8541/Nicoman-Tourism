import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch and automatically create / sync profile for OAuth & new users
  const ensureProfile = async (authUser, accessToken) => {
    if (!authUser?.id) return null;
    try {
      // 1. Try to fetch existing profile from Supabase (supports user_id)
      let { data: existing, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

      // Fallback if table still had 'id' column
      if (fetchErr && fetchErr.message?.includes('user_id')) {
        const fallback = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();
        existing = fallback.data;
      }

      const meta = authUser.user_metadata || {};
      const metaName = meta.full_name || meta.name || meta.given_name || authUser.email?.split('@')[0] || 'Traveller';
      const metaAvatar = meta.avatar_url || meta.picture || null;

      if (existing) {
        // If avatar or full_name is missing, fill from OAuth metadata
        if ((!existing.avatar_url && metaAvatar) || (!existing.full_name && metaName)) {
          const updates = { updated_at: new Date().toISOString() };
          if (!existing.avatar_url && metaAvatar) updates.avatar_url = metaAvatar;
          if (!existing.full_name && metaName) updates.full_name = metaName;

          const updateQuery = existing.user_id ? 'user_id' : 'id';
          const { data: updated } = await supabase
            .from('profiles')
            .update(updates)
            .eq(updateQuery, authUser.id)
            .select()
            .single();
          return updated || existing;
        }
        return existing;
      }

      // 2. Profile does not exist yet -> Attempt client-side upsert with user_id
      const newProfile = {
        user_id: authUser.id,
        email: authUser.email,
        full_name: metaName,
        avatar_url: metaAvatar,
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: inserted, error: insertErr } = await supabase
        .from('profiles')
        .upsert(newProfile, { onConflict: 'user_id' })
        .select()
        .single();

      if (!insertErr && inserted) {
        return inserted;
      }

      // 3. Fallback: Sync via backend endpoint with service role (bypasses RLS)
      const token = accessToken || (await supabase.auth.getSession()).data.session?.access_token;
      if (token) {
        try {
          const res = await axios.post('/api/user/sync-profile', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data?.profile) return res.data.profile;
        } catch (apiErr) {
          console.warn('[Auth] Sync profile endpoint fallback failed:', apiErr.message);
        }
      }

      return newProfile;
    } catch (err) {
      console.error('[Auth] ensureProfile error:', err.message);
      return null;
    }
  };

  useEffect(() => {
    // Get the initial session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const prof = await ensureProfile(session.user, session.access_token);
        setProfile(prof);
      }
      setLoading(false);
    });

    // Listen for auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const prof = await ensureProfile(session.user, session.access_token);
          setProfile(prof);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Sign up a new user.
   * @param {string} email
   * @param {string} password
   * @param {string} fullName
   * @param {string} turnstileToken - Verified server-side before creating account
   * @returns {{ error: string|null }}
   */
  const signUp = async (email, password, fullName, turnstileToken) => {
    // 1. Verify Turnstile token server-side before doing anything
    if (turnstileToken) {
      try {
        const verifyRes = await fetch('/api/verify-turnstile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: turnstileToken }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success) {
          return { error: verifyData.error || 'CAPTCHA verification failed. Please try again.' };
        }
      } catch (err) {
        return { error: 'CAPTCHA/Rate limit check failed. Please try again.' };
      }
    }

    // 2. Create the Supabase auth user
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        // emailRedirectTo is set in your Supabase dashboard (Auth → URL Configuration)
      },
    });

    if (error) return { error: error.message };
    return { error: null };
  };

  /**
   * Sign in an existing user.
   * @returns {{ error: string|null }}
   */
  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  /**
   * Sign out the current user.
   */
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  /**
   * Send a password-reset email via Supabase built-in flow.
   * @param {string} email
   * @returns {{ error: string|null }}
   */
  const resetPassword = async (email) => {
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) return { error: error.message };
    return { error: null };
  };

  /**
   * Update the logged-in user's password (used during password recovery reset).
   * Attaches ChangedAtDate, ChangedAtTime, RequestIP metadata so Supabase security alert emails populate correctly.
   * @param {string} newPassword
   * @returns {{ error: string|null }}
   */
  const updatePassword = async (newPassword) => {
    let clientIp = 'N/A';
    try {
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipRes.json();
      if (ipData.ip) clientIp = ipData.ip;
    } catch (_) {}

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      data: {
        ChangedAtDate: dateStr,
        ChangedAtTime: timeStr,
        RequestIP: clientIp,
      },
    });

    if (error) return { error: error.message };

    // Immediately revoke all global sessions across all devices
    await supabase.auth.signOut({ scope: 'global' });
    return { error: null };
  };

  /**
   * Sign in / sign up with Google OAuth
   * @returns {{ error: string|null }}
   */
  const signInWithGoogle = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const refreshProfile = async () => {
    if (user?.id) {
      const prof = await ensureProfile(user, session?.access_token);
      setProfile(prof);
      return prof;
    }
    return null;
  };

  // Admin = 'admin' OR 'superadmin' OR 'demo_admin'
  const isDemoAdmin  = profile?.role === 'demo_admin';
  const isAdmin      = profile?.role === 'admin' || profile?.role === 'superadmin' || isDemoAdmin;
  const isSuperAdmin = profile?.role === 'superadmin';

  const value = {
    user,
    session,
    profile,
    loading,
    isAdmin,
    isSuperAdmin,
    isDemoAdmin,
    refreshProfile,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — use this in any component
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
