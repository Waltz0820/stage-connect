import React from "react";
import { Link } from "react-router-dom";

const AdminHome: React.FC = () => {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h1 className="text-2xl font-extrabold text-white">管理画面</h1>
      <p className="text-sm text-slate-400 mt-2">
        まずは “登録→公開側で確認→微調整” のループで数の暴力に入れるようにしてる。
      </p>

      <div className="mt-6 grid sm:grid-cols-3 gap-3">
        <Link
          className="p-4 rounded-2xl bg-black/30 border border-white/10 hover:bg-black/40"
          to="/admin/series"
        >
          <div className="text-white font-bold">シリーズ</div>
          <div className="text-xs text-slate-400 mt-1">intro / description</div>
        </Link>
        <Link
          className="p-4 rounded-2xl bg-black/30 border border-white/10 hover:bg-black/40"
          to="/admin/plays"
        >
          <div className="text-white font-bold">作品</div>
          <div className="text-xs text-slate-400 mt-1">VOD / 期間 / シリーズ</div>
        </Link>
        <Link
          className="p-4 rounded-2xl bg-black/30 border border-white/10 hover:bg-black/40"
          to="/admin/actors"
        >
          <div className="text-white font-bold">キャスト</div>
          <div className="text-xs text-slate-400 mt-1">画像 / SNS / タグ</div>
        </Link>
      </div>
    </div>
  );
};

export default AdminHome;
