import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Field from "./widgets/Field";
import { safeTrim, toSlug } from "./widgets/utils";

type Mode = "new" | "edit";

type FranchiseRow = {
  id: string;
  name: string;
  slug?: string | null;
  intro?: string | null;
  description?: string | null;
};

const AdminSeriesEdit: React.FC<{ mode: Mode }> = ({ mode }) => {
  const nav = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const key = useMemo(() => (slug ? decodeURIComponent(slug) : ""), [slug]);

  const [row, setRow] = useState<FranchiseRow | null>(null);
  const [name, setName] = useState("");
  const [slugText, setSlugText] = useState("");
  const [intro, setIntro] = useState("");
  const [desc, setDesc] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (mode === "new") {
      setRow(null);
      setName("");
      setSlugText("");
      setIntro("");
      setDesc("");
      return;
    }

    const run = async () => {
      setBusy(true);
      try {
        const { data, error } = await supabase
          .from("franchises")
          .select("id,name,slug,intro,description")
          .or(`slug.eq.${key},name.eq.${key}`)
          .maybeSingle();
        if (error) throw error;
        if (!data) return;

        const r = data as any as FranchiseRow;
        setRow(r);
        setName(r.name ?? "");
        setSlugText(r.slug ?? "");
        setIntro(r.intro ?? "");
        setDesc(r.description ?? "");
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
        intro: safeTrim(intro) || null,
        description: safeTrim(desc) || null,
      };

      if (!payload.name) {
        setMsg("name は必須");
        return;
      }

      if (mode === "new") {
        const { error } = await supabase.from("franchises").insert(payload);
        if (error) throw error;
        nav(`/admin/series/${encodeURIComponent(payload.slug || payload.name)}`);
      } else {
        if (!row?.id) return;
        const { error } = await supabase
          .from("franchises")
          .update(payload)
          .eq("id", row.id);
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
    if (!row?.id) return;
    if (!confirm("削除する？（戻せない）")) return;

    setMsg("");
    setBusy(true);
    try {
      const { error } = await supabase.from("franchises").delete().eq("id", row.id);
      if (error) throw error;
      nav("/admin/series");
    } catch (e: any) {
      setMsg(e?.message ?? "delete error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-white">
              {mode === "new" ? "シリーズ新規" : "シリーズ編集"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              autoIntro（作品数/VOD/年）に <b>追記</b> する目的で使う
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/series"
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
        <Field label="name" hint="表示名（必須）">
          <input
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：刀剣乱舞"
          />
        </Field>

        <Field label="slug" hint="URL用。空なら name から自動生成される">
          <input
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
            value={slugText}
            onChange={(e) => setSlugText(e.target.value)}
            placeholder="例：toukenranbu"
          />
        </Field>

        <Field label="intro" hint="短文（上部）。空なら autoIntro のみで表示">
          <textarea
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            rows={4}
            placeholder="例：初見向けに“世界観/見どころ/入り口”を短く"
          />
        </Field>

        <Field label="description" hint="長文（折りたたみ）。空なら出ない">
          <textarea
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={10}
            placeholder="例：初心者向けの観劇前提/配信の見方/派生作品の差分…など。長くてOK"
          />
        </Field>
      </div>
    </div>
  );
};

export default AdminSeriesEdit;
