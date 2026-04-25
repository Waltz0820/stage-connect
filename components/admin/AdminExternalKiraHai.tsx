// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "../../next-app/lib/admin-router-shim";
import { supabase } from "../../next-app/lib/admin-supabase";
import { toSlug } from "./widgets/utils";

type CandidateRow = {
  id: string;
  source: string;
  source_actor_name: string;
  source_actor_url: string;
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

const makeSkeletonPeriod = (year?: number | null) => (year ? `${year}年` : null);

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
  const [playMatchTarget, setPlayMatchTarget] = useState<CandidateRow | null>(null);
  const [playSearchText, setPlaySearchText] = useState("");
  const [playSearchResults, setPlaySearchResults] = useState<PlayRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
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

  const load = async () => {
    setLoading(true);
    setMsg("");
    try {
      const candidateQuery = supabase
        .from("external_cast_candidates")
        .select(
          "id,source,source_actor_name,source_actor_url,external_play_id,source_work_title,source_work_url,source_year,source_role_raw,source_role_names,matched_actor_id,matched_play_id,accepted_cast_id,confidence,status,note,scraped_at"
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
    const canAccept = candidates.filter((row) => row.matched_actor_id && row.matched_play_id && row.status !== "accepted").length;
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
        actor?.name,
        play?.title,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(s));
    });
  }, [actorsById, candidates, playsById, q]);

  const selectedRows = useMemo(
    () => visibleCandidates.filter((row) => selectedIds[row.id]),
    [selectedIds, visibleCandidates]
  );

  const readySelectedRows = useMemo(
    () => selectedRows.filter((row) => row.matched_actor_id && row.matched_play_id && row.status !== "accepted"),
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

  const updateStatus = async (row: CandidateRow, nextStatus: string) => {
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

      const { error } = await supabase.from("external_cast_candidates").update(patch).eq("id", row.id);
      if (error) throw error;

      setCandidates((current) => current.map((item) => (item.id === row.id ? { ...item, status: nextStatus } : item)));
      if (nextStatus === "accepted" || nextStatus === "rejected") {
        setSelectedIds((current) => ({ ...current, [row.id]: false }));
      }
    } catch (error: any) {
      setMsg(error?.message ?? "status update error");
    } finally {
      setBusyId(null);
    }
  };

  const openActorMatch = async (row: CandidateRow) => {
    setActorMatchTarget(row);
    setActorSearchText(row.source_actor_name ?? "");
    setActorSearchResults([]);
    setMsg("");
    await searchActors(row.source_actor_name ?? "");
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

      const { error: externalActorError } = await supabase
        .from("external_actors")
        .update({
          matched_actor_id: actor.id,
          match_status: "matched",
          match_confidence: 85,
          updated_at: now,
        })
        .eq("source", "kira-hai")
        .eq("source_actor_url", sourceActorUrl);

      if (externalActorError) throw externalActorError;

      const { error: candidatesError } = await supabase
        .from("external_cast_candidates")
        .update({
          matched_actor_id: actor.id,
          confidence: 60,
          updated_at: now,
        })
        .eq("source", "kira-hai")
        .eq("source_actor_url", sourceActorUrl)
        .is("matched_actor_id", null);

      if (candidatesError) throw candidatesError;

      setActorsById((current) => ({ ...current, [actor.id]: actor }));
      setCandidates((current) =>
        current.map((item) =>
          item.source_actor_url === sourceActorUrl ? { ...item, matched_actor_id: actor.id } : item
        )
      );
      setActorStats((current) => ({ ...current, matched: current.matched + 1 }));
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
    setPlaySearchResults([]);
    setMsg("");
    await searchPlays(row.source_work_title ?? "");
  };

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
        .eq("source", "kira-hai");

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
          (playMatchTarget.source_work_url && item.source_work_url === playMatchTarget.source_work_url) ||
          (!playMatchTarget.source_work_url && item.source_work_title === playMatchTarget.source_work_title)
            ? { ...item, matched_play_id: play.id }
            : item
        )
      );

      setPlayMatchTarget(null);
      setPlaySearchResults([]);
      setMsg(`「${playMatchTarget.source_work_title}」を既存作品「${play.title}」に紐づけました`);
    } catch (error: any) {
      setMsg(error?.message ?? "play match error");
    } finally {
      setBusyId(null);
    }
  };

  const acceptCandidate = async (row: CandidateRow) => {
    if (!row.matched_actor_id || !row.matched_play_id) {
      setMsg("既存actorと既存playの両方に一致している候補だけ採用できます");
      return;
    }

    const roleName = normalizeText(row.source_role_raw) || null;

    setBusyId(row.id);
    setMsg("");
    try {
      let existingQuery = supabase
        .from("casts")
        .select("id")
        .eq("actor_id", row.matched_actor_id)
        .eq("play_id", row.matched_play_id)
        .is("cast_group", null)
        .limit(1);

      existingQuery = roleName ? existingQuery.eq("role_name", roleName) : existingQuery.is("role_name", null);

      const { data: existingCast, error: existingError } = await existingQuery.maybeSingle();
      if (existingError) throw existingError;

      let acceptedCastId = existingCast?.id ?? null;

      if (!acceptedCastId) {
        const { data: inserted, error: insertError } = await supabase
          .from("casts")
          .insert({
            actor_id: row.matched_actor_id,
            play_id: row.matched_play_id,
            role_name: roleName,
            cast_group: null,
          })
          .select("id")
          .single();

        if (insertError) throw insertError;
        acceptedCastId = inserted?.id ?? null;
      }

      const acceptedAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("external_cast_candidates")
        .update({
          status: "accepted",
          accepted_cast_id: acceptedCastId,
          accepted_at: acceptedAt,
          updated_at: acceptedAt,
        })
        .eq("id", row.id);

      if (updateError) throw updateError;

      setCandidates((current) =>
        current.map((item) =>
          item.id === row.id
            ? { ...item, status: "accepted", accepted_cast_id: acceptedCastId }
            : item
        )
      );
      setSelectedIds((current) => ({ ...current, [row.id]: false }));
      setMsg(existingCast?.id ? "既存castsに紐づけて採用済みにしました" : "castsに採用しました");
    } catch (error: any) {
      setMsg(error?.message ?? "accept error");
    } finally {
      setBusyId(null);
    }
  };

  const buildUniquePlaySlug = async (row: CandidateRow) => {
    const sourceSlug = toSlug(getSourceSlug(row.source_work_url));
    const titleSlug = toSlug(row.source_work_title);
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
        .select("matched_play_id")
        .eq("id", row.id)
        .maybeSingle();

      if (latestCandidateError) throw latestCandidateError;

      if (latestCandidate?.matched_play_id) {
        await acceptCandidate({ ...row, matched_play_id: latestCandidate.matched_play_id });
        return;
      }

      const slug = await buildUniquePlaySlug(row);

      const similar = await findSimilarExistingPlays(row.source_work_title);
      if (similar.length > 0) {
        setPlayMatchTarget(row);
        setPlaySearchText(row.source_work_title);
        setPlaySearchResults(similar);
        setMsg("似ている既存作品があります。重複作成を避けるため、既存作品へ紐づけるか確認してください。");
        return;
      }

      const payload = {
        title: row.source_work_title,
        slug,
        summary: null,
        period: makeSkeletonPeriod(row.source_year),
        venue: null,
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
            ? { ...item, matched_play_id: createdPlay.id }
            : item
        )
      );

      await acceptCandidate({ ...row, matched_play_id: createdPlay.id });
      setSelectedIds((current) => ({ ...current, [row.id]: false }));
      setMsg(`作品skeleton「${createdPlay.title}」を作成して採用しました`);
    } catch (error: any) {
      setMsg(error?.message ?? "create skeleton play error");
    } finally {
      setBusyId(null);
    }
  };

  const bulkAcceptReady = async () => {
    if (readySelectedRows.length === 0) {
      setMsg("一括採用できる候補が選択されていません");
      return;
    }

    setBulkBusy(true);
    setMsg(`一括採用を開始します: ${readySelectedRows.length}件`);
    try {
      for (const row of readySelectedRows) {
        await acceptCandidate(row);
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
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-6">
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
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="border-b border-white/10 px-6 py-3 text-xs text-slate-400">
          {loading ? "Loading..." : `${visibleCandidates.length} 件表示 / 最大 ${PAGE_SIZE} 件`}
        </div>

        <div className="divide-y divide-white/5">
          {visibleCandidates.map((row) => {
            const actor = row.matched_actor_id ? actorsById[row.matched_actor_id] : null;
            const play = row.matched_play_id ? playsById[row.matched_play_id] : null;
            const canAccept = Boolean(actor && play && row.status !== "accepted");
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
                          役名: {row.source_role_raw || "未登録"}
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
    </div>
  );
};

export default AdminExternalKiraHai;
