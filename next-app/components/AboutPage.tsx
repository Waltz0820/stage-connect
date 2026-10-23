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
    nodes.push({ id: "play", label: en ? "PLAY" : "作品", name: playName, description: en ? "Start with a production and explore its cast, performances and streaming information." : "作品から、公演情報・キャスト・配信情報へ。舞台の記録をひとつずつたどれます。", href: `${prefix}/plays/${play.slug}` });
    if (actor) {
      const actorName = en ? getEnglishActorName(actor) : actor.name;
      nodes.unshift({ id: "actor", label: en ? "ACTOR" : "俳優", name: actorName, description: en ? `Appears in ${playName}. Follow the actor's production history and co-stars.` : `『${play.title}』に出演。出演年表から、ほかの作品や共演者へつながります。`, href: `${prefix}/actors/${actor.slug}` });
      if (actor.roleName) nodes.push({ id: "role", label: en ? "ROLE" : "役柄", name: en ? translateAnnotatedDisplayTextEn(actor.roleName) : actor.roleName, description: en ? `Played by ${actorName} in this production. See the cast for the full credit.` : `この作品で${actor.name}が演じる役柄。作品の配役欄で、出演者との関係を確認できます。`, href: `${prefix}/plays/${play.slug}#cast` });
    }
    if (costar) nodes.push({ id: "costar", label: en ? "CO-STAR" : "共演者", name: en ? getEnglishActorName(costar) : costar.name, description: en ? "Appears in the same production. Another actor can lead you to another stage." : "同じ作品に出演した俳優。共演を入口に、まだ知らない作品にも出会えます。", href: `${prefix}/actors/${costar.slug}` });
    if (play.franchiseSlug && play.franchiseName) nodes.push({ id: "series", label: en ? "SERIES" : "シリーズ", name: en ? getEnglishSeriesName({ name: play.franchiseName, nameEn: play.franchiseNameEn }) : play.franchiseName, description: en ? "This production belongs to the series. Explore its timeline and cast across productions." : "この作品が属するシリーズ。公演の年表や、シリーズを通じた出演者を確認できます。", href: `${prefix}/series/${play.franchiseSlug}` });
  }
  return (
    <main className="container editorial-support support-about">
      <Breadcrumbs items={[{ label: en ? "About" : "当サイトについて" }]} />
      <AboutMotion locale={locale}>
      <section className="about-opening" data-about-reveal>
        <div className="about-opening__copy">
          <span className="eyebrow">ABOUT / OUR MISSION</span>
          <h1>{en ? <>A stage archive.<br />A world of<br /><em>connections.</em></> : <>舞台の記録を、<br />つながりとして<br /><em>残す。</em></>}</h1>
          <p>{en ? "Stage Connect is a digital archive connecting actors, productions, roles, co-stars and series in 2.5D theatre. Discover a stage through the people and stories around it." : "STAGE CONNECTは、2.5次元舞台の俳優・作品・役柄・共演者・シリーズを横断してつながる、デジタルアーカイブです。舞台の感動を、より深く、より長く楽しむために。すべての出会いを、次の出会いへとつなげます。"}</p>
        </div>
        <div className="about-opening__art" aria-hidden="true">
          <Image src="/images/about/stage-illustration.webp" alt="" width={1536} height={1024} sizes="(min-width: 900px) 52vw, 100vw" priority />
          <span className="about-stage-light about-stage-light--one" /><span className="about-stage-light about-stage-light--two" />
          <span className="about-art-label">A STAGE. A STORY. A CONNECTION.</span>
        </div>
        <a className="about-opening__next" href="#connections"><span>2.5D STAGE ARCHIVE<br />DISCOVER / TRACE / CONNECT</span><span className="about-next-arrow" aria-hidden="true">↓</span></a>
      </section>
      <section className="about-how" id="connections" data-about-reveal>
        <span className="eyebrow">HOW IT WORKS</span>
        <h2>CONNECTIONS</h2>
        <p className="about-lead">{en ? "Follow the connections. Discover the stage." : "点ではなく、つながりで舞台をたどる。"}</p>
        <p>{en ? "A production brings together people, roles and a series. This network uses relationships recorded in the archive: each name links to an existing page." : "ひとつの作品から、俳優、演じた役、共演者、シリーズへ。実際に登録されている情報をつないだ、STAGE CONNECTの5つのつながりです。"}</p>
        {nodes.length ? <AboutConnections nodes={nodes} locale={locale} /> : <div className="support-discover"><p>{en ? "Explore the connections from the archive." : "アーカイブから、舞台のつながりをたどってみよう。"}</p><Link href={`${prefix}/plays`}>{en ? "Browse productions →" : "作品を探す →"}</Link></div>}
        <div className="about-discovery"><span aria-hidden="true">↗</span><div><h3>{en ? <>One production.<br />A world of possibilities.</> : <>ひとつの作品から、<br />まだ見ぬつながりが見つかる。</>}</h3><p>{en ? "Follow an actor to a co-star, a related production, or an entire series. Each connection opens another way into the world of 2.5D theatre." : "気になる俳優から、共演者、関連作品、シリーズへ。点在していた情報がつながり、2.5次元舞台の世界をより深く楽しむことができます。"}</p></div></div>
      </section>
      <section className="about-statement" data-about-reveal>
        <StageRigArtwork />
        <div className="about-statement__copy">
          <p>THE STAGE ENDS.<br />THE CONNECTIONS<br /><em>CONTINUE.</em></p>
          <span>{en ? <>The curtain falls.<br />The connections live on.</> : <>ステージは終わっても、<br />つながりはつづく。</>}</span>
        </div>
      </section>
      <section className="about-mission" data-about-reveal>
        <span className="eyebrow">OUR MISSION</span>
        <h2>{en ? <>Keep the stage<br />within reach.</> : <>舞台の感動を、<br />未来につなぐ。</>}</h2>
        <p>{en ? "A favorite actor leads to a new production. A familiar role leads to another performance. Stage Connect keeps these records connected, so there is always another way to explore." : "気になる俳優から、まだ知らない作品へ。好きな役柄から、別の公演へ。STAGE CONNECTは、作品・俳優・役柄・共演者・シリーズの記録をつなぎ、舞台との新たな出会いを楽しめる場所を目指しています。"}</p>
        <Link className="support-button" href={`${prefix}/plays`}>{en ? "Explore the archive" : "ステージのつながりを見に行く"} <span aria-hidden="true">→</span></Link>
        <div className="about-values">
          {(en ? ["Find what you love", "Discover something new", "Keep exploring"] : ["好きが広がる", "新たな発見", "ずっと楽しめる"]).map((value, i) => <div key={value}>
            <span className="about-value-icon"><AboutValueIcon index={i} /></span>
            <strong>{value}</strong>
            <p>{(en ? ["A favorite actor can lead you to an unexpected production.", "Explore new worlds through series and co-stars.", "Keep the records of the stage connected for the future."] : ["気になる俳優から、思わぬ作品に出会える", "シリーズや共演者から、世界が広がる", "舞台の記録を、未来につないでいく"])[i]}</p>
          </div>)}
        </div>
      </section>
      </AboutMotion>
    </main>
  );
}
