
import type { FieldValue } from 'firebase/firestore';

export type UserRole = 'student' | 'organization' | 'admin';

export interface User {
  uid: string;
  name: string;
  email: string;
  university?: string | null;
  major?: string | null;
  skills?: string[];
  interests?: string[];
  organizationName?: string | null;
  phoneNumber?: string | null;
  language: 'en' | 'mn';
  role: UserRole;
  createdAt: Date | FieldValue;
  avatarUrl?: string | null;
  website?: string | null;
  description?: string | null;
  resume?: ResumeData | null;
  isVerified?: boolean | null;
}

export type EmploymentType = 'Internship' | 'Full-time' | 'Part-time';

export interface Internship {
  id?: string; // Firestore document ID, optional for new documents
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  type: 'Local' | 'Remote' | 'International';
  employmentType?: EmploymentType;
  deadline: string; // Keep as ISO string for simplicity, convert to Date on client
  url: string;
  description: string;
  tags: string[];
  requiredMajors?: string[];
  postedBy: string; // Organization's UID
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date | FieldValue;
  updatedAt?: Date | FieldValue;
  applicationMethod: 'inApp' | 'externalUrl';
  requiresCoverLetter?: boolean;
  additionalInfoPrompt?: string;
}

export type ApplicationStatus = 'Saved' | 'Applied' | 'Reviewed' | 'Interviewing' | 'Offered' | 'Rejected' | 'Accepted' | 'Waitlisted';

export interface Application {
  id?: string; // Firestore document ID
  userId: string; // Student's UID
  internshipId: string;
  organizationId: string; // UID of the organization that posted the internship
  internshipTitle: string;
  companyName: string;
  status: ApplicationStatus;
  notes?: string;
  appliedAt: Date | FieldValue;
  updatedAt: Date | FieldValue;
  coverLetterText?: string | null;
  applicantDetails?: Pick<User, 'uid' | 'name' | 'email' | 'university' | 'major' | 'skills' | 'interests' | 'phoneNumber'>;
  resumeData?: ResumeData | null;
}

export interface ResumeFeedback {
  id: string;
  userId: string;
  resumeUrl: string;
  analysis: {
    clarityScore: number;
    keywordScore: number;
    suggestions: string[];
  };
  createdAt: Date | FieldValue;
}

export interface JobMatchFeedback {
  id: string;
  userId: string;
  resumeText?: string;
  jobDescription: string;
  matchResult: {
    relevanceScore: number;
    feedback: string[];
  };
  createdAt: Date | FieldValue;
}

export interface Translations {
  [key: string]: string | Translations;
}

export interface Notification {
  id: string;
  titleKey: string;
  descriptionKey: string;
  descriptionArgs?: Record<string, string | number>;
  timestamp: Date;
  read: boolean;
  link?: string;
}

export interface LearnResource {
  id?: string;
  title_en: string;
  title_mn: string;
  description_en: string;
  description_mn: string;
  content_en: string;
  content_mn: string;
  imageUrl: string;
  tags: string[];
  type: 'article' | 'video' | 'guide';
  createdAt?: Date | FieldValue;
}

export interface Event {
  id?: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string; // ISO string
  location: string;
  type: 'Workshop' | 'Webinar' | 'Career Fair';
  link: string;
  companyName: string;
  postedBy: string; // org uid
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date | FieldValue;
}

// Resume Builder Types
export interface ResumeContact {
    name: string;
    email: string;
    phone: string;
    address: string;
    linkedin: string;
}
export interface ResumeExperience {
    id: string;
    jobTitle: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string;
}
export interface ResumeEducation {
    id: string;
    school: string;
    degree: string;
    startDate: string;
    endDate: string;
}

export interface ResumeProject {
    id: string;
    title: string;
    description: string;
}

export interface ResumeAward {
    id: string;
    title: string;
    date: string;
}

export interface ResumeActivity {
    id: string;
    title: string;
    description: string;
}

export interface ResumeData {
    contact: ResumeContact;
    summary: string;
    experience: ResumeExperience[];
    education: ResumeEducation[];
    skills: string[];
    languages?: string[];
    projects?: ResumeProject[];
    awards?: ResumeAward[];
    activities?: ResumeActivity[];
}
