# 俳優詳細の探索UI V1

実装・検証後、ユーザーの本番反映指示を受けて2026-10-29に公開済み。このUI変更によるDBへの書き込み・スキーマ変更なし。

確認先：[荒牧慶彦の本番ページ](https://stageconnect.jp/actors/aramaki-yoshihiko) / [英語版](https://stageconnect.jp/en/actors/aramaki-yoshihiko)。

## 実装

- 日英の全俳優詳細を共通の `ActorArchive` で表示。既存ヘッダー・フッター・検索・お気に入り・シェア・言語切替を維持。
- プロフィールと基本情報、登録作品数、主なシリーズをまとめた。長いプロフィールはネイティブの展開式で全文を保持。
- 年別タブ→作品カード→配役・日程・共演者・作品詳細という流れ。初期年は登録済み公演の最新年。未来公演も元の公演時期を表示し、年や日付の欠けは補わない。
- PCは左右2列と選択作品パネル。作品が多い年はカード領域内でスクロールし、全作品を縦に積まない。モバイルはカードの横スクロールとボトムシート。
- 既存 `DetailDialog` のネイティブdialog、フォーカス循環、Escape、背景クリック、スクロール固定・復元を再利用。画面幅が変わっても選択年を見失わないように調整。
- 全作品・内部リンク・配役と注記・DMMリンクは初期HTML内の `details#all-works` に残した。JSに依存せず展開して読める。
- 共演ネットワークの集計方式は変更せず、小さな一覧と展開部へ。出演シリーズの分布も実数から表示。
- 画像、疑似ポスター、観劇ノート、ログイン、仮の観劇状態などは追加していない。

## データ取得と保全

既存 `getActorDetailBySlug` の読み込みを使用。既存列 `casts.id / role_name / cast_group / note / is_starring / billing_order` を読み、同一作品を1カードにまとめても、個々の配役レコードを別々に保持する。複数役や公演限定、声の出演等の注記は選択パネルで省略しない。出演数は配役行数ではなく作品数。

作品別の共演者は既存の共演ネットワーク取得結果から抽出し、一部6名を表示。年代・作品の切替に追加APIや個別のDBアクセスはない。既存の未翻訳タイトル・特殊な注記は既存の英語表示関数によるフォールバックを保ち、データを書き換えていない。

DMM URLの正規化・アフィリエイトパラメータと `data-streaming-placement="actor_timeline" / data-play-id / data-play-slug` を保持。詳細パネルとSSR全作品一覧の両方からアクセスできる。既存metadata、Person/Breadcrumb/日本語FAQのJSON-LD、canonical、hreflangは日英ルート側で維持。

## 変更ファイル

| ファイル | 内容 |
| --- | --- |
| `next-app/components/ActorArchive.tsx` | 日英共通のプロフィール、共演・シリーズ、SSR全作品一覧、公式リンク・FAQ |
| `next-app/components/ActorAppearanceExplorer.tsx` | 年・作品選択、PC詳細パネル、スマホシート |
| `next-app/components/ActorExplorer.module.css` | スコープを俳優探索UIへ限定したレスポンシブ・操作感・reduced motion |
| `next-app/lib/actor-explorer.ts` | 日付精度を保った年別データと日英表示モデル |
| `next-app/lib/stage-connect.ts` | 既存配役の条件・組・主演等と作品別共演者を表示用データへ追加 |
| `next-app/app/(ja)/actors/[slug]/page.tsx` | SEO処理を残して共通UIへ接続 |
| `next-app/app/en/actors/[slug]/page.tsx` | 英語SEO処理を残して共通UIへ接続 |
| `next-app/scripts/actor-explorer.test.mjs` | 空・少数・多数作品、複数配役、注記、不完全日付、英語の回帰テスト |

## 検証

- `next build`：成功。型チェック・静的ページ生成33件も成功。
- 新規6件と既存26件の計32テスト成功：
  `node --test scripts/actor-explorer.test.mjs scripts/play-cast.test.mjs scripts/streaming.test.mjs scripts/localization.test.mjs`
- 日英12ページのSSR確認：荒牧慶彦33作品、山内圭輔0、酒井広大1、丸川敬之2、伊崎龍次郎50、佐々木喜英48。HTTP200、単一h1/main、全作品リンク、canonical/hreflang、Person生年月日、既存DMM導線を確認。
- ラフの「荒牧・2017年3作品」はサンプル。実DBは2017年5作品なので5件を表示。ジョ伝・外伝・義伝の切替で日程・役名・共演者・リンクの更新を確認。
- 1440px PCと390pxモバイルをブラウザで確認。モバイルの開く・閉じる・Escape・背景タップ・Tab循環・カードへのフォーカス復帰・スクロール復元を確認。作品ページへの遷移も確認。
- 最終の本番用ビルドの確認ページでは、コンソールのerrorは0件。全33作品のネイティブ展開も確認。
- 0/1/2作品、同年45作品、日付欠落・不正値・「2026/11〜12月」の月精度、複数役・A/B・声・役名なし注記、配信リンクなし・共演者なしをデータ変換テストに含めた。

スクリーンショットとSSR検証記録は、Git管理外の `C:/Users/butch/.codex/visualizations/2026/10/15/01a13eca-736f-71a1-812b-5a84a70e97a5/actor-explorer-v1/` に保存：`desktop.jpg`、`mobile.jpg`、`mobile-sheet.jpg`、`ssr-verification.json`。

## 残項目と拡張点

- 実機iPhone/Safariの操作確認は未実施。モバイル幅のブラウザと既存のiOS向けdialog実装で検証した。
- 開発時、今回変更していない共通AdSenseのhead書き換えとNextの初期スクリプトに関するhydration警告を観測。探索UIの型エラー・描画エラーとは区別して記録し、共通広告実装は変更していない。
- 元データの翻訳不足や人物属性の精査は今回の対象外。
- 将来の観劇ノートは `ExplorerWork.id`（DBのplay ID）をキーとして、作品カードや `ActorWorkDetail` の操作領域へ接続できる。今回はそのためのUI・ユーザー状態・DBを追加していない。

## 本番反映

ユーザーの「UIも本番反映しといて大丈夫」という後続指示に従い、実装コミット `69d5fc044e1a0030d65825eac15f494fd76060a7` を `origin/main` へ反映。Vercelのproductionデプロイ `dpl_GEjKYBfq5kWnkm6WeruZnwtAPQsP` がREADYとなり、`stageconnect.jp` が当該デプロイへ切り替わったことを確認した。

- 本番の日英12ページでHTTP200、全作品リンク、canonical/hreflang、Person属性、既存配信リンクを再確認。
- 本番390pxで2017年の5作品を選択し、外伝のシート・本文スクロール固定・閉じた後のスクロール488px復元・選択カードへのフォーカス復帰を確認。横方向の文書はみ出しなし。
- 本番1440pxで選択パネルを確認。確認タブのコンソールerrorは0件。確認時点の当該デプロイの直近30分のerror/fatalログは0件（将来のエラー不存在を保証するものではない）。
- 同じ私有フォルダに `production-ssr-verification.json`、`production-mobile-sheet.jpg`、`production-desktop.jpg`、`production-release.json` を保存。

## 同日の情報整理

観劇ノート等のUGCを今後加える方針を踏まえ、登録情報の重複表示を整理した。UGC自体の実装は含まない。

- 下部の「出演シリーズ」をプロフィールの「主なシリーズ」へ統合。既存の最大8シリーズを保持し、4件を超える分はネイティブdetailsで展開。件数には「作品」/work(s)を付け、既存の `#major-series` アンカーも統合先へ残した。
- 年ボタンは `2021 (2作品)` / `2021 (2 works)` 形式。選択直下で同じ年と件数を大きく繰り返す見出しを撤去し、読み上げ用の更新通知は保持。すべての作品への遷移はカード群の直下へ。
- 共演ネットワークはPCで2〜3列の横配置にし、シリーズパネル撤去後の横幅を活用。モバイルは既存の縦一覧を維持。
- 英語の `K (Stage)` が省略処理で `Stage` だけになる問題を修正。ジャンル語だけの括弧は略称にせず元のシリーズ名を表示する。
- 作品ID・配役ID・複数役と条件注記・配信計測属性・初期HTMLの全作品リンクは維持。DB、API、SEOメタ情報の変更なし。
- 変更は `ActorArchive.tsx`、`ActorAppearanceExplorer.tsx`、`ActorExplorer.module.css`、`lib/actor-explorer.ts`。

最終ビルド・既存6テストが成功。日英14ページ（KENN、荒牧、0/1/2作品、最多年45作品の人物を含む）で全作品とシリーズリンク・件数・年表記・canonical/hreflang・Person・配信リンクを確認した。390pxで年切替・シリーズ追加展開・作品シート・閉じる・全作品展開、1440pxで共演一覧の3列表示と文書の横はみ出し0を確認。確認タブのコンソールerrorは0件。証跡は私有 `actor-explorer-refinement-20261029/` に保存。
