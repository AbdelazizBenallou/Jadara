import { Prisma } from "@prisma/client";
import prisma from "../../../framework/config/prisma.js";

export const loginHistoryRepository = {
  async create(
    userId: number,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;
    return client.login_history.create({
      data: { user_id: userId, ip_address: ipAddress, user_agent: userAgent, success },
    });
  },

  async findByUserId(userId: number, limit = 20) {
    return prisma.login_history.findMany({
      where: { user_id: userId },
      orderBy: { login_at: "desc" },
      take: limit,
    });
  },
};
