// @ts-nocheck
import React from "react";
import { Link } from "../../next-app/lib/admin-router-shim";

const AdminHome: React.FC = () => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h1 className="text-2xl font-extrabold text-white">管理画面</h1>
      <p className="mt-2 text-sm text-slate-400">
        作品・俳優・シリーズの更新と、編集部ガイドの追加をここから進められます。
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link className="rounded-2xl border border-white/10 bg-black/30 p-4 hover:bg-black/40" to="/admin/series">
          <div className="font-bold text-white">シリーズ</div>
          <div className="mt-1 text-xs text-slate-400">intro / description</div>
        </Link>
        <Link className="rounded-2xl border border-white/10 bg-black/30 p-4 hover:bg-black/40" to="/admin/plays">
          <div className="font-bold text-white">作品</div>
          <div className="mt-1 text-xs text-slate-400">VOD / genre / キャスト</div>
        </Link>
        <Link className="rounded-2xl border border-white/10 bg-black/30 p-4 hover:bg-black/40" to="/admin/actors">
          <div className="font-bold text-white">俳優</div>
          <div className="mt-1 text-xs text-slate-400">画像 / SNS / タグ</div>
        </Link>
        <Link className="rounded-2xl border border-white/10 bg-black/30 p-4 hover:bg-black/40" to="/admin/guides">
          <div className="font-bold text-white">編集部ガイド</div>
          <div className="mt-1 text-xs text-slate-400">series-guides / features</div>
        </Link>
      </div>
    </div>
  );
};

export default AdminHome;
