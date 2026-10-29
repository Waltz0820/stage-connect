# 一覧読み込み改善・本番検証 2026-10-29

先行調査は [原因と計測記録](directory-performance-audit-2026-10-29.md)。原因を確認した取得処理だけを調整し、2026-10-29に本番反映した。DBのスキーマ・行データ・RLS・索引・URL構造・SEO設定は変更していない。

## 実施内容

- 作品一覧：全438作品・4,710配役の事前取得を廃止し、基本情報＋表示作品の配役だけを取得。既存の主要3人・兼役の人物重複除去・日英名の決定処理を再利用。`getPlayList()`の既定動作は維持して他ページへ影響させない。
- 俳優一覧：カードにも検索にも使わない日英プロフィール本文を取得しない。名前・かな・生年月日・性別・1,000件以降の取得は維持。既存の関数呼び出しは従来どおりプロフィールを含む。
- シリーズ一覧：独立する作品一覧とシリーズ一覧の2クエリを並列化。
- 日英6一覧：公開anon/RLSカタログの60秒データキャッシュを共用。検索・ソート・ページ送りはリクエストごとに既存処理を使う。投票者個別のデータ、管理者セッション、個人情報はキャッシュに入れない。推しポイントの集計RPCも今回のキャッシュ対象外。
- 6経路へ軽いLoading UIを追加。実データは引き続きSSR。日本語・英語の読み込み案内、reduced-motion対応。
- Vercel Functionsを米国`iad1`からDBと同地域の`syd1`へ。`next-app/vercel.json`で管理。既存のルート直下Vite設定は変更しない。

## 本番の再計測

実装コミット：`5a08e4d8c06d61e57ff9ee2547903e3efb8104b3`。
本番Deployment：`dpl_7rww2ApEQZkHudiJowLeE8UD59Zp`。READY、`stageconnect.jp`への割当、`regions: [syd1]`を確認した。HTTPヘッダーも`kix1::syd1`。

日本の同じ作業環境、HTTPS keep-alive、Accept-Encoding: identity。6経路を各3回、その後に10種類の絞り込み等を同条件で確認。全28応答200。単一環境の小標本であり、全利用者のp95やLCP/描画完了時間ではない。

| 一覧 | 本文HTML到着・変更前→後 | HTML全体の受信完了・変更前→後 |
| --- | ---: | ---: |
| 俳優 JA | 2.789秒 → 0.344秒 | 2.824秒 → 0.349秒 |
| 俳優 EN | 3.607秒 → 0.365秒 | 3.626秒 → 0.371秒 |
| 作品 JA | 4.717秒 → 0.438秒 | 4.747秒 → 0.497秒 |
| 作品 EN | 4.159秒 → 0.431秒 | 4.412秒 → 0.477秒 |
| シリーズ JA | 1.616秒 → 0.323秒 | 1.647秒 → 0.344秒 |
| シリーズ EN | 1.632秒 → 0.438秒 | 1.663秒 → 0.492秒 |

各3回の中央値。本文HTML到着は`<main`を含む最初のチャンクの受信。Loading UIが先に届くTTFBとは区別し、後続のReact HTML分割ストリームを含む全受信完了時間も併記した。改善後の最初の観測の全受信完了は俳優JA1.063秒、作品JA1.019秒、シリーズJA0.477秒。最初の観測は完全に空の全キャッシュ/全インスタンスを保証する厳密なcold-start試験ではない。

`x-vercel-cache`は引き続きMISS、HTML自体もprivate/no-store。今回効かせたのは公開データキャッシュであり、条件ごとのSSR/SEO出力をCDNで混同していない。

## キャッシュなし取得の実測

同一の取得関数を公開キー/anonで実行し、fetchを読み取り専用で計測。Next.jsキャッシュの外での測定。取得量はデコード後JSONバイト数。

| 対象 | API回数 | JSON取得量 |
| --- | ---: | ---: |
| 俳優全件 | 4 → 4 | 652,290 → 209,633 bytes |
| 作品基本情報＋表示10作品の配役 | 26 → 4 | 1,442,020 → 409,787 bytes |
| シリーズ | 2逐次 → 2並列 | 247,812 bytes（変更なし） |

