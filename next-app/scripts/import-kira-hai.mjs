import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE = "kira-hai";
const BASE_URL = "https://kira-hai.net";
const DEFAULT_DELAY_MS = 2500;
const USER_AGENT =
  "StageConnectExternalCandidateBot/0.1 (+https://stageconnect.jp; external frame candidates only)";

const INDEX_PATHS = [
  "/a-actors-index",
  "/ka-actors-index",
  "/sa-actors-index",
  "/ta-actors-index",
  "/na-actors-index",
  "/ha-actors-index",
  "/ma-actors-index",
  "/ya-actors-index",
  "/ra-actors-index",
  "/wa-actors-index",
];

const BLOCKED_PATH_PARTS = [
  "/wp-admin",
  "/wp-json",
  "/category/",
  "/tag/",
  "/page/",
  "/author/",
  "/feed",
  "/comments",
];

function parseArgs(argv) {
  const args = {
    write: false,
    onlyIndex: false,
    fromDb: false,
    limitActors: Number.POSITIVE_INFINITY,
    offsetActors: 0,
    delayMs: DEFAULT_DELAY_MS,
  };

  for (const arg of argv) {
    if (arg === "--write") args.write = true;
    else if (arg === "--only-index") args.onlyIndex = true;
    else if (arg === "--from-db") args.fromDb = true;
    else if (arg.startsWith("--limit-actors=")) {
      const value = Number(arg.split("=")[1]);
      if (Number.isFinite(value) && value > 0) args.limitActors = Math.trunc(value);
    } else if (arg.startsWith("--offset-actors=")) {
      const value = Number(arg.split("=")[1]);
      if (Number.isFinite(value) && value >= 0) args.offsetActors = Math.trunc(value);
    } else if (arg.startsWith("--delay-ms=")) {
      const value = Number(arg.split("=")[1]);
      if (Number.isFinite(value) && value >= 1000) args.delayMs = Math.trunc(value);
    }
  }

  return args;
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 0) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function loadLocalEnv() {
  loadEnvFile(join(process.cwd(), ".env.local"));
  loadEnvFile(join(process.cwd(), ".env"));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toAbsoluteUrl(href) {
  if (!href) return null;
  try {
    return new URL(href, BASE_URL).toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function getPathname(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return "";
  }
}

function shouldSkipUrl(url) {
  const parsed = new URL(url);
  if (parsed.origin !== BASE_URL) return true;
  const pathname = parsed.pathname;
  if (INDEX_PATHS.includes(pathname)) return true;
  return BLOCKED_PATH_PARTS.some((part) => pathname.includes(part));
}

function normalizeWhitespace(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeMatchText(value) {
  return normalizeWhitespace(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[『』「」"'“”‘’【】\[\]（）()〈〉<>《》]/g, "")
    .replace(/[~〜～\-ー―–—\s・:：/／]/g, "")
    .replace(/(?:初演|再演|振替公演|公演中止|公演延期|ライブ配信)/g, "")
    .trim();
}

function findActorMatch(actorMap, actor) {
  return (
    actorMap.get(normalizeMatchText(actor.sourceActorName)) ??
    actorMap.get(normalizeMatchText(actor.aliasTo)) ??
    actorMap.get(normalizeMatchText(actor.aliasFrom)) ??
    null
  );
}

function normalizeTitleForStorage(value) {
  return normalizeWhitespace(value)
    .normalize("NFKC")
    .replace(/[『』「」"'“”‘’]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractEventNote(title) {
  const notes = [];
  for (const token of ["初演", "再演", "振替公演", "公演中止", "公演延期", "ライブ配信"]) {
    if (title.includes(token)) notes.push(token);
  }
  return notes.length > 0 ? Array.from(new Set(notes)).join(" / ") : null;
}

function parseActorAnchor(text) {
  const cleaned = normalizeWhitespace(text);
  const arrowMatch = cleaned.match(/^(.+?)\s*(?:→|⇒|->)\s*(.+)$/);
  if (!arrowMatch) {
    return {
      sourceActorName: cleaned,
      aliasFrom: null,
      aliasTo: null,
      note: null,
    };
  }

  const aliasFrom = normalizeWhitespace(arrowMatch[1]);
  const aliasTo = normalizeWhitespace(arrowMatch[2]);

  return {
    sourceActorName: aliasTo || aliasFrom,
    aliasFrom,
    aliasTo,
    note: cleaned,
  };
}

function parseRoleNames(roleRaw) {
  const cleaned = normalizeWhitespace(roleRaw);
  if (!cleaned) return null;
  const parts = cleaned
    .split(/\s*(?:\/|／)\s*/g)
    .map((item) => normalizeWhitespace(item))
    .filter(Boolean);
  return parts.length > 1 ? parts : [cleaned];
}

function toIsoDate(year, month, day) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function extractActorKana(lines, actorName) {
  const parenKanaPattern = /[（(]\s*([ぁ-ゖー\s　]+)\s*[）)]/;
  const kanaPattern = /[ぁ-ゖー\s　]+/g;
  const isUsefulKana = (value) => {
    const cleaned = normalizeWhitespace(value).replace(/\s+/g, "");
    return cleaned.length >= 4 && !/(トップ|コメント|プロフィール|出演舞台|名前|俳優)/.test(cleaned);
  };

  const nameIndex = lines.findIndex((line) => actorName && line.includes(actorName));
  const window =
    nameIndex >= 0
      ? lines.slice(Math.max(0, nameIndex - 2), Math.min(lines.length, nameIndex + 8))
      : lines.slice(0, 20);

  const candidates = [];
  for (const line of window) {
    const parenMatch = line.match(parenKanaPattern);
    if (parenMatch && isUsefulKana(parenMatch[1])) {
      return normalizeWhitespace(parenMatch[1]);
    }

    for (const match of line.matchAll(kanaPattern)) {
      const value = normalizeWhitespace(match[0]);
      if (isUsefulKana(value)) candidates.push(value);
    }
  }

  return candidates.sort((a, b) => b.replace(/\s+/g, "").length - a.replace(/\s+/g, "").length)[0] ?? null;
}

function parseActorProfileFacts(html, actor = {}) {
  const $ = cheerio.load(html);
  const bodyText = $("body").text();
  const stageIndex = bodyText.indexOf("出演舞台");
  const headText = stageIndex >= 0 ? bodyText.slice(0, stageIndex) : bodyText.slice(0, 5000);
  const normalized = headText.normalize("NFKC");
  const lines = normalized
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

  const joined = lines.join(" / ");
  const birthdayMatch = joined.match(/((?:19|20)\d{2})年\s*(\d{1,2})月\s*(\d{1,2})日/);
  const heightMatch = joined.match(/(\d{3})\s*cm/i);
  const bloodMatch = joined.match(/\b(AB|A|B|O)\s*型\b/i);
  const affiliationLine =
    lines.find((line) => /(所属|事務所|劇団|プロダクション|エンタテインメント|エンターテイメント)/.test(line)) ?? null;

  const factLines = lines.filter((line) => /(?:生まれ|誕生日|cm|血液型|[ABO]型)/i.test(line));
  const sourceBirthdayRaw = birthdayMatch ? birthdayMatch[0] : null;

  return {
    sourceActorKana: extractActorKana(lines, actor.sourceActorName),
    sourceProfileFactsRaw: factLines.length > 0 ? factLines.slice(0, 5).join(" / ") : null,
    sourceBirthdayRaw,
    sourceBirthday: birthdayMatch ? toIsoDate(birthdayMatch[1], birthdayMatch[2], birthdayMatch[3]) : null,
    sourceHeightCm: heightMatch ? Number(heightMatch[1]) : null,
    sourceBloodType: bloodMatch ? bloodMatch[1].toUpperCase() : null,
    sourceAffiliationRaw: affiliationLine,
  };
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!res.ok) {
    throw new Error(`fetch failed ${res.status} ${url}`);
  }

  return res.text();
}

function parseRobots(robotsText) {
  const disallow = [];
  let appliesToUs = false;

  for (const rawLine of robotsText.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;

    const [rawKey, ...rest] = line.split(":");
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(":").trim();

    if (key === "user-agent") {
      const agent = value.toLowerCase();
      appliesToUs = agent === "*" || USER_AGENT.toLowerCase().startsWith(agent);
      continue;
    }

    if (appliesToUs && key === "disallow" && value) {
      disallow.push(value);
    }
  }

  return disallow;
}

async function assertRobotsAllowed(paths) {
  const robotsUrl = `${BASE_URL}/robots.txt`;
  const robotsText = await fetchText(robotsUrl);
  const disallow = parseRobots(robotsText);
  const blocked = paths.filter((path) => disallow.some((rule) => rule !== "/" && path.startsWith(rule)));

  if (disallow.includes("/") || blocked.length > 0) {
    throw new Error(`robots.txt disallows target paths: ${blocked.join(", ") || "/"}`);
  }

  console.log(`[robots] allowed ${paths.length} target paths`);
}

async function fetchHtml(url, delayMs) {
  console.log(`[fetch] ${url}`);
  const html = await fetchText(url);
  await sleep(delayMs);
  return html;
}

function parseActorIndex(html) {
  const $ = cheerio.load(html);
  const actors = new Map();

  $("a[href]").each((_index, element) => {
    const href = $(element).attr("href");
    const url = toAbsoluteUrl(href);
    const text = normalizeWhitespace($(element).text());
    if (!url || !text || shouldSkipUrl(url)) return;
    if (text.length > 80) return;
    if (/^(top|home|next|prev|コメント|お問い合わせ|プライバシー)/i.test(text)) return;

    const parsed = parseActorAnchor(text);
    if (!parsed.sourceActorName) return;

    actors.set(url, {
      ...parsed,
      sourceActorUrl: url,
    });
  });

  return Array.from(actors.values());
}

function findStageSection($) {
  const heading = $("h1,h2,h3,h4,h5")
    .filter((_index, element) => normalizeWhitespace($(element).text()).includes("出演舞台"))
    .first();

  if (heading.length === 0) return $();

  const nodes = [];
  let current = heading.next();
  while (current.length > 0) {
    const tag = String(current.prop("tagName") ?? "").toLowerCase();
    if (/^h[1-5]$/.test(tag)) break;
    nodes.push(current.get(0));
    current = current.next();
  }

  return $(nodes);
}

function extractYear(text, fallbackYear) {
  const yearMatch = normalizeWhitespace(text).match(/(?:^|\D)((?:19|20)\d{2})(?:\D|$)/);
  if (yearMatch) return Number(yearMatch[1]);
  return fallbackYear ?? null;
}

function cleanRoleText(value) {
  const cleaned = normalizeWhitespace(value)
    .replace(/<img\b[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[★☆]+/g, " ")
    .replace(/[（(]\d{4}[）)]/g, "");

  return normalizeWhitespace(cleaned) || null;
}

function parseRoleFromLine(lineText, title) {
  const normalizedLine = normalizeWhitespace(lineText);
  const titleIndex = normalizedLine.indexOf(title);
  const afterTitle = titleIndex >= 0 ? normalizedLine.slice(titleIndex + title.length) : normalizedLine;
  const colonMatch = afterTitle.match(/[：:]\s*(.+)$/);
  if (!colonMatch) return null;
  return cleanRoleText(colonMatch[1]);
}

function findWorkTitleSegments(lineText, workTitles) {
  const normalizedLine = normalizeWhitespace(lineText);
  const segments = [];
  let cursor = 0;

  for (const title of workTitles) {
    const normalizedTitle = normalizeWhitespace(title);
    if (!normalizedTitle) {
      segments.push(null);
      continue;
    }

    let start = normalizedLine.indexOf(normalizedTitle, cursor);
    if (start < 0) start = normalizedLine.indexOf(normalizedTitle);
    if (start < 0) {
      segments.push(null);
      continue;
    }

    const nextStart = workTitles
      .map((nextTitle) => normalizeWhitespace(nextTitle))
      .filter((nextTitle) => nextTitle && nextTitle !== normalizedTitle)
      .map((nextTitle) => normalizedLine.indexOf(nextTitle, start + normalizedTitle.length))
      .filter((index) => index > start)
      .sort((a, b) => a - b)[0];

    const end = nextStart ?? normalizedLine.length;
    segments.push(normalizedLine.slice(start, end));
    cursor = start + normalizedTitle.length;
  }

  return segments;
}

function parseActorStageCredits(html, actor) {
  const $ = cheerio.load(html);
  const section = findStageSection($);
  const credits = [];
  let currentYear = null;

  section.each((_index, element) => {
    const node = $(element);
    const text = normalizeWhitespace(node.text());
    if (!text) return;

    const yearFromNode = extractYear(text, currentYear);
    if (yearFromNode) currentYear = yearFromNode;

    const links = node.find("a[href]").toArray();
    const workLinks = links
      .map((link) => {
        const linkNode = $(link);
        const workUrl = toAbsoluteUrl(linkNode.attr("href"));
        const workTitle = normalizeWhitespace(linkNode.text());
        return { workUrl, workTitle };
      })
      .filter(({ workUrl, workTitle }) => workUrl && !shouldSkipUrl(workUrl) && workTitle && workTitle !== actor.sourceActorName);
    const titleSegments = findWorkTitleSegments(
      text,
      workLinks.map((item) => item.workTitle)
    );

    for (const [linkIndex, link] of workLinks.entries()) {
      const { workUrl, workTitle } = link;

      const roleRaw = parseRoleFromLine(titleSegments[linkIndex] ?? text, workTitle);
      const year = extractYear(text, currentYear);

      credits.push({
        sourceActorName: actor.sourceActorName,
        sourceActorUrl: actor.sourceActorUrl,
        sourceWorkTitle: workTitle,
        sourceWorkUrl: workUrl,
        sourceYear: year,
        sourceRoleRaw: roleRaw,
        sourceRoleNames: parseRoleNames(roleRaw),
      });
    }
  });

  const deduped = new Map();
  for (const credit of credits) {
    const key = [
      credit.sourceActorUrl,
      credit.sourceWorkUrl,
      credit.sourceYear ?? "",
      credit.sourceRoleRaw ?? "",
    ].join("::");
    deduped.set(key, credit);
  }

  return Array.from(deduped.values());
}

async function loadExistingRows(supabase) {
  const [actorsRes, playsRes] = await Promise.all([
    supabase.from("actors").select("id,name,kana,slug,name_en").limit(10000),
    supabase.from("plays").select("id,title,title_en,slug").limit(10000),
  ]);

  if (actorsRes.error) throw actorsRes.error;
  if (playsRes.error) throw playsRes.error;

  const actorMap = new Map();
  for (const actor of actorsRes.data ?? []) {
    for (const value of [actor.name, actor.kana, actor.slug, actor.name_en]) {
      const key = normalizeMatchText(value);
      if (key && !actorMap.has(key)) actorMap.set(key, actor);
    }
  }

  const playMap = new Map();
  for (const play of playsRes.data ?? []) {
    for (const value of [play.title, play.title_en, play.slug]) {
      const key = normalizeMatchText(value);
      if (key && !playMap.has(key)) playMap.set(key, play);
    }
  }

  return { actorMap, playMap };
}

async function loadMatchedExternalActors(supabase, limitActors, offsetActors) {
  let query = supabase
    .from("external_actors")
    .select("source_actor_name,source_actor_url,source_actor_kana,alias_from,alias_to,note")
    .eq("source", SOURCE)
    .not("matched_actor_id", "is", null)
    .order("source_actor_name", { ascending: true });

  if (Number.isFinite(limitActors)) {
    query = query.range(offsetActors, offsetActors + limitActors - 1);
  } else if (offsetActors > 0) {
    query = query.range(offsetActors, offsetActors + 999);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => ({
    sourceActorName: row.source_actor_name,
    sourceActorUrl: row.source_actor_url,
    sourceActorKana: row.source_actor_kana,
    aliasFrom: row.alias_from,
    aliasTo: row.alias_to,
    note: row.note,
  }));
}

async function upsertExternalActor(supabase, actor, match) {
  const payload = {
    source: SOURCE,
    source_actor_name: actor.sourceActorName,
    source_actor_url: actor.sourceActorUrl,
    alias_from: actor.aliasFrom,
    alias_to: actor.aliasTo,
    note: actor.note,
    matched_actor_id: match?.id ?? null,
    match_status: match ? "matched" : "unmatched",
    match_confidence: match ? 90 : 0,
    scraped_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if ("sourceProfileFactsRaw" in actor) payload.source_profile_facts_raw = actor.sourceProfileFactsRaw;
  if ("sourceActorKana" in actor) payload.source_actor_kana = actor.sourceActorKana;
  if ("sourceBirthdayRaw" in actor) payload.source_birthday_raw = actor.sourceBirthdayRaw;
  if ("sourceBirthday" in actor) payload.source_birthday = actor.sourceBirthday;
  if ("sourceHeightCm" in actor) payload.source_height_cm = actor.sourceHeightCm;
  if ("sourceBloodType" in actor) payload.source_blood_type = actor.sourceBloodType;
  if ("sourceAffiliationRaw" in actor) payload.source_affiliation_raw = actor.sourceAffiliationRaw;

  const { data, error } = await supabase
    .from("external_actors")
    .upsert(payload, { onConflict: "source,source_actor_url" })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

async function upsertExternalActorsBatch(supabase, actors, actorMap) {
  const now = new Date().toISOString();
  const payloads = actors.map((actor) => {
    const match = findActorMatch(actorMap, actor);
    const payload = {
      source: SOURCE,
      source_actor_name: actor.sourceActorName,
      source_actor_url: actor.sourceActorUrl,
      alias_from: actor.aliasFrom,
      alias_to: actor.aliasTo,
      note: actor.note,
      matched_actor_id: match?.id ?? null,
      match_status: match ? "matched" : "unmatched",
      match_confidence: match ? 90 : 0,
      scraped_at: now,
      updated_at: now,
    };

    if ("sourceProfileFactsRaw" in actor) payload.source_profile_facts_raw = actor.sourceProfileFactsRaw;
    if ("sourceActorKana" in actor) payload.source_actor_kana = actor.sourceActorKana;
    if ("sourceBirthdayRaw" in actor) payload.source_birthday_raw = actor.sourceBirthdayRaw;
    if ("sourceBirthday" in actor) payload.source_birthday = actor.sourceBirthday;
    if ("sourceHeightCm" in actor) payload.source_height_cm = actor.sourceHeightCm;
    if ("sourceBloodType" in actor) payload.source_blood_type = actor.sourceBloodType;
    if ("sourceAffiliationRaw" in actor) payload.source_affiliation_raw = actor.sourceAffiliationRaw;

    return payload;
  });

  const chunkSize = 250;
  const idsByUrl = new Map();

  for (let i = 0; i < payloads.length; i += chunkSize) {
    const chunk = payloads.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from("external_actors")
      .upsert(chunk, { onConflict: "source,source_actor_url" })
      .select("id,source_actor_url");

    if (error) throw error;

    for (const row of data ?? []) {
      idsByUrl.set(row.source_actor_url, row.id);
    }

    console.log(`[db] external_actors ${Math.min(i + chunk.length, payloads.length)} / ${payloads.length}`);
  }

  return idsByUrl;
}

async function upsertExternalPlay(supabase, credit, match) {
  const payload = {
    source: SOURCE,
    source_work_title_raw: credit.sourceWorkTitle,
    source_work_title_normalized: normalizeTitleForStorage(credit.sourceWorkTitle),
    source_work_url: credit.sourceWorkUrl,
    source_year: credit.sourceYear,
    event_note: extractEventNote(credit.sourceWorkTitle),
    matched_play_id: match?.id ?? null,
    match_status: match ? "matched" : "unmatched",
    match_confidence: match ? 90 : 0,
    scraped_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const existing = await supabase
    .from("external_plays")
    .select("id")
    .eq("source", SOURCE)
    .eq("source_work_url", credit.sourceWorkUrl)
    .maybeSingle();

  if (existing.error) throw existing.error;

  if (existing.data?.id) {
    const { data, error } = await supabase
      .from("external_plays")
      .update(payload)
      .eq("id", existing.data.id)
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  }

  const { data, error } = await supabase.from("external_plays").insert(payload).select("id").single();
  if (error) throw error;
  return data.id;
}

async function upsertCastCandidate(supabase, credit, externalActorId, externalPlayId, actorMatch, playMatch) {
  const payload = {
    source: SOURCE,
    external_actor_id: externalActorId,
    external_play_id: externalPlayId,
    source_actor_name: credit.sourceActorName,
    source_actor_url: credit.sourceActorUrl,
    source_work_title: credit.sourceWorkTitle,
    source_work_url: credit.sourceWorkUrl,
    source_year: credit.sourceYear,
    source_role_raw: credit.sourceRoleRaw,
    source_role_names: credit.sourceRoleNames,
    matched_actor_id: actorMatch?.id ?? null,
    matched_play_id: playMatch?.id ?? null,
    confidence: actorMatch && playMatch ? 90 : actorMatch ? 60 : 0,
    status: "pending",
    scraped_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  let query = supabase
    .from("external_cast_candidates")
    .select("id,status")
    .eq("source", SOURCE)
    .eq("source_actor_url", credit.sourceActorUrl)
    .eq("source_work_title", credit.sourceWorkTitle);

  if (credit.sourceYear == null) query = query.is("source_year", null);
  else query = query.eq("source_year", credit.sourceYear);

  if (credit.sourceRoleRaw == null) query = query.is("source_role_raw", null);
  else query = query.eq("source_role_raw", credit.sourceRoleRaw);

  const existing = await query.maybeSingle();
  if (existing.error) throw existing.error;

  if (existing.data?.id) {
    const patch = { ...payload };
    if (existing.data.status !== "pending") delete patch.status;
    const { error } = await supabase.from("external_cast_candidates").update(patch).eq("id", existing.data.id);
    if (error) throw error;
    return existing.data.id;
  }

  const { data, error } = await supabase.from("external_cast_candidates").insert(payload).select("id").single();
  if (error) throw error;
  return data.id;
}

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when using --write");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function main() {
  loadLocalEnv();

  const args = parseArgs(process.argv.slice(2));
  console.log(
    `[mode] ${args.write ? "write" : "dry-run"} / delay=${args.delayMs}ms / limit=${args.limitActors} / offset=${args.offsetActors}`
  );

  await assertRobotsAllowed(["/robots.txt", ...INDEX_PATHS]);

  let supabase = null;
  let existing = { actorMap: new Map(), playMap: new Map() };

  if (args.write) {
    supabase = createSupabaseClient();
    existing = await loadExistingRows(supabase);
    console.log(`[db] actors=${existing.actorMap.size} playKeys=${existing.playMap.size}`);
  }

  let actors = [];

  if (args.fromDb) {
    if (!args.write) {
      throw new Error("--from-db requires --write so the script can read external_actors");
    }
    actors = await loadMatchedExternalActors(supabase, args.limitActors, args.offsetActors);
    console.log(`[actors] loaded from external_actors matched=${actors.length}`);
  } else {
    const indexedActors = new Map();

    for (const path of INDEX_PATHS) {
      const html = await fetchHtml(`${BASE_URL}${path}`, args.delayMs);
      for (const actor of parseActorIndex(html)) {
        indexedActors.set(actor.sourceActorUrl, actor);
      }
      console.log(`[index] ${path} totalActors=${indexedActors.size}`);
    }

    actors = Array.from(indexedActors.values()).slice(
      args.offsetActors,
      Number.isFinite(args.limitActors) ? args.offsetActors + args.limitActors : undefined
    );
    console.log(`[actors] selected=${actors.length} / indexed=${indexedActors.size}`);

    if (args.write) {
      await upsertExternalActorsBatch(supabase, actors, existing.actorMap);
      console.log("[db] external_actors upserted");
    }
  }

  if (args.onlyIndex) {
    console.log("[done] only index");
    return;
  }

  let creditCount = 0;
  let writeCount = 0;

  for (const actor of actors) {
    const actorMatch = findActorMatch(existing.actorMap, actor);
    if (args.write && !actorMatch) {
      continue;
    }

    const html = await fetchHtml(actor.sourceActorUrl, args.delayMs);
    const actorWithFacts = { ...actor, ...parseActorProfileFacts(html, actor) };
    const credits = parseActorStageCredits(html, actorWithFacts);
    creditCount += credits.length;
    console.log(`[credits] ${actor.sourceActorName} ${credits.length}`);

    if (!args.write) continue;

    const externalActorId = await upsertExternalActor(supabase, actorWithFacts, actorMatch);

    for (const credit of credits) {
      const playMatch = existing.playMap.get(normalizeMatchText(credit.sourceWorkTitle)) ?? null;
      const externalPlayId = await upsertExternalPlay(supabase, credit, playMatch);
      await upsertCastCandidate(supabase, credit, externalActorId, externalPlayId, actorMatch, playMatch);
      writeCount += 1;
    }
  }

  console.log(`[done] credits=${creditCount} written=${writeCount}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
