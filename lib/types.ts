export type PlayGenre = 
  | 'history' 
  | 'fantasy' 
  | 'battle_shonen' 
  | 'sports' 
  | 'idol' 
  | 'music_stage' 
  | 'mystery_suspense' 
  | 'horror' 
  | 'comedy' 
  | 'otome_female' 
  | 'other';

export const GENRE_LABELS: Record<PlayGenre, string> = {
  history: '歴史・時代劇',
  fantasy: 'ファンタジー',
  battle_shonen: 'バトル・アクション',
  sports: 'スポーツ',
  idol: 'アイドル',
  music_stage: '音楽・ライブ',
  mystery_suspense: 'ミステリー',
  horror: 'ホラー',
  comedy: 'コメディ',
  otome_female: '乙女・女性向け',
  other: 'その他'
};

export type Play = {
  slug: string;
  title: string;
  franchise?: string;
  genre: PlayGenre; // Added genre
  summary?: string;
  period?: string;
  venue?: string;
  actorSlugs: string[];
  tags?: string[];
  vod?: {
    dmm?: string;
    danime?: string;
    unext?: string;
  };
};

export type Gender = 'male' | 'female' | 'other';

export type Actor = {
  slug: string;
  name: string;
  kana?: string;
  profile?: string;
  imageUrl?: string;
  gender?: Gender;
  sns?: {
    x?: string;
    instagram?: string;
    official?: string;
  };
  featuredPlaySlugs?: string[];
  tags?: string[];
};