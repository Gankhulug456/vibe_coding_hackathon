
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, PlusSquare, Save, LinkIcon, ListChecks } from 'lucide-react';
import { format, formatISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import type { Internship, EmploymentType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const internshipSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  company: z.string().min(2, "Company name is required."),
  location: z.string().min(3, "Location is required."),
  type: z.enum(['Local', 'Remote', 'International'], { required_error: "Internship type is required."}),
  employmentType: z.enum(['Internship', 'Full-time', 'Part-time'], { required_error: "Employment type is required."}),
  deadline: z.date({ required_error: "Deadline is required."}),
  description: z.string().min(50, "Description must be at least 50 characters."),
  tags: z.string().refine(val => val.split(',').map(tag => tag.trim()).filter(Boolean).every(tag => tag.length > 0) || val.length === 0, {
    message: "Tags must be comma-separated words.",
  }).optional(),
  requiredMajors: z.string().refine(val => val.split(',').map(tag => tag.trim()).filter(Boolean).every(tag => tag.length > 0) || val.length === 0, {
    message: "Majors must be comma-separated words.",
  }).optional(),
  applicationMethod: z.enum(['inApp', 'externalUrl'], { required_error: "Application method is required."}),
  url: z.string().optional(), 
  requiresCoverLetter: z.boolean().optional(),
  additionalInfoPrompt: z.string().optional(),
}).refine(data => {
  if (data.applicationMethod === 'externalUrl' && (!data.url || data.url.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Application URL is required for external link applications.",
  path: ['url'],
});

type InternshipFormValues = z.infer<typeof internshipSchema>;

export default function PostJobPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user: orgUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InternshipFormValues>({
    resolver: zodResolver(internshipSchema),
    defaultValues: {
      title: '',
      company: orgUser?.organizationName || '',
      location: '',
      type: undefined,
      employmentType: 'Internship',
      deadline: undefined,
      description: '',
      tags: '',
      requiredMajors: '',
      applicationMethod: 'externalUrl',
      url: '',
      requiresCoverLetter: false,
      additionalInfoPrompt: '',
    },
  });
  const { register, handleSubmit, control, formState: { errors }, reset, watch, setValue } = form;

  const applicationMethod = watch('applicationMethod');

   useEffect(() => {
    if (orgUser?.organizationName) {
      setValue('company', orgUser.organizationName);
    }
  }, [orgUser, setValue]);


  const onSubmit = async (data: InternshipFormValues) => {
    if (!orgUser) {
      toast({ title: t('messages.errorOccurred'), description: "User not authenticated.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    
    try {
      // Base payload with common fields
      const payload: any = {
        title: data.title,
        company: data.company,
        location: data.location,
        type: data.type,
        employmentType: data.employmentType,
        deadline: formatISO(data.deadline),
        description: data.description,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        requiredMajors: data.requiredMajors ? data.requiredMajors.split(',').map(major => major.trim()).filter(Boolean) : [],
        applicationMethod: data.applicationMethod,
        postedBy: orgUser.uid,
        status: 'pending' as const,
      };

      // Automatically add the organization's logo if it exists
      if (orgUser.avatarUrl) {
        payload.companyLogo = orgUser.avatarUrl;
      }

      if (data.applicationMethod === 'externalUrl') {
        payload.url = data.url || '#';
      } else { // 'inApp'
        payload.url = '#'; // In-app applications don't have an external URL
        payload.requiresCoverLetter = data.requiresCoverLetter || false;
        if (data.additionalInfoPrompt) {
          payload.additionalInfoPrompt = data.additionalInfoPrompt;
        }
      }

      const docRef = await addDoc(collection(db, "internships"), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      console.log("Internship posted with ID: ", docRef.id);
      toast({ title: t('messages.postJobSuccess', { title: data.title }), description: t('messages.postPendingReview') });
      reset();
    } catch (error) {
      console.error("Error posting internship to Firestore:", error);
      toast({ title: t('messages.errorOccurred'), description: "Failed to post internship.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold font-headline text-foreground flex items-center gap-2">
        <PlusSquare className="h-8 w-8 text-primary" />
        {t('headings.postInternship')}
      </h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{t('headings.internshipDetails')}</CardTitle>
          <CardDescription>{t('organizationPages.postJobDescription')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">{t('labels.title')}</Label>
                <Input id="title" {...register('title')} placeholder={t('placeholders.internshipTitleExample')} />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">{t('labels.company')}</Label>
                <Input id="company" {...register('company')} placeholder={t('placeholders.companyNameExample')} />
                {errors.company && <p className="text-sm text-destructive">{errors.company.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="location">{t('labels.location')}</Label>
                <Input id="location" {...register('location')} placeholder={t('placeholders.locationExample')} />
                {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">{t('labels.type')}</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder={t('placeholders.selectType')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Local">{t('filter.local')}</SelectItem>
                        <SelectItem value="Remote">{t('filter.remote')}</SelectItem>
                        <SelectItem value="International">{t('filter.international')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="employmentType">{t('labels.employmentType')}</Label>
                    <Controller
                    name="employmentType"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="employmentType">
                            <SelectValue placeholder={t('placeholders.selectEmploymentType')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Internship">{t('labels.employmentTypes.internship')}</SelectItem>
                            <SelectItem value="Full-time">{t('labels.employmentTypes.fullTime')}</SelectItem>
                            <SelectItem value="Part-time">{t('labels.employmentTypes.partTime')}</SelectItem>
                        </SelectContent>
                        </Select>
                    )}
                    />
                    {errors.employmentType && <p className="text-sm text-destructive">{errors.employmentType.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="deadline">{t('labels.deadline')}</Label>
                    <Controller
                        name="deadline"
                        control={control}
                        render={({ field }) => (
                            <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>{t('placeholders.pickDate')}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))}
                                />
                            </PopoverContent>
                            </Popover>
                        )}
                    />
                    {errors.deadline && <p className="text-sm text-destructive">{errors.deadline.message}</p>}
                </div>
            </div>
            
            <div className="space-y-2">
                <Label>{t('labels.applicationMethod')}</Label>
                <Controller
                    name="applicationMethod"
                    control={control}
                    render={({ field }) => (
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 items-center">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="externalUrl" id="externalUrl" />
                                <Label htmlFor="externalUrl" className="font-normal flex items-center gap-1"><LinkIcon className="h-4 w-4"/> {t('labels.externalLinkApplication')}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="inApp" id="inApp" />
                                <Label htmlFor="inApp" className="font-normal flex items-center gap-1"><ListChecks className="h-4 w-4"/> {t('labels.inAppApplication')}</Label>
                            </div>
                        </RadioGroup>
                    )}
                />
                {errors.applicationMethod && <p className="text-sm text-destructive">{errors.applicationMethod.message}</p>}
            </div>

            {applicationMethod === 'externalUrl' && (
                <div className="space-y-2">
                    <Label htmlFor="url">{t('labels.url')}</Label>
                    <Input id="url" type="url" {...register('url')} placeholder={t('placeholders.applicationUrlExample')} />
                    {errors.url && <p className="text-sm text-destructive">{errors.url.message}</p>}
                </div>
            )}

            {applicationMethod === 'inApp' && (
                <div className="space-y-4 p-4 border rounded-md bg-muted/30">
                    <div className="flex items-center space-x-2">
                        <Controller
                            name="requiresCoverLetter"
                            control={control}
                            render={({ field }) => (
                                <Checkbox
                                    id="requiresCoverLetter"
                                    checked={field.value || false}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                        <Label htmlFor="requiresCoverLetter" className="font-normal">{t('labels.requiresCoverLetter')}</Label>
                    </div>
                     {errors.requiresCoverLetter && <p className="text-sm text-destructive">{errors.requiresCoverLetter.message}</p>}

                    <div className="space-y-2">
                        <Label htmlFor="additionalInfoPrompt">{t('labels.additionalInfoPrompt')}</Label>
                        <Textarea 
                            id="additionalInfoPrompt" 
                            {...register('additionalInfoPrompt')} 
                            placeholder={t('placeholders.additionalInfoPromptExample')} 
                            className="min-h-[100px]"
                        />
                        {errors.additionalInfoPrompt && <p className="text-sm text-destructive">{errors.additionalInfoPrompt.message}</p>}
                    </div>
                </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">{t('labels.description')}</Label>
              <Textarea id="description" {...register('description')} placeholder={t('placeholders.internshipDescriptionExample')} className="min-h-[150px]" />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="requiredMajors">{t('labels.requiredMajors')} ({t('general.commaSeparated')})</Label>
              <Input id="requiredMajors" {...register('requiredMajors')} placeholder={t('placeholders.requiredMajorsExample')} />
              {errors.requiredMajors && <p className="text-sm text-destructive">{errors.requiredMajors.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">{t('labels.tags')} ({t('general.commaSeparated')})</Label>
              <Input id="tags" {...register('tags')} placeholder={t('placeholders.tagsExampleCommaSeparated')} />
              {errors.tags && <p className="text-sm text-destructive">{errors.tags.message}</p>}
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? t('buttons.processing') : t('buttons.postJob')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
