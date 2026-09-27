import { AppError } from "../../../framework/utils/AppError.js";
import { storage } from "../../../framework/utils/storage.js";
import { BUCKETS } from "../../../framework/config/minio.js";
import { cvRepository } from "./users-cv.repository.js";
import { languageRepository } from "../languages/languages.repository.js";
import type {
  CreateWorkExperienceInput,
  UpdateWorkExperienceInput,
  CreateEducationInput,
  UpdateEducationInput,
  CreateCertificationInput,
  UpdateCertificationInput,
  CreateLanguageInput,
  UpdateLanguageInput,
} from "./users-cv.validator.js";

export const cvService = {
  // ─── Work Experience ────────────────────────────────────────
  async getWorkExperience(userId: number) {
    return cvRepository.getWorkExperience(userId);
  },

  async createWorkExperience(userId: number, data: CreateWorkExperienceInput) {
    return cvRepository.createWorkExperience(userId, data);
  },

  async updateWorkExperience(userId: number, id: number, data: UpdateWorkExperienceInput) {
    const updated = await cvRepository.updateWorkExperience(userId, id, data);
    if (!updated) throw new AppError("Work experience not found", 404);
    return updated;
  },

  async deleteWorkExperience(userId: number, id: number) {
    const deleted = await cvRepository.deleteWorkExperience(userId, id);
    if (deleted === 0) throw new AppError("Work experience not found", 404);
  },

  // ─── Education ──────────────────────────────────────────────
  async getEducation(userId: number) {
    return cvRepository.getEducation(userId);
  },

  async createEducation(userId: number, data: CreateEducationInput) {
    return cvRepository.createEducation(userId, data);
  },

  async updateEducation(userId: number, id: number, data: UpdateEducationInput) {
    const updated = await cvRepository.updateEducation(userId, id, data);
    if (!updated) throw new AppError("Education not found", 404);
    return updated;
  },

  async deleteEducation(userId: number, id: number) {
    const deleted = await cvRepository.deleteEducation(userId, id);
    if (deleted === 0) throw new AppError("Education not found", 404);
  },

  // ─── Certifications ─────────────────────────────────────────
  async getCertifications(userId: number) {
    return cvRepository.getCertifications(userId);
  },

  async createCertification(
    userId: number,
    data: CreateCertificationInput,
    file?: Express.Multer.File,
  ) {
    let fileUrl: string | undefined;

    if (file) {
      const { objectName } = await storage.upload(
        BUCKETS.certifications,
        "certifications",
        file,
        userId,
      );
      fileUrl = objectName;
    }

    return cvRepository.createCertification(userId, {
      ...data,
      file_url: fileUrl,
    });
  },

  async updateCertification(
    userId: number,
    id: number,
    data: UpdateCertificationInput,
    file?: Express.Multer.File,
  ) {
    const existing = await cvRepository.getCertifications(userId);
    const cert = existing.find((c) => c.id === id);
    if (!cert) throw new AppError("Certification not found", 404);

    let fileUrl: string | undefined;

    if (file) {
      if (cert.file_url) {
        await storage.delete("certifications", cert.file_url);
      }
      const { objectName } = await storage.upload(
        BUCKETS.certifications,
        "certifications",
        file,
        userId,
      );
      fileUrl = objectName;
    }

    const updated = await cvRepository.updateCertification(userId, id, {
      ...data,
      ...(fileUrl !== undefined && { file_url: fileUrl }),
    });
    if (!updated) throw new AppError("Certification not found", 404);
    return updated;
  },

  async deleteCertification(userId: number, id: number) {
    const existing = await cvRepository.getCertifications(userId);
    const cert = existing.find((c) => c.id === id);

    if (cert?.file_url) {
      await storage.delete("certifications", cert.file_url);
    }

    const deleted = await cvRepository.deleteCertification(userId, id);
    if (deleted === 0) throw new AppError("Certification not found", 404);
  },

  // ─── Languages ──────────────────────────────────────────────
  async getLanguages(userId: number) {
    return cvRepository.getLanguages(userId);
  },

  async createLanguage(userId: number, data: CreateLanguageInput) {
    const language = await languageRepository.findById(data.language_id);
    if (!language) throw new AppError("Language not found", 404);

    const existing = await cvRepository.getLanguages(userId);
    const duplicate = existing.find((l) => l.language_id === data.language_id);
    if (duplicate) throw new AppError("Language already added", 409);

    return cvRepository.createLanguage(userId, data.language_id, data.proficiency);
  },

  async updateLanguage(userId: number, id: number, data: UpdateLanguageInput) {
    const updated = await cvRepository.updateLanguage(userId, id, data.proficiency);
    if (!updated) throw new AppError("Language not found", 404);
    return updated;
  },

  async deleteLanguage(userId: number, id: number) {
    const deleted = await cvRepository.deleteLanguage(userId, id);
    if (deleted === 0) throw new AppError("Language not found", 404);
  },
};
