import type { Role } from "@/constants/roles";
import type { Certification, Education, UserLanguage, WorkExperience } from "./cv";
import type { Project } from "./project";
import type { UserSkill } from "./skill";

export interface UserSocial {
  id: number;
  platform: string;
  url: string;
}

export interface UserProfile {
  first_name: string;
  last_name: string;
  phone?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
  cover?: string | null;
  cover_url?: string | null;
  location?: string | null;
  bio?: string | null;
}

export interface User {
  id: number;
  email: string;
  role: Role;
  status: string;
  name: string;
  profile: UserProfile | null;
  user_socials: UserSocial[];
}

export interface UserPayload {
  id: number;
  email: string;
  role: string;
  status: string;
  profiles?: Record<string, unknown>;
  profile?: Record<string, unknown>;
  user_socials?: UserSocial[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PublicUserProfile {
  id: number;
  email?: string;
  status: string;
  role: string;
  created_at?: string;
  profiles: {
    id?: number;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    gender?: string | null;
    date_of_birth?: string | null;
    avatar?: string | null;
    avatar_url?: string | null;
    cover?: string | null;
    cover_url?: string | null;
    bio?: string | null;
    location?: string | null;
    headline?: string | null;
  } | null;
  user_socials?: UserSocial[];
  work_experiences?: WorkExperience[];
  educations?: Education[];
  certifications?: Certification[];
  user_languages?: UserLanguage[];
  user_skills?: UserSkill[];
  projects?: Project[];
  volunteer_applications?: Array<{
    id: number;
    status: string;
    application_date: string;
    activity: {
      id: number;
      title: string;
      description?: string | null;
      location?: string | null;
      start_date: string;
      end_date: string;
      status: string;
      organization?: { id: number; name: string; location?: string | null } | null;
      category?: { id: number; name: string } | null;
    };
  }>;
  completed_volunteering?: Array<{
    id: number;
    completed_at: string;
    activity: {
      id: number;
      title: string;
      description?: string | null;
      location?: string | null;
      start_date: string;
      end_date: string;
    };
    organization?: { id: number; name: string } | null;
  }>;
  organizations?: Array<{
    id: number;
    name: string;
    description?: string | null;
    website?: string | null;
    email: string;
    phone?: string | null;
    location?: string | null;
    activities?: Array<{
      id: number;
      title: string;
      description?: string | null;
      location?: string | null;
      start_date: string;
      end_date: string;
      status: string;
      is_active: boolean;
      required_volunteers: number;
      category?: { id: number; name: string } | null;
      _count?: {
        applications: number;
        completed: number;
      };
    }>;
  }>;
}

export interface UserAnalytics {
  socialMedia: {
    totalLinks: number;
    usersWithSocial: number;
    usersWithoutSocial: number;
    distribution: Array<{
      id: number;
      platform: string;
      count: number;
      percentage: number;
    }>;
    mostUsedPlatforms: Array<{
      id: number;
      platform: string;
      count: number;
      percentage: number;
    }>;
  };
  profileCompleteness: {
    totalUsers: number;
    withProfilePicture: number;
    withBio: number;
    withContactInfo: number;
    withEducation: number;
    withSkills: number;
    withLanguages: number;
    withSocialLinks: number;
    averagePercentage: number;
    beneficiaryCompleteness?: {
      totalBeneficiaries: number;
      averagePercentage: number;
    };
  };
}
