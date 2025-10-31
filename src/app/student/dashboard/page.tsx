
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Briefcase, FileText, ListChecks, Lightbulb, LayoutDashboard } from "lucide-react";
import Image from "next/image";

export default function StudentDashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const welcomeMessage = user?.name 
    ? t('studentDashboard.welcomeMessage', { name: user.name })
    : t('studentDashboard.defaultWelcome');

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


      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="relative overflow-hidden group shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col">
          <CardHeader>
            <div className="p-3 bg-accent rounded-full w-fit mb-2">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-headline text-xl">
              {t('navigation.internships')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-muted-foreground text-sm">
              {t('studentDashboard.browseOpportunities')}
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/student/internships">{t('buttons.exploreInternships')}</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="relative overflow-hidden group shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col">
          <CardHeader>
             <div className="p-3 bg-accent rounded-full w-fit mb-2">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-headline text-xl">
              {t('navigation.resumeAnalyzer')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-muted-foreground text-sm">
              {t('studentDashboard.getAIResumeFeedback')}
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/student/resume">{t('buttons.uploadResume')}</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="relative overflow-hidden group shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col">
          <CardHeader>
            <div className="p-3 bg-accent rounded-full w-fit mb-2">
              <ListChecks className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-headline text-xl">
              {t('navigation.myApplications')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-muted-foreground text-sm">
              {t('studentDashboard.trackApplications')}
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/student/tracker">{t('navigation.myApplications')}</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Card className="bg-secondary/70 border-primary/20 p-6 flex items-start gap-4">
        <div className="p-2 bg-accent-foreground/10 rounded-full mt-1">
          <Lightbulb className="h-6 w-6 text-accent-foreground" />
        </div>
        <div>
            <h3 className="text-xl font-headline font-semibold text-accent-foreground">{t('studentDashboard.proTipTitle')}</h3>
            <p className="text-secondary-foreground/90">
                {t('studentDashboard.proTipContent')}
            </p>
        </div>
      </Card>
    </div>
  );
}
