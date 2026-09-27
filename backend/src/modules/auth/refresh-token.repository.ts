import { Prisma } from "@prisma/client";
import prisma from "../../../framework/config/prisma.js";
import { hash } from "../../../framework/utils/hash.js";

export const refreshTokenRepository = {
  async create(userId: number, rawToken: string, tx?: Prisma.TransactionClient) {
    const hashed = await hash.token(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const client = tx ?? prisma;
    return client.refresh_tokens.create({
      data: { user_id: userId, token: hashed, expires_at: expiresAt },
    });
  },

  async revokeAllByUserId(userId: number) {
    return prisma.refresh_tokens.deleteMany({ where: { user_id: userId } });
  },

  async deleteExpired() {
    return prisma.refresh_tokens.deleteMany({
      where: { expires_at: { lt: new Date() } },
    });
  },
};
