import type { Request, Response, NextFunction } from "express";
import { cache } from "../utils/cache.js";
import prisma from "../config/prisma.js";
import { response } from "../utils/response.js";
import logger from "../config/logger.js";

export const checkPermission = (permissionName: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        response.error(res, "Unauthorized", 401);
        return;
      }

      const userId = req.user.userId;
      const cacheKey = `permissions:user:${userId}`;

      let permissions = await cache.get<string[]>(cacheKey);

      if (!permissions) {
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

        if (!user || !user.roles) {
          permissions = [];
        } else {
          permissions = user.roles.role_permissions.map((rp) => rp.permissions.name);
        }

        await cache.set(cacheKey, permissions, 60);
      }

      if (!permissions.includes(permissionName)) {
        response.error(res, "Forbidden", 403);
        return;
      }

      next();
    } catch (err) {
      logger.error(
        { err, userId: req.user?.userId, permission: permissionName },
        "Permission check failed",
      );
      response.error(res, "Permission check failed", 500);
    }
  };
};
