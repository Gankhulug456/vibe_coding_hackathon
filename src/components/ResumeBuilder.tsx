"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  PlusCircle,
  Trash2,
  Download,
  Sparkles,
  Loader2,
  UploadCloud,
  Save,
  X,
} from "lucide-react";
import type { ResumeData } from "@/types";
import {
  extractResumeInfo,
  improveResumeSection,
} from "@/ai/flows/resume-builder";
import { FileUpload, type FileUploadHandles } from "./FileUpload";
import { Switch } from "./ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { PrintableResume, type ResumeLabels } from "./PrintableResume";

const experienceSchema = z.object({
  id: z.string(),
  jobTitle: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company is required"),
  startDate: z.string(),
  endDate: z.string(),
  description: z.string(),
});

const educationSchema = z.object({
  id: z.string(),
  school: z.string().min(1, "School is required"),
  degree: z.string().min(1, "Degree is required"),
  startDate: z.string(),
  endDate: z.string(),
});

const projectSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Project title is required"),
  description: z.string(),
});

const awardSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Award name is required"),
  date: z.string(),
});

const activitySchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Activity/organization name is required"),
  description: z.string(),
});

const resumeSchema = z.object({
  contact: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string(),
    address: z.string(),
    linkedin: z.string().url().or(z.literal("")),
  }),
  summary: z.string(),
  experience: z.array(experienceSchema),
  education: z.array(educationSchema),
  skills: z.array(z.string()),
  languages: z.array(z.string()).optional(),
  projects: z.array(projectSchema).optional(),
  awards: z.array(awardSchema).optional(),
  activities: z.array(activitySchema).optional(),
});

type ResumeFormValues = z.infer<typeof resumeSchema>;

