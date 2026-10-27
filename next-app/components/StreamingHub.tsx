import Link from 'next/link';
import { Breadcrumbs } from './Breadcrumbs';
import { StructuredData } from './StructuredData';
import { buildBreadcrumbList } from '../lib/structured-data';
import { STREAMING_GUIDES, streamingGuidePath } from '../lib/streaming-guide';
import styles from './StreamingHub.module.css';

const guides = [
  {
    title: '2.5次元舞台を観られるVODは？',
    text: 'DMM TV・U-NEXT・dアニメストアなどで舞台作品を探せます。取扱作品や公演回はサービスごとに異なるため、観たい作品の配信先から選びましょう。ライブ配信とアーカイブ配信の違いも確認してください。',
  },
  {
    title: 'サブスクなら全作品が見放題？',
    text: '月額料金で観られるのは見放題の対象作品です。同じサービスでもレンタル・購入・ライブ配信チケットは別料金になる場合があり、無料体験もすべての作品に適用されるわけではありません。',
  },
  {
    title: '同じ作品でも配信される公演は違う？',
    text: '初演・再演、公演年、出演者などによって配信される映像は異なります。作品名だけでなく観たい公演回と視聴期限を確認しましょう。Stage Connectの作品ページから公演情報と配信リンクをたどれます。',
  },
] as const;

const otherServices = [
  { name: 'U-NEXT', category: '総合VOD', text: '舞台も映像作品も。観たい公演の配信と視聴条件を公式の作品一覧でチェック。', href: streamingGuidePath('ja', 'unext') },
  { name: 'ABEMA', category: 'ライブ・PPV', text: '新しい公演のライブ配信や、期間限定の配信を探したいときに。', href: null },
  { name: 'dアニメストア', category: 'アニメ・舞台', text: 'アニメとあわせて楽しみたい人に。対象公演は公式の作品一覧で確認。', href: streamingGuidePath('ja', 'danime') },
] as const;

const productions = [
  { label: 'MUSICAL / TOUMYU', name: '刀ミュ', title: 'ミュージカル『刀剣乱舞』', text: '公演ごとの出演者や配信リンクを確認。', href: '/series/touken-ranbu-musical' },
  { label: 'STAGE PLAY / TOUSUTE', name: '刀ステ', title: '舞台『刀剣乱舞』', text: 'シリーズの出演歴や公演をたどる。', href: '/series/butai-touken-ranbu' },
] as const;

