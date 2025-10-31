
"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TermsOfServicePage() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="outline" onClick={() => router.back()} className="mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('buttons.goBack')}
        </Button>
        <article className="prose dark:prose-invert max-w-none">
          <h1>{t('pageTitles.terms')}</h1>
          <p>{t('content.termsDetails', { defaultValue: 'Effective as of: [Date]' })}</p>

          <h2>1. Agreement to Terms</h2>
          <p>
            By using our platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the platform.
          </p>

          <h2>2. User Accounts</h2>
          <p>
            When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our service.
          </p>

          <h2>3. Content</h2>
          <p>
            Our platform allows you to post, link, store, share and otherwise make available certain information, text, graphics, or other material ("Content"). You are responsible for the Content that you post on or through the platform, including its legality, reliability, and appropriateness.
          </p>
          <p>
            You retain any and all of your rights to any Content you submit, post or display on or through the platform and you are responsible for protecting those rights. We take no responsibility and assume no liability for Content you or any third-party posts on or through the platform.
          </p>

          <h2>4. Prohibited Uses</h2>
          <p>
            You may use the platform only for lawful purposes. You may not use the platform:
          </p>
          <ul>
            <li>In any way that violates any applicable national or international law or regulation.</li>
            <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way.</li>
            <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter," "spam," or any other similar solicitation.</li>
            <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity.</li>
          </ul>

          <h2>5. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </p>

          <h2>6. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days' notice prior to any new terms taking effect.
          </p>
          
        </article>
      </div>
    </div>
  );
}
