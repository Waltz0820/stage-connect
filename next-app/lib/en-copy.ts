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

  const jpDate = period.match(/(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/);
  if (jpDate) {
    const [, year, month, day] = jpDate;
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

export const truncateText = (text: string, max: number) =>
  text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1))}…`;

export const toEnglishOriginType = (value?: string | null) => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  return EN_ORIGIN_TYPE_LABELS[raw] ?? raw;
};
