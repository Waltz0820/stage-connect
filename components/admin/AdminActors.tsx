import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";

type ActorRow = {
  id?: string;
  slug: string;
  name: string;
  kana?: string | null;
  image_url?: string | null;
  gender?: string | null;
};

const AdminActors: React.FC = () => {
  const [rows, setRows] = useState<ActorRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("actors")
        .select("id,slug,name,kana,image_url,gender")
        .order("name", { ascending: true });
      if (error) throw error;
      setRows((data ?? []) as any);
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
      return a.includes(s) || b.includes(s) || c.includes(s);
    });
  }, [rows, q]);

  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-white">キャスト</h1>
            <p className="text-xs text-slate-400 mt-1">
              画像は「添付→URL保存」で終わり（Storage）
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
              to="/admin/actors/new"
              className="text-xs px-3 py-2 rounded-full bg-white/10 border border-white/10 hover:bg-white/15 font-bold"
            >
              新規作成
            </Link>
          </div>
        </div>

        <div className="mt-4">
          <input
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
            placeholder="検索（name/slug/kana）"
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
            <Link
              key={r.slug}
              to={`/admin/actors/${encodeURIComponent(r.slug)}`}
              className="block px-6 py-4 hover:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 overflow-hidden shrink-0">
                  {r.image_url ? (
                    <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-white font-bold truncate">{r.name}</div>
                  <div className="text-xs text-slate-500 mt-1 truncate">
                    slug: {r.slug} / kana: {r.kana || "-"} / gender: {r.gender || "-"}
                  </div>
                </div>
                <div className="text-xs text-slate-500">編集</div>
              </div>
            </Link>
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

export default AdminActors;
