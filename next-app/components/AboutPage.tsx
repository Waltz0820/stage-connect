import type { Metadata } from "next";
import Link from "next/link";
import { getPlayDetailBySlug } from "../lib/stage-connect";
import { getEnglishActorName, getEnglishPlayTitle, getEnglishSeriesName, translateAnnotatedDisplayTextEn } from "../lib/en-copy";
import { AboutConnections, type ConnectionNode } from "./AboutConnections";
import { Breadcrumbs } from "./Breadcrumbs";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";
export function aboutMetadata(locale: "ja" | "en"): Metadata {
  return {
    title: locale === "ja" ? "Stage Connectについて | Stage Connect（ステコネ）" : "About Stage Connect | Stage Connect",
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
      <Breadcrumbs items={[{ label: "About" }]} />
      <section className="about-opening">
        <span className="eyebrow">ABOUT / OUR MISSION</span>
        <h1>{en ? <>A stage archive.<br />A world of<br /><em>connections.</em></> : <>舞台の記録を、<br />つながりとして<br /><em>残す。</em></>}</h1>
        <p>{en ? "Stage Connect is a digital archive connecting actors, productions, roles, co-stars and series in 2.5D theatre. Discover a stage through the people and stories around it." : "STAGE CONNECTは、2.5次元舞台の俳優・作品・役柄・共演者・シリーズを横断してつながる、デジタルアーカイブです。舞台の感動を、より深く、より長く楽しむために。すべての出会いを、次の出会いへとつなげます。"}</p>
        <a className="about-opening__next" href="#connections">DISCOVER / TRACE / CONNECT <span aria-hidden="true">↓</span></a>
      </section>
      <section className="about-how" id="connections">
        <span className="eyebrow">HOW IT WORKS</span>
        <h2>CONNECTIONS</h2>
        <p className="about-lead">{en ? "Follow the connections. Discover the stage." : "点ではなく、つながりで舞台をたどる。"}</p>
        <p>{en ? "A production brings together people, roles and a series. This network uses relationships recorded in the archive: each name links to an existing page." : "ひとつの作品から、俳優、演じた役、共演者、シリーズへ。実際に登録されている情報をつないだ、STAGE CONNECTの5つのつながりです。"}</p>
        {nodes.length ? <AboutConnections nodes={nodes} locale={locale} /> : <div className="support-discover"><p>{en ? "Explore the connections from the archive." : "アーカイブから、舞台のつながりをたどってみよう。"}</p><Link href={`${prefix}/plays`}>{en ? "Browse productions →" : "作品を探す →"}</Link></div>}
      </section>
      <section className="about-statement"><p>THE STAGE ENDS.<br />THE CONNECTIONS<br /><em>CONTINUE.</em></p><span>{en ? "Keep the story of the stage connected." : "ステージは終わっても、つながりはつづく。"}</span></section>
      <section className="about-mission"><span className="eyebrow">OUR MISSION</span><h2>{en ? <>Keep the stage<br />within reach.</> : <>舞台の感動を、<br />未来につなぐ。</>}</h2><p>{en ? "A favorite actor leads to a new production. A familiar role leads to another performance. Stage Connect keeps these records connected, so there is always another way to explore." : "気になる俳優から、まだ知らない作品へ。好きな役柄から、別の公演へ。STAGE CONNECTは、作品・俳優・役柄・共演者・シリーズの記録をつなぎ、舞台との新たな出会いを楽しめる場所を目指しています。"}</p><Link className="support-button" href={`${prefix}/plays`}>{en ? "Explore the archive" : "ステージのつながりを見に行く"} <span aria-hidden="true">→</span></Link><div className="about-values">{(en ? ["Find what you love", "Discover something new", "Keep exploring"] : ["好きが広がる", "新たな発見", "ずっと楽しめる"]).map((value, i) => <p key={value}><span aria-hidden="true">{["♡", "↗", "≡"][i]}</span><strong>{value}</strong></p>)}</div></section>
    </main>
  );
}
