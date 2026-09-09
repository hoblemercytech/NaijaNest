/* eslint-disable react-refresh/only-export-components -- AuthProvider and useAuth
   belong together; splitting them would spread one concern across two files. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { friendlyError } from '../lib/errors';

const AuthContext = createContext(null);

const PROFILE_COLUMNS =
  'id, member_id, full_name, email, phone, avatar_url, role, status, created_at';

/**
 * Holds the Supabase session plus the matching row from `profiles`.
 *
 * The profile is the authority on role — never JWT metadata, and never anything
 * the client can set. Routing reads `profile.role`, but RLS is what actually
 * enforces it; this is convenience, not security.
 *
 * Two rules shape the structure below:
 *
 * 1. The onAuthStateChange callback must stay synchronous. supabase-js holds an
 *    internal lock while it runs, so awaiting another Supabase call inside it
 *    deadlocks — the profile query never resolves and the app hangs on its
 *    loading state until a manual refresh. The callback therefore only stores
 *    the session; a separate effect keyed on the user id does the fetching.
 *
 * 2. On a fresh signup the profile row is created by a database trigger, so it
 *    can land a moment after the session does. The fetch retries briefly rather
 *    than concluding the account has no profile.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  // Keyed by userId so a stale result can never be shown against a new session.
  const [loaded, setLoaded] = useState({ userId: null, profile: null, error: null });

  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setSessionReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      // Synchronous only. No awaits, no Supabase calls — see note above.
      setSession(next);
      setSessionReady(true);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!userId) return undefined;

    let alive = true;

    (async () => {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const { data, error } = await supabase
          .from('profiles')
          .select(PROFILE_COLUMNS)
          .eq('id', userId)
          .maybeSingle();

        if (!alive) return;

        if (error) {
          setLoaded({ userId, profile: null, error: friendlyError(error) });
          return;
        }
        if (data) {
          setLoaded({ userId, profile: data, error: null });
          return;
        }
        // Row not visible yet — the signup trigger is still catching up.
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      }

      if (alive) {
        setLoaded({
          userId,
          profile: null,
          error: 'We could not load your profile. Try signing in again.',
        });
      }
    })();

    return () => {
      alive = false;
    };
  }, [userId, reloadTick]);

  const isCurrent = loaded.userId === userId;
  const profile = isCurrent ? loaded.profile : null;
  const profileError = isCurrent ? loaded.error : null;
  const loading = !sessionReady || (!!userId && !isCurrent);

  const refreshProfile = useCallback(() => setReloadTick((t) => t + 1), []);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async ({ fullName, email, phone, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        // Only non-privileged fields. The signup trigger hard-forces role=USER.
        data: { full_name: fullName.trim(), phone: phone.trim() },
      },
    });
    if (error) throw error;
    return data.user;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setLoaded({ userId: null, profile: null, error: null });
  }, []);

  const sendPasswordReset = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      role: profile?.role ?? null,
      loading,
      profileError,
      refreshProfile,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      updatePassword,
    }),
    [session, profile, loading, profileError, refreshProfile, signIn, signUp, signOut, sendPasswordReset, updatePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}