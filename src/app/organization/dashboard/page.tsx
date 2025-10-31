
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { PlusSquare, Briefcase, Building, Users, FileArchive, LayoutDashboard, Loader2 } from "lucide-react";
import Image from 'next/image';
import { useState, useEffect } from "react";
import { collection, query, where, getCountFromServer, getDocs, Timestamp } from 'firebase/firestore';
import { db } from "@/lib/firebase/config";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizationDashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const [stats, setStats] = useState({
    activeListings: 0,
    totalApplications: 0,
    newApplicantsToday: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const listingsQuery = query(
          collection(db, 'internships'),
          where('postedBy', '==', user.uid),
          where('status', '==', 'approved')
        );
        const listingsSnapshot = await getCountFromServer(listingsQuery);
        const activeListings = listingsSnapshot.data().count;

        // Fetch all applications for the organization once to avoid composite indexes
        const appsQuery = query(
          collection(db, 'applications'),
          where('organizationId', '==', user.uid)
        );
        const appsSnapshot = await getDocs(appsQuery);
        
        const totalApplications = appsSnapshot.size;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let newApplicantsToday = 0;
        appsSnapshot.forEach(doc => {
          const app = doc.data();
          const appliedAt = (app.appliedAt as Timestamp).toDate();
          if (appliedAt >= today) {
            newApplicantsToday++;
          }
        });

        setStats({
          activeListings,
          totalApplications,
          newApplicantsToday,
        });

      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        toast({ title: t('messages.errorOccurred'), description: "Failed to load dashboard statistics.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user, t, toast]);

  const welcomeMessage = user 
    ? t('organizationDashboard.welcomeMessage', { name: user.organizationName || user.name || t('labels.organization') })
    : t('organizationDashboard.defaultWelcome');

  return (
    <div className="space-y-8">
       <Card className="relative overflow-hidden group bg-accent border-primary/20 shadow-lg p-6 md:p-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-full">
                <LayoutDashboard className="h-8 w-8 text-primary" />
            </div>
            <div>
                <h1 className="text-2xl font-bold font-headline text-foreground">
                    {t('navigation.dashboard')}
                </h1>
                <p className="text-muted-foreground mt-1">
                    {welcomeMessage}
                </p>
            </div>
          </div>
           <div className="hidden md:block">
            <Image
                src="/placeholder-dashboard.png"
                alt="Dashboard decoration"
                width={300}
                height={150}
                className="rounded-lg object-cover"
                data-ai-hint="dashboard office"
            />
          </div>
      </Card>

      <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">{t('headings.quickActions')}</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="relative overflow-hidden group shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col">
              <CardHeader>
                <div className="p-3 bg-accent rounded-full w-fit mb-2">
                    <PlusSquare className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg font-medium font-headline">
                  {t('navigation.postNewInternship')}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  {t('organizationDashboard.postNewDescription')}
                </p>
              </CardContent>
               <CardFooter>
                 <Button asChild className="w-full">
                    <Link href="/organization/post-job">{t('buttons.postJob')}</Link>
                  </Button>
               </CardFooter>
            </Card>

            <Card className="relative overflow-hidden group shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col">
              <CardHeader>
                <div className="p-3 bg-accent rounded-full w-fit mb-2">
                    <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg font-medium font-headline">
                  {t('navigation.manageListings')}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  {t('organizationDashboard.manageListingsDescription')}
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href="/organization/listings">{t('navigation.manageListings')}</Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="relative overflow-hidden group shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col">
               <CardHeader>
                <div className="p-3 bg-accent rounded-full w-fit mb-2">
                    <Building className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg font-medium font-headline">
                  {t('navigation.companyProfile')}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  {t('organizationDashboard.companyProfileDescription')}
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full" variant="secondary">
                  <Link href="/organization/settings">{t('navigation.companyProfile')}</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
      </div>

       <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">{t('headings.quickStats')}</h2>
           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
               <Card className="relative overflow-hidden group">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('organizationDashboard.activeListings')}</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats.activeListings}</div>}
                  </CardContent>
                </Card>
                <Card className="relative overflow-hidden group">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('organizationDashboard.totalApplicationsReceived')}</CardTitle>
                    <FileArchive className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats.totalApplications}</div>}
                  </CardContent>
                </Card>
                <Card className="relative overflow-hidden group">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('organizationDashboard.newApplicantsToday')}</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                     {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats.newApplicantsToday}</div>}
                  </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
