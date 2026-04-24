import type { CSSProperties } from "react";

const POSTER_PALETTES = [
  { accent: "#8d1942", glow: "#d83d78" },
  { accent: "#233f8f", glow: "#5d83ff" },
  { accent: "#6c3a9a", glow: "#b778ff" },
  { accent: "#8a4a1f", glow: "#ff9a48" },
  { accent: "#1d5f72", glow: "#57d4f0" },
  { accent: "#7b1e2f", glow: "#e54860" },
];

const hashString = (value: string) =>
  Array.from(value).reduce((sum, char) => sum + char.charCodeAt(0), 0);

const pickPalette = (seed: string) => POSTER_PALETTES[hashString(seed) % POSTER_PALETTES.length];

type PlayPosterFrameProps = {
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  seed: string;
};

export function PlayPosterFrame({ title, subtitle, meta, seed }: PlayPosterFrameProps) {
  const palette = pickPalette(seed || title);

  return (
    <div
      className="play-poster-frame"
      style={
        {
          "--poster-accent": palette.accent,
          "--poster-glow": palette.glow,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      <div className="play-poster-frame__beam play-poster-frame__beam--left" />
      <div className="play-poster-frame__beam play-poster-frame__beam--center" />
      <div className="play-poster-frame__beam play-poster-frame__beam--right" />
      <div className="play-poster-frame__floor" />
      <div className="play-poster-frame__grain" />
      <div className="play-poster-frame__content">
        {subtitle ? <span className="play-poster-frame__kicker">{subtitle}</span> : null}
        <span className="play-poster-frame__title">{title}</span>
        {meta ? <span className="play-poster-frame__meta">{meta}</span> : null}
      </div>
    </div>
  );
}
