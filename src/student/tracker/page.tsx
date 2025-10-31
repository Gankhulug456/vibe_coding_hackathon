
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { Application, ApplicationStatus } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit2, Trash2, ListFilter, Search, FileText, Circle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp, type FieldValue } from 'firebase/firestore';
import { useNotification } from '@/contexts/NotificationContext';

const statusColors: Record<ApplicationStatus, string> = {
  Saved: 'bg-blue-100 text-blue-700 border-blue-300',
  Applied: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  Reviewed: 'bg-sky-100 text-sky-700 border-sky-300',
  Interviewing: 'bg-purple-100 text-purple-700 border-purple-300',
  Offered: 'bg-green-100 text-green-700 border-green-300',
  Rejected: 'bg-red-100 text-red-700 border-red-300',
  Accepted: 'bg-teal-100 text-teal-700 border-teal-300',
  Waitlisted: 'bg-indigo-100 text-indigo-700 border-indigo-300',
};

const statusOptions: ApplicationStatus[] = ['Saved', 'Applied', 'Interviewing', 'Offered', 'Rejected', 'Accepted', 'Reviewed', 'Waitlisted'];

const LOCAL_STORAGE_LAST_VIEWED_PREFIX = 'lastViewedAppDetail_';

export default function ApplicationTrackerPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user: studentUser } = useAuth();
  const { addNotification } = useNotification();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'All'>('All');
  const [editingApplication, setEditingApplication] = useState<Partial<Application> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatedApplicationIds, setUpdatedApplicationIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchApplications = async () => {
      if (!studentUser) return;
      setIsLoading(true);
      try {
        const appsRef = collection(db, "applications");
        const q = query(appsRef, where("userId", "==", studentUser.uid));
        const querySnapshot = await getDocs(q);
        const fetchedApps: Application[] = [];
        const newUpdatedIds = new Set<string>();

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as Omit<Application, 'id' | 'appliedAt' | 'updatedAt'> & { appliedAt: Timestamp, updatedAt: Timestamp };
          const app: Application = {
            ...data,
            id: docSnap.id,
            appliedAt: data.appliedAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
          };
          fetchedApps.push(app);

          // Check for updates
          const lastViewedStorageKey = `${LOCAL_STORAGE_LAST_VIEWED_PREFIX}${app.id}`;
          const lastViewedTimestamp = localStorage.getItem(lastViewedStorageKey);
          
          if (app.updatedAt && app.id) {
            if (lastViewedTimestamp) {
              if (app.updatedAt.getTime() > new Date(lastViewedTimestamp).getTime()) {
                newUpdatedIds.add(app.id);
              }
            } else if (app.status !== 'Saved') { 
              // If never viewed and not just 'Saved' by student, consider it updated by org
              newUpdatedIds.add(app.id);
            }
          }
        });
        setApplications(fetchedApps.sort((a,b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
        setUpdatedApplicationIds(newUpdatedIds);
      } catch (error) {
        console.error("Error fetching applications:", error);
        toast({ title: t('messages.errorOccurred'), description: "Failed to fetch applications.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchApplications();
  }, [studentUser, t, toast]);

  const filteredApplications = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return applications
      .filter(app => {
        const matchesSearch = 
          app.internshipTitle.toLowerCase().includes(lowerSearchTerm) ||
          app.companyName.toLowerCase().includes(lowerSearchTerm);
        const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [applications, searchTerm, statusFilter]);

  const handleEdit = (app: Application) => {
    setEditingApplication({...app});
    setIsModalOpen(true);
    if (app.id) {
      localStorage.setItem(`${LOCAL_STORAGE_LAST_VIEWED_PREFIX}${app.id}`, new Date().toISOString());
      setUpdatedApplicationIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(app.id!);
        return newSet;
      });
    }
  };

  const handleDelete = async (app: Application) => {
    if (app.status !== 'Saved') {
         toast({ title: t('messages.errorOccurred'), description: t('messages.deleteSavedOnlyError'), variant: "destructive" });
        return;
    }
    if (window.confirm(t('messages.confirmDelete'))) {
      try {
        await deleteDoc(doc(db, "applications", app.id!));
        setApplications(prev => prev.filter(item => item.id !== app.id!));
        localStorage.removeItem(`${LOCAL_STORAGE_LAST_VIEWED_PREFIX}${app.id}`);
        setUpdatedApplicationIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(app.id!);
            return newSet;
        });
        toast({ title: t('messages.applicationDeleted'), description: t('messages.applicationDeletedSuccess') });
      } catch (error) {
        console.error("Error deleting application:", error);
        toast({ title: t('messages.errorOccurred'), description: "Failed to delete application.", variant: "destructive" });
      }
    }
  };
  
  const handleSave = async () => {
    if (!editingApplication || !studentUser) return;
    
    if (!editingApplication.internshipTitle || !editingApplication.companyName) {
        toast({ title: t('messages.errorOccurred'), description: t('messages.errorRequiredTitleCompany'), variant: "destructive"});
        return;
    }

    const originalApp = applications.find(app => app.id === editingApplication.id);
    let dataToUpdate: Partial<Omit<Application, 'id'|'applicantDetails'|'userId'|'organizationId'|'internshipId'>> & {updatedAt: FieldValue};
    
    if (editingApplication.id && originalApp && originalApp.status !== 'Saved') {
      // If application is not 'Saved', student can only update notes
      dataToUpdate = {
        notes: editingApplication.notes,
        updatedAt: serverTimestamp(),
      };
    } else {
      // If 'Saved' or new application, student can edit all fields
      dataToUpdate = {
        internshipTitle: editingApplication.internshipTitle,
        companyName: editingApplication.companyName,
        status: editingApplication.status,
        notes: editingApplication.notes,
        appliedAt: editingApplication.appliedAt instanceof Date 
          ? editingApplication.appliedAt 
          : (originalApp?.appliedAt || serverTimestamp()),
        updatedAt: serverTimestamp(),
      };
    }
    
    try {
      if (editingApplication.id) { 
        await updateDoc(doc(db, "applications", editingApplication.id), dataToUpdate);
        
        setApplications(prev => prev.map(app => {
          if (app.id === editingApplication.id) {
            const updatedAppData = { 
              ...app, 
              ...dataToUpdate, 
              updatedAt: new Date() 
            } as Application;
            localStorage.setItem(`${LOCAL_STORAGE_LAST_VIEWED_PREFIX}${app.id}`, new Date().toISOString());
            setUpdatedApplicationIds(prevIds => {
              const newSet = new Set(prevIds);
              newSet.delete(app.id!);
              return newSet;
            });
            return updatedAppData;
          }
          return app;
        }));
        toast({ title: t('messages.applicationUpdated'), description: t('messages.applicationUpdatedSuccess') });
        addNotification({
            titleKey: "notifications.appUpdatedStudent.title",
            descriptionKey: t("notifications.appUpdatedStudent.description", { internshipTitle: editingApplication.internshipTitle! }),
            link: `/student/tracker`
        });

      } else { 
        const fullNewApplicationData = {
          userId: studentUser.uid,
          organizationId: editingApplication.organizationId || 'manual_entry', 
          internshipId: editingApplication.internshipId || 'manual_entry',
          applicantDetails: { 
            uid: studentUser.uid,
            name: studentUser.name,
            email: studentUser.email,
            university: studentUser.university || null,
            major: studentUser.major || null,
            skills: studentUser.skills,
            interests: studentUser.interests,
            phoneNumber: studentUser.phoneNumber || null,
          },
          internshipTitle: editingApplication.internshipTitle!,
          companyName: editingApplication.companyName!,
          status: editingApplication.status || 'Saved',
          notes: editingApplication.notes,
          appliedAt: editingApplication.appliedAt || serverTimestamp(), 
          updatedAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, "applications"), fullNewApplicationData);
        const newApp = { 
            ...fullNewApplicationData,
            id: docRef.id, 
            appliedAt: editingApplication.appliedAt instanceof Date ? editingApplication.appliedAt : new Date(), 
            updatedAt: new Date() 
        } as Application;
        setApplications(prev => [newApp, ...prev]);
        localStorage.setItem(`${LOCAL_STORAGE_LAST_VIEWED_PREFIX}${docRef.id}`, new Date().toISOString());
        toast({ title: t('messages.applicationAdded'), description: t('messages.applicationAddedSuccess') });
         addNotification({
            titleKey: "notifications.appAddedStudent.title",
            descriptionKey: t("notifications.appAddedStudent.description", { internshipTitle: newApp.internshipTitle }),
            link: `/student/tracker`
        });
      }
      setIsModalOpen(false);
      setEditingApplication(null);
    } catch (error) {
        console.error("Error saving application:", error);
        toast({ title: t('messages.errorOccurred'), description: "Failed to save application.", variant: "destructive"});
    }
  };

  const openAddModal = () => {
    setEditingApplication({ 
        internshipTitle: '', companyName: '', 
        status: 'Saved', notes: '', 
        appliedAt: new Date(), 
    });
    setIsModalOpen(true);
  };

  if (isLoading && !studentUser) {
     return <div className="flex justify-center items-center h-full">{t('general.loading')}</div>;
  }

  const isModalFormReadOnly = editingApplication?.id && editingApplication?.status !== 'Saved';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline text-foreground">{t('headings.applicationTracker')}</h1>
        <p className="text-muted-foreground">{t('studentPages.trackerDescription')}</p>
      </div>

      <Button onClick={openAddModal} disabled={!studentUser}>
        <PlusCircle className="mr-2 h-4 w-4" /> {t('buttons.addApplication')}
      </Button>

      <div className="p-4 bg-card rounded-lg shadow-sm space-y-4 md:flex md:items-center md:justify-between md:space-y-0">
        <div className="relative flex-grow md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('placeholders.searchByTitleCompany')}
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex items-center gap-2">
            <ListFilter className="h-5 w-5 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t('placeholders.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">{t('filter.allStatuses')}</SelectItem>
                {statusOptions.map(status => (
                  <SelectItem key={status} value={status}>{t(`labels.statusTypes.${status.toLowerCase()}`, {defaultValue: status})}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
      </div>

      {isLoading ? (
         <div className="flex justify-center items-center h-64">{t('general.loading')}</div>
      ) : filteredApplications.length > 0 ? (
        <Card className="shadow-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">{t('labels.title')}</TableHead>
              <TableHead className="font-semibold">{t('labels.company')}</TableHead>
              <TableHead className="font-semibold">{t('labels.status')}</TableHead>
              <TableHead className="font-semibold">{t('labels.lastUpdated')}</TableHead>
              <TableHead className="font-semibold text-right">{t('labels.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications.map((app) => (
              <TableRow 
                key={app.id} 
                onClick={() => handleEdit(app)} 
                className="hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {updatedApplicationIds.has(app.id!) && (
                      <Circle className="h-2.5 w-2.5 fill-blue-500 text-blue-500" />
                    )}
                    {app.internshipTitle}
                  </div>
                </TableCell>
                <TableCell>{app.companyName}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`${statusColors[app.status || 'Saved']} text-xs`}>{t(`labels.statusTypes.${(app.status || 'Saved').toLowerCase()}`, {defaultValue: app.status || 'Saved'})}</Badge>
                </TableCell>
                <TableCell>{new Date(app.updatedAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(app);}} title={t('headings.editApplication')}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(app);}} className="text-destructive hover:text-destructive/80" title={t('messages.applicationDeleted')} disabled={app.status !== 'Saved'}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </Card>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg shadow-sm">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">{searchTerm || statusFilter !== 'All' ? t('messages.noInternshipsFound') : t('messages.noApplicationsTracked')}</p>
          <p className="text-sm text-muted-foreground mt-2">{!(searchTerm || statusFilter !== 'All') ? t('studentPages.trackerDescription') : ""}</p>
        </div>
      )}

      {isModalOpen && editingApplication && (
        <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
          setIsModalOpen(isOpen);
          if (!isOpen) setEditingApplication(null);
        }}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="font-headline">{editingApplication.id ? t('headings.editApplication') : t('headings.addNewApplication')}</DialogTitle>
              <DialogDescription>
                {editingApplication.id ? t('studentPages.dialogEditAppDescription') : t('studentPages.dialogAddAppDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">{t('labels.title')}</Label>
                <Input 
                  id="title" 
                  value={editingApplication.internshipTitle || ''} 
                  onChange={(e) => setEditingApplication({...editingApplication, internshipTitle: e.target.value})} 
                  className="col-span-3"
                  disabled={isModalFormReadOnly} 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="company" className="text-right">{t('labels.company')}</Label>
                <Input 
                  id="company" 
                  value={editingApplication.companyName || ''} 
                  onChange={(e) => setEditingApplication({...editingApplication, companyName: e.target.value})} 
                  className="col-span-3"
                  disabled={isModalFormReadOnly}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">{t('labels.status')}</Label>
                <Select 
                  value={editingApplication.status || 'Saved'} 
                  onValueChange={(value: ApplicationStatus) => setEditingApplication({...editingApplication, status: value, updatedAt: new Date() as any })}
                  disabled={isModalFormReadOnly}
                >
                    <SelectTrigger className="col-span-3" disabled={isModalFormReadOnly}>
                        <SelectValue placeholder={t('placeholders.filterByStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                        {statusOptions.map(status => (
                        <SelectItem key={status} value={status}>{t(`labels.statusTypes.${status.toLowerCase()}`, {defaultValue: status})}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">{t('labels.notes')}</Label>
                <Textarea 
                  id="notes" 
                  value={editingApplication.notes || ''} 
                  onChange={(e) => setEditingApplication({...editingApplication, notes: e.target.value, updatedAt: new Date() as any})} 
                  className="col-span-3 min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">{t('buttons.cancel')}</Button>
              </DialogClose>
              <Button type="button" onClick={handleSave}>{t('buttons.save')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