/** Japanese streaming directory; individual service guides and English routes stay independent. */
export default function StreamingHub() {
  const dmm = STREAMING_GUIDES.find(service => service.id === 'dmm')!;
  const dmmPath = streamingGuidePath('ja', 'dmm');
  const breadcrumbs = [{ name: 'ホーム', path: '/' }, { name: '配信ガイド', path: '/watch' }];

  return <main className={styles.hub} data-watch-hub data-streaming-placement="watch_content">
    <StructuredData data={buildBreadcrumbList(breadcrumbs)}/>
    <StructuredData data={{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: guides.map(guide => ({ '@type': 'Question', name: guide.title, acceptedAnswer: { '@type': 'Answer', text: guide.text } })) }}/>

    <section className={styles.hero} aria-labelledby="watch-hub-title">
      <div className={styles.heroTexture} aria-hidden="true"><span>STAGE</span><div className={styles.archiveStamp}><i/><b>2.5D<br/>STAGE<br/>ARCHIVE</b></div></div>
      <div className={styles.inner}>
        <Breadcrumbs items={[{ label: '配信ガイド', href: '/watch' }]}/>
        <p className={styles.eyebrow}>04 / STREAMING GUIDE</p>
        <h1 id="watch-hub-title">2.5次元舞台の<br/><span>配信サービス一覧</span></h1>
        <p className={styles.heroIntro}>見放題のサブスクからライブ配信まで。<br/>観たい公演に合う動画配信サービスを。</p>
      </div>
    </section>

    <section className={`${styles.section} ${styles.firstChoice}`} aria-labelledby="watch-dmm-title" data-streaming-placement="watch_hero">
      <div className={styles.inner}>
        <div className={styles.sectionKicker}><p className={styles.eyebrow}>01 / FIRST CHOICE</p><span>まずはここから</span></div>
        <div className={styles.dmmCard}>
          <div className={styles.dmmCopy}>
            <p className={styles.recommendation}>まず確認したい配信サービス</p>
            <h2 id="watch-dmm-title">DMM TV</h2>
            <p className={styles.dmmIntro}>刀ミュ・刀ステなどの配信作品をチェック。<br className={styles.desktopBreak}/>見放題の対象や料金・無料体験の条件は個別ガイドへ。</p>
            <div className={styles.offer} aria-describedby="watch-trial-conditions"><p>月額<strong>{dmm.monthlyYen.toLocaleString('ja-JP')}</strong>円<small>（税込・Web登録）</small></p><p className={styles.trial}>初回{dmm.trialDays}日間無料</p></div>
            <Link className={styles.primaryCta} href={dmmPath}>DMM TVの配信ガイドを見る<span aria-hidden="true">→</span></Link>
            <Link className={styles.detailLink} href={dmmPath}>料金・作品・視聴方法を詳しく見る<span aria-hidden="true">↗</span></Link>
            <p className={styles.conditions} id="watch-trial-conditions">無料体験には適用条件あり。終了後は自動更新。</p>
          </div>
          <div className={styles.stageScene} aria-hidden="true"><div className={styles.stageFrame}/><div className={styles.stageCaption}><span>DMM TV / VIEWING GUIDE</span><p>見放題・料金・<br/>配信作品をチェック。</p></div></div>
        </div>
      </div>
    </section>

    <section className={`${styles.section} ${styles.otherServices}`} aria-labelledby="watch-others-title" data-streaming-placement="watch_plan">
      <div className={styles.inner}>
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>02 / OTHER SERVICES</p><h2 id="watch-others-title">ほかの動画配信サービス</h2></div><p>観たい公演や配信形式によって、<br/>選ぶサービスも変わる。</p></div>
        <div className={styles.serviceGrid}>{otherServices.map(service => <article className={styles.serviceCard} key={service.name}>
          <div className={styles.serviceName}><h3>{service.name}</h3><span>{service.category}</span></div><p>{service.text}</p>
          {service.href ? <Link className={styles.serviceLink} href={service.href}>対応状況を確認する<span aria-hidden="true">↗</span></Link> : null}
        </article>)}</div>
      </div>
    </section>

    <section className={`${styles.section} ${styles.productions}`} aria-labelledby="watch-productions-title">
      <div className={styles.inner}>
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>03 / EXPLORE PRODUCTIONS</p><h2 id="watch-productions-title">作品別の配信先を探す</h2></div><p>シリーズから公演を選び、<br/>作品ページの配信リンクへ。</p></div>
        <div className={styles.productionGrid}>{productions.map(production => <Link className={styles.productionCard} href={production.href} key={production.href}>
          <span className={styles.eyebrow}>{production.label}</span><h3>{production.name}</h3><p>{production.title}<br/>{production.text}</p><span className={styles.serviceLink}>公演一覧を見る<span aria-hidden="true">↗</span></span>
        </Link>)}</div>
        <Link className={styles.allProductions} href="/plays?streaming=available">配信情報のある作品を一覧から探す<span aria-hidden="true">→</span></Link>
        <p className={styles.availability}>配信リンクは、現在の見放題を保証するものではありません。対象公演・料金・配信期間は各サービスでご確認ください。リンク未登録は配信なしを意味しません。</p>
      </div>
    </section>

    <section className={`${styles.section} ${styles.guides}`} aria-labelledby="watch-guides-title">
      <div className={styles.inner}>
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>04 / Q&amp;A</p><h2 id="watch-guides-title">2.5次元舞台の配信Q&amp;A</h2></div></div>
        <div className={styles.guideGrid}>{guides.map((guide, index) => <article className={styles.guideCard} data-watch-guide key={guide.title}>
          <span className={styles.eyebrow}>Q.0{index + 1}</span><h3>{guide.title}</h3><p>{guide.text}</p>
        </article>)}</div>
        <details className={styles.sources} data-streaming-placement="watch_sources"><summary>料金・視聴条件と出典<span aria-hidden="true">＋</span></summary><div>
          <p>DMM TVのWeb登録は月額{dmm.monthlyYen}円（税込）。初回{dmm.trialDays}日間無料には対象者・申込方法の条件があります。アプリ経由では料金や条件が異なります。レンタル・購入は別料金の場合があります。</p>
          <p>本ページには広告・アフィリエイトリンクを含むガイドへの案内があります。</p>
          <p><a href={dmm.officialUrl} target="_blank" rel="noopener noreferrer">DMM公式の料金・無料体験の条件<span aria-hidden="true">↗</span></a><span className={styles.reviewed}>確認日：<time dateTime="2026-10-28">2026-10-28</time></span></p>
        </div></details>
      </div>
    </section>

    <section className={styles.closing} aria-labelledby="watch-closing-title"><div className={styles.inner}>
      <h2 id="watch-closing-title">観たい公演の<br/>配信リンクを探す。</h2>
      <p>公演年や出演者を確かめてから、視聴先へ。</p>
      <Link className={styles.archiveLink} href="/plays?streaming=available">配信リンクのある作品を見る<span aria-hidden="true">→</span></Link>
    </div></section>
  </main>;
}
