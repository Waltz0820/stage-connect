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
  profile: string | null;
  imageUrl: string | null;
  sns: Record<string, string> | null;
  plays: Array<{
    slug: string;
    title: string;
    period: string | null;
    summary: string | null;
    roleName: string | null;
    franchiseName: string | null;
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
  originType: string | null;
  originNote: string | null;
  productionCompanies: string[];
  plays: Array<{
    id: string;
    slug: string;
    title: string;
    period: string | null;
    summary: string | null;
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
  period: string | null;
  franchiseName: string | null;
  genre: string | null;
};

export type ActorListItem = {
  slug: string;
  name: string;
  kana: string | null;
  birthday: string | null;
  profile: string | null;
  gender: string | null;
};

export type SeriesListItem = {
  slug: string;
  name: string;
  description: string | null;
  playCount: number;
  originType: string | null;
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

export async function getPlayDetailBySlug(slug: string): Promise<PlayDetailData | null> {
  if (!hasSupabaseEnv) return null;
  const supabase = createSupabaseServerClient();

  const { data: play, error: playError } = await supabase
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
      actor:actors (
        slug,
        name
      )
    `
    )
    .eq("play_id", play.id)
    .order("billing_order", { ascending: true, nullsFirst: false });

  if (castError) throw castError;

  const cast = ((castRows ?? []) as any[])
    .map((row) => ({
      slug: String(row?.actor?.slug ?? "").trim(),
      name: String(row?.actor?.name ?? "").trim(),
      roleName: String(row?.role_name ?? "").trim() || null,
      castGroup: String(row?.cast_group ?? "").trim() || null,
      isStarring: typeof row?.is_starring === "boolean" ? row.is_starring : null,
      billingOrder: typeof row?.billing_order === "number" ? row.billing_order : Number.MAX_SAFE_INTEGER,
    }))
    .filter((row) => row.slug && row.name)
    .sort((a, b) => a.billingOrder - b.billingOrder)
    .map(({ billingOrder, ...row }) => row);

  const tags = uniq(((play.play_tags ?? []) as any[]).map((item) => item?.tag?.name));
  const franchise = Array.isArray(play.franchise) ? play.franchise[0] : play.franchise;

  return {
    id: play.id,
    slug: play.slug,
    title: play.title,
    summary: play.summary ?? null,
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

  const { data: actor, error: actorError } = await supabase
    .from("actors")
    .select("id, slug, name, kana, birthday, profile, image_url, sns")
    .eq("slug", slug)
    .maybeSingle();

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
        franchise:franchises (
          name
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
      roleName: string | null;
      franchiseName: string | null;
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
        roleName,
        franchiseName: franchise?.name ?? null,
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
    profile: actor.profile ?? null,
    imageUrl: actor.image_url ?? null,
    sns: (actor.sns as Record<string, string> | null) ?? null,
    plays,
    coStars,
  };
}

export async function getSeriesDetailBySlug(slug: string): Promise<SeriesDetailData | null> {
  if (!hasSupabaseEnv) return null;
  const supabase = createSupabaseServerClient();

  let franchise: any = null;

  const { data: bySlug, error: bySlugError } = await supabase
    .from("franchises")
    .select("id, name, slug, description, origin_type, origin_note, production_companies")
    .eq("slug", slug)
    .maybeSingle();

  if (bySlugError) throw bySlugError;
  franchise = bySlug;

  if (!franchise) {
    const { data: byName, error: byNameError } = await supabase
      .from("franchises")
      .select("id, name, slug, description, origin_type, origin_note, production_companies")
      .eq("name", slug)
      .maybeSingle();
    if (byNameError) throw byNameError;
    franchise = byName;
  }

  if (!franchise?.id || !franchise?.name) return null;

  const { data: playRows, error: playError } = await supabase
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

  if (playError) throw playError;

  const plays = ((playRows ?? []) as any[])
    .filter((row) => row?.id && row?.slug && row?.title)
    .map((row) => ({
      id: row.id as string,
      slug: row.slug as string,
      title: row.title as string,
      period: (row.period as string | null) ?? null,
      summary: (row.summary as string | null) ?? null,
      vod: (row.vod as Record<string, string> | null) ?? null,
      createdAt: (row.created_at as string | null) ?? null,
      tags: uniq(((row.play_tags ?? []) as any[]).map((item) => item?.tag?.name)),
    }))
    .sort((a, b) => {
      const diff = periodSortKey(b.period) - periodSortKey(a.period);
      if (diff !== 0) return diff;
      const ad = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bd = b.createdAt ? Date.parse(b.createdAt) : 0;
      return bd - ad;
    })
    .map(({ createdAt, ...row }) => row);

  const playIds = plays.map((play) => play.id);

  let topActors: SeriesDetailData["topActors"] = [];

  if (playIds.length > 0) {
    const normalizeSeriesDisplayRole = (value?: string | null) =>
      String(value ?? "")
        .replace(/※.*$/, "")
        .replace(/【.*$/, "")
        .trim();

    const normalizeSeriesDisplayGroup = (value?: string | null) =>
      String(value ?? "")
        .replace(/※.*$/, "")
        .replace(/【.*$/, "")
        .trim();

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

      for (const role of uniq(
        String(row?.role_name ?? "")
          .split("/")
          .map((item) => normalizeSeriesDisplayRole(normalizeDisplayRole(item)))
      )) {
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
    originType: franchise.origin_type ?? null,
    originNote: franchise.origin_note ?? null,
    productionCompanies: Array.isArray(franchise.production_companies)
      ? uniq(franchise.production_companies)
      : [],
    plays,
    topActors,
  };
}

export async function getPlayList(): Promise<PlayListItem[]> {
  if (!hasSupabaseEnv) return [];
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("plays")
    .select(
      `
      slug,
      title,
      summary,
      period,
      genre,
      created_at,
      franchise:franchises (
        name
      )
    `
    );

  if (error) throw error;

  return ((data ?? []) as any[])
    .filter((row) => row?.slug && row?.title)
    .map((row) => {
      const franchise = Array.isArray(row?.franchise) ? row.franchise[0] : row?.franchise;
      return {
        slug: row.slug as string,
        title: row.title as string,
        summary: (row.summary as string | null) ?? null,
        period: (row.period as string | null) ?? null,
        franchiseName: franchise?.name ?? null,
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
    .map(({ createdAt, ...row }) => row);
}

export async function getActorList(): Promise<ActorListItem[]> {
  if (!hasSupabaseEnv) return [];
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("actors")
    .select("slug, name, kana, birthday, profile, gender")
    .order("name", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as any[])
    .filter((row) => row?.slug && row?.name)
    .map((row) => ({
      slug: row.slug as string,
      name: row.name as string,
      kana: (row.kana as string | null) ?? null,
      birthday: (row.birthday as string | null) ?? null,
      profile: (row.profile as string | null) ?? null,
      gender: (row.gender as string | null) ?? null,
    }));
}

export async function getSeriesList(): Promise<SeriesListItem[]> {
  if (!hasSupabaseEnv) return [];
  const supabase = createSupabaseServerClient();

  const [{ data: franchises, error: franchiseError }, { data: plays, error: playError }] = await Promise.all([
    supabase.from("franchises").select("id, slug, name, description, origin_type").order("name", { ascending: true }),
    supabase.from("plays").select("id, franchise_id"),
  ]);

  if (franchiseError) throw franchiseError;
  if (playError) throw playError;

  const countByFranchise = new Map<string, number>();
  for (const play of (plays ?? []) as any[]) {
    const franchiseId = String(play?.franchise_id ?? "").trim();
    if (!franchiseId) continue;
    countByFranchise.set(franchiseId, (countByFranchise.get(franchiseId) ?? 0) + 1);
  }

  return ((franchises ?? []) as any[])
    .filter((row) => row?.name)
    .map((row) => ({
      slug: (row.slug as string | null) ?? null,
      name: row.name as string,
      description: (row.description as string | null) ?? null,
      playCount: countByFranchise.get(row.id as string) ?? 0,
      originType: (row.origin_type as string | null) ?? null,
    }))
    .filter((row) => row.slug)
    .map((row) => ({
      slug: row.slug as string,
      name: row.name,
      description: row.description,
      playCount: row.playCount,
      originType: row.originType,
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
