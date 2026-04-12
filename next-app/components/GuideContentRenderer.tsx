import React from "react";

type Block =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; rows: string[][] };

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

export function GuideContentRenderer({ content }: { content: string }) {
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
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{parseInline(item)}</li>
              ))}
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

        return (
          <p className="guide-prose__p" key={index}>
            {parseInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
