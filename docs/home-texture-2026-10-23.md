# Home first-view refinement — 2026-10-23

Implements the supplied mobile rough (`ステージコネクトのアーカイブ画面.png`):
large two-line wordmark, drafting texture, quiet series shortcuts, a compact
statistics strip, and smaller ACTORS / PLAYS / SERIES navigation bands.

## Changes

- `next-app/components/ArchiveHeroTexture.tsx`: original, decorative SVG grid,
  dots, fine arcs/lines, blue/lime light shapes and stair marks, with separate
  mobile and desktop compositions. CSS adds a light, static paper grain. No
  actor/production imagery, image-generation dependency, external image request
  or additional client-side animation is needed.
- `next-app/components/ArchiveHome.tsx`: replace the previous desktop node art
  with the supplied visual direction; make the mobile heading's line break
  explicit; add six series shortcuts, limited to series present in the current
  catalogue. JP/EN labels and destinations follow the active locale.
- `next-app/app/editorial-v2.css`: responsive texture positioning, stronger mobile
  headline, compact search/keyword/statistics spacing, horizontal rule beside the
  explore label, and shorter category bands. Bands were 132px mobile / 160px
  desktop; they now measure about 88px mobile / 110px desktop. Their links,
  existing interaction feedback and reveal behavior remain intact.

Catalogue counts, existing homepage link destinations, structured data and SEO
metadata are preserved. The six shortcuts are the only additional main links.
The full search dialog, native search fallback, keyboard focus and reduced-motion
behavior are retained. No database or API changes.

## Verification

Local production build and TypeScript checks passed, along with 16 responsive
layout checks, six interaction/no-JavaScript flows, twelve JP/EN shortcut
destinations and seven baseline page comparisons. Browser page errors: zero.

Build and browser evidence is recorded in the task's private visualization folder:
`stageconnect-v2-design/home-texture-local/` and `home-texture-production/`.
The responsive sweep covers Chrome and WebKit, JP/EN, 320/390/768/1440px, with
screenshots, overflow checks, hit testing, shortcut counts and banner heights.
Interaction checks cover real search results, quick-series navigation / Back,
keyboard category navigation and no-JavaScript search/link availability.

`compare-home-texture.cjs` compares seven pages with the previous public metadata,
structured data, headings, existing main links and counts; only the six new
shortcut links are excluded from the existing-link comparison. Each new series
destination is also checked directly. Mobile browser checks use emulation, not
physical iPhone hardware.
