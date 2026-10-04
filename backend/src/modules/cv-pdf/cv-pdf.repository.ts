import type { CVLanguage } from "@prisma/client";
import prisma from "../../../framework/config/prisma.js";

const cvGenRequestSelect = {
  id: true,
  status: true,
  language: true,
  missing_fields: true,
  data_hash: true,
  file_url: true,
  file_size: true,
  error_message: true,
  created_at: true,
  updated_at: true,
};

export const cvPdfRepository = {
  async getLatestRequest(userId: number, language?: CVLanguage) {
    return prisma.cv_generation_requests.findFirst({
      where: {
        user_id: userId,
        ...(language ? { language } : {}),
      },
      select: cvGenRequestSelect,
      orderBy: { id: "desc" },
    });
  },

  async getLatestCompleted(userId: number, language?: CVLanguage) {
    return prisma.cv_generation_requests.findFirst({
      where: {
        user_id: userId,
        status: "completed",
        ...(language ? { language } : {}),
      },
      select: cvGenRequestSelect,
      orderBy: { id: "desc" },
    });
  },

  async createRequest(
    userId: number,
    status: string,
    missingFields?: string[],
    dataHash?: string,
    language: CVLanguage = "EN",
  ) {
    return prisma.cv_generation_requests.create({
      data: {
        user_id: userId,
        status,
        language,
        missing_fields: missingFields ?? undefined,
        data_hash: dataHash ?? undefined,
      },
      select: cvGenRequestSelect,
    });
  },

  async updateRequest(
    id: number,
    data: {
      status?: string;
      file_url?: string;
      file_size?: number;
      error_message?: string;
      data_hash?: string;
    },
  ) {
    return prisma.cv_generation_requests.update({
      where: { id },
      data,
      select: cvGenRequestSelect,
    });
  },

  async getRequests(userId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      prisma.cv_generation_requests.findMany({
        where: { user_id: userId },
        select: cvGenRequestSelect,
        skip,
        take: limit,
        orderBy: { id: "desc" },
      }),
      prisma.cv_generation_requests.count({ where: { user_id: userId } }),
    ]);

    return { requests, total };
  },

  // ─── Fetch all CV data for PDF generation ───────────────
  async getAllCvData(userId: number) {
    const [
      user,
      profile,
      education,
      workExperience,
      skills,
      languages,
      certifications,
      socials,
      projects,
    ] = await Promise.all([
      prisma.users.findUnique({
        where: { id: userId },
        select: { email: true },
      }),
      prisma.profiles.findUnique({
        where: { user_id: userId },
        select: {
          first_name: true,
          last_name: true,
          phone: true,
          date_of_birth: true,
          gender: true,
          bio: true,
          location: true,
        },
      }),
      prisma.education.findMany({
        where: { user_id: userId },
        select: {
          school: true,
          degree: true,
          field_of_study: true,
          description: true,
          start_date: true,
          end_date: true,
          is_current: true,
        },
        orderBy: { start_date: "desc" },
      }),
      prisma.work_experience.findMany({
        where: { user_id: userId },
        select: {
          company: true,
          job_title: true,
          description: true,
          start_date: true,
          end_date: true,
          is_current: true,
        },
        orderBy: { start_date: "desc" },
      }),
      prisma.user_skills.findMany({
        where: { user_id: userId },
        select: {
          level: true,
          skills: { select: { name: true } },
        },
      }),
      prisma.user_languages.findMany({
        where: { user_id: userId },
        select: {
          proficiency: true,
          languages: { select: { name: true } },
        },
      }),
      prisma.certifications.findMany({
        where: { user_id: userId },
        select: {
          name: true,
          issuer: true,
          issue_date: true,
          expiry_date: true,
          credential_url: true,
        },
        orderBy: { issue_date: "desc" },
      }),
      prisma.user_socials.findMany({
        where: { user_id: userId },
        select: {
          url: true,
          social_platforms: { select: { name: true } },
        },
      }),
      prisma.projects.findMany({
        where: { user_id: userId },
        select: {
          title: true,
          description: true,
          github_url: true,
          live_url: true,
          figma_url: true,
          status: true,
          created_at: true,
          domains: { select: { id: true, name: true } },
        },
        orderBy: { created_at: "desc" },
      }),
    ]);

    return {
      user,
      profile,
      education,
      workExperience,
      skills,
      languages,
      certifications,
      socials: socials.map((s) => ({
        platform: s.social_platforms.name,
        url: s.url,
      })),
      projects,
    };
  },
};
