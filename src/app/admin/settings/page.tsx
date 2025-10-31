
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Save, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function AdminSiteSettingsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [newRegistrationsOpen, setNewRegistrationsOpen] = useState(true);
  const [defaultLanguage, setDefaultLanguage] = useState<'en' | 'mn'>('en');

  const handleSaveChanges = () => {
    console.log({ maintenanceMode, newRegistrationsOpen, defaultLanguage });
    toast({ title: t('messages.settingsSaved'), description: "" });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold font-headline text-foreground flex items-center gap-2">
        <ShieldCheck className="h-8 w-8 text-primary" />
        {t('navigation.siteSettings')}
      </h1>
      <p className="text-muted-foreground">{t('adminPages.settingsDescription')}</p>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{t('headings.platformControls')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
            <div>
              <Label htmlFor="maintenance-mode" className="font-semibold">{t('adminPages.maintenanceMode')}</Label>
              <p className="text-sm text-muted-foreground">{t('adminPages.maintenanceModeDesc')}</p>
            </div>
            <Switch
              id="maintenance-mode"
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
              aria-label={t('adminPages.maintenanceMode')}
            />
          </div>

          {maintenanceMode && (
            <div className="p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-md text-sm">
              <AlertTriangle className="inline h-4 w-4 mr-1" />
              {t('messages.maintenanceModeWarning')}
            </div>
          )}

          <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
             <div>
                <Label htmlFor="new-registrations" className="font-semibold">{t('adminPages.newUserRegistrations')}</Label>
                <p className="text-sm text-muted-foreground">{t('adminPages.newUserRegistrationsDesc')}</p>
             </div>
            <Switch
              id="new-registrations"
              checked={newRegistrationsOpen}
              onCheckedChange={setNewRegistrationsOpen}
              aria-label={t('adminPages.newUserRegistrations')}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>{t('headings.localization')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="default-language">{t('adminPages.defaultPlatformLanguage')}</Label>
                <select 
                    id="default-language"
                    value={defaultLanguage} 
                    onChange={(e) => setDefaultLanguage(e.target.value as 'en' | 'mn')}
                    className="w-full p-2 border rounded-md bg-input text-foreground"
                    disabled 
                >
                    <option value="en">{t('general.english')}</option>
                    <option value="mn">{t('general.mongolian')}</option>
                </select>
                <p className="text-xs text-muted-foreground">{t('messages.languageSettingDisplayOnly')}</p>
             </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mt-8">
        <Button onClick={handleSaveChanges} disabled>
          <Save className="mr-2 h-4 w-4" /> {t('buttons.saveAllSettingsComingSoon')}
        </Button>
      </div>
    </div>
  );
}

    