
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Internship, Application, User, ResumeData } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Briefcase, CalendarDays, MapPin, ExternalLink, Building, Tag, FileText, Send, CheckCircle, Loader2, Award } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, Timestamp, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { parseISO } from 'date-fns';
import { useNotification } from '@/contexts/NotificationContext';
import { ScrollArea } from '@/components/ui/scroll-area';

type ApplicationSubmissionStatus = 'idle' | 'checking' | 'not_applied' | 'applied' | 'submitting';

export default function InternshipDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user: studentUser } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { addNotification } = useNotification();
  const [internship, setInternship] = useState<Internship | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [coverLetterText, setCoverLetterText] = useState('');
  const [applicationStatus, setApplicationStatus] = useState<ApplicationSubmissionStatus>('idle');
  

  const id = params.id as string;

  useEffect(() => {
    const fetchInternshipAndApplicationStatus = async () => {
      if (!id) return;
      setLoading(true);
      setApplicationStatus(studentUser ? 'checking' : 'idle');

      try {
        const internshipDocRef = doc(db, "internships", id);
        const docSnap = await getDoc(internshipDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Omit<Internship, 'id' | 'createdAt' | 'deadline'> & { createdAt: Timestamp, deadline: string };
          const fetchedInternship = { 
              ...data, 
              id: docSnap.id,
              createdAt: data.createdAt.toDate(),
              deadline: data.deadline,
          };
          setInternship(fetchedInternship);

          if (studentUser) {
            const appsRef = collection(db, "applications");
            const q = query(appsRef, 
                where("userId", "==", studentUser.uid), 
                where("internshipId", "==", fetchedInternship.id)
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              setApplicationStatus('applied');
            } else {
              setApplicationStatus('not_applied');
            }
          } else {
            setApplicationStatus('not_applied');
          }

        } else {
          toast({ title: t('messages.errorOccurred'), description: t('messages.internshipNotFound'), variant: "destructive" });
          router.push('/student/internships');
        }
      } catch (error) {
        console.error("Error fetching internship details or application status:", error);
        toast({ title: t('messages.errorOccurred'), description: "Failed to fetch internship details.", variant: "destructive" });
        setApplicationStatus('not_applied'); 
      } finally {
        setLoading(false);
      }
    };
    fetchInternshipAndApplicationStatus();
  }, [id, router, toast, t, studentUser]);

  const handleExternalApply = () => {
    if (!internship || !internship.url || internship.url === '#') return;
    window.open(internship.url, '_blank');
    toast({ title: t('buttons.apply'), description: t('messages.redirectingToApply', {title: internship.title, company: internship.company}) });
  };
  
  const handleInAppApplySubmit = async () => {
    if (!internship || !studentUser || !internship.id || applicationStatus === 'applied' || applicationStatus === 'submitting') {
      toast({ title: t('messages.errorOccurred'), description: applicationStatus === 'applied' ? t('messages.alreadyApplied') : "Missing required information or already submitting.", variant: "destructive" });
      return;
    }
    setApplicationStatus('submitting');

    try {
      const applicantDetails: Application['applicantDetails'] = {
        uid: studentUser.uid,
        name: studentUser.name,
        email: studentUser.email,
        university: studentUser.university || null,
        major: studentUser.major || null,
        skills: studentUser.skills, 
        interests: studentUser.interests,
        phoneNumber: studentUser.phoneNumber || null,
      };

      const applicationPayload: any = {
        userId: studentUser.uid,
        internshipId: internship.id,
        organizationId: internship.postedBy,
        internshipTitle: internship.title,
        companyName: internship.company,
        status: 'Applied',
        resumeData: studentUser.resume || null,
        applicantDetails,
        coverLetterText: internship.requiresCoverLetter ? (coverLetterText.trim() === '' ? null : coverLetterText) : null,
      };

      await addDoc(collection(db, "applications"), {
        ...applicationPayload,
        appliedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      toast({ title: t('messages.applicationSubmittedSuccess', { internshipTitle: internship.title }), description: "" });
      addNotification({
        titleKey: "notifications.appSubmitted.title",
        descriptionKey: t("notifications.appSubmitted.description", { internshipTitle: internship.title }),
        link: `/student/tracker`
      });
      setIsApplyModalOpen(false);
      setCoverLetterText('');
      setApplicationStatus('applied');
    } catch (error) {
        console.error("Error submitting in-app application:", error);
        toast({ title: t('messages.applicationSubmittedError'), variant: "destructive"});
        setApplicationStatus('not_applied'); 
    }
  };

  if (loading && applicationStatus !== 'applied' && applicationStatus !== 'not_applied') {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
         <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="ml-2">{t('studentPages.internshipDetailLoading')}</p>
      </div>
    );
  }

  if (!internship) {
    return null; 
  }

  const deadlineDate = parseISO(internship.deadline);
  const timeDiff = deadlineDate.getTime() - new Date().getTime();
  const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  let deadlineTextKey: string;
  let deadlineReplacements: Record<string, string> | undefined;
  let deadlineColorClass = "bg-muted text-muted-foreground";

  if (daysLeft < 0) {
    deadlineTextKey = "deadlines.passed";
    deadlineColorClass = "bg-destructive/20 text-destructive";
  } else if (daysLeft <= 7) {
    deadlineTextKey = daysLeft > 1 ? "deadlines.daysLeftPlural" : "deadlines.daysLeft";
    deadlineReplacements = { days: daysLeft.toString() };
    deadlineColorClass = "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
  } else {
    deadlineTextKey = ""; 
  }
  const deadlineDisplay = deadlineTextKey ? t(deadlineTextKey, deadlineReplacements) : deadlineDate.toLocaleDateString();

  const getInAppApplyButtonContent = () => {
    switch (applicationStatus) {
      case 'checking':
        return <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t('messages.checkingApplicationStatus')}</>;
      case 'applied':
        return <><CheckCircle className="mr-2 h-5 w-5" /> {t('messages.alreadyAppliedShort')}</>;
      case 'submitting':
        return <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t('buttons.processing')}</>;
      default: // 'idle', 'not_applied'
        return <><Send className="mr-2 h-5 w-5" /> {t('buttons.applyInApp')}</>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> {t('buttons.goBack')}
      </Button>

      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/30 p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {internship.companyLogo && (
              <Image 
                src={internship.companyLogo} 
                alt={t('labels.company') + ' ' + internship.company + ' logo'}
                width={80}
                height={80}
                className="rounded-lg border border-border object-contain"
                data-ai-hint="company logo large"
              />
            )}
            <div className="flex-1">
              <CardTitle className="text-3xl font-headline mb-1">{internship.title}</CardTitle>
              <CardDescription className="text-lg text-muted-foreground flex items-center gap-2">
                <Building className="h-5 w-5" /> {internship.company}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{t('labels.location')}</p>
                  <p className="text-muted-foreground">{internship.location} ({t(`filter.${internship.type.toLowerCase() as 'local' | 'remote' | 'international'}`)})</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{t('labels.deadline')}</p>
                  <Badge variant="outline" className={`text-sm font-normal px-3 py-1 ${deadlineColorClass}`}>{deadlineDisplay}</Badge>
                </div>
              </div>
            </div>
            <div className="space-y-3">
               <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-primary" />
                 <div>
                  <p className="font-medium">{t('labels.type')}</p>
                  <p className="text-muted-foreground">{t(`filter.${internship.type.toLowerCase() as 'local' | 'remote' | 'international'}`)}</p>
                </div>
              </div>
               <div className="flex items-center gap-3">
                <Tag className="h-5 w-5 text-primary" />
                 <div>
                  <p className="font-medium">{t('labels.tags')}</p>
                  {internship.tags && internship.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {internship.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold font-headline flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/>{t('labels.description')}</h3>
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
              {internship.description}
            </p>
          </div>

        </CardContent>
        <CardFooter className="bg-muted/30 p-6">
          {internship.applicationMethod === 'externalUrl' ? (
            <Button size="lg" className="w-full sm:w-auto text-base" onClick={handleExternalApply} disabled={!internship.url || internship.url === '#'}>
              <ExternalLink className="mr-2 h-5 w-5" /> {t('buttons.apply')} {t('labels.atCompany', { company: internship.company })}
            </Button>
          ) : (
            <Button 
              size="lg" 
              className="w-full sm:w-auto text-base" 
              onClick={() => setIsApplyModalOpen(true)}
              disabled={!studentUser || applicationStatus === 'checking' || applicationStatus === 'applied' || applicationStatus === 'submitting'}
            >
              {getInAppApplyButtonContent()}
            </Button>
          )}
        </CardFooter>
      </Card>

      {internship.applicationMethod === 'inApp' && (
        <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">{t('headings.applyForInternship', { internshipTitle: internship.title })}</DialogTitle>
              <DialogDescription>
                {t('labels.atCompany', { company: internship.company })}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                  {studentUser?.resume ? (
                    <p className="text-sm text-green-700 bg-green-100 p-2 rounded-md">{t('messages.resumeSubmitWithSaved')}</p>
                  ) : (
                    <p className="text-sm text-yellow-600 bg-yellow-100 p-2 rounded-md">{t('messages.resumeSubmitWithoutSaved')}</p>
                  )}
              </div>

              {internship.additionalInfoPrompt && (
                <div className="space-y-1">
                  <Label htmlFor="additional-info-response" className="font-semibold">{internship.additionalInfoPrompt}</Label>
                  <p className="text-xs text-muted-foreground">(You can address this in your cover letter if applicable)</p>
                </div>
              )}

              {internship.requiresCoverLetter && (
                <div className="space-y-1">
                  <Label htmlFor="cover-letter" className="font-semibold">{t('labels.coverLetter')}</Label>
                  <Textarea
                    id="cover-letter"
                    value={coverLetterText}
                    onChange={(e) => setCoverLetterText(e.target.value)}
                    placeholder={t('placeholders.coverLetterPrompt')}
                    className="min-h-[150px]"
                    disabled={applicationStatus === 'submitting'}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsApplyModalOpen(false)} disabled={applicationStatus === 'submitting'}>{t('buttons.cancel')}</Button>
              <Button onClick={handleInAppApplySubmit} disabled={applicationStatus === 'submitting' || (internship.requiresCoverLetter && !coverLetterText.trim())}>
                {applicationStatus === 'submitting' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('buttons.processing')}</> : t('buttons.submitApplication')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
