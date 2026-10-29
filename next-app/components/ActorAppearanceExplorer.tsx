"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DetailDialog } from "./DetailDialog";
import type { ExplorerWork, ExplorerYear } from "../lib/actor-explorer";
import styles from "./ActorExplorer.module.css";

export function ActorWorkDetail({ work, locale }: { work: ExplorerWork; locale: "ja" | "en" }) {
  const en = locale === "en", prefix = en ? "/en" : "";
  return <div className={styles.workDetail} data-play-id={work.id} data-play-slug={work.slug} data-streaming-placement="actor_timeline">
    <h3>{work.title}</h3>
    <dl className={styles.ledger}>
      {work.period ? <div><dt>{en ? "Dates" : "公演時期"}</dt><dd>{work.period}</dd></div> : null}
      {work.series ? <div><dt>{en ? "Series" : "シリーズ"}</dt><dd>{work.series.slug ? <Link href={`${prefix}/series/${work.series.slug}`}>{work.series.name} ↗</Link> : work.series.name}</dd></div> : null}
      <div><dt>{en ? "Roles" : "配役"}</dt><dd><ul className={styles.credits}>{work.credits.length ? work.credits.map(c => <li key={c.id}>
        <span>{c.role || (en ? "Role not listed" : "配役情報なし")}</span>
        {c.group ? <small>{c.group}</small> : null}
        {c.starring ? <small>{en ? "Lead cast" : "主演"}</small> : null}
        {c.note ? <p>{c.note}</p> : null}
      </li>) : <li>{work.role || (en ? "Role not listed" : "配役情報なし")}</li>}</ul></dd></div>
    </dl>
    {work.coStars.length ? <div className={styles.workCoStars}><h4>{en ? "Co-stars in this work" : "この作品の共演者"}</h4><div className={styles.chips}>{work.coStars.map(a => <Link key={a.slug} href={`${prefix}/actors/${a.slug}`}>{a.name}</Link>)}</div></div> : null}
    <div className={styles.detailActions}>
      <Link className={styles.primary} href={`${prefix}/plays/${work.slug}`}>{en ? "View production" : "作品詳細を見る"}<span aria-hidden="true">→</span></Link>
      {work.dmm ? <a className={styles.streamLink} href={work.dmm} target="_blank" rel="sponsored noopener noreferrer">{en ? "Watch on DMM TV" : "DMM TVで見る"} ↗</a> : null}
    </div>
    {work.dmm ? <small className={styles.adNote}>{en ? "Ad · Affiliate link" : "広告・アフィリエイトリンク"}</small> : null}
  </div>;
}

export function ActorAppearanceExplorer({ years, locale }: { years: ExplorerYear[]; locale: "ja" | "en" }) {
  const en = locale === "en", [yearKey, setYearKey] = useState(years[0]?.year ?? ""), [selectedId, setSelectedId] = useState(years[0]?.works[0]?.id ?? ""), [sheetOpen, setSheetOpen] = useState(false), [mobile, setMobile] = useState(false);
  const cards = useRef<HTMLDivElement>(null), strip = useRef<HTMLDivElement>(null), year = years.find(y => y.year === yearKey) ?? years[0], selected = year?.works.find(w => w.id === selectedId) ?? year?.works[0];
  useEffect(() => {
    const container = strip.current;
    if (!container) return;
    const keepVisible = () => {
      const button = container.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (!button) return;
      const view = container.getBoundingClientRect(), item = button.getBoundingClientRect();
      if (item.left < view.left || item.right > view.right) container.scrollTo({ left: container.scrollLeft + item.left - view.left - (view.width - item.width) / 2, behavior: "instant" });
    };
    keepVisible(); const observer = new ResizeObserver(keepVisible); observer.observe(container);
    return () => observer.disconnect();
  }, [yearKey]);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)"), update = () => { setMobile(media.matches); if (!media.matches) setSheetOpen(false); };
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  if (!year || !selected) return <p className={styles.empty}>{en ? "No credited productions yet." : "出演作品はまだ登録されていません。"}</p>;
  const showAll = () => { const details = document.getElementById("all-works"); if (details instanceof HTMLDetailsElement) details.open = true; };
  return <div className={styles.explorer}>
    <div ref={strip} className={styles.yearStrip} role="group" aria-label={en ? "Select an appearance year" : "出演年を選択"}>
      {years.map(y => <button type="button" key={y.year} aria-label={`${y.year === "unknown" ? en ? "Undated" : "年不明" : en ? y.year : `${y.year}年`}${en ? `, ${y.works.length} ${y.works.length === 1 ? "work" : "works"}` : `・${y.works.length}作品`}`} aria-pressed={year.year === y.year} aria-controls="actor-year-works" onClick={() => {
        setYearKey(y.year); setSelectedId(y.works[0].id); cards.current?.scrollTo({ left: 0, top: 0, behavior: "instant" });
      }}>{y.year === "unknown" ? en ? "Undated" : "年不明" : y.year}{" "}<small>({y.works.length}{en ? y.works.length === 1 ? " work" : " works" : "作品"})</small></button>)}
    </div>
    <div className={styles.explorerBody}>
      <div className={styles.workArea}>
        <h3 className={styles.srOnly} aria-live="polite">{year.year === "unknown" ? en ? "Undated" : "年不明" : year.year} ({year.works.length}{en ? year.works.length === 1 ? " work" : " works" : "作品"})</h3>
        <div ref={cards} id="actor-year-works" className={`${styles.workCards}${year.works.length === 1 ? ` ${styles.singleWork}` : ""}`} role="group" aria-label={en ? `${year.year} productions` : `${year.year === "unknown" ? "年不明" : year.year + "年"}の出演作品`}>
          {year.works.map((work, index) => <button type="button" className={styles.workCard} key={work.id} data-play-id={work.id} aria-pressed={selected.id === work.id} aria-haspopup={mobile ? "dialog" : undefined} aria-controls={mobile ? undefined : "actor-selected-work"} onClick={() => { setSelectedId(work.id); if (window.matchMedia("(max-width: 767px)").matches) setSheetOpen(true); }}>
            <span className={styles.cardTop}><span>{work.series?.name}</span><small>{String(index + 1).padStart(2, "0")} / {String(year.works.length).padStart(2, "0")}</small></span>
            <strong>{work.title}</strong>
            <span className={styles.cardRole}>{work.role || (en ? "Role not listed" : "配役情報なし")}</span>
            <span className={styles.cardBottom}><span>{work.date || (en ? "Date not listed" : "公演時期未登録")}</span><span aria-hidden="true">↗</span></span>
          </button>)}
        </div>
        <div className={styles.allWorksLink}><a href="#all-works" onClick={showAll}>{en ? "All works" : "すべて見る"}<span aria-hidden="true">↗</span></a></div>
      </div>
      <aside id="actor-selected-work" className={styles.desktopDetail} aria-label={en ? "Selected production" : "選択した作品の詳細"} aria-live="polite" aria-atomic="true"><ActorWorkDetail work={selected} locale={locale} /></aside>
    </div>
    <DetailDialog open={sheetOpen} onClose={() => setSheetOpen(false)} label={selected.title} className={styles.sheet}>
      <div className={styles.sheetInner}><button type="button" className={styles.close} onClick={() => setSheetOpen(false)} aria-label={en ? "Close details" : "詳細を閉じる"}>×</button><ActorWorkDetail work={selected} locale={locale} /></div>
    </DetailDialog>
  </div>;
}