async function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ResumeBuilder() {
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const { user, updateUserProfile } = useAuth();
  const [isAiLoading, setIsAiLoading] = useState<string | boolean>(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentSkill, setCurrentSkill] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("");
  const [printingResume, setPrintingResume] = useState<{
    data: ResumeData;
    labels: ResumeLabels;
  } | null>(null);

  const fileUploadRef = useRef<FileUploadHandles>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const form = useForm<ResumeFormValues>({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      contact: { name: "", email: "", phone: "", address: "", linkedin: "" },
      summary: "",
      experience: [],
      education: [],
      skills: [],
      languages: [],
      projects: [],
      awards: [],
      activities: [],
    },
  });

  const skillsValue = form.watch("skills") || [];
  const languagesValue = form.watch("languages") || [];

  const handleAddSkill = (
    e:
      | React.MouseEvent<HTMLButtonElement>
      | React.KeyboardEvent<HTMLInputElement>
  ) => {
    e.preventDefault();
    if (currentSkill && !skillsValue.includes(currentSkill.trim())) {
      form.setValue("skills", [...skillsValue, currentSkill.trim()], {
        shouldDirty: true,
      });
      setCurrentSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    form.setValue(
      "skills",
      skillsValue.filter((skill) => skill !== skillToRemove),
      { shouldDirty: true }
    );
  };

  const handleAddLanguage = (
    e:
      | React.MouseEvent<HTMLButtonElement>
      | React.KeyboardEvent<HTMLInputElement>
  ) => {
    e.preventDefault();
    if (currentLanguage && !languagesValue.includes(currentLanguage.trim())) {
      form.setValue("languages", [...languagesValue, currentLanguage.trim()], {
        shouldDirty: true,
      });
      setCurrentLanguage("");
    }
  };

  const handleRemoveLanguage = (langToRemove: string) => {
    form.setValue(
      "languages",
      languagesValue.filter((lang) => lang !== langToRemove),
      { shouldDirty: true }
    );
  };

  const {
    fields: expFields,
    append: appendExp,
    remove: removeExp,
    replace: replaceExp,
  } = useFieldArray({
    control: form.control,
    name: "experience",
  });
  const {
    fields: eduFields,
    append: appendEdu,
    remove: removeEdu,
    replace: replaceEdu,
  } = useFieldArray({
    control: form.control,
    name: "education",
  });
  const {
    fields: projFields,
    append: appendProj,
    remove: removeProj,
    replace: replaceProj,
  } = useFieldArray({
    control: form.control,
    name: "projects",
  });
  const {
    fields: awardFields,
    append: appendAward,
    remove: removeAward,
    replace: replaceAward,
  } = useFieldArray({
    control: form.control,
    name: "awards",
  });
  const {
    fields: actFields,
    append: appendAct,
    remove: removeAct,
    replace: replaceAct,
  } = useFieldArray({
    control: form.control,
    name: "activities",
  });

  useEffect(() => {
    if (user?.resume) {
      const {
        experience,
        education,
        projects,
        awards,
        activities,
        ...restOfResume
      } = user.resume;
      form.reset({
        ...restOfResume,
        skills: Array.isArray(user.resume.skills) ? user.resume.skills : [],
        languages: Array.isArray(user.resume.languages)
          ? user.resume.languages
          : [],
      });
      replaceExp(experience || []);
      replaceEdu(education || []);
      replaceProj(projects || []);
      replaceAward(awards || []);
      replaceAct(activities || []);
    } else if (user) {
      form.reset({
        contact: {
          name: user.name || "",
          email: user.email || "",
          phone: user.phoneNumber || "",
          address: "",
          linkedin: "",
        },
        summary: "",
        experience: [],
        education: [],
        skills: user.skills || [],
        languages: [],
        projects: [],
        awards: [],
        activities: [],
      });
      replaceExp([]);
      replaceEdu([]);
      replaceProj([]);
      replaceAward([]);
      replaceAct([]);
    }
  }, [
    user,
    form.reset,
    replaceExp,
    replaceEdu,
    replaceProj,
    replaceAward,
    replaceAct,
    t,
    toast,
  ]);

  const handleAutofill = async (file: File) => {
    setIsAiLoading("autofill");
    try {
      const resumeDataUri = await fileToDataUri(file);
      const result = await extractResumeInfo({ resumeDataUri, language });

      const {
        contact,
        summary,
        experience,
        education,
        skills,
        languages,
        projects,
        awards,
        activities,
      } = result;

      form.setValue(
        "contact",
        contact || { name: "", email: "", phone: "", address: "", linkedin: "" }
      );
      form.setValue("summary", summary || "");
      form.setValue("skills", skills || []);
      form.setValue("languages", languages || []);

      replaceExp(experience || []);
      replaceEdu(education || []);
      replaceProj(projects || []);
      replaceAward(awards || []);
      replaceAct(activities || []);

      toast({
        title: t("resume.create.autofillSuccess"),
        description: t("resume.create.autofillSuccessDesc"),
      });
    } catch (e: any) {
      console.error("Autofill error:", e);
      toast({
        title: t("resume.create.autofillError"),
        description: e.message || "An unknown error occurred during autofill.",
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleImproveDescription = async (index: number) => {
    const description = form.getValues(`experience.${index}.description`);
    if (!description) return;
    setIsAiLoading(`improve-${index}`);
    try {
      const result = await improveResumeSection({
        textToImprove: description,
        language,
      });
      form.setValue(`experience.${index}.description`, result.improvedText, {
        shouldDirty: true,
      });
    } catch (e: any) {
      toast({
        title: t("resume.create.improveError"),
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSaveResume = async () => {
    setIsSaving(true);
    try {
      const currentData = form.getValues();
      const resumeData: ResumeData = {
        contact: currentData.contact || {
          name: "",
          email: "",
          phone: "",
          address: "",
          linkedin: "",
        },
        summary: currentData.summary || "",
        experience: currentData.experience || [],
        education: currentData.education || [],
        skills: Array.isArray(currentData.skills) ? currentData.skills : [],
        languages: Array.isArray(currentData.languages)
          ? currentData.languages
          : [],
        projects: currentData.projects || [],
        awards: currentData.awards || [],
        activities: currentData.activities || [],
      };
      await updateUserProfile({ resume: resumeData });
      toast({
        title: t("resume.create.saveSuccess"),
        description: t("resume.create.saveSuccessDesc"),
      });
    } catch (error) {
      console.error("Failed to save resume", error);
      toast({
        title: t("resume.create.saveError"),
        description: t("messages.errorOccurred"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = () => {
    setIsDownloading(true);
    const resumeData = form.getValues();
    const labels: ResumeLabels = {
      summary: t("resume.create.summarySection"),
      experience: t("resume.create.experienceSection"),
      education: t("resume.create.educationSection"),
      skills: t("resume.create.skillsSection"),
      languages: t("resume.create.languagesSection"),
      projects: t("resume.create.projectsSection"),
      awards: t("resume.create.awardsSection"),
      activities: t("resume.create.activitiesSection"),
    };

    setPrintingResume({ data: resumeData, labels });

    setTimeout(() => {
      if (printRef.current) {
        html2canvas(printRef.current, { scale: 3, useCORS: true })
          .then((canvas) => {
            const imgData = canvas.toDataURL("image/jpeg", 0.9);
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${resumeData.contact.name || "resume"}.pdf`);
          })
          .catch((err) => {
            console.error("PDF generation failed:", err);
            toast({
              title: t("resume.create.pdfErrorTitle"),
              description: t("resume.create.pdfErrorDesc"),
              variant: "destructive",
            });
          })
          .finally(() => {
            setIsDownloading(false);
            setPrintingResume(null);
          });
      } else {
        setIsDownloading(false);
        setPrintingResume(null);
        toast({
          title: t("resume.create.pdfErrorTitle"),
          description: "Could not find printable component.",
          variant: "destructive",
        });
      }
    }, 200);
  };

  return (
    <div className="space-y-6">
      {printingResume && (
        <div
          style={{
            position: "absolute",
            left: "-9999px",
            top: 0,
            zIndex: -100,
          }}
        >
          <PrintableResume
            innerRef={printRef}
            resume={printingResume.data}
            labels={printingResume.labels}
          />
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>{t("resume.create.title")}</CardTitle>
          <CardDescription>
            {t("resume.create.autofillSuccessDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="language-toggle">{t("general.mongolian")}</Label>
            <Switch
              id="language-toggle"
              checked={language === "en"}
              onCheckedChange={(checked) => setLanguage(checked ? "en" : "mn")}
            />
            <Label htmlFor="language-toggle">{t("general.english")}</Label>
          </div>
          <Button
            onClick={() => fileUploadRef.current?.open()}
            disabled={!!isAiLoading}
            variant="outline"
            className="w-full md:w-auto"
          >
            {isAiLoading === "autofill" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="mr-2 h-4 w-4" />
            )}
            {t("buttons.autofillFromPdf")}
          </Button>
          <div className="hidden">
            <FileUpload ref={fileUploadRef} onFileUpload={handleAutofill} />
          </div>
        </CardContent>
      </Card>

      <form className="space-y-6">
        <Accordion
          type="multiple"
          defaultValue={["item-1", "item-2", "item-3"]}
          className="w-full"
        >
          <AccordionItem value="item-1">
            <AccordionTrigger>
              {t("resume.create.contactSection")}
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder={t("labels.name")}
                  {...form.register("contact.name")}
                />
                <Input
                  placeholder={t("labels.email")}
                  {...form.register("contact.email")}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder={t("labels.phoneNumber")}
                  {...form.register("contact.phone")}
                />
                <Input
                  placeholder={t("labels.linkedinProfile")}
                  {...form.register("contact.linkedin")}
                />
              </div>
              <Input
                placeholder={t("placeholders.locationExample")}
                {...form.register("contact.address")}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>
              {t("resume.create.summarySection")}
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <Textarea
                placeholder={t("placeholders.professionalSummary")}
                {...form.register("summary")}
                className="min-h-[100px]"
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>
              {t("resume.create.experienceSection")}
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              {expFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 border rounded-md space-y-3 relative bg-background/50"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder={t("labels.jobTitle")}
                      {...form.register(`experience.${index}.jobTitle`)}
                    />
                    <Input
                      placeholder={t("labels.company")}
                      {...form.register(`experience.${index}.company`)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder={t("labels.startDate")}
                      {...form.register(`experience.${index}.startDate`)}
                    />
                    <Input
                      placeholder={t("labels.endDate")}
                      {...form.register(`experience.${index}.endDate`)}
                    />
                  </div>
                  <div className="relative">
                    <Textarea
                      placeholder={t("resume.create.descriptionPlaceholder")}
                      {...form.register(`experience.${index}.description`)}
                      className="min-h-[120px] pr-12"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => handleImproveDescription(index)}
                      disabled={!!isAiLoading}
                    >
                      {isAiLoading === `improve-${index}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-primary" />
                      )}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute -top-1 -right-1 text-destructive hover:bg-destructive/10"
                    onClick={() => removeExp(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  appendExp({
                    id: crypto.randomUUID(),
                    jobTitle: "",
                    company: "",
                    startDate: "",
                    endDate: "",
                    description: "",
                  })
                }
              >
                <PlusCircle className="mr-2 h-4 w-4" />{" "}
                {t("resume.create.addExperience")}
              </Button>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>
              {t("resume.create.educationSection")}
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              {eduFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 border rounded-md space-y-3 relative bg-background/50"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder={t("labels.school")}
                      {...form.register(`education.${index}.school`)}
                    />
                    <Input
                      placeholder={t("labels.degree")}
                      {...form.register(`education.${index}.degree`)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder={t("labels.startDate")}
                      {...form.register(`education.${index}.startDate`)}
                    />
                    <Input
                      placeholder={t("labels.endDate")}
                      {...form.register(`education.${index}.endDate`)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute -top-1 -right-1 text-destructive hover:bg-destructive/10"
                    onClick={() => removeEdu(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  appendEdu({
                    id: crypto.randomUUID(),
                    school: "",
                    degree: "",
                    startDate: "",
                    endDate: "",
                  })
                }
              >
                <PlusCircle className="mr-2 h-4 w-4" />{" "}
                {t("resume.create.addEducation")}
              </Button>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger>
              {t("resume.create.skillsSection")}
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="flex gap-2">
                <Input
                  placeholder={t("resume.create.addSkillPlaceholder")}
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddSkill(e);
                    }
                  }}
                />
                <Button type="button" onClick={handleAddSkill}>
                  <PlusCircle className="mr-2 h-4 w-4" />{" "}
                  {t("resume.create.addSkillButton")}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(skillsValue) &&
                  skillsValue.map((skill, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="pl-3 pr-1 py-1 text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-1.5 rounded-full hover:bg-background/20 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-9">
            <AccordionTrigger>
              {t("resume.create.languagesSection")}
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="flex gap-2">
                <Input
                  placeholder={t("resume.create.addLanguagePlaceholder")}
                  value={currentLanguage}
                  onChange={(e) => setCurrentLanguage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddLanguage(e);
                    }
                  }}
                />
                <Button type="button" onClick={handleAddLanguage}>
                  <PlusCircle className="mr-2 h-4 w-4" />{" "}
                  {t("resume.create.addLanguageButton")}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(languagesValue) &&
                  languagesValue.map((lang, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="pl-3 pr-1 py-1 text-sm"
                    >
                      {lang}
                      <button
                        type="button"
                        onClick={() => handleRemoveLanguage(lang)}
                        className="ml-1.5 rounded-full hover:bg-background/20 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-6">
            <AccordionTrigger>
              {t("resume.create.projectsSection")}
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              {projFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 border rounded-md space-y-3 relative bg-background/50"
                >
                  <Input
                    placeholder={t("labels.title")}
                    {...form.register(`projects.${index}.title`)}
                  />
                  <Textarea
                    placeholder={t("labels.description")}
                    {...form.register(`projects.${index}.description`)}
                    className="min-h-[100px]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute -top-1 -right-1 text-destructive hover:bg-destructive/10"
                    onClick={() => removeProj(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  appendProj({
                    id: crypto.randomUUID(),
                    title: "",
                    description: "",
                  })
                }
              >
                <PlusCircle className="mr-2 h-4 w-4" />{" "}
                {t("resume.create.addProject")}
              </Button>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-7">
            <AccordionTrigger>
              {t("resume.create.awardsSection")}
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              {awardFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 border rounded-md space-y-3 relative bg-background/50"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder={t("labels.title")}
                      {...form.register(`awards.${index}.title`)}
                    />
                    <Input
                      placeholder={t("labels.date")}
                      {...form.register(`awards.${index}.date`)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute -top-1 -right-1 text-destructive hover:bg-destructive/10"
                    onClick={() => removeAward(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  appendAward({ id: crypto.randomUUID(), title: "", date: "" })
                }
              >
                <PlusCircle className="mr-2 h-4 w-4" />{" "}
                {t("resume.create.addAward")}
              </Button>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-8">
            <AccordionTrigger>
              {t("resume.create.activitiesSection")}
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              {actFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 border rounded-md space-y-3 relative bg-background/50"
                >
                  <Input
                    placeholder={t("labels.title")}
                    {...form.register(`activities.${index}.title`)}
                  />
                  <Textarea
                    placeholder={t("labels.description")}
                    {...form.register(`activities.${index}.description`)}
                    className="min-h-[100px]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute -top-1 -right-1 text-destructive hover:bg-destructive/10"
                    onClick={() => removeAct(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  appendAct({
                    id: crypto.randomUUID(),
                    title: "",
                    description: "",
                  })
                }
              >
                <PlusCircle className="mr-2 h-4 w-4" />{" "}
                {t("resume.create.addActivity")}
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </form>

      <Card>
        <CardContent className="pt-6 flex flex-col md:flex-row justify-end items-center gap-2">
          <Button
            onClick={handleSaveResume}
            disabled={isSaving}
            variant="outline"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving ? t("buttons.processing") : t("buttons.save")}
          </Button>
          <Button onClick={handleDownloadPdf} disabled={isDownloading}>
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isDownloading ? t("buttons.processing") : t("buttons.downloadPdf")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
