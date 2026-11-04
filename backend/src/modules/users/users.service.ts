import { AppError } from "../../../framework/utils/AppError.js";
import { storage } from "../../../framework/utils/storage.js";
import { BUCKETS } from "../../../framework/config/minio.js";
import prisma from "../../../framework/config/prisma.js";
import { userRepository } from "./user.repository.js";
import { cvAudit } from "../cv-pdf/cv-pdf.audit.js";
import type { UpdateUserInput, UpdateProfileInput } from "./users.validator.js";

export const usersService = {
  async getAll(query: { page?: string; limit?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const { users, total } = await userRepository.findAll(page, limit);
    const totalPages = Math.ceil(total / limit);

    return {
      users,
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
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  },

  async update(id: number, data: UpdateUserInput, adminUserId: number) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (data.role_id !== undefined) {
      if (id === adminUserId) {
        throw new AppError("Cannot change your own role", 400);
      }

      const role = await userRepository.findRoleById(data.role_id);
      if (!role) {
        throw new AppError("Invalid role", 400);
      }
    }

    return userRepository.update(id, {
      status: data.status,
      first_name: data.first_name,
      last_name: data.last_name,
      role_id: data.role_id,
    });
  },

  async remove(id: number, adminUserId: number) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (id === adminUserId) {
      throw new AppError("Cannot delete your own account", 400);
    }

    await userRepository.delete(id);
  },

  // ─── Public profile (any authenticated user) ─────────────
  async getPublicProfile(id: number) {
    const user = await userRepository.findPublicProfileById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  },

  // ─── Profile (with avatar URL + socials) ─────────────────
  async getMyProfile(userId: number) {
    const user = await userRepository.findProfileById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  },

  async updateMyProfile(
    userId: number,
    data: UpdateProfileInput,
    avatarFile?: Express.Multer.File,
    coverFile?: Express.Multer.File,
  ) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    let avatarObjectName: string | undefined;
    let coverObjectName: string | undefined;

    if (avatarFile) {
      if (user.profiles?.avatar) {
        await storage.deleteAvatar(user.profiles.avatar);
      }
      const objectName = await storage.uploadAvatar(userId, avatarFile);
      avatarObjectName = objectName;
      await userRepository.updateAvatar(userId, objectName);
    }

    if (coverFile) {
      if ((user.profiles as any)?.cover) {
        await storage.deleteCover((user.profiles as any).cover);
      }
      const objectName = await storage.uploadCover(coverFile, userId);
      coverObjectName = objectName;
      await prisma.profiles.update({
        where: { user_id: userId },
        data: { cover: objectName },
      });
    }

    await userRepository.update(userId, {
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      date_of_birth: data.date_of_birth,
      gender: data.gender,
      bio: data.bio,
      location: data.location,
    });

    const updated: Record<string, unknown> = {};
    if (data.first_name !== undefined) updated.first_name = data.first_name;
    if (data.last_name !== undefined) updated.last_name = data.last_name;
    if (data.phone !== undefined) updated.phone = data.phone;
    if (data.date_of_birth !== undefined) updated.date_of_birth = data.date_of_birth;
    if (data.gender !== undefined) updated.gender = data.gender;
    if (data.bio !== undefined) updated.bio = data.bio;
    if (data.location !== undefined) updated.location = data.location;
    if (avatarFile && avatarObjectName) {
      updated.avatar = avatarFile.originalname;
      updated.avatar_url = await storage.getPresignedUrl(BUCKETS.avatars, avatarObjectName);
    }
    if (coverFile && coverObjectName) {
      updated.cover_url = await storage.getPresignedUrl(BUCKETS.covers, coverObjectName);
    }

    await cvAudit.record({
      userId,
      section: "profile",
      action: "UPDATE",
      entityId: userId,
      newValues: updated,
    });

    return updated;
  },

  // ─── Activity (login history + devices) ──────────────────
  async getActivity(userId: number) {
    return userRepository.getActivity(userId);
  },

  // ─── Socials ─────────────────────────────────────────────
  async getSocialPlatforms() {
    return userRepository.findAllPlatforms();
  },

  async addSocial(userId: number, platformId: number, url: string) {
    const platform = await userRepository.findPlatformById(platformId);
    if (!platform) {
      throw new AppError("Invalid social platform", 400);
    }
    return userRepository.addSocial(userId, platformId, url);
  },

  async removeSocial(userId: number, socialId: number) {
    const deleted = await userRepository.removeSocial(userId, socialId);
    if (deleted === 0) {
      throw new AppError("Social link not found", 404);
    }
  },

  async getUserAnalytics() {
    return userRepository.getUserAnalytics();
  },
};
