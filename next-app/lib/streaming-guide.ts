import type { Metadata } from 'next';
import type { SiteLocale } from './locale-routing';
import type { StreamingService } from './streaming-links';

export const STREAMING_REVIEWED_ON = '2026-10-17';
export const STREAMING_GUIDES = [
  {
    id: 'dmm', slug: 'dmm', name: 'DMM TV', monthlyYen: 550, trialDays: 14,
    officialUrl: 'https://premium.dmm.com/about/',
    catalogueUrl: 'https://tv.dmm.com/vod/',
    signupUrl: 'https://al.dmm.com/?lurl=https%3A%2F%2Fpremium.dmm.com%2F&af_id=stageconnect-001&ch=link_tool&ch_id=text',
    sources: ['https://premium.dmm.com/about/'],
    ja: { intro: '作品ごとのDMM TVリンクから、公演映像や視聴条件を確認できます。', conditions: 'Web登録は月額550円（税込）。App Store・Google Play経由は650円。初回14日間無料には条件があり、DMMポイント払いなどは対象外です。', trial: '初回14日間', note: 'DMMプレミアムの見放題対象か、別料金のレンタル・購入かを作品ページで確認してください。' },
    en: { intro: 'Follow a production’s DMM TV link to check the recording and viewing options.', conditions: 'Web subscription: ¥550/month including tax; App Store / Google Play: ¥650. The first-time 14-day trial has eligibility conditions; DMM Points payments are excluded.', trial: 'First-time: 14 days', note: 'Check whether the recording is included in DMM Premium or requires a separate rental or purchase.' },
  },
  {
    id: 'unext', slug: 'u-next', name: 'U-NEXT', monthlyYen: 2189, trialDays: 31,
    officialUrl: 'https://video.unext.jp/',
    catalogueUrl: 'https://www.video.unext.jp/browse/genre/MNU0011140/MNU0011143?numParPage=100&order=popular',
    signupUrl: null,
    sources: ['https://help.unext.jp/guide/detail/price-description','https://help.unext.jp/guide/detail/what-is-fee-trial','https://help.unext.jp/guide/detail/video-service-with-appleid-payment'],
    ja: { intro: '公式の舞台・演劇一覧で、見たい公演の配信と料金を確認できます。', conditions: 'Webの月額プランは2,189円（税込）。初めての方は31日間無料トライアルの対象です。Apple Account課金は2,400円で、無料体験の有無は申込画面の確認が必要です。', trial: '初回31日間', note: '無料体験中もレンタル・購入作品は別料金です。見放題表示と配信期間を確認してください。' },
    en: { intro: 'Browse the official stage and theatre catalogue to check individual productions and prices.', conditions: 'Web monthly plan: ¥2,189 including tax, with a 31-day trial for first-time subscribers. Apple Account billing is ¥2,400; check trial eligibility on the signup screen.', trial: 'First-time: 31 days', note: 'Rentals and purchases are charged separately, including during a trial. Check the included-with-subscription label and availability period.' },
  },
  {
    id: 'danime', slug: 'danime', name: 'dアニメストア', monthlyYen: 660, trialDays: 31,
    officialUrl: 'https://animestore.docomo.ne.jp/animestore/CF/lp030',
    catalogueUrl: 'https://animestore.docomo.ne.jp/animestore/tp_pc',
    signupUrl: null,
    sources: ['https://animestore.docomo.ne.jp/animestore/CF/lp030','https://www.docomo.ne.jp/info/news_release/2025/11/19_00.html'],
    ja: { intro: 'アニメに加えて2.5次元・舞台作品も扱うサービス。公式サイトで作品名を検索できます。', conditions: 'Web登録は月額660円（税込）。初回31日間無料キャンペーンを実施中。App Store・Google Play経由は760円、初回無料期間は14日間です。', trial: 'Web初回31日間※', note: '※Webの初回31日間はキャンペーンによる延長です。対象条件と、個別課金作品の料金を確認してください。' },
    en: { intro: 'An anime service that also carries 2.5D and stage productions. Search for the title on its official site.', conditions: 'Web subscription: ¥660/month including tax, with a first-time 31-day trial campaign. App Store / Google Play: ¥760/month and a first-time 14-day trial.', trial: 'Web: first 31 days*', note: '*The 31-day Web trial is a promotional extension. Check eligibility and any separate rental charges.' },
  },
] as const;

export function isStreamingService(value: string): value is StreamingService {
  return STREAMING_GUIDES.some(service => service.id === value);
}

/** Input links have already been normalized at the data boundary. */
export function matchesStreamingService(vod: Record<string, string> | null, service: string) {
  return !isStreamingService(service) || Boolean(vod?.[service]);
}

export function streamingGuidePath(locale: SiteLocale, service?: StreamingService) {
  const item = STREAMING_GUIDES.find(item => item.id === service);
  return `${locale === 'en' ? '/en' : ''}/watch${item ? '/'+item.slug : ''}`;
}

export function streamingGuideMetadata(locale: SiteLocale, service?: StreamingService): Metadata {
  const item = STREAMING_GUIDES.find(item => item.id === service);
  const name = locale === 'en' && item?.id === 'danime' ? 'd Anime Store' : item?.name;
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://stageconnect.jp';
  return {
    title: `${name ? locale === 'ja' ? `${name}の舞台配信・料金ガイド` : `${name} stage streaming guide` : locale === 'ja' ? '2.5次元舞台の配信サービス比較' : '2.5D stage streaming services'} | Stage Connect`,
    description: locale === 'ja' ? '見たい舞台の配信リンクを探す。DMM TV・U-NEXT・dアニメストアのWeb料金、初回無料の条件と作品リンクを案内します。' : 'Find streaming links for stage productions and compare Japanese Web subscription prices and trial conditions for DMM TV, U-NEXT and d Anime Store.',
    alternates: { canonical: site+streamingGuidePath(locale,service), languages: {ja: site+streamingGuidePath('ja',service), en: site+streamingGuidePath('en',service)} },
  };
}
