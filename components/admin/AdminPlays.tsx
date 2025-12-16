import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";

type PlayRow = {
  id: string;
  slug: string;
  title: string;
  period?: string | null;
  franchise_id?: string | null;
};

type FranchiseRow = {
  id: string;
  name: string;
};

const AdminPlays: React.FC = () => {
  const [rows, setRows] = useState<PlayRow[]>([]);
  const [frs, setFrs] = useState<FranchiseRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: plays, error: e1 }, { data: fr, error: e2 }] = await Promise.all([
        supabase.from("plays").select("id,slug,title,period,franchise_id").order("title", { ascending: true }),
        supabase.from("franchises").select("id,name").order("name", { ascending: true }),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      setRows((plays ?? []) as any);
      setFrs((fr ?? []) as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const frName = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of frs) m.set(f.id, f.name);
    return m;
  }, [frs]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      const a = (r.title ?? "").toLowerCase();
      const b = (r.slug ?? "").toLowerCase();
      const c = (r.period ?? "").toLowerCase();
      const d = frName.get(r.franchise_id ?? "")?.toLowerCase() ?? "";
      return a.includes(s) || b.includes(s) || c.includes(s) || d.includes(s);
    });
  }, [rows, q, frName]);

  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-white">作品</h1>
            <p className="text-xs text-slate-400 mt-1">
              作品編集→「出演編集」へ飛べる（casts）
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="text-xs px-3 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
              onClick={load}
            >
              再読み込み
            </button>
            <Link
              to="/admin/plays/new"
              className="text-xs px-3 py-2 rounded-full bg-white/10 border border-white/10 hover:bg-white/15 font-bold"
            >
              新規作成
            </Link>
          </div>
        </div>

        <div className="mt-4">
          <input
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
            placeholder="検索（title/slug/period/series）"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-3 border-b border-white/10 text-xs text-slate-400">
          {loading ? "Loading..." : `${filtered.length} 件`}
        </div>

        <div className="divide-y divide-white/5">
          {filtered.map((r) => (
            <div key={r.id} className="px-6 py-4 hover:bg-white/5">
              <div className="flex items-center justify-between gap-3">
                <Link
                  to={`/admin/plays/${encodeURIComponent(r.slug)}`}
                  className="min-w-0 flex-1"
                >
                  <div className="text-white font-bold truncate">{r.title}</div>
                  <div className="text-xs text-slate-500 mt-1 truncate">
                    slug: {r.slug} / period: {r.period || "-"} / series: {frName.get(r.franchise_id ?? "") || "-"}
                  </div>
                </Link>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/admin/plays/${encodeURIComponent(r.slug)}`}
                    className="text-xs px-3 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
                  >
                    編集
                  </Link>
                  <Link
                    to={`/admin/plays/${encodeURIComponent(r.slug)}/casts`}
                    className="text-xs px-3 py-2 rounded-full bg-white/10 border border-white/10 hover:bg-white/15 font-bold"
                  >
                    出演編集
                  </Link>
                </div>
              </div>
            </div>
          ))}

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

export default AdminPlays;
