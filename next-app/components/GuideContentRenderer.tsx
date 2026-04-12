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
const isTableDivider = (line: string) => /^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());

/**
 * Aggressively normalize Japanese text for fuzzy matching.
 * Strips brackets, quotes, whitespace, common suffixes, and normalizes to NFKC.
 */
const normalizeToken = (value: string) =>
  value
    .normalize("NFKC")
    .replace(/['''`]/g, "")
    .replace(/[「」『』【】\[\]〜～〈〉《》]/g, "")
    .replace(/\s+/g, "")
    .trim();

const stripPlaceholder = (value: string) =>
  value
    .replace(/`?\[.*?ページへのリンク\]`?/g, "")
    .replace(/`?\[.*?ボタン\]`?/g, "")
    .trim();

/**
 * Strip parenthetical suffixes like （初演/再演）, (2020年公演) etc.
 */
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

/**
 * Flatten all plays from all sections, deduplicated by slug.
 */
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

/**
 * Find the best matching play for a label.
 * Uses progressive fuzzy matching:
 *  1. Exact normalized match
 *  2. Normalized label includes normalized title
 *  3. Normalized title includes normalized label (after stripping paren suffixes)
 */
const findBestPlay = (allPlays: ReturnType<typeof getAllPlays>, rawLabel: string) => {
  const cleaned = stripPlaceholder(rawLabel);
  const query = normalizeToken(cleaned);
  const queryNoParen = normalizeToken(stripParenSuffix(cleaned));
  if (!queryNoParen) return null;

  // 1. Exact match (normalized)
  const exact = allPlays.find((p) => normalizeToken(p.title) === query);
  if (exact) return exact;

  // 2. Exact match after stripping parens from both sides
  const exactNoParen = allPlays.find(
    (p) => normalizeToken(stripParenSuffix(p.title)) === queryNoParen
  );
  if (exactNoParen) return exactNoParen;

  // 3. Label contains title OR title contains label
  const partial = allPlays.filter((p) => {
    const title = normalizeToken(p.title);
    const titleNoParen = normalizeToken(stripParenSuffix(p.title));
    return (
      queryNoParen.includes(titleNoParen) ||
      titleNoParen.includes(queryNoParen) ||
      query.includes(title) ||
      title.includes(query)
    );
  });

  // If multiple partial matches, prefer the longest title (most specific)
  if (partial.length > 0) {
    return partial.sort((a, b) => b.title.length - a.title.length)[0];
  }

  return null;
};

const renderParagraphPlaceholder = (text: string, guide: GuideDetailData) => {
  const normalized = text.replace(/`/g, "").trim();

  if (normalized === STAGE_SERIES_PLACEHOLDER) {
    const target = findSeriesByFormat(guide, "stage");
    if (!target?.slug) return null;
    return (
      <div className="guide-inline-actions">
        <Link className="action-button" href={`/series/${target.slug}`}>
          刀ステシリーズ一覧を見る
        </Link>
      </div>
    );
  }

  if (normalized === MUSICAL_SERIES_PLACEHOLDER) {
    const target = findSeriesByFormat(guide, "musical");
    if (!target?.slug) return null;
    return (
      <div className="guide-inline-actions">
        <Link className="action-button" href={`/series/${target.slug}`}>
          刀ミュシリーズ一覧を見る
        </Link>
      </div>
    );
  }

  if (normalized === DMM_BUTTON_PLACEHOLDER) {
    return (
      <div className="guide-inline-actions">
        <a className="action-button" href="/watch/dmm">
          DMM TVで『刀剣乱舞』シリーズを見る
        </a>
      </div>
    );
  }

  if (normalized === WATCH_BUTTON_PLACEHOLDER) {
    return (
      <div className="guide-inline-actions">
        <Link className="action-button" href="/watch">
          Stage Connect 配信ステータス一覧を見る
        </Link>
      </div>
    );
  }

  return null;
};

/**
 * Check if a list is entirely composed of play-link items.
 * If so, render as a catalog-grid instead of a <ul>.
 */
const isPlayLinkList = (items: string[]) =>
  items.length > 0 && items.every((item) => item.includes(PLAY_LINK_PLACEHOLDER));

const renderPlayGrid = (items: string[], guide: GuideDetailData, blockKey: number) => {
  const allPlays = getAllPlays(guide);

  // Filter out CMS notes like *(※CMS入稿時に...)*
  const playItems = items.filter((item) => !item.startsWith("*(") && !item.startsWith("*（"));

  const resolved = playItems
    .map((item) => {
      const label = stripPlaceholder(item);
      const play = findBestPlay(allPlays, item);
      return { label, play };
    })
    .filter((r) => r.play);

  if (resolved.length === 0) {
    // Fallback: render as plain list if nothing matched
    return (
      <ul className="guide-prose__list" key={blockKey}>
        {items.map((item, i) => (
          <li key={i}>{parseInline(stripPlaceholder(item))}</li>
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

            <div className={`catalog-card__footer catalog-card__footer--cta${play.vod?.dmm ? "" : " is-empty"}`}>
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
    return <li key={key}>{parseInline(item)}</li>;
  }

  const label = stripPlaceholder(item);
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
          // If every item in the list is a play-link, render as a catalog grid
          if (isPlayLinkList(block.items)) {
            return renderPlayGrid(block.items, guide, index);
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
        if (placeholder) return <React.Fragment key={index}>{placeholder}</React.Fragment>;

        return (
          <p className="guide-prose__p" key={index}>
            {parseInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
