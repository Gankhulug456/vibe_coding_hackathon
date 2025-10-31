
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Internship } from "@/types";
import { useState, useMemo, useEffect } from "react";
import { CheckCircle, XCircle, Search, Eye, ShieldAlert, Loader2, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, doc, updateDoc, Timestamp, query, orderBy, deleteDoc } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<Internship['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  approved: 'bg-green-100 text-green-700 border-green-300',
  rejected: 'bg-red-100 text-red-700 border-red-300',
};

export default function ManageAllInternshipsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchInternships = async () => {
        setIsLoading(true);
        try {
            const internshipsRef = collection(db, "internships");
            const q = query(internshipsRef, orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const fetchedInternships: Internship[] = querySnapshot.docs.map(docSnap => ({
              id: docSnap.id,
              ...docSnap.data(),
              createdAt: (docSnap.data().createdAt as Timestamp).toDate(),
            } as Internship));
            setInternships(fetchedInternships);
        } catch (error) {
            console.error("Error fetching internships:", error);
            toast({ title: t('messages.errorOccurred'), description: "Failed to fetch internships.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    fetchInternships();
  }, [t, toast]);


  const filteredInternships = useMemo(() => {
    return internships.filter(internship =>
      internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      internship.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (internship.postedBy && (internship.postedBy.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [internships, searchTerm]);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
        const internshipDocRef = doc(db, "internships", id);
        await updateDoc(internshipDocRef, { status: status });
        setInternships(prev => prev.map(internship => 
            internship.id === id ? { ...internship, status: status } : internship
        ));
        toast({ title: t('messages.internshipStatusUpdated'), description: status === 'approved' ? t('messages.internshipApproved') : t('messages.internshipRejected') });
    } catch (error) {
        console.error("Error updating internship status:", error);
        toast({ title: t('messages.errorOccurred'), description: "Failed to update status.", variant: "destructive" });
    }
  };
  
  const handleDeleteInternship = async (id: string, title: string) => {
    if (window.confirm(t('messages.confirmDeleteInternship', { title: title}))) {
      try {
        await deleteDoc(doc(db, "internships", id));
        setInternships(prev => prev.filter(internship => internship.id !== id));
        toast({ title: t('messages.internshipDeleted'), description: t('messages.internshipDeletedPlatformSuccess', { title: title }), variant: "destructive" });
      } catch (error) {
        console.error("Error deleting internship:", error);
        toast({ title: t('messages.errorOccurred'), description: "Failed to delete internship.", variant: "destructive" });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline text-foreground">{t('adminPages.internshipsAdminView')}</h1>
        <p className="text-muted-foreground">{t('adminPages.internshipsAdminDescription')}</p>
      </div>

       <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('headings.allInternshipListings')}</CardTitle>
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
          ) : filteredInternships.length > 0 ? (
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
                {filteredInternships.map((internship) => (
                  <TableRow key={internship.id}>
                    <TableCell className="font-medium">{internship.title}</TableCell>
                    <TableCell>{internship.company}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${statusColors[internship.status || 'pending']} text-xs`}>
                        {t(`labels.statusTypes.${(internship.status || 'pending').toLowerCase()}`, {defaultValue: internship.status || 'pending'})}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {internship.status === 'pending' && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleUpdateStatus(internship.id!, 'approved')} className="text-green-600 hover:text-green-700" title={t('buttons.approve')}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleUpdateStatus(internship.id!, 'rejected')} className="text-destructive hover:text-destructive/80" title={t('buttons.reject')}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                       <Button variant="ghost" size="icon" onClick={() => handleDeleteInternship(internship.id!, internship.title)} className="text-destructive hover:text-destructive/80" title={t('buttons.delete')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t('messages.noInternshipsFound')}</p>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">
        <div className="flex">
          <div className="py-1"><ShieldAlert className="h-5 w-5 text-red-500 mr-3" /></div>
          <div>
            <p className="font-bold">{t('headings.adminControl')}</p>
            <p className="text-sm">{t('messages.adminInternshipsCaution')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
