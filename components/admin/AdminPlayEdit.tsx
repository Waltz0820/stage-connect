// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "../../next-app/lib/admin-router-shim";
import { supabase } from "../../next-app/lib/admin-supabase";
import Field from "./widgets/Field";
import JsonArea from "./widgets/JsonArea";
import TagMultiSelect, { TagRow } from "./widgets/TagMultiSelect";
import { parseJsonOr, safeTrim, stringifyPretty, toSlug } from "./widgets/utils";
import { GENRE_LABELS, type PlayGenre } from "../../lib/types";

type Mode = "new" | "edit";

type FranchiseRow = { id: string; name: string };

type CreditItem = {
  role: string;
  names: string[];
  is_core?: boolean;
  sort_order?: number;
};

type PlayRow = {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  summary_en?: string | null;
  period?: string | null;
  venue?: string | null;
  genre?: PlayGenre | null;
  vod?: any;
  franchise_id?: string | null;
  credits?: CreditItem[] | null;
};

type VodValue = {
  dmm?: string;
  danime?: string;
  unext?: string;
};

// ===== credits helpers =====
const CORE_ROLE_ORDER = [
  "原案",
  "原作",
  "演出",
  "脚本",
  "脚色",
  "作詞",
  "作曲",
  "音楽",
  "振付",
  "振付・ステージング",
  "ステージング",
  "主催",
  "企画",
  "制作",
  "製作",
  "製作委員会",
] as const;

const CORE_ROLE_SET = new Set<string>(CORE_ROLE_ORDER as unknown as string[]);

// 例：【演出】 / [演出] / 演出：
const ROLE_LINE_RE = /^\s*(?:【(.+?)】|\[(.+?)\]|(.+?)[:：])\s*$/;

const normalizeRole = (s: string) =>
  safeTrim(s)
    .replace(/\s+/g, " ")
    .replace(/^スタッフ\s*\/\s*クレジット$/i, "スタッフ/クレジット");

const normalizeNameLine = (s: string) => safeTrim(s.replace(/[ \t]+/g, " "));

const splitNamesSmart = (text: string): string[] => {
  // 人名を過剰に分割して事故るのが一番まずいので「基本は1行=1要素」
  // ただし「A　B」みたいな全角スペース区切りの羅列は分ける
  const t = normalizeNameLine(text);
  if (!t) return [];
  const hasMany = /　/.test(t) && t.length <= 80; // 全角スペース羅列っぽいときだけ
  if (hasMany) {
    return t
      .split("　")
      .map((x) => safeTrim(x))
      .filter(Boolean);
  }
  return [t];
};

const pasteToCreditsArray = (raw: string): CreditItem[] => {
  const lines = (raw ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+$/g, "")); // 右側だけトリム

  let currentRole = "";
  let buffer: string[] = [];
  const blocks: Array<{ role: string; text: string }> = [];

  const flush = () => {
    const role = normalizeRole(currentRole);
    const text = buffer.join("\n").trim();
    if (role && text) blocks.push({ role, text });
    buffer = [];
  };

  for (const line of lines) {
    const m = line.match(ROLE_LINE_RE);
    if (m) {
      flush();
      currentRole = normalizeRole(m[1] || m[2] || m[3] || "");
      continue;
    }

    // role 未指定の先頭テキストは捨てる（事故防止）
    if (!currentRole) continue;

    // 連続空行は1つに圧縮
    if (line.trim() === "") {
      if (buffer.length > 0 && buffer[buffer.length - 1].trim() !== "") buffer.push("");
      continue;
    }

    buffer.push(line);
  }
  flush();

  const items: CreditItem[] = [];
  let sort = 1;

  // coreを優先表示させたいので、役割の並びを調整
  const roleRank = (role: string) => {
    const idx = CORE_ROLE_ORDER.findIndex((r) => r === role);
    return idx === -1 ? 10_000 : idx;
  };

  blocks
    .sort((a, b) => roleRank(a.role) - roleRank(b.role) || a.role.localeCompare(b.role))
    .forEach((b) => {
      // 役割の中身は「行単位」を基本に、安全に扱う
      const nameLines = b.text
        .split("\n")
        .map((x) => x.trim())
        .filter((x) => x.length > 0);

      // 「本山新之助 DAZZLE」みたいなケースは同一行に保持したい
      const names = nameLines.flatMap(splitNamesSmart).filter(Boolean);

      const isCore = CORE_ROLE_SET.has(b.role);
      items.push({
        role: b.role,
        names,
        is_core: isCore,
        sort_order: sort++,
      });
    });

  return items;
};

