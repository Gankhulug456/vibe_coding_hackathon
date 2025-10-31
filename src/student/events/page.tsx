
"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar as CalendarIcon, Loader2, MapPin, Users } from "lucide-react";
import { EventCard } from '@/components/EventCard';
import type { Event } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, Timestamp, orderBy, query, where } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";

export default function EventsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const eventsRef = collection(db, "events");
            // The query now only filters by status. Sorting is handled client-side to avoid needing a composite index.
            const q = query(eventsRef, where("status", "==", "approved"));
            const querySnapshot = await getDocs(q);
            const fetchedEvents: Event[] = [];
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data() as Omit<Event, 'id' | 'createdAt' | 'date'> & { createdAt: Timestamp, date: string };
                fetchedEvents.push({ 
                    ...data, 
                    id: docSnap.id,
                    createdAt: data.createdAt.toDate(),
                    date: data.date,
                });
            });
            
            // Sort events by creation date descending after fetching
            const sortedEvents = fetchedEvents.sort((a, b) => {
                const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
                const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
                return dateB - dateA;
            });

            setEvents(sortedEvents);
        } catch (error) {
            console.error("Error fetching events:", error);
            toast({ title: t('messages.errorOccurred'), description: "Failed to fetch events.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    fetchEvents();
  }, [t, toast]);


  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline text-foreground flex items-center justify-center gap-2">
            <CalendarIcon className="h-8 w-8 text-primary" />
            {t('navigation.events')}
        </h1>
        <p className="text-muted-foreground mt-2">{t('events.description')}</p>
      </div>

      <section>
        <h2 className="text-2xl font-bold font-headline mb-4">{t('events.upcomingEvents')}</h2>
        {isLoading ? (
             <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
        ) : events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map(event => (
                    <EventCard key={event.id} event={event} onViewDetails={handleViewDetails} />
                ))}
            </div>
        ) : (
            <div className="text-center py-12 bg-card rounded-lg shadow-sm">
              <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground">{t('messages.noEventsFound')}</p>
            </div>
        )}
      </section>

      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={(isOpen) => !isOpen && setSelectedEvent(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader className="pr-6">
               <Image 
                  src={selectedEvent.imageUrl} 
                  alt={selectedEvent.title} 
                  width={600} 
                  height={300} 
                  className="rounded-lg object-cover w-full h-40 mb-4"
                  data-ai-hint="event banner"
                />
              <DialogTitle className="text-2xl font-headline">{selectedEvent.title}</DialogTitle>
              <div className="space-y-2 text-base text-muted-foreground">
                    <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> {t('events.hostedBy', { host: selectedEvent.companyName })}</div>
                    <div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-primary" /> {new Date(selectedEvent.date).toLocaleDateString()}</div>
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {selectedEvent.location}</div>
                    <Badge variant="outline" className="w-fit">{t(`eventTypes.${selectedEvent.type.toLowerCase().replace(' ', '')}`, { defaultValue: selectedEvent.type })}</Badge>
                </div>
            </DialogHeader>
            <div className="py-4 text-sm text-foreground max-h-[200px] overflow-y-auto pr-2">
              <p>{selectedEvent.description}</p>
            </div>
            <DialogFooter>
              <Button asChild className="w-full">
                <Link href={selectedEvent.link} target="_blank" rel="noopener noreferrer">
                  {t('events.registerNow')}
                </Link>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
