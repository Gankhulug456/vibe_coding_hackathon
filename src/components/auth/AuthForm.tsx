"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import type { UserRole } from "@/types";
import { Eye, EyeOff } from "lucide-react";

interface AuthFormProps {
  isRegister?: boolean;
}

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    ></path>
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    ></path>
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    ></path>
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    ></path>
  </svg>
);

// Schema for Login - role is not part of login with email/password
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

// Schema for Registration - includes role and other details
const registerSchemaBase = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
  role: z.custom<UserRole>(
    (val) => ["student", "organization"].includes(val as string),
    {
      message: "Please select a role.",
    }
  ),
  university: z.string().optional(),
  organizationName: z.string().optional(),
  terms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions." }),
  }),
});

const registerSchema = registerSchemaBase.superRefine((data, ctx) => {
  if (
    data.role === "student" &&
    (!data.university || data.university.trim() === "")
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "University is required for students.",
      path: ["university"],
    });
  }
  if (
    data.role === "organization" &&
    (!data.organizationName || data.organizationName.trim() === "")
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Organization name is required for organizations.",
      path: ["organizationName"],
    });
  }
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export function AuthForm({ isRegister = false }: AuthFormProps) {
  const {
    loginUser,
    registerUser,
    sendPasswordReset,
    signInWithGoogle,
    loading,
  } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const currentSchema = isRegister ? registerSchema : loginSchema;

  const form = useForm<LoginFormValues | RegisterFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      email: "",
      password: "",
      ...(isRegister && {
        name: "",
        role: "student",
        university: "",
        organizationName: "",
        terms: false,
      }),
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = form;
  const selectedRole = watch("role" as keyof RegisterFormValues) as
    | UserRole
    | undefined;

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }
    setIsResetting(true);
    try {
      await sendPasswordReset(resetEmail);
      toast({
        title: t("auth.resetEmailSentTitle"),
        description: t("auth.resetEmailSentDesc", { email: resetEmail }),
      });
      setIsResetModalOpen(false);
      setResetEmail("");
    } catch (error: any) {
      toast({
        title: "Password Reset Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Successful sign-in will trigger a redirect via AuthContext, no toast needed here.
    } catch (error: any) {
      toast({
        title: "Google Sign-In Failed",
        description:
          error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: LoginFormValues | RegisterFormValues) => {
    setFormError(null);
    try {
      if (isRegister) {
        const regData = data as RegisterFormValues;
        await registerUser(regData);
        toast({
          title: t("auth.registrationSuccessTitle"),
          description: t("auth.registrationSuccessDesc"),
        });
      } else {
        const loginData = data as LoginFormValues;
        await loginUser(loginData.email, loginData.password);
      }
    } catch (error: any) {
      console.error("AuthForm error:", error);
      let toastMessageKey = "messages.errorOccurred";
      let toastTitleKey = isRegister
        ? "auth.registrationFailedTitle"
        : "auth.loginFailedTitle";

      switch (error.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          toastMessageKey = "auth.invalidCredentials";
          break;
        case "auth/email-already-in-use":
          toastMessageKey = "auth.emailAlreadyInUse";
          break;
        case "auth/weak-password":
          toastMessageKey = "auth.weakPassword";
          break;
        case "auth/email-not-verified":
          toastMessageKey = "auth.emailNotVerified";
          break;
        default:
          break;
      }

      toast({
        title: t(toastTitleKey),
        description: t(toastMessageKey, {
          defaultValue: error.message || "An unexpected error occurred.",
        }),
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">
            {isRegister ? t("headings.register") : t("headings.login")}
          </CardTitle>
          <CardDescription>
            {isRegister
              ? t("auth.registerDescription")
              : t("auth.loginDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="name">{t("labels.name")}</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder={t("placeholders.nameExample")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {(errors.name as any).message}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t("labels.email")}</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder={t("placeholders.email")}
              />
              {isRegister && selectedRole === "organization" && (
                <p className="text-xs text-muted-foreground px-1 pt-1">
                  {t("auth.useCompanyEmail")}
                </p>
              )}
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("labels.password")}</Label>
                {!isRegister && (
                  <Button
                    variant="link"
                    type="button"
                    onClick={() => setIsResetModalOpen(true)}
                    className="p-0 h-auto text-sm font-normal"
                  >
                    {t("auth.forgotPasswordLink")}
                  </Button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder={t("placeholders.password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:bg-transparent"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {isRegister && (
              <>
                <div className="space-y-2">
                  <Label>{t("labels.role")}</Label>
                  <Controller
                    name="role"
                    control={control}
                    defaultValue="student"
                    render={({ field }) => (
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value as UserRole}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="student" id="student" />
                          <Label htmlFor="student">{t("labels.student")}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="organization"
                            id="organization"
                          />
                          <Label htmlFor="organization">
                            {t("labels.organization")}
                          </Label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                  {errors.role && (
                    <p className="text-sm text-destructive">
                      {(errors.role as any).message}
                    </p>
                  )}
                </div>

                {selectedRole === "student" && (
                  <div className="space-y-2">
                    <Label htmlFor="university">{t("labels.university")}</Label>
                    <Input
                      id="university"
                      {...register("university")}
                      placeholder={t("placeholders.universityExample")}
                    />
                    {errors.university && (
                      <p className="text-sm text-destructive">
                        {(errors.university as any).message}
                      </p>
                    )}
                  </div>
                )}

                {selectedRole === "organization" && (
                  <div className="space-y-2">
                    <Label htmlFor="organizationName">
                      {t("labels.organizationName")}
                    </Label>
                    <Input
                      id="organizationName"
                      {...register("organizationName")}
                      placeholder={t("placeholders.organizationNameExample")}
                    />
                    {errors.organizationName && (
                      <p className="text-sm text-destructive">
                        {(errors.organizationName as any).message}
                      </p>
                    )}
                  </div>
                )}
                <div className="items-top flex space-x-2">
                  <Controller
                    name="terms"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="terms"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-0.5"
                      />
                    )}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t("auth.agreeTo")}{" "}
                      <Link
                        href="/terms"
                        className="underline hover:text-primary"
                        target="_blank"
                      >
                        {t("pageTitles.terms")}
                      </Link>{" "}
                      &amp;{" "}
                      <Link
                        href="/privacy"
                        className="underline hover:text-primary"
                        target="_blank"
                      >
                        {t("pageTitles.privacy")}
                      </Link>
                      .
                    </label>
                    {errors.terms && (
                      <p className="text-sm text-destructive">
                        {t("auth.acceptTermsError")}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {formError && (
              <p className="text-sm text-destructive text-center">
                {formError}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? t("buttons.processing")
                : isRegister
                ? t("buttons.register")
                : t("buttons.login")}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  {t("auth.orContinueWith")}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <GoogleIcon className="mr-2 h-4 w-4" />
              Google
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
          <p className="text-sm text-muted-foreground">
            {isRegister
              ? t("auth.alreadyHaveAccount")
              : t("auth.dontHaveAccount")}{" "}
            <Button variant="link" asChild className="p-0">
              <Link href={isRegister ? "/login" : "/register"}>
                {isRegister ? t("buttons.login") : t("buttons.register")}
              </Link>
            </Button>
          </p>
        </CardFooter>
      </Card>

      <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("auth.forgotPasswordTitle")}</DialogTitle>
            <DialogDescription>
              {t("auth.forgotPasswordDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reset-email">{t("labels.email")}</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder={t("placeholders.email")}
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("buttons.cancel")}
              </Button>
            </DialogClose>
            <Button onClick={handlePasswordReset} disabled={isResetting}>
              {isResetting ? t("buttons.processing") : t("auth.sendResetLink")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
