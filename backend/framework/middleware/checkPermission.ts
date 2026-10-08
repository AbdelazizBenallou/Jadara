import type { Request, Response, NextFunction } from "express";
import { cache } from "../utils/cache.js";
import prisma from "../config/prisma.js";
import { response } from "../utils/response.js";
import logger from "../config/logger.js";

async function loadPermissions(userId: number): Promise<string[]> {
  const cacheKey = `permissions:user:${userId}`;

  const cached = await cache.get<string[]>(cacheKey);
  if (cached) return cached;

  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role_permissions: {
            include: { permissions: true },
          },
        },
      },
    },
  });

  const permissions = user?.roles?.role_permissions.map((rp) => rp.permissions.name) ?? [];
  await cache.set(cacheKey, permissions, 60);
  return permissions;
}

const deny = (res: Response): void => {
  response.error(res, "Forbidden", 403);
};

const fail = (res: Response, err: unknown, userId?: number, permission?: string): void => {
  logger.error({ err, userId, permission }, "Permission check failed");
  response.error(res, "Permission check failed", 500);
};

export const checkPermission = (permissionName: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        response.error(res, "Unauthorized", 401);
        return;
      }

      const permissions = await loadPermissions(req.user.userId);
      if (!permissions.includes(permissionName)) {
        deny(res);
        return;
      }

      next();
    } catch (err) {
      fail(res, err, req.user?.userId, permissionName);
    }
  };
};

/** Passes if the user holds ANY of the listed permissions. */
export const checkAnyPermission = (permissionNames: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        response.error(res, "Unauthorized", 401);
        return;
      }

      const permissions = await loadPermissions(req.user.userId);
      if (!permissionNames.some((name) => permissions.includes(name))) {
        deny(res);
        return;
      }

      next();
    } catch (err) {
      fail(res, err, req.user?.userId, permissionNames.join("|"));
    }
  };
};