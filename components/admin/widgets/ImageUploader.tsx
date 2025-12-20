import React, { useState } from "react";
import { supabase } from "../../../lib/supabase";

type Props = {
  bucket?: string; // default: images
  folder: string; // e.g. "actors"
  keyName: string; // e.g. actor slug
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

  const onPick = async (file: File) => {
    setErr("");
    setBusy(true);

    try {
      // ✅ セッション確認（RLS原因の切り分け）
      const { data: s, error: sErr } = await supabase.auth.getSession();
      console.log("[ImageUploader] session?", {
        hasSession: !!s?.session,
        userId: s?.session?.user?.id ?? null,
        email: (s?.session?.user as any)?.email ?? null,
        authError: sErr?.message ?? null,
      });

      const ext = file.name.split(".").pop() || "jpg";
      const path = `${folder}/${keyName}/${Date.now()}.${ext}`;

      console.log("[ImageUploader] upload start:", { bucket, path, size: file.size, type: file.type });

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });

      if (upErr) {
        console.error("[ImageUploader] upload error:", upErr);
        throw upErr;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      console.log("[ImageUploader] uploaded:", { publicUrl: data?.publicUrl, bucket, path });

      onUploaded(data.publicUrl);
    } catch (e: any) {
      console.error("[ImageUploader] failed:", e);
      setErr(e?.message ?? "upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
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
