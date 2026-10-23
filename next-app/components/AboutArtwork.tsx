type Kind = "actor" | "play" | "role" | "costar" | "series";

// Original, anonymous theatre illustrations; these do not depict the linked people or shows.
export function ConnectionArtwork({ kind }: { kind: Kind }) {
  return <svg className={`about-node__art about-node__art--${kind}`} viewBox="0 0 240 240" aria-hidden="true">
    {kind === "play" ? <>
      <path fill="#611d2a" d="M0 0h240v240H0z" />
      <path fill="#ff725e" d="m20 0 90 0 40 160H0zM205 0h35v170L90 140z" opacity=".8" />
      <path fill="#ffb39c" d="m45 0 35 0 72 150-132 0z" opacity=".45" />
      <path fill="#1b1b32" d="M0 151h240v89H0z" />
      {[0,1,2,3].map(row => <g key={row} transform={`translate(${-12 + row * -9} ${163 + row * 23})`} fill="#301a31" stroke="#f7a594" strokeWidth="1.8">{[0,1,2,3,4,5,6,7].map(seat => <path key={seat} transform={`translate(${seat * 40} 0)`} d="M1 20V4Q1-4 10-4h17q9 0 9 8v16z" />)}</g>)}
    </> : kind === "series" ? <>
      <path fill="#1739c6" d="M0 0h240v240H0z" />
      <path fill="#315cff" d="m0 80 240-70v200H0z" />
      {[0,1,2,3,4,5].map(i => <g key={i} transform={`translate(${i % 2 ? 51 : 35} ${39 + i * 27})`}>
        <path d="m0 0 108-17 48 18-108 18z" fill={i % 2 ? "#7894ff" : "#a9b9ff"} />
        <path d="m0 0 48 19v20L0 20z" fill="#102b8c" /><path d="m48 19 108-18v20L48 39z" fill={i % 2 ? "#1943d3" : "#426cfa"} />
        <path d="m57 26 86-14" stroke="#a9b9ff" strokeWidth="2" />
      </g>)}
    </> : <>
      <path fill={kind === "costar" ? "#dfee74" : kind === "role" ? "#e7e9ec" : "#315cff"} d="M0 0h240v240H0z" />
      <circle cx="180" cy="53" r="96" fill={kind === "costar" ? "#f1ffb2" : kind === "role" ? "#fff" : "#7592ff"} />
      {kind === "costar" ? <>
        <Performer x={-28} y={35} scale={0.86} color="#253620" accent="#718637" />
        <g transform="translate(257 0) scale(-1 1)"><Performer x={-25} y={42} scale={0.86} color="#253620" accent="#718637" /></g>
      </> : <Performer x={kind === "role" ? 13 : -7} y={kind === "role" ? 15 : 0} scale={kind === "role" ? 0.96 : 1.1} color={kind === "role" ? "#64748c" : "#101d54"} accent={kind === "role" ? "#b1bbc9" : "#355bc4"} />}
    </>}
  </svg>;
}

function Performer({ x, y, scale, color, accent }: { x: number; y: number; scale: number; color: string; accent: string }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path fill={color} d="m49 240 9-72q2-27 34-35l5-21-8-22 4-33q3-28 30-30 37-4 45 26l-2 28-11 27 4 20q37 5 44 37l15 75z" />
    <path fill={accent} d="m91 132 24 21 33-23-9 31-23 11-31-19zm-27 47 37-15-15 76H50zm80-18 24 10 22 69h-33z" />
    <path fill={color} d="m78 74-5-14 11-5-3-12 13 1 3-13 12 8 14-14 6 12 16-4 1 12 15 7-5 17-9-11-12 9-20-10-17 14z" />
    <path d="m105 177-4 63m42-63 6 63M92 91l7 18m39-33 4 27" fill="none" stroke={accent} strokeWidth="3" />
  </g>;
}

export function StageRigArtwork() {
  return <svg className="about-rig" viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <circle className="about-rig__sun" cx="900" cy="260" r="230" fill="#ff725e" />
    <g className="about-rig__beam"><path d="m528-30 64 0 408 475-141 126z" fill="#a6baff" opacity=".45" /><path d="m528-30 18 0 454 475-55 39z" fill="#fff" opacity=".25" /></g>
    <g fill="none" stroke="#101c45" strokeWidth="11">
      <path d="M335 620 1000 209M335 588l665-411M855 620V264m38 356V243M1001 211v409" />
      {Array.from({ length: 13 }, (_, i) => <path key={i} d={`m${345 + i * 54} ${613 - i * 33.4} 45 -60m-45 28 45 4`} strokeWidth="5" />)}
      <path d="m856 358 37 57-37 57 37 57-37 57m37-285-37 57" strokeWidth="5" />
    </g>
    {[0,1,2,3].map(i => <g key={i} transform={`translate(${520 + i * 133} ${503 - i * 82}) rotate(-12)`} fill="#101c45"><path d="M-3-12h6v33h-6z" /><rect x="-16" y="13" width="32" height="40" rx="5" /><path d="m-22 53 7 11h29l8-11z" /></g>)}
    <path d="M787 620v-87h24v87m100 0v-110h28v110m-193 0v-57h22v57" fill="#101c45" />
  </svg>;
}

export function AboutValueIcon({ index }: { index: number }) {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {index === 0 ? <path d="M24 39 8 23C-4 10 16 1 24 15 32 1 52 10 40 23z" /> : index === 1 ? <><path d="m7 30 5-18q3-5 7 0l1 18m8 0 1-18q4-5 7 0l5 18M20 20h8m-8 7h8" /><circle cx="13" cy="32" r="8" /><circle cx="35" cy="32" r="8" /></> : <><path d="M24 12q-9-6-19-2v28q11-4 19 2 8-6 19-2V10q-10-4-19 2v28" /><path d="M10 14v18m28-18v18" /></>}
  </svg>;
}
