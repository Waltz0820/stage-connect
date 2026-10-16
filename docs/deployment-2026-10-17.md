# 2026-10-17 本番リリース

- URL: https://stageconnect.jp/
- Vercel: `stage-connect` / `stage-connect-ggdd`
- 対象: production、Next.js 15.5.28
- 公開コミット: `83f72a0150d7d29e7a2befb99f95f2cc71a9234a`
- 初回デプロイ: `dpl_EazEZ1hBziYUUV5gys5zVna2FaV1`、READY。ビルド41秒。
- GitHubの `main` にも同一コミットをfast-forward反映済み。その自動本番デプロイ `dpl_EqC1Q5PgidaMvTA4sxR7r7ThGhDw` もREADY、`stageconnect.jp` の割当成功。今後の通常のmain公開にも同じ改修が含まれる。
- 前回本番: `dpl_BX6CeHWg8F3EYG45a1HyPYHFSR7Z`。必要ならVercelでロールバック可能。

## 設定とDB

Productionへ `SUPABASE_SERVICE_ROLE_KEY` と `OSHI_VOTER_SECRET` をSecretとして追加。値は非公開。Previewには本番service_roleを追加していない。

ユーザー適用済みの投票SQLに加え、以前の管理改修に必要な次のマイグレーションを順に適用した。

1. `2026-10-16_atomic_accept_external_cast_candidate.sql`
2. `2026-10-16_work_cast_candidate_fields.sql`
3. `2026-10-16_reviewed_actor_registration.sql`

プロジェクトのデフォルト権限で関数へanonの直接EXECUTEが付くことを実DBで確認したため、上記SQLのREVOKE対象をPUBLICとanonに修正。追加の管理マイグレーション `restrict_external_candidate_rpc_execution` で既に作られた5関数からもanon権限を除去した。管理用4RPCはanon実行不可・authenticated実行可を確認。関数はsecurity invokerで既存管理RLSを維持する。既存の作品・俳優・配役データを書き換えるデータ移行は行っていない。

## 検証

- 投票9、日英7、既存取り込み96の合計112テスト成功。
- REVOKE修正後、作品候補ストレージ17、俳優登録15を再検証し成功。
- 本番30ページで200、JP/ENのlang、main/h1/viewport、旧タグUI撤去、配役・公演・配信・SEO導線、検索を確認。
- `/robots.txt`、`/sitemap.xml`、`/admin`、JP/EN推しポイント検索も200。
- 本番HTTPSの投票API GET、HttpOnly/Secure/SameSite Cookie、CSRF拒否、選択数制限、POST保存、DBへの全選択肢保存、選び直し、同一行・作成日時の維持、再訪時の選択復元を確認。
- 投票配列はDBが整列して保存するため、確認は選択集合として比較。確認用の匿名IDで作ったテスト票はfinally処理で削除し、削除をDBで確認した。他ユーザーの投票は削除していない。レート制限カウンターは通常の有効期限に従う。
- 本番ブラウザで投票フォームの読み込み完了と選択可能な状態を確認。
- 対象デプロイの直近30分のerror/fatalログは0件。最初の1時間指定はHobbyのログ取得範囲制限で失敗したため、30分へ絞って取得成功。
- 外部ログDrainsは未設定。Supabase既存部分のAdvisor通知は [投票実装メモ](./stage-v2-voting.md) に記録。

`next-app/scripts/check-v2-pages.mjs` は `STAGE_VERIFY_BASE_URL=https://stageconnect.jp` で本番を確認できるようにした。指定なしでは従来の8139ローカルプレビューを使う。

## 残る運用事項

作品写真・俳優写真は現状の代替表示。旧タグURLの長期方針と既存DBのAdvisor通知の精査、投票規模に応じた集計性能・不正対策調整は継続課題。
