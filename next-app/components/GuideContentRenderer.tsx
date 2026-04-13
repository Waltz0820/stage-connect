import React from "react";
import Link from "next/link";
import type { GuideDetailData } from "../lib/stage-connect";
import { GuidePlaySectionsClient } from "./GuidePlaySectionsClient";

type Block =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; rows: string[][] };

type Section = {
  heading: string;
  blocks: Block[];
  originalIndex: number;
};

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
  "DMM TV": "刀剣乱舞シリーズを横断して視聴しやすい",
  "U-NEXT": "総合VODとして優秀",
  "dアニメストア": "一部作品に対応",
  "Amazon Prime Video": "配信状況は作品ごとに異なる",
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
    .replace(/[()［］\[\]「」『』【】]/g, "")
    .replace(/\s+/g, "")
    .trim();

export const headingToId = (text: string) =>
  text
    .normalize("NFKC")
    .replace(/[「」『』【】]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}\-]/gu, "")
    .toLowerCase()
    .slice(0, 60);

const stripGuidePlaceholders = (value: string) =>
  value
    .replace(new RegExp(escapeRegExp(PLAY_LINK_PLACEHOLDER), "g"), "")
    .replace(new RegExp(escapeRegExp(STAGE_SERIES_PLACEHOLDER), "g"), "")
    .replace(new RegExp(escapeRegExp(MUSICAL_SERIES_PLACEHOLDER), "g"), "")
    .replace(new RegExp(escapeRegExp(DMM_BUTTON_PLACEHOLDER), "g"), "")
    .replace(new RegExp(escapeRegExp(WATCH_BUTTON_PLACEHOLDER), "g"), "")
    .replace(/`/g, "")
    .trim();

const stripParenSuffix = (value: string) => value.replace(/[（(].*?[)）]/g, "").trim();

const parseBlocks = (content: string): Block[] => {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

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

    blocks.push({ type: "p", text: paragraph.join("\n") });
  }

  return blocks;
};

const splitSections = (blocks: Block[]) => {
  const introBlocks: Block[] = [];
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const block of blocks) {
    if (block.type === "h2") {
      if (current) sections.push(current);
      current = { heading: block.text, blocks: [block], originalIndex: sections.length };
      continue;
    }

    if (current) {
      current.blocks.push(block);
    } else {
      introBlocks.push(block);
    }
  }

  if (current) sections.push(current);
  return { introBlocks, sections };
};

const getSectionPriority = (heading: string) => {
  if (heading.includes("違い")) return 10;
  if (heading.includes("初めて観る場合") || heading.includes("選び方")) return 20;
  if ((heading.includes("刀ステ") || heading.includes("舞台『刀剣乱舞』")) && heading.includes("見る順番")) {
    return 30;
  }
  if (
    (heading.includes("刀ミュ") || heading.includes("ミュージカル『刀剣乱舞』")) &&
    heading.includes("見る順番")
  ) {
    return 40;
  }
  if (heading.includes("配信")) return 50;
  return 100;
};

const shouldOmitSection = (heading: string) =>
  heading.includes("刀剣乱舞シリーズの配信状況") || heading === "配信状況";

const shouldOmitSubsectionHeading = (text: string) =>
  text.includes("刀剣乱舞シリーズの配信状況") ||
  text === "配信状況" ||
  text.includes("シリーズ構成と物語の展開方式");

const reorderSections = (blocks: Block[]) => {
  const { introBlocks, sections } = splitSections(blocks);
  const orderedSections = [...sections]
    .filter((section) => !shouldOmitSection(section.heading))
    .sort((a, b) => {
      const diff = getSectionPriority(a.heading) - getSectionPriority(b.heading);
      if (diff !== 0) return diff;
      return a.originalIndex - b.originalIndex;
    });

  return [...introBlocks, ...orderedSections.flatMap((section) => section.blocks)];
};

export const extractTocHeadings = (content: string): Array<{ id: string; text: string }> =>
  reorderSections(parseBlocks(content))
    .filter((block): block is Extract<Block, { type: "h2" }> => block.type === "h2")
    .map((block) => ({
      id: headingToId(block.text),
      text: block.text,
    }));

const findSeriesByFormat = (guide: GuideDetailData, format: "stage" | "musical") =>
  guide.relatedSeries.find((series) => series.format === format);

const getFormatFromHeading = (heading?: string | null): "stage" | "musical" | null => {
  if (!heading) return null;
  if (heading.includes("刀ステ") || heading.includes("舞台『刀剣乱舞』")) return "stage";
  if (heading.includes("刀ミュ") || heading.includes("ミュージカル『刀剣乱舞』")) return "musical";
  return null;
};

const periodListSortKey = (period?: string | null) => {
  if (!period) return Number.MAX_SAFE_INTEGER;
  const match = period.match(/(\d{4})\D{0,2}(\d{1,2})/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]) * 100 + Number(match[2]);
};

const getPlayListBundleByFormat = (guide: GuideDetailData, format: "stage" | "musical") => {
  const targetSeriesIds = new Set(
    guide.relatedSeries
      .filter((series) => series.format === format)
      .map((series) => series.id)
  );

  const plays = guide.relatedPlaySections
    .filter((section) => targetSeriesIds.has(section.series.id))
    .flatMap((section) => section.plays);

  const deduped = Array.from(
    new Map(plays.map((play) => [play.slug, play])).values()
  ).sort(
    (a, b) =>
      periodListSortKey(a.period) - periodListSortKey(b.period) ||
      a.title.localeCompare(b.title, "ja")
  );

  if (deduped.length === 0) return null;

  return {
    plays: deduped,
    series: findSeriesByFormat(guide, format),
  };
};

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

  return partial.sort((a, b) => b.title.length - a.title.length)[0] ?? null;
};

const splitParagraphLines = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const parseLabeledLines = (lines: string[]) => {
  const parsed = lines
    .map((line) => {
      const match = line.match(/^([^：]{1,24})：\s*(.+)$/);
      if (!match) return null;
      return { label: match[1].trim(), body: match[2].trim() };
    })
    .filter(Boolean) as Array<{ label: string; body: string }>;

  return parsed.length >= 2 && parsed.length === lines.length ? parsed : null;
};

const isFeatureLines = (lines: string[]) =>
  lines.length >= 3 &&
  lines.length <= 6 &&
  lines.every((line) => line.length <= 24 && !/[。！？!?]/.test(line));

const isShortLabelList = (items: string[]) =>
  items.length >= 2 &&
  items.length <= 6 &&
  items.every(
    (item) =>
      item.length <= 24 &&
      !item.includes("[") &&
      !item.includes("→") &&
      !item.includes("http")
  );

const renderParagraphPlaceholder = (text: string, guide: GuideDetailData) => {
  const normalized = text.replace(/`/g, "").trim();
  const hasStageSeries = normalized.includes(STAGE_SERIES_PLACEHOLDER);
  const hasMusicalSeries = normalized.includes(MUSICAL_SERIES_PLACEHOLDER);
  const hasDmmButton = normalized.includes(DMM_BUTTON_PLACEHOLDER);
  const hasWatchButton = normalized.includes(WATCH_BUTTON_PLACEHOLDER);
  const actions: React.ReactNode[] = [];

  if (hasStageSeries && hasMusicalSeries && !hasDmmButton && !hasWatchButton) {
    return null;
  }

  if (hasStageSeries) {
    const target = findSeriesByFormat(guide, "stage");
    if (target?.slug) {
      actions.push(
        <Link className="action-button" href={`/series/${target.slug}`} key="stage-series">
          刀ステ 作品一覧
        </Link>
      );
    }
  }

  if (hasMusicalSeries) {
    const target = findSeriesByFormat(guide, "musical");
    if (target?.slug) {
      actions.push(
        <Link className="action-button" href={`/series/${target.slug}`} key="musical-series">
          刀ミュ 作品一覧
        </Link>
      );
    }
  }

  if (hasDmmButton) {
    actions.push(
      <a className="action-button" href="/watch/dmm" key="dmm">
        DMM TVで『刀剣乱舞』シリーズを見る
      </a>
    );
  }

  if (hasWatchButton) {
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

const isChoiceList = (items: string[]) =>
  items.length > 0 &&
  items.every((item) => item.includes("→")) &&
  items.some((item) => item.includes("刀ステ") || item.includes("刀ミュ"));

const dedupeStrings = (items: string[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const isGuidePlayListHeading = (text: string) =>
  (text.includes("刀ステ") || text.includes("舞台『刀剣乱舞』")) && text.includes("見る順番") ||
  (text.includes("刀ミュ") || text.includes("ミュージカル『刀剣乱舞』")) && text.includes("見る順番");

const isGuidePlaySubLabel = (text: string) =>
  text.includes("本公演シリーズ") ||
  text.includes("ライブ・特別公演") ||
  text.includes("ライブ") ||
  text.includes("特別公演");

function mergeGuidePlayLists(blocks: Block[]): Block[] {
  const merged: Block[] = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];

    if (block.type !== "h2" || !isGuidePlayListHeading(block.text)) {
      merged.push(block);
      continue;
    }

    merged.push(block);

    const introBlocks: Block[] = [];
    const playItems: string[] = [];
    let cursor = index + 1;
    const headingFormat = getFormatFromHeading(block.text);

    while (cursor < blocks.length && blocks[cursor].type !== "h2") {
      const current = blocks[cursor];

      if (current.type === "ul" && isPlayLinkList(current.items)) {
        playItems.push(...current.items);
        cursor += 1;
        continue;
      }

      if (
        (current.type === "h3" || current.type === "p") &&
        isGuidePlaySubLabel(current.text)
      ) {
        cursor += 1;
        continue;
      }

      if (current.type === "p" && current.text.trim().startsWith("以下では、")) {
        cursor += 1;
        continue;
      }

      introBlocks.push(current);
      cursor += 1;
    }

    if (headingFormat === "musical") {
      introBlocks.unshift({
        type: "p",
        text: "刀ミュは各作品の物語は独立していますが、大型ライブへ向けて登場キャラクターが蓄積されていくため、同じく「公演順」での視聴を推奨します。",
      });
    }

    merged.push(...introBlocks);

    if (playItems.length > 0) {
      merged.push({
        type: "ul",
        items: dedupeStrings(playItems),
      });
    }

    index = cursor - 1;
  }

  return merged;
}

const renderChoiceGrid = (items: string[], guide: GuideDetailData, blockKey: number) => {
  const choices = items
    .map((item) => {
      const [hintPart, labelPart] = item.split("→").map((value) => value.trim());
      if (!hintPart || !labelPart) return null;

      const format = labelPart.includes("刀ステ")
        ? "stage"
        : labelPart.includes("刀ミュ")
          ? "musical"
          : null;
      if (!format) return null;

      const series = findSeriesByFormat(guide, format);
      if (!series?.slug) return null;

      return {
        hint: hintPart,
        label: format === "stage" ? "刀ステ 作品一覧" : "刀ミュ 作品一覧",
        href: `/series/${series.slug}`,
      };
    })
    .filter(Boolean) as Array<{ hint: string; label: string; href: string }>;

  if (choices.length === 0) {
    return (
      <ul className="guide-prose__list" key={blockKey}>
        {items.map((item, index) => (
          <li key={index}>{parseInline(item)}</li>
        ))}
      </ul>
    );
  }

  return (
    <div className="guide-choice-grid" key={blockKey}>
      {choices.map((choice) => (
        <Link className="guide-choice-card" href={choice.href} key={`${choice.label}-${choice.href}`}>
          <div className="guide-choice-card__hint">{choice.hint}</div>
          <div className="guide-choice-card__title">{choice.label}</div>
        </Link>
      ))}
    </div>
  );
};

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

const renderPlayGrid = (
  items: string[],
  guide: GuideDetailData,
  blockKey: number,
  currentHeading: string | null
) => {
  const headingFormat = getFormatFromHeading(currentHeading);
  const directSection = headingFormat ? getPlayListBundleByFormat(guide, headingFormat) : null;

  if (directSection) {
    return (
      <GuidePlaySectionsClient
        key={blockKey}
        plays={directSection.plays}
        allSeriesHref={directSection.series?.slug ? `/series/${directSection.series.slug}` : null}
        allSeriesLabel={`${directSection.series?.name ?? "シリーズ"}の全作品を見る`}
        initialVisible={6}
      />
    );
  }

  const allPlays = getAllPlays(guide);
  const resolved = items
    .map((item) => findBestPlay(allPlays, item))
    .filter((play): play is NonNullable<ReturnType<typeof findBestPlay>> => Boolean(play));

  if (resolved.length === 0) {
    return (
      <ul className="guide-prose__list" key={blockKey}>
        {items.map((item, index) => (
          <li key={index}>{parseInline(stripGuidePlaceholders(item))}</li>
        ))}
      </ul>
    );
  }

  const matchedSection = guide.relatedPlaySections.find((section) =>
    resolved.some((play) => section.plays.some((candidate) => candidate.slug === play.slug))
  );
  const playOrder = matchedSection
    ? new Map(matchedSection.plays.map((play, index) => [play.slug, index]))
    : null;
  const orderedResolved = playOrder
    ? [...resolved].sort(
        (a, b) =>
          (playOrder.get(a.slug) ?? Number.MAX_SAFE_INTEGER) -
          (playOrder.get(b.slug) ?? Number.MAX_SAFE_INTEGER)
      )
    : resolved;

  return (
    <GuidePlaySectionsClient
      key={blockKey}
      plays={orderedResolved}
      allSeriesHref={matchedSection?.series.slug ? `/series/${matchedSection.series.slug}` : null}
      allSeriesLabel={`${matchedSection?.series.name ?? "シリーズ"}の全作品を見る`}
      initialVisible={6}
    />
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

const renderParagraphBlock = (text: string, key: number, currentHeading: string | null) => {
  const lines = splitParagraphLines(text);
  const labeledLines = parseLabeledLines(lines);

  if (labeledLines) {
    return (
      <div className="guide-compare-list" key={key}>
        {labeledLines.map((item, index) => (
          <div className="guide-compare-item" key={`${item.label}-${index}`}>
            <div className="guide-compare-item__label">{item.label}</div>
            <div className="guide-compare-item__body">{parseInline(item.body)}</div>
          </div>
        ))}
      </div>
    );
  }

  if (currentHeading?.includes("キャスト構成と出演形式")) {
    const intro = lines[0];
    const note = lines[lines.length - 1];
    const middle = lines.slice(1, lines.length - 1);

    if (middle.length > 0 && isFeatureLines(middle)) {
      return (
        <div className="stack-sm" key={key}>
          {intro ? <p className="guide-prose__p">{parseInline(intro)}</p> : null}
          <div className="guide-feature-grid">
            {middle.map((line, index) => (
              <div className="guide-feature-chip" key={`${line}-${index}`}>
                {parseInline(line)}
              </div>
            ))}
          </div>
          {note ? <p className="guide-prose__p">{parseInline(note)}</p> : null}
        </div>
      );
    }
  }

  if (isFeatureLines(lines)) {
    return (
      <div className="guide-feature-grid" key={key}>
        {lines.map((line, index) => (
          <div className="guide-feature-chip" key={`${line}-${index}`}>
            {parseInline(line)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <p className="guide-prose__p" key={key}>
      {lines.map((line, index) => (
        <React.Fragment key={index}>
          {parseInline(line)}
          {index < lines.length - 1 ? <br /> : null}
        </React.Fragment>
      ))}
    </p>
  );
};

export function GuideContentRenderer({ content, guide }: Props) {
  const blocks = mergeGuidePlayLists(reorderSections(parseBlocks(content)));
  let skipUntilNextHeading = false;
  let currentH2: string | null = null;
  let currentH3: string | null = null;

  return (
    <div className="guide-prose stack-md">
      {blocks.map((block, index) => {
        if (block.type === "h2") {
          skipUntilNextHeading = false;
          currentH2 = block.text;
          currentH3 = null;
          return (
            <h2 className="guide-prose__h2" id={headingToId(block.text)} key={index}>
              {block.text}
            </h2>
          );
        }

        if (block.type === "h3") {
          if (shouldOmitSubsectionHeading(block.text)) {
            skipUntilNextHeading = true;
            currentH3 = null;
            return null;
          }

          skipUntilNextHeading = false;
          currentH3 = block.text;
          return (
            <h3 className="guide-prose__h3" key={index}>
              {block.text}
            </h3>
          );
        }

        if (skipUntilNextHeading) return null;

        if (block.type === "ul") {
          if (isPlayLinkList(block.items)) {
            return renderPlayGrid(block.items, guide, index, currentH2);
          }

          if (isChoiceList(block.items)) {
            return renderChoiceGrid(block.items, guide, index);
          }

          if (isVodServiceList(block.items)) {
            return renderVodServiceGrid(block.items, index);
          }

          if (isShortLabelList(block.items)) {
            return (
              <div className="guide-chip-grid" key={index}>
                {block.items.map((item, itemIndex) => (
                  <span className="guide-chip" key={`${item}-${itemIndex}`}>
                    {item}
                  </span>
                ))}
              </div>
            );
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

        return renderParagraphBlock(block.text, index, currentH3);
      })}
    </div>
  );
}
