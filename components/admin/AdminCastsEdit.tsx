import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Field from "./widgets/Field";

type PlayRow = { id: string; slug: string; title: string };
type ActorRow = { id: string; slug: string; name: string; kana?: string | null; image_url?: string | null };

type CastRow = {
  id: string;
  play_id: string;
  actor_id: string;
  role_name?: string | null;
  is_starring?: boolean | null;
  billing_order?: number | null;
  actor?: ActorRow | null;
};

const AdminCastsEdit: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const playSlug = useMemo(() => (slug ? decodeURIComponent(slug) : ""), [slug]);

  const [play, setPlay] = useState<PlayRow | null>(null);
  const [casts, setCasts] = useState<CastRow[]>([]);
  const [q, setQ] = useState("");
  const [found, setFound] = useState<ActorRow[]>([]);
  const [pick, setPick] = useState<ActorRow | null>(null);

  // add用
  const [role, setRole] = useState("");
  const [starringNew, setStarringNew] = useState(false);
  const [billingNew, setBillingNew] = useState<string>("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // ★ 既存キャスト編集用 draft
  const [roleDraft, setRoleDraft] = useState<Record<string, string>>({});
  const [starringDraft, setStarringDraft] = useState<Record<string, boolean>>({});
  const [billingDraft, setBillingDraft] = useState<Record<string, string>>({});

  // ★ 保存中表示（castId -> true/false）
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // ★ フィルタ（作業モード）
  const [onlyMissingRole, setOnlyMissingRole] = useState(false);
  const [onlyStarring, setOnlyStarring] = useState(false);

  const load = async () => {
    setBusy(true);
    setMsg("");
    try {
      const { data: p, error: e1 } = await supabase
        .from("plays")
        .select("id,slug,title")
        .eq("slug", playSlug)
        .maybeSingle();

      if (e1) throw e1;

      if (!p) {
        setPlay(null);
        setCasts([]);
        setRoleDraft({});
        setStarringDraft({});
        setBillingDraft({});
        setPick(null);
        setRole("");
        setStarringNew(false);
        setBillingNew("");
        setFound([]);
        setQ("");
        return;
      }

      setPlay(p as any);

      // casts は actor:actors join 前提（casts.actor_id -> actors.id）
      // ★ billing_order 昇順で取得（NULLは後ろ） → created_at で安定ソート
      const { data: cs, error: e2 } = await supabase
        .from("casts")
        .select(
          `
          id,
          play_id,
          actor_id,
          role_name,
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

      const list = (cs ?? []) as any as CastRow[];
      setCasts(list);

      // ★ draft初期化（DBがNULLなら空/false）
      const roleInit: Record<string, string> = {};
      const starInit: Record<string, boolean> = {};
      const billInit: Record<string, string> = {};

      for (const row of list) {
        roleInit[row.id] = row.role_name ? String(row.role_name) : "";
        starInit[row.id] = Boolean(row.is_starring);
        billInit[row.id] = row.billing_order === null || row.billing_order === undefined ? "" : String(row.billing_order);
      }

      setRoleDraft(roleInit);
      setStarringDraft(starInit);
      setBillingDraft(billInit);

      setPick(null);
      setRole("");
      setStarringNew(false);
      setBillingNew("");
      setFound([]);
      setQ("");
    } catch (e: any) {
      setMsg(e?.message ?? "load error");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (playSlug) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playSlug]);

  const searchActor = async () => {
    const s = q.trim();
    if (!s) {
      setFound([]);
      return;
    }
    // ざっくり LIKE（slug/name/kana）
    const { data, error } = await supabase
      .from("actors")
      .select("id,slug,name,kana,image_url")
      .or(`slug.ilike.%${s}%,name.ilike.%${s}%,kana.ilike.%${s}%`)
      .limit(20);

    if (!error) setFound((data ?? []) as any);
  };

  const parseBilling = (v: string): number | null => {
    const t = v.trim();
    if (!t) return null;
    // "01" も許容、整数化
    const n = Number(t);
    if (!Number.isFinite(n)) return null;
    // billing_order は整数想定（必要なら小数も許容でOK）
    return Math.trunc(n);
  };

  const add = async () => {
    if (!play?.id || !pick?.id) return;
    setMsg("");
    setBusy(true);
    try {
      // 重複防止（同一playに同一actorが既にいるか）
      const exists = casts.some((c) => c.actor_id === pick.id);
      if (exists) {
        setMsg("すでに登録済み");
        return;
      }

      const payload: any = {
        play_id: play.id,
        actor_id: pick.id,
        role_name: role.trim() || null, // ★ 未入力はNULL（DBに未登録文字列を入れない）
        is_starring: starringNew,
        billing_order: parseBilling(billingNew),
      };

      const { error } = await supabase.from("casts").insert(payload);
      if (error) throw error;

      await load();
      setMsg("追加しました");
    } catch (e: any) {
      setMsg(e?.message ?? "add error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (castId: string) => {
    if (!confirm("外す？")) return;
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

  const markSaving = (castId: string, v: boolean) => {
    setSaving((m) => ({ ...m, [castId]: v }));
  };

  // ★ 既存キャストの role_name 更新（Enter or blur で保存）
  const updateRole = async (castId: string) => {
    const raw = roleDraft[castId] ?? "";
    const next = raw.trim();

    if (saving[castId]) return;
    markSaving(castId, true);
    setMsg("");

    try {
      const { error } = await supabase
        .from("casts")
        .update({ role_name: next || null }) // ★ 未入力はNULL
        .eq("id", castId);

      if (error) throw error;

      setCasts((prev) => prev.map((c) => (c.id === castId ? { ...c, role_name: next || null } : c)));
    } catch (e: any) {
      setMsg(e?.message ?? "update role error");
    } finally {
      markSaving(castId, false);
    }
  };

  // ★ 既存キャストの is_starring 更新（クリック即保存）
  const updateStarring = async (castId: string, next: boolean) => {
    if (saving[castId]) return;

    // 先にUI反映（体感速い）
    setStarringDraft((m) => ({ ...m, [castId]: next }));
    setCasts((prev) => prev.map((c) => (c.id === castId ? { ...c, is_starring: next } : c)));

    markSaving(castId, true);
    setMsg("");

    try {
      const { error } = await supabase.from("casts").update({ is_starring: next }).eq("id", castId);
      if (error) throw error;
    } catch (e: any) {
      // 失敗時は戻す（保険）
      setStarringDraft((m) => ({ ...m, [castId]: !next }));
      setCasts((prev) => prev.map((c) => (c.id === castId ? { ...c, is_starring: !next } : c)));
      setMsg(e?.message ?? "update starring error");
    } finally {
      markSaving(castId, false);
    }
  };

  // ★ 既存キャストの billing_order 更新（Enter or blur）
  const updateBilling = async (castId: string) => {
    const raw = billingDraft[castId] ?? "";
    const next = parseBilling(raw);

    if (saving[castId]) return;
    markSaving(castId, true);
    setMsg("");

    try {
      const { error } = await supabase.from("casts").update({ billing_order: next }).eq("id", castId);
      if (error) throw error;

      setCasts((prev) => prev.map((c) => (c.id === castId ? { ...c, billing_order: next } : c)));

      // 見た目を整える（"01"→"1" 等）
      setBillingDraft((m) => ({ ...m, [castId]: next === null ? "" : String(next) }));
    } catch (e: any) {
      setMsg(e?.message ?? "update billing error");
    } finally {
      markSaving(castId, false);
    }
  };

  // ★ 表示フィルタ（役名未登録だけ / 主演だけ）
  const visibleCasts = useMemo(() => {
    return casts.filter((c) => {
      if (onlyStarring && !Boolean(starringDraft[c.id])) return false;
      if (onlyMissingRole && (roleDraft[c.id] ?? "").trim() !== "") return false;
      return true;
    });
  }, [casts, onlyMissingRole, onlyStarring, roleDraft, starringDraft]);

  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-white">出演編集</h1>
            <p className="text-xs text-slate-400 mt-1">“俳優を検索→選ぶ→追加” だけ。迷わせない。</p>
            {play && (
              <p className="text-sm text-slate-300 mt-3">
                <span className="text-slate-500">対象：</span>
                <b className="text-white">{play.title}</b>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/plays"
              className="text-xs px-3 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
            >
              作品一覧へ
            </Link>
            <button
              onClick={load}
              disabled={busy}
              className="text-xs px-3 py-2 rounded-full bg-white/10 border border-white/10 hover:bg-white/15 font-bold"
            >
              再読み込み
            </button>
          </div>
        </div>

        {msg && <div className="mt-4 text-sm text-slate-300">{msg}</div>}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
        <Field label="現在の出演者" hint="役名 / 主演 / billing_order をこの場で詰めるとDBが一気に育つ">
          {/* ★ 作業モードトグル */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => setOnlyMissingRole((v) => !v)}
              className={`text-xs px-3 py-1.5 rounded-full border font-bold ${
                onlyMissingRole
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              役名未登録だけ
            </button>

            <button
              type="button"
              onClick={() => setOnlyStarring((v) => !v)}
              className={`text-xs px-3 py-1.5 rounded-full border font-bold ${
                onlyStarring
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
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
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${
                  starringDraft[c.id]
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : "bg-black/30 border-white/10"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 overflow-hidden shrink-0">
                    {c.actor?.image_url ? (
                      <img src={c.actor.image_url} alt={c.actor.name} className="w-full h-full object-cover" />
                    ) : null}
                  </div>

                  <div className="min-w-0">
                    <div className="text-white font-bold truncate">{c.actor?.name ?? "(unknown)"}</div>

                    <div className="text-xs text-slate-500 space-y-2 mt-1">
                      <div className="truncate">{c.actor?.slug ?? ""}</div>

                      {/* 1) 役名 */}
                      <div className="flex items-center gap-2">
                        <span className="shrink-0">役名：</span>
                        <input
                          className="flex-1 min-w-0 px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-white outline-none"
                          value={roleDraft[c.id] ?? ""}
                          onChange={(e) => setRoleDraft((m) => ({ ...m, [c.id]: e.target.value }))}
                          onBlur={() => updateRole(c.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                          }}
                          placeholder="（役名未登録）"
                          disabled={busy}
                        />
                      </div>

                      {/* 2) 主演トグル + billing_order */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateStarring(c.id, !Boolean(starringDraft[c.id]))}
                          disabled={busy}
                          className={`text-xs px-3 py-1.5 rounded-full border font-bold transition-colors ${
                            starringDraft[c.id]
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                          title="主演/主要キャストとして扱う"
                        >
                          {starringDraft[c.id] ? "主演" : "脇"}
                        </button>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">billing：</span>
                          <input
                            className="w-20 px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-white outline-none text-xs"
                            value={billingDraft[c.id] ?? ""}
                            onChange={(e) => setBillingDraft((m) => ({ ...m, [c.id]: e.target.value }))}
                            onBlur={() => updateBilling(c.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            }}
                            placeholder="例: 1"
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
                  onClick={() => remove(c.id)}
                  className="text-xs px-3 py-2 rounded-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 text-red-200 font-bold shrink-0"
                >
                  外す
                </button>
              </div>
            ))}

            {casts.length === 0 && <div className="text-sm text-slate-500">まだ出演者が登録されていません</div>}
            {casts.length > 0 && visibleCasts.length === 0 && (
              <div className="text-sm text-slate-500">フィルタ条件に一致する出演者がいません</div>
            )}
          </div>
        </Field>

        <div className="border-t border-white/10 pt-6 space-y-4">
          <Field label="俳優検索" hint="name / kana / slug を部分一致で探す">
            <div className="flex gap-2">
              <input
                className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="例：佐藤 / さとう / sato"
              />
              <button
                onClick={searchActor}
                className="px-4 py-3 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 font-bold text-sm"
              >
                検索
              </button>
            </div>
          </Field>

          {found.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-2">
              {found.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setPick(a)}
                  className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                    pick?.id === a.id ? "bg-white/10 border-white/20" : "bg-black/30 border-white/10 hover:bg-white/5"
                  }`}
                >
                  <div className="text-white font-bold">{a.name}</div>
                  <div className="text-xs text-slate-500">
                    {a.slug} {a.kana ? ` / ${a.kana}` : ""}
                  </div>
                </button>
              ))}
            </div>
          )}

          <Field label="役名（任意）">
            <input
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="例：主人公 / ○○役"
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="主演（任意）" hint="主要キャストならON">
              <button
                type="button"
                onClick={() => setStarringNew((v) => !v)}
                className={`w-full px-4 py-3 rounded-xl border font-bold ${
                  starringNew
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
                    : "bg-black/40 border-white/10 text-slate-200 hover:bg-white/5"
                }`}
              >
                {starringNew ? "主演：ON" : "主演：OFF"}
              </button>
            </Field>

            <Field label="billing_order（任意）" hint="小さいほど上位">
              <input
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
                value={billingNew}
                onChange={(e) => setBillingNew(e.target.value)}
                placeholder="例：1"
                inputMode="numeric"
              />
            </Field>
          </div>

          <button
            onClick={add}
            disabled={!pick || busy}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 font-bold text-white disabled:opacity-40"
          >
            選択した俳優を追加
          </button>

          <p className="text-xs text-slate-500">
            ※ この実装は casts.actor_id → actors.id の外部キー前提。もしスキーマが違うなら、ここだけ調整する。
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminCastsEdit;
