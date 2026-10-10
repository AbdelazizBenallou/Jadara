import { execFileSync } from "child_process";
import crypto from "crypto";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import Mustache from "mustache";
import { tmpdir } from "os";
import { join } from "path";
import { fileURLToPath } from "url";
import { CV_SECTIONS, TEMPLATE_VERSION, type CvSection } from "./cv-pdf.constants.js";

export type SnapshotDate = string | Date | null | undefined;

/** Point-in-time CV data as stored in cv_generation_requests.cv_snapshot. */
export interface CvSnapshotData {
  user: { email: string } | null;
  profile: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    date_of_birth: SnapshotDate;
    gender: string | null;
    bio: string | null;
    location: string | null;
  } | null;
  education: Array<{
    school: string;
    degree: string;
    field_of_study: string | null;
    description: string | null;
    start_date: SnapshotDate;
    end_date: SnapshotDate;
    is_current: boolean;
  }>;
  workExperience: Array<{
    company: string;
    job_title: string;
    description: string | null;
    start_date: SnapshotDate;
    end_date: SnapshotDate;
    is_current: boolean;
  }>;
  skills: Array<{
    level: string;
    skills: { name: string; category: { name: string } | null };
  }>;
  languages: Array<{ proficiency: string; languages: { name: string } }>;
  certifications: Array<{
    name: string;
    issuer: string | null;
    issue_date: SnapshotDate;
    expiry_date: SnapshotDate;
  }>;
  projects: Array<{
    title: string;
    description: string | null;
    github_url: string | null;
    live_url: string | null;
    figma_url: string | null;
    start_date: SnapshotDate;
    end_date: SnapshotDate;
    created_at: SnapshotDate;
    sub_domain: { id: number; name: string } | null;
  }>;
  volunteering: Array<{
    completed_at: SnapshotDate;
    activity: {
      title: string;
      location: string | null;
      start_date: SnapshotDate;
      end_date: SnapshotDate;
    };
    organization: { name: string };
  }>;
}

/** Wrapper persisted to the job row: the audit cursor + the frozen CV data. */
export interface CvJobSnapshot {
  audit_id: number;
  data: CvSnapshotData;
}

const sha256 = (value: string): string => crypto.createHash("sha256").update(value).digest("hex");

/** JSON round-trip so Date instances become ISO strings (JSON-column safe). */
export function toSnapshot<T>(data: T): CvSnapshotData {
  return JSON.parse(JSON.stringify(data)) as CvSnapshotData;
}

export function computeSectionHashes(snapshot: CvSnapshotData): Record<CvSection, string> {
  const parts: Record<CvSection, unknown> = {
    profile: { user: snapshot.user, profile: snapshot.profile },
    work_experience: snapshot.workExperience,
    education: snapshot.education,
    skills: snapshot.skills,
    languages: snapshot.languages,
    certifications: snapshot.certifications,
    projects: snapshot.projects,
    volunteering: snapshot.volunteering,
  };

  const hashes = {} as Record<CvSection, string>;
  for (const section of CV_SECTIONS) {
    hashes[section] = sha256(JSON.stringify(parts[section] ?? null));
  }
  return hashes;
}

export function computeDataHash(snapshot: CvSnapshotData): string {
  return sha256(JSON.stringify({ snapshot, template: TEMPLATE_VERSION }));
}

export function sectionsEqual(
  a: Record<string, string> | null | undefined,
  b: Record<string, string>,
): boolean {
  if (!a) return false;
  return CV_SECTIONS.every((section) => a[section] === b[section]);
}

function formatDate(date: SnapshotDate): string {
  if (!date) return "Present";
  const d = new Date(date);
  return `${d.toLocaleString("en-US", { month: "short" })} ${d.getFullYear()}`;
}

