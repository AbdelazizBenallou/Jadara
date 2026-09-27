import { AppError } from "../../../framework/utils/AppError.js";
import { userSkillsRepository } from "./user-skills.repository.js";
import type { SkillLevel } from "@prisma/client";
import type { AddUserSkillsInput, UpdateSkillLevelInput } from "./user-skills.validator.js";

export const userSkillsService = {
  async getSkills(targetUserId: number) {
    await this.ensureUserExists(targetUserId);
    return userSkillsRepository.getSkills(targetUserId);
  },

  async addSkills(targetUserId: number, data: AddUserSkillsInput) {
    await this.ensureUserExists(targetUserId);

    // dedupe repeated skill_ids, keep the FIRST level sent
    const byId = new Map<number, SkillLevel>();
    for (const entry of data.skills) {
      if (!byId.has(entry.skill_id)) {
        byId.set(entry.skill_id, entry.level);
      }
    }
    const requestedIds = [...byId.keys()];

    const [existingIds, linkedIds] = await Promise.all([
      userSkillsRepository.findExistingSkillIds(requestedIds),
      userSkillsRepository.findLinkedSkillIds(requestedIds, targetUserId),
    ]);
    const existingSet = new Set(existingIds);
    const linkedSet = new Set(linkedIds);

    const addedRows: { skill_id: number; level: SkillLevel }[] = [];
    const alreadyLinked: { skill_id: number; level: SkillLevel }[] = [];
    const notFound: number[] = [];

    for (const [skillId, level] of byId) {
      if (!existingSet.has(skillId)) {
        notFound.push(skillId);
      } else if (linkedSet.has(skillId)) {
        alreadyLinked.push({ skill_id: skillId, level });
      } else {
        addedRows.push({ skill_id: skillId, level });
      }
    }

    if (addedRows.length > 0) {
      await userSkillsRepository.addSkills(addedRows, targetUserId);
    }

    const skills = await userSkillsRepository.getSkills(targetUserId);
    return {
      skills,
      already_linked: alreadyLinked.map((s) => s.skill_id),
      not_found: notFound,
    };
  },

  async updateSkillLevel(targetUserId: number, skillId: number, data: UpdateSkillLevelInput) {
    await this.ensureUserExists(targetUserId);

    const link = await userSkillsRepository.findLink(targetUserId, skillId);
    if (!link) {
      throw new AppError("Skill is not assigned to this user", 404);
    }

    await userSkillsRepository.updateLevel(targetUserId, skillId, data.level);
    return userSkillsRepository.getSkills(targetUserId);
  },

  async removeSkill(targetUserId: number, skillId: number) {
    await this.ensureUserExists(targetUserId);

    const deleted = await userSkillsRepository.removeLink(targetUserId, skillId);
    if (deleted === 0) {
      throw new AppError("Skill is not assigned to this user", 404);
    }
  },

  async ensureUserExists(userId: number) {
    const user = await userSkillsRepository.findUserById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
  },
};
