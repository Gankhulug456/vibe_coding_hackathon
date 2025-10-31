
"use client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Construction } from "lucide-react";

export default function Page() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center text-center h-full">
      <Construction className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-3xl font-bold font-headline">{t('navigation.groups')}</h1>
      <p className="text-muted-foreground mt-2">{t('general.comingSoon')}</p>
    </div>
  );
}
