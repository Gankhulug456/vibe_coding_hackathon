
"use client";

import React from 'react';
import { AuthProvider } from './AuthContext';
import { LanguageProvider } from './LanguageContext';
import { ThemeProvider } from "next-themes";
import { NotificationProvider } from './NotificationContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
  // The isMounted and pathname logic for page transitions has been moved
  // to UserSpecificLayout to avoid affecting fixed elements like the sidebar.
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
