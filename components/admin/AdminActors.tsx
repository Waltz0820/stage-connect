// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "../../next-app/lib/admin-router-shim";
import { supabase } from "../../next-app/lib/admin-supabase";
import { safeTrim } from "./widgets/utils";

type ActorRow = {
  id?: string;
  slug: string;
  name: string;
  name_en?: string | null;
  kana?: string | null;
  birthday?: string | null;
  birthday_label?: string | null;
  image_url?: string | null;
  gender?: string | null;
  profile?: string | null;
  profile_en?: string | null;
  height_cm?: number | null;
  blood_type?: string | null;
};

type QuickDraft = {
  nameEn: string;
  birthday: string;
  birthdayLabel: string;
  profile: string;
  profileEn: string;
  heightCm: string;
  bloodType: string;
};

const buildDraft = (row: ActorRow): QuickDraft => ({
  nameEn: row.name_en ?? "",
  birthday: row.birthday ?? "",
  birthdayLabel: row.birthday_label ?? "",
  profile: row.profile ?? "",
  profileEn: row.profile_en ?? "",
  heightCm: row.height_cm != null ? String(row.height_cm) : "",
  bloodType: row.blood_type ?? "",
});

const AdminActors: React.FC = () => {
  const [rows, setRows] = useState<ActorRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, QuickDraft>>({});
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("actors")
        .select("id,slug,name,name_en,kana,birthday,birthday_label,image_url,gender,profile,profile_en,height_cm,blood_type")
        .order("name", { ascending: true });
      if (error) throw error;
      const nextRows = (data ?? []) as any as ActorRow[];
      setRows(nextRows);
      setDrafts(
        Object.fromEntries(nextRows.map((row) => [row.slug, buildDraft(row)]))
      );
    } catch (error: any) {
      setMsg(error?.message ?? "load error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      const a = (r.name ?? "").toLowerCase();
      const b = (r.slug ?? "").toLowerCase();
      const c = (r.kana ?? "").toLowerCase();
      const d = (r.profile ?? "").toLowerCase();
      return a.includes(s) || b.includes(s) || c.includes(s) || d.includes(s);
    });
  }, [rows, q]);

  const updateDraft = (slug: string, patch: Partial<QuickDraft>) => {
    setDrafts((current) => ({
      ...current,
      [slug]: {
        ...(current[slug] ?? { nameEn: "", birthday: "", birthdayLabel: "", profile: "", profileEn: "", heightCm: "", bloodType: "" }),
        ...patch,
      },
    }));
  };

  const toggleQuickEdit = (row: ActorRow) => {
    setExpandedSlug((current) => (current === row.slug ? null : row.slug));
    setDrafts((current) => ({
      ...current,
      [row.slug]: current[row.slug] ?? buildDraft(row),
    }));
  };

  const saveQuickEdit = async (row: ActorRow) => {
    const draft = drafts[row.slug] ?? buildDraft(row);
    setMsg("");
    setSavingSlug(row.slug);
    try {
      const payload = {
        name_en: safeTrim(draft.nameEn) || null,
        birthday: safeTrim(draft.birthday) || null,
        birthday_label: safeTrim(draft.birthdayLabel) || null,
        profile: safeTrim(draft.profile) || null,
        profile_en: safeTrim(draft.profileEn) || null,
        height_cm: safeTrim(draft.heightCm)
          ? Number.parseInt(safeTrim(draft.heightCm), 10) || null
          : null,
        blood_type: safeTrim(draft.bloodType).toUpperCase() || null,
      };

      const { error } = await supabase
        .from("actors")
        .update(payload)
        .eq("slug", row.slug);

      if (error) throw error;

      setRows((current) =>
        current.map((item) =>
          item.slug === row.slug
            ? {
                ...item,
                birthday: payload.birthday,
                name_en: payload.name_en,
                birthday_label: payload.birthday_label,
                profile: payload.profile,
                profile_en: payload.profile_en,
                height_cm: payload.height_cm,
                blood_type: payload.blood_type,
              }
            : item
        )
      );
      setMsg(`${row.name} を保存しました`);
    } catch (error: any) {
      setMsg(error?.message ?? "save error");
    } finally {
      setSavingSlug(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-white">キャスト</h1>
            <p className="text-xs text-slate-400 mt-1">
              一覧からクイック編集でプロフィール文・身長・血液型をまとめて更新できます。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="text-xs px-3 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
              onClick={load}
            >
              読み込み直し
            </button>
            <Link
              to="/admin/actors/new"
              className="text-xs px-3 py-2 rounded-full bg-white/10 border border-white/10 hover:bg-white/15 font-bold"
            >
              新規追加
            </Link>
          </div>
        </div>

        <div className="mt-4">
          <input
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
            placeholder="検索（name / slug / kana / profile）"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {msg ? <div className="mt-4 text-sm text-slate-300">{msg}</div> : null}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-3 border-b border-white/10 text-xs text-slate-400">
          {loading ? "Loading..." : `${filtered.length} 件`}
        </div>

        <div className="divide-y divide-white/5">
          {filtered.map((r) => {
            const draft = drafts[r.slug] ?? buildDraft(r);
            const isExpanded = expandedSlug === r.slug;
            const isSaving = savingSlug === r.slug;

            return (
              <div key={r.slug} className="px-6 py-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 overflow-hidden shrink-0">
                    {r.image_url ? (
                      <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/admin/actors/${encodeURIComponent(r.slug)}`}
                        className="text-white font-bold truncate hover:underline"
                      >
                        {r.name}
                      </Link>
                      {r.kana ? <span className="text-xs text-slate-500">{r.kana}</span> : null}
                    </div>

                    <div className="text-xs text-slate-500 mt-1 truncate">
                      slug: {r.slug} / gender: {r.gender || "-"} / 身長: {r.height_cm ?? "-"} / 血液型:{" "}
                      {r.blood_type || "-"} / 生年月日: {r.birthday || "-"} / 表示用日付: {r.birthday_label || "-"}
                    </div>

                    {r.profile ? (
                      <div className="text-sm text-slate-300 mt-2 line-clamp-2">
                        {r.profile}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 mt-2">プロフィール未入力</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleQuickEdit(r)}
                      className="text-xs px-3 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
                    >
                      {isExpanded ? "閉じる" : "クイック編集"}
                    </button>
                    <Link
                      to={`/admin/actors/${encodeURIComponent(r.slug)}`}
                      className="text-xs px-3 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
                    >
                      詳細
                    </Link>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="mt-4 ml-[52px] grid gap-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-2">name_en</label>
                        <input
                          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
                          value={draft.nameEn}
                          onChange={(e) => updateDraft(r.slug, { nameEn: e.target.value })}
                          placeholder="空欄なら slug から自動生成"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-2">birthday</label>
                        <input
                          type="date"
                          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
                          value={draft.birthday}
                          onChange={(e) => updateDraft(r.slug, { birthday: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-2">birthday_label</label>
                        <input
                          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
                          value={draft.birthdayLabel}
                          onChange={(e) => updateDraft(r.slug, { birthdayLabel: e.target.value })}
                          placeholder="2月5日 / 非公表"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-2">height_cm</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
                          value={draft.heightCm}
                          onChange={(e) => updateDraft(r.slug, { heightCm: e.target.value })}
                          placeholder="176"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-2">blood_type</label>
                        <input
                          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
                          value={draft.bloodType}
                          onChange={(e) => updateDraft(r.slug, { bloodType: e.target.value })}
                          placeholder="AB"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-2">
                        profile（ファーストビューの1行ステータス）
                      </label>
                      <textarea
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
                        value={draft.profile}
                        onChange={(e) => updateDraft(r.slug, { profile: e.target.value })}
                        rows={3}
                        placeholder="東京都出身の俳優・実業家。株式会社Pasture代表取締役社長。"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-2">
                        profile_en（英語版の1行ステータス）
                      </label>
                      <textarea
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
                        value={draft.profileEn}
                        onChange={(e) => updateDraft(r.slug, { profileEn: e.target.value })}
                        rows={3}
                        placeholder="Tokyo-born actor and entrepreneur. CEO of Pasture Inc."
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => updateDraft(r.slug, buildDraft(r))}
                        className="text-xs px-3 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
                        disabled={isSaving}
                      >
                        元に戻す
                      </button>
                      <button
                        type="button"
                        onClick={() => saveQuickEdit(r)}
                        className="text-xs px-3 py-2 rounded-full bg-white/10 border border-white/10 hover:bg-white/15 font-bold"
                        disabled={isSaving}
                      >
                        {isSaving ? "保存中..." : "保存"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}

          {!loading && filtered.length === 0 && (
            <div className="px-6 py-10 text-center text-slate-500 text-sm">
              該当なし
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminActors;
