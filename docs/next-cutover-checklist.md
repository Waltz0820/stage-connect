# Stage Connect Next Cutover Checklist

`next-app` is now deployable on Vercel and can render the public site as server HTML.
This checklist is the safe path for switching `stageconnect.jp` from the current Vite app to Next.

## Goal

- Keep data entry work running in the existing app until cutover
- Switch only the public site to Next first
- Preserve SEO assets:
  - canonical
  - JSON-LD
  - sitemap
  - robots
  - internal links in initial HTML

## Recommended Release Shape

Cut over the public domain in one step once these pages are visually acceptable:

- `/`
- `/plays`
- `/plays/[slug]`
- `/actors`
- `/actors/[slug]`
- `/series`
- `/series/[slug]`
- `/guide`
- `/guide/[slug]`
- `/watch`
- `/watch/dmm`
- `/watch/u-next`
- `/watch/danime`

Do not move `/admin` yet.

## Before Cutover

1. Confirm the Vercel preview deploy succeeds
2. Open representative pages and verify:
   - page content renders correctly
   - internal links are visible in page source
   - canonical is correct
   - JSON-LD exists
3. Confirm environment variables are set in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`
4. Set `NEXT_PUBLIC_SITE_URL` to the production domain:
   - `https://stageconnect.jp`
5. Confirm Vercel project settings:
   - Framework Preset: `Next.js`
   - Root Directory: `next-app`
   - Output Directory: blank

## Cutover Steps

1. In Vercel, promote the working Next project to production
2. Attach the production domain:
   - `stageconnect.jp`
   - `www.stageconnect.jp` if used
3. Verify DNS / domain assignment is complete
4. Redeploy once with production env values confirmed

## Immediate Post-Cutover Checks

Open these production URLs:

- `/`
- `/plays`
- `/plays/<main slug>`
- `/actors/<main slug>`
- `/series/<main slug>`
- `/guide`
- `/watch/dmm`

Check:

- page loads normally
- styling is intact
- page source contains real body text
- page source contains `<a href="/plays/...">`, `<a href="/actors/...">`, `<a href="/series/...">`
- canonical points to `https://stageconnect.jp/...`
- `robots.txt` works
- `sitemap.xml` loads

## Search Console Follow-Up

After production cutover:

1. Resubmit sitemap:
   - `https://stageconnect.jp/sitemap.xml`
2. Run URL inspection on a few core pages:
   - one play detail
   - one actor detail
   - one series detail
3. Watch for changes in:
   - crawled pages
   - discovered internal links
   - canonical selection

## Rollback Option

If a serious issue appears:

1. Repoint production domain back to the current Vite project in Vercel
2. Keep the Next project as preview/staging
3. Fix the blocking issue and redeploy

## Notes

- The migration value is not just SSR itself.
- The main benefit is letting Google see the Stage Connect internal link graph in initial HTML.
- That means the most important success metric is:
  - series -> plays
  - plays -> actors
  - actors -> plays
  being visible in page source and then reflected over time in Search Console.
