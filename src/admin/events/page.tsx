
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Event } from "@/types";
import { useState, useMemo, useEffect } from "react";
import { Trash2, Search, ShieldAlert, Calendar, CheckCircle, XCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, deleteDoc, doc, updateDoc, Timestamp, orderBy, query } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<Event['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  approved: 'bg-green-100 text-green-700 border-green-300',
  rejected: 'bg-red-100 text-red-700 border-red-300',
};

export default function ManageAllEventsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const eventsRef = collection(db, "events");
            const q = query(eventsRef, orderBy("createdAt", "desc"));
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
            setEvents(fetchedEvents);
        } catch (error) {
            console.error("Error fetching events:", error);
            toast({ title: t('messages.errorOccurred'), description: "Failed to fetch events.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    fetchEvents();
  }, [t, toast]);

  const filteredEvents = useMemo(() => {
    return events.filter(event =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.postedBy && event.postedBy.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [events, searchTerm]);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
        const eventDocRef = doc(db, "events", id);
        await updateDoc(eventDocRef, { status: status });
        setEvents(prev => prev.map(event => 
            event.id === id ? { ...event, status: status } : event
        ));
        toast({ title: t('messages.eventStatusUpdated'), description: status === 'approved' ? t('messages.eventApproved') : t('messages.eventRejected') });
    } catch (error) {
        console.error("Error updating event status:", error);
        toast({ title: t('messages.errorOccurred'), description: "Failed to update status.", variant: "destructive" });
    }
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    if (window.confirm(t('messages.confirmDeleteEvent', {title: title}))) {
        try {
            await deleteDoc(doc(db, "events", id));
            setEvents(prev => prev.filter(event => event.id !== id));
            toast({ title: t('messages.eventDeleted'), description: t('messages.eventDeletedSuccess', { title }), variant: "destructive" });
        } catch (error) {
            console.error("Error deleting event:", error);
            toast({ title: t('messages.errorOccurred'), description: "Failed to delete event.", variant: "destructive" });
        }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline text-foreground">{t('adminPages.eventsAdminView')}</h1>
        <p className="text-muted-foreground">{t('adminPages.eventsAdminDescription')}</p>
      </div>

       <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('headings.allEventsListings')}</CardTitle>
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                type="search"
                placeholder={t('placeholders.searchByTitleCompanyPoster')}
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center h-48">{t('general.loading')}</div>
          ) : filteredEvents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('labels.title')}</TableHead>
                  <TableHead>{t('labels.company')}</TableHead>
                  <TableHead>{t('labels.status')}</TableHead>
                  <TableHead className="text-right">{t('labels.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{event.companyName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${statusColors[event.status || 'pending']} text-xs`}>
                        {t(`labels.statusTypes.${(event.status || 'pending').toLowerCase()}`, {defaultValue: event.status || 'pending'})}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {event.status === 'pending' && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleUpdateStatus(event.id!, 'approved')} className="text-green-600 hover:text-green-700" title={t('buttons.approve')}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleUpdateStatus(event.id!, 'rejected')} className="text-destructive hover:text-destructive/80" title={t('buttons.reject')}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteEvent(event.id!, event.title)} className="text-destructive hover:text-destructive/80" title={t('buttons.delete')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('messages.noEventsFoundAdmin')}</p>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">
        <div className="flex">
          <div className="py-1"><ShieldAlert className="h-5 w-5 text-red-500 mr-3" /></div>
          <div>
            <p className="font-bold">{t('headings.adminControl')}</p>
            <p className="text-sm">{t('messages.adminEventsCaution')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
