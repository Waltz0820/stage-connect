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
        className={`block px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
          active
            ? "bg-white/10 text-white"
            : "text-slate-400 hover:text-white hover:bg-white/5"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-theater-black text-slate-200">
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white font-extrabold tracking-tight">
              Stage Connect
            </span>
            <span className="text-xs text-slate-400">ADMIN</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-xs px-3 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
            >
              公開側へ
            </Link>
            <button
              className="text-xs px-3 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
              onClick={() => supabase.auth.signOut()}
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-2 sticky top-24">
            {item("/admin", "ダッシュボード")}
            {item("/admin/series", "シリーズ")}
            {item("/admin/plays", "作品")}
            {item("/admin/actors", "キャスト")}
          </div>
        </aside>

        <main className="lg:col-span-9">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
