// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Field from "./widgets/Field";
import { safeTrim, toSlug } from "./widgets/utils";

type Mode = "new" | "edit";
type GuideCategory = "series-guides" | "features";

type EditorialRow = {
  id: string;
  slug: string;
  title: string;
  category?: GuideCategory | null;
  summary?: string | null;
  content?: string | null;
  status?: string | null;
  published_at?: string | null;
  related_franchise_ids?: string[] | null;
};

type FranchiseRow = {
  id: string;
  name: string;
  slug?: string | null;
};

const CATEGORY_LABELS: Record<GuideCategory, string> = {
  "series-guides": "シリーズ整理",
  features: "編集部ピックアップ",
};

const GUIDE_CATEGORIES = Object.keys(CATEGORY_LABELS) as GuideCategory[];

const STATUS_OPTIONS = [
  { value: "draft", label: "下書き" },
  { value: "published", label: "公開" },
] as const;

const AdminGuideEdit: React.FC<{ mode: Mode }> = ({ mode }) => {
  const nav = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const key = useMemo(() => (slug ? decodeURIComponent(slug) : ""), [slug]);

  const [row, setRow] = useState<EditorialRow | null>(null);
  const [franchises, setFranchises] = useState<FranchiseRow[]>([]);

  const [title, setTitle] = useState("");
  const [slugText, setSlugText] = useState("");
  const [category, setCategory] = useState<GuideCategory>("series-guides");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [publishedAt, setPublishedAt] = useState("");
  const [selectedFranchiseIds, setSelectedFranchiseIds] = useState<Set<string>>(new Set());

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const previewSlug = useMemo(() => safeTrim(slugText) || (mode === "edit" ? row?.slug ?? "" : ""), [mode, row?.slug, slugText]);
  const previewHref = previewSlug ? `/guide/${encodeURIComponent(previewSlug)}?preview=1` : "";

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
      setTitle("");
      setSlugText("");
      setCategory("series-guides");
      setSummary("");
      setContent("");
      setStatus("draft");
      setPublishedAt("");
      setSelectedFranchiseIds(new Set());
      return;
    }

    const run = async () => {
      setBusy(true);
      try {
        const { data, error } = await supabase
          .from("editorials")
          .select("id,slug,title,category,summary,content,status,published_at,related_franchise_ids")
          .eq("slug", key)
          .maybeSingle();

        if (error) throw error;
        if (!data) return;

        const r = data as EditorialRow;
        setRow(r);
        setTitle(r.title ?? "");
        setSlugText(r.slug ?? "");
        setCategory((r.category as GuideCategory | null) ?? "series-guides");
        setSummary(r.summary ?? "");
        setContent(r.content ?? "");
        setStatus((r.status as "draft" | "published" | null) ?? "draft");
        setPublishedAt(r.published_at ? String(r.published_at).slice(0, 10) : "");
        setSelectedFranchiseIds(new Set((r.related_franchise_ids ?? []).filter(Boolean)));
      } catch (e: any) {
        setMsg(e?.message ?? "load error");
      } finally {
        setBusy(false);
      }
    };

    if (key) void run();
  }, [mode, key]);

  const toggleFranchise = (id: string) => {
    setSelectedFranchiseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = async () => {
    setMsg("");
    setBusy(true);

    try {
      const nextSlug = safeTrim(slugText) || toSlug(title);
      const nextTitle = safeTrim(title);
      if (!nextTitle) {
        setMsg("title は必須です");
        return;
      }

      const payload = {
        slug: nextSlug,
        title: nextTitle,
        category,
        summary: safeTrim(summary) || null,
        content: safeTrim(content) || null,
        status,
        published_at: status === "published" ? (publishedAt ? `${publishedAt}T00:00:00+09:00` : new Date().toISOString()) : null,
        related_franchise_ids: Array.from(selectedFranchiseIds),
      };

      if (mode === "new") {
        const { data, error } = await supabase.from("editorials").insert(payload).select("slug").single();
        if (error) throw error;
        nav(`/admin/guides/${encodeURIComponent((data as any).slug)}`);
        return;
      }

      if (!row?.id) return;

      const { error } = await supabase.from("editorials").update(payload).eq("id", row.id);
      if (error) throw error;
      setMsg("保存しました");
    } catch (e: any) {
      setMsg(e?.message ?? "save error");
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!row?.id) return;
    if (!confirm("削除しますか？")) return;

    setMsg("");
    setBusy(true);
    try {
      const { error } = await supabase.from("editorials").delete().eq("id", row.id);
      if (error) throw error;
      nav("/admin/guides");
    } catch (e: any) {
      setMsg(e?.message ?? "delete error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-white">{mode === "new" ? "編集部ガイド新規" : "編集部ガイド編集"}</h1>
            <p className="mt-1 text-xs text-slate-400">シリーズ整理と編集部ピックアップの2カテゴリを先行運用します。</p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/admin/guides" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10">
              戻る
            </Link>
            {previewHref ? (
              <a
                href={previewHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold hover:bg-white/10"
              >
                Preview
              </a>
            ) : (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-500">
                Preview
              </span>
            )}
            <button
              onClick={save}
              disabled={busy}
              className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15"
            >
              保存
            </button>
            {mode === "edit" && (
              <button
                onClick={del}
                disabled={busy}
                className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200 hover:bg-red-500/15"
              >
                削除
              </button>
            )}
          </div>
        </div>

        {msg && <div className="mt-4 text-sm text-slate-300">{msg}</div>}
      </div>

      <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="title" hint="必須">
            <input
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: テニミュはどこから見る？"
            />
          </Field>

          <Field label="slug" hint="未入力なら title から自動生成">
            <input
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
              value={slugText}
              onChange={(e) => setSlugText(e.target.value)}
              placeholder="tennimu-roadmap"
            />
          </Field>

          <Field label="category" hint="最初は2カテゴリのみ">
            <select
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value as GuideCategory)}
            >
              {GUIDE_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {CATEGORY_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="status">
            <select
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "published")}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="published_at" hint="公開時だけ使います">
            <input
              type="date"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
            />
          </Field>
        </div>

        <Field label="summary" hint="一覧・OG説明に使う短い導入">
          <textarea
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
          />
        </Field>

        <Field label="related series" hint="シリーズ詳細の関連記事に出すための紐づけ">
          <div className="grid gap-2 sm:grid-cols-2">
            {franchises.map((franchise) => {
              const checked = selectedFranchiseIds.has(franchise.id);
              return (
                <label
                  key={franchise.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ${
                    checked ? "border-white/20 bg-white/10" : "border-white/10 bg-black/30 hover:bg-white/5"
                  }`}
                >
                  <input type="checkbox" checked={checked} onChange={() => toggleFranchise(franchise.id)} className="accent-white" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-white">{franchise.name}</div>
                    <div className="truncate text-[11px] text-slate-500">{franchise.slug || "-"}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </Field>

        <Field label="content" hint="まずはプレーンテキスト運用で十分です。後からリッチ化できます。">
          <textarea
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={18}
          />
        </Field>
      </div>
    </div>
  );
};

export default AdminGuideEdit;
