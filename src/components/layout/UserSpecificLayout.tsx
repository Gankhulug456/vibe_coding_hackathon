"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { SidebarNav, type NavItem } from "@/components/layout/SidebarNav";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  LayoutDashboard,
  Briefcase,
  ListChecks,
  FileText,
  Settings,
  Users,
  ShieldCheck,
  Building,
  PlusSquare,
  FileArchive,
  Sparkles,
  Bot,
  BookOpen,
  Calendar,
  Menu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const studentNavItems: NavItem[] = [
  {
    titleKey: "navigation.dashboard",
    href: "/student/dashboard",
    icon: LayoutDashboard,
  },
  {
    titleKey: "navigation.jobsAndInternships",
    href: "/student/internships",
    icon: Briefcase,
  },
  {
    titleKey: "navigation.myApplications",
    href: "/student/tracker",
    icon: ListChecks,
  },
  {
    titleKey: "navigation.resumeAnalyzer",
    href: "/student/resume",
    icon: Sparkles,
  },
  { titleKey: "navigation.aiAssistant", href: "/student/assistant", icon: Bot },
  {
    titleKey: "navigation.learnCenter",
    href: "/student/learn",
    icon: BookOpen,
  },
  { titleKey: "navigation.events", href: "/student/events", icon: Calendar },
];

const organizationNavItems: NavItem[] = [
  {
    titleKey: "navigation.dashboard",
    href: "/organization/dashboard",
    icon: LayoutDashboard,
  },
  {
    titleKey: "navigation.postNewInternship",
    href: "/organization/post-job",
    icon: PlusSquare,
  },
  {
    titleKey: "navigation.manageListings",
    href: "/organization/listings",
    icon: Briefcase,
  },
  {
    titleKey: "navigation.receivedApplications",
    href: "/organization/applications",
    icon: FileArchive,
  },
  {
    titleKey: "navigation.events",
    href: "/organization/events",
    icon: Calendar,
  },
];

const adminNavItems: NavItem[] = [
  {
    titleKey: "navigation.dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  { titleKey: "navigation.manageUsers", href: "/admin/users", icon: Users },
  {
    titleKey: "navigation.jobsAndInternships",
    href: "/admin/internships",
    icon: Briefcase,
  },
  { titleKey: "navigation.events", href: "/admin/events", icon: Calendar },
  { titleKey: "navigation.learnCenter", href: "/admin/learn", icon: BookOpen },
];

export function UserSpecificLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, loading } = useAuth();
  const { t } = useLanguage();
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  useAuthRedirect({
    requiredAuth: true,
    allowedRoles: user ? [user.role] : undefined,
  });

  useEffect(() => {
    // When the pathname changes, navigation is complete.
    setIsNavigating(false);
  }, [pathname]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="p-4 rounded-lg">
          <svg
            className="animate-spin h-10 w-10 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      </div>
    );
  }

  let navItems: NavItem[] = [];
  switch (role) {
    case "student":
      navItems = studentNavItems;
      break;
    case "organization":
      navItems = organizationNavItems;
      break;
    case "admin":
      navItems = adminNavItems;
      break;
  }

  const handleNavClick = () => {
    setIsMobileSheetOpen(false);
    setIsNavigating(true);
  };

  const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className="flex h-full max-h-screen flex-col">
      <div className="flex h-16 items-center border-b px-4 lg:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold"
          onClick={onItemClick}
        >
          <Image
            src="/logo.png"
            alt="Nomadly Intern Logo"
            width={24}
            height={24}
          />
          <span className="">{t("appName")}</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <SidebarNav items={navItems} onItemClick={onItemClick} />
      </div>
    </div>
  );

  const isChatPage = pathname === "/student/assistant";

  return (
    <div className="bg-muted/40 p-2 md:p-4 min-h-screen w-full">
      <div className="grid h-[calc(100vh-1rem)] md:h-[calc(100vh-2rem)] w-full md:grid-cols-[220px_1fr] lg:grid-cols-[240px_1fr] gap-4">
        {/* Desktop Sidebar */}
        <div className="hidden border bg-card text-card-foreground rounded-xl md:flex flex-col">
          <SidebarContent onItemClick={handleNavClick} />
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col rounded-xl border bg-card text-card-foreground relative overflow-hidden">
          {/* Mobile Sheet Trigger (floating) */}
          <div className="md:hidden absolute top-4 left-4 z-10">
            <div className="flex items-center bg-card/60 backdrop-blur-xl p-1.5 rounded-full shadow-lg border">
              <Sheet
                open={isMobileSheetOpen}
                onOpenChange={setIsMobileSheetOpen}
              >
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[240px] p-0 bg-card">
                  <SheetTitle className="sr-only">
                    {t("navigation.menuTitle")}
                  </SheetTitle>
                  <SidebarContent onItemClick={handleNavClick} />
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Floating Header */}
          <div className="absolute top-4 right-4 z-10">
            <div className="flex items-center bg-card/60 backdrop-blur-xl p-1.5 rounded-full shadow-lg border">
              <Header />
            </div>
          </div>

          <div className="flex-1 flex flex-col pt-20 md:pt-24 h-full">
            {isNavigating ? (
              <div className="flex-1 flex items-center justify-center">
                <svg
                  className="animate-spin h-10 w-10 text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.main
                  key={pathname}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className={cn(
                    "flex-1 flex flex-col",
                    isChatPage ? "h-full" : "overflow-y-auto p-4 md:p-6"
                  )}
                >
                  {children}
                </motion.main>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