英語版の作品一覧は既存仕様で12件表示。検索・ページングも既存のJA10件/EN12件を変更していない。実データの取得件数は俳優1,176・作品438・配役4,710・シリーズ198と整合。初期10件の配役取得225行は作品ID10行＋配役215行。

## 更新時の鮮度と管理操作

- 管理画面の俳優・作品・配役・シリーズ保存/削除/採用成功時、同じ管理者の既存トークンで`POST /api/admin/revalidate-directory`を呼び、共通タグを失効する。
- サーバーはSupabase Authの`getUser(token)`で検証し、既存管理者メールの許可リストと照合。クライアントの自己申告メタデータは利用しない。未認証401、権限外403、cross-site403。応答no-store。新しい鍵や設定の追加は不要。
- 管理画面ヘッダーへ「公開一覧を更新」を追加。**外部SQL/MCPによる登録はブラウザの保存フックを通らないため、登録後にこのボタンで失効する。** MCP等でDBだけを変更したことを自動検知する仕組みではない。
- 60秒はSWR再検証間隔。外部更新後に操作をしなかった場合、期間経過後の最初のアクセスが古い結果を返しつつ再取得し、その後のアクセスへ反映する。60秒以内の反映保証ではない。即時確認には管理画面の更新操作を使う。
- 失効通信が失敗しても、成功済みのDB保存を失敗扱いにしない。手動更新とSWRが復旧経路。
- 管理者成功経路・権限外・失効失敗時の保存結果維持は自動テストで検証。本番ブラウザは管理画面未ログインだったため、ログイン済みセッションからのボタン押下は今回未実行。本番の未認証拒否401は確認済み。

## 検証

- 型チェック、本番用`next build`成功。
- 検索・日英・全件取得・キャッシュ・失効認可の自動テスト30件成功。新規キャッシュテストを`test:search`へ組み込んだ。
- ローカル/本番の各16経路で、変更前HTMLと本文・全カードのリンク/配役・入力条件・件数・ページ送り・title/description・canonical/hreflang・JSON-LDが一致。
- Reactの`$RS`宣言によるHTML分割を、ページスクリプトを実行せず組み立てて比較した。単純なHTMLパースだけではcold時の遅延セグメントを取り落とすため、比較器を対応させた。
- 390pxとPC1365pxのブラウザ表示、日英切替、検索送信を確認。本番の「刀剣」検索64作品・10件表示・7ページを確認。
- 不要なDB索引追加やSQL検索への置き換えは実施しない。共通CSS分割、LCP/INP実機計測、将来のDB側ページングは残るが、今回の秒単位の待ちの改善とは分離する。

## 変更箇所

- `next-app/lib/stage-connect.ts`、`directory-cache.ts`：取得縮小・並列化・共有データキャッシュ。
- `next-app/app/(ja)/{actors,plays,series}/page.tsx`、`next-app/app/en/{actors,plays,series}/page.tsx`：一覧専用取得へ接続。
- 上記6経路の`loading.tsx`、`components/DirectoryLoading.tsx`、`app/editorial-directory.css`：読み込みフィードバック。
- `lib/directory-refresh.mjs`/`.d.mts`、`lib/admin-supabase.ts`、`app/api/admin/revalidate-directory/route.ts`、ルート`components/admin/AdminLayout.tsx`：自動/手動失効・認可・状態表示。
- `next-app/vercel.json`：syd1。`scripts/directory-data.test.mjs`、`scripts/directory-cache.test.mjs`、`package.json`：回帰テスト。
- `.gitignore`：生成物`*.tsbuildinfo`を除外。

数値原本：`next-app/research/directory-performance-improvements-20261029.json`。private作業ディレクトリに再現スクリプトと比較HTMLを保存。

本番PC確認：

![作品一覧PC](</C:/Users/butch/.codex/visualizations/2026/10/15/01a13eca-736f-71a1-812b-5a84a70e97a5/directory-performance-fix-20261029/production-desktop.jpg>)

本番390px・検索結果：

![作品一覧390px](</C:/Users/butch/.codex/visualizations/2026/10/15/01a13eca-736f-71a1-812b-5a84a70e97a5/directory-performance-fix-20261029/production-mobile.jpg>)
