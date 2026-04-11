import { hasSupabaseEnv } from "./env";
import { createSupabaseServerClient } from "./supabase";

export type ActorLink = {
  slug: string;
  name: string;
  roleName: string | null;
  castGroup: string | null;
  isStarring: boolean | null;
};

export type ActorDetailData = {
  id: string;
  slug: string;
  name: string;
  kana: string | null;
  birthday: string | null;
  birthdayLabel: string | null;
  profile: string | null;
  heightCm: number | null;
  bloodType: string | null;
  imageUrl: string | null;
  sns: Record<string, string> | null;
  plays: Array<{
    slug: string;
    title: string;
    period: string | null;
    summary: string | null;
    vod: Record<string, string> | null;
    roleName: string | null;
    franchiseName: string | null;
    franchiseSlug: string | null;
  }>;
  topSeries: Array<{
    slug: string;
    name: string;
    count: number;
  }>;
  coStars: Array<{
    slug: string;
    name: string;
    kana: string | null;
    count: number;
  }>;
};

export type SeriesDetailData = {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  descriptionEn: string | null;
  originType: string | null;
  originNote: string | null;
  productionCompanies: string[];
  relatedSeries: Array<{
    id: string;
    slug: string | null;
    name: string;
    description: string | null;
    descriptionEn: string | null;
    originType: string | null;
  }>;
  plays: Array<{
    id: string;
    slug: string;
    title: string;
    period: string | null;
    summary: string | null;
    summaryEn: string | null;
    vod: Record<string, string> | null;
    tags: string[];
  }>;
  topActors: Array<{
    actor: {
      slug: string;
      name: string;
    };
    count: number;
    roles: string[];
    groups: string[];
  }>;
};

export type PlayListItem = {
  slug: string;
  title: string;
  summary: string | null;
  summaryEn: string | null;
  period: string | null;
  vod: Record<string, string> | null;
  franchiseName: string | null;
  franchiseFormat: string | null;
  genre: string | null;
  createdAt: string | null;
};

export type ActorListItem = {
  slug: string;
  name: string;
  kana: string | null;
  birthday: string | null;
  birthdayLabel: string | null;
  profile: string | null;
  gender: string | null;
};

export type SeriesListItem = {
  slug: string;
  name: string;
  description: string | null;
  descriptionEn: string | null;
  playCount: number;
  format: string | null;
  originType: string | null;
  updatedAt: string | null;
};

export type GuideListItem = {
  slug: string;
  title: string;
  summary: string | null;
  content: string | null;
  publishedAt: string | null;
  category: "series-guides" | "features" | null;
};

export type GuideDetailData = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string | null;
  publishedAt: string | null;
  category: "series-guides" | "features" | null;
};

export type TagListItem = {
  id: string;
  slug: string;
  name: string;
  type: "world" | "experience" | "origin";
  description: string;
  playsCount: number;
  priority: number;
};

export type TagDetailData = {
  id: string;
  slug: string;
  name: string;
  type: "world" | "experience" | "origin";
  description: string;
  playsCount: number;
  plays: Array<{
    id: string;
    slug: string;
    title: string;
    period: string | null;
    franchiseName: string | null;
    franchiseSlug: string | null;
  }>;
};

export type SearchResultBundle = {
  actors: Array<{
    id: string;
    slug: string;
    name: string;
    kana: string | null;
  }>;
  plays: Array<{
    id: string;
    slug: string;
    title: string;
    franchiseName: string | null;
    franchiseSlug: string | null;
  }>;
  series: Array<{
    id: string;
    slug: string;
    name: string;
  }>;
};

export type WatchFranchiseItem = {
  id: string;
  name: string;
  slug: string | null;
  playCount: number;
};

export type WatchOverviewData = {
  dmmSeriesCount: number;
  dmmTopFranchises: WatchFranchiseItem[];
};

export type TrendingTag = {
  tag: string;
  slug: string;
  rank: number;
  count: number;
};

export type PlayDetailData = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  summaryEn: string | null;
  period: string | null;
  venue: string | null;
  vod: Record<string, string> | null;
  franchiseName: string | null;
  franchiseSlug: string | null;
  tags: string[];
  credits: unknown;
  cast: ActorLink[];
};

export type CreditItem = {
  role: string;
  names: string[];
  sortOrder: number;
};

const uniq = (values: Array<string | null | undefined>) =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const sanitizeForLike = (value: string) => value.replace(/[%_]/g, "\\$&").trim();
const stripSearchSpaces = (value: string) => value.replace(/[\s\u3000]+/g, "");
const buildLooseLike = (value: string) => {
  const compact = stripSearchSpaces(value);
  if (!compact) return "";
  return `%${compact
    .split("")
    .map((char) => sanitizeForLike(char))
    .join("%")}%`;
};

const normalizeDisplayRole = (value?: string | null) =>
  String(value ?? "")
    .split("※")[0]
    .split("【")[0]
    .trim();

