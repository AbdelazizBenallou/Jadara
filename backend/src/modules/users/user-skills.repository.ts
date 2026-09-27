import prisma from "../../../framework/config/prisma.js";
import type { SkillLevel } from "@prisma/client";

export const userSkillsRepository = {
  async findUserById(id: number) {
    return prisma.users.findUnique({ where: { id }, select: { id: true } });
  },

  async getSkills(userId: number) {
    const rows = await prisma.user_skills.findMany({
      where: { user_id: userId },
      select: {
        skill_id: true,
        level: true,
        created_at: true,
        skills: { select: { name: true, status: true } },
      },
      orderBy: { id: "asc" },
    });
    return rows.map((row) => ({
      skill_id: row.skill_id,
      name: row.skills.name,
      level: row.level,
      skill_status: row.skills.status,
      added_at: row.created_at,
    }));
  },

  async findExistingSkillIds(ids: number[]) {
    const rows = await prisma.skills.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    return rows.map((row) => row.id);
  },

  async findLinkedSkillIds(skillIds: number[], userId: number) {
    const rows = await prisma.user_skills.findMany({
      where: { user_id: userId, skill_id: { in: skillIds } },
      select: { skill_id: true },
    });
    return rows.map((row) => row.skill_id);
  },

  async addSkills(rows: { skill_id: number; level: SkillLevel }[], userId: number) {
    await prisma.user_skills.createMany({
      data: rows.map((row) => ({ ...row, user_id: userId })),
      skipDuplicates: true,
    });
  },

  async findLink(userId: number, skillId: number) {
    return prisma.user_skills.findUnique({
      where: { user_id_skill_id: { user_id: userId, skill_id: skillId } },
      select: { id: true },
    });
  },

  async updateLevel(userId: number, skillId: number, level: SkillLevel) {
    await prisma.user_skills.update({
      where: { user_id_skill_id: { user_id: userId, skill_id: skillId } },
      data: { level, updated_at: new Date() },
    });
  },

  async removeLink(userId: number, skillId: number) {
    const result = await prisma.user_skills.deleteMany({
      where: { user_id: userId, skill_id: skillId },
    });
    return result.count;
  },
};
