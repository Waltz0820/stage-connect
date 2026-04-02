// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "../../next-app/lib/admin-router-shim";
import { supabase } from "../../next-app/lib/admin-supabase";

type GuideCategory = "series-guides" | "features";

type EditorialRow = {
  id: string;
  slug: string;
  title: string;
  category?: GuideCategory | null;
  status?: string | null;
  published_at?: string | null;
};

const CATEGORY_LABELS: Record<GuideCategory, string> = {
  "series-guides": "シリーズ整理",
  features: "編集部ピックアップ",
};

const AdminGuides: React.FC = () => {
  const [rows, setRows] = useState<EditorialRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("editorials")
        .select("id,slug,title,category,status,published_at")
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("title", { ascending: true });

      if (error) throw error;
      setRows((data ?? []) as EditorialRow[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((row) => {
      return [row.title, row.slug, row.category, row.status].some((value) => String(value ?? "").toLowerCase().includes(s));
    });
  }, [rows, q]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-white">編集部ガイド</h1>
            <p className="mt-1 text-xs text-slate-400">`series-guides` と `features` の2カテゴリで運用します。</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
              onClick={() => void load()}
            >
              再読み込み
            </button>
            <Link
              to="/admin/guides/new"
              className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15"
            >
              新規作成
            </Link>
          </div>
        </div>

        <div className="mt-4">
          <input
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
            placeholder="検索（title / slug / category / status）"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="border-b border-white/10 px-6 py-3 text-xs text-slate-400">{loading ? "Loading..." : `${filtered.length} 件`}</div>

        <div className="divide-y divide-white/5">
          {filtered.map((row) => (
            <Link key={row.id} to={`/admin/guides/${encodeURIComponent(row.slug)}`} className="block px-6 py-4 hover:bg-white/5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-bold text-white">{row.title}</div>
                  <div className="mt-1 truncate text-xs text-slate-500">
                    slug: {row.slug} / category: {row.category ? CATEGORY_LABELS[row.category] : "-"} / status: {row.status || "-"}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  {row.published_at ? new Date(row.published_at).toLocaleDateString("ja-JP") : "未公開"}
                </div>
              </div>
            </Link>
          ))}

          {!loading && filtered.length === 0 && <div className="px-6 py-10 text-center text-sm text-slate-500">該当するガイドはありません</div>}
        </div>
      </div>
    </div>
  );
};

export default AdminGuides;
