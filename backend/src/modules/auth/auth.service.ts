import prisma from "../../../framework/config/prisma.js";
import { AppError } from "../../../framework/utils/AppError.js";
import { hash } from "../../../framework/utils/hash.js";
import { jwtUtils } from "../../../framework/utils/jwt.js";
import { storage } from "../../../framework/utils/storage.js";
import { BUCKETS } from "../../../framework/config/minio.js";
import { refreshTokenRepository } from "./refresh-token.repository.js";
import { loginHistoryRepository } from "./login-history.repository.js";
import { deviceRepository } from "./device.repository.js";
import type { RegisterInput, LoginInput, ChangePasswordInput } from "./auth.validator.js";

type RegisterResult =
  | {
    pending: false;
    user: { id: number; email: string; status: string; profile: unknown; role: string };
    accessToken: string;
    refreshToken: string;
  }
  | {
    pending: true;
    user: { id: number; email: string; status: string; profile: unknown; role: string };
    demandId: number;
    documents: unknown[];
  };

export const authService = {
  async register(data: RegisterInput, files: Express.Multer.File[] = []): Promise<RegisterResult> {
    const existing = await prisma.users.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError("Email already registered", 409);
    }

    const role = await prisma.roles.findFirst({
      where: { id: data.role_id, is_selectable: true },
    });
    if (!role) {
      throw new AppError("Invalid role", 400);
    }

    const passwordHash = await hash.password(data.password);

    // ── Beneficiary: normal immediate activation ──
    if (role.name === "Beneficiary") {
      const user = await prisma.users.create({
        data: {
          email: data.email,
          password: passwordHash,
          status: "active",
          role_id: role.id,
          profiles: {
            create: {
              first_name: data.first_name,
              last_name: data.last_name,
              phone: data.phone ?? null,
              gender: data.gender ?? null,
            },
          },
        },
        include: {
          profiles: true,
          roles: true,
        },
      });

      const accessToken = jwtUtils.signAccessToken({
        userId: user.id,
        email: user.email,
        role: user.roles.name,
      });
      const refreshToken = jwtUtils.signRefreshToken({ userId: user.id, email: user.email });

      await refreshTokenRepository.create(user.id, refreshToken);

      return {
        pending: false,
        user: {
          id: user.id,
          email: user.email,
          status: user.status,
          profile: user.profiles,
          role: user.roles.name,
        },
        accessToken,
        refreshToken,
      };
    }

    // ── Reviewer: must pick at least one domain ──
    if (role.name === "Reviewer") {
      if (!data.domain_ids || data.domain_ids.length === 0) {
        throw new AppError("Reviewer must select at least one domain", 400);
      }
    }

    if (files.length === 0) {
      throw new AppError("At least one document is required", 400);
    }

    if (data.domain_ids?.length) {
      const found = await prisma.domains.findMany({
        where: { id: { in: data.domain_ids } },
        select: { id: true },
      });
      if (found.length !== data.domain_ids.length) {
        throw new AppError("Some domains do not exist", 400);
      }
    }

    // ── Reviewer / Company: pending demand with uploaded documents ──
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          email: data.email,
          password: passwordHash,
          status: "pending",
          role_id: role.id,
          profiles: {
            create: {
              first_name: data.first_name,
              last_name: data.last_name,
              phone: data.phone ?? null,
              gender: data.gender ?? null,
            },
          },
        },
        include: {
          profiles: true,
          roles: true,
        },
      });

      const demand = await tx.demands.create({
        data: {
          user_id: user.id,
          role_id: role.id,
          status: "pending",
        },
      });

      if (data.domain_ids?.length) {
        await tx.demand_domains.createMany({
          data: data.domain_ids.map((domain_id) => ({
            demand_id: demand.id,
            domain_id,
          })),
        });
      }

      return {
        id: user.id,
        email: user.email,
        status: user.status,
        profile: user.profiles,
        role: user.roles.name,
        demandId: demand.id,
      };
    });

    const documents = [];
    for (const file of files) {
      const result = await storage.upload(BUCKETS.documents, "demands", file, created.id);
      const doc = await prisma.documents.create({
        data: {
          user_id: created.id,
          demand_id: created.demandId,
          name: file.originalname,
          type: "demand",
          file_url: result.objectName,
          file_size: result.fileSize,
          mime_type: result.mimeType,
        },
      });
      documents.push(doc);
    }

    return {
      pending: true,
      user: created,
      demandId: created.demandId,
      documents,
    };
  },

  async login(data: LoginInput, ip: string, userAgent: string) {
    const user = await prisma.users.findUnique({
      where: { email: data.email },
      include: {
        profiles: true,
        roles: true,
        user_socials: {
          select: {
            id: true,
            url: true,
            created_at: true,
            social_platforms: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!user) throw new AppError("Invalid email or password", 401);
    if (user.status !== "active") throw new AppError("Account is not active", 403);

    const valid = await hash.verify(user.password, data.password);
    if (!valid) {
      await loginHistoryRepository.create(user.id, ip, userAgent, false);
      throw new AppError("Invalid email or password", 401);
    }

    const accessToken = jwtUtils.signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.roles.name,
    });
    const refreshToken = jwtUtils.signRefreshToken({ userId: user.id, email: user.email });

    await prisma.$transaction(async (tx) => {
      await refreshTokenRepository.create(user.id, refreshToken, tx);
      await loginHistoryRepository.create(user.id, ip, userAgent, true, tx);
      await deviceRepository.upsert(user.id, ip, userAgent, tx);
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        profile: user.profiles,
        role: user.roles.name,
        user_socials: user.user_socials.map((s) => ({
          id: s.id,
          platform: s.social_platforms.name,
          url: s.url,
          created_at: s.created_at,
        })),
      },
      accessToken,
      refreshToken,
    };
  },

  async refreshAccessToken(userId: number) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        roles: true,
      },
    });

    if (!user || user.status !== "active") {
      throw new AppError("User not found or inactive", 401);
    }

    const accessToken = jwtUtils.signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.roles.name,
    });
    const refreshToken = jwtUtils.signRefreshToken({ userId: user.id, email: user.email });

    await refreshTokenRepository.revokeAllByUserId(userId);
    await refreshTokenRepository.create(userId, refreshToken);

    return { accessToken, refreshToken };
  },

  async changePassword(userId: number, data: ChangePasswordInput) {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const valid = await hash.verify(user.password, data.oldPassword);
    if (!valid) {
      throw new AppError("Current password is incorrect", 401);
    }

    const newHash = await hash.password(data.newPassword);
    await prisma.users.update({ where: { id: userId }, data: { password: newHash } });
    await refreshTokenRepository.revokeAllByUserId(userId);

    return null;
  },

  async logout(userId: number) {
    await refreshTokenRepository.revokeAllByUserId(userId);
  },
};
