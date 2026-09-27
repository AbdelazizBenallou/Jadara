import { Prisma } from "@prisma/client";
import prisma from "../../../framework/config/prisma.js";

function parseDeviceName(userAgent: string): string {
  if (userAgent.includes("Chrome")) return "Chrome Browser";
  if (userAgent.includes("Firefox")) return "Firefox Browser";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari Browser";
  if (userAgent.includes("Edge")) return "Edge Browser";
  if (userAgent.includes("curl")) return "cURL Client";
  if (userAgent.includes("Postman")) return "Postman";
  return "Unknown Device";
}

function generateFingerprint(userId: number, userAgent: string, ip: string): string {
  return `${userId}:${userAgent}:${ip}`;
}

export const deviceRepository = {
  async upsert(userId: number, ip: string, userAgent: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    const fingerprint = generateFingerprint(userId, userAgent, ip);
    const deviceName = parseDeviceName(userAgent);

    return client.devices.upsert({
      where: { device_fingerprint: fingerprint },
      create: {
        user_id: userId,
        device_fingerprint: fingerprint,
        device_name: deviceName,
        last_active: new Date(),
      },
      update: {
        last_active: new Date(),
      },
    });
  },
};
