import React, { useState } from "react";
import { supabase } from "../../../lib/supabase";

type Props = {
  bucket?: string;   // default: images
  folder: string;    // e.g. "actors"
  keyName: string;   // e.g. actor slug
  onUploaded: (publicUrl: string) => void;
};

const ImageUploader: React.FC<Props> = ({
  bucket = "images",
  folder,
  keyName,
  onUploaded,
}) => {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [localPreview, setLocalPreview] = useState<string>("");

  const onPick = async (file: File) => {
    setErr("");
    setBusy(true);

    // ✅ ローカルプレビュー（アップ前でも表示）
    try {
      const u = URL.createObjectURL(file);
      setLocalPreview(u);
    } catch {}

    try {
      // ✅ ここでセッションが取れてるかログ
      const { data: s } = await supabase.auth.getSession();
      console.log("[ImageUploader] session?", !!s.session, s.session?.user?.id, s.session?.user?.role);

      // localStorage の token と一致してるか見る用（断片だけ）
      const k = Object.keys(localStorage).find(
        (kk) => kk.includes("sb-") && kk.endsWith("-auth-token")
      );
      const token = k ? JSON.parse(localStorage.getItem(k) || "null")?.access_token : null;
      console.log("[ImageUploader] ls token head", token ? String(token).slice(0, 20) : null);

      // ✅ パス生成
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const safeKey = (keyName || "tmp").replace(/[^\w\-]/g, "_");
      const path = `${folder}/${safeKey}/${Date.now()}.${ext}`;

      console.log("[ImageUploader] upload to", bucket, path);

      // ✅ まず upsert を切って試す（切り分け用）
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          upsert: false,                 // ★ここ重要：まず false でテスト
          contentType: file.type || undefined,
        });

      if (upErr) throw upErr;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      console.log("[ImageUploader] publicUrl", data.publicUrl);

      onUploaded(data.publicUrl);
    } catch (e: any) {
      console.error("[ImageUploader] upload failed", e);
      setErr(e?.message ?? "upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {localPreview ? (
        <div className="w-40 h-40 rounded-2xl overflow-hidden border border-white/10 bg-black/40">
          <img src={localPreview} alt="local preview" className="w-full h-full object-cover" />
        </div>
      ) : null}

      <input
        type="file"
        accept="image/*"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
        }}
        className="block w-full text-sm text-slate-300 file:mr-3 file:px-4 file:py-2 file:rounded-xl file:border file:border-white/10 file:bg-white/5 file:text-white file:font-bold hover:file:bg-white/10"
      />
      {err && <p className="text-xs text-red-300">{err}</p>}
    </div>
  );
};

export default ImageUploader;
