import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Field from "./widgets/Field";
import JsonArea from "./widgets/JsonArea";
import ImageUploader from "./widgets/ImageUploader";
import { parseCommaList, parseJsonOr, safeTrim, stringifyPretty, toSlug } from "./widgets/utils";

type Mode = "new" | "edit";

type ActorRow = {
  id?: string;
  slug: string;
  name: string;
  kana?: string | null;
  profile?: string | null;
  image_url?: string | null;
  gender?: string | null;
  sns?: any;
  tags?: string[] | null;
  featured_play_slugs?: string[] | null;
};

const AdminActorEdit: React.FC<{ mode: Mode }> = ({ mode }) => {
  const nav = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const key = useMemo(() => (slug ? decodeURIComponent(slug) : ""), [slug]);

  const [row, setRow] = useState<ActorRow | null>(null);
  const [name, setName] = useState("");
  const [slugText, setSlugText] = useState("");
  const [kana, setKana] = useState("");
  const [profile, setProfile] = useState("");
  const [gender, setGender] = useState("male");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState("");
  const [featured, setFeatured] = useState("");
  const [snsText, setSnsText] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (mode === "new") {
      setRow(null);
      setName("");
      setSlugText("");
      setKana("");
      setProfile("");
      setGender("male");
      setImageUrl("");
      setTags("");
      setFeatured("");
      setSnsText(stringifyPretty({}));
      return;
    }

    const run = async () => {
      setBusy(true);
      try {
        const { data, error } = await supabase
          .from("actors")
          .select("id,slug,name,kana,profile,image_url,gender,sns,tags,featured_play_slugs")
          .eq("slug", key)
          .maybeSingle();
        if (error) throw error;
        if (!data) return;

        const r = data as any as ActorRow;
        setRow(r);
        setName(r.name ?? "");
        setSlugText(r.slug ?? "");
        setKana(r.kana ?? "");
        setProfile(r.profile ?? "");
        setGender((r.gender as any) ?? "male");
        setImageUrl(r.image_url ?? "");
        setTags((r.tags ?? []).join(", "));
        setFeatured((r.featured_play_slugs ?? []).join(", "));
        setSnsText(stringifyPretty(r.sns ?? {}));
      } catch (e: any) {
        setMsg(e?.message ?? "load error");
      } finally {
        setBusy(false);
      }
    };

    if (key) run();
  }, [mode, key]);

  const save = async () => {
    setMsg("");
    setBusy(true);
    try {
      const payload: any = {
        name: safeTrim(name),
        slug: safeTrim(slugText) || toSlug(name),
        kana: safeTrim(kana) || null,
        profile: safeTrim(profile) || null,
        gender: safeTrim(gender) || "male",
        image_url: safeTrim(imageUrl) || null,
        tags: parseCommaList(tags),
        featured_play_slugs: parseCommaList(featured),
        sns: parseJsonOr<any>(snsText, {}),
      };

      if (!payload.name) {
        setMsg("name は必須");
        return;
      }

      if (mode === "new") {
        const { error } = await supabase.from("actors").insert(payload);
        if (error) throw error;
        nav(`/admin/actors/${encodeURIComponent(payload.slug)}`);
      } else {
        if (!row?.slug) return;
        const { error } = await supabase.from("actors").update(payload).eq("slug", row.slug);
        if (error) throw error;
        setMsg("保存しました");
      }
    } catch (e: any) {
      setMsg(e?.message ?? "save error");
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!row?.slug) return;
    if (!confirm("削除する？（戻せない）")) return;

    setMsg("");
    setBusy(true);
    try {
      const { error } = await supabase.from("actors").delete().eq("slug", row.slug);
      if (error) throw error;
      nav("/admin/actors");
    } catch (e: any) {
      setMsg(e?.message ?? "delete error");
    } finally {
      setBusy(false);
    }
  };

  const uploadKey = safeTrim(slugText) || toSlug(name) || "tmp";

  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-white">
              {mode === "new" ? "キャスト新規" : "キャスト編集"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">画像は Storage → public URL を image_url に保存</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/actors"
              className="text-xs px-3 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
            >
              戻る
            </Link>
            <button
              onClick={save}
              disabled={busy}
              className="text-xs px-3 py-2 rounded-full bg-white/10 border border-white/10 hover:bg-white/15 font-bold"
            >
              保存
            </button>
            {mode === "edit" && (
              <button
                onClick={del}
                disabled={busy}
                className="text-xs px-3 py-2 rounded-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 text-red-200 font-bold"
              >
                削除
              </button>
            )}
          </div>
        </div>

        {msg && <div className="mt-4 text-sm text-slate-300">{msg}</div>}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <Field label="name" hint="必須">
            <input
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：鈴木 太郎"
            />
          </Field>

          <Field label="slug" hint="必須（空なら name から自動生成）">
            <input
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
              value={slugText}
              onChange={(e) => setSlugText(e.target.value)}
              placeholder="例：suzuki-taro"
            />
          </Field>

          <Field label="kana">
            <input
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
              value={kana}
              onChange={(e) => setKana(e.target.value)}
              placeholder="例：すずき たろう"
            />
          </Field>

          <Field label="gender">
            <select
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="male">male</option>
              <option value="female">female</option>
              <option value="other">other</option>
            </select>
          </Field>
        </div>

        <Field label="image" hint="添付して URL を保存（images バケット想定）">
          <div className="grid md:grid-cols-[160px_1fr] gap-4 items-start">
            <div className="w-40 h-40 rounded-2xl bg-black/40 border border-white/10 overflow-hidden">
              {imageUrl ? <img src={imageUrl} alt="preview" className="w-full h-full object-cover" /> : null}
            </div>
            <div className="space-y-3">
              <ImageUploader
                folder="actors"
                keyName={uploadKey}
                onUploaded={(url) => setImageUrl(url)}
              />
              <input
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="image_url（直接貼ってもOK）"
              />
              <p className="text-xs text-slate-500">
                ※ Supabase Storage の images バケットを public にするか、公開URL方式で運用
              </p>
            </div>
          </div>
        </Field>

        <Field label="profile">
          <textarea
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            rows={6}
            placeholder="短めでOK（公開側は必要なら後で整形）"
          />
        </Field>

        <div className="grid md:grid-cols-2 gap-6">
          <Field label="tags" hint="カンマ区切り（例：2.5次元,ミュージカル）">
            <input
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </Field>
          <Field label="featured_play_slugs" hint="カンマ区切り（例：play-a,play-b）">
            <input
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
              value={featured}
              onChange={(e) => setFeatured(e.target.value)}
            />
          </Field>
        </div>

        <Field label="sns (json)" hint='例：{ "x": "https://x.com/...", "instagram": "..." }'>
          <JsonArea value={snsText} onChange={setSnsText} rows={10} />
        </Field>
      </div>
    </div>
  );
};

export default AdminActorEdit;
