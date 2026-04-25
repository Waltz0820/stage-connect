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

function parseRoleFromLine(lineText, title) {
  const normalizedLine = normalizeWhitespace(lineText);
  const titleIndex = normalizedLine.indexOf(title);
  const afterTitle = titleIndex >= 0 ? normalizedLine.slice(titleIndex + title.length) : normalizedLine;
  const colonMatch = afterTitle.match(/[：:]\s*(.+)$/);
  if (!colonMatch) return null;
  return normalizeWhitespace(colonMatch[1].replace(/[（(]\d{4}[）)]/g, ""));
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
    for (const link of links) {
      const linkNode = $(link);
      const workUrl = toAbsoluteUrl(linkNode.attr("href"));
      const workTitle = normalizeWhitespace(linkNode.text());
      if (!workUrl || shouldSkipUrl(workUrl) || !workTitle) continue;
      if (workTitle === actor.sourceActorName) continue;

      const roleRaw = parseRoleFromLine(text, workTitle);
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
    .select("source_actor_name,source_actor_url,alias_from,alias_to,note")
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
    const match = actorMap.get(normalizeMatchText(actor.sourceActorName)) ?? null;
    return {
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
    const actorMatch = existing.actorMap.get(normalizeMatchText(actor.sourceActorName)) ?? null;
    if (args.write && !actorMatch) {
      continue;
    }

    const html = await fetchHtml(actor.sourceActorUrl, args.delayMs);
    const credits = parseActorStageCredits(html, actor);
    creditCount += credits.length;
    console.log(`[credits] ${actor.sourceActorName} ${credits.length}`);

    if (!args.write) continue;

    const externalActorId = await upsertExternalActor(supabase, actor, actorMatch);

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
