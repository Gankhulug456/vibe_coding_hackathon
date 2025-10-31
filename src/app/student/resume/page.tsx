"use client";

import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { FileEdit, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ResumeBuilderSkeleton = () => (
  <div className="space-y-6">
    <div className="flex justify-between">
      <Skeleton className="h-10 w-1/4" />
      <Skeleton className="h-10 w-1/4" />
    </div>
    <div className="space-y-4 rounded-lg border p-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-4 rounded-lg border p-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-24 w-full" />
    </div>
  </div>
);

const ResumeAnalyzerSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-32 w-full rounded-lg" />
    <Skeleton className="h-40 w-full rounded-lg" />
  </div>
);

const DynamicResumeBuilder = dynamic(
  () => import("@/components/ResumeBuilder").then((mod) => mod.ResumeBuilder),
  {
    loading: () => <ResumeBuilderSkeleton />,
    ssr: false,
  }
);

const DynamicResumeAnalyzer = dynamic(
  () => import("@/components/ResumeAnalyzer").then((mod) => mod.ResumeAnalyzer),
  {
    loading: () => <ResumeAnalyzerSkeleton />,
    ssr: false,
  }
);

export default function ResumePage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline text-foreground">
          {t("navigation.resumeAnalyzer")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("resume.pageDescription")}
        </p>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">
            <FileEdit className="mr-2 h-4 w-4" />
            {t("resume.tabs.create")}
          </TabsTrigger>
          <TabsTrigger value="analyze">
            <Sparkles className="mr-2 h-4 w-4" />
            {t("resume.tabs.analyze")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("resume.create.title")}</CardTitle>
              <CardDescription>
                {t("resume.create.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DynamicResumeBuilder />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analyze" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("resume.analyze.title")}</CardTitle>
              <CardDescription>
                {t("resume.analyze.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DynamicResumeAnalyzer />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
