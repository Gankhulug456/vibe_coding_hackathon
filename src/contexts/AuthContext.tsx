"use client";

import type { User, UserRole } from "@/types";
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
  updatePassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  type User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type FieldValue,
  type Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { useLanguage } from "./LanguageContext";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  role: UserRole | null;
  loginUser: (email: string, password: string) => Promise<void>;
  registerUser: (userData: RegisterFormValues) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logoutUser: () => Promise<void>;
  loading: boolean;
  updateUserProfile: (updatedProfileData: Partial<User>) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

interface RegisterFormValues {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  university?: string;
  organizationName?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { language: currentLanguage } = useLanguage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      const isAdminEmail =
        fbUser?.email?.toLowerCase() === "admin@nomadlyintern.app";

      if (fbUser && (fbUser.emailVerified || isAdminEmail)) {
        const userDocRef = doc(db, "users", fbUser.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const appUser = userDocSnap.data() as Omit<User, "createdAt"> & {
              createdAt: FieldValue | Timestamp;
            };
            setUser({
              ...appUser,
              uid: fbUser.uid,
              email: fbUser.email || appUser.email,
              createdAt: (appUser.createdAt as Timestamp)?.toDate
                ? (appUser.createdAt as Timestamp).toDate()
                : new Date(),
            });
            setRole(appUser.role);
          } else {
            console.warn(
              `User with UID ${fbUser.uid} is authenticated but has no document in Firestore. Signing out.`
            );
            await signOut(auth);
            setUser(null);
            setRole(null);
          }
        } catch (error) {
          console.error(
            "Error fetching user document from Firestore (onAuthStateChanged):",
            error
          );
          await signOut(auth);
          setUser(null);
          setRole(null);
        }
      } else {
        if (fbUser && !fbUser.emailVerified) {
          console.log(
            "User is not verified. Keeping them signed out from app state."
          );
        }
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginUser = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      await userCredential.user.reload();
      const freshUser = auth.currentUser;

      const isAdminEmail = email.toLowerCase() === "admin@nomadlyintern.app";

      if (!freshUser || (!freshUser.emailVerified && !isAdminEmail)) {
        if (freshUser) {
          await sendEmailVerification(freshUser);
        }
        await signOut(auth);
        throw { code: "auth/email-not-verified" };
      }

      const userDocRef = doc(db, "users", freshUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const appUser = userDocSnap.data() as Omit<User, "createdAt"> & {
          createdAt: FieldValue | Timestamp;
        };
        const finalUser = {
          ...appUser,
          uid: freshUser.uid,
          email: freshUser.email || appUser.email,
          createdAt: (appUser.createdAt as Timestamp)?.toDate
            ? (appUser.createdAt as Timestamp).toDate()
            : new Date(),
        };
        setUser(finalUser);
        setRole(finalUser.role);
        setFirebaseUser(freshUser);
      } else {
        console.error(
          `User with UID ${freshUser.uid} is authenticated but has no document in Firestore. Signing out.`
        );
        await signOut(auth);
        throw new Error("User profile not found in database.");
      }
    } catch (error: any) {
      console.error("Firebase login error:", error);
      if (error.code !== "auth/email-not-verified") {
        await signOut(auth).catch((e) =>
          console.error("Signout after error failed", e)
        );
      }
      setUser(null);
      setRole(null);
      setFirebaseUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (userData: RegisterFormValues) => {
    if (!userData.password) {
      throw new Error("Password is required for registration.");
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      const fbUser = userCredential.user;

      const isAdminEmail =
        userData.email.toLowerCase() === "admin@nomadlyintern.app";

      if (!isAdminEmail) {
        await sendEmailVerification(fbUser);
      }

      await updateFirebaseProfile(fbUser, {
        displayName: userData.name,
      });

      const userDocRef = doc(db, "users", fbUser.uid);

      const finalRole = isAdminEmail ? "admin" : userData.role;

      let isVerified: boolean | null = null;
      if (finalRole === "organization") {
        const freeEmailDomains = [
          "gmail.com",
          "yahoo.com",
          "hotmail.com",
          "outlook.com",
          "aol.com",
          "icloud.com",
        ];
        const emailDomain = userData.email.split("@")[1];
        isVerified = !freeEmailDomains.includes(emailDomain.toLowerCase());
      }

      const newUserProfile: Omit<User, "uid" | "createdAt"> & {
        createdAt: FieldValue;
      } = {
        name: userData.name,
        email: fbUser.email!,
        role: finalRole,
        isVerified: isVerified,
        language: currentLanguage,
        avatarUrl: null,
        university:
          finalRole === "student" ? userData.university || null : null,
        organizationName:
          finalRole === "organization"
            ? userData.organizationName || null
            : null,
        major: null,
        skills: [],
        interests: [],
        phoneNumber: null,
        createdAt: serverTimestamp(),
      };

      await setDoc(userDocRef, newUserProfile);

      await signOut(auth);
    } catch (error: any) {
      if (auth.currentUser) {
        await auth.currentUser.delete();
      }
      setLoading(false);
      console.error("Firebase registration error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      const userDocRef = doc(db, "users", fbUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        const newUserProfile: Omit<User, "uid" | "createdAt"> & {
          createdAt: FieldValue;
        } = {
          name: fbUser.displayName || "New User",
          email: fbUser.email!,
          role: "student", // Defaulting to 'student' for social sign-ups
          isVerified: null, // This flag is for organization verification
          language: currentLanguage,
          avatarUrl: fbUser.photoURL,
          university: null,
          organizationName: null,
          major: null,
          skills: [],
          interests: [],
          phoneNumber: fbUser.phoneNumber || null,
          createdAt: serverTimestamp(),
        };
        await setDoc(userDocRef, newUserProfile);
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Firebase logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updatedProfileData: Partial<User>) => {
    if (firebaseUser) {
      setLoading(true);
      const userDocRef = doc(db, "users", firebaseUser.uid);
      try {
        const firestoreSafeData: Record<string, any> = {};
        for (const key in updatedProfileData) {
          if (Object.prototype.hasOwnProperty.call(updatedProfileData, key)) {
            const value = (updatedProfileData as Record<string, any>)[key];
            firestoreSafeData[key] = value === undefined ? null : value;
          }
        }

        if (Object.keys(firestoreSafeData).length > 0) {
          await updateDoc(userDocRef, firestoreSafeData);
        }

        const updatedDocSnap = await getDoc(userDocRef);
        if (updatedDocSnap.exists()) {
          const appUser = updatedDocSnap.data() as Omit<User, "createdAt"> & {
            createdAt: FieldValue | Timestamp;
          };
          setUser({
            ...appUser,
            uid: firebaseUser.uid,
            email: firebaseUser.email || appUser.email,
            createdAt: (appUser.createdAt as Timestamp)?.toDate
              ? (appUser.createdAt as Timestamp).toDate()
              : new Date(),
          });
          setRole(appUser.role);
        }

        const authProfileUpdates: { displayName?: string } = {};
        if (
          firestoreSafeData.name !== undefined &&
          firestoreSafeData.name !== firebaseUser.displayName
        ) {
          authProfileUpdates.displayName = firestoreSafeData.name;
        }

        if (Object.keys(authProfileUpdates).length > 0) {
          await updateFirebaseProfile(firebaseUser, authProfileUpdates);
        }
      } catch (error) {
        console.error("Error updating user profile in Firestore:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    } else {
      console.error("Cannot update profile: Firebase user not available.");
      throw new Error("User not authenticated.");
    }
  };

  const changePassword = async (newPassword: string) => {
    if (!firebaseUser) {
      throw new Error("User not authenticated.");
    }
    setLoading(true);
    try {
      await updatePassword(firebaseUser, newPassword);
    } catch (error: any) {
      console.error("Firebase change password error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        role,
        loginUser,
        registerUser,
        signInWithGoogle,
        logoutUser,
        loading,
        updateUserProfile,
        changePassword,
        sendPasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
