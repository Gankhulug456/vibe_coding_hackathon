
"use client";

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import type { UserRole } from '@/types';

interface UseAuthRedirectOptions {
  requiredAuth?: boolean; // If true, user must be authenticated
  allowedRoles?: UserRole[]; // If specified, user must have one of these roles
  redirectUnauthenticatedTo?: string;
  redirectUnauthorizedTo?: string; // Redirect if role not allowed
  redirectAuthenticatedTo?: string; // Redirect if user is authenticated (e.g., for login page)
}

export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const {
    requiredAuth = false,
    allowedRoles,
    redirectUnauthenticatedTo = '/login',
    redirectUnauthorizedTo = '/', // Default to home page if role is not authorized
    redirectAuthenticatedTo,
  } = options;

  useEffect(() => {
    if (loading) return;

    // If on an auth page (login/register) and already authenticated, redirect
    if (redirectAuthenticatedTo && user && (pathname === '/login' || pathname === '/register')) {
      router.push(redirectAuthenticatedTo);
      return;
    }
    
    // If auth is required and user is not logged in
    if (requiredAuth && !user) {
      router.push(redirectUnauthenticatedTo);
      return;
    }

    // If specific roles are required and user's role is not allowed
    if (user && allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role!)) {
       // Attempt to redirect to the user's default dashboard if on an unauthorized page
       if (role === 'student' && !pathname.startsWith('/student')) {
        router.push('/student/dashboard');
      } else if (role === 'organization' && !pathname.startsWith('/organization')) {
        router.push('/organization/dashboard');
      } else if (role === 'admin' && !pathname.startsWith('/admin')) {
        router.push('/admin/dashboard');
      } else {
        // If already on their own section but still unauthorized (e.g. admin trying to access student page directly)
        // or if no specific dashboard redirect is applicable, redirect to the general unauthorized page.
        router.push(redirectUnauthorizedTo);
      }
      return;
    }

  }, [user, role, loading, router, requiredAuth, allowedRoles, redirectUnauthenticatedTo, redirectUnauthorizedTo, redirectAuthenticatedTo, pathname]);

  return { user, role, loading };
}
