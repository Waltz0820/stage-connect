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
      const slug = await buildUniquePlaySlug(row);
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
      setMsg(`作品skeleton「${createdPlay.title}」を作成して採用しました`);
    } catch (error: any) {
      setMsg(error?.message ?? "create skeleton play error");
    } finally {
      setBusyId(null);
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

            return (
              <div key={row.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
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
                            既存俳優に一致済み。必要なら作品skeletonを作って出演線まで接続できます。
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
