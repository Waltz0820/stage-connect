import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPlayDetailBySlug } from "../lib/stage-connect";
import { getEnglishActorName, getEnglishPlayTitle, getEnglishSeriesName, translateAnnotatedDisplayTextEn } from "../lib/en-copy";
import { AboutConnections, type ConnectionNode } from "./AboutConnections";
import { Breadcrumbs } from "./Breadcrumbs";
import { AboutMotion } from "./AboutMotion";
import { AboutValueIcon, StageRigArtwork } from "./AboutArtwork";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";
export function aboutMetadata(locale: "ja" | "en"): Metadata {
  return {
    title: locale === "ja" ? "当サイトについて | Stage Connect（ステコネ）" : "About Stage Connect | Stage Connect",
    description: locale === "ja" ? "2.5次元舞台の俳優・作品・役柄・共演者・シリーズをつなぐデジタルアーカイブ、Stage Connectについて。" : "Discover Stage Connect, a digital archive connecting 2.5D stage productions, actors, roles, co-stars and series.",
    alternates: { canonical: `${siteUrl}${locale === "ja" ? "/about" : "/en/about"}`, languages: { ja: `${siteUrl}/about`, en: `${siteUrl}/en/about` } },
  };
}

export async function AboutPage({ locale }: { locale: "ja" | "en" }) {
  const en = locale === "en";
  const prefix = en ? "/en" : "";
  const play = await getPlayDetailBySlug("tennimu-1st-final-rikkai-second");
  const actor = play?.cast.find(item => item.roleName);
  const costar = play?.cast.find(item => item.slug !== actor?.slug);
  const nodes: ConnectionNode[] = [];
  if (play) {
    const playName = en ? getEnglishPlayTitle(play) : play.title;
    nodes.push({ id: "play", label: en ? "PLAY" : "作品", name: playName, description: en ? "Check performance dates, casts and streaming links." : "公演日程・出演キャスト・配信情報を確認できます。", href: `${prefix}/plays/${play.slug}` });
    if (actor) {
      const actorName = en ? getEnglishActorName(actor) : actor.name;
      nodes.unshift({ id: "actor", label: en ? "ACTOR" : "俳優", name: actorName, description: en ? `Appears in ${playName}. Explore the actor's credits and co-stars.` : `『${play.title}』に出演。出演年表からほかの作品や共演者を探せます。`, href: `${prefix}/actors/${actor.slug}` });
      if (actor.roleName) nodes.push({ id: "role", label: en ? "ROLE" : "役柄", name: en ? translateAnnotatedDisplayTextEn(actor.roleName) : actor.roleName, description: en ? `Played by ${actorName}. See the production's full cast and roles.` : `この作品で${actor.name}が演じた役。ほかの配役も作品ページで確認できます。`, href: `${prefix}/plays/${play.slug}#cast` });
    }
    if (costar) nodes.push({ id: "costar", label: en ? "CO-STAR" : "共演者", name: en ? getEnglishActorName(costar) : costar.name, description: en ? "Appears in the same production. Explore more of this actor's credits." : "同じ作品に出演した俳優です。別の出演作からも舞台を探せます。", href: `${prefix}/actors/${costar.slug}` });
    if (play.franchiseSlug && play.franchiseName) nodes.push({ id: "series", label: en ? "SERIES" : "シリーズ", name: en ? getEnglishSeriesName({ name: play.franchiseName, nameEn: play.franchiseNameEn }) : play.franchiseName, description: en ? "Explore the series timeline and casts across productions." : "公演年表と歴代キャストをまとめて確認できます。", href: `${prefix}/series/${play.franchiseSlug}` });
  }
  return (
    <main className="container editorial-support support-about">
      <Breadcrumbs items={[{ label: en ? "About" : "当サイトについて" }]} />
      <AboutMotion>
      <section className="about-opening" data-about-reveal>
        <div className="about-opening__copy">
          <span className="eyebrow">ABOUT / OUR MISSION</span>
          <h1>{en ? <>A stage archive.<br />A world of<br /><em>connections.</em></> : <>舞台の記録を<br />つないで<br /><em>残す。</em></>}</h1>
          <p>{en ? "Stage Connect is a digital archive of 2.5D theatre. Explore productions and actors through roles, credits and co-stars." : <><span className="copy-phrase">2.5次元舞台の</span><span className="copy-phrase">デジタルアーカイブです。</span><br/><span className="copy-phrase">作品と俳優を</span><span className="copy-phrase">配役や共演の記録でつなぎます。</span></>}</p>
        </div>
        <div className="about-opening__art" aria-hidden="true">
          <Image src="/images/about/stage-illustration.webp" alt="" width={1536} height={1024} sizes="(min-width: 900px) 52vw, 100vw" priority />
          <span className="about-stage-light about-stage-light--one" /><span className="about-stage-light about-stage-light--two" />
          <span className="about-art-label">A STAGE. A STORY. A CONNECTION.</span>
        </div>
        <Link className="about-opening__next" href="#connections" prefetch={false}><span>2.5D STAGE ARCHIVE<br />DISCOVER / TRACE / CONNECT</span><span className="about-next-arrow" aria-hidden="true">↓</span></Link>
      </section>
      <section className="about-how" id="connections" data-about-reveal>
        <span className="eyebrow">HOW IT WORKS</span>
        <h2>CONNECTIONS</h2>
        <p className="about-lead">{en ? "Follow the people behind each production." : "作品と人のつながりをたどる"}</p>
        <p>{en ? "Actors, productions, roles, co-stars and series. Move between these five kinds of information to explore the archive." : "俳優・作品・役柄・共演者・シリーズ。5つの情報を行き来しながら気になる舞台を探せます。"}</p>
        {nodes.length ? <AboutConnections nodes={nodes} locale={locale} /> : <div className="support-discover"><p>{en ? "Explore productions in the archive." : "作品から舞台のつながりをたどれます。"}</p><Link href={`${prefix}/plays`}>{en ? "Browse productions →" : "作品を探す →"}</Link></div>}
        <div className="about-discovery"><span aria-hidden="true">↗</span><div><h3>{en ? <>One production.<br />Your next discovery.</> : <>ひとつの作品から<br />次の舞台へ。</>}</h3><p>{en ? "Explore an actor's other credits or another production in the series. Follow those connections to find what to watch next." : "気になる俳優の出演作や同じシリーズの別公演。作品同士のつながりから次に観たい舞台を探せます。"}</p></div></div>
      </section>
      <section className="about-statement" data-about-reveal>
        <StageRigArtwork />
        <div className="about-statement__copy">
          <p>THE STAGE ENDS.<br />THE CONNECTIONS<br /><em>CONTINUE.</em></p>
          <span>{en ? <>The curtain falls.<br />The connections live on.</> : <>ステージは終わっても<br />つながりはつづく。</>}</span>
        </div>
      </section>
      <section className="about-mission" data-about-reveal>
        <span className="eyebrow">OUR MISSION</span>
        <h2>{en ? <>Keep the stage<br />within reach.</> : <>舞台の感動を<br />未来につなぐ。</>}</h2>
        <p>{en ? "A production ends, but its credits should remain easy to find. We connect records of productions, actors and series so you can keep exploring." : "公演が終わったあとも出演者や配役を調べられるように。作品・俳優・シリーズの記録をつなぎ、舞台との出会いを支えます。"}</p>
        <Link className="support-button" href={`${prefix}/plays`}>{en ? "Browse productions" : "作品を探す"} <span aria-hidden="true">→</span></Link>
        <div className="about-values">
          {(en ? ["Follow an actor", "Explore co-stars", "Preserve the record"] : ["出演作をたどる", "共演者から探す", "公演の記録を残す"]).map((value, i) => <div key={value}>
            <span className="about-value-icon"><AboutValueIcon index={i} /></span>
            <strong>{value}</strong>
            <p>{(en ? ["Look back through an actor's production timeline.", "Discover actors who shared the same stage.", "Find dates and cast credits after a production ends."] : ["俳優ごとの出演年表を一覧", "同じ舞台に立った俳優をたどる", "公演日程や配役をあとから確認"])[i]}</p>
          </div>)}
        </div>
      </section>
      </AboutMotion>
    </main>
  );
}
