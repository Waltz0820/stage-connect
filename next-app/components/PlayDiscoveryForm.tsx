import { OSHI_POINTS, OSHI_MIN_PARTICIPANTS } from '../lib/oshi-points.mjs';
import { STREAMING_GUIDES } from '../lib/streaming-guide';
import Link from 'next/link';
import { DirectoryFilterSheet } from './DirectoryFilterSheet';
import { DirectorySearchForm } from './DirectorySearchForm';

type Props = {
  locale: 'ja' | 'en';
  values: { q: string; sort: string; format: string; genre: string; point: string; series: string; streaming: string; service: string };
  formats: Record<string, string>; genres: Record<string, string>;
  seriesOptions: { value: string; label: string }[];
  pointAvailable: boolean;
};
export default function PlayDiscoveryForm({ locale, values, formats, genres, seriesOptions, pointAvailable }: Props) {
  const ja = locale === 'ja';
  return <DirectorySearchForm className="play-discovery-form" action={ja ? '/plays' : '/en/plays'}>
    <div className="v2-search"><span aria-hidden="true">⌕</span>
      <label className="sr-only" htmlFor="play-query">{ja ? '作品名・シリーズ名で検索' : 'Search plays and series'}</label>
      <input id="play-query" name="q" defaultValue={values.q} placeholder={ja ? '作品名・シリーズ名で検索' : 'Search plays and series'}/>
      <button type="submit" aria-label={ja ? '検索・絞り込みを適用' : 'Search and apply filters'}>→</button>
    </div>
    <DirectoryFilterSheet locale={locale}>
    <div className="discovery-filters">
      <label><span>{ja ? '上演形式' : 'Format'}</span><select name="format" defaultValue={values.format}><option value="all">{ja ? 'すべての形式' : 'All formats'}</option>{Object.entries(formats).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label><span>{ja ? 'ジャンル' : 'Genre'}</span><select name="genre" defaultValue={values.genre}><option value="all">{ja ? 'すべてのジャンル' : 'All genres'}</option>{Object.entries(genres).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label><span>{ja ? 'シリーズ' : 'Series'}</span><select name="series" defaultValue={values.series}><option value="">{ja ? 'すべてのシリーズ' : 'All series'}</option>{seriesOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label><span>{ja ? '推しポイント' : 'Fan favorites'}</span><select name="point" defaultValue={values.point}><option value="">{ja ? 'すべてのポイント' : 'All points'}</option>{OSHI_POINTS.map((point) => <option key={point.id} value={point.id}>{point[locale]}</option>)}</select></label>
      <label><span>{ja ? '配信情報' : 'Streaming'}</span><select name="streaming" defaultValue={values.streaming}><option value="">{ja ? 'すべて' : 'All'}</option><option value="available">{ja ? '配信リンクあり' : 'With streaming links'}</option></select></label>
      <label><span>{ja ? '配信サービス' : 'Streaming service'}</span><select name="service" defaultValue={values.service}><option value="">{ja ? 'すべてのサービス' : 'All services'}</option>{STREAMING_GUIDES.map(item=><option key={item.id} value={item.id}>{!ja && item.id==='danime' ? 'd Anime Store' : item.name}</option>)}</select></label>
      <label><span>{ja ? '並び順' : 'Sort by'}</span><select name="sort" defaultValue={values.sort}>
        <option value="new">{ja ? '公演が新しい順' : 'Newest first'}</option><option value="old">{ja ? '公演が古い順' : 'Oldest first'}</option>
        <option value="support">{ja ? '選択したポイントの支持率順' : 'Support for selected point'}</option>
      </select></label>
    </div>
    <div className="discovery-actions"><button type="submit" className="action-button">{ja ? '条件を適用' : 'Apply filters'}</button>
      <a href={ja ? '/plays' : '/en/plays'}>{ja ? 'リセット' : 'Reset'}</a></div>
    </DirectoryFilterSheet>
    {values.service ? <p className="catalog-note">{ja ? '配信リンクが登録された作品を表示しています。ほかの作品は' : 'Showing productions with recorded streaming links. Find other titles through the '}<Link href={`${ja?'':'/en'}/watch/${values.service==='unext'?'u-next':values.service}`}>{ja ? 'サービス別ガイド' : 'service guide'}</Link>{ja ? 'の公式リンクから探せます。' : ' and official catalogue.'}</p> : null}
    {values.point ? <p className="catalog-note" role="status">{!pointAvailable
      ? ja ? '推しポイント検索はただいま準備中です。ほかの条件はご利用いただけます。' : 'Fan-favorite search is being prepared. Other filters are available.'
      : ja ? `${OSHI_MIN_PARTICIPANTS}人以上が投票し、このポイントに支持がある作品が対象です。` : `Includes productions with at least ${OSHI_MIN_PARTICIPANTS} voters and support for this point.`}</p>
      : values.sort === 'support' ? <p className="catalog-note">{ja ? '推しポイントを選ぶと支持率順に並びます。未選択の間は公演が新しい順です。' : 'Choose a point to sort by support. Until then, productions are shown newest first.'}</p> : null}
  </DirectorySearchForm>;
}
