
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Event } from '@/types';

interface EventCardProps {
  event: Event;
  onViewDetails: (event: Event) => void;
}

export function EventCard({ event, onViewDetails }: EventCardProps) {
  const { t } = useLanguage();

  return (
    <Card 
      className="shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col cursor-pointer"
      onClick={() => onViewDetails(event)}
    >
      <CardHeader>
        <Badge variant="outline" className="w-fit mb-2">{t(`eventTypes.${event.type.toLowerCase().replace(' ', '')}`, { defaultValue: event.type })}</Badge>
        <CardTitle className="font-headline text-lg">{event.title}</CardTitle>
        <CardDescription>{t('eventsAndClubs.hostedBy', { host: event.companyName })}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground flex-grow">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{new Date(event.date).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>{event.location}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" asChild>
           <div className="flex items-center justify-center w-full">
            {t('buttons.viewDetails')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </div>
        </Button>
      </CardFooter>
    </Card>
  );
}
