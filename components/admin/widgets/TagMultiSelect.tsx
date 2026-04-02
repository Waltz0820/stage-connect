// @ts-nocheck
import React, { useMemo, useState } from "react";

export type TagRow = {
  id: string;
  slug: string;
  name: string;
  type: string; // "world" | "experience" | "origin" など
  description?: string | null;
  is_active?: boolean | null;
};

type Props = {
  allTags: TagRow[];
  selectedIds: Set<string>;
  onChange: (next: Set<string>) => void;
  max: number;

  /** 見た目調整（任意） */
  title?: string;
  hint?: string;
  showSlug?: boolean;
};

const typeLabel = (type: string) => {
  const t = (type ?? "").toLowerCase();
  if (t === "world") return "WORLD";
  if (t === "experience") return "EXPERIENCE";
  if (t === "origin") return "ORIGIN";
  return (type || "OTHER").toUpperCase();
};

const badgeClassByType = (type: string) => {
  const t = (type ?? "").toLowerCase();
  if (t === "experience") return "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan";
  if (t === "origin") return "bg-neon-purple/10 border-neon-purple/30 text-neon-purple";
  if (t === "world") return "bg-white/5 border-white/10 text-slate-200";
  return "bg-white/5 border-white/10 text-slate-200";
};

const safe = (s: any) => (typeof s === "string" ? s : "").trim();

const TagMultiSelect: React.FC<Props> = ({
  allTags,
  selectedIds,
  onChange,
  max,
  title = "tags（公式）",
  hint,
  showSlug = false,
}) => {
  const [q, setQ] = useState("");

  const selected = useMemo(() => {
    const map = new Map(allTags.map((t) => [t.id, t]));
    return Array.from(selectedIds)
      .map((id) => map.get(id))
      .filter(Boolean) as TagRow[];
  }, [allTags, selectedIds]);

  const grouped = useMemo(() => {
    const query = safe(q).toLowerCase();
    const src = allTags.filter((t) => t.is_active !== false);

    const filtered = !query
      ? src
      : src.filter((t) => {
          const name = safe(t.name).toLowerCase();
          const slug = safe(t.slug).toLowerCase();
          const desc = safe(t.description).toLowerCase();
          const type = safe(t.type).toLowerCase();
          return (
            name.includes(query) ||
            slug.includes(query) ||
            desc.includes(query) ||
            type.includes(query)
          );
        });

    return filtered.reduce<Record<string, TagRow[]>>((acc, t) => {
      const k = t.type || "other";
      acc[k] = acc[k] ?? [];
      acc[k].push(t);
      return acc;
    }, {});
  }, [allTags, q]);

  const reached = selectedIds.size >= max;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-white">{title}</div>
          {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
        </div>

        <div className="text-xs text-slate-400">
          選択：<b className="text-slate-200">{selectedIds.size}</b> / {max}
        </div>
      </div>

      {/* 検索 */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <input
          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none"
          placeholder="タグ検索（例：群像 / musical / world など）"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setQ("");
            }}
            className="text-xs px-3 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
          >
            検索クリア
          </button>

          <button
            type="button"
            onClick={() => {
              onChange(new Set());
            }}
            className="text-xs px-3 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10"
          >
            全解除
          </button>
        </div>
      </div>

      {/* 選択済みチップ */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected
            .sort((a, b) => safe(a.type).localeCompare(safe(b.type)) || safe(a.name).localeCompare(safe(b.name)))
            .map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  const next = new Set(selectedIds);
                  next.delete(t.id);
                  onChange(next);
                }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold hover:opacity-90 ${badgeClassByType(
                  t.type
                )}`}
                title="クリックで解除"
              >
                <span className="opacity-80">{typeLabel(t.type)}</span>
                <span className="text-white">{t.name}</span>
                <span className="text-slate-300">×</span>
              </button>
            ))}
        </div>
      )}

      {/* グループ表示 */}
      <div className="space-y-4">
        {Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([type, list]) => (
            <div key={type} className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold tracking-widest text-slate-400">{typeLabel(type)}</div>
                <div className="text-[11px] text-slate-500">{list.length.toLocaleString()} 件</div>
              </div>

              <div className="grid sm:grid-cols-2 gap-2">
                {list.map((t) => {
                  const checked = selectedIds.has(t.id);
                  const disabled = !checked && reached;

                  return (
                    <label
                      key={t.id}
                      className={`flex items-start gap-3 rounded-lg border border-white/10 px-3 py-2 cursor-pointer hover:bg-white/5 ${
                        checked ? "bg-white/5" : "bg-transparent"
                      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                      title={disabled ? `最大${max}つまで` : ""}
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => {
                          const next = new Set(selectedIds);
                          if (next.has(t.id)) next.delete(t.id);
                          else {
                            if (next.size >= max) return;
                            next.add(t.id);
                          }
                          onChange(next);
                        }}
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold ${badgeClassByType(t.type)}`}>
                            {typeLabel(t.type)}
                          </span>
                          <div className="text-sm text-white font-semibold truncate">{t.name}</div>
                        </div>

                        {(t.description || showSlug) && (
                          <div className="text-xs text-slate-400 mt-0.5">
                            {t.description ? <span>{t.description}</span> : null}
                            {showSlug && t.slug ? (
                              <span className="ml-2 text-slate-500">({t.slug})</span>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
      </div>

      <div className="text-[11px] text-slate-500">
        ※タグは “横断テーマ” に限定（シリーズ/ジャンル/原作の縦軸と混ぜない）。薄いタグは後で削ってOK。
      </div>
    </div>
  );
};

export default TagMultiSelect;
