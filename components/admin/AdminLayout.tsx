import React from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const loc = useLocation();

  const item = (to: string, label: string) => {
    const active = loc.pathname === to || loc.pathname.startsWith(to + "/");
    return (
      <Link
        to={to}
        className={`block rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
          active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-theater-black text-slate-200">
      <div className="sticky top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="font-extrabold tracking-tight text-white">Stage Connect</span>
            <span className="text-xs text-slate-400">ADMIN</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10">
              公開側へ
            </Link>
            <button
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
              onClick={() => supabase.auth.signOut()}
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="sticky top-24 space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
            {item("/admin", "ダッシュボード")}
            {item("/admin/series", "シリーズ")}
            {item("/admin/plays", "作品")}
            {item("/admin/actors", "俳優")}
            {item("/admin/guides", "編集部ガイド")}
          </div>
        </aside>

        <main className="lg:col-span-9">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
