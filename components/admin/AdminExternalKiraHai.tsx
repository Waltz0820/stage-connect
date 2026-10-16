// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "../../next-app/lib/admin-router-shim";
import { supabase } from "../../next-app/lib/admin-supabase";
import { toSlug } from "./widgets/utils";
import { acceptCandidateWithHistory } from "../../next-app/lib/accept-external-candidate.mjs";
import { actorQueueKey, filterCandidateActor, sameCandidateActor, buildCandidateActorQueue } from "../../next-app/lib/candidate-actor-scope.mjs";
import { readAllRows } from "../../next-app/lib/source-match.mjs";

type CandidateRow = {
  id: string;
  source: string;
  source_actor_name: string;
  source_actor_url: string | null;
  source_cast_group?: string | null;
  source_credit_key?: string | null;
  source_order?: number | null;
  updated_at?: string | null;
  external_play_id?: string | null;
  source_work_title: string;
  source_work_url?: string | null;
  source_year?: number | null;
  source_role_raw?: string | null;
  source_role_names?: string[] | null;
  matched_actor_id?: string | null;
  matched_play_id?: string | null;
  accepted_cast_id?: string | null;
  confidence?: number | null;
  status: string;
  note?: string | null;
  scraped_at?: string | null;
};

type ExternalActorRow = {
  id: string;
  source_actor_name: string;
  source_actor_url: string;
  matched_actor_id?: string | null;
  match_status: string;
  match_confidence?: number | null;
};

type ActorRow = { id: string; name: string; slug: string };
type PlayRow = { id: string; title: string; slug: string };
type ExternalPlayDetailRow = {
  source_period_text?: string | null;
  source_venue_text?: string | null;
  source_schedule_raw?: string | null;
  source_venue_raw?: string | null;
};

type UnmatchedActorQueueRow = {
  sourceActorName: string;
  sourceActorUrl: string | null;
  candidateId?: string;
  sourceWorkUrl?: string | null;
  sourceActorKana?: string | null;
  aliasFrom?: string | null;
  aliasTo?: string | null;
  note?: string | null;
  sourceProfileFactsRaw?: string | null;
  sourceBirthdayRaw?: string | null;
  sourceBirthday?: string | null;
  sourceHeightCm?: number | null;
  sourceBloodType?: string | null;
  sourceAffiliationRaw?: string | null;
  candidateCount: number;
  matchedPlayCount: number;
  latestYear?: number | null;
};

type WorkQueueRow = {
  sourceWorkTitle: string;
  sourceWorkUrl?: string | null;
  sourceYear?: number | null;
  matchedPlayId?: string | null;
  candidateCount: number;
  matchedActorCount: number;
  acceptedCount: number;
  roleSamples: string[];
  actorSamples: string[];
};

type ImportLogRow = {
  id: string;
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  target_label?: string | null;
  source_url?: string | null;
  details?: Record<string, any> | null;
  created_at: string;
};

const PAGE_SIZE = 80;

const statusLabels: Record<string, string> = {
  pending: "未処理",
  accepted: "採用済み",
  rejected: "無視",
  needs_review: "保留",
};

const statusOptions = [
  { value: "pending", label: "未処理" },
  { value: "needs_review", label: "保留" },
  { value: "accepted", label: "採用済み" },
  { value: "rejected", label: "無視" },
];

const queueOptions = [
  { value: "all", label: "すべて" },
  { value: "ready", label: "すぐ採用" },
  { value: "skeleton", label: "作品作成候補" },
  { value: "actor_unmatched", label: "俳優未照合" },
  { value: "actor_queue", label: "未照合俳優キュー" },
  { value: "work_queue", label: "作品別キュー" },
];

const normalizeText = (value?: string | null) => (value ?? "").trim();

