# Stage Connect V2 — ガイド・About・補助ページ（Gate 4）

2026-10-23。既存の情報・保存方式を保ち、写真を使わないV2のデザインをガイドと補助ページへ適用。

## 変更内容・ファイル

- `next-app/app/(ja)/guide/page.tsx`：公開済み記事だけを掲載する既存取得処理を保持。現時点の1記事を正式タイトル・既存概要・実公開日で見せる構成。
- `next-app/app/(ja)/guide/[slug]/page.tsx`：大きな記事見出し、既存目次、比較表、関連作品・キャスト、配信案内を新しい体裁へ。本文の後に既存3一覧・ガイド一覧・先頭への回遊を追加。
- `next-app/components/AboutPage.tsx`、`AboutConnections.tsx`、`next-app/app/(ja)/about/page.tsx`、`next-app/app/en/about/page.tsx`：新しい日英About。強いタイポグラフィと、実在の作品・俳優・役柄・共演者・シリーズをつなぐ図。
- Aboutの例は `tennimu-1st-final-rikkai-second` の既存データ。高橋龍輝、越前リョーマ、同作品の馬場良馬、テニミュ1stとの関係を既存サーバー取得関数から構成。英語表示は既存の英語名・翻訳ヘルパーを使用。新しいDB・API・役柄ページは作らない。
- ノード選択で該当説明へ移動し、その説明から実際の詳細ページへ進める。役柄は当該作品の配役欄へ。説明・リンクは全件サーバー描画し、JSなしでも読める。SVG線は時間差で一度描画し、reduced-motionでは初期から静止表示。
- `next-app/components/FavoritesClient.tsx`、`next-app/app/(ja)/favorites/page.tsx`：俳優は青、作品はコーラルの一覧。実保存件数、空状態、読み込み中、保存領域へのアクセス失敗・削除失敗を表示。既存の `favorite_actors` / `favorite_plays`、オブジェクト形式、即時登録解除、`favorites-updated` イベントを保持。別タブのstorage変更も再読込する。
- `next-app/components/ContactEmail.tsx`、`next-app/app/(ja)/contact/page.tsx`：既存メール窓口の表示、コピー、mailto。コピー拒否時は文字列を選択する案内。受付内容と一次ソースを添える案内を保持。フォームや架空の返信保証は追加しない。
- `next-app/app/(ja)/privacy/page.tsx`：既存本文は一字一句保持。既存見出しへの目次とアンカー、CSS番号だけ追加。
- `next-app/app/editorial-support.css`、両言語 `layout.tsx`：上記ページ内に限定した色・見出し・余白・表・リスト。旧CSSの優先順位によるコピーの縮小、暗色面の文字色を補正。
- `next-app/components/SiteChrome.tsx`、`next-app/lib/locale-routing.ts`、`next-app/app/sitemap.ts`：実在する日英Aboutへのメニュー・フッター・言語切替・サイトマップを追加。日本語しかないガイド・補助ページの言語対応範囲は広げない。
- `next-app/scripts/localization.test.mjs`、`check-v2-pages.mjs`：Aboutの言語往復、5ノード・説明先・実ページリンク、ページ構造を回帰対象へ。

## 保護範囲

既存作品・俳優・配役・注記・シリーズ、データ取得関数、検索・フィルター、投票処理、翻訳辞書、DMM URL・広告・クリック計測、ガイド本文・公開日・既存リンクは変更なし。プライバシーの匿名Cookie・ハッシュ・IP非保存・保持期間等の文面も変更なし。

`/watch` および配信サービス各ページの本文・ロジック・専用CSSは変更なし。共通フッターとメニューにはAboutリンクだけ追加。DBマイグレーション・DB書込・依存追加・環境変数変更なし。

## ラフとの差分

参照：`guide-article-triptych.png`、`about-triptych.png`、`favorites-triptych.png`、`contact-two-screens.png`、`privacy-two-screens.png`。

