# Stage Connect V2 / 推しポイント投票

作業日: 2026-10-16〜17。対象は現行の `next-app`。既存のデータ投入・配役調査の変更も作業ツリーに残っているため、この文書は今回のUI・投票改修の範囲を記録する。

## 実装内容

- 日英のトップ、俳優一覧・詳細、作品一覧・詳細、シリーズ一覧・詳細の共通テーマをオフホワイト・ネイビー・藤色に変更。管理画面のテーマには適用しない。
- ラフのサンプル件数・生成された人物写真・紹介文を実データとして取り込まない。画像がない作品は既存のタイトル入り代替表示、俳優はイニシャルを使う。一般的な舞台背景のみローカルSVGで作成した。
- 旧タグをトップ、作品詳細、SEOのkeywords、ナビ、フッター、作品の登録・編集から撤去。作品・シリーズ取得時の `play_tags` 結合、注目タグ取得、旧タグ選択ウィジェットを削除した。
- ジャンル・上演形式・シリーズ・原作区分・配信情報は維持。既存の `tags` / `play_tags` / 作品・俳優データは削除していない。
- 作品詳細は、既存のキャスト・配信・公演・クレジットの後に投票欄を配置。目次からも移動できる。
- 固定10項目から1〜3項目。初回投稿、再訪時の読込み、投票変更、上位3項目、支持率、参加人数、少数票の案内を実装。0票の順位表は表示しない。
- 日本語と英語は共通の作品UUID・マスターID・投票データを使用する。
- 作品一覧は作品名検索、形式、ジャンル、シリーズ、配信リンクの有無、推しポイントを組合せ可能。支持率順は、参加者5人以上かつ選択ポイントの支持者がいる作品だけを対象にする。率が同じ場合は参加者数で比較する。
- 俳優・シリーズにも一覧内検索を追加。英語トップの検索先として `/en/search` を追加した。
- 重複や投票変更の扱いはプライバシーページにも日英で説明した。

## 旧URLの扱い

提供された Search Console ZIP の「ページ.csv」には、`https://stageconnect.jp/tags/tag_style_sharp` の **1クリック / 14表示** が含まれていた。これは書き出し内の記録であり、全期間の流入・被リンクを網羅する調査ではない。

既存の `/tags` と `/tags/[slug]` はリダイレクトしない。旧URLには移行案内を表示し、個別URLにはそれまで関連付いていた作品リンクを残す。旧タグの選択・ランキング・説明・チップは出さない。既存と同様 `noindex, follow`、同じURLのcanonicalを維持する。存在しない分類は404。被リンクの全量調査後にURL単位で最終判断する。

## DB・API

マイグレーション: `sql/2026-10-16_oshi_point_voting.sql`。既存の配役用マイグレーションとは独立し、トランザクション内で適用する。

追加テーブル:

| テーブル | 保存するもの | 公開範囲 |
| --- | --- | --- |
| `oshi_points` | 固定ID、日本語名、英語名、表示順 | 読取り可 |
| `oshi_ballots` | 作品UUID、投票者ハッシュ、選択した全ID、作成・更新日時 | サーバーのみ |
| `oshi_vote_limits` | 回数制限用の匿名ハッシュと時間別カウンター | サーバーのみ |

`oshi_ballots` の主キーは `(play_id, voter_hash)`。DB CHECKで1〜3種類の既知の選択肢・重複なし・NULLなしを検証し、作品IDはFKで検証する。投票変更は原子的upsert。最初の作成日時は維持する。作品を削除した場合だけ関連票をCASCADE削除する。

DB関数:

- `valid_oshi_points(text[])`: CHECKと投票関数で使う固定選択肢の検証。
- `get_oshi_results(uuid)`: 全10項目の集計値と参加人数だけを返す。投票者の識別情報は返さない。
- `discover_oshi_plays(text, integer)`: 5人以上の作品を支持率順で取得。500件ずつページング。
- `submit_oshi_ballot(uuid, text, text, text[])`: 検証、回数制限、投票変更を1トランザクションで処理。`service_role` だけ実行可能。

