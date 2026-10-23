# Shared interaction polish — 2026-10-23

The normal catalogue pages now share a small, consistent response to hovering,
pressing, focusing and selecting. About keeps its deliberately stronger creative
motion, with the visible motion pause/play control removed in both languages.
The operating system's reduced-motion preference still applies automatically.

## Changes

- `next-app/app/editorial-interactions.css`: shared 70ms press, 180–280ms response
  timings; row tint and leading edge; title/arrow movement and initial/rank tilt;
  short button compression; selected favorite/vote icon response; anchor, search,
  filter, pagination, favorite and utility controls. Hover movement is limited to
  a fine pointer. Touch and keyboard feedback remain available.
- Native detail/filter dialogs receive a 240ms entrance and backdrop fade. Close
  stays immediate. Existing focus containment, iOS body locking and exact scroll
  restoration are preserved. Expandable detail panels have a short entrance.
- Both locale root layouts import the shared stylesheet after their page styles.
- `AboutMotion.tsx` retains its one-shot reveal observer but removes pause state,
  preference listeners and button. `AboutPage.tsx` drops the unused locale prop;
  `editorial-about.css` removes the obsolete button/pause styles.

No dependencies, API, data schema, catalogue queries or navigation mechanisms were
added or changed. Motion does not delay link navigation or form submission.
Existing reduced-motion, focus outlines and no-JavaScript content are preserved.

## Verification

- Next production build, including TypeScript validation.
- Chrome and WebKit: 60 UI check groups covering JP/EN directories, actor/play/
  series details, About, desktop and iPhone 13 emulation; 320px detail overflow.
- Hover/focus styles, favorite persistence across reload, actual actor → timeline
  → production → Back navigation; mobile filter draft/apply; full-series cast
  dialog, keyboard containment and scroll restoration in both languages.
- Real voting GET, max-three selection, selected state and live reduced-motion
  preference. Vote POST intercepted in isolated browser contexts; no QA votes
  written to the database.
- Two additional browser control flows verify held press feedback, native share
  through a browser stub, detail open/close, real search results, menu focus and
  Escape. No actual shares or affiliate outbound navigation performed.
- Seven-page metadata, structured data, main links and counts match the previous
  homepage release baseline.

The broad local WebKit hard-navigation sweep logged three access-control messages
for interrupted RSC/voting reads while moving between pages. All 60 UI assertions
completed; raw messages are retained with the private QA report. Real device
Safari hardware was not available; mobile checks used WebKit/Chrome emulation.

Private scripts and evidence: the task visualization directory under
`stageconnect-v2-design/verify-shared-touch.cjs`, `verify-touch-controls.cjs`, and
`shared-touch-local/`. Production confirmation is recorded separately there.
