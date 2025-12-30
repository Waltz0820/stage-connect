import React from "react";
import { Link } from "react-router-dom";

export type TagItem = {
  id: string;
  name: string;
  slug: string;
  type: "world" | "experience" | "origin";
  playsCount?: number | null; // あれば 2件以上リンク判定に使う
};

const typeStyle = (type: TagItem["type"]) => {
  switch (type) {
    case "world":
      return "bg-white/5 border-white/10 text-slate-200";
    case "experience":
      return "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan";
    case "origin":
      return "bg-neon-purple/10 border-neon-purple/30 text-neon-purple";
    default:
      return "bg-white/5 border-white/10 text-slate-200";
  }
};

type Props = {
  tags: TagItem[];
  limit?: number;
  clickable?: boolean; // falseなら装飾のみ
};

const TagBadges: React.FC<Props> = ({ tags, limit = 4, clickable = true }) => {
  if (!tags || tags.length === 0) return null;

  const sliced = tags.slice(0, limit);
  const rest = tags.length - sliced.length;

  return (
    <div className="flex flex-wrap gap-2">
      {sliced.map((t) => {
        const canLink =
          clickable && (typeof t.playsCount !== "number" || t.playsCount >= 2);

        const cls = `text-[10px] px-2 py-1 rounded-full border ${typeStyle(
          t.type
        )}`;

        if (!canLink) {
          return (
            <span key={t.id} className={cls} title="このタグはまだ件数が少ないため一覧ページは非公開です">
              {t.name}
            </span>
          );
        }

        return (
          <Link key={t.id} to={`/tags/${encodeURIComponent(t.slug)}`} className={`${cls} hover:bg-white/10 transition-colors`}>
            {t.name}
          </Link>
        );
      })}

      {rest > 0 && (
        <span className="text-[10px] px-2 py-1 rounded-full bg-black/20 border border-white/10 text-slate-400">
          +{rest}
        </span>
      )}
    </div>
  );
};

export default TagBadges;
