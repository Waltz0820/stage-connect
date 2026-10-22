"use client";

import Link from "next/link";
import { useState } from "react";

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
  const positions: Record<ConnectionNode["id"], [number, number]> = {
    actor: [23, 22], play: [76, 22], role: [50, 50], costar: [23, 78], series: [76, 78],
  };
  const edges = [["actor", "play"], ["actor", "role"], ["role", "play"], ["actor", "costar"], ["play", "costar"], ["play", "series"]] as const;
  return (
    <div className="about-connections">
      <p className="about-network-help">{locale === "ja" ? "つながりを選ぶと、実際のアーカイブへ進めます。" : "Select a connection to explore the actual archive."}</p>
      <div className="about-network" aria-label={locale === "ja" ? "作品を中心につながる5つの情報" : "Five connections around one production"}>
        <svg className="about-network__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {edges.filter(([a, b]) => nodes.some(n => n.id === a) && nodes.some(n => n.id === b)).map(([a, b], index) => <line key={`${a}-${b}`} pathLength={100} style={{ animationDelay: `${index * 90}ms` }} x1={positions[a][0]} y1={positions[a][1]} x2={positions[b][0]} y2={positions[b][1]} />)}
        </svg>
        {nodes.map(node => <a key={node.id} className={`about-node about-node--${node.id}${active === node.id ? " is-active" : ""}`} style={{ left: `${positions[node.id][0]}%`, top: `${positions[node.id][1]}%` }} href={`#connection-${node.id}`} onClick={() => setActive(node.id)} onFocus={() => setActive(node.id)} aria-label={`${node.label}: ${node.name}`} title={node.name}>
          <span className="about-node__label">{node.label}</span><span className="about-node__name">{node.name}</span>
        </a>)}
      </div>
      <div className="about-connection-list">
        {nodes.map(node => <article key={node.id} id={`connection-${node.id}`} className={`about-connection${active === node.id ? " is-active" : ""}`}>
          <span>{node.label}</span><h3>{node.name}</h3><p>{node.description}</p><Link href={node.href}>{locale === "ja" ? "アーカイブで見る" : "Explore the archive"} <span aria-hidden="true">↗</span></Link>
        </article>)}
      </div>
    </div>
  );
}
