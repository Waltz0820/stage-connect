import React from "react";
import Link from "next/link";
import type { GuideDetailData } from "../lib/stage-connect";

type Block =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; rows: string[][] };

type Props = {
  content: string;
  guide: GuideDetailData;
};

const PLAY_LINK_PLACEHOLDER = "[作品詳細ページへのリンク]";
const STAGE_SERIES_PLACEHOLDER = "[刀ステ シリーズ一覧ページへのリンク]";
const MUSICAL_SERIES_PLACEHOLDER = "[刀ミュ シリーズ一覧ページへのリンク]";
const DMM_BUTTON_PLACEHOLDER = "[DMM TVで『刀剣乱舞』シリーズを見る（ボタン）]";
const WATCH_BUTTON_PLACEHOLDER = "[Stage Connect 配信ステータス一覧を見る（ボタン）]";

const VOD_SERVICE_LINKS: Record<string, string> = {
  "DMM TV": "/watch/dmm",
  "dアニメストア": "/watch/danime",
  "U-NEXT": "/watch/u-next",
};

const VOD_SERVICE_DESCRIPTIONS: Record<string, string> = {
  "DMM TV": "刀剣乱舞シリーズを追うなら本命。配信本数の厚みとコスパの両方で強いサービスです。",
  "dアニメストア": "一部作品は見られますが、刀剣乱舞を主目的にするならDMM TVとの比較確認が自然です。",
  "U-NEXT": "総合VODとしては強い一方、刀剣乱舞をまとめて追うならDMM TVとの違い確認が近道です。",
  "Amazon Prime Video": "作品によって視聴可否が変わりやすく、見放題状況も変動するため最新確認が必要です。",
};

const parseInline = (text: string) => {
  const tokens = text.split(/(\*\*.*?\*\*|`.*?`)/g).filter(Boolean);
  return tokens.map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return <strong key={index}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith("`") && token.endsWith("`")) {
      return <code key={index}>{token.slice(1, -1)}</code>;
    }
    return <React.Fragment key={index}>{token}</React.Fragment>;
  });
};

const isTableLine = (line: string) => /^\|.*\|$/.test(line.trim());
const isTableDivider = (line: string) =>
  /^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());

const normalizeToken = (value: string) =>
  value
    .normalize("NFKC")
    .replace(/["'`]/g, "")
    .replace(/[「」『』（）()[\]【】]/g, "")
    .replace(/\s+/g, "")
    .trim();

const stripGuidePlaceholders = (value: string) =>
  value
    .replace(/`?\[作品詳細ページへのリンク\]`?/g, "")
    .replace(/`?\[刀ステ シリーズ一覧ページへのリンク\]`?/g, "")
    .replace(/`?\[刀ミュ シリーズ一覧ページへのリンク\]`?/g, "")
    .replace(/`?\[DMM TVで『刀剣乱舞』シリーズを見る（ボタン）\]`?/g, "")
    .replace(/`?\[Stage Connect 配信ステータス一覧を見る（ボタン）\]`?/g, "")
    .trim();

const stripParenSuffix = (value: string) =>
  value.replace(/[（(].*?[）)]/g, "").trim();

const parseBlocks = (content: string): Block[] => {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const raw = lines[index];
    const line = raw.trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.slice(3).trim() });
      index += 1;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", text: line.slice(4).trim() });
      index += 1;
      continue;
    }

    if (line.startsWith("* ") || line.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length) {
        const bullet = lines[index].trim();
        if (!(bullet.startsWith("* ") || bullet.startsWith("- "))) break;
        items.push(bullet.slice(2).trim());
        index += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (isTableLine(line)) {
      const rows: string[][] = [];
      while (index < lines.length && isTableLine(lines[index].trim())) {
        const tableLine = lines[index].trim();
        if (!isTableDivider(tableLine)) {
          rows.push(
            tableLine
              .replace(/^\|/, "")
              .replace(/\|$/, "")
              .split("|")
              .map((cell) => cell.trim())
          );
        }
        index += 1;
      }
      if (rows.length > 0) blocks.push({ type: "table", rows });
      continue;
    }

    const paragraph: string[] = [line];
    index += 1;

    while (index < lines.length) {
      const next = lines[index].trim();
      if (!next) break;
      if (next.startsWith("## ") || next.startsWith("### ")) break;
      if (next.startsWith("* ") || next.startsWith("- ")) break;
      if (isTableLine(next)) break;
      paragraph.push(next);
      index += 1;
    }

    blocks.push({ type: "p", text: paragraph.join(" ") });
  }

  return blocks;
};

