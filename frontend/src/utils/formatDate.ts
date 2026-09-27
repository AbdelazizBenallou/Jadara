export function formatDate(iso: string, locale: string = "ar") {
  const map: Record<string, string> = { ar: "ar-DZ", en: "en-GB", fr: "fr-FR" };
  try {
    return new Date(iso).toLocaleDateString(map[locale] ?? locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
