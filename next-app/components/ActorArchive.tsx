import type { ReactNode } from "react";
import Link from "next/link";
import type { ActorDetailData } from "../lib/stage-connect";
import { getAgeFromBirthday, getDisplayBirthday, toPlainText } from "../lib/stage-connect";
import { formatAgeEn, formatBirthdayEn, formatBirthdayLabelEn, getEnglishActorName, getEnglishSeriesName } from "../lib/en-copy";
import { buildActorExplorer, compactActorSeriesName } from "../lib/actor-explorer";
import { ActorAppearanceExplorer } from "./ActorAppearanceExplorer";
import { Breadcrumbs } from "./Breadcrumbs";
import { FavoriteButtonClient } from "./FavoriteButtonClient";
import { ShareButtonClient } from "./ShareButtonClient";
import styles from "./ActorExplorer.module.css";

const initials = (slug: string) => slug.split("-").slice(0, 2).map(s => s[0]).join("").toUpperCase();

export function ActorArchive({ actor, locale, children }: { actor: ActorDetailData; locale: "ja" | "en"; children?: ReactNode }) {
  const en = locale === "en", prefix = en ? "/en" : "", displayName = en ? getEnglishActorName(actor) : actor.name;
  const years = buildActorExplorer(actor.plays, locale), count = years.reduce((sum, y) => sum + y.works.length, 0);
  const profile = toPlainText(en ? actor.profileEn || actor.profile || "" : actor.profile || "");
  const birthday = en ? actor.birthdayLabel ? formatBirthdayLabelEn(actor.birthdayLabel) : formatBirthdayEn(actor.birthday) : getDisplayBirthday(actor.birthday, actor.birthdayLabel);
  const age = getAgeFromBirthday(actor.birthday, actor.deathDate), ageText = en ? formatAgeEn(age) : age === null ? null : `${age}歳`;
  const seriesName = (s: ActorDetailData["topSeries"][number]) => en ? getEnglishSeriesName(s) : s.name;
  const coName = (a: ActorDetailData["coStars"][number]) => en ? getEnglishActorName(a) : a.name;
  const links = Object.entries(actor.sns || {}).filter(([, value]) => Boolean(value));
  const linkLabels: Record<string, string> = { x: "X", instagram: "Instagram", official: en ? "Official site" : "公式サイト", youtube: "YouTube" };
  const coStarLink = (person: ActorDetailData["coStars"][number]) => <Link key={person.slug} href={`${prefix}/actors/${person.slug}`}><span className={styles.coInitial} aria-hidden="true">{initials(person.slug)}</span><span>{coName(person)}</span><b>{person.count}<small>{en ? " works" : "作品"}</small></b></Link>;
  return <main className={`container works-index-page detail-stage-page editorial-detail actor-detail-stage-page ${styles.page}`}>
    {children}
    <Breadcrumbs items={[{ label: en ? "Actors" : "俳優一覧", href: `${prefix}/actors` }, { label: displayName }]} />
    <section id="actor-overview" className={styles.profile} aria-labelledby="actor-name">
      <div className={styles.profileMain}>
        <div className={styles.identity}><span className={styles.monogram} aria-hidden="true">{initials(actor.slug)}</span><div><h1 id="actor-name">{displayName}</h1>{actor.kana ? <p className={styles.kana}>{actor.kana}</p> : null}</div></div>
        {profile ? profile.length > (en ? 230 : 140) ? <details className={styles.profileBio}><summary><span>{profile.slice(0, en ? 180 : 110)}…</span><span className={styles.readMore}>{en ? "Full profile" : "プロフィール全文"}<span aria-hidden="true">＋</span></span></summary><p className={styles.profileText}>{profile}</p></details> : <p className={styles.profileText}>{profile}</p> : null}
        <dl className={styles.facts}>
          {birthday ? <div><dt>{en ? "Born" : "生年月日"}</dt><dd>{birthday}{ageText ? `（${ageText}）` : ""}</dd></div> : null}
          {actor.heightCm !== null ? <div><dt>{en ? "Height" : "身長"}</dt><dd>{actor.heightCm}cm</dd></div> : null}
          {actor.bloodType ? <div><dt>{en ? "Blood type" : "血液型"}</dt><dd>{actor.bloodType}{en ? "" : "型"}</dd></div> : null}
        </dl>
      </div>
      <div className={styles.profileAside}>
        <div className={styles.count}><strong>{count}</strong><span>{en ? "listed works" : "登録作品"}</span></div>
        {actor.topSeries.length ? <div className={styles.profileSeries}><h2>{en ? "Major series" : "主なシリーズ"}</h2><div className={styles.chips}>{actor.topSeries.slice(0, 4).map(s => <Link href={`${prefix}/series/${s.slug}`} title={seriesName(s)} aria-label={`${seriesName(s)} · ${s.count}${en ? ' credited works' : '作品に出演'}`} key={s.slug}>{compactActorSeriesName(seriesName(s))}<b>{s.count}</b></Link>)}</div></div> : null}
        <div className={styles.profileActions}><FavoriteButtonClient slug={actor.slug} type="actor" name={displayName} kana={actor.kana} /><ShareButtonClient title={displayName} text={`${displayName} | Stage Connect`} /></div>
      </div>
    </section>

    <section id="appearances" className={styles.appearances} aria-labelledby="appearances-title"><h2 id="appearances-title">{en ? "Appearance timeline" : "出演作品タイムライン"}</h2><ActorAppearanceExplorer key={actor.id} years={years} locale={locale} /></section>

    <div className={styles.connections}>
      <section id="co-stars" className={styles.connectionPanel} aria-labelledby="co-stars-title"><h2 id="co-stars-title">{en ? "Co-star network" : "共演ネットワーク"}</h2>
        {actor.coStars.length ? <><div className={styles.coList}>{actor.coStars.slice(0, 5).map(coStarLink)}</div>{actor.coStars.length > 5 ? <details className={styles.more}><summary>{en ? "More co-stars" : "共演者をもっと見る"}<span aria-hidden="true">＋</span></summary><div className={styles.coList}>{actor.coStars.slice(5).map(coStarLink)}</div></details> : null}</> : <p className={styles.empty}>{en ? "No co-star credits listed yet." : "共演情報はまだ登録されていません。"}</p>}
      </section>
      <section id="major-series" className={styles.connectionPanel} aria-labelledby="major-series-title"><h2 id="major-series-title">{en ? "Series appearances" : "出演シリーズ"}</h2>
        {actor.topSeries.length ? <div className={styles.seriesList}>{actor.topSeries.map(s => <Link href={`${prefix}/series/${s.slug}`} key={s.slug}><span>{seriesName(s)}</span><span className={styles.bar} aria-hidden="true"><span style={{ width: `${s.count / actor.topSeries[0].count * 100}%` }} /></span><b>{s.count}</b></Link>)}</div> : <p className={styles.empty}>{en ? "No series linked yet." : "シリーズ情報はまだ登録されていません。"}</p>}
      </section>
    </div>

    <details id="all-works" className={styles.allWorks}><summary>{en ? "View all credited productions" : "すべての出演作品を一覧で見る"}<span>{count}<span aria-hidden="true"> ＋</span></span></summary>
      <ul>{years.flatMap(y => y.works.map(work => <li key={work.id} data-play-id={work.id} data-play-slug={work.slug} data-streaming-placement="actor_timeline"><span className={styles.allYear}>{y.year === "unknown" ? en ? "Undated" : "年不明" : y.year}</span><div><Link href={`${prefix}/plays/${work.slug}`}>{work.title}</Link>{work.role ? <p>{work.role}</p> : null}{work.credits.filter(c => c.note).map(c => <p key={c.id}>{c.role ? `${c.role}：` : ""}{c.note}</p>)}</div>{work.dmm ? <a className={styles.allDmm} href={work.dmm} target="_blank" rel="sponsored noopener noreferrer">DMM TV ↗</a> : null}</li>))}</ul>
    </details>

    <section id="official-links" className={styles.official}><h2>{en ? "Official links" : "公式リンク"}</h2><div>{links.length ? links.map(([key, href]) => <a key={key} href={href} target="_blank" rel="noopener noreferrer">{linkLabels[key] || key}<span aria-hidden="true">↗</span></a>) : <p className={styles.empty}>{en ? "No official links listed yet." : "リンク情報はまだありません。"}</p>}</div></section>
    {!en ? <section className={styles.faq}><h2>よくある質問</h2><details><summary>{actor.name}の出演作品はどこで見られますか？</summary><p>出演年表から各作品の詳細を確認できます。</p></details><details><summary>配信で見られる作品はありますか？</summary><p>各作品の配信情報欄でリンクと視聴条件をご確認ください。</p></details><details><summary>最新の出演情報はどこで確認できますか？</summary><p>最新情報は公式サイトやSNSでご確認ください。登録済みのリンクは「公式リンク」に掲載しています。</p></details></section> : null}
  </main>;
}
