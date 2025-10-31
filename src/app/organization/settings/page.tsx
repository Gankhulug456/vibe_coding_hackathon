
"use client";

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Building, Save, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import type { User } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const companyProfileSchema = z.object({
  organizationName: z.string().min(2, { message: "Organization name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }).readonly(),
  phoneNumber: z.string().optional().or(z.literal('')),
  website: z.string().url({ message: "Please enter a valid website URL." }).optional().or(z.literal('')),
  description: z.string().max(500, "Description should not exceed 500 characters.").optional().or(z.literal('')),
});

type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;

export default function OrganizationSettingsPage() {
  const { user, loading: authLoading, updateUserProfile } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const form = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      organizationName: '',
      email: '',
      phoneNumber: '',
      website: '',
      description: '',
    },
  });
  const { register, handleSubmit, formState: { errors, isDirty, isSubmitting }, reset, watch, setValue } = form;


  useEffect(() => {
    if (user) {
      reset({
        organizationName: user.organizationName || user.name,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        website: (user as any).website || '', 
        description: (user as any).description || '',
      });
    }
  }, [user, reset]);


  const onSubmit = async (data: CompanyProfileFormValues) => {
    const updatePayload: Partial<User> = {
      name: data.organizationName, // Firebase Auth display name
      organizationName: data.organizationName,
      phoneNumber: data.phoneNumber || null,
      website: data.website || null,
      description: data.description || null,
      // email is read-only and not part of this update directly
    };

    try {
      await updateUserProfile(updatePayload);
      toast({ title: t('messages.profileUpdateSuccess'), description: "" });
      // Form is reset by useEffect watching `user` from AuthContext.
    } catch (error) {
      toast({ title: t('messages.profileUpdateFailed'), description: t('messages.errorOccurred'), variant: "destructive" });
    }
  };

  if (authLoading) {
    return <div className="flex justify-center items-center h-full">{t('general.loading')}</div>;
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold font-headline text-foreground flex items-center gap-2">
        <Building className="h-8 w-8 text-primary" />
        {t('headings.companySettings')}
      </h1>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle>{t('headings.companyInformation')}</CardTitle>
            {user && user.role === 'organization' && user.isVerified !== undefined && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant={user.isVerified ? 'default' : 'destructive'} className="cursor-help">
                      {user.isVerified ? t('labels.verified') : t('labels.notVerified')}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{user.isVerified ? t('messages.verifiedCompanyDesc') : t('messages.unverifiedCompanyDesc')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <CardDescription>{t('organizationPages.settingsDescription')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="organizationName">{t('labels.organizationName')}</Label>
              <Input id="organizationName" {...register('organizationName')} />
              {errors.organizationName && <p className="text-sm text-destructive">{errors.organizationName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('labels.email')} ({t('general.contact')})</Label>
              <Input id="email" type="email" {...register('email')} readOnly className="bg-muted/50 cursor-not-allowed" />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">{t('labels.phoneNumber')}</Label>
              <Input id="phoneNumber" type="tel" {...register('phoneNumber')} placeholder={t('placeholders.phoneNumberExample', { defaultValue: "e.g., 99XXXXXX" })}/>
              {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">{t('labels.website')}</Label>
              <Input id="website" type="url" {...register('website')} placeholder={t('placeholders.applicationUrlExample')} />
              {errors.website && <p className="text-sm text-destructive">{errors.website.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('labels.description')} ({t('general.short')})</Label>
              <Textarea id="description" {...register('description')} placeholder={t('placeholders.internshipDescriptionExample')} className="min-h-[100px]" />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={!isDirty || isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? t('buttons.processing') : t('buttons.save')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
