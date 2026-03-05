/**
 * play_tags join から tags を安定的に取り出す共通ヘルパー
 * play_tags: play_tags ( tag: tags ( name ) ) 形式の join 結果を想定
 */
export const normalizeTagsFromJoin = (p: any): string[] | null => {
    const arr = (p?.play_tags ?? []) as any[];
    const names = arr
        .map((x) => x?.tag?.name)
        .filter((v) => typeof v === 'string' && v.trim().length > 0)
        .map((v) => v.trim());

    const uniq = Array.from(new Set(names));
    return uniq.length > 0 ? uniq : null;
};
