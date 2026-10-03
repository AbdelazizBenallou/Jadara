import crypto from "crypto";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Mustache from "mustache";
import { AppError } from "../../../framework/utils/AppError.js";
import { storage } from "../../../framework/utils/storage.js";
import { BUCKETS } from "../../../framework/config/minio.js";
import { cvPdfRepository } from "./cv-pdf.repository.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

Mustache.tags = ["<<", ">>"];
Mustache.escape = (text: string) => text || "";

function escapeLatex(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/\\/g, "\\textbackslash{}").replace(/[&%$#_{}~^]/g, (ch) => "\\" + ch);
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "Present";
  const d = new Date(date);
  const month = d.toLocaleString("en-US", { month: "short" });
  return `${month} ${d.getFullYear()}`;
}

function computeHash(data: Record<string, unknown>): string {
  return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
}

export const cvPdfService = {
  async generate(userId: number) {
    const cvData = await cvPdfRepository.getAllCvData(userId);

    // ─── Check missing fields ──────────────────────────────
    const missing: string[] = [];
    if (!cvData.education.length) missing.push("education");
    if (!cvData.languages.length) missing.push("languages");
    if (!cvData.skills.length) missing.push("skills");
    if (!cvData.workExperience.length) missing.push("work_experience");

    if (missing.length > 0) {
      const request = await cvPdfRepository.createRequest(userId, "incomplete", missing);
      return {
        status: "incomplete" as const,
        missing,
        request,
        download_url: null,
        existing: false,
      };
    }

    // ─── Change detection ──────────────────────────────────
    const dataHash = computeHash(cvData);
    const latestCompleted = await cvPdfRepository.getLatestCompleted(userId);

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
    const request = await cvPdfRepository.createRequest(userId, "processing", undefined, dataHash);

    try {
      // ─── Build template data ───────────────────────────
      const p = cvData.profile;
      const socials = cvData.socials;
      const findSocialUrl = (platform: string) =>
        escapeLatex(socials.find((s) => s.social_platforms.name === platform)?.url || "");
      const linkedin = findSocialUrl("linkedin");
      const github = findSocialUrl("github");
      const portfolio = findSocialUrl("portfolio");

      const templateData = {
        fullName: `${p?.first_name || ""} ${p?.last_name || ""}`.trim(),
        email: cvData.user?.email ? escapeLatex(cvData.user.email) : "",
        phone: p?.phone || "",
        location: p?.location ? escapeLatex(p?.location) : "",
        bio: p?.bio ? escapeLatex(p?.bio) : "",
        pdfTitle: `CV - ${p?.first_name || ""} ${p?.last_name || ""}`.trim(),

        hasLinkedin: !!linkedin,
        linkedin,
        hasGithub: !!github,
        github,
        hasPortfolio: !!portfolio,
        portfolio,

        hasBio: !!p?.bio,

        hasExperience: cvData.workExperience.length > 0,
        experience: cvData.workExperience.map((e) => {
          const bullets = e.description
            ? e.description
                .split("\n")
                .filter((l) => l.trim())
                .map((l) => escapeLatex(l.trim()))
            : [];
          return {
            company: escapeLatex(e.company),
            job_title: escapeLatex(e.job_title),
            location: "",
            startDate: formatDate(e.start_date),
            endDate: e.is_current ? "Present" : formatDate(e.end_date),
            hasBullets: bullets.length > 0,
            bullets,
          };
        }),

        hasEducation: cvData.education.length > 0,
        education: cvData.education.map((e) => ({
          school: escapeLatex(e.school),
          degree: escapeLatex(e.degree),
          fieldOfStudy: escapeLatex(e.field_of_study || ""),
          location: "",
          startDate: formatDate(e.start_date),
          endDate: e.is_current ? "Present" : formatDate(e.end_date),
        })),

        hasSkills: cvData.skills.length > 0,
        skillGroups: groupSkills(cvData.skills),

        hasLanguages: cvData.languages.length > 0,
        languages: cvData.languages.map((l) => ({
          name: escapeLatex(l.languages.name),
          proficiency: l.proficiency,
        })),

        hasCertifications: cvData.certifications.length > 0,
        certifications: cvData.certifications.map((c) => ({
          name: escapeLatex(c.name),
          issuer: escapeLatex(c.issuer || ""),
          issueDate: c.issue_date ? formatDate(c.issue_date) : "",
          credentialUrl: c.credential_url || "",
        })),

        hasProjects: cvData.projects.length > 0,
        projects: cvData.projects.map((p) => {
          const bullets = p.description
            ? p.description
                .split("\n")
                .filter((l) => l.trim())
                .map((l) => escapeLatex(l.trim()))
            : [];
          const projectUrl = p.github_url || p.live_url || p.figma_url || "";
          return {
            title: escapeLatex(p.title),
            domain: p.domains ? escapeLatex(p.domains.name) : "",
            url: escapeLatex(projectUrl),
            status: p.status ? escapeLatex(p.status.replace("_", " ")) : "",
            startDate: formatDate(p.created_at),
            hasBullets: bullets.length > 0,
            bullets,
          };
        }),
      };

      // ─── Render LaTeX ──────────────────────────────────
      const templatePath = path.resolve(__dirname, "../../../templates/ats-cv.tex");
      const template = readFileSync(templatePath, "utf-8");
      const latex = Mustache.render(template, templateData);

      // ─── Compile PDF ───────────────────────────────────
      const { execFile } = await import("child_process");
      const {
        mkdirSync,
        writeFileSync,
        readFileSync: readFileSyncSync,
        rmSync,
      } = await import("fs");
      const { promisify } = await import("util");
      const execFileAsync = promisify(execFile);

      const tmpDir = path.resolve("/tmp", `cv-pdf-${userId}-${Date.now()}`);
      mkdirSync(tmpDir, { recursive: true });

      const texFile = path.join(tmpDir, "cv.tex");
      writeFileSync(texFile, latex);

      try {
        await execFileAsync(
          "pdflatex",
          ["-interaction=nonstopmode", "-halt-on-error", "-output-directory", tmpDir, texFile],
          { timeout: 30000 },
        );
      } catch (execError: unknown) {
        const err = execError as { stderr?: string; message?: string };
        const logFile = path.join(tmpDir, "cv.log");
        let logTail = err.stderr || err.message || "Unknown error";
        try {
          const logContent = readFileSyncSync(logFile, "utf-8");
          const lines = logContent.split("\n");
          const errorLines = lines.filter(
            (l: string) => l.startsWith("!") || l.includes("Error") || l.includes("Fatal"),
          );
          if (errorLines.length) logTail = errorLines.join("\n");
        } catch (ignored) {
          // ignore
        }
        throw new AppError(`LaTeX compilation failed: ${logTail.substring(0, 500)}`, 500);
      }

      const pdfFile = path.join(tmpDir, "cv.pdf");
      const pdfBuffer = readFileSyncSync(pdfFile);

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

      // ─── Cleanup temp files ─────────────────────────────
      rmSync(tmpDir, { recursive: true, force: true });

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

  async getStatus(userId: number) {
    const latest = await cvPdfRepository.getLatestRequest(userId);
    if (!latest) return null;

    let downloadUrl: string | null = null;
    if (latest.status === "completed" && latest.file_url) {
      downloadUrl = await storage.getPresignedUrl(BUCKETS.documents, latest.file_url);
    }

    return {
      id: latest.id,
      status: latest.status,
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
function groupSkills(skills: Array<{ level: string; skills: { name: string } }>) {
  const levelOrder: Record<string, number> = {
    native: 0,
    fluent: 1,
    advanced: 2,
    intermediate: 3,
    beginner: 4,
  };
  const sorted = [...skills].sort(
    (a, b) => (levelOrder[a.level] ?? 5) - (levelOrder[b.level] ?? 5),
  );

  const byLevel: Record<string, string[]> = {};
  for (const s of sorted) {
    const level = s.level.charAt(0).toUpperCase() + s.level.slice(1);
    if (!byLevel[level]) byLevel[level] = [];
    byLevel[level].push(s.skills.name);
  }

  return Object.entries(byLevel).map(([group, skillList]) => ({
    group,
    skills: skillList.join(", "),
  }));
}