const creditsArrayToPaste = (credits: CreditItem[] | null | undefined): string => {
  const items = credits ?? [];
  if (!items.length) return "";

  // sort_order優先
  const sorted = [...items].sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999));

  const parts: string[] = [];
  for (const it of sorted) {
    const role = normalizeRole(it.role);
    const names = (it.names ?? []).map((n) => normalizeNameLine(n)).filter(Boolean);
    if (!role || names.length === 0) continue;

    parts.push(`【${role}】`);
    parts.push(...names);
    parts.push(""); // blank line
  }
  return parts.join("\n").trim() + "\n";
};

const creditsStats = (credits: CreditItem[] | null | undefined) => {
  const items = credits ?? [];
  const roles = new Set(items.map((x) => x.role).filter(Boolean));
  const lines = items.reduce((acc, it) => acc + (it.names?.length ?? 0), 0);
  return { roles: roles.size, items: items.length, names: lines };
};
// ===== /credits helpers =====

const MAX_TAGS = 4;
const PLAY_GENRES = Object.keys(GENRE_LABELS) as PlayGenre[];
const pickVod = (value: any): VodValue => ({
  dmm: safeTrim(value?.dmm) || undefined,
  danime: safeTrim(value?.danime) || undefined,
  unext: safeTrim(value?.unext) || undefined,
});