- ガイドのラフは未公開の観劇マナー記事。公開済み刀剣乱舞ガイドだけを使用し、ラフの記事・分類・進捗バー・FAQを捏造しない。既存記事の比較表は小画面で横スクロール可能。
- Aboutの人物・劇場写真は使わず、色面・文字・実データの接続図で表現。実績・アクセス数・提携・チーム規模の主張は追加しない。
- 図内の長い名前は最大3行。全文は隣接する説明カードとリンクのアクセシブル名に保持し、既存詳細の正式タイトルを省略しない。
- お気に入りの架空の名前・件数・画像は移植せず、そのブラウザの保存データのみを表示。
- プライバシーのラフと現行本文の差は現行を優先。古い年号・仮の保持期間・仮の運営者情報は転記しない。

## 検証

- 最終の本番ビルド成功（型チェック含む）。独立した `tsc --noEmit --incremental false` も成功。lint専用スクリプトは既存構成にない。
- 検索・翻訳・配信・配役・投票の39テスト成功。実DBへの投票は行わず、投票DB制約は既存PGliteテストで検証。
- 既存＋Aboutの62 URLのHTTP／HTMLチェック成功。1 main／1 H1、JP/EN、既存配役・投票選択肢・フィルター・配信案内等を検査。
- 変更前8ページとtitle・description・robots・canonical・JSON-LD、改修前本番とOGP/Twitter・hreflangを照合。既存リンク先・relを保持。お気に入りのリンクはクライアント描画後と非JS状態で確認。
- ガイド本文は描画テキストを完全一致で比較。プライバシー8節はDOMテキスト（空白を含む）を完全一致で比較。`/watch`、`/en/watch`、`/watch/dmm`の本文も完全一致。
- Chrome / WebKitで320・390・430・1280px、7ルートずつ計56表示を検査・撮影。ページ横溢れなし、本文中の人物／作品画像なし。Aboutの大型コピー・暗色面の可読色も確認。
- 両ブラウザで、実際の詳細画面から俳優2人・作品1本を保存→お気に入りで確認→一部削除→再読込→作品削除。保存キーと実件数の変化を確認。保存拒否時の読込・削除失敗も検査。
- ダークモード指定で両ブラウザの320px Aboutを検査。通常アニメーションは時間差・1回・終端、reduced-motionは静止を確認。SVGの正規化した破線とnon-scaling-strokeの組み合わせによる線欠けを目視で発見し、通常の拡縮ストロークへ修正。静止時は破線を解除する。
- メールコピーの成功／拒否の表示と実文字列、mailto、フォームがないことを確認。クリップボードAPIはテスト内で成功・拒否を再現し、OSクリップボード自体は未検証。
- 記事／プライバシーの実目次アンカー、日英Aboutのノード・説明・役柄リンク・言語切替、JSなしの図とお気に入り退避リンクを確認。最終操作検査のpageerror 0件。

ブラウザ検査では広告・解析の外部ネットワークをテスト環境内だけで分離。カタログ・検索・アプリの応答は実データを使用。SafariはPlaywright WebKitによるiPhone相当環境であり、iPhone実機・OSソフトキーボード固有挙動は未検証。

## 証拠・残工程

Git外の既存 `stageconnect-v2-design/` に `gate4-baseline.json`、`gate4-production-seo-baseline.json`、`gate4-content-report.json`、`gate4-local/` の幅別スクリーンショット・保存状態別画像・操作reportを保存。公開後の検査は同階層 `gate4-production/` と `RELEASE-GATE4.md` へ保存する。

主なURL：`/guide`、`/guide/touken-ranbu-complete-guide`、`/about`、`/en/about`、`/favorites`、`/contact`、`/privacy`。

Gate 4の実装を本番へ反映後、次はGate 5の全体監査。実機Safariは未検証として残し、全サイトの検収完了とは扱わない。
