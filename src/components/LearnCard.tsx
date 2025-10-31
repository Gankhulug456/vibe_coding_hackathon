
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import type { LearnResource } from '@/types';

interface LearnCardProps {
  resource: LearnResource;
}

export function LearnCard({ resource }: LearnCardProps) {
  const { t, language } = useLanguage();

  const title = language === 'mn' ? resource.title_mn : resource.title_en;
  const description = language === 'mn' ? resource.description_mn : resource.description_en;

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <CardHeader className="p-0">
        <Link href={`/student/learn/${resource.id}`} className="block">
          <Image
            src={resource.imageUrl}
            alt={title}
            width={600}
            height={300}
            className="object-cover w-full h-48"
            data-ai-hint="learning career"
          />
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow space-y-3">
        <div className="flex flex-wrap gap-1">
          {resource.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
        </div>
        <CardTitle className="text-xl font-headline line-clamp-2 min-h-[3.5rem]">
            <Link href={`/student/learn/${resource.id}`} className="hover:text-primary transition-colors">
                {title}
            </Link>
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm line-clamp-3 min-h-[3.75rem]">
          {description}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-4 border-t mt-auto">
        <Button asChild size="sm" className="w-full">
          <Link href={`/student/learn/${resource.id}`}>
            {t('learnCenter.readMore')} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
