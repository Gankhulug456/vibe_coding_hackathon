
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Users, Briefcase, ShieldCheck, BarChartBig, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from "@/lib/firebase/config";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalOrganizations: 0,
    totalInternships: 0,
    pendingApprovals: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      setIsLoading(true);
      try {
        const usersCollection = collection(db, 'users');
        const studentsQuery = query(usersCollection, where('role', '==', 'student'));
        const orgsQuery = query(usersCollection, where('role', '==', 'organization'));
        const internshipsCollection = collection(db, 'internships');
        const pendingInternshipsQuery = query(internshipsCollection, where('status', '==', 'pending'));
        const pendingEventsQuery = query(collection(db, 'events'), where('status', '==', 'pending'));

        const [
          usersSnapshot,
          studentsSnapshot,
          orgsSnapshot,
          internshipsSnapshot,
          pendingInternshipsSnapshot,
          pendingEventsSnapshot
        ] = await Promise.all([
          getCountFromServer(usersCollection),
          getCountFromServer(studentsQuery),
          getCountFromServer(orgsQuery),
          getCountFromServer(internshipsCollection),
          getCountFromServer(pendingInternshipsQuery),
          getCountFromServer(pendingEventsQuery),
        ]);

        setStats({
          totalUsers: usersSnapshot.data().count,
          totalStudents: studentsSnapshot.data().count,
          totalOrganizations: orgsSnapshot.data().count,
          totalInternships: internshipsSnapshot.data().count,
          pendingApprovals: pendingInternshipsSnapshot.data().count + pendingEventsSnapshot.data().count,
        });

      } catch (error) {
        console.error("Error fetching admin dashboard stats:", error);
        toast({ title: t('messages.errorOccurred'), description: "Failed to load admin statistics.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminStats();
  }, [t, toast]);


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline text-foreground">{t('headings.adminDashboard')}</h1>
      <p className="text-muted-foreground">{t('adminDashboard.description')}</p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('adminDashboard.totalUsers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/4 mt-1" /> : <div className="text-2xl font-bold">{stats.totalUsers}</div>}
            <div className="text-xs text-muted-foreground">
              {isLoading ? <Skeleton className="h-4 w-3/4 mt-1" /> : t('adminDashboard.userBreakdown', { studentsCount: stats.totalStudents.toString(), orgsCount: stats.totalOrganizations.toString() })}
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('adminDashboard.totalInternships')}</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-1/4 mt-1" /> : <div className="text-2xl font-bold">{stats.totalInternships}</div>}
            <div className="text-xs text-muted-foreground">{t('adminDashboard.activeInactive')}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('adminDashboard.pendingApprovals')}</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-1/4 mt-1" /> : <div className="text-2xl font-bold">{stats.pendingApprovals}</div>}
            <p className="text-xs text-muted-foreground">{t('adminDashboard.awaitingReview')}</p>
          </CardContent>
        </Card>
         <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('adminDashboard.platformAnalytics')}</CardTitle>
            <BarChartBig className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" disabled className="w-full">{t('buttons.viewAnalyticsComingSoon')}</Button>
            <p className="text-xs text-muted-foreground mt-1 text-center">{t('adminDashboard.detailedPlatformUsage')}</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('headings.quickActions')}</CardTitle>
          <CardDescription>{t('adminDashboard.quickActionsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button asChild variant="secondary" className="w-full justify-start text-left h-auto py-3">
                <Link href="/admin/users" className="flex items-center gap-2">
                    <Users className="h-5 w-5"/>
                    <div>
                        <p className="font-semibold">{t('navigation.manageUsers')}</p>
                        <p className="text-xs text-muted-foreground">{t('adminDashboard.manageUsersLinkDesc')}</p>
                    </div>
                </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full justify-start text-left h-auto py-3">
                 <Link href="/admin/internships" className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5"/>
                     <div>
                        <p className="font-semibold">{t('navigation.internships')}</p>
                        <p className="text-xs text-muted-foreground">{t('adminDashboard.manageInternshipsLinkDesc')}</p>
                    </div>
                </Link>
            </Button>
             <Button asChild variant="secondary" className="w-full justify-start text-left h-auto py-3">
                 <Link href="/admin/events" className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5"/>
                     <div>
                        <p className="font-semibold">{t('navigation.events')}</p>
                        <p className="text-xs text-muted-foreground">{t('adminDashboard.manageEventsLinkDesc')}</p>
                    </div>
                </Link>
            </Button>
        </CardContent>
      </Card>

      <div className="mt-8 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-md">
        <p className="font-semibold">{t('headings.adminArea')}</p>
        <p className="text-sm">{t('messages.adminAreaWarning')}</p>
      </div>
    </div>
  );
}
