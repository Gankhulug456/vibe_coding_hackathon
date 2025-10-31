
"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If we are done loading and have a user, redirect away from auth pages.
    if (!loading && user && role) {
      let targetDashboard = '/'; 
      if (role === 'student') {
        targetDashboard = '/student/dashboard';
      } else if (role === 'organization') {
        targetDashboard = '/organization/dashboard';
      } else if (role === 'admin') {
        targetDashboard = '/admin/dashboard';
      }
      router.replace(targetDashboard);
    }
  }, [user, role, loading, router]);

  // While loading, or if we have a user (and are about to redirect), show a spinner.
  if (loading || (!loading && user)) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="p-4 rounded-lg">
          <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  // Only show the auth form if we are done loading AND there is no user.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-3 text-3xl font-bold text-primary">
          <Image src="/logo-large.png" alt="Nomadly Intern Logo" width={48} height={48} />
          Nomadly Intern
        </Link>
      </div>
      {children}
    </div>
  );
}
