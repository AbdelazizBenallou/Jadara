import { AppError } from "../../../framework/utils/AppError.js";
import { languageRepository } from "./languages.repository.js";
import type { CreateLanguageInput, UpdateLanguageInput } from "./languages.validator.js";

export const languageService = {
  async getAll(query: { page?: string; limit?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const { languages, total } = await languageRepository.findAll(page, limit);
    const totalPages = Math.ceil(total / limit);

    return {
      languages,
      meta: {
        total,
        page,
        limit,
        totalPages,
        nextCursor: page < totalPages ? page + 1 : null,
      },
    };
  },

  async getById(id: number) {
    const language = await languageRepository.findById(id);
    if (!language) {
      throw new AppError("Language not found", 404);
    }
    return language;
  },

  async create(data: CreateLanguageInput) {
    const existing = await languageRepository.findByName(data.name);
    if (existing) {
      throw new AppError("Language name already exists", 409);
    }
    return languageRepository.create(data.name, data.code, data.status);
  },

  async update(id: number, data: UpdateLanguageInput) {
    const language = await languageRepository.findById(id);
    if (!language) {
      throw new AppError("Language not found", 404);
    }

    if (data.name !== undefined && data.name !== language.name) {
      const duplicate = await languageRepository.findByName(data.name);
      if (duplicate) {
        throw new AppError("Language name already exists", 409);
      }
    }

    return languageRepository.update(id, {
      name: data.name,
      code: data.code,
      status: data.status,
    });
  },

  async remove(id: number) {
    const language = await languageRepository.findById(id);
    if (!language) {
      throw new AppError("Language not found", 404);
    }

    const userCount = await languageRepository.countUserLanguages(id);
    if (userCount > 0) {
      throw new AppError(
        `Cannot delete language: linked to ${userCount} user(s). Unlink them first.`,
        409,
      );
    }

    await languageRepository.remove(id);
  },
};