export const periodSortKey = (period?: string | null) => {
  if (!period) return -1;

  const fullDates = Array.from(period.matchAll(/(\d{4})\D{0,2}(\d{1,2})\D{0,2}(\d{1,2})/g)).map((match) => ({
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  }));

  if (fullDates.length > 0) {
    const first = fullDates[0];
    let endYear = first.year;
    let endMonth = first.month;
    let endDay = first.day;

    const monthDayMatches = Array.from(period.matchAll(/(?:\d{4}\D{0,2})?(\d{1,2})\D{0,2}(\d{1,2})/g)).map(
      (match) => ({
        raw: match[0],
        month: Number(match[1]),
        day: Number(match[2]),
        hasYear: /^\d{4}\D/.test(match[0]),
      })
    );

    for (const item of monthDayMatches) {
      if (item.hasYear) {
        const yearMatch = item.raw.match(/^(\d{4})\D/);
        endYear = yearMatch ? Number(yearMatch[1]) : endYear;
        endMonth = item.month;
        endDay = item.day;
        continue;
      }

      if (item.month < endMonth) endYear += 1;
      endMonth = item.month;
      endDay = item.day;
    }

    return endYear * 10000 + endMonth * 100 + endDay;
  }

  const yearMonth = period.match(/(\d{4})\D{0,2}(\d{1,2})/);
  if (yearMonth) {
    const year = Number(yearMonth[1]);
    const month = Number(yearMonth[2]);
    return year * 10000 + month * 100;
  }

  const yearOnly = period.match(/(\d{4})/);
  if (yearOnly) {
    return Number(yearOnly[1]) * 10000;
  }

  return -1;
};

export const periodStartSortKey = (period?: string | null) => {
  if (!period) return -1;

  const fullDate = period.match(/(\d{4})\D{0,2}(\d{1,2})\D{0,2}(\d{1,2})/);
  if (fullDate) {
    const year = Number(fullDate[1]);
    const month = Number(fullDate[2]);
    const day = Number(fullDate[3]);
    return year * 10000 + month * 100 + day;
  }

  const yearMonth = period.match(/(\d{4})\D{0,2}(\d{1,2})/);
  if (yearMonth) {
    const year = Number(yearMonth[1]);
    const month = Number(yearMonth[2]);
    return year * 10000 + month * 100;
  }

  const yearOnly = period.match(/(\d{4})/);
  if (yearOnly) {
    return Number(yearOnly[1]) * 10000;
  }

  return -1;
};

