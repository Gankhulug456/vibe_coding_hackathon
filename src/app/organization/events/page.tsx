
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Event } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIconUI } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, PlusCircle, Edit2, Trash2, Calendar, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp, Timestamp, orderBy } from 'firebase/firestore';
import { format, formatISO } from "date-fns";
import { cn } from "@/lib/utils";

const eventSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  description: z.string().min(20, "Description must be at least 20 characters."),
  date: z.date({ required_error: "Event date is required."}),
  location: z.string().min(3, "Location is required."),
  type: z.enum(['Workshop', 'Webinar', 'Career Fair'], { required_error: "Event type is required."}),
  imageUrl: z.string().url({ message: "Please enter a valid image URL." }).optional().or(z.literal('')),
  link: z.string().url({ message: "Please enter a valid registration link URL." }),
});

type EventFormValues = z.infer<typeof eventSchema>;

const statusColors: Record<Event['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  approved: 'bg-green-100 text-green-700 border-green-300',
  rejected: 'bg-red-100 text-red-700 border-red-300',
};

export default function ManageEventsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user: orgUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      date: undefined,
      location: '',
      type: undefined,
      imageUrl: '',
      link: '',
    },
  });
  const { register, handleSubmit, control, formState: { errors }, reset } = form;

  useEffect(() => {
    const fetchEvents = async () => {
      if (!orgUser) return;
      setIsLoading(true);
      try {
        const eventsRef = collection(db, "events");
        const q = query(eventsRef, where("postedBy", "==", orgUser.uid));
        const querySnapshot = await getDocs(q);
        const fetchedEvents: Event[] = querySnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: (docSnap.data().createdAt as Timestamp).toDate(),
        } as Event)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
        toast({ title: t('messages.errorOccurred'), description: "Failed to fetch your events.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, [orgUser, t, toast]);

  const onSubmit = async (data: EventFormValues) => {
    if (!orgUser) return;
    setIsSubmitting(true);
    try {
      const newEvent: Omit<Event, 'id' | 'createdAt'> = {
        title: data.title,
        description: data.description,
        date: formatISO(data.date),
        location: data.location,
        type: data.type,
        imageUrl: data.imageUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(data.title)}`,
        link: data.link,
        companyName: orgUser.organizationName || orgUser.name,
        postedBy: orgUser.uid,
        status: 'pending' as const,
      };

      const docRef = await addDoc(collection(db, "events"), {
        ...newEvent,
        createdAt: serverTimestamp(),
      });
      
      setEvents(prev => [{...newEvent, id: docRef.id, createdAt: new Date()}, ...prev]);
      toast({ title: t('messages.eventCreated'), description: t('messages.eventPendingReview', { title: data.title }) });
      reset();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating event:", error);
      toast({ title: t('messages.errorOccurred'), description: "Failed to create event.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(t('messages.confirmDeleteEvent', { title }))) {
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
        <h1 className="text-3xl font-bold font-headline text-foreground">{t('headings.manageEvents')}</h1>
        <p className="text-muted-foreground">{t('organizationPages.eventsDescription')}</p>
      </div>

      <div className="flex justify-end">
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> {t('buttons.createEvent')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t('dialogs.createEvent.title')}</DialogTitle>
                    <DialogDescription>{t('dialogs.createEvent.description')}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">{t('labels.eventTitle')}</Label>
                        <Input id="title" {...register('title')} placeholder={t('placeholders.eventTitleExample')} />
                        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description">{t('labels.description')}</Label>
                        <Textarea id="description" {...register('description')} className="min-h-[100px]" />
                        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="date">{t('labels.eventDate')}</Label>
                            <Controller
                                name="date"
                                control={control}
                                render={({ field }) => (
                                    <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                        variant={"outline"}
                                        className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                                        >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(field.value, "PPP") : <span>{t('placeholders.pickDate')}</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <CalendarIconUI mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                    </PopoverContent>
                                    </Popover>
                                )}
                            />
                            {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">{t('labels.eventLocation')}</Label>
                            <Input id="location" {...register('location')} placeholder={t('placeholders.eventLocationExample')} />
                            {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="type">{t('labels.eventType')}</Label>
                        <Controller
                            name="type"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger id="type"><SelectValue placeholder={t('placeholders.selectEventType')} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Workshop">{t('eventTypes.workshop')}</SelectItem>
                                        <SelectItem value="Webinar">{t('eventTypes.webinar')}</SelectItem>
                                        <SelectItem value="Career Fair">{t('eventTypes.careerfair')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="imageUrl">{t('labels.eventImageUrl')}</Label>
                        <Input id="imageUrl" type="url" {...register('imageUrl')} placeholder={t('placeholders.eventImageUrlExample')} />
                        {errors.imageUrl && <p className="text-sm text-destructive">{errors.imageUrl.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="link">{t('labels.eventLink')}</Label>
                        <Input id="link" type="url" {...register('link')} placeholder={t('placeholders.eventLinkExample')} />
                        {errors.link && <p className="text-sm text-destructive">{errors.link.message}</p>}
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{t('buttons.cancel')}</Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('buttons.submit')}
                      </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>

       <Card className="shadow-md">
        <CardHeader>
            <CardTitle>{t('headings.yourEvents')}</CardTitle>
        </CardHeader>
        <CardContent>
        {isLoading ? (
            <div className="text-center py-12">{t('general.loading')}</div>
        ) : events.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('labels.title')}</TableHead>
                <TableHead>{t('labels.date')}</TableHead>
                <TableHead>{t('labels.status')}</TableHead>
                <TableHead className="text-right">{t('labels.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                   <TableCell>
                     <Badge variant="outline" className={`${statusColors[event.status || 'pending']} text-xs`}>
                      {t(`labels.statusTypes.${(event.status || 'pending').toLowerCase()}`, {defaultValue: event.status || 'pending'})}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => {}} title={t('headings.editApplication')} disabled={event.status === 'approved'}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id!, event.title)} className="text-destructive hover:text-destructive/80" title={t('buttons.delete')}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
            <div className="text-center py-12 bg-muted/50 rounded-lg">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground">{t('messages.noEventsFoundOrg')}</p>
                <p className="text-sm text-muted-foreground mt-2">{t('messages.postEventFirst')}</p>
            </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
