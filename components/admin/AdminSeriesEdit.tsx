// src/components/admin/series/AdminSeriesEdit.tsx

// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "../../next-app/lib/admin-router-shim";
import { supabase } from "../../next-app/lib/admin-supabase";
import Field from "./widgets/Field";
import { safeTrim, toSlug } from "./widgets/utils";

type Mode = "new" | "edit";

type OriginType =
  | ""
  | "漫画原作"
  | "アニメ原作"
  | "ゲーム原作"
  | "メディアミックス"
  | "小説原作"
  | "特撮"
  | "その他";

const ORIGIN_TYPE_OPTIONS: { value: OriginType; label: string }[] = [
  { value: "", label: "未設定" },
  { value: "漫画原作", label: "漫画原作" },
  { value: "アニメ原作", label: "アニメ原作" },
  { value: "ゲーム原作", label: "ゲーム原作" },
  { value: "メディアミックス", label: "メディアミックス" },
  { value: "小説原作", label: "小説原作" },
  { value: "特撮", label: "特撮" },
  { value: "その他", label: "その他" },
];

type FranchiseRow = {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;

  // ✅ 固定情報
  origin_type?: string | null;
  origin_note?: string | null;
  production_companies?: string[] | null;
};

const AdminSeriesEdit: React.FC<{ mode: Mode }> = ({ mode }) => {
  const nav = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const key = useMemo(() => (slug ? decodeURIComponent(slug) : ""), [slug]);

  const [row, setRow] = useState<FranchiseRow | null>(null);

  const [name, setName] = useState("");
  const [slugText, setSlugText] = useState("");
  const [desc, setDesc] = useState("");

  // ✅ 固定情報 fields
  const [originType, setOriginType] = useState<OriginType>("");
  const [originNote, setOriginNote] = useState("");
  const [productionCompaniesText, setProductionCompaniesText] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const previewKey = useMemo(
    () => safeTrim(slugText) || safeTrim(name) || (mode === "edit" ? row?.slug ?? row?.name ?? "" : ""),
    [mode, name, row?.name, row?.slug, slugText]
  );
  const previewHref = previewKey ? `/series/${encodeURIComponent(previewKey)}` : "";

  const normalizeOriginType = (v: any): OriginType => {
    const s = safeTrim(v);
    if (!s) return "";
    const hit = ORIGIN_TYPE_OPTIONS.find((o) => o.value === (s as OriginType));
    return hit ? (s as OriginType) : "";
  };

  useEffect(() => {
    if (mode === "new") {
      setRow(null);
      setName("");
      setSlugText("");
      setDesc("");

      setOriginType("");
      setOriginNote("");
      setProductionCompaniesText("");
      return;
    }

    const run = async () => {
      setBusy(true);
      try {
        const { data, error } = await supabase
          .from("franchises")
          .select(
            "id,name,slug,description,origin_type,origin_note,production_companies"
          )
          .or(`slug.eq.${key},name.eq.${key}`)
          .maybeSingle();

        if (error) throw error;
        if (!data) return;

        const r = data as any as FranchiseRow;

        setRow(r);
        setName(r.name ?? "");
        setSlugText(r.slug ?? "");
        setDesc(r.description ?? "");

        setOriginType(normalizeOriginType((r as any).origin_type));
        setOriginNote((r as any).origin_note ?? "");
        setProductionCompaniesText(
          ((r as any).production_companies ?? []).join(", ")
        );
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
        description: safeTrim(desc) || null,
      };

      // ✅ production_companies: "a, b, c" → text[]
      const companies = productionCompaniesText
        .split(",")
        .map((s) => safeTrim(s))
        .filter((s) => s.length > 0);

      // ✅ origin_type はセレクト値のみ許可（それ以外は空扱い）
      payload.origin_type = originType ? originType : null;
      payload.origin_note = safeTrim(originNote) || null;
      payload.production_companies = companies.length ? companies : null;

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
      const { error } = await supabase
        .from("franchises")
        .delete()
        .eq("id", row.id);
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
              autoIntro（作品数/VOD/年）を主役にして、固定情報＋解説（description）だけ手入れする
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/series"
              className="text-xs px-3 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
            >
              戻る
            </Link>
            {previewHref ? (
              <a
                href={previewHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 font-bold"
              >
                Preview
              </a>
            ) : (
              <span className="text-xs px-3 py-2 rounded-full bg-white/5 border border-white/10 text-slate-500">
                Preview
              </span>
            )}
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

        {/* ✅ 固定情報（変動しない要素） */}
        <Field
          label="origin_type"
          hint="原作カテゴリ（DB制約に合わせて固定選択）。未設定でもOK"
        >
          <select
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
            value={originType}
            onChange={(e) => setOriginType(e.target.value as OriginType)}
          >
            {ORIGIN_TYPE_OPTIONS.map((o) => (
              <option key={o.label} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* 小さく補足（入力事故防止） */}
          <div className="mt-2 text-[11px] text-slate-500">
            ※ここは <span className="text-slate-300">「アニメ原作」</span> まで含めた固定カテゴリで管理。
            文字入力はさせない（制約エラーを根絶）。
          </div>
        </Field>

        <Field label="production_companies" hint="制作会社（カンマ区切りで複数OK）">
          <input
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
            value={productionCompaniesText}
            onChange={(e) => setProductionCompaniesText(e.target.value)}
            placeholder="例：ネルケプランニング, マーベラス"
          />
        </Field>

        <Field label="origin_note" hint="原作補足（タイトル/作者/出版社など。短文でOK）">
          <textarea
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
            value={originNote}
            onChange={(e) => setOriginNote(e.target.value)}
            rows={3}
            placeholder="例：原作：『刀剣乱舞-ONLINE-』（DMM GAMES / Nitroplus）"
          />
        </Field>

        {/* ✅ 解説（折りたたみ表示される想定） */}
        <Field label="description" hint="解説（折りたたみ）。空なら出ない">
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
