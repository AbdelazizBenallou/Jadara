export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

export interface SkillCategory {
  id: number;
  name: string;
  description?: string | null;
}

export interface Skill {
  id: number;
  name: string;
  description?: string | null;
  status?: string;
  category_id?: number | null;
  category?: SkillCategory | null;
  created_at?: string;
}

export interface UserSkill {
  id: number;
  skill_id: number;
  level: SkillLevel;
  skills?: { id?: number; name: string } | null;
  name?: string;
}

export interface UserSkillInput {
  skill_id: number;
  level: SkillLevel;
}

export interface SkillInput {
  name: string;
  description?: string;
  category_id?: number;
  status?: string;
}
