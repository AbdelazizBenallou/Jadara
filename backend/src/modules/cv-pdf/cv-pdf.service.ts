import type { CVLanguage } from "@prisma/client";
import { execFileSync } from "child_process";
import crypto from "crypto";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import Mustache from "mustache";
import { tmpdir } from "os";
import { join } from "path";
import { fileURLToPath } from "url";
import { AppError } from "../../../framework/utils/AppError.js";
import { storage } from "../../../framework/utils/storage.js";
import { BUCKETS } from "../../../framework/config/minio.js";
import { cvPdfRepository } from "./cv-pdf.repository.js";

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "Present";
  const d = new Date(date);
  const month = d.toLocaleString("en-US", { month: "short" });
  return `${month} ${d.getFullYear()}`;
}

function computeHash(data: Record<string, unknown>): string {
  return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
}

const TEMPLATE_VERSION = "8";

function escapeLatex(value: string): string {
  return value
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([#%&${}_])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

interface CvPdfData {
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
  education: Array<{ school: string; degree: string; fieldOfStudy: string; startDate: string; endDate: string }>;
  projects: Array<{
    title: string;
    domain: string;
    url: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }>;
  certifications: Array<{ name: string; issuer: string; issueDate: string }>;
  volunteering: Array<{ title: string; organization: string; location: string; startDate: string; endDate: string }>;
}

function buildLatexCvContext(data: CvPdfData): Record<string, unknown> {
  const esc = escapeLatex;

  const skillGroups = data.skillGroups.map((g) => {
    const lines: string[] = [];
    let currentLevel = "";
    let currentNames: Array<string> = [];

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

    return {
      group: esc(g.group),
      lines,
    };
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

function renderLatexCv(data: CvPdfData): Buffer {
  const templatesDir = fileURLToPath(new URL("../../../templates/", import.meta.url));
  const workDir = mkdtempSync(join(tmpdir(), "jadara-cv-"));
  const outDir = join(workDir, "out");
  mkdirSync(outDir, { recursive: true });

  try {
    const context = buildLatexCvContext(data);
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

function splitLines(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/\r?\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export const cvPdfService = {
  async generate(userId: number, language: CVLanguage = "EN") {
    const cvData = await cvPdfRepository.getAllCvData(userId);

    // ─── Check missing fields ──────────────────────────────
    const missing: string[] = [];
    if (!cvData.education.length) missing.push("education");
    if (!cvData.languages.length) missing.push("languages");
    if (!cvData.skills.length) missing.push("skills");
    if (!cvData.workExperience.length) missing.push("work_experience");

    if (missing.length > 0) {
      const request = await cvPdfRepository.createRequest(userId, "incomplete", missing, undefined, language);
      return {
        status: "incomplete" as const,
        missing,
        request,
        download_url: null,
        existing: false,
      };
    }

    // ─── Change detection ──────────────────────────────────
    const dataHash = computeHash({ data: cvData, template: TEMPLATE_VERSION });
    const latestCompleted = await cvPdfRepository.getLatestCompleted(userId, language);

    if (latestCompleted && latestCompleted.file_url && latestCompleted.data_hash === dataHash) {
      return {
        status: "completed" as const,
        download_url: latestCompleted.file_url,
        existing: true,
        missing: [],
        request: null,
      };
    }

    // ─── Start processing ──────────────────────────────────
    const request = await cvPdfRepository.createRequest(userId, "processing", undefined, dataHash, language);

    try {
      // ─── Build template data ───────────────────────────
      const p = cvData.profile;
      const fullName = `${p?.first_name || ""} ${p?.last_name || ""}`.trim();

      const templateData: CvPdfData = {
        fullName,
        email: cvData.user?.email || "",
        phone: p?.phone || "",
        location: p?.location || "",
        summary: p?.bio || "",

        experience: cvData.workExperience.map((e) => ({
          company: e.company,
          job_title: e.job_title,
          startDate: formatDate(e.start_date),
          endDate: e.is_current ? "Present" : formatDate(e.end_date),
          bullets: splitLines(e.description),
        })),

        education: cvData.education.map((e) => ({
          school: e.school,
          degree: e.degree,
          fieldOfStudy: e.field_of_study || "",
          startDate: formatDate(e.start_date),
          endDate: e.is_current ? "Present" : formatDate(e.end_date),
        })),

        skillGroups: groupByCategory(cvData.skills),

        languages: cvData.languages.map((l) => ({
          name: l.languages.name,
          proficiency: LEVEL_LABEL[l.proficiency] || l.proficiency,
        })),

        certifications: cvData.certifications.map((c) => ({
          name: c.name,
          issuer: c.issuer || "",
          issueDate: c.issue_date ? formatDate(c.issue_date) : "",
        })),

        projects: cvData.projects.map((proj) => {
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

        volunteering: cvData.volunteering.map((v) => {
          const start = formatDate(v.activity.start_date);
          const end = formatDate(v.activity.end_date);
          const samePeriod =
            v.activity.start_date && v.activity.end_date
              ? v.activity.start_date.getFullYear() === v.activity.end_date.getFullYear() &&
                v.activity.start_date.getMonth() === v.activity.end_date.getMonth()
              : false;
          return {
            title: v.activity.title,
            organization: v.organization.name,
            location: v.activity.location || "",
            startDate: start,
            endDate: samePeriod ? "" : end,
          };
        }),
      };

      // ─── Render CV PDF via LaTeX ───────────────────────
      const pdfBuffer = renderLatexCv(templateData);

      // ─── Upload to MinIO ───────────────────────────────
      const fileName = `cv-${p?.first_name || "user"}-${p?.last_name || ""}.pdf`
        .replace(/\s+/g, "-")
        .toLowerCase();
      const { objectName, fileSize } = await storage.uploadBuffer(
        BUCKETS.documents,
        "cv-pdfs",
        userId,
        pdfBuffer,
        fileName,
        "application/pdf",
      );

      // ─── Update request ─────────────────────────────────
      await cvPdfRepository.updateRequest(request.id, {
        status: "completed",
        file_url: objectName,
        file_size: fileSize,
        data_hash: dataHash,
      });

      return {
        status: "completed" as const,
        download_url: objectName,
        existing: false,
        missing: [],
        request,
      };
    } catch (error: unknown) {
      const err = error as Error;
      const errMsg = err.message || "PDF generation failed";
      await cvPdfRepository.updateRequest(request.id, {
        status: "failed",
        error_message: errMsg.substring(0, 1000),
      });
      throw new AppError(`PDF generation failed: ${errMsg.substring(0, 200)}`, 500);
    }
  },

  async getStatus(userId: number, language?: CVLanguage) {
    const latest = await cvPdfRepository.getLatestRequest(userId, language);
    if (!latest) return null;

    let downloadUrl: string | null = null;
    if (latest.status === "completed" && latest.file_url) {
      downloadUrl = await storage.getPresignedUrl(BUCKETS.documents, latest.file_url);
    }

    return {
      id: latest.id,
      status: latest.status,
      language: latest.language,
      missing_fields: latest.missing_fields,
      file_size: latest.file_size,
      error_message: latest.error_message,
      download_url: downloadUrl,
      created_at: latest.created_at,
      updated_at: latest.updated_at,
    };
  },

  async getHistory(userId: number, query: { page?: string; limit?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(20, Math.max(1, Number(query.limit) || 5));

    const { requests, total } = await cvPdfRepository.getRequests(userId, page, limit);
    const totalPages = Math.ceil(total / limit);

    return {
      requests: await Promise.all(
        requests.map(async (r) => ({
          id: r.id,
          status: r.status,
          language: r.language,
          missing_fields: r.missing_fields,
          file_size: r.file_size,
          error_message: r.error_message,
          download_url:
            r.status === "completed" && r.file_url
              ? await storage.getPresignedUrl(BUCKETS.documents, r.file_url)
              : null,
          created_at: r.created_at,
        })),
      ),
      meta: { total, page, limit, totalPages, nextCursor: page < totalPages ? page + 1 : null },
    };
  },
};

// ─── Helpers ─────────────────────────────────────────────────
const LEVEL_LABEL: Record<string, string> = {
  native: "Natif",
  fluent: "Courant",
  advanced: "Avancé",
  intermediate: "Intermédiaire",
  beginner: "Débutant",
  expert: "Expert",
};

const SKILL_LEVEL_ORDER: Record<string, number> = {
  expert: 0,
  advanced: 1,
  intermediate: 2,
  beginner: 3,
};

const CATEGORY_LABEL: Record<string, string> = {
  "Technical Skills": "Compétences techniques",
  "Soft Skills": "Compétences comportementales",
};

const CATEGORY_ORDER: Record<string, number> = {
  "Technical Skills": 0,
  "Soft Skills": 1,
};

function groupByCategory(
  skills: Array<{ level: string; skills: { name: string; category: { name: string } | null } }>,
) {
  const byCategory: Array<{ group: string; skills: Array<{ name: string; level: string }> }> = [];
  const index = new Map<string, number>();

  for (const s of skills) {
    const category = s.skills.category?.name || "Technical Skills";
    let idx = index.get(category);
    if (idx === undefined) {
      idx = byCategory.length;
      index.set(category, idx);
      byCategory.push({ group: CATEGORY_LABEL[category] || category, skills: [] });
    }
    byCategory[idx].skills.push({
      name: s.skills.name,
      level: s.level,
    });
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
        .map((s) => ({ name: s.name, level: LEVEL_LABEL[s.level] || s.level })),
    }));
}