"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Briefcase,
  FileText,
  Users,
  Lightbulb,
  CheckCircle,
  ArrowRight,
  Mail,
  Instagram,
  Facebook,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Header } from "@/components/layout/Header";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { motion } from "framer-motion";

export default function HomePage() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Briefcase,
      titleKey: "features.internshipBoard.title",
      descriptionKey: "features.internshipBoard.description",
    },
    {
      icon: FileText,
      titleKey: "features.aiResumeAnalyzer.title",
      descriptionKey: "features.aiResumeAnalyzer.description",
    },
    {
      icon: Users,
      titleKey: "features.applicationTracker.title",
      descriptionKey: "features.applicationTracker.description",
    },
    {
      icon: Lightbulb,
      titleKey: "features.careerResources.title",
      descriptionKey: "features.careerResources.description",
    },
  ];

  const howItWorksItems = [
    "features.howItWorks.item1",
    "features.howItWorks.item2",
    "features.howItWorks.item3",
    "features.howItWorks.item4",
  ];

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative">
      <header className="fixed top-4 left-0 right-0 w-full z-20 px-4 lg:px-6">
        <div className="container mx-auto flex items-center justify-end">
          <div className="flex items-center gap-2 bg-card/60 backdrop-blur-xl p-1.5 rounded-full shadow-lg border">
            <Header />
          </div>
        </div>
      </header>

      <main>
        <section className="relative flex items-center justify-center pt-28 pb-20 md:pt-32 md:pb-28 bg-gradient-to-b from-background via-primary/5 to-background overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Image
                  src="/logo-large.png"
                  alt="Nomadly Intern Logo"
                  width={64}
                  height={64}
                  className="mx-auto mb-6"
                />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-headline font-extrabold mb-4 leading-tight"
              >
                {t("appName")}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto"
              >
                {t("tagline")}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row justify-center items-center gap-4"
              >
                <RainbowButton asChild>
                  <Link href="/student/internships">
                    {t("buttons.exploreInternships")}
                  </Link>
                </RainbowButton>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="shadow-md hover:shadow-accent/30 transition-shadow duration-300"
                >
                  <Link href="/login">{t("buttons.login")}</Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        <motion.section
          id="features"
          className="py-16 md:py-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="container mx-auto px-4">
            <motion.div
              variants={cardVariants}
              className="text-center max-w-2xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">
                {t("features.title")}
              </h2>
              <p className="text-muted-foreground mb-12">
                {t("features.subtitle")}
              </p>
            </motion.div>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
              variants={containerVariants}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={cardVariants}
                  className="h-full"
                >
                  <Card className="h-full text-center shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card border hover:border-primary/20">
                    <CardHeader className="items-center">
                      <div className="p-4 bg-primary/10 rounded-full mb-4">
                        <feature.icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="text-xl font-headline">
                        {t(feature.titleKey)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm">
                        {t(feature.descriptionKey)}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          className="py-16 md:py-24 bg-muted/30 overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionVariants}
        >
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              >
                <h2 className="text-3xl md:text-4xl font-headline font-bold mb-6">
                  {t("features.cta.title")}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {t("features.cta.description")}
                </p>
                <ul className="space-y-4 mb-8">
                  {howItWorksItems.map((itemKey, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-primary mr-3 mt-1 shrink-0" />
                      <span className="text-foreground">{t(itemKey)}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  size="lg"
                  className="shadow-lg hover:shadow-primary/30 transition-shadow duration-300"
                >
                  <Link href="/register">
                    {t("features.cta.button")}{" "}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <Image
                  src="/placeholder-dashboard.png"
                  alt={t("features.cta.imageAlt")}
                  width={600}
                  height={400}
                  className="rounded-lg shadow-2xl w-full h-auto"
                  data-ai-hint="dashboard office"
                />
              </motion.div>
            </div>
          </div>
        </motion.section>

        <footer className="border-t bg-background">
          <div className="container mx-auto px-6 py-12">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div>
                <Link href="/" className="inline-flex items-center gap-2">
                  <Image
                    src="/logo-large.png"
                    alt="Nomadly Intern Logo"
                    width={32}
                    height={32}
                  />
                  <span className="text-xl font-bold font-headline">
                    {t("appName")}
                  </span>
                </Link>

                <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                  {t("tagline")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-2">
                <div>
                  <p className="font-semibold text-foreground">Platform</p>
                  <ul className="mt-4 space-y-2 text-sm">
                    <li>
                      <Link
                        href="/student/internships"
                        className="text-muted-foreground transition-colors hover:text-primary"
                      >
                        Internships
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/student/events"
                        className="text-muted-foreground transition-colors hover:text-primary"
                      >
                        Events
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/student/learn"
                        className="text-muted-foreground transition-colors hover:text-primary"
                      >
                        Learn Center
                      </Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Legal</p>
                  <ul className="mt-4 space-y-2 text-sm">
                    <li>
                      <Link
                        href="/privacy"
                        className="text-muted-foreground transition-colors hover:text-primary"
                      >
                        {t("pageTitles.privacy")}
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/terms"
                        className="text-muted-foreground transition-colors hover:text-primary"
                      >
                        {t("pageTitles.terms")}
                      </Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Contact</p>
                  <div className="mt-4 flex space-x-4">
                    <a
                      href="https://www.facebook.com/share/19QCvfDzik/?mibextid=wwXIfr"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Facebook className="h-6 w-6" />
                    </a>
                    <a
                      href="https://www.instagram.com/nomadlyapp/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Instagram className="h-6 w-6" />
                    </a>
                    <a
                      href="mailto:hello@nomadli.app"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Mail className="h-6 w-6" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 border-t pt-8">
              <p className="text-center text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} {t("appName")}.{" "}
                {t("footer.allRightsReserved")}
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