const findSeriesByFormat = (guide: GuideDetailData, format: "stage" | "musical") =>
  guide.relatedSeries.find((series) => series.format === format);

const getAllPlays = (guide: GuideDetailData) => {
  const seen = new Set<string>();
  return guide.relatedPlaySections.flatMap((section) =>
    section.plays.filter((play) => {
      if (seen.has(play.slug)) return false;
      seen.add(play.slug);
      return true;
    })
  );
};

const findBestPlay = (allPlays: ReturnType<typeof getAllPlays>, rawLabel: string) => {
  const cleaned = stripGuidePlaceholders(rawLabel);
  const query = normalizeToken(cleaned);
  const queryNoParen = normalizeToken(stripParenSuffix(cleaned));
  if (!queryNoParen) return null;

  const exact = allPlays.find((play) => normalizeToken(play.title) === query);
  if (exact) return exact;

  const exactNoParen = allPlays.find(
    (play) => normalizeToken(stripParenSuffix(play.title)) === queryNoParen
  );
  if (exactNoParen) return exactNoParen;

  const partial = allPlays.filter((play) => {
    const title = normalizeToken(play.title);
    const titleNoParen = normalizeToken(stripParenSuffix(play.title));
    return (
      queryNoParen.includes(titleNoParen) ||
      titleNoParen.includes(queryNoParen) ||
      query.includes(title) ||
      title.includes(query)
    );
  });

  if (partial.length > 0) {
    return partial.sort((a, b) => b.title.length - a.title.length)[0];
  }

  return null;
};