const normalizeLooseTitle = (value?: string | null) =>
  normalizeText(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[『』「」"'“”‘’【】\[\]（）()〈〉<>《》]/g, "")
    .replace(/vs/gi, "対")
    .replace(/[~〜～\-ー―–—\s・:：/／]/g, "")
    .replace(/(?:初演|再演|振替公演|公演中止|公演延期|ライブ配信)/g, "")
    .trim();

const buildPlaySearchWords = (title: string) => {
  const normalized = normalizeText(title).normalize("NFKC");
  const words = normalized
    .replace(/[『』「」"'“”‘’【】\[\]（）()〈〉<>《》]/g, " ")
    .replace(/[~〜～\-ー―–—:：/／]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2)
    .slice(0, 6);

  return Array.from(new Set(words));
};

const getSourceSlug = (url?: string | null) => {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").map((part) => part.trim()).filter(Boolean);
    return parts.at(-1) ?? "";
  } catch {
    return "";
  }
};

const kanaDigraphMap: Record<string, string> = {
  きゃ: "kya", きゅ: "kyu", きょ: "kyo",
  しゃ: "sha", しゅ: "shu", しょ: "sho",
  ちゃ: "cha", ちゅ: "chu", ちょ: "cho",
  にゃ: "nya", にゅ: "nyu", にょ: "nyo",
  ひゃ: "hya", ひゅ: "hyu", ひょ: "hyo",
  みゃ: "mya", みゅ: "myu", みょ: "myo",
  りゃ: "rya", りゅ: "ryu", りょ: "ryo",
  ぎゃ: "gya", ぎゅ: "gyu", ぎょ: "gyo",
  じゃ: "ja", じゅ: "ju", じょ: "jo",
  びゃ: "bya", びゅ: "byu", びょ: "byo",
  ぴゃ: "pya", ぴゅ: "pyu", ぴょ: "pyo",
  ふぁ: "fa", ふぃ: "fi", ふぇ: "fe", ふぉ: "fo",
  てぃ: "ti", でぃ: "di",
  うぃ: "wi", うぇ: "we", うぉ: "wo",
  ヴぁ: "va", ヴぃ: "vi", ヴ: "vu", ヴぇ: "ve", ヴぉ: "vo",
};

const kanaMap: Record<string, string> = {
  あ: "a", い: "i", う: "u", え: "e", お: "o",
  か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko",
  さ: "sa", し: "shi", す: "su", せ: "se", そ: "so",
  た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to",
  な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no",
  は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho",
  ま: "ma", み: "mi", む: "mu", め: "me", も: "mo",
  や: "ya", ゆ: "yu", よ: "yo",
  ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro",
  わ: "wa", を: "wo", ん: "n",
  が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go",
  ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo",
  だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do",
  ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo",
  ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po",
  ぁ: "a", ぃ: "i", ぅ: "u", ぇ: "e", ぉ: "o",
};

const toHiragana = (value: string) =>
  value
    .normalize("NFKC")
    .replace(/[ァ-ン]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60));

const romanizeKanaPart = (part: string) => {
  const chars = Array.from(toHiragana(part.replace(/[^\p{Script=Hiragana}\p{Script=Katakana}ー]/gu, "")));
  let result = "";

  for (let i = 0; i < chars.length; i += 1) {
    const current = chars[i];

    if (current === "っ") {
      const pair = chars.slice(i + 1, i + 3).join("");
      const next = kanaDigraphMap[pair] ?? kanaMap[chars[i + 1]] ?? "";
      if (next) result += next[0];
      continue;
    }

    if (current === "ー") {
      const vowel = result.match(/[aeiou]$/)?.[0] ?? "";
      result += vowel;
      continue;
    }

    const pair = chars.slice(i, i + 2).join("");
    if (kanaDigraphMap[pair]) {
      result += kanaDigraphMap[pair];
      i += 1;
      continue;
    }

    result += kanaMap[current] ?? "";
  }

  return result;
};

const kanaToSlug = (value?: string | null) => {
  const normalized = normalizeText(value);
  if (!normalized) return "";

  const parts = normalized
    .split(/[\s　・･\/／]+/g)
    .map((part) => romanizeKanaPart(part))
    .filter(Boolean);

  if (parts.length < 2) return "";
  return toSlug(parts.join("-"));
};

const makeSkeletonPeriod = (year?: number | null) => (year ? `${year}年` : null);

const getWorkKey = (row: WorkQueueRow) => row.sourceWorkUrl || row.sourceWorkTitle;

const AdminExternalKiraHai: React.FC = () => {
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [externalActors, setExternalActors] = useState<ExternalActorRow[]>([]);
  const [actorStats, setActorStats] = useState({ total: 0, matched: 0 });
  const [actorsById, setActorsById] = useState<Record<string, ActorRow>>({});
  const [playsById, setPlaysById] = useState<Record<string, PlayRow>>({});
  const [status, setStatus] = useState("pending");
  const [queue, setQueue] = useState("all");
  const [q, setQ] = useState("");
  const [actorMatchTarget, setActorMatchTarget] = useState<CandidateRow | null>(null);
  const [actorSearchText, setActorSearchText] = useState("");
  const [actorSearchResults, setActorSearchResults] = useState<ActorRow[]>([]);
  const [unmatchedActorQueue, setUnmatchedActorQueue] = useState<UnmatchedActorQueueRow[]>([]);
  const [workQueue, setWorkQueue] = useState<WorkQueueRow[]>([]);
  const [playMatchTarget, setPlayMatchTarget] = useState<CandidateRow | null>(null);
  const [playSearchText, setPlaySearchText] = useState("");
  const [playCreateTitle, setPlayCreateTitle] = useState("");
  const [playSearchResults, setPlaySearchResults] = useState<PlayRow[]>([]);
  const playMatchPanelRef = useRef<HTMLDivElement | null>(null);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [roleEdits, setRoleEdits] = useState<Record<string, string>>({});
  const [workActorPreview, setWorkActorPreview] = useState<{
    key: string;
    title: string;
    rows: UnmatchedActorQueueRow[];
  } | null>(null);
  const [importLogs, setImportLogs] = useState<ImportLogRow[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const loadReferenceRows = async (rows: CandidateRow[]) => {
    const actorIds = Array.from(new Set(rows.map((row) => row.matched_actor_id).filter(Boolean)));
    const playIds = Array.from(new Set(rows.map((row) => row.matched_play_id).filter(Boolean)));

    if (actorIds.length > 0) {
      const { data, error } = await supabase.from("actors").select("id,name,slug").in("id", actorIds);
      if (error) throw error;
      setActorsById(Object.fromEntries((data ?? []).map((row: ActorRow) => [row.id, row])));
    } else {
      setActorsById({});
    }

    if (playIds.length > 0) {
      const { data, error } = await supabase.from("plays").select("id,title,slug").in("id", playIds);
      if (error) throw error;
      setPlaysById(Object.fromEntries((data ?? []).map((row: PlayRow) => [row.id, row])));
    } else {
      setPlaysById({});
    }
  };

  const loadUnmatchedActorQueue = async () => {
    const { data: actors, error: actorError } = await supabase
      .from("external_actors")
      .select("source_actor_name,source_actor_url,source_actor_kana,alias_from,alias_to,note,source_profile_facts_raw,source_birthday_raw,source_birthday,source_height_cm,source_blood_type,source_affiliation_raw")
      .eq("source", "kira-hai")
      .is("matched_actor_id", null)
      .order("source_actor_name", { ascending: true })
      .limit(300);

    if (actorError) throw actorError;

    const actorUrls = ((actors ?? []) as ExternalActorRow[]).map((actor) => actor.source_actor_url);
    const profilelessCandidates = await readAllRows(supabase, "external_cast_candidates", "*", {
      configure: (query) => query.eq("source", "kira-hai").is("source_actor_url", null).is("matched_actor_id", null),
    });
    const profilelessQueue = buildCandidateActorQueue(profilelessCandidates);
    if (actorUrls.length === 0) {
      setUnmatchedActorQueue(profilelessQueue);
      return;
    }

    const { data: candidates, error: candidateError } = await supabase
      .from("external_cast_candidates")
      .select("source_actor_url,source_year,matched_play_id")
      .eq("source", "kira-hai")
      .in("source_actor_url", actorUrls);

    if (candidateError) throw candidateError;

    const stats = new Map<string, { candidateCount: number; matchedPlayCount: number; latestYear: number | null }>();
    for (const row of candidates ?? []) {
      const url = row.source_actor_url;
      const current = stats.get(url) ?? { candidateCount: 0, matchedPlayCount: 0, latestYear: null };
      current.candidateCount += 1;
      if (row.matched_play_id) current.matchedPlayCount += 1;
      if (row.source_year && (!current.latestYear || row.source_year > current.latestYear)) {
        current.latestYear = row.source_year;
      }
      stats.set(url, current);
    }

    const queueRows = ((actors ?? []) as any[])
      .map((actor) => {
        const stat = stats.get(actor.source_actor_url) ?? {
          candidateCount: 0,
          matchedPlayCount: 0,
          latestYear: null,
        };
        return {
          sourceActorName: actor.source_actor_name,
          sourceActorUrl: actor.source_actor_url,
          sourceActorKana: actor.source_actor_kana,
          aliasFrom: actor.alias_from,
          aliasTo: actor.alias_to,
          note: actor.note,
          sourceProfileFactsRaw: actor.source_profile_facts_raw,
          sourceBirthdayRaw: actor.source_birthday_raw,
          sourceBirthday: actor.source_birthday,
          sourceHeightCm: actor.source_height_cm,
          sourceBloodType: actor.source_blood_type,
          sourceAffiliationRaw: actor.source_affiliation_raw,
          candidateCount: stat.candidateCount,
          matchedPlayCount: stat.matchedPlayCount,
          latestYear: stat.latestYear,
        } as UnmatchedActorQueueRow;
      })
      .sort((a, b) => {
        const aAlias = a.aliasFrom || a.aliasTo ? 1 : 0;
        const bAlias = b.aliasFrom || b.aliasTo ? 1 : 0;
        return (
          b.matchedPlayCount - a.matchedPlayCount ||
          b.candidateCount - a.candidateCount ||
          bAlias - aAlias ||
          (b.latestYear ?? 0) - (a.latestYear ?? 0) ||
          a.sourceActorName.localeCompare(b.sourceActorName, "ja")
        );
      });

    setUnmatchedActorQueue([...queueRows, ...profilelessQueue]);
  };

  const loadWorkQueue = async () => {
    const { data, error } = await supabase
      .from("external_cast_candidates")
      .select("*")
      .eq("source", "kira-hai")
      .neq("status", "rejected")
      .order("source_work_title", { ascending: true })
      .limit(2000);

    if (error) throw error;

    const map = new Map<string, WorkQueueRow & { actorKeys: Set<string>; roleKeys: Set<string> }>();

    for (const row of data ?? []) {
      const title = normalizeText(row.source_work_title);
      if (!title) continue;
      const key = `${row.source_work_url || ""}::${title}`;
      const current =
        map.get(key) ??
        ({
          sourceWorkTitle: title,
          sourceWorkUrl: row.source_work_url,
          sourceYear: row.source_year,
          matchedPlayId: row.matched_play_id,
          candidateCount: 0,
          matchedActorCount: 0,
          acceptedCount: 0,
          roleSamples: [],
          actorSamples: [],
          actorKeys: new Set<string>(),
          roleKeys: new Set<string>(),
        } as WorkQueueRow & { actorKeys: Set<string>; roleKeys: Set<string> });

      current.candidateCount += 1;
      if (row.matched_actor_id) current.matchedActorCount += 1;
      if (row.status === "accepted") current.acceptedCount += 1;
      if (!current.matchedPlayId && row.matched_play_id) current.matchedPlayId = row.matched_play_id;
      if (!current.sourceYear && row.source_year) current.sourceYear = row.source_year;

      const actorName = normalizeText(row.source_actor_name);
      if (actorName && !current.actorKeys.has(actorName) && current.actorSamples.length < 6) {
        current.actorKeys.add(actorName);
        current.actorSamples.push(actorName);
      }

      const roleName = normalizeText(row.source_role_raw) || normalizeText(row.source_cast_group);
      if (roleName && !current.roleKeys.has(roleName) && current.roleSamples.length < 6) {
        current.roleKeys.add(roleName);
        current.roleSamples.push(roleName);
      }

      map.set(key, current);
    }

    const rows = Array.from(map.values())
      .map(({ actorKeys, roleKeys, ...row }) => row)
      .sort((a, b) => {
        const aUnmatchedPlay = a.matchedPlayId ? 0 : 1;
        const bUnmatchedPlay = b.matchedPlayId ? 0 : 1;
        return (
          bUnmatchedPlay - aUnmatchedPlay ||
          b.candidateCount - a.candidateCount ||
          b.matchedActorCount - a.matchedActorCount ||
          (b.sourceYear ?? 0) - (a.sourceYear ?? 0) ||
          a.sourceWorkTitle.localeCompare(b.sourceWorkTitle, "ja")
        );
      });

    setWorkQueue(rows);
  };

  const loadImportLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("external_import_logs")
        .select("id,action,target_type,target_id,target_label,source_url,details,created_at")
        .eq("source", "kira-hai")
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) throw error;
      setImportLogs((data ?? []) as ImportLogRow[]);
    } catch {
      setImportLogs([]);
    }
  };

  const load = async () => {
    setLoading(true);
    setMsg("");
    try {
      const candidateQuery = supabase
        .from("external_cast_candidates")
        .select(
          "*"
        )
        .eq("source", "kira-hai")
        .order("scraped_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (status !== "all") {
        candidateQuery.eq("status", status);
      }

      if (queue === "ready") {
        candidateQuery.not("matched_actor_id", "is", null).not("matched_play_id", "is", null);
      } else if (queue === "skeleton") {
        candidateQuery.not("matched_actor_id", "is", null).is("matched_play_id", null);
      } else if (queue === "actor_unmatched") {
        candidateQuery.is("matched_actor_id", null);
      }

      const { data: candidateData, error: candidateError } = await candidateQuery;
      if (candidateError) throw candidateError;

      const nextCandidates = (candidateData ?? []) as CandidateRow[];
      setCandidates(nextCandidates);
      await loadReferenceRows(nextCandidates);
      if (queue === "actor_queue") {
        await loadUnmatchedActorQueue();
      }
      if (queue === "work_queue") {
        await loadWorkQueue();
      }
      await loadImportLogs();

      const { data: actorData, error: actorError } = await supabase
        .from("external_actors")
        .select("id,source_actor_name,source_actor_url,matched_actor_id,match_status,match_confidence")
        .eq("source", "kira-hai")
        .order("source_actor_name", { ascending: true })
        .limit(500);

      if (actorError) throw actorError;
      setExternalActors((actorData ?? []) as ExternalActorRow[]);

      const [{ count: actorTotal, error: actorTotalError }, { count: actorMatched, error: actorMatchedError }] =
        await Promise.all([
          supabase
            .from("external_actors")
            .select("id", { count: "exact", head: true })
            .eq("source", "kira-hai"),
          supabase
            .from("external_actors")
            .select("id", { count: "exact", head: true })
            .eq("source", "kira-hai")
            .not("matched_actor_id", "is", null),
        ]);

      if (actorTotalError) throw actorTotalError;
      if (actorMatchedError) throw actorMatchedError;
      setActorStats({ total: actorTotal ?? 0, matched: actorMatched ?? 0 });
    } catch (error: any) {
      setMsg(error?.message ?? "load error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [queue, status]);

  const stats = useMemo(() => {
    const actorTotal = actorStats.total || externalActors.length;
    const actorMatched = actorStats.matched || externalActors.filter((row) => row.matched_actor_id).length;
    const canAccept = candidates.filter((row) => row.matched_actor_id && row.matched_play_id && row.status === "pending" && !row.accepted_cast_id).length;
    const canSkeleton = candidates.filter((row) => row.matched_actor_id && !row.matched_play_id && row.status !== "accepted").length;

    return { actorTotal, actorMatched, canAccept, canSkeleton };
  }, [actorStats, candidates, externalActors]);

  const visibleCandidates = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return candidates;

    return candidates.filter((row) => {
      const actor = row.matched_actor_id ? actorsById[row.matched_actor_id] : null;
      const play = row.matched_play_id ? playsById[row.matched_play_id] : null;
      return [
        row.source_actor_name,
        row.source_work_title,
        row.source_role_raw,
        row.source_cast_group,
        actor?.name,
        play?.title,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(s));
    });
  }, [actorsById, candidates, playsById, q]);

  const visibleWorkQueue = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return workQueue;

    return workQueue.filter((row) =>
      [
        row.sourceWorkTitle,
        row.sourceYear,
        row.actorSamples.join(" "),
        row.roleSamples.join(" "),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(s))
    );
  }, [q, workQueue]);

  const selectedRows = useMemo(
    () => visibleCandidates.filter((row) => selectedIds[row.id]),
    [selectedIds, visibleCandidates]
  );

  const readySelectedRows = useMemo(
    () => selectedRows.filter((row) => row.matched_actor_id && row.matched_play_id && row.status === "pending" && !row.accepted_cast_id),
    [selectedRows]
  );

  const skeletonSelectedRows = useMemo(
    () => selectedRows.filter((row) => row.matched_actor_id && !row.matched_play_id && row.status !== "accepted"),
    [selectedRows]
  );

  const selectableVisibleRows = useMemo(
    () => visibleCandidates.filter((row) => row.status !== "accepted" && row.matched_actor_id),
    [visibleCandidates]
  );

  const allSelectableVisibleSelected =
    selectableVisibleRows.length > 0 && selectableVisibleRows.every((row) => selectedIds[row.id]);

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => ({ ...current, [id]: !current[id] }));
  };

  const toggleAllSelectableVisible = () => {
    setSelectedIds((current) => {
      const next = { ...current };
      for (const row of selectableVisibleRows) {
        next[row.id] = !allSelectableVisibleSelected;
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds({});
  };

  const getCandidateRoleName = (row: CandidateRow) =>
    normalizeText(Object.prototype.hasOwnProperty.call(roleEdits, row.id) ? roleEdits[row.id] : row.source_role_raw) || null;

  const setCandidateRoleEdit = (row: CandidateRow, value: string) => {
    setRoleEdits((current) => ({ ...current, [row.id]: value }));
  };

  const resetCandidateRoleEdit = (row: CandidateRow) => {
    setRoleEdits((current) => {
      const next = { ...current };
      delete next[row.id];
      return next;
    });
  };

  const updateStatus = async (row: CandidateRow, nextStatus: string) => {
    if (nextStatus === "accepted") {
      await acceptCandidate(row);
      return;
    }
    if (row.status === "accepted" || row.accepted_cast_id) {
      setMsg("採用済みの候補は履歴と配役の整合性を保つため、状態だけを変更できません。");
      return;
    }
    setBusyId(row.id);
    setMsg("");
    try {
      const patch: Record<string, string | null> = {
        status: nextStatus,
        updated_at: new Date().toISOString(),
      };

      if (nextStatus === "rejected") {
        patch.rejected_at = new Date().toISOString();
      }

      const { data: changed, error } = await supabase.from("external_cast_candidates").update(patch)
        .eq("id", row.id).neq("status", "accepted").is("accepted_cast_id", null).select("id,updated_at").maybeSingle();
      if (error) throw error;
      if (!changed) throw new Error("候補が更新されています。再読み込みして状態を確認してください。");

      setCandidates((current) => current.map((item) => (item.id === row.id ? { ...item, status: nextStatus, updated_at: changed.updated_at } : item)));
      if (nextStatus === "accepted" || nextStatus === "rejected") {
        setSelectedIds((current) => ({ ...current, [row.id]: false }));
      }
    } catch (error: any) {
      setMsg(error?.message ?? "status update error");
    } finally {
      setBusyId(null);
    }
  };

  const openActorMatch = async (row: CandidateRow | UnmatchedActorQueueRow) => {
    const target =
      "id" in row
        ? row
        : ({
            id: row.candidateId || row.sourceActorUrl,
            source: "kira-hai",
            source_actor_name: row.sourceActorName,
            source_actor_url: row.sourceActorUrl,
            source_work_title: "",
            source_work_url: row.sourceWorkUrl,
            status: "pending",
          } as CandidateRow);

    setActorMatchTarget(target);
    setActorSearchText(target.source_actor_name ?? "");
    setActorSearchResults([]);
    setMsg("");
    await searchActors(target.source_actor_name ?? "");
  };

  const searchActors = async (value = actorSearchText) => {
    const query = normalizeText(value);
    if (!query) {
      setActorSearchResults([]);
      return;
    }

    const { data, error } = await supabase
      .from("actors")
      .select("id,name,slug")
      .or(`name.ilike.%${query}%,kana.ilike.%${query}%,slug.ilike.%${query}%,profile.ilike.%${query}%`)
      .limit(20);

    if (error) {
      setMsg(error.message ?? "actor search error");
      return;
    }

    setActorSearchResults((data ?? []) as ActorRow[]);
  };

  const applyActorMatch = async (actor: ActorRow) => {
    if (!actorMatchTarget) return;
    setBusyId(actorMatchTarget.id);
    setMsg("");

    try {
      const now = new Date().toISOString();
      const sourceActorUrl = actorMatchTarget.source_actor_url;

      if (sourceActorUrl) {
        const { error: externalActorError } = await supabase
          .from("external_actors")
          .update({
            matched_actor_id: actor.id,
            match_status: "matched_manual",
            match_confidence: 85,
            updated_at: now,
          })
          .eq("source", "kira-hai")
          .eq("source_actor_url", sourceActorUrl);

        if (externalActorError) throw externalActorError;
      }

      const candidateUpdate = supabase
        .from("external_cast_candidates")
        .update({
          matched_actor_id: actor.id,
          confidence: 60,
          updated_at: now,
        })
        .eq("source", "kira-hai")
        .in("status", ["pending", "needs_review"])
        .is("accepted_cast_id", null)
        .is("matched_actor_id", null);
      const { data: changedCandidates, error: candidatesError } = await filterCandidateActor(candidateUpdate, actorMatchTarget).select("id,updated_at");

      if (candidatesError) throw candidatesError;
      if (!changedCandidates?.length) throw new Error("候補が更新されています。再読み込みして照合先を確認してください。");
      const changedById = new Map(changedCandidates.map((item) => [item.id, item]));

      setActorsById((current) => ({ ...current, [actor.id]: actor }));
      setCandidates((current) =>
        current.map((item) =>
          changedById.has(item.id) ? { ...item, matched_actor_id: actor.id, updated_at: changedById.get(item.id).updated_at } : item
        )
      );
      setUnmatchedActorQueue((current) => current.filter((item) => !sameCandidateActor(item, actorMatchTarget)));
      if (sourceActorUrl) setActorStats((current) => ({ ...current, matched: current.matched + 1 }));
      setActorMatchTarget(null);
      setActorSearchResults([]);
      setMsg(`${actorMatchTarget.source_actor_name} を ${actor.name} に手動マッチしました`);
    } catch (error: any) {
      setMsg(error?.message ?? "actor match error");
    } finally {
      setBusyId(null);
    }
  };

  const openPlayMatch = async (row: CandidateRow) => {
    setPlayMatchTarget(row);
    setPlaySearchText(row.source_work_title ?? "");
    setPlayCreateTitle(row.source_work_title ?? "");
    setPlaySearchResults([]);
    setMsg("");
    await searchPlays(row.source_work_title ?? "");
  };

  useEffect(() => {
    if (!playMatchTarget) return;
    window.requestAnimationFrame(() => {
      playMatchPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [playMatchTarget?.id]);

  const searchPlays = async (value = playSearchText) => {
    const query = normalizeText(value);
    if (!query) {
      setPlaySearchResults([]);
      return;
    }

    const words = buildPlaySearchWords(query);
    const primary = words[0] ?? query.slice(0, 12);
    const { data, error } = await supabase
      .from("plays")
      .select("id,title,slug")
      .or(`title.ilike.%${primary}%,title_en.ilike.%${primary}%,slug.ilike.%${primary}%`)
      .limit(50);

    if (error) {
      setMsg(error.message ?? "play search error");
      return;
    }

    const targetKey = normalizeLooseTitle(query);
    const sorted = ((data ?? []) as PlayRow[])
      .map((play) => {
        const key = normalizeLooseTitle(play.title);
        let score = 0;
        if (key === targetKey) score += 100;
        else if (key.includes(targetKey) || targetKey.includes(key)) score += 70;
        for (const word of words) {
          if (normalizeLooseTitle(play.title).includes(normalizeLooseTitle(word))) score += 5;
        }
        return { play, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((item) => item.play);

    setPlaySearchResults(sorted);
  };

  const findSimilarExistingPlays = async (title: string) => {
    const words = buildPlaySearchWords(title);
    const primary = words[0] ?? normalizeText(title).slice(0, 12);
    if (!primary) return [];

    const { data, error } = await supabase
      .from("plays")
      .select("id,title,slug")
      .or(`title.ilike.%${primary}%,title_en.ilike.%${primary}%,slug.ilike.%${primary}%`)
      .limit(50);

    if (error) throw error;

    const targetKey = normalizeLooseTitle(title);
    return ((data ?? []) as PlayRow[]).filter((play) => {
      const key = normalizeLooseTitle(play.title);
      if (!key || !targetKey) return false;
      if (key === targetKey) return true;
      if (key.includes(targetKey) || targetKey.includes(key)) return true;
      const hitWords = words.filter((word) => key.includes(normalizeLooseTitle(word)));
      return words.length >= 2 && hitWords.length >= Math.min(3, words.length);
    });
  };

  const applyPlayMatch = async (play: PlayRow) => {
    if (!playMatchTarget) return;
    setBusyId(playMatchTarget.id);
    setMsg("");

    try {
      const now = new Date().toISOString();

      if (playMatchTarget.external_play_id) {
        const { error: externalPlayError } = await supabase
          .from("external_plays")
          .update({
            matched_play_id: play.id,
            match_status: "matched_manual",
            match_confidence: 85,
            updated_at: now,
          })
          .eq("id", playMatchTarget.external_play_id);

        if (externalPlayError) throw externalPlayError;
      }

      let candidateUpdate = supabase
        .from("external_cast_candidates")
        .update({
          matched_play_id: play.id,
          confidence: 70,
          updated_at: now,
        })
        .eq("source", "kira-hai")
        .in("status", ["pending", "needs_review"])
        .is("accepted_cast_id", null);

      if (playMatchTarget.source_work_url) {
        candidateUpdate = candidateUpdate.eq("source_work_url", playMatchTarget.source_work_url);
      } else {
        candidateUpdate = candidateUpdate.eq("source_work_title", playMatchTarget.source_work_title);
      }

      const { error: candidateError } = await candidateUpdate;
      if (candidateError) throw candidateError;

      setPlaysById((current) => ({ ...current, [play.id]: play }));
      setCandidates((current) =>
        current.map((item) =>
          !item.accepted_cast_id && ["pending", "needs_review"].includes(item.status) && ((playMatchTarget.source_work_url && item.source_work_url === playMatchTarget.source_work_url) ||
          (!playMatchTarget.source_work_url && item.source_work_title === playMatchTarget.source_work_title))
            ? { ...item, matched_play_id: play.id, updated_at: now }
            : item
        )
      );

        setPlayMatchTarget(null);
        setPlaySearchResults([]);
        setPlayCreateTitle("");
      await writeImportLog({
        action: "manual_match_play",
        targetType: "play",
        targetId: play.id,
        targetLabel: play.title,
        sourceUrl: playMatchTarget.source_work_url,
        details: {
          source_work_title: playMatchTarget.source_work_title,
        },
      });
      setMsg(`「${playMatchTarget.source_work_title}」を既存作品「${play.title}」に紐づけました`);
    } catch (error: any) {
      setMsg(error?.message ?? "play match error");
    } finally {
      setBusyId(null);
    }
  };

  const clearPlayMatch = async (row: CandidateRow) => {
    if (!row.matched_play_id) return;

    const ok = window.confirm(
      `作品の紐づけを解除します。\n\n外部候補: ${row.source_work_title}\n\n同じ外部作品URL/作品名の未採用候補を保留に戻します。続行しますか？`
    );
    if (!ok) return;

    setBusyId(row.id);
    setMsg("");
    try {
      const now = new Date().toISOString();

      if (row.external_play_id) {
        const { error: externalPlayError } = await supabase
          .from("external_plays")
          .update({
            matched_play_id: null,
            match_status: "unmatched_manual",
            match_confidence: 0,
            updated_at: now,
          })
          .eq("id", row.external_play_id);

        if (externalPlayError) throw externalPlayError;
      }

      let candidateUpdate = supabase
        .from("external_cast_candidates")
        .update({
          matched_play_id: null,
          status: "needs_review",
          confidence: row.matched_actor_id ? 60 : 0,
          updated_at: now,
        })
        .eq("source", "kira-hai")
        .in("status", ["pending", "needs_review"])
        .is("accepted_cast_id", null);

      if (row.source_work_url) {
        candidateUpdate = candidateUpdate.eq("source_work_url", row.source_work_url);
      } else {
        candidateUpdate = candidateUpdate.eq("source_work_title", row.source_work_title);
      }

      const { error: candidateError } = await candidateUpdate;
      if (candidateError) throw candidateError;

      setCandidates((current) =>
        current.map((item) =>
          !item.accepted_cast_id && ["pending", "needs_review"].includes(item.status) && ((row.source_work_url && item.source_work_url === row.source_work_url) ||
          (!row.source_work_url && item.source_work_title === row.source_work_title))
            ? { ...item, status: "needs_review", matched_play_id: null, confidence: item.matched_actor_id ? 60 : 0, updated_at: now }
            : item
        )
      );

      await writeImportLog({
        action: "clear_play_match",
        targetType: "play",
        targetId: row.matched_play_id,
        targetLabel: row.source_work_title,
        sourceUrl: row.source_work_url,
        details: {
          source_work_title: row.source_work_title,
          previous_matched_play_id: row.matched_play_id,
        },
      });

      setMsg(`「${row.source_work_title}」の作品紐づけを解除しました。再検索できます。`);
    } catch (error: any) {
      setMsg(error?.message ?? "clear play match error");
    } finally {
      setBusyId(null);
    }
  };

  const loadWorkCandidateRows = async (row: WorkQueueRow) => {
    let query = supabase
      .from("external_cast_candidates")
      .select("*")
      .eq("source", "kira-hai")
      .neq("status", "rejected")
      .order("source_year", { ascending: true })
      .limit(300);

    query = row.sourceWorkUrl
      ? query.eq("source_work_url", row.sourceWorkUrl)
      : query.eq("source_work_title", row.sourceWorkTitle);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as CandidateRow[];
  };

  const loadExternalActorFactsByUrl = async (urls: string[]) => {
    const uniqueUrls = Array.from(new Set(urls.map((url) => normalizeText(url)).filter(Boolean)));
    if (uniqueUrls.length === 0) return new Map<string, any>();

    const { data, error } = await supabase
      .from("external_actors")
      .select("source_actor_name,source_actor_url,source_actor_kana,alias_from,alias_to,note,source_profile_facts_raw,source_birthday_raw,source_birthday,source_height_cm,source_blood_type,source_affiliation_raw,matched_actor_id")
      .eq("source", "kira-hai")
      .in("source_actor_url", uniqueUrls);

    if (error) throw error;
    return new Map((data ?? []).map((actor: any) => [actor.source_actor_url, actor]));
  };

  const buildUnmatchedActorRowsForWork = async (row: WorkQueueRow) => {
    const rows = await loadWorkCandidateRows(row);
    const targetRows = rows.filter((item) => !item.matched_actor_id);
    const factsByUrl = await loadExternalActorFactsByUrl(targetRows.map((item) => item.source_actor_url));
    return buildCandidateActorQueue(targetRows, factsByUrl) as UnmatchedActorQueueRow[];
  };

  const writeImportLog = async (payload: {
    action: string;
    targetType?: string | null;
    targetId?: string | null;
    targetLabel?: string | null;
    sourceUrl?: string | null;
    details?: Record<string, any>;
  }) => {
    try {
      await supabase.from("external_import_logs").insert({
        source: "kira-hai",
        action: payload.action,
        target_type: payload.targetType ?? null,
        target_id: payload.targetId ?? null,
        target_label: payload.targetLabel ?? null,
        source_url: payload.sourceUrl ?? null,
        details: payload.details ?? {},
      });
    } catch {
      // ログ用SQLが未適用でも、取り込み作業は止めない。
    }
  };

  const loadActorCandidateRows = async (row: UnmatchedActorQueueRow) => {
    const query = supabase
      .from("external_cast_candidates")
      .select("*")
      .eq("source", "kira-hai")
      .neq("status", "rejected")
      .order("source_year", { ascending: false })
      .limit(120);
    const { data, error } = await filterCandidateActor(query, row);

    if (error) throw error;
    return (data ?? []) as CandidateRow[];
  };

  const copyActorProfileForGemini = async (row: UnmatchedActorQueueRow) => {
    setBusyId(`profile:${actorQueueKey(row)}`);
    setMsg("");

    try {
      const rows = await loadActorCandidateRows(row);
      const appearanceLines = rows.map((item, index) => {
        const parts = [
          `${index + 1}. ${item.source_year || "-"}年`,
          item.source_work_title,
          item.source_role_raw ? `役: ${item.source_role_raw}` : "役: -",
          item.source_cast_group ? `出演区分: ${item.source_cast_group}` : "",
          `作品出典: ${item.source_work_url || "未取得"}`,
          `配役候補ID: ${item.id}`,
          item.matched_play_id ? "SC作品一致あり" : "SC作品未照合",
        ];
        return parts.join(" / ");
      });

      const prompt = [
        "Stage Connect 俳優の人物調査用",
        "",
        "前提:",
        "- 以下は外部サイトから抽出した候補で、本人との接続・プロフィール各項目は未確認です。",
        "- 作品出典を起点に公式公演サイト・本人・事務所等を確認し、同じ出演者と結び付く根拠を残してください。",
        "- 同名、同じ読み、同じURL文字列だけで別のプロフィールを採用しないでください。出演者とスタッフも区別してください。",
        "- かな・ローマ字・生年月日・性別・経歴は推測しないでください。見つからない項目は未確認としてください。",
        "- 出演記録が確認できても、プロフィールや現在の所属を確認できたとは扱わないでください。",
        "- 調査で見つからなかったことを、人物の不在・引退・別人確定と解釈しないでください。",
        "- 主観的な評価、誇張、人気の断定は避けてください。",
        "- 公開プロフィールは基本情報と出演関係を中心にした最小限の表示です。一般的な紹介文や経歴の長文要約は作らないでください。",
        "- 元宝塚など、人物を理解するうえで重要な経歴は、本人との接点と根拠を確認できた場合だけ短い補足として提案してください。",
        "- 情報が少ない場合は出演記録だけで構いません。文章の長さを満たすために補完しないでください。",
        "",
        "出力してほしいもの:",
        "1. 出演者とプロフィールの接点: 確認済み / 未確認。確認済みなら根拠URL・確認日・接点を記載",
        "2. 項目別の調査結果: 読み、英語表記、生年月日、身長、血液型、性別。各項目に値・確認済み/未確認/不一致・根拠URL・確認日",
        "3. 同名候補・情報の不一致・取得できないページ・実行した検索を記録",
        "4. 特記する経歴があれば、根拠URL・確認日を付けて短い補足を任意提案。一般的なプロフィール文は不要",
        "",
        "抽出された基本情報候補（未確認）:",
        `名前: ${row.sourceActorName}`,
        `読み: ${row.sourceActorKana || "-"}`,
        `生年月日: ${row.sourceBirthdayRaw || row.sourceBirthday || "-"}`,
        `身長: ${row.sourceHeightCm ? `${row.sourceHeightCm}cm` : "-"}`,
        `血液型: ${row.sourceBloodType ? `${row.sourceBloodType}型` : "-"}`,
        `所属候補: ${row.sourceAffiliationRaw || "-"}`,
        `俳優個別ページ: ${row.sourceActorUrl || "なし。作品の配役行単位で人物確認が必要"}`,
        row.note ? `注記: ${row.note}` : "",
        row.sourceProfileFactsRaw ? `raw基本情報: ${row.sourceProfileFactsRaw}` : "",
        "",
        "出演作候補（最大120件。完全な出演歴ではありません）:",
        ...(appearanceLines.length > 0 ? appearanceLines : ["- 出演作候補なし"]),
      ].filter(Boolean);

      await navigator.clipboard.writeText(prompt.join("\n"));
      setMsg(`人物調査用コピーを作成しました: ${row.sourceActorName} / 出演候補 ${rows.length}件`);
    } catch (error: any) {
      setMsg(error?.message ?? "copy actor profile prompt error");
    } finally {
      setBusyId(null);
    }
  };

  const copyWorkForGemini = async (row: WorkQueueRow) => {
    setBusyId(`copy:${row.sourceWorkUrl || row.sourceWorkTitle}`);
    setMsg("");

    try {
      const rows = await loadWorkCandidateRows(row);
      const factsByUrl = await loadExternalActorFactsByUrl(rows.map((item) => item.source_actor_url));

      const lines = [
        "Stage Connect 外部候補チェック用",
        "",
        `作品名: ${row.sourceWorkTitle}`,
        `年: ${row.sourceYear || "-"}`,
        `外部URL: ${row.sourceWorkUrl || "-"}`,
        `Stage Connect既存作品: ${row.matchedPlayId ? "あり" : "未登録候補"}`,
        "",
        "目的:",
        "- 以下はキラハイ由来の出演フレーム候補です。本文や感想は取り込まず、俳優名・役名・年・URLだけを確認したいです。",
        "- 公式情報と照合して、表記ゆれ、同一人物、役名の揺れ、足りないキャスト、不要そうな候補を指摘してください。",
        "- Stage Connectに投入する前提で、客観的なファクトだけに絞ってください。",
        "",
        "候補一覧:",
        ...rows.map((item, index) => {
          const actor = factsByUrl.get(item.source_actor_url) ?? {};
          const facts = [
            actor.source_actor_kana ? `読み: ${actor.source_actor_kana}` : "",
            actor.source_birthday_raw || actor.source_birthday ? `生年月日: ${actor.source_birthday_raw || actor.source_birthday}` : "",
            actor.source_height_cm ? `身長: ${actor.source_height_cm}cm` : "",
            actor.source_blood_type ? `血液型: ${actor.source_blood_type}型` : "",
            actor.source_affiliation_raw ? `所属候補: ${actor.source_affiliation_raw}` : "",
            actor.note ? `注記: ${actor.note}` : "",
          ].filter(Boolean);

          return [
            `${index + 1}. ${item.source_actor_name} / 役名: ${item.source_role_raw || "-"} / 区分: ${item.source_cast_group || "-"} / 年: ${item.source_year || "-"}`,
            `   俳優URL: ${item.source_actor_url || "-"}`,
            `   作品URL: ${item.source_work_url || "-"}`,
            `   照合: actor=${item.matched_actor_id ? "matched" : "unmatched"} / play=${item.matched_play_id ? "matched" : "unmatched"} / status=${item.status}`,
            facts.length > 0 ? `   候補ファクト: ${facts.join(" / ")}` : "",
          ]
            .filter(Boolean)
            .join("\n");
        }),
      ];

      const text = lines.join("\n");
      await navigator.clipboard.writeText(text);
      setMsg(`Gemini用コピーを作成しました: ${row.sourceWorkTitle} / ${rows.length}件`);
    } catch (error: any) {
      setMsg(error?.message ?? "copy work prompt error");
    } finally {
      setBusyId(null);
    }
  };

  const acceptCandidate = async (row: CandidateRow) => {
    if (!row.matched_actor_id || !row.matched_play_id) {
      setMsg("既存actorと既存playの両方に一致している候補だけ採用できます");
      return false;
    }

    const roleName = getCandidateRoleName(row);
    const roleWasEdited = Object.prototype.hasOwnProperty.call(roleEdits, row.id);

    setBusyId(row.id);
    setMsg("");
    try {
      const result = await acceptCandidateWithHistory(supabase, row, roleName);
      setCandidates((current) => current.map((item) => item.id === row.id
        ? { ...item, status: "accepted", accepted_cast_id: result.accepted_cast_id } : item));
      setSelectedIds((current) => ({ ...current, [row.id]: false }));
      if (roleWasEdited) resetCandidateRoleEdit(row);
      await loadImportLogs();
      setMsg(result.already_accepted ? "採用済みの配役を確認しました"
        : result.history_saved ? "配役・採用状態・履歴を保存しました"
        : "配役と採用状態は保存しましたが、履歴の保存に失敗しました。登録内容を確認してください。");
      return result.history_saved !== false;
    } catch (error: any) {
      setMsg(error?.message ?? "accept error");
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const buildUniquePlaySlug = async (row: CandidateRow, titleOverride?: string | null) => {
    const sourceSlug = toSlug(getSourceSlug(row.source_work_url));
    const titleSlug = toSlug(titleOverride || row.source_work_title);
    const base = sourceSlug || titleSlug || `external-play-${row.source_year || "unknown"}`;
    const normalizedBase = base.replace(/^-+|-+$/g, "") || `external-play-${Date.now()}`;

    for (let i = 0; i < 20; i += 1) {
      const candidate =
        i === 0
          ? normalizedBase
          : row.source_year
            ? `${normalizedBase}-${row.source_year}-${i + 1}`
            : `${normalizedBase}-${i + 1}`;
      const { data, error } = await supabase.from("plays").select("id").eq("slug", candidate).maybeSingle();
      if (error) throw error;
      if (!data) return candidate;
    }

    return `${normalizedBase}-${Date.now()}`;
  };

  const loadExternalPlayDetail = async (externalPlayId?: string | null): Promise<ExternalPlayDetailRow | null> => {
    if (!externalPlayId) return null;
    const { data, error } = await supabase
      .from("external_plays")
      .select("source_period_text,source_venue_text,source_schedule_raw,source_venue_raw")
      .eq("id", externalPlayId)
      .maybeSingle();

    if (error) {
      if (String(error.message ?? "").includes("source_period_text")) return null;
      throw error;
    }

    return data as ExternalPlayDetailRow | null;
  };

  const createSkeletonPlayFromCandidate = async (
    row: CandidateRow,
    options: { title?: string | null; acceptAfter?: boolean; closeMatchPanel?: boolean } = {}
  ) => {
    const title = normalizeText(options.title) || row.source_work_title;
    if (!title) {
      setMsg("作品タイトルが空です");
      return null;
    }
    if (options.acceptAfter && !row.matched_actor_id) {
      setMsg("既存actorに一致している候補だけ採用まで進められます");
      return null;
    }

    const slug = await buildUniquePlaySlug(row, title);
    const externalPlayDetail = await loadExternalPlayDetail(row.external_play_id);
    const payload = {
      title,
      slug,
      summary: null,
      period: normalizeText(externalPlayDetail?.source_period_text) || makeSkeletonPeriod(row.source_year),
      venue: normalizeText(externalPlayDetail?.source_venue_text) || null,
      genre: null,
      franchise_id: null,
      vod: {},
      credits: null,
    };

    const { data: created, error: createError } = await supabase
      .from("plays")
      .insert(payload)
      .select("id,title,slug")
      .single();

    if (createError) throw createError;

    const now = new Date().toISOString();

    if (row.external_play_id) {
      const { error: externalPlayError } = await supabase
        .from("external_plays")
        .update({
          matched_play_id: created.id,
          skeleton_play_id: created.id,
          match_status: "skeleton_created",
          match_confidence: 70,
          updated_at: now,
        })
        .eq("id", row.external_play_id);

      if (externalPlayError) throw externalPlayError;
    }

    let candidateUpdate = supabase
      .from("external_cast_candidates")
      .update({
        matched_play_id: created.id,
        updated_at: now,
      })
      .eq("source", "kira-hai");

    if (row.source_work_url) {
      candidateUpdate = candidateUpdate.eq("source_work_url", row.source_work_url);
    } else {
      candidateUpdate = candidateUpdate.eq("source_work_title", row.source_work_title);
    }

    const { error: candidateUpdateError } = await candidateUpdate;
    if (candidateUpdateError) throw candidateUpdateError;

    const createdPlay = created as PlayRow;
    setPlaysById((current) => ({ ...current, [createdPlay.id]: createdPlay }));
    setCandidates((current) =>
      current.map((item) =>
        (row.source_work_url && item.source_work_url === row.source_work_url) ||
        (!row.source_work_url && item.source_work_title === row.source_work_title)
          ? { ...item, matched_play_id: createdPlay.id, updated_at: now }
          : item
      )
    );

    await writeImportLog({
      action: options.acceptAfter ? "create_play_skeleton_and_accept" : "create_play_skeleton",
      targetType: "play",
      targetId: createdPlay.id,
      targetLabel: createdPlay.title,
      sourceUrl: row.source_work_url,
      details: {
        source_work_title: row.source_work_title,
        edited_title: title !== row.source_work_title ? title : null,
        source_year: row.source_year,
        source_period_text: externalPlayDetail?.source_period_text ?? null,
        source_venue_text: externalPlayDetail?.source_venue_text ?? null,
        accepted_after_create: Boolean(options.acceptAfter),
      },
    });

    if (options.acceptAfter) {
      await acceptCandidate({ ...row, matched_play_id: createdPlay.id, updated_at: now });
      setSelectedIds((current) => ({ ...current, [row.id]: false }));
    }

    if (options.closeMatchPanel) {
      setPlayMatchTarget(null);
      setPlaySearchResults([]);
      setPlayCreateTitle("");
    }

    return createdPlay;
  };

  const buildUniqueActorSlug = async (row: UnmatchedActorQueueRow) => {
    const kanaSlug = kanaToSlug(row.sourceActorKana);
    const sourceSlug = toSlug(getSourceSlug(row.sourceActorUrl));
    const nameSlug = toSlug(row.sourceActorName);
    const base = kanaSlug || sourceSlug || nameSlug || "external-actor";
    const normalizedBase = base.replace(/^-+|-+$/g, "") || `external-actor-${Date.now()}`;

    for (let i = 0; i < 20; i += 1) {
      const candidate = i === 0 ? normalizedBase : `${normalizedBase}-${i + 1}`;
      const { data, error } = await supabase.from("actors").select("id").eq("slug", candidate).maybeSingle();
      if (error) throw error;
      if (!data) return candidate;
    }

    return `${normalizedBase}-${Date.now()}`;
  };

  const createSkeletonActor = async (row: UnmatchedActorQueueRow) => {
    if (!row.sourceActorUrl) {
      setMsg("俳優ページのない候補です。人物情報を確認して俳優を作成し、この候補に紐付けてください。");
      return;
    }
    setBusyId(row.sourceActorUrl);
    setMsg("");

    try {
      const slug = await buildUniqueActorSlug(row);
      const birthday = normalizeText(row.sourceBirthday) || null;
      const heightCm = row.sourceHeightCm ? Number(row.sourceHeightCm) : null;
      const bloodType = normalizeText(row.sourceBloodType).toUpperCase() || null;

      const { data: created, error: createError } = await supabase
        .from("actors")
        .insert({
          name: row.sourceActorName,
          slug,
          kana: normalizeText(row.sourceActorKana) || null,
          birthday,
          birthday_label: birthday ? null : normalizeText(row.sourceBirthdayRaw) || null,
          death_date: null,
          profile: null,
          profile_en: null,
          height_cm: heightCm,
          blood_type: bloodType,
          gender: null,
          image_url: null,
          sns: {},
          featured_play_slugs: [],
        })
        .select("id,name,slug")
        .single();

      if (createError) throw createError;

      const actor = created as ActorRow;
      const now = new Date().toISOString();

      const { error: externalActorError } = await supabase
        .from("external_actors")
        .update({
          matched_actor_id: actor.id,
          match_status: "skeleton_created",
          match_confidence: 70,
          updated_at: now,
        })
        .eq("source", "kira-hai")
        .eq("source_actor_url", row.sourceActorUrl);

      if (externalActorError) throw externalActorError;

      const { error: candidateError } = await supabase
        .from("external_cast_candidates")
        .update({
          matched_actor_id: actor.id,
          confidence: 55,
          updated_at: now,
        })
        .eq("source", "kira-hai")
        .eq("source_actor_url", row.sourceActorUrl)
        .is("matched_actor_id", null);

      if (candidateError) throw candidateError;

      setActorsById((current) => ({ ...current, [actor.id]: actor }));
      setCandidates((current) =>
        current.map((item) =>
          item.source_actor_url === row.sourceActorUrl ? { ...item, matched_actor_id: actor.id, updated_at: now } : item
        )
      );
      setUnmatchedActorQueue((current) => current.filter((item) => item.sourceActorUrl !== row.sourceActorUrl));
      setActorStats((current) => ({ ...current, matched: current.matched + 1 }));
      await writeImportLog({
        action: "create_actor_skeleton",
        targetType: "actor",
        targetId: actor.id,
        targetLabel: actor.name,
        sourceUrl: row.sourceActorUrl,
        details: {
          source_actor_kana: row.sourceActorKana,
          source_birthday: row.sourceBirthday,
          source_birthday_raw: row.sourceBirthdayRaw,
          source_height_cm: row.sourceHeightCm,
          source_blood_type: row.sourceBloodType,
        },
      });
      setMsg(
        `俳優skeleton「${actor.name}」を作成しました。候補ファクト: ${
          [row.sourceBirthdayRaw || row.sourceBirthday, row.sourceHeightCm ? `${row.sourceHeightCm}cm` : "", row.sourceBloodType ? `${row.sourceBloodType}型` : ""]
            .filter(Boolean)
            .join(" / ") || "なし"
        }`
      );
    } catch (error: any) {
      setMsg(error?.message ?? "create skeleton actor error");
    } finally {
      setBusyId(null);
    }
  };

  const bulkCreateSkeletonActorsForWork = async (row: WorkQueueRow) => {
    setBulkBusy(true);
    setBusyId(`actors:${row.sourceWorkUrl || row.sourceWorkTitle}`);
    setMsg("");

    try {
      const actorRows = (await buildUnmatchedActorRowsForWork(row)).filter((actor) => actor.sourceActorUrl);

      if (actorRows.length === 0) {
        setMsg(`俳優ページ付きの作成対象はありません。ページのない候補は人物情報を確認して個別に紐付けてください: ${row.sourceWorkTitle}`);
        return;
      }

      const preview = actorRows.slice(0, 10).map((item) => item.sourceActorName).join(" / ");
      const ok = window.confirm(
        `「${row.sourceWorkTitle}」の未照合俳優 ${actorRows.length}人を作成します。\n\n${preview}${
          actorRows.length > 10 ? " / ..." : ""
        }\n\n続行しますか？`
      );
      if (!ok) return;

      for (const actorRow of actorRows) {
        await createSkeletonActor(actorRow);
      }

      await writeImportLog({
        action: "bulk_create_actor_skeletons_for_work",
        targetType: "work",
        targetLabel: row.sourceWorkTitle,
        sourceUrl: row.sourceWorkUrl,
        details: {
          actor_count: actorRows.length,
          actors: actorRows.map((actor) => actor.sourceActorName),
        },
      });
      setMsg(`未照合俳優skeletonを作成しました: ${row.sourceWorkTitle} / ${actorRows.length}人`);
      await loadWorkQueue();
    } catch (error: any) {
      setMsg(error?.message ?? "bulk create skeleton actors error");
    } finally {
      setBusyId(null);
      setBulkBusy(false);
    }
  };

  const previewSkeletonActorsForWork = async (row: WorkQueueRow) => {
    setBusyId(`preview:${getWorkKey(row)}`);
    setMsg("");

    try {
      const actorRows = await buildUnmatchedActorRowsForWork(row);
      setWorkActorPreview({
        key: getWorkKey(row),
        title: row.sourceWorkTitle,
        rows: actorRows,
      });
      setMsg(`作成対象の未照合俳優を表示しました: ${row.sourceWorkTitle} / ${actorRows.length}人`);
    } catch (error: any) {
      setMsg(error?.message ?? "preview skeleton actors error");
    } finally {
      setBusyId(null);
    }
  };

  const createSkeletonPlayAndAccept = async (row: CandidateRow) => {
    if (!row.matched_actor_id) {
      setMsg("既存actorに一致している候補だけ作品skeletonを作成できます");
      return;
    }

    if (row.matched_play_id) {
      await acceptCandidate(row);
      return;
    }

    setBusyId(row.id);
    setMsg("");
    try {
      const { data: latestCandidate, error: latestCandidateError } = await supabase
        .from("external_cast_candidates")
        .select("matched_play_id,updated_at")
        .eq("id", row.id)
        .maybeSingle();

      if (latestCandidateError) throw latestCandidateError;

      if (latestCandidate?.matched_play_id) {
        if (row.source_credit_key || row.source_cast_group) {
          setMsg("作品の照合先が更新されています。候補を再読み込みして確認してください。");
          return;
        }
        await acceptCandidate({ ...row, matched_play_id: latestCandidate.matched_play_id });
        return;
      }

      const slug = await buildUniquePlaySlug(row);
      const externalPlayDetail = await loadExternalPlayDetail(row.external_play_id);

      const similar = await findSimilarExistingPlays(row.source_work_title);
      if (similar.length > 0) {
        setPlayMatchTarget(row);
        setPlaySearchText(row.source_work_title);
        setPlayCreateTitle(row.source_work_title);
        setPlaySearchResults(similar);
        setMsg("似ている既存作品があります。重複作成を避けるため、既存作品へ紐づけるか確認してください。");
        return;
      }

      const payload = {
        title: row.source_work_title,
        slug,
        summary: null,
        period: normalizeText(externalPlayDetail?.source_period_text) || makeSkeletonPeriod(row.source_year),
        venue: normalizeText(externalPlayDetail?.source_venue_text) || null,
        genre: null,
        franchise_id: null,
        vod: {},
        credits: null,
      };

      const { data: created, error: createError } = await supabase
        .from("plays")
        .insert(payload)
        .select("id,title,slug")
        .single();

      if (createError) throw createError;

      const now = new Date().toISOString();

      if (row.external_play_id) {
        const { error: externalPlayError } = await supabase
          .from("external_plays")
          .update({
            matched_play_id: created.id,
            skeleton_play_id: created.id,
            match_status: "skeleton_created",
            match_confidence: 70,
            updated_at: now,
          })
          .eq("id", row.external_play_id);

        if (externalPlayError) throw externalPlayError;
      }

      let candidateUpdate = supabase
        .from("external_cast_candidates")
        .update({
          matched_play_id: created.id,
          updated_at: now,
        })
        .eq("source", "kira-hai");

      if (row.source_work_url) {
        candidateUpdate = candidateUpdate.eq("source_work_url", row.source_work_url);
      } else {
        candidateUpdate = candidateUpdate.eq("source_work_title", row.source_work_title);
      }

      const { error: candidateUpdateError } = await candidateUpdate;
      if (candidateUpdateError) throw candidateUpdateError;

      const createdPlay = created as PlayRow;
      setPlaysById((current) => ({ ...current, [createdPlay.id]: createdPlay }));
      setCandidates((current) =>
        current.map((item) =>
          (row.source_work_url && item.source_work_url === row.source_work_url) ||
          (!row.source_work_url && item.source_work_title === row.source_work_title)
            ? { ...item, matched_play_id: createdPlay.id, updated_at: now }
            : item
        )
      );

      await acceptCandidate({ ...row, matched_play_id: createdPlay.id, updated_at: now });
      setSelectedIds((current) => ({ ...current, [row.id]: false }));
      setMsg(`作品skeleton「${createdPlay.title}」を作成して採用しました`);
    } catch (error: any) {
      setMsg(error?.message ?? "create skeleton play error");
    } finally {
      setBusyId(null);
    }
  };

  const createEditedSkeletonFromPlayMatch = async () => {
    if (!playMatchTarget) return;
    const title = normalizeText(playCreateTitle);
    if (!title) {
      setMsg("作成する作品タイトルを入力してください");
      return;
    }

    const ok = window.confirm(
      `類似作品を無視して、新規作品skeletonを作成します。\n\n外部候補: ${playMatchTarget.source_work_title}\n作成タイトル: ${title}\n\n続行しますか？`
    );
    if (!ok) return;

    setBusyId(playMatchTarget.id);
    setMsg("");
    try {
      const createdPlay = await createSkeletonPlayFromCandidate(playMatchTarget, {
        title,
        acceptAfter: Boolean(playMatchTarget.matched_actor_id),
        closeMatchPanel: true,
      });
      if (createdPlay) {
        setMsg(
          playMatchTarget.matched_actor_id
            ? `作品skeleton「${createdPlay.title}」を作成して採用しました`
            : `作品skeleton「${createdPlay.title}」を作成しました`
        );
      }
    } catch (error: any) {
      setMsg(error?.message ?? "create edited skeleton play error");
    } finally {
      setBusyId(null);
    }
  };

  const createSkeletonPlayForWork = async (row: WorkQueueRow) => {
    if (row.matchedPlayId) {
      setMsg(`既に既存作品に紐づいています: ${row.sourceWorkTitle}`);
      return;
    }

    setBusyId(`play:${row.sourceWorkUrl || row.sourceWorkTitle}`);
    setMsg("");

    try {
      const rows = await loadWorkCandidateRows(row);
      const seed = rows[0];

      if (!seed) {
        setMsg(`作品候補が見つかりません: ${row.sourceWorkTitle}`);
        return;
      }

      const similar = await findSimilarExistingPlays(row.sourceWorkTitle);
      if (similar.length > 0) {
        setPlayMatchTarget(seed);
        setPlaySearchText(row.sourceWorkTitle);
        setPlayCreateTitle(row.sourceWorkTitle);
        setPlaySearchResults(similar);
        setMsg("似ている既存作品があります。重複作成を避けるため、既存作品へ紐づけるか確認してください。");
        return;
      }

      const ok = window.confirm(
        `作品skeletonを作成します。\n\n作品名: ${row.sourceWorkTitle}\n年: ${row.sourceYear || seed.source_year || "-"}\n出演候補: ${
          row.candidateCount
        }件\n\n続行しますか？`
      );
      if (!ok) return;

      const slug = await buildUniquePlaySlug(seed);
      const externalPlayDetail = await loadExternalPlayDetail(seed.external_play_id);
      const payload = {
        title: row.sourceWorkTitle,
        slug,
        summary: null,
        period:
          normalizeText(externalPlayDetail?.source_period_text) || makeSkeletonPeriod(row.sourceYear || seed.source_year),
        venue: normalizeText(externalPlayDetail?.source_venue_text) || null,
        genre: null,
        franchise_id: null,
        vod: {},
        credits: null,
      };

      const { data: created, error: createError } = await supabase
        .from("plays")
        .insert(payload)
        .select("id,title,slug")
        .single();

      if (createError) throw createError;

      const now = new Date().toISOString();

      if (seed.external_play_id) {
        const { error: externalPlayError } = await supabase
          .from("external_plays")
          .update({
            matched_play_id: created.id,
            skeleton_play_id: created.id,
            match_status: "skeleton_created",
            match_confidence: 70,
            updated_at: now,
          })
          .eq("id", seed.external_play_id);

        if (externalPlayError) throw externalPlayError;
      }

      let candidateUpdate = supabase
        .from("external_cast_candidates")
        .update({
          matched_play_id: created.id,
          updated_at: now,
        })
        .eq("source", "kira-hai");

      if (row.sourceWorkUrl) {
        candidateUpdate = candidateUpdate.eq("source_work_url", row.sourceWorkUrl);
      } else {
        candidateUpdate = candidateUpdate.eq("source_work_title", row.sourceWorkTitle);
      }

      const { error: candidateUpdateError } = await candidateUpdate;
      if (candidateUpdateError) throw candidateUpdateError;

      const createdPlay = created as PlayRow;
      setPlaysById((current) => ({ ...current, [createdPlay.id]: createdPlay }));
      setWorkQueue((current) =>
        current.map((item) =>
          item.sourceWorkTitle === row.sourceWorkTitle && item.sourceWorkUrl === row.sourceWorkUrl
            ? { ...item, matchedPlayId: createdPlay.id }
            : item
        )
      );
      setCandidates((current) =>
        current.map((item) =>
          (row.sourceWorkUrl && item.source_work_url === row.sourceWorkUrl) ||
          (!row.sourceWorkUrl && item.source_work_title === row.sourceWorkTitle)
            ? { ...item, matched_play_id: createdPlay.id, updated_at: now }
            : item
        )
      );
      await writeImportLog({
        action: "create_play_skeleton_for_work",
        targetType: "play",
        targetId: createdPlay.id,
        targetLabel: createdPlay.title,
        sourceUrl: row.sourceWorkUrl,
        details: {
          source_work_title: row.sourceWorkTitle,
          source_year: row.sourceYear || seed.source_year,
          candidate_count: row.candidateCount,
        },
      });
      setMsg(`作品skeleton「${createdPlay.title}」を作成しました。次に「この作品の候補を見る」から出演線を採用できます。`);
    } catch (error: any) {
      setMsg(error?.message ?? "create skeleton play for work error");
    } finally {
      setBusyId(null);
    }
  };

  const bulkAcceptReady = async () => {
    if (readySelectedRows.length === 0) {
      setMsg("一括採用できる候補が選択されていません");
      return;
    }

    if (!window.confirm(`選択中の候補 ${readySelectedRows.length}件をcastsへ採用します。続行しますか？`)) {
      return;
    }

    setBulkBusy(true);
    setMsg(`一括採用を開始します: ${readySelectedRows.length}件`);
    try {
      let completed = 0;
      for (const row of readySelectedRows) {
        if (!(await acceptCandidate(row))) {
          setMsg((message) => `一括採用を停止しました。完了 ${completed}/${readySelectedRows.length}件。${message}`);
          return;
        }
        completed += 1;
      }
      setMsg(`一括採用が完了しました: ${readySelectedRows.length}件`);
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkCreateSkeleton = async () => {
    if (skeletonSelectedRows.length === 0) {
      setMsg("作品skeleton化できる候補が選択されていません");
      return;
    }

    if (!window.confirm(`選択中の候補 ${skeletonSelectedRows.length}件について作品skeleton作成を試みます。続行しますか？`)) {
      return;
    }

    setBulkBusy(true);
    setMsg(`作品skeleton作成を開始します: ${skeletonSelectedRows.length}件`);
    try {
      for (const row of skeletonSelectedRows) {
        await createSkeletonPlayAndAccept(row);
      }
      setMsg(`作品skeleton作成が完了しました: ${skeletonSelectedRows.length}件`);
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-white">キラハイ取り込み候補</h1>
            <p className="mt-1 text-xs text-slate-400">
              本文は取らず、俳優・作品・出演・役名の空箱候補だけを確認します。
            </p>
          </div>

          <button
            onClick={() => void load()}
            disabled={loading}
            className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15 disabled:opacity-40"
          >
            再読み込み
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs text-slate-500">外部俳優候補</div>
            <div className="mt-1 text-2xl font-extrabold text-white">{stats.actorTotal}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs text-slate-500">既存俳優と一致</div>
            <div className="mt-1 text-2xl font-extrabold text-white">{stats.actorMatched}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs text-slate-500">すぐ採用可能</div>
            <div className="mt-1 text-2xl font-extrabold text-white">{stats.canAccept}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs text-slate-500">作品skeleton候補</div>
            <div className="mt-1 text-2xl font-extrabold text-white">{stats.canSkeleton}</div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[220px_220px_1fr]">
          <select
            className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">すべて</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
            value={queue}
            onChange={(event) => setQueue(event.target.value)}
          >
            {queueOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="俳優名 / 作品名 / 役名で絞り込み"
          />
        </div>

        {msg ? <div className="mt-4 text-sm text-slate-300">{msg}</div> : null}

        {importLogs.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Recent import logs</div>
              <div className="text-[11px] text-slate-500">latest {importLogs.length}</div>
            </div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {importLogs.map((log) => (
                <div key={log.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[11px] font-bold text-slate-200">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.created_at).toLocaleString("ja-JP")}
                    </span>
                  </div>
                  <div className="mt-2 truncate text-xs font-bold text-white">
                    {log.target_label || log.target_type || "-"}
                  </div>
                  {log.source_url ? (
                    <a
                      href={log.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block truncate text-[11px] text-slate-500 hover:text-slate-300"
                    >
                      {log.source_url}
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleAllSelectableVisible}
            disabled={selectableVisibleRows.length === 0 || loading || bulkBusy}
            className="rounded-full border border-white/10 bg-black/30 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 disabled:opacity-40"
          >
            {allSelectableVisibleSelected ? "表示中の選択を解除" : "表示中の採用対象を選択"}
          </button>
          <button
            type="button"
            onClick={clearSelection}
            disabled={selectedRows.length === 0 || bulkBusy}
            className="rounded-full border border-white/10 bg-black/30 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 disabled:opacity-40"
          >
            選択クリア
          </button>
          <div className="text-xs text-slate-400">
            選択 {selectedRows.length}件 / すぐ採用 {readySelectedRows.length}件 / 作品作成 {skeletonSelectedRows.length}件
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void bulkAcceptReady()}
              disabled={readySelectedRows.length === 0 || bulkBusy}
              className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-35"
            >
              選択を一括採用
            </button>
            <button
              type="button"
              onClick={() => void bulkCreateSkeleton()}
              disabled={skeletonSelectedRows.length === 0 || bulkBusy}
              className="rounded-full border border-sky-500/30 bg-sky-500/15 px-3 py-2 text-xs font-bold text-sky-100 hover:bg-sky-500/20 disabled:opacity-35"
            >
              選択を作品作成して採用
            </button>
          </div>
        </div>
      </div>

      {queue === "work_queue" ? (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 px-6 py-3 text-xs text-slate-400">
            作品別キュー {visibleWorkQueue.length}件表示 / 未登録作品から優先表示
          </div>

          <div className="divide-y divide-white/5">
            {visibleWorkQueue.map((row) => {
              const acceptedPercent = row.candidateCount > 0 ? Math.round((row.acceptedCount / row.candidateCount) * 100) : 0;
              const actorMatchedPercent =
                row.candidateCount > 0 ? Math.round((row.matchedActorCount / row.candidateCount) * 100) : 0;
              const workKey = getWorkKey(row);
              const previewOpen = workActorPreview?.key === workKey;

              return (
              <div key={`${row.sourceWorkUrl || ""}-${row.sourceWorkTitle}`} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-lg font-extrabold text-white">{row.sourceWorkTitle}</div>
                      {row.sourceYear ? (
                        <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-slate-400">
                          {row.sourceYear}
                        </span>
                      ) : null}
                      {row.matchedPlayId ? (
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-100">
                          既存作品あり
                        </span>
                      ) : (
                        <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-1 text-[11px] text-sky-100">
                          未登録作品候補
                        </span>
                      )}
                      {row.sourceWorkUrl ? (
                        <a
                          href={row.sourceWorkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300 hover:bg-white/10"
                        >
                          作品元
                        </a>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-slate-300">
                        出演候補 {row.candidateCount}件
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-slate-300">
                        俳優一致 {row.matchedActorCount}件
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-slate-300">
                        採用済み {row.acceptedCount}件 / {acceptedPercent}%
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-slate-400">
                        俳優一致率 {actorMatchedPercent}%
                      </span>
                    </div>

                    <div className="mt-3 max-w-xl">
                      <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                        <span>採用進捗</span>
                        <span>{row.acceptedCount}/{row.candidateCount}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-black/40 ring-1 ring-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-400"
                          style={{ width: `${acceptedPercent}%` }}
                        />
                      </div>
                    </div>

                    {row.actorSamples.length > 0 ? (
                      <div className="mt-3 text-xs text-slate-400">
                        俳優候補: {row.actorSamples.join(" / ")}
                      </div>
                    ) : null}
                    {row.roleSamples.length > 0 ? (
                      <div className="mt-1 text-xs text-slate-500">
                        役柄候補: {row.roleSamples.join(" / ")}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void copyWorkForGemini(row)}
                      disabled={busyId === `copy:${workKey}`}
                      className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/15 px-3 py-2 text-xs font-bold text-fuchsia-100 hover:bg-fuchsia-500/20 disabled:opacity-40"
                    >
                      1. Gemini用コピー
                    </button>
                    <button
                      type="button"
                      onClick={() => void createSkeletonPlayForWork(row)}
                      disabled={Boolean(row.matchedPlayId) || busyId === `play:${workKey}`}
                      className="rounded-full border border-sky-500/30 bg-sky-500/15 px-3 py-2 text-xs font-bold text-sky-100 hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      2. 作品を空箱化
                    </button>
                    <button
                      type="button"
                      onClick={() => void bulkCreateSkeletonActorsForWork(row)}
                      disabled={bulkBusy || busyId === `actors:${workKey}`}
                      className="rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-2 text-xs font-bold text-amber-100 hover:bg-amber-500/20 disabled:opacity-40"
                    >
                      3. 未登録俳優を空箱化
                    </button>
                    <button
                      type="button"
                      onClick={() => void previewSkeletonActorsForWork(row)}
                      disabled={busyId === `preview:${workKey}`}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 disabled:opacity-40"
                    >
                      作成対象を見る
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQueue(row.matchedPlayId ? "ready" : "skeleton");
                        setQ(row.sourceWorkTitle);
                      }}
                      className="rounded-full border border-sky-500/30 bg-sky-500/15 px-3 py-2 text-xs font-bold text-sky-100 hover:bg-sky-500/20"
                    >
                      4. 候補を見る
                    </button>
                  </div>
                </div>

                {previewOpen ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-bold text-slate-300">
                        未照合俳優 {workActorPreview.rows.length}人（個別ページなしの候補は人物確認が必要）
                      </div>
                      <button
                        type="button"
                        onClick={() => setWorkActorPreview(null)}
                        className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300 hover:bg-white/10"
                      >
                        閉じる
                      </button>
                    </div>

                    {workActorPreview.rows.length > 0 ? (
                      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                        {workActorPreview.rows.map((actor) => (
                          <div key={actorQueueKey(actor)} className="rounded-xl border border-white/10 bg-black/30 p-3">
                            <div className="font-bold text-white">{actor.sourceActorName}</div>
                            <div className="mt-1 text-xs text-slate-400">{actor.sourceActorKana || "読み未取得"}</div>
                            {!actor.sourceActorUrl ? <div className="mt-1 text-xs text-amber-200">俳優個別ページなし・一括作成の対象外</div> : null}
                            <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-slate-400">
                              {actor.sourceBirthdayRaw || actor.sourceBirthday ? (
                                <span className="rounded-full bg-white/5 px-2 py-1">
                                  {actor.sourceBirthdayRaw || actor.sourceBirthday}
                                </span>
                              ) : null}
                              {actor.sourceHeightCm ? (
                                <span className="rounded-full bg-white/5 px-2 py-1">{actor.sourceHeightCm}cm</span>
                              ) : null}
                              {actor.sourceBloodType ? (
                                <span className="rounded-full bg-white/5 px-2 py-1">{actor.sourceBloodType}型</span>
                              ) : null}
                              <span className="rounded-full bg-white/5 px-2 py-1">候補 {actor.candidateCount}件</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 text-sm text-slate-500">この作品に作成対象の未照合俳優はありません。</div>
                    )}
                  </div>
                ) : null}
              </div>
              );
            })}

            {!loading && visibleWorkQueue.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-500">
                作品別キューは空です。
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {actorMatchTarget ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-white">既存俳優に手動マッチ</h2>
              <p className="mt-1 text-sm text-amber-100">
                外部候補: <b>{actorMatchTarget.source_actor_name}</b>
              </p>
              <p className="mt-1 text-xs text-slate-400">
                旧芸名・プロフィール本文内の表記ゆれも検索対象にしています。
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setActorMatchTarget(null);
                setActorSearchResults([]);
              }}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10"
            >
              閉じる
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
              value={actorSearchText}
              onChange={(event) => setActorSearchText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void searchActors();
              }}
              placeholder="俳優名 / かな / slug / プロフィール文で検索"
            />
            <button
              type="button"
              onClick={() => void searchActors()}
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/15"
            >
              検索
            </button>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {actorSearchResults.map((actor) => (
              <button
                key={actor.id}
                type="button"
                onClick={() => void applyActorMatch(actor)}
                disabled={busyId === actorMatchTarget.id}
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-left hover:bg-black/40 disabled:opacity-40"
              >
                <div className="font-bold text-white">{actor.name}</div>
                <div className="mt-1 text-xs text-slate-500">{actor.slug}</div>
              </button>
            ))}
          </div>

          {actorSearchResults.length === 0 ? (
            <div className="mt-4 text-sm text-slate-500">検索候補がまだありません。</div>
          ) : null}
        </div>
      ) : null}

      {playMatchTarget ? (
        <div ref={playMatchPanelRef} className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-white">既存作品に紐づけ</h2>
              <p className="mt-1 text-sm text-sky-100">
                外部候補: <b>{playMatchTarget.source_work_title}</b>
              </p>
              <p className="mt-1 text-xs text-slate-400">
                スペース・記号・表記ゆれで重複作品を作らないため、似ている既存作品を確認します。
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPlayMatchTarget(null);
                setPlaySearchResults([]);
                setPlayCreateTitle("");
              }}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10"
            >
              閉じる
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
              value={playSearchText}
              onChange={(event) => setPlaySearchText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void searchPlays();
              }}
              placeholder="作品名 / slug で検索"
            />
            <button
              type="button"
              onClick={() => void searchPlays()}
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/15"
            >
              検索
            </button>
          </div>

          <div className="mt-4 grid gap-2">
            {playSearchResults.map((play) => (
              <button
                key={play.id}
                type="button"
                onClick={() => void applyPlayMatch(play)}
                disabled={busyId === playMatchTarget.id}
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-left hover:bg-black/40 disabled:opacity-40"
              >
                <div className="font-bold text-white">{play.title}</div>
                <div className="mt-1 text-xs text-slate-500">{play.slug}</div>
              </button>
            ))}
          </div>

          {playSearchResults.length === 0 ? (
            <div className="mt-4 text-sm text-slate-500">似ている既存作品が見つかりません。</div>
          ) : null}

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="text-sm font-bold text-white">類似を無視して新規作品を作る</div>
            <p className="mt-1 text-xs text-slate-400">
              公式タイトルと外部候補が微妙に違う場合は、ここでタイトルを直してから作品skeletonを作成できます。
            </p>
            <div className="mt-3 flex flex-col gap-2 md:flex-row">
              <input
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
                value={playCreateTitle}
                onChange={(event) => setPlayCreateTitle(event.target.value)}
                placeholder="作成する作品タイトル"
              />
              <button
                type="button"
                onClick={() => void createEditedSkeletonFromPlayMatch()}
                disabled={busyId === playMatchTarget.id || !normalizeText(playCreateTitle)}
                className="rounded-xl border border-rose-500/30 bg-rose-500/15 px-4 py-3 text-sm font-bold text-rose-50 hover:bg-rose-500/20 disabled:opacity-40"
              >
                このタイトルで作成{playMatchTarget.matched_actor_id ? "して採用" : ""}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {queue === "actor_queue" ? (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 px-6 py-3 text-xs text-slate-400">
            未照合俳優キュー {unmatchedActorQueue.length}件表示
          </div>

          <div className="divide-y divide-white/5">
            {unmatchedActorQueue.map((row) => (
              <div key={actorQueueKey(row)} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-lg font-extrabold text-white">{row.sourceActorName}</div>
                      {row.sourceActorKana ? (
                        <span className="text-sm text-slate-400">{row.sourceActorKana}</span>
                      ) : null}
                      {row.sourceActorUrl ? (
                        <a
                          href={row.sourceActorUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300 hover:bg-white/10"
                        >
                          俳優元
                        </a>
                      ) : null}
                    </div>

                    {row.aliasFrom || row.aliasTo || row.note ? (
                      <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                        {row.note || `${row.aliasFrom || "-"} → ${row.aliasTo || "-"}`}
                      </div>
                    ) : null}

                    {row.sourceProfileFactsRaw ? (
                      <div className="mt-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs text-slate-300">
                        {row.sourceProfileFactsRaw}
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {row.sourceBirthdayRaw || row.sourceBirthday ? (
                        <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-slate-300">
                          生年月日 {row.sourceBirthdayRaw || row.sourceBirthday}
                        </span>
                      ) : null}
                      {row.sourceHeightCm ? (
                        <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-slate-300">
                          {row.sourceHeightCm}cm
                        </span>
                      ) : null}
                      {row.sourceBloodType ? (
                        <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-slate-300">
                          {row.sourceBloodType}型
                        </span>
                      ) : null}
                      {row.sourceAffiliationRaw ? (
                        <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-slate-300">
                          {row.sourceAffiliationRaw}
                        </span>
                      ) : null}
                      <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-slate-300">
                        出演候補 {row.candidateCount}件
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-slate-300">
                        既存作品ヒット {row.matchedPlayCount}件
                      </span>
                      {row.latestYear ? (
                        <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-slate-400">
                          最新 {row.latestYear}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void copyActorProfileForGemini(row)}
                      disabled={busyId === `profile:${actorQueueKey(row)}`}
                      className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/15 px-3 py-2 text-xs font-bold text-fuchsia-100 hover:bg-fuchsia-500/20 disabled:opacity-40"
                    >
                      人物調査用コピー
                    </button>
                    <button
                      type="button"
                      onClick={() => void openActorMatch(row)}
                      className="rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-2 text-xs font-bold text-amber-100 hover:bg-amber-500/20"
                    >
                      既存俳優にマッチ
                    </button>
                    <button
                      type="button"
                      onClick={() => void createSkeletonActor(row)}
                      disabled={!row.sourceActorUrl || busyId === row.sourceActorUrl}
                      className="rounded-full border border-sky-500/30 bg-sky-500/15 px-3 py-2 text-xs font-bold text-sky-100 hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      俳優skeleton作成
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {!loading && unmatchedActorQueue.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-500">
                未照合俳優キューは空です。
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {queue !== "actor_queue" && queue !== "work_queue" ? (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="border-b border-white/10 px-6 py-3 text-xs text-slate-400">
          {loading ? "Loading..." : `${visibleCandidates.length} 件表示 / 最大 ${PAGE_SIZE} 件`}
        </div>

        <div className="divide-y divide-white/5">
          {visibleCandidates.map((row) => {
            const actor = row.matched_actor_id ? actorsById[row.matched_actor_id] : null;
            const play = row.matched_play_id ? playsById[row.matched_play_id] : null;
            const canAccept = Boolean(actor && play && row.status === "pending" && !row.accepted_cast_id);
            const canCreateSkeleton = Boolean(actor && !play && row.status !== "accepted");
            const canSelect = Boolean(actor && row.status !== "accepted");

            return (
              <div key={row.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <label
                        className={`flex items-center gap-2 rounded-full border px-2 py-1 ${
                          canSelect
                            ? "border-white/10 bg-black/30 text-slate-300"
                            : "border-white/5 bg-black/10 text-slate-600"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 accent-white"
                          checked={Boolean(selectedIds[row.id])}
                          disabled={!canSelect || bulkBusy}
                          onChange={() => toggleSelected(row.id)}
                        />
                        選択
                      </label>
                      <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-slate-300">
                        {statusLabels[row.status] ?? row.status}
                      </span>
                      {row.source_year ? (
                        <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-slate-400">
                          {row.source_year}
                        </span>
                      ) : null}
                      <span className="text-slate-500">confidence {row.confidence ?? 0}</span>
                    </div>

                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                        <div className="text-xs text-slate-500">外部候補</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white">{row.source_actor_name}</span>
                          {row.source_actor_url ? (
                            <a
                              href={row.source_actor_url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300 hover:bg-white/10"
                            >
                              俳優元
                            </a>
                          ) : null}
                          {!row.source_actor_url ? <span className="text-xs text-slate-500">俳優個別ページなし</span> : null}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                          <span>{row.source_work_title}</span>
                          {row.source_work_url ? (
                            <a
                              href={row.source_work_url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300 hover:bg-white/10"
                            >
                              作品元
                            </a>
                          ) : null}
                        </div>
                        <div className="mt-2 text-sm text-slate-400">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span>採用時の役名</span>
                            {Object.prototype.hasOwnProperty.call(roleEdits, row.id) ? (
                              <button
                                type="button"
                                onClick={() => resetCandidateRoleEdit(row)}
                                className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300 hover:bg-white/10"
                              >
                                元に戻す
                              </button>
                            ) : null}
                          </div>
                          <input
                            className="w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
                            value={Object.prototype.hasOwnProperty.call(roleEdits, row.id) ? roleEdits[row.id] : row.source_role_raw || ""}
                            onChange={(event) => setCandidateRoleEdit(row, event.target.value)}
                            placeholder="役名なしで採用する場合は空欄"
                          />
                          {row.source_role_raw ? (
                            <div className="mt-1 text-[11px] text-slate-500">元候補: {row.source_role_raw}</div>
                          ) : null}
                          {row.source_cast_group ? <div className="mt-2 text-sm text-slate-300">出演区分: {row.source_cast_group}</div> : null}
                          {row.source_order ? <div className="mt-1 text-[11px] text-slate-500">出典での順番: {row.source_order}（掲載順は未確定）</div> : null}
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                        <div className="text-xs text-slate-500">Stage Connect照合</div>
                        <div className="mt-2 text-sm text-slate-300">
                          俳優:{" "}
                          {actor ? (
                            <Link className="font-bold text-white hover:underline" to={`/admin/actors/${encodeURIComponent(actor.slug)}`}>
                              {actor.name}
                            </Link>
                          ) : (
                            <span className="text-slate-500">未照合</span>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-slate-300">
                          作品:{" "}
                          {play ? (
                            <Link className="font-bold text-white hover:underline" to={`/admin/plays/${encodeURIComponent(play.slug)}`}>
                              {play.title}
                            </Link>
                          ) : (
                            <span className="text-slate-500">未照合</span>
                          )}
                        </div>
                        {play && row.status !== "accepted" ? (
                          <div className="mt-3 rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
                            <div>作品の紐づけを変更できます。誤クリック時は解除してから再検索できます。</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => void openPlayMatch(row)}
                                disabled={busyId === row.id}
                                className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1.5 text-[11px] font-bold text-sky-50 hover:bg-sky-300/15 disabled:opacity-40"
                              >
                                作品を変更
                              </button>
                              <button
                                type="button"
                                onClick={() => void clearPlayMatch(row)}
                                disabled={busyId === row.id}
                                className="rounded-full border border-red-300/20 bg-red-300/10 px-3 py-1.5 text-[11px] font-bold text-red-50 hover:bg-red-300/15 disabled:opacity-40"
                              >
                                紐づけ解除
                              </button>
                            </div>
                          </div>
                        ) : null}
                        {!play && actor ? (
                          <div className="mt-3 rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
                            <div>既存俳優に一致済み。必要なら既存作品に紐づけるか、作品skeletonを作って出演線まで接続できます。</div>
                            <button
                              type="button"
                              onClick={() => void openPlayMatch(row)}
                              className="mt-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1.5 text-[11px] font-bold text-sky-50 hover:bg-sky-300/15"
                            >
                              既存作品を探す
                            </button>
                          </div>
                        ) : null}
                        {!actor ? (
                          <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                            <div>俳優未照合。まず既存俳優への一致確認、または俳優skeleton化の対象です。</div>
                            <button
                              type="button"
                              onClick={() => void openActorMatch(row)}
                              className="mt-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[11px] font-bold text-amber-50 hover:bg-amber-300/15"
                            >
                              既存俳優にマッチ
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void acceptCandidate(row)}
                      disabled={!canAccept || busyId === row.id}
                      className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-100 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      採用
                    </button>
                    <button
                      type="button"
                      onClick={() => void createSkeletonPlayAndAccept(row)}
                      disabled={!canCreateSkeleton || busyId === row.id}
                      className="rounded-full border border-sky-500/30 bg-sky-500/15 px-3 py-2 text-xs font-bold text-sky-100 hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      作品作成して採用
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateStatus(row, "needs_review")}
                      disabled={busyId === row.id}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 disabled:opacity-40"
                    >
                      保留
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateStatus(row, "rejected")}
                      disabled={busyId === row.id}
                      className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-100 hover:bg-red-500/15 disabled:opacity-40"
                    >
                      無視
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {!loading && visibleCandidates.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              まだ候補がありません。SQL適用後、取り込みスクリプトで external_* に候補を入れるとここに表示されます。
            </div>
          ) : null}
        </div>
      </div>
      ) : null}
    </div>
  );
};

export default AdminExternalKiraHai;
