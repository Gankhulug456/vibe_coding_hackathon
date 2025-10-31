
"use client";

import React, { useState, useEffect } from 'react';
import type { Internship } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit2, Trash2, Eye, PlusCircle, Briefcase } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const statusColors: Record<Internship['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  approved: 'bg-green-100 text-green-700 border-green-300',
  rejected: 'bg-red-100 text-red-700 border-red-300',
};

export default function ManageListingsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const { user: orgUser } = useAuth();
  const [listings, setListings] = useState<Internship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    const fetchListings = async () => {
      if (!orgUser) return;
      setIsLoading(true);
      try {
        const internshipsRef = collection(db, "internships");
        const q = query(internshipsRef, where("postedBy", "==", orgUser.uid));
        const querySnapshot = await getDocs(q);
        const fetchedListings: Internship[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<Internship, 'id' | 'createdAt' | 'deadline'> & { createdAt: Timestamp, deadline: string };
          fetchedListings.push({ 
            ...data, 
            id: doc.id, 
            createdAt: data.createdAt.toDate(),
            deadline: data.deadline, // Keep as string, convert for display
          });
        });
        setListings(fetchedListings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (error) {
        console.error("Error fetching listings:", error);
        toast({ title: t('messages.errorOccurred'), description: "Failed to fetch listings.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [orgUser, t, toast]);

  const handleEdit = (internshipId: string) => {
    // router.push(`/organization/post-job?edit=${internshipId}`); // Full edit page later
    toast({ title: t('headings.editApplication'), description: t('toasts.editInternshipComingSoon', { id: internshipId }) });
  };

  const handleDelete = async (internshipId: string, internshipTitle: string) => {
    if (window.confirm(t('messages.confirmDeleteInternship', { title: internshipTitle}))) {
      try {
        await deleteDoc(doc(db, "internships", internshipId));
        setListings(prev => prev.filter(internship => internship.id !== internshipId));
        toast({ title: t('messages.internshipDeleted'), description: t('messages.internshipDeletedPlatformSuccess', { title: internshipTitle }), variant: "destructive" });
      } catch (error) {
        console.error("Error deleting internship:", error);
        toast({ title: t('messages.errorOccurred'), description: "Failed to delete internship.", variant: "destructive" });
      }
    }
  };

  const handleViewDetails = (internship: Internship) => {
    setSelectedInternship(internship);
    setIsViewModalOpen(true);
  };

  const renderSkeleton = () => (
    <div className="flex justify-center items-center h-48">{t('general.loading')}</div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline text-foreground">{t('headings.yourListings')}</h1>
            <p className="text-muted-foreground">{t('organizationPages.listingsDescription')}</p>
        </div>
        <Button asChild>
          <Link href="/organization/post-job">
            <PlusCircle className="mr-2 h-4 w-4" /> {t('navigation.postNewInternship')}
          </Link>
        </Button>
      </div>

      {isLoading ? (
        renderSkeleton()
      ) : listings.length > 0 ? (
        <Card className="shadow-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">{t('labels.title')}</TableHead>
                <TableHead className="font-semibold">{t('labels.deadline')}</TableHead>
                <TableHead className="font-semibold">{t('labels.status')}</TableHead>
                <TableHead className="font-semibold text-right">{t('labels.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((internship) => (
                <TableRow key={internship.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{internship.title}</TableCell>
                  <TableCell>{new Date(internship.deadline).toLocaleDateString()}</TableCell>
                  <TableCell>
                     <Badge variant="outline" className={`${statusColors[internship.status || 'pending']} text-xs`}>
                      {t(`labels.statusTypes.${(internship.status || 'pending').toLowerCase()}`, {defaultValue: internship.status || 'pending'})}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleViewDetails(internship)} title={t('buttons.viewDetails')}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(internship.id!)} title={t('headings.editApplication')} disabled={internship.status === 'approved'}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(internship.id!, internship.title)} className="text-destructive hover:text-destructive/80" title={t('messages.internshipDeleted')}>
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
          <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">{t('messages.noListingsFound')}</p>
          <p className="text-sm text-muted-foreground mt-2">{t('messages.postListingFirst')}</p>
           <Button asChild className="mt-4">
              <Link href="/organization/post-job">
                <PlusCircle className="mr-2 h-4 w-4" /> {t('navigation.postNewInternship')}
              </Link>
            </Button>
        </div>
      )}

      {selectedInternship && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">{selectedInternship.title}</DialogTitle>
              <p className="text-sm text-muted-foreground">{selectedInternship.company} - {selectedInternship.location} ({t(`filter.${selectedInternship.type.toLowerCase() as 'local' | 'remote' | 'international'}`)})</p>
            </DialogHeader>
            <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              <p><strong>{t('labels.deadline')}:</strong> {new Date(selectedInternship.deadline).toLocaleDateString()}</p>
              {selectedInternship.applicationMethod === 'externalUrl' && selectedInternship.url && selectedInternship.url !== '#' && (
                <p><strong>{t('labels.url')}:</strong> <a href={selectedInternship.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{selectedInternship.url}</a></p>
              )}
              <p className="font-semibold mt-2">{t('labels.description')}:</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedInternship.description}</p>
              {selectedInternship.tags && selectedInternship.tags.length > 0 && (
                <div>
                  <p className="font-semibold">{t('labels.tags')}:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedInternship.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