export async function getPlayDetailBySlug(slug: string): Promise<PlayDetailData | null> {
  if (!hasSupabaseEnv) return null;
  const supabase = createSupabaseServerClient();

  let play: any = null;
  let playError: any = null;

  {
    const res = await supabase
      .from("plays")
      .select(
        `
        id,
        slug,
        title,
        summary,
        summary_en,
        period,
        venue,
        vod,
        credits,
        franchise:franchises (
          name,
          slug
        ),
        play_tags:play_tags (
          tag:tags (
            name
          )
        )
      `
      )
      .eq("slug", slug)
      .maybeSingle();
    play = res.data;
    playError = res.error;
  }

  if (playError && /summary_en/i.test(String(playError.message ?? ""))) {
    const fallback = await supabase
      .from("plays")
      .select(
        `
        id,
        slug,
        title,
        summary,
        period,
        venue,
        vod,
        credits,
        franchise:franchises (
          name,
          slug
        ),
        play_tags:play_tags (
          tag:tags (
            name
          )
        )
      `
      )
      .eq("slug", slug)
      .maybeSingle();
    play = fallback.data ? { ...fallback.data, summary_en: null } : fallback.data;
    playError = fallback.error;
  }

  if (playError) throw playError;
  if (!play?.id || !play?.slug || !play?.title) return null;

  const { data: castRows, error: castError } = await supabase
    .from("casts")
    .select(
      `
      role_name,
      cast_group,
      is_starring,
      billing_order,
      created_at,
      actor:actors (
        slug,
        name
      )
    `
    )
    .eq("play_id", play.id)
    .order("billing_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (castError) throw castError;

  const cast = ((castRows ?? []) as any[])
    .map((row) => ({
      slug: String(row?.actor?.slug ?? "").trim(),
      name: String(row?.actor?.name ?? "").trim(),
      roleName: String(row?.role_name ?? "").trim() || null,
      castGroup: String(row?.cast_group ?? "").trim() || null,
      isStarring: typeof row?.is_starring === "boolean" ? row.is_starring : null,
      billingOrder: typeof row?.billing_order === "number" ? row.billing_order : Number.MAX_SAFE_INTEGER,
      createdAt: String(row?.created_at ?? "").trim() || null,
    }))
    .filter((row) => row.slug && row.name)
    .sort((a, b) => {
      const diff = a.billingOrder - b.billingOrder;
      if (diff !== 0) return diff;

      const aCreated = a.createdAt ? Date.parse(a.createdAt) : Number.MAX_SAFE_INTEGER;
      const bCreated = b.createdAt ? Date.parse(b.createdAt) : Number.MAX_SAFE_INTEGER;
      if (aCreated !== bCreated) return aCreated - bCreated;

      return a.name.localeCompare(b.name, "ja");
    })
    .map(({ billingOrder, createdAt, ...row }) => row);

  const tags = uniq(((play.play_tags ?? []) as any[]).map((item) => item?.tag?.name));
  const franchise = Array.isArray(play.franchise) ? play.franchise[0] : play.franchise;

  return {
    id: play.id,
    slug: play.slug,
    title: play.title,
    summary: play.summary ?? null,
    summaryEn: play.summary_en ?? null,
    period: play.period ?? null,
    venue: play.venue ?? null,
    vod: (play.vod as Record<string, string> | null) ?? null,
    credits: play.credits ?? null,
    franchiseName: franchise?.name ?? null,
    franchiseSlug: franchise?.slug ?? null,
    tags,
    cast,
  };
}

export async function getActorDetailBySlug(slug: string): Promise<ActorDetailData | null> {
  if (!hasSupabaseEnv) return null;
  const supabase = createSupabaseServerClient();

  let actor: any = null;
  let actorError: any = null;

  {
    const res = await supabase
      .from("actors")
      .select("id, slug, name, kana, birthday, birthday_label, profile, height_cm, blood_type, image_url, sns")
      .eq("slug", slug)
      .maybeSingle();
    actor = res.data;
    actorError = res.error;
  }

  if (actorError && /(height_cm|blood_type|birthday_label)/i.test(String(actorError.message ?? ""))) {
    const fallback = await supabase
      .from("actors")
      .select("id, slug, name, kana, birthday, profile, image_url, sns")
      .eq("slug", slug)
      .maybeSingle();
    actor = fallback.data
      ? { ...fallback.data, birthday_label: null, height_cm: null, blood_type: null }
      : fallback.data;
    actorError = fallback.error;
  }

  if (actorError) throw actorError;
  if (!actor?.id || !actor?.slug || !actor?.name) return null;

  const { data: castRows, error: castError } = await supabase
    .from("casts")
    .select(
      `
      play_id,
      role_name,
      play:plays (
        slug,
        title,
        period,
        summary,
        vod,
        franchise:franchises (
          name,
          slug
        )
      )
    `
    )
    .eq("actor_id", actor.id);

  if (castError) throw castError;

  const byPlay = new Map<
    string,
    {
      slug: string;
      title: string;
      period: string | null;
      summary: string | null;
      vod: Record<string, string> | null;
      roleName: string | null;
      franchiseName: string | null;
      franchiseSlug: string | null;
    }
  >();

  for (const row of (castRows ?? []) as any[]) {
    const play = Array.isArray(row?.play) ? row.play[0] : row?.play;
    const playSlug = String(play?.slug ?? "").trim();
    const title = String(play?.title ?? "").trim();
    if (!playSlug || !title) continue;

    const roleName = normalizeDisplayRole(row?.role_name) || null;
    const franchise = Array.isArray(play?.franchise) ? play.franchise[0] : play?.franchise;

    const existing = byPlay.get(playSlug);
    if (!existing) {
      byPlay.set(playSlug, {
        slug: playSlug,
        title,
        period: play?.period ?? null,
        summary: play?.summary ?? null,
        vod: play?.vod ?? null,
        roleName,
        franchiseName: franchise?.name ?? null,
        franchiseSlug: franchise?.slug ?? null,
      });
      continue;
    }

    const mergedRoles = uniq(
      `${existing.roleName ?? ""} / ${roleName ?? ""}`
        .split("/")
        .map((item) => normalizeDisplayRole(item))
    );

    byPlay.set(playSlug, {
      ...existing,
      roleName: mergedRoles.length > 0 ? mergedRoles.join(" / ") : null,
    });
  }

  const plays = Array.from(byPlay.values()).sort((a, b) => periodSortKey(b.period) - periodSortKey(a.period));
  const topSeries = Array.from(
    plays.reduce(
      (map, play) => {
        const slug = String(play.franchiseSlug ?? "").trim();
        const name = String(play.franchiseName ?? "").trim();
        if (!slug || !name) return map;

        const current = map.get(slug) ?? { slug, name, count: 0 };
        current.count += 1;
        map.set(slug, current);
        return map;
      },
      new Map<string, { slug: string; name: string; count: number }>()
    ).values()
  )
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ja"))
    .slice(0, 8);
  const playIds = uniq(((castRows ?? []) as any[]).map((row) => row?.play_id));
  let coStars: ActorDetailData["coStars"] = [];

  if (playIds.length > 0) {
    const { data: coStarRows, error: coStarError } = await supabase
      .from("casts")
      .select(
        `
        play_id,
        actor:actors (
          slug,
          name,
          kana
        )
      `
      )
      .in("play_id", playIds)
      .neq("actor_id", actor.id);

    if (coStarError) throw coStarError;

    const bucket = new Map<
      string,
      {
        slug: string;
        name: string;
        kana: string | null;
        playSet: Set<string>;
      }
    >();

    for (const row of (coStarRows ?? []) as any[]) {
      const linkedActor = Array.isArray(row?.actor) ? row.actor[0] : row?.actor;
      const actorSlug = String(linkedActor?.slug ?? "").trim();
      const actorName = String(linkedActor?.name ?? "").trim();
      const actorKana = String(linkedActor?.kana ?? "").trim() || null;
      const playId = String(row?.play_id ?? "").trim();
      if (!actorSlug || !actorName || !playId) continue;

      const existing =
        bucket.get(actorSlug) ??
        {
          slug: actorSlug,
          name: actorName,
          kana: actorKana,
          playSet: new Set<string>(),
        };

      existing.playSet.add(playId);
      bucket.set(actorSlug, existing);
    }

    coStars = Array.from(bucket.values())
      .map((item) => ({
        slug: item.slug,
        name: item.name,
        kana: item.kana,
        count: item.playSet.size,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ja"));
  }

  return {
    id: actor.id,
    slug: actor.slug,
    name: actor.name,
    kana: actor.kana ?? null,
    birthday: actor.birthday ?? null,
    birthdayLabel: actor.birthday_label ?? null,
    profile: actor.profile ?? null,
    heightCm: typeof actor.height_cm === "number" ? actor.height_cm : null,
    bloodType: actor.blood_type ?? null,
    imageUrl: actor.image_url ?? null,
    sns: (actor.sns as Record<string, string> | null) ?? null,
    plays,
    topSeries,
    coStars,
  };
}

export async function getSeriesDetailBySlug(slug: string): Promise<SeriesDetailData | null> {
  if (!hasSupabaseEnv) return null;
  const supabase = createSupabaseServerClient();

  let franchise: any = null;

  {
    const res = await supabase
      .from("franchises")
      .select(
        "id, name, slug, description, description_en, origin_type, origin_note, production_companies, related_franchise_ids"
      )
      .eq("slug", slug)
      .maybeSingle();

      if (res.error && /(related_franchise_ids|description_en)/i.test(String(res.error.message ?? ""))) {
        const fallback = await supabase
          .from("franchises")
          .select("id, name, slug, description, description_en, origin_type, origin_note, production_companies")
          .eq("slug", slug)
          .maybeSingle();
      if (fallback.error) throw fallback.error;
      franchise = fallback.data ? { ...fallback.data, related_franchise_ids: [] } : null;
    } else {
      if (res.error) throw res.error;
      franchise = res.data;
    }
  }

  if (!franchise) {
    const res = await supabase
      .from("franchises")
      .select(
        "id, name, slug, description, description_en, origin_type, origin_note, production_companies, related_franchise_ids"
      )
      .eq("name", slug)
      .maybeSingle();
      if (res.error && /(related_franchise_ids|description_en)/i.test(String(res.error.message ?? ""))) {
        const fallback = await supabase
          .from("franchises")
          .select("id, name, slug, description, description_en, origin_type, origin_note, production_companies")
          .eq("name", slug)
          .maybeSingle();
      if (fallback.error) throw fallback.error;
      franchise = fallback.data ? { ...fallback.data, related_franchise_ids: [] } : null;
    } else {
      if (res.error) throw res.error;
      franchise = res.data;
    }
  }

  if (!franchise?.id || !franchise?.name) return null;

  let playRows: any[] | null = null;
  let playError: any = null;

  {
    const res = await supabase
      .from("plays")
      .select(
        `
        id,
        slug,
        title,
        period,
        summary,
        summary_en,
        vod,
        created_at,
        play_tags:play_tags (
          tag:tags (
            name
          )
        )
      `
      )
      .eq("franchise_id", franchise.id);
    playRows = res.data as any[] | null;
    playError = res.error;
  }

  if (playError && /summary_en/i.test(String(playError.message ?? ""))) {
    const fallback = await supabase
      .from("plays")
      .select(
        `
        id,
        slug,
        title,
        period,
        summary,
        vod,
        created_at,
        play_tags:play_tags (
          tag:tags (
            name
          )
        )
      `
      )
      .eq("franchise_id", franchise.id);
    playRows =
      (fallback.data as any[] | null)?.map((row) => ({
        ...row,
        summary_en: null,
      })) ?? null;
    playError = fallback.error;
  }

  if (playError) throw playError;

  const plays = ((playRows ?? []) as any[])
    .filter((row) => row?.id && row?.slug && row?.title)
    .map((row) => ({
      id: row.id as string,
      slug: row.slug as string,
      title: row.title as string,
      period: (row.period as string | null) ?? null,
      summary: (row.summary as string | null) ?? null,
      summaryEn: (row.summary_en as string | null) ?? null,
      vod: (row.vod as Record<string, string> | null) ?? null,
      createdAt: (row.created_at as string | null) ?? null,
      tags: uniq(((row.play_tags ?? []) as any[]).map((item) => item?.tag?.name)),
    }))
    .sort((a, b) => {
      const diff = periodStartSortKey(b.period) - periodStartSortKey(a.period);
      if (diff !== 0) return diff;
      const ad = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bd = b.createdAt ? Date.parse(b.createdAt) : 0;
      return bd - ad;
    })
    .map(({ createdAt, ...row }) => row);

  const relatedFranchiseIds = uniq(
    Array.isArray(franchise.related_franchise_ids) ? franchise.related_franchise_ids : []
  ).filter((id) => id !== franchise.id);

  let relatedSeries: SeriesDetailData["relatedSeries"] = [];

  if (relatedFranchiseIds.length > 0) {
    let relatedRows: any[] | null = null;
    let relatedError: any = null;

    {
      const res = await supabase
        .from("franchises")
        .select("id, slug, name, description, description_en, origin_type")
        .in("id", relatedFranchiseIds);
      relatedRows = res.data as any[] | null;
      relatedError = res.error;
    }

    if (relatedError && /description_en/i.test(String(relatedError.message ?? ""))) {
      const fallback = await supabase
        .from("franchises")
        .select("id, slug, name, description, origin_type")
        .in("id", relatedFranchiseIds);
      relatedRows =
        (fallback.data as any[] | null)?.map((row) => ({
          ...row,
          description_en: null,
        })) ?? null;
      relatedError = fallback.error;
    }

    if (relatedError) throw relatedError;

    const relatedMap = new Map(
      ((relatedRows ?? []) as any[])
        .filter((row) => row?.id && row?.name)
        .map((row) => [
          String(row.id),
          {
            id: String(row.id),
            slug: row.slug ? String(row.slug) : null,
            name: String(row.name),
            description: row.description ? String(row.description) : null,
            descriptionEn: row.description_en ? String(row.description_en) : null,
            originType: row.origin_type ? String(row.origin_type) : null,
          },
        ])
    );

    relatedSeries = relatedFranchiseIds
      .map((id) => relatedMap.get(id))
      .filter((item): item is SeriesDetailData["relatedSeries"][number] => Boolean(item));
  }

  const playIds = plays.map((play) => play.id);

  let topActors: SeriesDetailData["topActors"] = [];

  if (playIds.length > 0) {
    const stripSeriesCastNotes = (value?: string | null) =>
      String(value ?? "")
        .replace(/※.*$/g, "")
        .replace(/【.*?】/g, "")
        .replace(/【.*$/g, "")
        .trim();

    const normalizeSeriesDisplayRole = (value?: string | null) =>
      stripSeriesCastNotes(value).trim();

    const normalizeSeriesDisplayGroup = (value?: string | null) =>
      stripSeriesCastNotes(value).trim();

    const splitSeriesRoles = (value?: string | null) =>
      stripSeriesCastNotes(value)
        .split("/")
        .flatMap((item) => item.split(/[・･]/))
        .map((item) => normalizeSeriesDisplayRole(normalizeDisplayRole(item)))
        .filter(Boolean);

    const { data: castRows, error: castError } = await supabase
      .from("casts")
      .select(
        `
        play_id,
        role_name,
        cast_group,
        actor:actors (
          slug,
          name
        )
      `
      )
      .in("play_id", playIds);

    if (castError) throw castError;

    const bucket = new Map<
      string,
      {
        actor: { slug: string; name: string };
        playSet: Set<string>;
        roles: string[];
        groups: string[];
      }
    >();

    for (const row of (castRows ?? []) as any[]) {
      const actor = Array.isArray(row?.actor) ? row.actor[0] : row?.actor;
      const actorSlug = String(actor?.slug ?? "").trim();
      const actorName = String(actor?.name ?? "").trim();
      const playId = String(row?.play_id ?? "").trim();
      if (!actorSlug || !actorName || !playId) continue;

      const existing =
        bucket.get(actorSlug) ??
        {
          actor: { slug: actorSlug, name: actorName },
          playSet: new Set<string>(),
          roles: [] as string[],
          groups: [] as string[],
        };

      existing.playSet.add(playId);

      for (const role of uniq(splitSeriesRoles(row?.role_name))) {
        if (role && !existing.roles.includes(role)) existing.roles.push(role);
      }

      for (const group of uniq(
        String(row?.cast_group ?? "")
          .split("/")
          .map((item) => normalizeSeriesDisplayGroup(item))
      )) {
        if (group && !existing.groups.includes(group)) existing.groups.push(group);
      }

      bucket.set(actorSlug, existing);
    }

    topActors = Array.from(bucket.values())
      .map((item) => ({
        actor: item.actor,
        count: item.playSet.size,
        roles: item.roles,
        groups: item.groups,
      }))
      .sort((a, b) => b.count - a.count || a.actor.name.localeCompare(b.actor.name, "ja"));
  }

  return {
    id: franchise.id,
    slug: franchise.slug ?? null,
    name: franchise.name,
    description: franchise.description ?? null,
    descriptionEn: franchise.description_en ?? null,
    originType: franchise.origin_type ?? null,
    originNote: franchise.origin_note ?? null,
    productionCompanies: Array.isArray(franchise.production_companies)
      ? uniq(franchise.production_companies)
      : [],
    relatedSeries,
    plays,
    topActors,
  };
}

export async function getPlayList(): Promise<PlayListItem[]> {
  if (!hasSupabaseEnv) return [];
  const supabase = createSupabaseServerClient();
  let data: any[] | null = null;
  let error: any = null;

  {
    const res = await supabase
      .from("plays")
      .select(
        `
        slug,
        title,
        summary,
        summary_en,
        period,
        vod,
        genre,
        created_at,
        franchise:franchises (
          name,
          format
        )
      `
      );
    data = res.data as any[] | null;
    error = res.error;
  }

  if (error && /summary_en/i.test(String(error.message ?? ""))) {
    const fallback = await supabase
      .from("plays")
      .select(
        `
        slug,
        title,
        summary,
        period,
        vod,
        genre,
        created_at,
        franchise:franchises (
          name,
          format
        )
      `
      );
    data =
      (fallback.data as any[] | null)?.map((row) => ({
        ...row,
        summary_en: null,
      })) ?? null;
    error = fallback.error;
  }

  if (error && /format/i.test(String(error.message ?? ""))) {
    const fallback = await supabase
      .from("plays")
      .select(
        `
        slug,
        title,
        summary,
        period,
        vod,
        genre,
        created_at,
        franchise:franchises (
          name
        )
      `
      );
    data = (fallback.data as any[] | null)?.map((row) => ({
      ...row,
      franchise: Array.isArray(row?.franchise)
        ? row.franchise.map((item: any) => ({ ...item, format: null }))
        : row?.franchise
          ? { ...row.franchise, format: null }
          : row?.franchise,
    })) ?? null;
    error = fallback.error;
  }

  if (error) throw error;

  return ((data ?? []) as any[])
    .filter((row) => row?.slug && row?.title)
    .map((row) => {
      const franchise = Array.isArray(row?.franchise) ? row.franchise[0] : row?.franchise;
      return {
        slug: row.slug as string,
        title: row.title as string,
        summary: (row.summary as string | null) ?? null,
        summaryEn: (row.summary_en as string | null) ?? null,
        period: (row.period as string | null) ?? null,
        vod: (row.vod as Record<string, string> | null) ?? null,
        franchiseName: franchise?.name ?? null,
        franchiseFormat: (franchise?.format as string | null) ?? null,
        genre: (row.genre as string | null) ?? null,
        createdAt: (row.created_at as string | null) ?? null,
      };
    })
    .sort((a, b) => {
      const diff = periodSortKey(b.period) - periodSortKey(a.period);
      if (diff !== 0) return diff;
      const ad = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bd = b.createdAt ? Date.parse(b.createdAt) : 0;
      return bd - ad;
    })
    .map((row) => row);
}

export async function getActorList(): Promise<ActorListItem[]> {
  if (!hasSupabaseEnv) return [];
  const supabase = createSupabaseServerClient();
  let data: any[] | null = null;
  let error: any = null;

  {
    const res = await supabase
      .from("actors")
      .select("slug, name, kana, birthday, birthday_label, profile, gender")
      .order("name", { ascending: true });
    data = res.data as any[] | null;
    error = res.error;
  }

  if (error && /birthday_label/i.test(String(error.message ?? ""))) {
    const fallback = await supabase
      .from("actors")
      .select("slug, name, kana, birthday, profile, gender")
      .order("name", { ascending: true });
    data =
      (fallback.data as any[] | null)?.map((row) => ({
        ...row,
        birthday_label: null,
      })) ?? null;
    error = fallback.error;
  }

  if (error) throw error;

  return ((data ?? []) as any[])
    .filter((row) => row?.slug && row?.name)
    .map((row) => ({
      slug: row.slug as string,
      name: row.name as string,
      kana: (row.kana as string | null) ?? null,
      birthday: (row.birthday as string | null) ?? null,
      birthdayLabel: (row.birthday_label as string | null) ?? null,
      profile: (row.profile as string | null) ?? null,
      gender: (row.gender as string | null) ?? null,
    }));
}

export async function getSeriesList(): Promise<SeriesListItem[]> {
  if (!hasSupabaseEnv) return [];
  const supabase = createSupabaseServerClient();

  const [{ data: plays, error: playError }] = await Promise.all([
    supabase.from("plays").select("id, franchise_id, created_at"),
  ]);

  let franchises: any[] | null = null;
  let franchiseError: any = null;

  {
    const res = await supabase
      .from("franchises")
      .select("id, slug, name, description, description_en, format, origin_type")
      .order("name", { ascending: true });
    franchises = res.data as any[] | null;
    franchiseError = res.error;
  }

  if (franchiseError && /description_en/i.test(String(franchiseError.message ?? ""))) {
    const fallback = await supabase
      .from("franchises")
      .select("id, slug, name, description, format, origin_type")
      .order("name", { ascending: true });
    franchises =
      (fallback.data as any[] | null)?.map((row) => ({
        ...row,
        description_en: null,
      })) ?? null;
    franchiseError = fallback.error;
  }

  if (franchiseError && /format/i.test(String(franchiseError.message ?? ""))) {
    const fallback = await supabase
      .from("franchises")
      .select("id, slug, name, description, origin_type")
      .order("name", { ascending: true });
    franchises =
      (fallback.data as any[] | null)?.map((row) => ({
        ...row,
        description_en: null,
        format: null,
      })) ?? null;
    franchiseError = fallback.error;
  }

  if (franchiseError) throw franchiseError;
  if (playError) throw playError;

  const countByFranchise = new Map<string, number>();
  const latestPlayByFranchise = new Map<string, string>();
  for (const play of (plays ?? []) as any[]) {
    const franchiseId = String(play?.franchise_id ?? "").trim();
    if (!franchiseId) continue;
    countByFranchise.set(franchiseId, (countByFranchise.get(franchiseId) ?? 0) + 1);

    const createdAt = String(play?.created_at ?? "").trim();
    const currentLatest = latestPlayByFranchise.get(franchiseId);
    if (createdAt && (!currentLatest || Date.parse(createdAt) > Date.parse(currentLatest))) {
      latestPlayByFranchise.set(franchiseId, createdAt);
    }
  }

  return ((franchises ?? []) as any[])
    .filter((row) => row?.name)
    .map((row) => ({
      slug: (row.slug as string | null) ?? null,
      name: row.name as string,
      description: (row.description as string | null) ?? null,
      descriptionEn: (row.description_en as string | null) ?? null,
      playCount: countByFranchise.get(row.id as string) ?? 0,
      format: (row.format as string | null) ?? null,
      originType: (row.origin_type as string | null) ?? null,
      updatedAt: latestPlayByFranchise.get(row.id as string) ?? null,
    }))
    .filter((row) => row.slug)
    .map((row) => ({
      slug: row.slug as string,
      name: row.name,
      description: row.description,
      descriptionEn: row.descriptionEn,
      playCount: row.playCount,
      format: row.format,
      originType: row.originType,
      updatedAt: row.updatedAt,
    }))
    .sort((a, b) => b.playCount - a.playCount || a.name.localeCompare(b.name, "ja"));
}

export async function getGuideList(): Promise<GuideListItem[]> {
  if (!hasSupabaseEnv) return [];
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("editorials")
    .select("id, slug, title, summary, content, published_at, category")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) throw error;

  return ((data ?? []) as any[])
    .filter((row) => row?.slug && row?.title)
    .map((row) => ({
      slug: row.slug as string,
      title: row.title as string,
      summary: (row.summary as string | null) ?? null,
      content: (row.content as string | null) ?? null,
      publishedAt: (row.published_at as string | null) ?? null,
      category: (row.category as "series-guides" | "features" | null) ?? null,
    }));
}

export async function getGuideDetailBySlug(slug: string): Promise<GuideDetailData | null> {
  if (!hasSupabaseEnv) return null;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("editorials")
    .select("id, slug, title, summary, content, published_at, category")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!data?.id || !data?.slug || !data?.title) return null;

  return {
    id: data.id as string,
    slug: data.slug as string,
    title: data.title as string,
    summary: (data.summary as string | null) ?? null,
    content: (data.content as string | null) ?? null,
    publishedAt: (data.published_at as string | null) ?? null,
    category: (data.category as "series-guides" | "features" | null) ?? null,
  };
}

export async function getTagList(): Promise<TagListItem[]> {
  if (!hasSupabaseEnv) return [];
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("public_tags_min2")
    .select("tag_id, slug, name, type, description, plays_count, priority")
    .order("priority", { ascending: false })
    .order("plays_count", { ascending: false })
    .order("name", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as any[])
    .map((row) => {
      const id = String(row?.tag_id ?? "").trim();
      const slug = String(row?.slug ?? "").trim();
      const name = String(row?.name ?? "").trim();
      const type = row?.type;

      if (!id || !slug || !name) return null;
      if (type !== "world" && type !== "experience" && type !== "origin") return null;

      return {
        id,
        slug,
        name,
        type,
        description: String(row?.description ?? "").trim(),
        playsCount: typeof row?.plays_count === "number" ? row.plays_count : 0,
        priority: typeof row?.priority === "number" ? row.priority : 0,
      } satisfies TagListItem;
    })
    .filter((item): item is TagListItem => Boolean(item));
}

export async function getTagDetailBySlug(slug: string): Promise<TagDetailData | null> {
  if (!hasSupabaseEnv) return null;
  const supabase = createSupabaseServerClient();

  const { data: tagRow, error: tagError } = await supabase
    .from("tag_play_counts")
    .select("tag_id, slug, name, type, description, plays_count")
    .eq("slug", slug)
    .maybeSingle();

  if (tagError) throw tagError;
  if (!tagRow) return null;

  const tagId = String(tagRow.tag_id ?? "").trim();
  const tagSlug = String(tagRow.slug ?? "").trim();
  const tagName = String(tagRow.name ?? "").trim();
  const tagType = tagRow.type;

  if (!tagId || !tagSlug || !tagName) return null;
  if (tagType !== "world" && tagType !== "experience" && tagType !== "origin") return null;

  const { data: playRows, error: playError } = await supabase
    .from("play_tags")
    .select(
      `
      play:plays (
        id,
        slug,
        title,
        period,
        franchise:franchises (
          name,
          slug
        )
      )
    `
    )
    .eq("tag_id", tagId);

  if (playError) throw playError;

  const plays = ((playRows ?? []) as any[])
    .map((row) => row?.play)
    .filter(Boolean)
    .map((row) => {
      const franchise = Array.isArray(row?.franchise) ? row.franchise[0] : row?.franchise;
      const playId = String(row?.id ?? "").trim();
      const playSlug = String(row?.slug ?? "").trim();
      const playTitle = String(row?.title ?? "").trim();
      if (!playId || !playSlug || !playTitle) return null;

      return {
        id: playId,
        slug: playSlug,
        title: playTitle,
        period: (row?.period as string | null) ?? null,
        franchiseName: franchise?.name ?? null,
        franchiseSlug: franchise?.slug ?? null,
      };
    })
    .filter((item): item is TagDetailData["plays"][number] => Boolean(item))
    .sort((a, b) => periodSortKey(b.period) - periodSortKey(a.period) || a.title.localeCompare(b.title, "ja"));

  return {
    id: tagId,
    slug: tagSlug,
    name: tagName,
    type: tagType,
    description: String(tagRow.description ?? "").trim(),
    playsCount: typeof tagRow.plays_count === "number" ? tagRow.plays_count : plays.length,
    plays,
  };
}

export async function searchSite(query: string, limit = 20): Promise<SearchResultBundle> {
  if (!hasSupabaseEnv) return { actors: [], plays: [], series: [] };

  const q = String(query ?? "").trim();
  if (!q) return { actors: [], plays: [], series: [] };

  const supabase = createSupabaseServerClient();
  const like = `%${sanitizeForLike(q)}%`;
  const looseLike = buildLooseLike(q);
  const actorOr =
    looseLike && looseLike !== like
      ? `name.ilike.${like},kana.ilike.${like},name.ilike.${looseLike},kana.ilike.${looseLike}`
      : `name.ilike.${like},kana.ilike.${like}`;

  const [actorsRes, playsRes, seriesRes] = await Promise.all([
    supabase
      .from("actors")
      .select("id, slug, name, kana")
      .or(actorOr)
      .order("name", { ascending: true })
      .limit(limit),
    supabase
      .from("plays")
      .select(
        `
        id,
        slug,
        title,
        franchise:franchises (
          name,
          slug
        )
      `
      )
      .ilike("title", like)
      .order("title", { ascending: true })
      .limit(limit),
    supabase
      .from("franchises")
      .select("id, slug, name")
      .or(`name.ilike.${like},slug.ilike.${like}`)
      .order("name", { ascending: true })
      .limit(limit),
  ]);

  if (actorsRes.error) throw actorsRes.error;
  if (playsRes.error) throw playsRes.error;
  if (seriesRes.error) throw seriesRes.error;

  const actors = ((actorsRes.data ?? []) as any[])
    .map((row) => ({
      id: String(row?.id ?? "").trim(),
      slug: String(row?.slug ?? "").trim(),
      name: String(row?.name ?? "").trim(),
      kana: (row?.kana as string | null) ?? null,
    }))
    .filter((row) => row.id && row.slug && row.name);

  const plays = ((playsRes.data ?? []) as any[])
    .map((row) => {
      const franchise = Array.isArray(row?.franchise) ? row.franchise[0] : row?.franchise;
      return {
        id: String(row?.id ?? "").trim(),
        slug: String(row?.slug ?? "").trim(),
        title: String(row?.title ?? "").trim(),
        franchiseName: franchise?.name ?? null,
        franchiseSlug: franchise?.slug ?? null,
      };
    })
    .filter((row) => row.id && row.slug && row.title);

  const series = ((seriesRes.data ?? []) as any[])
    .map((row) => ({
      id: String(row?.id ?? "").trim(),
      slug: String(row?.slug ?? "").trim(),
      name: String(row?.name ?? "").trim(),
    }))
    .filter((row) => row.id && row.slug && row.name);

  return { actors, plays, series };
}

export async function getWatchOverview(): Promise<WatchOverviewData> {
  if (!hasSupabaseEnv) {
    return { dmmSeriesCount: 0, dmmTopFranchises: [] };
  }

  const supabase = createSupabaseServerClient();
  const [{ count, error: countError }, { data, error: listError }] = await Promise.all([
    supabase.from("watch_dmm_franchises").select("franchise_id", { count: "exact", head: true }),
    supabase
      .from("watch_dmm_franchises")
      .select("franchise_id, name, slug, plays_count")
      .order("plays_count", { ascending: false })
      .order("name", { ascending: true })
      .limit(12),
  ]);

  if (countError) throw countError;
  if (listError) throw listError;

  const dmmTopFranchises = ((data ?? []) as any[])
    .map((row) => ({
      id: String(row?.franchise_id ?? "").trim(),
      name: String(row?.name ?? "").trim(),
      slug: String(row?.slug ?? "").trim() || null,
      playCount: typeof row?.plays_count === "number" ? row.plays_count : 0,
    }))
    .filter((row) => row.id && row.name);

  return {
    dmmSeriesCount: typeof count === "number" ? count : 0,
    dmmTopFranchises,
  };
}

export async function getTrendingTags(limit = 25): Promise<TrendingTag[]> {
  if (!hasSupabaseEnv) return [];
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_trending_tags", { p_limit: limit });

  if (error) throw error;

  const rows = (data ?? []) as Array<{
    name: string;
    slug: string | null;
    usage_count: number | string | null;
  }>;

  return rows.map((row, index) => ({
    tag: row.name,
    slug: row.slug ?? row.name,
    count: Number(row.usage_count ?? 0),
    rank: index + 1,
  }));
}

export const toPlainText = (value: unknown) =>
  String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const truncate = (value: string, max: number) =>
  value.length <= max ? value : `${value.slice(0, Math.max(0, max - 1))}…`;

export const summarizeCast = (cast: ActorLink[]) => {
  const names = uniq(cast.map((item) => item.name));
  if (names.length === 0) return "未登録";
  return `${names.slice(0, 3).join("、")}ら`;
};

export const formatBirthday = (birthday?: string | null) => {
  const value = String(birthday ?? "").trim();
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  return `${match[1]}年${Number(match[2])}月${Number(match[3])}日`;
};

export const getDisplayBirthday = (
  birthday?: string | null,
  birthdayLabel?: string | null
) => {
  const label = String(birthdayLabel ?? "").trim();
  if (label) return label;
  return formatBirthday(birthday);
};

export const getAgeFromBirthday = (birthday?: string | null) => {
  const value = String(birthday ?? "").trim();
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const today = new Date();
  let age = today.getFullYear() - year;
  const passed = today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!passed) age -= 1;
  return age >= 0 ? age : null;
};

export const groupPlayTimelineByYear = (
  plays: ActorDetailData["plays"]
): Array<{ year: string; plays: ActorDetailData["plays"] }> => {
  const groups = new Map<string, ActorDetailData["plays"]>();

  for (const play of plays) {
    const yearMatch = String(play.period ?? "").match(/(\d{4})/);
    const year = yearMatch ? yearMatch[1] : "年不明";
    const bucket = groups.get(year) ?? [];
    bucket.push(play);
    groups.set(year, bucket);
  }

  return Array.from(groups.entries())
    .map(([year, yearPlays]) => ({
      year,
      plays: [...yearPlays].sort((a, b) => periodSortKey(b.period) - periodSortKey(a.period)),
    }))
    .sort((a, b) => {
      if (a.year === "年不明") return 1;
      if (b.year === "年不明") return -1;
      return Number(b.year) - Number(a.year);
    });
};

export const getCreditItems = (credits: any): CreditItem[] => {
  const raw = Array.isArray(credits) ? credits : Array.isArray(credits?.items) ? credits.items : [];

  return raw
    .map((item: any) => ({
      role: String(item?.role ?? "").trim(),
      names: Array.isArray(item?.names) ? uniq(item.names) : uniq([item?.names]),
      sortOrder: typeof item?.sort_order === "number" ? item.sort_order : 999,
    }))
    .filter((item: CreditItem) => item.role && item.names.length > 0)
    .sort((a: CreditItem, b: CreditItem) => a.sortOrder - b.sortOrder);
};
