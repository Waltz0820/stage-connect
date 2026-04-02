# Stage Connect Next Prototype

既存の Vite 本体を止めずに、公開ページだけを Next.js に並行移行するための検証用アプリです。

## 目的
- 作品・俳優・シリーズの本文と内部リンクを初期HTMLに出す
- Search Console 上で取りこぼされている可能性のある内部リンクを補強する
- まずは公開ページだけを SSR / SSG 化し、管理画面は後回しにする

## セットアップ
1. `next-app/.env.local` を用意
2. 以下を設定

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=https://stageconnect.jp
```

3. 依存をインストール

```bash
npm install
```

4. 開発サーバーを起動

```bash
npm run dev
```

## 現在の対象ルート
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

主要詳細ページは `generateStaticParams` を使って SSG 化しています。

## Vercel 仮デプロイ
- Root Directory は `next-app`
- 必要な環境変数は [`next-app/.env.example`](c:\Users\butch\stage-connect\next-app\.env.example) を参照
- 詳細手順は [`docs/next-vercel-deploy.md`](c:\Users\butch\stage-connect\docs\next-vercel-deploy.md)
