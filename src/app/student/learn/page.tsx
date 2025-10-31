
"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, Loader2 } from "lucide-react";
import { LearnCard } from '@/components/LearnCard';
import type { LearnResource } from '@/types';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, Timestamp, orderBy, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function LearnCenterPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [resources, setResources] = useState<LearnResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      setIsLoading(true);
      try {
        const resourcesRef = collection(db, "learn_resources");
        const q = query(resourcesRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedResources = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: (doc.data().createdAt as Timestamp)?.toDate()
        } as LearnResource));
        setResources(fetchedResources);
      } catch (error) {
        console.error("Error fetching learn resources:", error);
        toast({ title: "Error", description: "Could not fetch learning resources.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchResources();
  }, [toast]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline text-foreground flex items-center justify-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            {t('navigation.learnCenter')}
        </h1>
        <p className="text-muted-foreground mt-2">{t('learnCenter.description')}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : resources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map(resource => (
            <LearnCard key={resource.id} resource={resource} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
            <p>{t('messages.noContentFound') || "No learning materials have been added yet."}</p>
        </div>
      )}
    </div>
  );
}