全テーブルでRLSを有効化し、一般利用者には生の投票・カウンターを読む権限や書き込む権限を与えない。公開集計の関数だけを限定公開する。通常のフロントエンドから直接投票テーブルへinsertする方式ではない。[SupabaseのRLS資料](https://supabase.com/docs/guides/database/postgres/row-level-security)に従い、管理用キーはサーバー側に限定した。

API: `GET /api/plays/[uuid]/oshi` で選択内容・集計を取得し、`POST` で置換保存する。GET/POSTとも `private, no-store`。Cookieに応じたレスポンスを共有キャッシュしない。

匿名識別:

- サーバー生成のランダムIDとHMAC署名を、HttpOnly / SameSite=Lax / HTTPS時SecureのCookieで最長1年間保存。
- サーバーが署名と有効期限を検証し、DBへは別用途のHMACハッシュだけを渡す。
- ブラウザの任意のIDやlocalStorageをそのまま重複防止の根拠にしない。
- 同一作品・同一署名IDは常に1票。別端末・Cookie削除後まで同じ人と断定する仕組みではない。
- Cookie設定は[Next.jsのRoute Handler向け仕様](https://nextjs.org/docs/app/api-reference/functions/cookies)に合わせた。

基本的な不正対策:

- 同一オリジン検査、JSONのみ、ストリームを含めた本文1024バイト上限、署名Cookie必須。
- 本番ではVercelが設定する `x-vercel-forwarded-for` だけを接続元の根拠にする。任意の通常ヘッダーやブラウザから申告されたIPは使わない。[Vercelのヘッダー仕様](https://vercel.com/docs/headers/request-headers)参照。
- IP自体は投票DBへ保存せず、日次ハッシュを使う。IPv6は/64単位でまとめる。
- 同じ作品・同じ接続元は10回/時、同じ匿名IDは30回/時、同じ接続元全体は120回/時。同じ票の更新は3秒間隔。上限超過は429。
- カウンターはDBで原子的に更新するので、Vercelの複数インスタンス間でも共有される。古い回数制限レコードは2日経過後、次の成功投票で削除する。
- 匿名投票なので分散IP・別端末を含む完全な本人確認は行わない。必要なら将来WAF/チャレンジ等を追加する。

## 本番への反映（DB適用済み、公開未実施）

**2026-10-17にユーザーが本番DBへSQLを適用済み。読み取り確認でマスター10項目、集計・検索RPC、投票・制限テーブルの存在、匿名からの非公開テーブルアクセス拒否を確認した。Vercel環境変数設定・公開は未実施。**

ローカルの `next-app/.env.local` には秘密文字列を生成して保存済み（値は非公開）。ローカルからも本番DBにつながるため、以後の投票操作は実データとして保存される。

ローカルサーバー再起動後、実在作品の投票API GETが200で集計・選択状態を返し、署名Cookieを発行することを確認済み。この確認で本番への投稿は行っていない。

1. Supabase SQL Editor等、対象プロジェクトのSQLを実行できる接続で、新規マイグレーションを1回適用する。
2. Vercelに既存のSupabase URL / anonキー / `SUPABASE_SERVICE_ROLE_KEY` に加え、サーバー専用 `OSHI_VOTER_SECRET` を設定する。32文字以上の十分にランダムな値を使い、公開用環境変数にはしない。値はログ・Git・ブラウザへ出さない。
3. secretは継続して同じ値を使う。変更すると以前のCookieは無効になり、従来票の変更ができなくなる。
4. アプリを公開後、HTTPSのJP/EN両方で投稿、再訪、変更、RLS、集計を確認する。

2026-10-17にSupabase連携プラグインの認証が完了し、アプリの接続先と一致する「Stage Connect」プロジェクトへの管理SQLの読み取り実行を確認した。以降は管理用コネクタを使える。ログイン済みの `/admin` は従来どおり既存のデータ編集画面。Vercel側への設定・公開は未実施。設定やマイグレーションが不足すると、投票欄は「準備中」、検索はその旨の案内を表示し、作品ページ全体を落とさない。

管理接続での確認結果: 投票用3テーブルすべてRLS有効。投票とレート制限のテーブルはanon/authenticatedの直接読み書きを許可せず、投稿関数の実行はservice_roleのみ。投票参加人数は確認時0。セキュリティAdvisorでは、非公開テーブルに利用者向けポリシーを設けていないことと、集計専用関数が公開されていることが通知されるが、匿名集計公開・個票非公開の設計によるもの。

既存部分には別途、[所有者権限で動く5つのView](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)、[search_path未固定の3関数](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)、[漏洩パスワード検査未有効](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)などの通知がある。今回の接続確認では既存権限を変更せず、公開データ・依存関係を確認する改修課題として記録する。

本番向けの初回公開前には、この手順まで完了させる必要がある。

## 検証

- `npm run test:voting`: 9件。実際のマイグレーションをPGlite/PostgreSQLで実行。DB制約、置換、作成日時、RLSと実行権限、レート制限、全10項目、上位3項目、最低5人、100%を超え得る複数選択の集計、マスター日英一致、署名・Origin・接続元検証を確認。
- `npm run test:locale`: 7件。既存の翻訳辞書686件・部分変換33件、配役注記、日英URLを確認。
- `npm run test:research`: 96件。従来の配役・候補・俳優登録処理を確認。
- `npm run verify:voting-preview`: 実際のNext APIに対し、不正入力・CSRF・Cookieなし・連投・投稿・再訪・置換・5人到達後の検索を確認。本番書込み0。
- `npm run test:v2-pages`: 本番用ビルドの30ページでHTTP 200、JP/ENのlang、main/h1/viewport、旧タグUI撤去、配役・公演・配信の導線、作品のcanonical、検索とページ送りを確認。旧タグ個別URL、DMM/U-NEXTガイドも含む。テニミュ36配役、刀ステ16配役のリンクを維持。
- `npm run build`: TypeScript検証と本番用ビルド成功。必要な環境変数がない場合に、APIが内部情報を出さず503となることも確認。
- ブラウザ: 390pxで選択上限、JA投稿→ENへ引継ぎ→ENで変更→JAで再読込み、参加人数が増えないことを確認。1280pxでも投票・上位3項目の表示を確認した。

隔離プレビューは `npm run preview:voting`（8139）。8142のメモリDBへ投票し、本番Supabaseへは公開テーブル/ViewのGET/HEADだけを転送する。外部へのPOST/更新/削除やRPC転送は拒否する。終了時にテスト票は消える。画面のテスト票を本番の成果として扱わない。

## 主な変更ファイル

| 範囲 | ファイル |
| --- | --- |
| 共通デザイン | `next-app/app/stage-v2.css`, `next-app/app/globals.css`, `next-app/public/stage-atmosphere.svg` |
| 共通ヘッダー・検索 | `next-app/components/SiteChrome.tsx`, `SearchBarClient.tsx`, `next-app/lib/locale-routing.ts` |
| 日英の各画面 | `next-app/app/(ja)/` と `next-app/app/en/` のトップ、actors/plays/seriesの各一覧、作品詳細、両layout。俳優・シリーズ詳細は既存マークアップに共通CSSを適用 |
| 投票UI・発見導線 | `next-app/components/OshiVotingClient.tsx`, `OshiPoints.tsx`, `PlayDiscoveryForm.tsx` |
| API・匿名識別 | `next-app/app/api/plays/[id]/oshi/route.ts`, `next-app/lib/oshi-server.ts`, `oshi-security.mjs`と型宣言 |
| マスター・集計 | `next-app/lib/oshi-points.mjs`と型宣言、`sql/2026-10-16_oshi_point_voting.sql` |
| 旧タグ撤去 | `next-app/lib/stage-connect.ts`, `components/admin/AdminPlayEdit.tsx`, `AdminHome.tsx`。`TagMultiSelect.tsx`は削除 |
| 旧URL | `next-app/app/(ja)/tags/page.tsx`, `tags/[slug]/page.tsx` |
| 説明・設定 | `next-app/app/(ja)/privacy/page.tsx`, `next-app/.env.example`, `next-app/package.json` |
| 検証 | `next-app/scripts/oshi-voting.test.mjs`, `verify-voting-preview.mjs`, `serve-voting-preview.mjs`, `check-v2-pages.mjs`, `localization.test.mjs` |

## 残課題

- Vercel環境変数設定・公開、本番での最終確認。投票用SQLは適用・読み取り確認済み。
- 旧タグURLの被リンク全量調査と、URLごとの長期運用判断。
- ラフの作品画像・俳優写真の用意。サンプル画像を実際の作品写真として流用しない。
- ラフにあるシリーズ全体の人気推しポイントや高度な推薦は今回の対象外。作品単位の全項目データは保持しているので後から集計可能。
- 投票規模が増えた際の事前集計・キャッシュ、レート上限の運用調整、分散不正対策。
- 既存の未翻訳テキストはそのまま残る。今回追加した投票・検索のUIは日英対応済み。
