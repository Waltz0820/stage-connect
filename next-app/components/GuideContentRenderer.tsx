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

const normalizeToken = (value: string) =>
  value
    .normalize("NFKC")
    .replace(/[‘’'`]/g, "")
    .replace(/[「」『』【】\[\]]/g, "")
    .replace(/\s+/g, "")
    .trim();

const stripPlaceholder = (value: string) =>
  value
    .replace(/`?\[.*?ページへのリンク\]`?/g, "")
    .replace(/`?\[.*?ボタン\]`?/g, "")
    .trim();

const stripParenSuffix = (value: string) => value.replace(/（.*?）/g, "").trim();

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

const findMatchingPlays = (guide: GuideDetailData, rawLabel: string) => {
  const query = normalizeToken(stripParenSuffix(stripPlaceholder(rawLabel)));
  if (!query) return [];

  return guide.relatedPlaySections
    .flatMap((section) => section.plays)
    .filter((play, index, all) => all.findIndex((item) => item.slug === play.slug) === index)
    .filter((play) => {
      const title = normalizeToken(play.title);
      return title.includes(query) || query.includes(title);
    });
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

const renderListItem = (item: string, guide: GuideDetailData, key: number) => {
  if (!item.includes(PLAY_LINK_PLACEHOLDER)) {
    return <li key={key}>{parseInline(item)}</li>;
  }

  const label = stripPlaceholder(item);
  const matches = findMatchingPlays(guide, item);

  return (
    <li key={key} className="guide-linked-item">
      <div>{parseInline(label)}</div>
      {matches.length > 0 ? (
        <div className="guide-inline-links">
          {matches.map((play) => (
            <Link className="inline-link" href={`/plays/${play.slug}`} key={play.slug}>
              {play.title}
            </Link>
          ))}
        </div>
      ) : null}
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