const AdminPlayEdit: React.FC<{ mode: Mode }> = ({ mode }) => {
  const nav = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const key = useMemo(() => (slug ? decodeURIComponent(slug) : ""), [slug]);

  const [frs, setFrs] = useState<FranchiseRow[]>([]);
  const [row, setRow] = useState<PlayRow | null>(null);

  const [title, setTitle] = useState("");
  const [slugText, setSlugText] = useState("");
  const [summary, setSummary] = useState("");
  const [summaryEn, setSummaryEn] = useState("");
  const [period, setPeriod] = useState("");
  const [venue, setVenue] = useState("");
  const [genre, setGenre] = useState<PlayGenre | "">("");
  const [franchiseId, setFranchiseId] = useState<string>("");
  const [franchiseQuery, setFranchiseQuery] = useState("");
  const [vodText, setVodText] = useState("");
  const [vodForm, setVodForm] = useState<VodValue>({});

  // ★ tags（公式）: tags/play_tags を正として運用。plays.tags は触らない。
  const [allTags, setAllTags] = useState<TagRow[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [tagsErr, setTagsErr] = useState<string>("");

  // ★ creditsは「貼り付けテキスト」だけを編集対象にする（ミスらない）
  const [creditsPaste, setCreditsPaste] = useState("");
  const [creditsPreview, setCreditsPreview] = useState<CreditItem[]>([]);
  const [creditsErr, setCreditsErr] = useState<string>("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const previewSlug = useMemo(() => safeTrim(slugText) || (mode === "edit" ? row?.slug ?? "" : ""), [mode, row?.slug, slugText]);
  const previewHref = previewSlug ? `/plays/${encodeURIComponent(previewSlug)}` : "";

  useEffect(() => {
    const loadFr = async () => {
      const { data } = await supabase.from("franchises").select("id,name").order("name", { ascending: true });
      setFrs((data ?? []) as FranchiseRow[]);
    };
    loadFr();
  }, []);

  useEffect(() => {
    const loadTags = async () => {
      setTagsErr("");

      // ① is_active ありで試す
      let res = await supabase
        .from("tags")
        .select("id,slug,name,type,description,is_active")
        .order("type", { ascending: true })
        .order("name", { ascending: true });

      // ② is_active が無い環境ならフォールバック
      if (res.error && /is_active/i.test(res.error.message)) {
        res = await supabase
          .from("tags")
          .select("id,slug,name,type,description")
          .order("type", { ascending: true })
          .order("name", { ascending: true });
      }

      if (res.error) {
        console.warn("[admin plays] load tags error", res.error);
        setTagsErr(res.error.message);
        setAllTags([]);
        return;
      }

      const rows = ((res.data ?? []) as any) as TagRow[];

      // is_active がある場合だけ効かせる（無い場合は全部OK）
      const active = rows.filter((t) =>
        typeof (t as any).is_active === "boolean" ? (t as any).is_active !== false : true
      );
      setAllTags(active);
    };

    loadTags();
  }, []);

  // creditsプレビューはリアルタイム生成（保存前に気づける）
  useEffect(() => {
    try {
      setCreditsErr("");
      const arr = pasteToCreditsArray(creditsPaste);
      setCreditsPreview(arr);
    } catch (e: any) {
      setCreditsErr(e?.message ?? "credits parse error");
      setCreditsPreview([]);
    }
  }, [creditsPaste]);

  const syncPlayTags = async (playId: string, ids: Set<string>) => {
    const picked = Array.from(ids).slice(0, MAX_TAGS);

    const delRes = await supabase.from("play_tags").delete().eq("play_id", playId);
    if (delRes.error) throw delRes.error;

    if (picked.length > 0) {
      const insRes = await supabase.from("play_tags").insert(
        picked.map((tagId) => ({
          play_id: playId,
          tag_id: tagId,
        }))
      );
      if (insRes.error) throw insRes.error;
    }
  };

  useEffect(() => {
    if (mode === "new") {
      setRow(null);
      setTitle("");
      setSlugText("");
      setSummary("");
      setSummaryEn("");
      setPeriod("");
      setVenue("");
      setGenre("");
      setFranchiseId("");
      setFranchiseQuery("");
      setVodText(stringifyPretty({}));
      setVodForm({});

      // tags
      setSelectedTagIds(new Set());

      // credits
      setCreditsPaste("");
      setCreditsPreview([]);
      setCreditsErr("");
      return;
    }

    const run = async () => {
      setBusy(true);
      try {
        let data: any = null;
        let error: any = null;

        {
          const res = await supabase
            .from("plays")
            .select("id,slug,title,summary,summary_en,period,venue,genre,vod,franchise_id,credits")
            .eq("slug", key)
            .maybeSingle();
          data = res.data;
          error = res.error;
        }

        if (error && /summary_en/i.test(String(error.message ?? ""))) {
          const fallback = await supabase
            .from("plays")
            .select("id,slug,title,summary,period,venue,genre,vod,franchise_id,credits")
            .eq("slug", key)
            .maybeSingle();
          data = fallback.data ? { ...fallback.data, summary_en: null } : fallback.data;
          error = fallback.error;
        }
        if (error) throw error;
        if (!data) return;

        const r = data as PlayRow;
        setRow(r);
        setTitle(r.title ?? "");
        setSlugText(r.slug ?? "");
        setSummary(r.summary ?? "");
        setSummaryEn(r.summary_en ?? "");
        setPeriod(r.period ?? "");
        setVenue(r.venue ?? "");
        setGenre((r.genre as PlayGenre | null) ?? "");
        setFranchiseId(r.franchise_id ?? "");
        setFranchiseQuery("");
        const nextVod = pickVod(r.vod ?? {});
        setVodText(stringifyPretty(nextVod));
        setVodForm(nextVod);

        // tags（play_tags）
        const { data: pt, error: ptErr } = await supabase.from("play_tags").select("tag_id").eq("play_id", r.id);
        if (ptErr) {
          console.warn("[admin plays] load play_tags error", ptErr);
          setSelectedTagIds(new Set());
        } else {
          const s = new Set<string>((pt ?? []).map((x: any) => x.tag_id).filter(Boolean));
          setSelectedTagIds(s);
        }

        // credits
        const paste = creditsArrayToPaste(r.credits);
        setCreditsPaste(paste);
        setCreditsPreview(r.credits ?? []);
        setCreditsErr("");
      } catch (e: any) {
        setMsg(e?.message ?? "load error");
      } finally {
        setBusy(false);
      }
    };

    if (key) run();
  }, [mode, key]);

  useEffect(() => {
    if (!franchiseId) return;
    if (franchiseQuery.trim()) return;
    const selected = frs.find((f) => f.id === franchiseId);
    if (selected) setFranchiseQuery(selected.name);
  }, [franchiseId, frs, franchiseQuery]);

  const visibleFranchises = useMemo(() => {
    const query = safeTrim(franchiseQuery).toLowerCase();
    if (!query) return frs.slice(0, 50);
    return frs.filter((f) => f.name.toLowerCase().includes(query)).slice(0, 50);
  }, [frs, franchiseQuery]);

  const updateVodField = (field: keyof VodValue, value: string) => {
    setVodForm((current) => {
      const next = {
        ...current,
        [field]: safeTrim(value) || undefined,
      };
      setVodText(stringifyPretty(next));
      return next;
    });
  };

  const handleVodTextChange = (value: string) => {
    setVodText(value);
    const parsed = parseJsonOr<any>(value, null);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      setVodForm(pickVod(parsed));
    }
  };

  const save = async () => {
    setMsg("");
    setBusy(true);

    try {
      // credits：保存直前に確定パース（ここで落ちたら保存しない）
      let creditsValue: CreditItem[] | null = null;
      const rawCredits = safeTrim(creditsPaste);

      if (rawCredits) {
        const parsed = pasteToCreditsArray(rawCredits);

        creditsValue = (parsed ?? [])
          .map((it) => ({
            role: normalizeRole(it.role),
            names: (it.names ?? []).map((n) => normalizeNameLine(n)).filter(Boolean),
            is_core: !!it.is_core,
            sort_order: typeof it.sort_order === "number" ? it.sort_order : undefined,
          }))
          .filter((it) => it.role && it.names.length > 0);

        // ほぼ空ならnull扱いに戻す
        if (creditsValue.length === 0) creditsValue = null;
      }

      const payload: any = {
        title: safeTrim(title),
        slug: safeTrim(slugText) || toSlug(title),
        summary: safeTrim(summary) || null,
        summary_en: safeTrim(summaryEn) || null,
        period: safeTrim(period) || null,
        venue: safeTrim(venue) || null,
        genre: genre || null,
        franchise_id: franchiseId || null,
        vod: parseJsonOr<any>(vodText, {}),
        credits: creditsValue,
      };

      if (!payload.title) {
        setMsg("title は必須");
        return;
      }

      if (creditsErr) {
        setMsg(`スタッフ/クレジットの形式が読めない：${creditsErr}`);
        return;
      }

      if (mode === "new") {
        let created: any = null;
        let error: any = null;
        {
          const res = await supabase.from("plays").insert(payload).select("id,slug").single();
          created = res.data;
          error = res.error;
        }
        if (error && /summary_en/i.test(String(error.message ?? ""))) {
          const { summary_en, ...fallbackPayload } = payload;
          const res = await supabase.from("plays").insert(fallbackPayload).select("id,slug").single();
          created = res.data;
          error = res.error;
        }
        if (error) throw error;

        await syncPlayTags(created.id, selectedTagIds);
        nav(`/admin/plays/${encodeURIComponent(created.slug)}`);
      } else {
        if (!row?.id) return;

        let error: any = null;
        {
          const res = await supabase.from("plays").update(payload).eq("id", row.id);
          error = res.error;
        }
        if (error && /summary_en/i.test(String(error.message ?? ""))) {
          const { summary_en, ...fallbackPayload } = payload;
          const res = await supabase.from("plays").update(fallbackPayload).eq("id", row.id);
          error = res.error;
        }
        if (error) throw error;

        await syncPlayTags(row.id, selectedTagIds);
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

  const onFormatCredits = () => {
    // 現在の内容を一旦パース→整形して貼り戻す（運用ミスが減る）
    try {
      setCreditsErr("");
      const arr = pasteToCreditsArray(creditsPaste);
      const pretty = creditsArrayToPaste(arr);
      setCreditsPaste(pretty);
      setCreditsPreview(arr);
      setMsg("クレジットを整形しました（保存して確定）");
    } catch (e: any) {
      setCreditsErr(e?.message ?? "credits parse error");
      setMsg("クレジットの整形に失敗：見出し行（【演出】など）を確認してね");
    }
  };

  const stats = creditsStats(creditsPreview);

  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-white">{mode === "new" ? "作品新規" : "作品編集"}</h1>
            <p className="text-xs text-slate-400 mt-1">VOD は JSON でOK（dmm/danime/unext など）</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/plays"
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
            <div className="space-y-3">
              <input
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
                value={franchiseQuery}
                onChange={(e) => setFranchiseQuery(e.target.value)}
                placeholder="シリーズ名で検索"
              />
              <select
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
                value={franchiseId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setFranchiseId(nextId);
                  const selected = frs.find((f) => f.id === nextId);
                  if (selected) setFranchiseQuery(selected.name);
                }}
              >
                <option value="">（なし）</option>
                {visibleFranchises.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">
                {safeTrim(franchiseQuery)
                  ? `${visibleFranchises.length}件表示中`
                  : `全${frs.length}件中、先頭50件を表示`}
              </p>
            </div>
          </Field>

          <Field label="genre" hint="一覧の絞り込みや作品カード表示に使います">
            <select
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
              value={genre}
              onChange={(e) => setGenre((e.target.value as PlayGenre | "") || "")}
            >
              <option value="">未設定</option>
              {PLAY_GENRES.map((value) => (
                <option key={value} value={value}>
                  {GENRE_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>

          <div />
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

        {/* tags（公式） */}
        <Field label="tags（公式）" hint={`最大${MAX_TAGS}つ。横断テーマだけ（ジャンル/シリーズと被らせない）`}>
          <div className="space-y-2">
            {tagsErr && <div className="text-xs text-red-300">tags の読み込みに失敗：{tagsErr}</div>}
            <TagMultiSelect
              allTags={allTags}
              selectedIds={selectedTagIds}
              onChange={(next) => setSelectedTagIds(new Set(next))}
              max={MAX_TAGS}
              hint="検索→クリックで追加。上のチップをクリックで解除。"
            />
          </div>
        </Field>

        {/* credits */}
        <Field
          label="スタッフ / クレジット（貼り付け）"
          hint="公式サイトのスタッフ欄をそのままコピペでOK。見出しは【演出】の形式推奨。保存時にDB用JSON配列へ自動変換します。"
        >
          <div className="space-y-3">
            <textarea
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
              value={creditsPaste}
              onChange={(e) => setCreditsPaste(e.target.value)}
              rows={10}
              placeholder={`例：
【原案】
「刀剣乱舞-ONLINE-」より (DMM GAMES/Nitroplus)

【演出】
茅野イサム

【脚本】
御笠ノ忠次

【主催】
ミュージカル『刀剣乱舞』製作委員会
（ネルケプランニング　ニトロプラス　DMM GAMES　ユークリッド・エージェンシー）
`}
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onFormatCredits}
                className="text-xs px-3 py-2 rounded-full bg-white/10 border border-white/10 hover:bg-white/15 font-bold"
              >
                整形する
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreditsPaste("");
                  setCreditsPreview([]);
                  setCreditsErr("");
                }}
                className="text-xs px-3 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
              >
                クリア
              </button>

              <div className="text-xs text-slate-400">
                プレビュー：役割 <b className="text-slate-200">{stats.roles}</b> / 項目{" "}
                <b className="text-slate-200">{stats.items}</b> / 行{" "}
                <b className="text-slate-200">{stats.names}</b>
              </div>

              {creditsErr && <div className="text-xs text-red-300">形式エラー：{creditsErr}</div>}
            </div>

            <div className="opacity-90">
              <div className="text-xs text-slate-400 mb-1">（保存されるJSON配列のプレビュー / 編集不可）</div>
              <JsonArea value={stringifyPretty(creditsPreview)} onChange={() => {}} rows={8} />
            </div>
          </div>
        </Field>

        <Field label="vod helper" hint="URLを入れると JSON に自動反映。下の JSON 直打ちも可">
          <div className="grid md:grid-cols-3 gap-4">
            <input
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
              value={vodForm.dmm ?? ""}
              onChange={(e) => updateVodField("dmm", e.target.value)}
              placeholder="DMM URL"
            />
            <input
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
              value={vodForm.danime ?? ""}
              onChange={(e) => updateVodField("danime", e.target.value)}
              placeholder="dアニメ URL"
            />
            <input
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
              value={vodForm.unext ?? ""}
              onChange={(e) => updateVodField("unext", e.target.value)}
              placeholder="U-NEXT URL"
            />
          </div>
        </Field>

        <Field label="vod (json)" hint='例：{ "dmm": "https://...", "danime": "...", "unext": "..." }'>
          <JsonArea value={vodText} onChange={handleVodTextChange} rows={10} />
        </Field>
        <Field label="summary_en" hint="English synopsis for /en/plays pages">
          <textarea
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
            value={summaryEn}
            onChange={(e) => setSummaryEn(e.target.value)}
            rows={6}
            placeholder="Write an English synopsis for /en/plays pages."
          />
        </Field>
      </div>
    </div>
  );
};

export default AdminPlayEdit;
