// src/components/admin/series/AdminSeriesEdit.tsx

// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "../../next-app/lib/admin-router-shim";
import { supabase } from "../../next-app/lib/admin-supabase";
import Field from "./widgets/Field";
import { safeTrim, toSlug } from "./widgets/utils";

type Mode = "new" | "edit";

type OriginType = "" | "漫画原作" | "アニメ原作" | "ゲーム原作" | "メディアミックス" | "小説原作" | "特撮" | "その他";
type PerformanceFormat = "" | "stage" | "musical";

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

const FORMAT_OPTIONS: { value: PerformanceFormat; label: string }[] = [
  { value: "", label: "未設定" },
  { value: "stage", label: "舞台" },
  { value: "musical", label: "ミュージカル" },
];

type FranchiseRow = {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  description_en?: string | null;
  format?: string | null;
  origin_type?: string | null;
  origin_note?: string | null;
  production_companies?: string[] | null;
  related_franchise_ids?: string[] | null;
};

const AdminSeriesEdit: React.FC<{ mode: Mode }> = ({ mode }) => {
  const nav = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const key = useMemo(() => (slug ? decodeURIComponent(slug) : ""), [slug]);

  const [row, setRow] = useState<FranchiseRow | null>(null);
  const [franchises, setFranchises] = useState<FranchiseRow[]>([]);

  const [name, setName] = useState("");
  const [slugText, setSlugText] = useState("");
  const [desc, setDesc] = useState("");
  const [descEn, setDescEn] = useState("");
  const [performanceFormat, setPerformanceFormat] = useState<PerformanceFormat>("");
  const [originType, setOriginType] = useState<OriginType>("");
  const [originNote, setOriginNote] = useState("");
  const [productionCompaniesText, setProductionCompaniesText] = useState("");
  const [relatedFranchiseIds, setRelatedFranchiseIds] = useState<Set<string>>(new Set());
  const [relatedFranchiseQuery, setRelatedFranchiseQuery] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const previewKey = useMemo(
    () => safeTrim(slugText) || safeTrim(name) || (mode === "edit" ? row?.slug ?? row?.name ?? "" : ""),
    [mode, name, row?.name, row?.slug, slugText]
  );
  const previewHref = previewKey ? `/series/${encodeURIComponent(previewKey)}` : "";

  useEffect(() => {
    const loadFranchises = async () => {
      const { data } = await supabase.from("franchises").select("id,name,slug").order("name", { ascending: true });
      setFranchises((data ?? []) as FranchiseRow[]);
    };
    void loadFranchises();
  }, []);

  useEffect(() => {
    if (mode === "new") {
      setRow(null);
      setName("");
      setSlugText("");
      setDesc("");
      setDescEn("");
      setPerformanceFormat("");
      setOriginType("");
      setOriginNote("");
      setProductionCompaniesText("");
      setRelatedFranchiseIds(new Set());
      setRelatedFranchiseQuery("");
      return;
    }

    const run = async () => {
      setBusy(true);
      try {
        let data: any = null;
        let error: any = null;

        {
          const res = await supabase
            .from("franchises")
            .select("id,name,slug,description,description_en,format,origin_type,origin_note,production_companies,related_franchise_ids")
            .or(`slug.eq.${key},name.eq.${key}`)
            .maybeSingle();
          data = res.data;
          error = res.error;
        }

        if (error && /(related_franchise_ids|format|description_en)/i.test(String(error.message ?? ""))) {
          const fallback = await supabase
            .from("franchises")
            .select("id,name,slug,description,origin_type,origin_note,production_companies")
            .or(`slug.eq.${key},name.eq.${key}`)
            .maybeSingle();
          data = fallback.data
            ? { ...fallback.data, description_en: null, format: null, related_franchise_ids: [] }
            : fallback.data;
          error = fallback.error;
        }

        if (error) throw error;
        if (!data) return;

        const r = data as FranchiseRow;
        setRow(r);
        setName(r.name ?? "");
        setSlugText(r.slug ?? "");
        setDesc(r.description ?? "");
        setDescEn(r.description_en ?? "");
        setPerformanceFormat((safeTrim(r.format) as PerformanceFormat) || "");
        setOriginType((safeTrim(r.origin_type) as OriginType) || "");
        setOriginNote(r.origin_note ?? "");
        setProductionCompaniesText((r.production_companies ?? []).join(", "));
        setRelatedFranchiseIds(new Set((r.related_franchise_ids ?? []).filter(Boolean)));
        setRelatedFranchiseQuery("");
      } catch (e: any) {
        setMsg(e?.message ?? "load error");
      } finally {
        setBusy(false);
      }
    };

    if (key) void run();
  }, [mode, key]);

  const visibleRelatedFranchises = useMemo(() => {
    const query = safeTrim(relatedFranchiseQuery).toLowerCase();
    const list = franchises.filter((franchise) => franchise.id !== row?.id);
    if (!query) return list.slice(0, 50);
    return list.filter((franchise) => franchise.name.toLowerCase().includes(query)).slice(0, 50);
  }, [franchises, relatedFranchiseQuery, row?.id]);

  const toggleRelatedFranchise = (id: string) => {
    setRelatedFranchiseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      if (next.size >= 5) return next;
      next.add(id);
      return next;
    });
  };

  const save = async () => {
    setMsg("");
    setBusy(true);

    try {
      const payload: any = {
        name: safeTrim(name),
        slug: safeTrim(slugText) || toSlug(name),
        description: safeTrim(desc) || null,
        description_en: safeTrim(descEn) || null,
        format: performanceFormat || null,
        origin_type: originType || null,
        origin_note: safeTrim(originNote) || null,
      };

      const companies = productionCompaniesText
        .split(",")
        .map((s) => safeTrim(s))
        .filter((s) => s.length > 0);

      payload.production_companies = companies.length ? companies : null;
      payload.related_franchise_ids = Array.from(relatedFranchiseIds)
        .filter((id) => id !== row?.id)
        .slice(0, 5);

      if (!payload.name) {
        setMsg("name は必須です");
        return;
      }

      if (mode === "new") {
        let error: any = null;
        {
          const res = await supabase.from("franchises").insert(payload);
          error = res.error;
        }

        if (error && /(related_franchise_ids|format|description_en)/i.test(String(error.message ?? ""))) {
          const { related_franchise_ids, format, description_en, ...fallbackPayload } = payload;
          const res = await supabase.from("franchises").insert(fallbackPayload);
          error = res.error;
        }

        if (error) throw error;
        nav(`/admin/series/${encodeURIComponent(payload.slug || payload.name)}`);
      } else {
        if (!row?.id) return;

        let error: any = null;
        {
          const res = await supabase.from("franchises").update(payload).eq("id", row.id);
          error = res.error;
        }

        if (error && /(related_franchise_ids|format|description_en)/i.test(String(error.message ?? ""))) {
          const { related_franchise_ids, format, description_en, ...fallbackPayload } = payload;
          const res = await supabase.from("franchises").update(fallbackPayload).eq("id", row.id);
          error = res.error;
        }

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
    if (!confirm("削除しますか？ 元には戻せません。")) return;

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
            <h1 className="text-xl font-extrabold text-white">{mode === "new" ? "シリーズ新規" : "シリーズ編集"}</h1>
            <p className="text-xs text-slate-400 mt-1">
              シリーズ詳細の基本情報と、同作品の他シリーズ導線をここで管理します。
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
        <Field label="name" hint="シリーズ名">
          <input
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 舞台『刀剣乱舞』"
          />
        </Field>

        <Field label="slug" hint="URL用。未入力なら name から自動生成">
          <input
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
            value={slugText}
            onChange={(e) => setSlugText(e.target.value)}
            placeholder="例: butai-touken-ranbu"
          />
        </Field>

        <Field label="format" hint="上演形式。作品一覧では親シリーズの値を使って絞り込みます。">
          <select
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
            value={performanceFormat}
            onChange={(e) => setPerformanceFormat(e.target.value as PerformanceFormat)}
          >
            {FORMAT_OPTIONS.map((o) => (
              <option key={o.label} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="origin_type" hint="原作カテゴリ。未設定でもOK">
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
        </Field>

        <Field label="production_companies" hint="主催・関連。カンマ区切りで複数OK">
          <input
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
            value={productionCompaniesText}
            onChange={(e) => setProductionCompaniesText(e.target.value)}
            placeholder="例: マーベラス, ネルケプランニング"
          />
        </Field>

        <Field label="origin_note" hint="原作表記や出典情報。プレーンテキストでOK">
          <textarea
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
            value={originNote}
            onChange={(e) => setOriginNote(e.target.value)}
            rows={3}
            placeholder="例: 原作『刀剣乱舞ONLINE』より"
          />
        </Field>

        <Field label="related series" hint="同作品の他シリーズ。最大5件まで、シリーズ詳細に表示されます。">
          <div className="space-y-3">
            <input
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
              value={relatedFranchiseQuery}
              onChange={(e) => setRelatedFranchiseQuery(e.target.value)}
              placeholder="シリーズ名で検索"
            />

            <div className="flex flex-wrap gap-2">
              {Array.from(relatedFranchiseIds).map((id) => {
                const selected = franchises.find((f) => f.id === id);
                if (!selected) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleRelatedFranchise(id)}
                    className="text-xs px-3 py-2 rounded-full bg-white/10 border border-white/10 hover:bg-white/15"
                  >
                    {selected.name} ×
                  </button>
                );
              })}
              {relatedFranchiseIds.size === 0 ? <span className="text-xs text-slate-500">未設定</span> : null}
            </div>

            <div className="grid gap-2 max-h-64 overflow-auto">
              {visibleRelatedFranchises.map((franchise) => {
                const checked = relatedFranchiseIds.has(franchise.id);
                const disabled = !checked && relatedFranchiseIds.size >= 5;
                return (
                  <label
                    key={franchise.id}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                      checked ? "border-white/20 bg-white/10" : "border-white/10 bg-black/30 hover:bg-white/5"
                    } ${disabled ? "opacity-50" : ""}`}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-white">{franchise.name}</div>
                      <div className="truncate text-[11px] text-slate-500">{franchise.slug || "-"}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleRelatedFranchise(franchise.id)}
                      className="accent-white"
                    />
                  </label>
                );
              })}
            </div>

            <p className="text-xs text-slate-500">{relatedFranchiseIds.size}/5件選択中</p>
          </div>
        </Field>

        <Field label="description" hint="シリーズ概要。未入力でも可">
          <textarea
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={10}
            placeholder="シリーズ説明や補足情報を記入"
          />
        </Field>

        <Field label="description_en" hint="English series description for /en pages">
          <textarea
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
            value={descEn}
            onChange={(e) => setDescEn(e.target.value)}
            rows={8}
            placeholder="Write an English series overview for /en/series pages."
          />
        </Field>
      </div>
    </div>
  );
};

export default AdminSeriesEdit;
