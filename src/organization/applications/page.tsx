
"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Application, Internship, User, ApplicationStatus, ResumeData } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Eye, UserCircle, Briefcase, CalendarDays, Mail, University, Sparkles, Brain, FileText, Users, Phone, CheckCircle, XCircle, Archive, Send, UserCheck, UserX, History, Link as LinkIcon, FolderKanban, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useNotification } from '@/contexts/NotificationContext';
import { Skeleton } from '@/components/ui/skeleton';
import { jsPDF } from 'jspdf';
import { dejavu_sans_normal } from '@/lib/fonts/DejaVuSans';


const statusOptions: ApplicationStatus[] = ['Applied', 'Reviewed', 'Interviewing', 'Offered', 'Rejected', 'Waitlisted', 'Accepted'];
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

export default function ReceivedApplicationsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user: orgUser } = useAuth();
  const { addNotification } = useNotification();
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ titleKey: string; descriptionKey: string; onConfirm: () => void; actionLabelKey: string; actionArgs?: Record<string, string> } | null>(null);
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);


  useEffect(() => {
    const fetchApplications = async () => {
      if (!orgUser) return;
      setIsLoading(true);
      try {
        const appsRef = collection(db, "applications");
        const q = query(appsRef, where("organizationId", "==", orgUser.uid));
        const querySnapshot = await getDocs(q);
        const fetchedApps: Application[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as Omit<Application, 'id'|'appliedAt'|'updatedAt'> & { appliedAt: Timestamp, updatedAt: Timestamp };
          fetchedApps.push({
            ...data,
            id: docSnap.id,
            appliedAt: data.appliedAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
            applicantDetails: data.applicantDetails || { uid: data.userId, name: 'N/A', email: 'N/A' } 
          });
        });
        setApplications(fetchedApps.sort((a,b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
      } catch (error) {
        console.error("Error fetching received applications:", error);
        toast({ title: t('messages.errorOccurred'), description: "Failed to fetch applications.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [orgUser, t, toast]);

  const handleViewDetails = (app: Application) => {
    setSelectedApplication(app);
    setIsViewModalOpen(true);
  };
  
  const updateStatusInFirestore = async (appId: string, newStatus: ApplicationStatus) => {
    if (!selectedApplication || !selectedApplication.userId) return; 
    const applicantName = selectedApplication.applicantDetails?.name || 'Applicant';
    try {
      const appDocRef = doc(db, "applications", appId);
      await updateDoc(appDocRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      
      setApplications(prev => 
        prev.map(app => app.id === appId ? { ...app, status: newStatus, updatedAt: new Date() } : app)
      );
      if (selectedApplication && selectedApplication.id === appId) {
          setSelectedApplication(prev => prev ? {...prev, status: newStatus, updatedAt: new Date()} : null);
      }
      toast({ title: t('labels.status') + " " + t('messages.applicationUpdated'), description: `${t('labels.statusTypes.'+ newStatus.toLowerCase() as any)}` });
      addNotification({
        titleKey: "notifications.appStatusUpdatedOrg.title",
        descriptionKey: t("notifications.appStatusUpdatedOrg.description", { applicantName: applicantName, status: t(`labels.statusTypes.${newStatus.toLowerCase()}`) }),
        link: `/organization/applications` 
      });

      const studentNotificationData = {
        targetUserId: selectedApplication.userId,
        titleKey: 'notifications.appStatusUpdatedByOrg.title',
        descriptionKey: 'notifications.appStatusUpdatedByOrg.description',
        descriptionArgs: {
          internshipTitle: selectedApplication.internshipTitle,
          companyName: selectedApplication.companyName,
          newStatus: t(`labels.statusTypes.${newStatus.toLowerCase()}`),
        },
        link: `/student/tracker`, 
      };
      console.log('[Notification Data for Student]: ', JSON.stringify(studentNotificationData, null, 2));

    } catch (error) {
        console.error("Error updating application status:", error);
        toast({ title: t('messages.errorOccurred'), description: "Failed to update status.", variant: "destructive"});
    }
  };

  const confirmAndUpdateStatus = (newStatus: ApplicationStatus, app: Application | null) => {
    if (!app || !app.id) return;

    let titleKey = 'confirmations.genericTitle';
    let descriptionKey = 'confirmations.genericDescription';
    let actionLabelKey = 'buttons.confirm'; 

    switch(newStatus) {
        case 'Reviewed':
            titleKey = 'confirmations.markReviewed.title';
            descriptionKey = 'confirmations.markReviewed.description';
            actionLabelKey = 'buttons.markAsReviewed';
            break;
        case 'Interviewing':
            titleKey = 'confirmations.offerInterview.title';
            descriptionKey = 'confirmations.offerInterview.description';
            actionLabelKey = 'buttons.offerInterview';
            break;
        case 'Offered':
            titleKey = 'confirmations.makeOffer.title';
            descriptionKey = 'confirmations.makeOffer.description';
            actionLabelKey = 'buttons.makeOffer';
            break;
        case 'Rejected':
            titleKey = 'confirmations.rejectApplication.title';
            descriptionKey = 'confirmations.rejectApplication.description';
            actionLabelKey = 'buttons.rejectApplication';
            break;
        case 'Waitlisted':
            titleKey = 'confirmations.waitlistApplicant.title';
            descriptionKey = 'confirmations.waitlistApplicant.description';
            actionLabelKey = 'buttons.waitlistApplicant';
            break;
        default: 
            titleKey = 'confirmations.updateStatus.title';
            descriptionKey = 'confirmations.updateStatus.description';
            actionLabelKey = 'buttons.updateStatus';
            break;
    }

    setConfirmAction({
        titleKey,
        descriptionKey,
        actionLabelKey,
        actionArgs: { applicantName: app.applicantDetails?.name || 'Applicant', status: t(`labels.statusTypes.${newStatus.toLowerCase()}`) },
        onConfirm: () => updateStatusInFirestore(app.id!, newStatus)
    });
    setIsConfirmModalOpen(true);
  };

  const handleDownloadResume = (resumeData: ResumeData) => {
    if (!resumeData) return;
    setIsGeneratingResume(true);
    
    try {
        const doc = new jsPDF('p', 'pt', 'a4');
        const page = { width: doc.internal.pageSize.getWidth(), height: doc.internal.pageSize.getHeight() };
        const margin = { top: 60, right: 60, bottom: 60, left: 60 };
        const contentWidth = page.width - margin.left - margin.right;
        let y = margin.top;

        doc.addFileToVFS('DejaVuSans.ttf', dejavu_sans_normal);
        doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
        doc.setFont('DejaVuSans');

        doc.setFontSize(24);
        doc.setTextColor(20, 20, 20);
        doc.text(resumeData.contact.name || '', page.width / 2, y, { align: 'center' });
        y += 28;

        const contactInfo = [resumeData.contact.email, resumeData.contact.phone, resumeData.contact.address].filter(Boolean).join('  |  ');
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(contactInfo, page.width / 2, y, { align: 'center' });
        y += 14;

        if (resumeData.contact.linkedin) {
            doc.setTextColor(41, 100, 255);
            doc.textWithLink(resumeData.contact.linkedin, page.width / 2, y, { url: resumeData.contact.linkedin, align: 'center' });
            y += 14;
        }
        
        y += 5;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin.left, y, page.width - margin.right, y);
        y += 25;

        const renderSection = (titleKey: string, items: any[], renderItem: (item: any, startY: number) => number) => {
          if (items && items.length > 0) {
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(20, 20, 20);
            doc.text(t(titleKey).toUpperCase(), margin.left, y);
            y += 4;
            doc.setDrawColor(150, 150, 150);
            doc.line(margin.left, y, page.width - margin.right, y);
            y += 18;
            items.forEach(item => { y = renderItem(item, y); });
          }
        };

        const renderDescriptionList = (text: string, startY: number) => {
            let currentY = startY;
            doc.setFontSize(9.5);
            doc.setTextColor(80, 80, 80);
            const descLines = doc.splitTextToSize(text, contentWidth - 15);
            descLines.forEach((line: string) => {
                if (line.trim()) {
                    doc.text(`•`, margin.left + 5, currentY, {charSpace: 0});
                    doc.text(line.replace(/^- ?/, '').trim(), margin.left + 15, currentY);
                    currentY += 13;
                }
            });
            return currentY;
        };

        renderSection('resume.create.experienceSection', resumeData.experience, (item, startY) => {
            // ... implementation identical to ResumeBuilder
            let currentY = startY;
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(30, 30, 30);
            doc.text(item.jobTitle, margin.left, currentY);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(80, 80, 80);
            doc.text(`${item.startDate} - ${item.endDate}`, page.width - margin.right, currentY, { align: 'right' });
            currentY += 14;
            doc.setFont(undefined, 'normal');
            doc.setTextColor(50, 50, 50);
            doc.text(item.company.toUpperCase(), margin.left, currentY);
            currentY += 14;
            currentY = renderDescriptionList(item.description, currentY);
            currentY += 8;
            return currentY;
        });
        
        doc.save(`${resumeData.contact?.name || 'resume'}.pdf`);

    } catch (error) {
        console.error("PDF generation failed:", error);
        toast({ title: t('resume.create.pdfErrorTitle'), description: t('resume.create.pdfErrorDesc'), variant: 'destructive' });
    } finally {
        setIsGeneratingResume(false);
    }
  };


  if (isLoading && !orgUser) {
     return <div className="flex justify-center items-center h-full">{t('general.loading')}</div>;
  }

  const actionButtons = selectedApplication ? [
    { labelKey: "buttons.markAsReviewed", status: "Reviewed", icon: UserCheck, variant: "outline" as const, condition: selectedApplication.status === "Applied" },
    { labelKey: "buttons.offerInterview", status: "Interviewing", icon: Send, variant: "default" as const, condition: selectedApplication.status === "Reviewed" || selectedApplication.status === "Applied" },
    { labelKey: "buttons.makeOffer", status: "Offered", icon: CheckCircle, variant: "default" as const, condition: selectedApplication.status === "Interviewing" },
    { labelKey: "buttons.rejectApplication", status: "Rejected", icon: XCircle, variant: "destructive" as const, condition: selectedApplication.status !== "Rejected" && selectedApplication.status !== "Accepted" },
    { labelKey: "buttons.waitlistApplicant", status: "Waitlisted", icon: History, variant: "secondary" as const, condition: selectedApplication.status === "Reviewed" || selectedApplication.status === "Interviewing" || selectedApplication.status === "Applied" },
  ] : [];


  return (
    <div className="relative space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline text-foreground">{t('headings.receivedApplications')}</h1>
        <p className="text-muted-foreground">{t('organizationPages.receivedApplicationsDescription')}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">{t('general.loading')}</div>
      ) : applications.length > 0 ? (
        <Card className="shadow-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">{t('labels.applicantName')}</TableHead>
                <TableHead className="font-semibold">{t('labels.title')}</TableHead>
                <TableHead className="font-semibold">{t('labels.appliedDate')}</TableHead>
                <TableHead className="font-semibold">{t('labels.status')}</TableHead>
                <TableHead className="font-semibold text-right">{t('labels.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id} onClick={() => handleViewDetails(app)} className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <TableCell className="font-medium">{app.applicantDetails?.name || 'N/A'}</TableCell>
                  <TableCell>{app.internshipTitle}</TableCell>
                  <TableCell>{new Date(app.appliedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Badge variant="outline" className={`${statusColors[app.status]} text-xs`}>{t(`labels.statusTypes.${app.status.toLowerCase()}`, {defaultValue: app.status})}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleViewDetails(app);}} title={t('buttons.viewApplication')}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg shadow-sm">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">{t('messages.noReceivedApplications')}</p>
        </div>
      )}

      {selectedApplication && selectedApplication.applicantDetails && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">{t('headings.applicationDetails')}</DialogTitle>
              <DialogDescription>
                {selectedApplication.internshipTitle} - {selectedApplication.applicantDetails.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-6 overflow-y-auto flex-grow pr-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><UserCircle className="h-5 w-5 text-primary" /> {t('labels.applicantProfile')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <p><strong>{t('labels.name')}:</strong> {selectedApplication.applicantDetails.name}</p>
                        <p><strong>{t('labels.email')}:</strong> <a href={`mailto:${selectedApplication.applicantDetails.email}`} className="text-primary hover:underline">{selectedApplication.applicantDetails.email}</a></p>
                        {selectedApplication.applicantDetails.phoneNumber && <p><strong>{t('labels.phoneNumber')}:</strong> <a href={`tel:${selectedApplication.applicantDetails.phoneNumber}`} className="text-primary hover:underline">{selectedApplication.applicantDetails.phoneNumber}</a></p>}
                        {selectedApplication.applicantDetails.university && <p><strong>{t('labels.university')}:</strong> {selectedApplication.applicantDetails.university}</p>}
                        {selectedApplication.applicantDetails.major && <p><strong>{t('labels.major')}:</strong> {selectedApplication.applicantDetails.major}</p>}
                        {selectedApplication.applicantDetails.skills && selectedApplication.applicantDetails.skills.length > 0 && (
                            <p><strong>{t('labels.skills')}:</strong> {selectedApplication.applicantDetails.skills.join(', ')}</p>
                        )}
                        {selectedApplication.applicantDetails.interests && selectedApplication.applicantDetails.interests.length > 0 && (
                            <p><strong>{t('labels.interests')}:</strong> {selectedApplication.applicantDetails.interests.join(', ')}</p>
                        )}
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />{t('headings.applicationSubmissions')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        {selectedApplication.resumeData ? (
                            <div className="flex items-center gap-2">
                                <strong>{t('labels.submittedResume')}:</strong>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleDownloadResume(selectedApplication.resumeData!)}
                                    disabled={isGeneratingResume}
                                >
                                    {isGeneratingResume ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                                    {t('buttons.downloadPdf')}
                                </Button>
                            </div>
                        ) : (
                            <p><strong>{t('labels.submittedResume')}:</strong> <span className="text-muted-foreground">{t('messages.viewResumeNotAvailable')}</span></p>
                        )}

                        {selectedApplication.coverLetterText ? (
                            <div>
                                <p className="font-semibold">{t('labels.coverLetter')}:</p>
                                <p className="text-muted-foreground whitespace-pre-line bg-muted/50 p-3 rounded-md mt-1">{selectedApplication.coverLetterText}</p>
                            </div>
                        ) : (
                             <p><strong>{t('labels.coverLetter')}:</strong> <span className="text-muted-foreground">{t('general.no')}</span></p>
                        )}
                         <p><strong>{t('labels.appliedDate')}:</strong> {new Date(selectedApplication.appliedAt).toLocaleDateString()}</p>
                         <div className="flex items-center gap-2">
                            <strong>{t('labels.currentStatus')}:</strong> 
                            <div className="flex items-center">
                                <Badge variant="outline" className={`${statusColors[selectedApplication.status]} text-xs`}>{t(`labels.statusTypes.${selectedApplication.status.toLowerCase()}`, {defaultValue: selectedApplication.status})}</Badge>
                            </div>
                         </div>
                    </CardContent>
                </Card>

            </div>

            <DialogFooter className="mt-auto pt-4 border-t flex-wrap gap-2 justify-start">
                {actionButtons.filter(btn => btn.condition).map(actionBtn => (
                    <Button 
                        key={actionBtn.status} 
                        variant={actionBtn.variant} 
                        size="sm"
                        onClick={() => confirmAndUpdateStatus(actionBtn.status as ApplicationStatus, selectedApplication)}
                        disabled={selectedApplication.status === actionBtn.status}
                    >
                        <actionBtn.icon className="mr-2 h-4 w-4" />
                        {t(actionBtn.labelKey)}
                    </Button>
                ))}
                <Button variant="outline" size="sm" onClick={() => setIsViewModalOpen(false)} className="ml-auto">{t('buttons.close')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isConfirmModalOpen && confirmAction && (
        <AlertDialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t(confirmAction.titleKey, confirmAction.actionArgs)}</AlertDialogTitle>
                <AlertDialogDescription>{t(confirmAction.descriptionKey, confirmAction.actionArgs)}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsConfirmModalOpen(false)}>{t('buttons.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={() => { confirmAction.onConfirm(); setIsConfirmModalOpen(false); }}>
                {t(confirmAction.actionLabelKey)}
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )}
    </div>
  );
}
