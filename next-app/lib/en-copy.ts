export const EN_FORMAT_LABELS: Record<string, string> = {
  stage: "Stage",
  musical: "Musical",
};

export const EN_ORIGIN_TYPE_LABELS: Record<string, string> = {
  anime: "Anime",
  manga: "Manga",
  game: "Game",
  novel: "Novel",
  light_novel: "Light Novel",
  visual_novel: "Visual Novel",
  tokusatsu: "Tokusatsu",
  original: "Original",
  mixed_media: "Mixed Media",
  music: "Music",
  idol: "Idol",
  stage: "Stage",
  musical: "Musical",
  movie: "Film",
  drama: "Drama",
  漫画原作: "Manga",
  アニメ原作: "Anime",
  ゲーム原作: "Game",
  メディアミックス: "Mixed Media",
  小説原作: "Novel",
  特撮: "Tokusatsu",
  その他: "Other",
};

export const EN_GENRE_LABELS: Record<string, string> = {
  history: "History / Period",
  fantasy: "Fantasy",
  battle_shonen: "Battle / Action",
  sports: "Sports",
  idol: "Idol",
  music_stage: "Music / Live Stage",
  mystery_suspense: "Mystery / Suspense",
  horror: "Horror",
  comedy: "Comedy",
  otome_female: "Otome / Female-Oriented",
  other: "Other",
};

export const compactListPeriodEn = (period?: string | null) => {
  if (!period) return null;

  const slashDate = period.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (slashDate) {
    const [, year, month, day] = slashDate;
    return `${year}/${month.padStart(2, "0")}/${day.padStart(2, "0")}-`;
  }

  const yearMonth = period.match(/(\d{4})\D{0,2}(\d{1,2})/);
  if (yearMonth) {
    const [, year, month] = yearMonth;
    return `${year}/${month.padStart(2, "0")}-`;
  }

  const yearOnly = period.match(/(\d{4})/);
  if (yearOnly) return `${yearOnly[1]}-`;

  return period;
};

export const formatBirthdayEn = (birthday?: string | null) => {
  const value = String(birthday ?? "").trim();
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export const formatBirthdayLabelEn = (birthdayLabel?: string | null) => {
  const value = String(birthdayLabel ?? "").trim();
  if (!value) return "";

  const monthDay = value.match(/^(\d{1,2})月(\d{1,2})日$/);
  if (monthDay) {
    const date = new Date(2000, Number(monthDay[1]) - 1, Number(monthDay[2]));
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  }

  const monthOnly = value.match(/^(\d{1,2})月$/);
  if (monthOnly) {
    const date = new Date(2000, Number(monthOnly[1]) - 1, 1);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
    }).format(date);
  }

  return value;
};

export const formatAgeEn = (age?: number | null) => {
  if (typeof age !== "number" || !Number.isFinite(age) || age < 0) return null;
  return `${age} y/o`;
};

const toTitleCaseToken = (value: string) =>
  value
    .split(/([-'`])/)
    .map((part) => {
      if (!part || /[-'`]/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join("");

export const slugToEnglishActorName = (slug?: string | null) => {
  const tokens = String(slug ?? "")
    .trim()
    .split("-")
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) return "";

  const ordered = tokens.length >= 2 ? [...tokens.slice(1), tokens[0]] : tokens;
  return ordered.map(toTitleCaseToken).join(" ");
};

export const getEnglishActorName = (actor: {
  slug?: string | null;
  nameEn?: string | null;
  name?: string | null;
}) => {
  const direct = String(actor.nameEn ?? "").trim();
  if (direct) return direct;

  const fromSlug = slugToEnglishActorName(actor.slug);
  if (fromSlug) return fromSlug;

  return String(actor.name ?? "").trim();
};

export const truncateText = (text: string, max: number) =>
  text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1))}...`;

export const toEnglishOriginType = (value?: string | null) => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  return EN_ORIGIN_TYPE_LABELS[raw] ?? raw;
};
