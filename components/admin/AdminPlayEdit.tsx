import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Field from "./widgets/Field";
import JsonArea from "./widgets/JsonArea";
import { parseCommaList, parseJsonOr, safeTrim, stringifyPretty, toSlug } from "./widgets/utils";

type Mode = "new" | "edit";

type FranchiseRow = { id: string; name: string };

type CreditItem = {
  role: string;
  names: string[];
  is_core?: boolean;
  sort_order?: number;
};

type CreditsObj = {
  items: CreditItem[];
};

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
  credits?: CreditsObj | null; // ★追加
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

const pasteToCreditsObj = (raw: string): CreditsObj => {
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
      // 新しい role 開始
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
      const nameLines = b.text.split("\n").map((x) => x.trim()).filter((x) => x.length > 0);

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

  return { items };
};

const creditsObjToPaste = (credits: CreditsObj | null | undefined): string => {
  const items = credits?.items ?? [];
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

const creditsStats = (credits: CreditsObj | null | undefined) => {
  const items = credits?.items ?? [];
  const roles = new Set(items.map((x) => x.role).filter(Boolean));
  const lines = items.reduce((acc, it) => acc + (it.names?.length ?? 0), 0);
  return { roles: roles.size, items: items.length, names: lines };
};
// ===== /credits helpers =====

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

  // ★追加：creditsは「貼り付けテキスト」だけを編集対象にする（ミスらない）
  const [creditsPaste, setCreditsPaste] = useState("");
  const [creditsPreview, setCreditsPreview] = useState<CreditsObj>({ items: [] });
  const [creditsErr, setCreditsErr] = useState<string>("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const loadFr = async () => {
      const { data } = await supabase.from("franchises").select("id,name").order("name", { ascending: true });
      setFrs((data ?? []) as any);
    };
    loadFr();
  }, []);

  // creditsプレビューはリアルタイム生成（保存前に気づける）
  useEffect(() => {
    try {
      setCreditsErr("");
      const obj = pasteToCreditsObj(creditsPaste);
      setCreditsPreview(obj);
    } catch (e: any) {
      setCreditsErr(e?.message ?? "credits parse error");
      setCreditsPreview({ items: [] });
    }
  }, [creditsPaste]);

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

      // credits
      setCreditsPaste("");
      setCreditsPreview({ items: [] });
      setCreditsErr("");
      return;
    }

    const run = async () => {
      setBusy(true);
      try {
        const { data, error } = await supabase
          .from("plays")
          .select("id,slug,title,summary,period,venue,vod,tags,franchise_id,credits") // ★追加
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

        // credits
        const paste = creditsObjToPaste(r.credits);
        setCreditsPaste(paste);
        setCreditsPreview(r.credits ?? { items: [] });
        setCreditsErr("");
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
      // credits：保存直前に確定パース（ここで落ちたら保存しない）
      let creditsObj: CreditsObj | null = null;
      const rawCredits = safeTrim(creditsPaste);

      if (rawCredits) {
        const parsed = pasteToCreditsObj(rawCredits);

        // 「objectであること」制約対策：必ず {items:[]} の形で保存
        creditsObj = { items: parsed.items ?? [] };

        // 事故防止：role無し or names無しの項目があれば除外
        creditsObj.items = creditsObj.items
          .map((it) => ({
            role: normalizeRole(it.role),
            names: (it.names ?? []).map((n) => normalizeNameLine(n)).filter(Boolean),
            is_core: !!it.is_core,
            sort_order: typeof it.sort_order === "number" ? it.sort_order : undefined,
          }))
          .filter((it) => it.role && it.names.length > 0);

        // ほぼ空ならnull扱いに戻す
        if (creditsObj.items.length === 0) creditsObj = null;
      }

      const payload: any = {
        title: safeTrim(title),
        slug: safeTrim(slugText) || toSlug(title),
        summary: safeTrim(summary) || null,
        period: safeTrim(period) || null,
        venue: safeTrim(venue) || null,
        franchise_id: franchiseId || null,
        tags: parseCommaList(tags),
        vod: parseJsonOr<any>(vodText, {}),
        credits: creditsObj, // ★追加
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

  const onFormatCredits = () => {
    // 現在の内容を一旦パース→整形して貼り戻す（運用ミスが減る）
    try {
      setCreditsErr("");
      const obj = pasteToCreditsObj(creditsPaste);
      const pretty = creditsObjToPaste(obj);
      setCreditsPaste(pretty);
      setCreditsPreview(obj);
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

        {/* ★追加：credits（最小の事故率を狙う設計） */}
        <Field
          label="スタッフ / クレジット（貼り付け）"
          hint="公式サイトのスタッフ欄をそのままコピペでOK。見出しは【演出】の形式推奨。保存時にDB用JSONへ自動変換します。"
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
                  setCreditsPreview({ items: [] });
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

              {creditsErr && (
                <div className="text-xs text-red-300">
                  形式エラー：{creditsErr}
                </div>
              )}
            </div>

            {/* “ド素人運用”ではJSONを触らせないのが正解なので、あえて read-only preview だけ */}
            <div className="opacity-90">
              <div className="text-xs text-slate-400 mb-1">（保存されるJSONのプレビュー / 編集不可）</div>
              <JsonArea value={stringifyPretty(creditsPreview)} onChange={() => {}} rows={8} />
            </div>
          </div>
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