function escapeLatex(value: string): string {
  return value
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([#%&${}_])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

export interface CvPdfData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skillGroups: Array<{ group: string; skills: Array<{ name: string; level: string }> }>;
  languages: Array<{ name: string; proficiency: string }>;
  experience: Array<{
    company: string;
    job_title: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }>;
  education: Array<{
    school: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
  }>;
  projects: Array<{
    title: string;
    domain: string;
    url: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }>;
  certifications: Array<{ name: string; issuer: string; issueDate: string }>;
  volunteering: Array<{
    title: string;
    organization: string;
    location: string;
    startDate: string;
    endDate: string;
  }>;
}

function splitLines(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/\r?\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const LEVEL_LABEL: Record<string, string> = {
  native: "Natif",
  fluent: "Courant",
  advanced: "Avancé",
  intermediate: "Intermédiaire",
  beginner: "Débutant",
  expert: "Expert",
};

const LEVEL_LABEL_EN: Record<string, string> = {
  native: "Native",
  fluent: "Fluent",
  advanced: "Advanced",
  intermediate: "Intermediate",
  beginner: "Beginner",
  expert: "Expert",
};

function levelLabel(level: string, language: string): string {
  if (language === "EN") return LEVEL_LABEL_EN[level] || level;
  return LEVEL_LABEL[level] || level;
}

const CATEGORY_LABEL: Record<string, string> = {
  "Technical Skills": "Compétences techniques",
  "Soft Skills": "Compétences comportementales",
};

const CATEGORY_ORDER: Record<string, number> = {
  "Technical Skills": 0,
  "Soft Skills": 1,
};

const SKILL_LEVEL_ORDER: Record<string, number> = {
  expert: 0,
  advanced: 1,
  intermediate: 2,
  beginner: 3,
};

function groupByCategory(
  skills: Array<{ level: string; skills: { name: string; category: { name: string } | null } }>,
  language: string,
) {
  const byCategory: Array<{ group: string; skills: Array<{ name: string; level: string }> }> = [];
  const index = new Map<string, number>();

  for (const s of skills) {
    const category = s.skills.category?.name || "Technical Skills";
    const group = language === "EN" ? category : CATEGORY_LABEL[category] || category;
    let idx = index.get(group);
    if (idx === undefined) {
      idx = byCategory.length;
      index.set(group, idx);
      byCategory.push({ group, skills: [] });
    }
    byCategory[idx].skills.push({ name: s.skills.name, level: s.level });
  }

  return byCategory
    .sort((a, b) => (CATEGORY_ORDER[a.group] ?? 9) - (CATEGORY_ORDER[b.group] ?? 9))
    .map((g) => ({
      group: g.group,
      skills: g.skills
        .sort(
          (a, b) =>
            (SKILL_LEVEL_ORDER[a.level] ?? 9) - (SKILL_LEVEL_ORDER[b.level] ?? 9) ||
            a.name.localeCompare(b.name),
        )
        .map((s) => ({ name: s.name, level: levelLabel(s.level, language) })),
    }));
}

export function buildTemplateData(snapshot: CvSnapshotData, language: string): CvPdfData {
  const p = snapshot.profile;
  const fullName = `${p?.first_name || ""} ${p?.last_name || ""}`.trim();

  return {
    fullName,
    email: snapshot.user?.email || "",
    phone: p?.phone || "",
    location: p?.location || "",
    summary: p?.bio || "",

    experience: snapshot.workExperience.map((e) => ({
      company: e.company,
      job_title: e.job_title,
      startDate: formatDate(e.start_date),
      endDate: e.is_current ? "Present" : formatDate(e.end_date),
      bullets: splitLines(e.description),
    })),

    education: snapshot.education.map((e) => ({
      school: e.school,
      degree: e.degree,
      fieldOfStudy: e.field_of_study || "",
      startDate: formatDate(e.start_date),
      endDate: e.is_current ? "Present" : formatDate(e.end_date),
    })),

    skillGroups: groupByCategory(snapshot.skills, language),

    languages: snapshot.languages.map((l) => ({
      name: l.languages.name,
      proficiency: levelLabel(l.proficiency, language),
    })),

    certifications: snapshot.certifications.map((c) => ({
      name: c.name,
      issuer: c.issuer || "",
      issueDate: c.issue_date ? formatDate(c.issue_date) : "",
    })),

    projects: snapshot.projects.map((proj) => {
      const url = proj.github_url || proj.live_url || proj.figma_url || "";
      return {
        title: proj.title,
        domain: proj.sub_domain ? proj.sub_domain.name : "",
        url,
        startDate: proj.start_date ? formatDate(proj.start_date) : formatDate(proj.created_at),
        endDate: proj.end_date ? formatDate(proj.end_date) : "",
        bullets: splitLines(proj.description),
      };
    }),

    volunteering: snapshot.volunteering.map((v) => {
      const start = v.activity.start_date ? new Date(v.activity.start_date) : null;
      const end = v.activity.end_date ? new Date(v.activity.end_date) : null;
      const samePeriod =
        !!start && !!end && start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
      return {
        title: v.activity.title,
        organization: v.organization.name,
        location: v.activity.location || "",
        startDate: formatDate(v.activity.start_date),
        endDate: samePeriod ? "" : formatDate(v.activity.end_date),
      };
    }),
  };
}

function buildLatexCvContext(data: CvPdfData, language: string): Record<string, unknown> {
  const esc = escapeLatex;

  const skillGroups = data.skillGroups.map((g) => {
    const lines: string[] = [];
    let currentLevel = "";
    let currentNames: string[] = [];

    for (const s of g.skills) {
      const name = esc(s.name);
      if (s.level !== currentLevel) {
        if (currentNames.length) lines.push(`${currentNames.join(", ")} — ${esc(currentLevel)}`);
        currentNames = [name];
        currentLevel = s.level;
      } else {
        currentNames.push(name);
      }
    }
    if (currentNames.length) lines.push(`${currentNames.join(", ")} — ${esc(currentLevel)}`);

    return { group: esc(g.group), lines };
  });

  const experience = data.experience.map((e) => {
    const bullets = e.bullets.map(esc);
    return {
      job_title: esc(e.job_title),
      startDate: esc(e.startDate),
      endDate: esc(e.endDate),
      company: esc(e.company),
      hasBullets: bullets.length > 0,
      bullets,
    };
  });

  const projects = data.projects.map((pr) => {
    const bullets = pr.bullets.map(esc);
    return {
      title: esc(pr.title),
      domain: esc(pr.domain),
      startDate: esc(pr.startDate),
      endDate: esc(pr.endDate),
      url: esc(pr.url),
      hasBullets: bullets.length > 0,
      bullets,
    };
  });

  const education = data.education.map((e) => ({
    school: esc(e.school),
    degree: esc(e.degree),
    fieldOfStudy: esc(e.fieldOfStudy),
    startDate: esc(e.startDate),
    endDate: esc(e.endDate),
  }));

  const certifications = data.certifications.map((c) => ({
    name: esc(c.name),
    issuer: esc(c.issuer),
    issueDate: esc(c.issueDate),
  }));

  const languagesLine = data.languages
    .map((l) => `${esc(l.name)} (${esc(l.proficiency)})`)
    .join(" \\hspace{2em} ");

  const volunteering = data.volunteering.map((v) => ({
    title: esc(v.title),
    organization: esc(v.organization),
    location: esc(v.location),
    startDate: esc(v.startDate),
    endDate: esc(v.endDate),
  }));

  return {
    en: language === "EN",
    pdfTitle: esc(`CV - ${data.fullName}`),
    fullName: esc(data.fullName),
    email: esc(data.email),
    phone: esc(data.phone),
    location: esc(data.location),
    summary: esc(data.summary),
    hasSkills: skillGroups.length > 0,
    skillGroups,
    hasExperience: experience.length > 0,
    experience,
    hasProjects: projects.length > 0,
    projects,
    hasEducation: education.length > 0,
    education,
    hasCertifications: certifications.length > 0,
    certifications,
    hasLanguages: languagesLine.length > 0,
    languagesLine,
    hasVolunteering: volunteering.length > 0,
    volunteering,
  };
}

export function renderLatexCv(data: CvPdfData, language: string): Buffer {
  const templatesDir = fileURLToPath(new URL("../../../templates/", import.meta.url));
  const workDir = mkdtempSync(join(tmpdir(), "jadara-cv-"));
  const outDir = join(workDir, "out");
  mkdirSync(outDir, { recursive: true });

  try {
    const context = buildLatexCvContext(data, language);
    const template = readFileSync(join(templatesDir, "ats-cv.tex"), "utf8");
    const tex = Mustache.render(template, context);

    copyFileSync(join(templatesDir, "resume.cls"), join(workDir, "resume.cls"));
    writeFileSync(join(workDir, "cv.tex"), tex);

    execFileSync(
      "pdflatex",
      [
        "-interaction=nonstopmode",
        "-halt-on-error",
        "-output-directory",
        outDir,
        join(workDir, "cv.tex"),
      ],
      { stdio: "pipe", cwd: workDir },
    );

    return readFileSync(join(outDir, "cv.pdf"));
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

export { TEMPLATE_VERSION };
