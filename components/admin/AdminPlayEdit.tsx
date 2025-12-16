import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Field from "./widgets/Field";
import JsonArea from "./widgets/JsonArea";
import { parseCommaList, parseJsonOr, safeTrim, stringifyPretty, toSlug } from "./widgets/utils";

type Mode = "new" | "edit";

type FranchiseRow = { id: string; name: string };

type PlayRow = {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  period?: string | null;
  venue?: string | null;
  vod?: any;
  tags?: string[] | null;
  franchise_id?: string | null;
};

const AdminPlayEdit: React.FC<{ mode: Mode }> = ({ mode }) => {
  const nav = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const key = useMemo(() => (slug ? decodeURIComponent(slug) : ""), [slug]);

  const [frs, setFrs] = useState<FranchiseRow[]>([]);
  const [row, setRow] = useState<PlayRow | null>(null);

  const [title, setTitle] = useState("");
  const [slugText, setSlugText] = useState("");
  const [summary, setSummary] = useState("");
  const [period, setPeriod] = useState("");
  const [venue, setVenue] = useState("");
  const [franchiseId, setFranchiseId] = useState<string>("");
  const [tags, setTags] = useState("");
  const [vodText, setVodText] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const loadFr = async () => {
      const { data } = await supabase.from("franchises").select("id,name").order("name", { ascending: true });
      setFrs((data ?? []) as any);
    };
    loadFr();
  }, []);

  useEffect(() => {
    if (mode === "new") {
      setRow(null);
      setTitle("");
      setSlugText("");
      setSummary("");
      setPeriod("");
      setVenue("");
      setFranchiseId("");
      setTags("");
      setVodText(stringifyPretty({}));
      return;
    }

    const run = async () => {
      setBusy(true);
      try {
        const { data, error } = await supabase
          .from("plays")
          .select("id,slug,title,summary,period,venue,vod,tags,franchise_id")
          .eq("slug", key)
          .maybeSingle();
        if (error) throw error;
        if (!data) return;

        const r = data as any as PlayRow;
        setRow(r);
        setTitle(r.title ?? "");
        setSlugText(r.slug ?? "");
        setSummary(r.summary ?? "");
        setPeriod(r.period ?? "");
        setVenue(r.venue ?? "");
        setFranchiseId(r.franchise_id ?? "");
        setTags((r.tags ?? []).join(", "));
        setVodText(stringifyPretty(r.vod ?? {}));
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
        title: safeTrim(title),
        slug: safeTrim(slugText) || toSlug(title),
        summary: safeTrim(summary) || null,
        period: safeTrim(period) || null,
        venue: safeTrim(venue) || null,
        franchise_id: franchiseId || null,
        tags: parseCommaList(tags),
        vod: parseJsonOr<any>(vodText, {}),
      };

      if (!payload.title) {
        setMsg("title は必須");
        return;
      }

      if (mode === "new") {
        const { error } = await supabase.from("plays").insert(payload);
        if (error) throw error;
        nav(`/admin/plays/${encodeURIComponent(payload.slug)}`);
      } else {
        if (!row?.id) return;
        const { error } = await supabase.from("plays").update(payload).eq("id", row.id);
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
      const { error } = await supabase.from("plays").delete().eq("id", row.id);
      if (error) throw error;
      nav("/admin/plays");
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
              {mode === "new" ? "作品新規" : "作品編集"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              VOD は JSON でOK（dmm/danime/unext など）
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/plays"
              className="text-xs px-3 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
            >
              戻る
            </Link>
            {mode === "edit" && row?.slug && (
              <Link
                to={`/admin/plays/${encodeURIComponent(row.slug)}/casts`}
                className="text-xs px-3 py-2 rounded-full bg-white/10 border border-white/10 hover:bg-white/15 font-bold"
              >
                出演編集
              </Link>
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
        <div className="grid md:grid-cols-2 gap-6">
          <Field label="title" hint="必須">
            <input
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：ミュージカル『〇〇』"
            />
          </Field>

          <Field label="slug" hint="空なら title から自動生成">
            <input
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
              value={slugText}
              onChange={(e) => setSlugText(e.target.value)}
              placeholder="例：musical-xxxx"
            />
          </Field>

          <Field label="period" hint="例：2019年7月 / 2017-12 / 2017年12月〜 など（SeriesDetailの年判定にも使う）">
            <input
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </Field>

          <Field label="venue">
            <input
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="例：天王洲 銀河劇場"
            />
          </Field>

          <Field label="series" hint="紐付け（任意）">
            <select
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
              value={franchiseId}
              onChange={(e) => setFranchiseId(e.target.value)}
            >
              <option value="">（なし）</option>
              {frs.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="tags" hint="カンマ区切り">
            <input
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="例：2.5次元,ミュージカル"
            />
          </Field>
        </div>

        <Field label="summary">
          <textarea
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={6}
            placeholder="短くてOK"
          />
        </Field>

        <Field
          label="vod (json)"
          hint='例：{ "dmm": "https://...", "danime": "...", "unext": "..." }'
        >
          <JsonArea value={vodText} onChange={setVodText} rows={10} />
        </Field>
      </div>
    </div>
  );
};

export default AdminPlayEdit;
