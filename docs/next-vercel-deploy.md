# Stage Connect Next 仮デプロイ手順

`next-app` を Vercel 上で仮公開し、現行 Vite 版と HTML 出力や内部リンク認識を比較するための手順です。

## 目的
- `next-app` の公開ページを実URLで確認する
- HTML ソースに本文と内部リンクが初期出力されていることを確かめる
- Search Console / URL検査向けに、SSR / SSG 版の挙動を検証する

## 前提
- リポジトリ: `c:\Users\butch\stage-connect`
- Next アプリのルート: [`next-app`](c:\Users\butch\stage-connect\next-app)
- 現行 Vite 本体はそのまま維持

## Vercel での設定
1. リポジトリを新規プロジェクトとして import
2. `Root Directory` を `next-app` に設定
3. Framework Preset は `Next.js` のままで OK
4. Build Command はデフォルトのままで OK
5. Output Directory もデフォルトのままで OK

## Environment Variables
以下を Vercel に設定する

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

推奨値:

- Preview: `https://<preview-domain>`
- Production 予定: `https://stageconnect.jp`

注意:
- `NEXT_PUBLIC_SITE_URL` は `metadataBase`, `sitemap`, `robots`, `JSON-LD` の URL に使う
- Preview 環境では Preview ドメインに合わせた方が canonical 確認がしやすい

## デプロイ後の確認項目

### 1. HTMLソース確認
以下のページで「ページのソースを表示」して、本文とリンクが最初から入っているか確認する

- `/`
- `/plays`
- `/plays/<slug>`
- `/actors/<slug>`
- `/series/<slug>`
- `/guide/<slug>`
- `/watch/dmm`

見るポイント:
- 本文テキストが HTML に含まれている
- 俳優リンクや作品リンクが `<a>` として初期HTMLにある
- JSON-LD script が入っている
- canonical が正しい

### 2. 主要URLの目視
以下を現行 Vite 版と見比べる

- 作品詳細
- 俳優詳細
- シリーズ詳細
- ガイド詳細

見るポイント:
- 情報欠落がないか
- タイトル・説明文が自然か
- 主要導線が揃っているか

### 3. Search Console の確認候補
仮ドメイン単体でプロパティを切るか、URL検査だけでもよい

優先URL:
- `/plays/<主要作品>`
- `/actors/<主要俳優>`
- `/series/tennimu`

見るポイント:
- HTML 取得後に本文が見えているか
- Google が内部リンクを拾いやすくなっていそうか

## 現時点の Next 側対象ルート
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
- `/robots.txt`
- `/sitemap.xml`

## 現時点のビルド状態
- `npm run build` 通過済み
- 主要詳細は `generateStaticParams` による `SSG`
- 一覧・watch・robots・sitemap は静的出力

## 切り替え判断の軸
- HTMLソースに本文と内部リンクが十分出ているか
- 現行 Vite 版との情報差分が許容範囲か
- Search Console 上で内部リンク認識の改善が見込めるか

この3点が揃えば、次は「どのルートから先行切り替えするか」の判断に進める。