const renderParagraphPlaceholder = (text: string, guide: GuideDetailData) => {
  const normalized = text.replace(/`/g, "").trim();
  const actions: React.ReactNode[] = [];

  if (normalized.includes(STAGE_SERIES_PLACEHOLDER)) {
    const target = findSeriesByFormat(guide, "stage");
    if (target?.slug) {
      actions.push(
        <Link className="action-button" href={`/series/${target.slug}`} key="stage-series">
          刀ステ シリーズ一覧を見る
        </Link>
      );
    }
  }

  if (normalized.includes(MUSICAL_SERIES_PLACEHOLDER)) {
    const target = findSeriesByFormat(guide, "musical");
    if (target?.slug) {
      actions.push(
        <Link className="action-button" href={`/series/${target.slug}`} key="musical-series">
          刀ミュ シリーズ一覧を見る
        </Link>
      );
    }
  }

  if (normalized.includes(DMM_BUTTON_PLACEHOLDER)) {
    actions.push(
      <a className="action-button" href="/watch/dmm" key="dmm">
        DMM TVで『刀剣乱舞』シリーズを見る
      </a>
    );
  }

  if (normalized.includes(WATCH_BUTTON_PLACEHOLDER)) {
    actions.push(
      <Link className="action-button" href="/watch" key="watch">
        Stage Connect 配信ステータス一覧を見る
      </Link>
    );
  }

  if (actions.length === 0) return null;

  return <div className="guide-inline-actions">{actions}</div>;
};

const isPlayLinkList = (items: string[]) =>
  items.length > 0 && items.every((item) => item.includes(PLAY_LINK_PLACEHOLDER));

const isVodServiceList = (items: string[]) =>
  items.length > 0 && items.every((item) => Object.hasOwn(VOD_SERVICE_DESCRIPTIONS, item.trim()));

const renderVodServiceGrid = (items: string[], blockKey: number) => (
  <div className="guide-service-grid" key={blockKey}>
    {items.map((item) => {
      const label = item.trim();
      const href = VOD_SERVICE_LINKS[label];
      const description = VOD_SERVICE_DESCRIPTIONS[label] ?? "";

      if (href) {
        return (
          <Link className="guide-service-card" href={href} key={label}>
            <div className="guide-service-card__eyebrow">配信ガイド</div>
            <div className="guide-service-card__title">{label}</div>
            <div className="guide-service-card__text">{description}</div>
          </Link>
        );
      }

      return (
        <div className="guide-service-card guide-service-card--muted" key={label}>
          <div className="guide-service-card__eyebrow">配信サービス</div>
          <div className="guide-service-card__title">{label}</div>
          <div className="guide-service-card__text">{description}</div>
        </div>
      );
    })}
  </div>
);

const renderPlayGrid = (items: string[], guide: GuideDetailData, blockKey: number) => {
  const allPlays = getAllPlays(guide);
  const playItems = items.filter((item) => !item.startsWith("*("));

  const resolved = playItems
    .map((item) => {
      const play = findBestPlay(allPlays, item);
      return { play };
    })
    .filter((result) => result.play);

  if (resolved.length === 0) {
    return (
      <ul className="guide-prose__list" key={blockKey}>
        {items.map((item, index) => (
          <li key={index}>{parseInline(stripGuidePlaceholders(item))}</li>
        ))}
      </ul>
    );
  }

  return (
    <div className="catalog-grid" key={blockKey}>
      {resolved.map(({ play }) => {
        if (!play) return null;
        return (
          <article className="catalog-card" key={play.slug}>
            <div className="catalog-card__top">
              <Link className="catalog-card__title" href={`/plays/${play.slug}`}>
                {play.title}
              </Link>
              {play.vod?.dmm ? <span className="catalog-card__badge">配信あり</span> : null}
            </div>

            {play.period ? <div className="catalog-card__sub">{play.period}</div> : null}

            <div className="catalog-card__footer">
              <Link className="catalog-link" href={`/plays/${play.slug}`}>
                作品詳細を見る
              </Link>
            </div>

            <div
              className={`catalog-card__footer catalog-card__footer--cta${
                play.vod?.dmm ? "" : " is-empty"
              }`}
            >
              {play.vod?.dmm ? (
                <a
                  className="action-button action-button-inline"
                  href={play.vod.dmm}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                >
                  DMM TVで見る
                </a>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
};

const renderListItem = (item: string, guide: GuideDetailData, key: number) => {
  if (!item.includes(PLAY_LINK_PLACEHOLDER)) {
    const trimmed = item.trim();
    const vodHref = VOD_SERVICE_LINKS[trimmed];

    if (vodHref) {
      return (
        <li key={key}>
          <Link className="inline-link" href={vodHref}>
            {trimmed}
          </Link>
        </li>
      );
    }

    return <li key={key}>{parseInline(item)}</li>;
  }

  const label = stripGuidePlaceholders(item);
  const allPlays = getAllPlays(guide);
  const play = findBestPlay(allPlays, item);

  if (!play) {
    return <li key={key}>{parseInline(label)}</li>;
  }

  return (
    <li key={key} className="guide-linked-item">
      <div>{parseInline(label)}</div>
      <div className="guide-inline-links">
        <Link className="inline-link" href={`/plays/${play.slug}`}>
          {play.title}
        </Link>
      </div>
    </li>
  );
};

export function GuideContentRenderer({ content, guide }: Props) {
  const blocks = parseBlocks(content);

  return (
    <div className="guide-prose stack-md">
      {blocks.map((block, index) => {
        if (block.type === "h2") {
          return (
            <h2 className="guide-prose__h2" key={index}>
              {block.text}
            </h2>
          );
        }

        if (block.type === "h3") {
          return (
            <h3 className="guide-prose__h3" key={index}>
              {block.text}
            </h3>
          );
        }

        if (block.type === "ul") {
          if (isPlayLinkList(block.items)) {
            return renderPlayGrid(block.items, guide, index);
          }

          if (isVodServiceList(block.items)) {
            return renderVodServiceGrid(block.items, index);
          }

          return (
            <ul className="guide-prose__list" key={index}>
              {block.items.map((item, itemIndex) => renderListItem(item, guide, itemIndex))}
            </ul>
          );
        }

        if (block.type === "table") {
          const [head, ...body] = block.rows;
          return (
            <div className="guide-table-wrap" key={index}>
              <table className="guide-table">
                {head ? (
                  <thead>
                    <tr>
                      {head.map((cell, cellIndex) => (
                        <th key={cellIndex}>{parseInline(cell)}</th>
                      ))}
                    </tr>
                  </thead>
                ) : null}
                {body.length > 0 ? (
                  <tbody>
                    {body.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex}>{parseInline(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                ) : null}
              </table>
            </div>
          );
        }

        const placeholder = renderParagraphPlaceholder(block.text, guide);
        if (placeholder) {
          return <React.Fragment key={index}>{placeholder}</React.Fragment>;
        }

        return (
          <p className="guide-prose__p" key={index}>
            {parseInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
