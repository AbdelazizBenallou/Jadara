import crypto from "crypto";
import { env } from "../../../framework/config/env.js";
import logger from "../../../framework/config/logger.js";
import prisma from "../../../framework/config/prisma.js";
import type { CvSnapshotData } from "./cv-pdf.render.js";

export type TranslationLang = "EN" | "FR";

const sha256 = (value: string): string => crypto.createHash("sha256").update(value).digest("hex");

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const EN_MARKERS = [
  "the", "and", "with", "for", "from", "this", "that", "are", "was", "were",
  "have", "has", "project", "team", "work", "experience", "skills", "developed",
];
const FR_MARKERS = [
  "les", "des", "une", "pour", "avec", "dans", "sur", "est", "sont", "qui",
  "que", "projet", "equipe", "travail", "experience", "competences", "developpe",
];

/**
 * Lightweight stopword-based language detector. Defaults to EN when there is
 * not enough signal, so untranslated/technical content passes through as-is.
 */
export function detectLanguage(text: string): TranslationLang {
  const n = normalize(text);
  if (n.trim().length < 3) return "EN";
  const en = EN_MARKERS.reduce((acc, m) => acc + (n.includes(m) ? 1 : 0), 0);
  const fr = FR_MARKERS.reduce((acc, m) => acc + (n.includes(m) ? 1 : 0), 0);
  return fr > en ? "FR" : "EN";
}

export function buildSourceText(snapshot: CvSnapshotData): string {
  const parts: string[] = [
    snapshot.profile?.bio ?? "",
    ...snapshot.workExperience.map((e) => `${e.job_title} ${e.description ?? ""}`),
    ...snapshot.education.map((e) => `${e.degree} ${e.field_of_study ?? ""}`),
    ...snapshot.projects.map((p) => `${p.title} ${p.description ?? ""}`),
    ...snapshot.volunteering.map((v) => v.activity.title),
  ];
  return parts.filter(Boolean).join("\n").trim();
}

async function callLibreTranslate(
  texts: string[],
  source: string,
  target: string,
): Promise<string[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.CV_TRANSLATION_TIMEOUT_MS);
  try {
    const res = await fetch(`${env.LIBRETRANSLATE_URL}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: texts,
        source,
        target,
        format: "text",
        ...(env.LIBRETRANSLATE_API_KEY ? { api_key: env.LIBRETRANSLATE_API_KEY } : {}),
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`LibreTranslate responded ${res.status}`);
    }
    const data = (await res.json()) as { translatedText?: string | string[] };
    const out = data.translatedText;
    if (Array.isArray(out)) return out;
    if (typeof out === "string") return [out];
    throw new Error("LibreTranslate returned an unexpected payload");
  } finally {
    clearTimeout(timeout);
  }
}

/** Translates a list of strings, using cv_translations as a per-item cache. */
export async function translateTexts(
  texts: string[],
  source: string,
  target: string,
): Promise<string[]> {
  const results: string[] = new Array(texts.length);
  const misses: Array<{ index: number; text: string; hash: string }> = [];

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    if (!text.trim()) {
      results[i] = text;
      continue;
    }
    const hash = sha256(text);
    const cached = await prisma.cv_translations.findUnique({
      where: { source_hash_target_lang: { source_hash: hash, target_lang: target } },
      select: { translated_text: true },
    });
    if (cached) {
      results[i] = cached.translated_text;
    } else {
      misses.push({ index: i, text, hash });
    }
  }

  if (misses.length > 0) {
    const translated = await callLibreTranslate(
      misses.map((m) => m.text),
      source,
      target,
    );
    await prisma.$transaction(
      misses.map((m, idx) =>
        prisma.cv_translations.upsert({
          where: { source_hash_target_lang: { source_hash: m.hash, target_lang: target } },
          create: {
            source_hash: m.hash,
            source_lang: source,
            target_lang: target,
            source_text: m.text.slice(0, 2000),
            translated_text: translated[idx] ?? m.text,
          },
          update: { translated_text: translated[idx] ?? m.text },
        }),
      ),
    );
    misses.forEach((m, idx) => {
      results[m.index] = translated[idx] ?? m.text;
    });
  }

  return results;
}

type FieldSlot = {
  get: (s: CvSnapshotData) => string | null | undefined;
  set: (s: CvSnapshotData, v: string) => void;
};

function collectTranslatableFields(snapshot: CvSnapshotData): FieldSlot[] {
  const slots: FieldSlot[] = [];

  if (snapshot.profile?.bio) {
    slots.push({
      get: (s) => s.profile?.bio,
      set: (s, v) => {
        if (s.profile) s.profile.bio = v;
      },
    });
  }
  snapshot.workExperience.forEach((_, i) => {
    slots.push({ get: (s) => s.workExperience[i]?.job_title, set: (s, v) => { s.workExperience[i].job_title = v; } });
    slots.push({ get: (s) => s.workExperience[i]?.description, set: (s, v) => { s.workExperience[i].description = v; } });
  });
  snapshot.education.forEach((_, i) => {
    slots.push({ get: (s) => s.education[i]?.degree, set: (s, v) => { s.education[i].degree = v; } });
    slots.push({ get: (s) => s.education[i]?.field_of_study, set: (s, v) => { s.education[i].field_of_study = v; } });
  });
  snapshot.projects.forEach((_, i) => {
    slots.push({ get: (s) => s.projects[i]?.title, set: (s, v) => { s.projects[i].title = v; } });
    slots.push({ get: (s) => s.projects[i]?.description, set: (s, v) => { s.projects[i].description = v; } });
  });
  snapshot.volunteering.forEach((_, i) => {
    slots.push({
      get: (s) => s.volunteering[i]?.activity.title,
      set: (s, v) => { s.volunteering[i].activity.title = v; },
    });
  });

  return slots;
}

/**
 * Returns a copy of the snapshot with translatable fields translated from
 * `source` to `target`. When translation is disabled, source == target, or the
 * service fails and is not required, the original snapshot is returned.
 */
export async function translateSnapshot(
  snapshot: CvSnapshotData,
  source: string,
  target: string,
): Promise<CvSnapshotData> {
  if (!env.CV_TRANSLATION_ENABLED || source === target) return snapshot;

  try {
    const slots = collectTranslatableFields(snapshot);
    const values = slots.map((slot) => slot.get(snapshot) ?? "");
    const translated = await translateTexts(values, source, target);

    const clone: CvSnapshotData = JSON.parse(JSON.stringify(snapshot)) as CvSnapshotData;
    slots.forEach((slot, i) => {
      if (translated[i]) slot.set(clone, translated[i]);
    });
    return clone;
  } catch (err) {
    if (env.CV_TRANSLATION_REQUIRED) throw err;
    logger.warn({ err }, "CV translation failed; falling back to source text");
    return snapshot;
  }
}
