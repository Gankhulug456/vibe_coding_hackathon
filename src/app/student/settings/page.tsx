
"use client";

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { UserCog, Save, KeyRound } from 'lucide-react';
import type { User } from '@/types';

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }).readonly(),
  university: z.string().optional().or(z.literal('')),
  major: z.string().optional().or(z.literal('')),
  phoneNumber: z.string().optional().or(z.literal('')),
  skills: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()).filter(s => s.length > 0) : []),
  interests: z.string().optional().transform(val => val ? val.split(',').map(i => i.trim()).filter(i => i.length > 0) : []),
  language: z.enum(['en', 'mn']),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function StudentSettingsPage() {
  const { user, loading: authLoading, updateUserProfile, changePassword } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { toast } = useToast();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      university: '',
      major: '',
      phoneNumber: '',
      skills: [], 
      interests: [], 
      language: language,
    },
  });
  const { register: profileRegister, handleSubmit: profileHandleSubmit, formState: { errors: profileErrors, isDirty: profileIsDirty, isSubmitting: profileIsSubmitting }, reset: profileReset, setValue: profileSetValue, control: profileControl } = profileForm;

  const [isPasswordChangeModalOpen, setIsPasswordChangeModalOpen] = useState(false);

  const passwordChangeSchema = z.object({
    newPassword: z.string().min(6, t('auth.passwordMinLength', {min: "6"})),
    confirmPassword: z.string().min(6, t('auth.passwordMinLength', {min: "6"})),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t('auth.passwordsDoNotMatch'),
    path: ["confirmPassword"],
  });
  type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;

  const passwordForm = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });
  const { register: passwordRegister, handleSubmit: passwordHandleSubmit, formState: { errors: passwordErrors, isSubmitting: passwordIsSubmitting }, reset: passwordReset } = passwordForm;
  
  useEffect(() => {
    if (user) {
      profileReset({
        name: user.name,
        email: user.email,
        university: user.university || '',
        major: user.major || '',
        phoneNumber: user.phoneNumber || '',
        skills: (user.skills || []).join(', '),
        interests: (user.interests || []).join(', '),
        language: user.language,
      });
    }
  }, [user, profileReset]);

  useEffect(() => {
    profileSetValue('language', language);
  }, [language, profileSetValue]);


  const onProfileSubmit = async (data: ProfileFormValues) => {
    const updatePayload: Partial<User> = {
      name: data.name,
      university: data.university || null,
      major: data.major || null,
      phoneNumber: data.phoneNumber || null,
      skills: data.skills, // data.skills is already string[] due to Zod transform
      interests: data.interests, // data.interests is already string[]
      language: data.language,
    };

    try {
      await updateUserProfile(updatePayload);

      if (data.language !== language) {
        setLanguage(data.language);
      }

      toast({ title: t('messages.profileUpdateSuccess'), description: "" });

    } catch (error) {
      toast({ title: t('messages.profileUpdateFailed'), description: t('messages.errorOccurred'), variant: "destructive" });
    }
  };

  const onPasswordChangeSubmit = async (data: PasswordChangeFormValues) => {
    try {
      await changePassword(data.newPassword);
      toast({ title: t('auth.passwordUpdateSuccessTitle'), description: t('auth.passwordUpdateSuccessDesc') });
      passwordReset();
      setIsPasswordChangeModalOpen(false);
    } catch (error: any) {
      console.error("Password change error:", error);
      let errorMessage = t('auth.passwordUpdateFailedDesc');
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = t('auth.requiresRecentLogin');
      }
      toast({ title: t('auth.passwordUpdateFailedTitle'), description: errorMessage, variant: "destructive" });
    }
  };

  if (authLoading) {
    return <div className="flex justify-center items-center h-full">{t('general.loading')}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold font-headline text-foreground flex items-center gap-2">
        <UserCog className="h-8 w-8 text-primary" />
        {t('headings.profileSettings')}
      </h1>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{t('headings.personalInformation')}</CardTitle>
          <CardDescription>{t('studentPages.settingsDescription')}</CardDescription>
        </CardHeader>
        <form onSubmit={profileHandleSubmit(onProfileSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t('labels.name')}</Label>
              <Input id="name" {...profileRegister('name')} />
              {profileErrors.name && <p className="text-sm text-destructive">{profileErrors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('labels.email')}</Label>
              <Input id="email" type="email" {...profileRegister('email')} readOnly className="bg-muted/50 cursor-not-allowed" />
              {profileErrors.email && <p className="text-sm text-destructive">{profileErrors.email.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="phoneNumber">{t('labels.phoneNumber')}</Label>
              <Input id="phoneNumber" type="tel" {...profileRegister('phoneNumber')} placeholder={t('placeholders.phoneNumberExample', { defaultValue: "e.g., 99XXXXXX" })} />
              {profileErrors.phoneNumber && <p className="text-sm text-destructive">{profileErrors.phoneNumber.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="university">{t('labels.university')}</Label>
              <Input id="university" {...profileRegister('university')} placeholder={t('placeholders.universityExample')} />
              {profileErrors.university && <p className="text-sm text-destructive">{profileErrors.university.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="major">{t('labels.major')}</Label>
              <Input id="major" {...profileRegister('major')} placeholder={t('placeholders.majorExample')} />
              {profileErrors.major && <p className="text-sm text-destructive">{profileErrors.major.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="skills">{t('labels.skills')}</Label>
              <Input
                id="skills"
                {...profileRegister('skills')}
                placeholder={t('placeholders.skillsExample')}
              />
              <p className="text-xs text-muted-foreground">{t('messages.skillsHint')}</p>
              {profileErrors.skills && <p className="text-sm text-destructive">{Array.isArray(profileErrors.skills) ? profileErrors.skills.join(', ') : (profileErrors.skills as any).message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="interests">{t('labels.interests')}</Label>
              <Input
                id="interests"
                {...profileRegister('interests')}
                placeholder={t('placeholders.interestsExample')}
              />
              <p className="text-xs text-muted-foreground">{t('messages.interestsHint')}</p>
              {profileErrors.interests && <p className="text-sm text-destructive">{Array.isArray(profileErrors.interests) ? profileErrors.interests.join(', ') : (profileErrors.interests as any).message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">{t('labels.preferredLanguage')}</Label>
               <Controller
                name="language"
                control={profileControl}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="language">
                            <SelectValue placeholder={t('placeholders.selectLanguage')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="en">{t('general.english')}</SelectItem>
                            <SelectItem value="mn">{t('general.mongolian')}</SelectItem>
                        </SelectContent>
                    </Select>
                )}
                />
              {profileErrors.language && <p className="text-sm text-destructive">{profileErrors.language.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={!profileIsDirty || profileIsSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {profileIsSubmitting ? t('buttons.processing') : t('buttons.save')}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>{t('headings.accountSecurity')}</CardTitle>
            <CardDescription>{t('auth.accountSecurityDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
            <Dialog open={isPasswordChangeModalOpen} onOpenChange={setIsPasswordChangeModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <KeyRound className="mr-2 h-4 w-4" />
                  {t('auth.changePasswordButton')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('auth.changePasswordTitle')}</DialogTitle>
                  <DialogDescription>
                    {t('auth.changePasswordDesc')}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={passwordHandleSubmit(onPasswordChangeSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{t('auth.newPassword')}</Label>
                    <Input id="newPassword" type="password" {...passwordRegister('newPassword')} />
                    {passwordErrors.newPassword && <p className="text-sm text-destructive">{passwordErrors.newPassword.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t('auth.confirmNewPassword')}</Label>
                    <Input id="confirmPassword" type="password" {...passwordRegister('confirmPassword')} />
                    {passwordErrors.confirmPassword && <p className="text-sm text-destructive">{passwordErrors.confirmPassword.message}</p>}
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => { setIsPasswordChangeModalOpen(false); passwordReset(); }}>{t('buttons.cancel')}</Button>
                    <Button type="submit" disabled={passwordIsSubmitting}>
                      {passwordIsSubmitting ? t('buttons.processing') : t('auth.changePasswordButton')}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
