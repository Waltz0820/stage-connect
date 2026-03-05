/**
 * HTML/特殊文字を除去してプレーンテキストにする
 */
export const toPlainText = (s: any): string => {
    const str = String(s ?? '');
    return str
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/[""]/g, '"')
        .replace(/['']/g, "'")
        .trim();
};

/**
 * 文字列を最大 n 文字に切り詰める（末尾に…を付与）
 */
export const truncate = (s: string, n: number): string =>
    s.length <= n ? s : s.slice(0, Math.max(0, n - 1)) + '…';
