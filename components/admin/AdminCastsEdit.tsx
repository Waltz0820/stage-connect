// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "../../next-app/lib/admin-router-shim";
import { supabase } from "../../lib/supabase";
import Field from "./widgets/Field";

type PlayRow = { id: string; slug: string; title: string };
type ActorRow = { id: string; slug: string; name: string; kana?: string | null; image_url?: string | null };

type CastRow = {
  id: string;
  play_id: string;
  actor_id: string;
  role_name?: string | null;
  cast_group?: string | null;
  is_starring?: boolean | null;
  billing_order?: number | null;
  actor?: ActorRow | null;
};

const normalizeCastValue = (value?: string | null) => (value ?? "").trim();

const AdminCastsEdit: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const playSlug = useMemo(() => (slug ? decodeURIComponent(slug) : ""), [slug]);

  const [play, setPlay] = useState<PlayRow | null>(null);
  const [casts, setCasts] = useState<CastRow[]>([]);
  const [q, setQ] = useState("");
  const [found, setFound] = useState<ActorRow[]>([]);
  const [pick, setPick] = useState<ActorRow | null>(null);

  const [role, setRole] = useState("");
  const [castGroupNew, setCastGroupNew] = useState("");
  const [starringNew, setStarringNew] = useState(false);
  const [billingNew, setBillingNew] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [roleDraft, setRoleDraft] = useState<Record<string, string>>({});
  const [castGroupDraft, setCastGroupDraft] = useState<Record<string, string>>({});
  const [starringDraft, setStarringDraft] = useState<Record<string, boolean>>({});
  const [billingDraft, setBillingDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const [onlyMissingRole, setOnlyMissingRole] = useState(false);
  const [onlyStarring, setOnlyStarring] = useState(false);

  const resetAddForm = () => {
    setPick(null);
    setRole("");
    setCastGroupNew("");
    setStarringNew(false);
    setBillingNew("");
    setFound([]);
    setQ("");
  };

  const load = async () => {
    setBusy(true);
    setMsg("");
    try {
      const { data: p, error: e1 } = await supabase.from("plays").select("id,slug,title").eq("slug", playSlug).maybeSingle();
      if (e1) throw e1;

      if (!p) {
        setPlay(null);
        setCasts([]);
        setRoleDraft({});
        setCastGroupDraft({});
        setStarringDraft({});
        setBillingDraft({});
        resetAddForm();
        return;
      }

      setPlay(p as PlayRow);

      const { data: cs, error: e2 } = await supabase
        .from("casts")
        .select(
          `
          id,
          play_id,
          actor_id,
          role_name,
          cast_group,
          is_starring,
          billing_order,
          created_at,
          actor:actors ( id, slug, name, kana, image_url )
        `
        )
        .eq("play_id", (p as any).id)
        .order("billing_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });

      if (e2) throw e2;

      const list = (cs ?? []) as CastRow[];
      setCasts(list);

      const nextRoleDraft: Record<string, string> = {};
      const nextCastGroupDraft: Record<string, string> = {};
      const nextStarDraft: Record<string, boolean> = {};
      const nextBillingDraft: Record<string, string> = {};

      for (const row of list) {
        nextRoleDraft[row.id] = row.role_name ? String(row.role_name) : "";
        nextCastGroupDraft[row.id] = row.cast_group ? String(row.cast_group) : "";
        nextStarDraft[row.id] = Boolean(row.is_starring);
        nextBillingDraft[row.id] =
          row.billing_order === null || row.billing_order === undefined ? "" : String(row.billing_order);
      }

      setRoleDraft(nextRoleDraft);
      setCastGroupDraft(nextCastGroupDraft);
      setStarringDraft(nextStarDraft);
      setBillingDraft(nextBillingDraft);
      resetAddForm();
    } catch (e: any) {
      setMsg(e?.message ?? "load error");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (playSlug) void load();
  }, [playSlug]);

  const searchActor = async () => {
    const s = q.trim();
    if (!s) {
      setFound([]);
      return;
    }

    const { data, error } = await supabase
      .from("actors")
      .select("id,slug,name,kana,image_url")
      .or(`slug.ilike.%${s}%,name.ilike.%${s}%,kana.ilike.%${s}%`)
      .limit(20);

    if (!error) setFound((data ?? []) as ActorRow[]);
  };

  const parseBilling = (value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) return null;
    return Math.trunc(parsed);
  };

  const add = async () => {
    if (!play?.id || !pick?.id) return;

    setMsg("");
    setBusy(true);
    try {
      const nextRole = normalizeCastValue(role);
      const nextGroup = normalizeCastValue(castGroupNew);

      const hasExactDuplicate = casts.some((c) => {
        if (c.actor_id !== pick.id) return false;
        return normalizeCastValue(c.role_name) === nextRole && normalizeCastValue(c.cast_group) === nextGroup;
      });

      if (hasExactDuplicate) {
        setMsg("同じ俳優・役名・グループの組み合わせは既に登録されています");
        return;
      }

      const payload = {
        play_id: play.id,
        actor_id: pick.id,
        role_name: nextRole || null,
        cast_group: nextGroup || null,
        is_starring: starringNew,
        billing_order: parseBilling(billingNew),
      };

      const { error } = await supabase.from("casts").insert(payload);
      if (error) throw error;

      await load();
      setMsg("保存しました");
    } catch (e: any) {
      setMsg(e?.message ?? "add error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (castId: string) => {
    if (!confirm("削除しますか？")) return;

    setMsg("");
    setBusy(true);
    try {
      const { error } = await supabase.from("casts").delete().eq("id", castId);
      if (error) throw error;
      await load();
    } catch (e: any) {
      setMsg(e?.message ?? "remove error");
    } finally {
      setBusy(false);
    }
  };

  const markSaving = (castId: string, value: boolean) => {
    setSaving((prev) => ({ ...prev, [castId]: value }));
  };

  const updateRole = async (castId: string) => {
    const next = normalizeCastValue(roleDraft[castId]);
    if (saving[castId]) return;

    markSaving(castId, true);
    setMsg("");
    try {
      const { error } = await supabase.from("casts").update({ role_name: next || null }).eq("id", castId);
      if (error) throw error;
      setCasts((prev) => prev.map((c) => (c.id === castId ? { ...c, role_name: next || null } : c)));
    } catch (e: any) {
      setMsg(e?.message ?? "update role error");
    } finally {
      markSaving(castId, false);
    }
  };

  const updateCastGroup = async (castId: string) => {
    const next = normalizeCastValue(castGroupDraft[castId]);
    if (saving[castId]) return;

    markSaving(castId, true);
    setMsg("");
    try {
      const { error } = await supabase.from("casts").update({ cast_group: next || null }).eq("id", castId);
      if (error) throw error;
      setCasts((prev) => prev.map((c) => (c.id === castId ? { ...c, cast_group: next || null } : c)));
    } catch (e: any) {
      setMsg(e?.message ?? "update cast group error");
    } finally {
      markSaving(castId, false);
    }
  };

  const updateStarring = async (castId: string, next: boolean) => {
    if (saving[castId]) return;

    setStarringDraft((prev) => ({ ...prev, [castId]: next }));
    setCasts((prev) => prev.map((c) => (c.id === castId ? { ...c, is_starring: next } : c)));

    markSaving(castId, true);
    setMsg("");
    try {
      const { error } = await supabase.from("casts").update({ is_starring: next }).eq("id", castId);
      if (error) throw error;
    } catch (e: any) {
      setStarringDraft((prev) => ({ ...prev, [castId]: !next }));
      setCasts((prev) => prev.map((c) => (c.id === castId ? { ...c, is_starring: !next } : c)));
      setMsg(e?.message ?? "update starring error");
    } finally {
      markSaving(castId, false);
    }
  };

  const updateBilling = async (castId: string) => {
    const next = parseBilling(billingDraft[castId] ?? "");
    if (saving[castId]) return;

    markSaving(castId, true);
    setMsg("");
    try {
      const { error } = await supabase.from("casts").update({ billing_order: next }).eq("id", castId);
      if (error) throw error;

      setCasts((prev) => prev.map((c) => (c.id === castId ? { ...c, billing_order: next } : c)));
      setBillingDraft((prev) => ({ ...prev, [castId]: next === null ? "" : String(next) }));
    } catch (e: any) {
      setMsg(e?.message ?? "update billing error");
    } finally {
      markSaving(castId, false);
    }
  };

  const visibleCasts = useMemo(() => {
    return casts.filter((c) => {
      if (onlyStarring && !Boolean(starringDraft[c.id])) return false;
      if (onlyMissingRole && normalizeCastValue(roleDraft[c.id]) !== "") return false;
      return true;
    });
  }, [casts, onlyMissingRole, onlyStarring, roleDraft, starringDraft]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-white">出演編集</h1>
            <p className="mt-1 text-xs text-slate-400">作品に紐づく出演者、役名、グループ、表示順をここで整えます。</p>
            {play && (
              <p className="mt-3 text-sm text-slate-300">
                <span className="text-slate-500">対象:</span> <b className="text-white">{play.title}</b>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link to="/admin/plays" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10">
              作品一覧へ
            </Link>
            <button
              onClick={() => void load()}
              disabled={busy}
              className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15"
            >
              再読み込み
            </button>
          </div>
        </div>

        {msg && <div className="mt-4 text-sm text-slate-300">{msg}</div>}
      </div>

      <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        <Field label="現在の出演者" hint="役名 / グループ / 主演 / billing_order をこの場で詰めるとDBが一気に育ちます">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyMissingRole((prev) => !prev)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                onlyMissingRole ? "border-white/20 bg-white/10 text-white" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              役名未登録だけ
            </button>

            <button
              type="button"
              onClick={() => setOnlyStarring((prev) => !prev)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                onlyStarring
                  ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              主演だけ
            </button>

            <div className="ml-auto text-xs text-slate-500">
              表示 {visibleCasts.length} / 全 {casts.length}
            </div>
          </div>

          <div className="space-y-2">
            {visibleCasts.map((c) => (
              <div
                key={c.id}
                className={`rounded-xl border px-4 py-3 ${
                  starringDraft[c.id] ? "border-emerald-500/20 bg-emerald-500/10" : "border-white/10 bg-black/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/40">
                      {c.actor?.image_url ? <img src={c.actor.image_url} alt={c.actor.name} className="h-full w-full object-cover" /> : null}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate font-bold text-white">{c.actor?.name ?? "(unknown)"}</div>
                      <div className="mt-1 truncate text-xs text-slate-500">{c.actor?.slug ?? ""}</div>

                      <div className="mt-3 space-y-2 text-xs text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="shrink-0">役名:</span>
                          <input
                            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-white outline-none"
                            value={roleDraft[c.id] ?? ""}
                            onChange={(e) => setRoleDraft((prev) => ({ ...prev, [c.id]: e.target.value }))}
                            onBlur={() => void updateRole(c.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            }}
                            placeholder="役名未登録"
                            disabled={busy}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="shrink-0">グループ:</span>
                          <input
                            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-white outline-none"
                            value={castGroupDraft[c.id] ?? ""}
                            onChange={(e) => setCastGroupDraft((prev) => ({ ...prev, [c.id]: e.target.value }))}
                            onBlur={() => void updateCastGroup(c.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            }}
                            placeholder="青春学園"
                            disabled={busy}
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => void updateStarring(c.id, !Boolean(starringDraft[c.id]))}
                            disabled={busy}
                            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                              starringDraft[c.id]
                                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
                                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                            }`}
                          >
                            {starringDraft[c.id] ? "主演" : "一般"}
                          </button>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400">billing</span>
                            <input
                              className="w-20 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs text-white outline-none"
                              value={billingDraft[c.id] ?? ""}
                              onChange={(e) => setBillingDraft((prev) => ({ ...prev, [c.id]: e.target.value }))}
                              onBlur={() => void updateBilling(c.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              }}
                              placeholder="1"
                              inputMode="numeric"
                              disabled={busy}
                            />
                          </div>

                          <span className="text-[10px] text-slate-500">{saving[c.id] ? "保存中..." : ""}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => void remove(c.id)}
                    className="shrink-0 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200 hover:bg-red-500/15"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}

            {casts.length === 0 && <div className="text-sm text-slate-500">まだ出演者が登録されていません</div>}
            {casts.length > 0 && visibleCasts.length === 0 && (
              <div className="text-sm text-slate-500">フィルタ条件に一致する出演者がいません</div>
            )}
          </div>
        </Field>

        <div className="space-y-4 border-t border-white/10 pt-6">
          <Field label="俳優検索" hint="name / kana / slug を部分一致で検索">
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="佐藤 / さとう / sato"
              />
              <button onClick={() => void searchActor()} className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/15">
                検索
              </button>
            </div>
          </Field>

          {found.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {found.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setPick(a)}
                  className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                    pick?.id === a.id ? "border-white/20 bg-white/10" : "border-white/10 bg-black/30 hover:bg-white/5"
                  }`}
                >
                  <div className="font-bold text-white">{a.name}</div>
                  <div className="text-xs text-slate-500">
                    {a.slug}
                    {a.kana ? ` / ${a.kana}` : ""}
                  </div>
                </button>
              ))}
            </div>
          )}

          <Field label="役名（任意）">
            <input
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="手塚国光"
            />
          </Field>

          <Field label="グループ（任意）" hint="青春学園 / 不動峰 / 玉林中">
            <input
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
              value={castGroupNew}
              onChange={(e) => setCastGroupNew(e.target.value)}
              placeholder="青春学園"
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="主演（任意）" hint="主演キャストなら ON">
              <button
                type="button"
                onClick={() => setStarringNew((prev) => !prev)}
                className={`w-full rounded-xl border px-4 py-3 font-bold ${
                  starringNew
                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
                    : "border-white/10 bg-black/40 text-slate-200 hover:bg-white/5"
                }`}
              >
                {starringNew ? "主演: ON" : "主演: OFF"}
              </button>
            </Field>

            <Field label="billing_order（任意）" hint="小さいほど上位">
              <input
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                value={billingNew}
                onChange={(e) => setBillingNew(e.target.value)}
                placeholder="1"
                inputMode="numeric"
              />
            </Field>
          </div>

          <button
            onClick={() => void add()}
            disabled={!pick || busy}
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 font-bold text-white hover:bg-white/15 disabled:opacity-40"
          >
            選択した俳優を追加
          </button>

          <p className="text-xs text-slate-500">
            この画面は casts.actor_id -&gt; actors.id の外部キー前提です。同じ俳優でも役名やグループが違えば複数行で登録できます。
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminCastsEdit;
