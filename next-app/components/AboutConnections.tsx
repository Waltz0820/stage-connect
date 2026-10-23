"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConnectionArtwork } from "./AboutArtwork";

export type ConnectionNode = {
  id: "actor" | "play" | "role" | "costar" | "series";
  label: string;
  name: string;
  description: string;
  href: string;
};

// Every visible relationship is supplied by the server from one production's cast and series.
export function AboutConnections({ nodes, locale }: { nodes: ConnectionNode[]; locale: "ja" | "en" }) {
  const [active, setActive] = useState<string>("play");
  const [enhanced, setEnhanced] = useState(false);
  useEffect(() => {
    const followHash = () => {
      const id = window.location.hash.replace(/^#connection-/, "");
      if (nodes.some(node => node.id === id)) setActive(id);
    };
    followHash();
    setEnhanced(true);
    window.addEventListener("hashchange", followHash);
    window.addEventListener("popstate", followHash);
    return () => {
      window.removeEventListener("hashchange", followHash);
      window.removeEventListener("popstate", followHash);
    };
  }, [nodes]);
  const positions: Record<ConnectionNode["id"], [number, number]> = {
    actor: [23, 22], play: [76, 22], role: [50, 50], costar: [23, 78], series: [76, 78],
  };
  const edges = [["actor", "play"], ["actor", "role"], ["role", "play"], ["actor", "costar"], ["play", "costar"], ["play", "series"]] as const;
  return (
    <div className="about-connections" data-about-reveal>
      <p className="about-network-help">{locale === "ja" ? "つながりを選ぶと、実際のアーカイブへ進めます。" : "Select a connection to explore the actual archive."}</p>
      <div className="about-network" aria-label={locale === "ja" ? "作品を中心につながる5つの情報" : "Five connections around one production"}>
        <svg className="about-network__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {edges.filter(([a, b]) => nodes.some(n => n.id === a) && nodes.some(n => n.id === b)).map(([a, b], index) => <line key={`${a}-${b}`} pathLength={100} style={{ animationDelay: `${index * 90}ms` }} x1={positions[a][0]} y1={positions[a][1]} x2={positions[b][0]} y2={positions[b][1]} />)}
          <circle cx="49.5" cy="22" r="1.4" fill="#315cff" /><circle cx="23" cy="50" r="1.4" fill="#ff725e" /><circle cx="76" cy="50" r="1.4" fill="#d4e852" />
        </svg>
        {nodes.map(node => <Link key={node.id} prefetch={false} className={`about-node about-node--${node.id}${active === node.id ? " is-active" : ""}`} style={{ left: `${positions[node.id][0]}%`, top: `${positions[node.id][1]}%` }} href={`#connection-${node.id}`} onClick={() => setActive(node.id)} onFocus={() => setActive(node.id)} onMouseEnter={() => setActive(node.id)} aria-current={active === node.id ? "true" : undefined} aria-controls={`connection-${node.id}`} aria-label={`${node.label}: ${node.name}`} title={node.name}>
          <ConnectionArtwork kind={node.id} />
          <span className="about-node__caption"><span className="about-node__label">{node.label}</span><span className="about-node__hint">{(locale === "ja" ? { actor: "出演作品・役柄から", play: "公演情報・キャストから", role: "演じた役から", costar: "同じ舞台に立った仲間から", series: "シリーズ・関連作品から" } : { actor: "Follow the performer", play: "Explore the production", role: "Discover the character", costar: "Meet the cast", series: "Trace the series" })[node.id]}</span></span>
        </Link>)}
      </div>
      <div className={`about-connection-list${enhanced ? " is-enhanced" : ""}`}>
        {nodes.map(node => <article key={node.id} id={`connection-${node.id}`} className={`about-connection${active === node.id ? " is-active" : ""}`}>
          <span>{node.label}</span><h3>{node.name}</h3><p>{node.description}</p><Link href={node.href} prefetch={false}>{locale === "ja" ? "アーカイブで見る" : "Explore the archive"} <span aria-hidden="true">↗</span></Link>
        </article>)}
      </div>
    </div>
  );
}
