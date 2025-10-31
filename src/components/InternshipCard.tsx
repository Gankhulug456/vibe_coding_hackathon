
"use client";

import type { Internship } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, CalendarDays, MapPin, ExternalLink, Bookmark, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface InternshipCardProps {
  internship: Internship;
  onSave?: (internshipId: string) => void;
  onApply?: (internshipUrl: string) => void;
  isSaved?: boolean;
}

export function InternshipCard({ internship, onSave, onApply, isSaved }: InternshipCardProps) {
  const { t } = useLanguage();

  const timeDiff = new Date(internship.deadline).getTime() - new Date().getTime();
  const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  let deadlineTextKey: string;
  let deadlineReplacements: Record<string, string> | undefined;
  let deadlineColorClass = "bg-muted text-muted-foreground";

  if (daysLeft < 0) {
    deadlineTextKey = "deadlines.passed";
    deadlineColorClass = "bg-destructive/20 text-destructive-foreground";
  } else if (daysLeft <= 7) {
    deadlineTextKey = daysLeft > 1 ? "deadlines.daysLeftPlural" : "deadlines.daysLeft";
    deadlineReplacements = { days: daysLeft.toString() };
    deadlineColorClass = "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
  } else {
    deadlineTextKey = ""; // Will use formatted date directly
  }
  const deadlineDisplay = deadlineTextKey ? t(deadlineTextKey, deadlineReplacements) : new Date(internship.deadline).toLocaleDateString();

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-headline mb-1">{internship.title}</CardTitle>
            <CardDescription className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4" /> {internship.company}
            </CardDescription>
          </div>
          {internship.companyLogo && (
             <Image 
                src={internship.companyLogo} 
                alt={t('labels.company') + ' ' + internship.company + ' logo'}
                width={48}
                height={48}
                className="rounded-md object-contain"
                data-ai-hint="company logo"
              />
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 text-sm">
         <div className="flex items-start gap-2 flex-wrap">
            {internship.employmentType && (
                <Badge variant="secondary" className="text-xs">{t(`labels.employmentTypes.${internship.employmentType.toLowerCase().replace('-', '') as 'internship' | 'fulltime' | 'parttime'}`, { defaultValue: internship.employmentType })}</Badge>
            )}
            <Badge variant="outline" className="text-xs">{t(`filter.${internship.type.toLowerCase() as 'local' | 'remote' | 'international'}`)}</Badge>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" /> <span>{internship.location}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="h-4 w-4" /> 
          <Badge variant="outline" className={cn("text-xs font-normal", deadlineColorClass)}>{deadlineDisplay}</Badge>
        </div>
        <p className="text-muted-foreground line-clamp-3">
          {internship.description}
        </p>
        {internship.tags && internship.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {internship.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
            {internship.tags.length > 3 && <Badge variant="secondary" className="text-xs">+{internship.tags.length - 3}</Badge>}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row sm:flex-wrap gap-2 pt-4 border-t">
        {onSave && (
          <Button 
            variant={isSaved ? "secondary" : "outline"} 
            size="sm" 
            className="w-full sm:w-auto" 
            onClick={() => onSave(internship.id!)}
          >
            {isSaved ? <CheckCircle className="mr-2 h-4 w-4" /> : <Bookmark className="mr-2 h-4 w-4" />}
            {isSaved ? t('buttons.saved') : t('buttons.save')}
          </Button>
        )}
         <Button asChild size="sm" className="w-full sm:w-auto flex-grow">
            <Link href={`/student/internships/${internship.id}`}>{t('buttons.viewDetails')}</Link>
        </Button>
        {onApply && (
          <Button 
            variant="default" 
            size="sm" 
            className="w-full sm:w-auto"
            onClick={() => onApply(internship.url)}
          >
            <ExternalLink className="mr-2 h-4 w-4" /> {t('buttons.apply')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
