import prisma from "../../../framework/config/prisma.js";

const workSelect = {
  id: true,
  company: true,
  job_title: true,
  description: true,
  start_date: true,
  end_date: true,
  is_current: true,
  created_at: true,
  updated_at: true,
};

const educationSelect = {
  id: true,
  school: true,
  degree: true,
  field_of_study: true,
  description: true,
  start_date: true,
  end_date: true,
  is_current: true,
  created_at: true,
  updated_at: true,
};

const certificationSelect = {
  id: true,
  name: true,
  issuer: true,
  issue_date: true,
  expiry_date: true,
  credential_url: true,
  file_url: true,
  created_at: true,
  updated_at: true,
};

const languageSelect = {
  id: true,
  language_id: true,
  proficiency: true,
  created_at: true,
  updated_at: true,
  languages: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
};

export const cvRepository = {
  // ─── Work Experience ────────────────────────────────────────
  async getWorkExperience(userId: number) {
    return prisma.work_experience.findMany({
      where: { user_id: userId },
      select: workSelect,
      orderBy: { start_date: "desc" },
    });
  },

  async createWorkExperience(
    userId: number,
    data: {
      company: string;
      job_title: string;
      description?: string;
      start_date?: Date;
      end_date?: Date | null;
      is_current?: boolean;
    },
  ) {
    return prisma.work_experience.create({
      data: { user_id: userId, ...data },
      select: workSelect,
    });
  },

  async updateWorkExperience(
    userId: number,
    id: number,
    data: {
      company?: string;
      job_title?: string;
      description?: string | null;
      start_date?: Date;
      end_date?: Date | null;
      is_current?: boolean;
    },
  ) {
    const result = await prisma.work_experience.updateMany({
      where: { id, user_id: userId },
      data,
    });
    if (result.count === 0) return null;
    return prisma.work_experience.findUnique({ where: { id }, select: workSelect });
  },

  async deleteWorkExperience(userId: number, id: number) {
    const result = await prisma.work_experience.deleteMany({
      where: { id, user_id: userId },
    });
    return result.count;
  },

  // ─── Education ──────────────────────────────────────────────
  async getEducation(userId: number) {
    return prisma.education.findMany({
      where: { user_id: userId },
      select: educationSelect,
      orderBy: { start_date: "desc" },
    });
  },

  async createEducation(
    userId: number,
    data: {
      school: string;
      degree: string;
      field_of_study?: string;
      description?: string;
      start_date?: Date;
      end_date?: Date | null;
      is_current?: boolean;
    },
  ) {
    return prisma.education.create({
      data: { user_id: userId, ...data },
      select: educationSelect,
    });
  },

  async updateEducation(
    userId: number,
    id: number,
    data: {
      school?: string;
      degree?: string;
      field_of_study?: string | null;
      description?: string | null;
      start_date?: Date;
      end_date?: Date | null;
      is_current?: boolean;
    },
  ) {
    const result = await prisma.education.updateMany({
      where: { id, user_id: userId },
      data,
    });
    if (result.count === 0) return null;
    return prisma.education.findUnique({ where: { id }, select: educationSelect });
  },

  async deleteEducation(userId: number, id: number) {
    const result = await prisma.education.deleteMany({
      where: { id, user_id: userId },
    });
    return result.count;
  },

  // ─── Certifications ─────────────────────────────────────────
  async getCertifications(userId: number) {
    return prisma.certifications.findMany({
      where: { user_id: userId },
      select: certificationSelect,
      orderBy: { issue_date: "desc" },
    });
  },

  async createCertification(
    userId: number,
    data: {
      name: string;
      issuer?: string;
      issue_date?: Date;
      expiry_date?: Date | null;
      credential_url?: string;
      file_url?: string;
    },
  ) {
    return prisma.certifications.create({
      data: { user_id: userId, ...data },
      select: certificationSelect,
    });
  },

  async updateCertification(
    userId: number,
    id: number,
    data: {
      name?: string;
      issuer?: string | null;
      issue_date?: Date | null;
      expiry_date?: Date | null;
      credential_url?: string | null;
      file_url?: string | null;
    },
  ) {
    const result = await prisma.certifications.updateMany({
      where: { id, user_id: userId },
      data,
    });
    if (result.count === 0) return null;
    return prisma.certifications.findUnique({ where: { id }, select: certificationSelect });
  },

  async deleteCertification(userId: number, id: number) {
    const result = await prisma.certifications.deleteMany({
      where: { id, user_id: userId },
    });
    return result.count;
  },

  // ─── Languages ──────────────────────────────────────────────
  async getLanguages(userId: number) {
    return prisma.user_languages.findMany({
      where: { user_id: userId },
      select: languageSelect,
      orderBy: { id: "asc" },
    });
  },

  async createLanguage(
    userId: number,
    languageId: number,
    proficiency: "native" | "fluent" | "advanced" | "intermediate" | "beginner",
  ) {
    return prisma.user_languages.create({
      data: { user_id: userId, language_id: languageId, proficiency },
      select: languageSelect,
    });
  },

  async updateLanguage(
    userId: number,
    id: number,
    proficiency: "native" | "fluent" | "advanced" | "intermediate" | "beginner",
  ) {
    const result = await prisma.user_languages.updateMany({
      where: { id, user_id: userId },
      data: { proficiency },
    });
    if (result.count === 0) return null;
    return prisma.user_languages.findUnique({ where: { id }, select: languageSelect });
  },

  async deleteLanguage(userId: number, id: number) {
    const result = await prisma.user_languages.deleteMany({
      where: { id, user_id: userId },
    });
    return result.count;
  },
};
