
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export interface ClubItem {
  id: string;
  nameKey: string;
  descriptionKey: string;
  avatarUrl: string;
  membersCount: number;
  link: string;
}

interface ClubCardProps {
  club: ClubItem;
}

export function ClubCard({ club }: ClubCardProps) {
  const { t } = useLanguage();
  const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).join('').toUpperCase() || 'C';
  const clubName = t(club.nameKey);

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex-row items-center gap-4">
        <Avatar className="h-14 w-14 border">
          <AvatarImage src={club.avatarUrl} alt={clubName} data-ai-hint="club logo" />
          <AvatarFallback>{getInitials(clubName)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="font-headline text-lg">{clubName}</CardTitle>
          <CardDescription className="flex items-center gap-1 text-xs">
            <Users className="h-3 w-3" />
            {club.membersCount} {t('eventsAndClubs.members')}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {t(club.descriptionKey)}
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild size="sm" variant="secondary" className="w-full">
          <Link href={club.link} target="_blank" rel="noopener noreferrer">
            {t('eventsAndClubs.joinClub')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
