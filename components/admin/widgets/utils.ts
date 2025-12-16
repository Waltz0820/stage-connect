export const safeTrim = (v: any) => (typeof v === "string" ? v.trim() : "");

export const toSlug = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]/g, "")
    .replace(/\-+/g, "-");

export const parseCommaList = (s: string): string[] =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export const stringifyPretty = (obj: any) =>
  obj == null ? "" : JSON.stringify(obj, null, 2);

export const parseJsonOr = <T>(text: string, fallback: T): T => {
  const t = (text ?? "").trim();
  if (!t) return fallback;
  try {
    return JSON.parse(t) as T;
  } catch {
    return fallback;
  }
};
