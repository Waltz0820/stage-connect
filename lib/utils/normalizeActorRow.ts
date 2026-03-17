import type { Actor, Gender } from '../types';

/**
 * DB row → front Actor 型に正規化する共通ヘルパー
 */
export const normalizeActorRow = (data: any): Actor => ({
    slug: data.slug,
    name: data.name,
    kana: data.kana ?? '',
    birthday: data.birthday ?? '',
    profile: data.profile ?? '',
    imageUrl: data.image_url ?? data.imageUrl ?? '',
    gender: (data.gender ?? 'male') as Gender,
    sns: (data.sns as Actor['sns']) ?? {},
    featuredPlaySlugs: (data.featured_play_slugs ?? data.featuredPlaySlugs ?? []) as string[],
    tags: (data.tags as string[] | undefined) ?? [],
});
