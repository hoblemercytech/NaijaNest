/* eslint-disable react-refresh/only-export-components -- homeFor is the
   redirect rule the guards enforce; it belongs beside them. */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/ui/States';

export const homeFor = (role) =>
  role === 'ADMIN' ? '/admin/dashboard' : role === 'COLLECTOR' ? '/collector/dashboard' : '/dashboard';

/**
 * Convenience only. RLS is what actually stops a collector reading another
 * collector's customers — this just keeps people out of screens that would
 * return nothing but empty states anyway.
 */
export function RequireAuth({ roles, children }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingState label="Checking your session" />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!profile) return <LoadingState label="Loading your profile" />;

  if (profile.status === 'DISABLED') {
    return <Navigate to="/account-disabled" replace />;
  }
  if (roles && !roles.includes(profile.role)) {
    return <Navigate to={homeFor(profile.role)} replace />;
  }
  return children;
}

/** Keeps signed-in people off the login and signup screens. */
export function RedirectIfAuthed({ children }) {
  const { session, profile, loading } = useAuth();
  if (loading) return <LoadingState />;
  if (session && profile) return <Navigate to={homeFor(profile.role)} replace />;
  return children;
}