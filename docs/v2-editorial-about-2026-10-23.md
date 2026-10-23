# 当サイトについて / About — illustrated edition

## 依頼と実装

日本語UIのAboutを「当サイトについて」に変更。ラフの構図・舞台イラスト・相関図・ステートメントを優先し、以前の平面的な表示を作り直した。ラフ由来の実装制約は固定条件にせず、ユーザーの最新指示に従って機能を保ちながら表現を強めた。

- 青い幕・照明・コーラル色の円・匿名の出演者によるオリジナル舞台イラスト。モバイルは大きな絵を本文の下、PCは見出しの右に配置。
- 俳優・作品・役柄・共演者・シリーズの5種類を、オリジナルSVGイラストの円で接続。実際のテニミュ作品・配役・所属シリーズを元にしたリンクと正式名は維持。
- タップ、フォーカス、マウスオーバーで説明を選択。ハッシュで直接開く／再読み込み／履歴移動にも対応。JavaScriptが無効なら5件すべての説明と実リンクを表示。
- 青い舞台照明トラスとコーラル色の円を背景にしたステートメント、ミッション、3つの価値、作品一覧へのCTA。
- セクション登場、舞台イラストのズーム、接続線の描画、イラストの登場、光の緩やかな揺らぎ。IntersectionObserverで表示時に開始し、スクロールイベントで毎フレームReactを更新しない。停止ボタンとOSの動きを減らす設定にも対応。
- 日本語のメニュー、フッター、パンくず、ページタイトルを「当サイトについて」に統一。英語はAboutを維持。

## ファイル

- `next-app/components/AboutPage.tsx`：日英の構成、実データの関係、メタデータ。
- `next-app/components/AboutConnections.tsx`：図と説明の操作、ハッシュの復元、非JS時の全文表示。
- `next-app/components/AboutArtwork.tsx`：人物・客席・本・トラス・価値アイコンのオリジナルSVG。
- `next-app/components/AboutMotion.tsx`：表示検知、設定の追従、停止・再開。
- `next-app/app/editorial-about.css`：About専用の構図と動き。旧About規則は`editorial-support.css`から移動。
- 日英ルートレイアウト：About用CSSの読み込み。
- `next-app/components/SiteChrome.tsx`：日本語の表示名。
- `next-app/public/images/about/stage-illustration.webp`：1536×1024、379,820バイト。Next Imageで配信サイズを最適化。

DB変更・マイグレーションはない。作品・俳優・シリーズの取得方法、検索・配役・投票・お気に入りの保存、配信リンク・成果計測の処理は変更していない。新しいアニメーションライブラリや依存パッケージも追加していない。

## 検証

- 本番ビルドと型検査成功。
- 日英×320／390／768／1280px×Chrome／WebKitの16表示・操作を確認。横溢れなし、1 main・1 H1、イラストの読込成功。
- 通常／reduced-motion、ダーク設定、停止／再開、接続線の一度だけの描画を両エンジンで確認。
- 非JSでも日英の本文、5件の説明、リンク、画像、ハッシュ移動を確認。
- 選択した説明の再読み込み、フォーカス操作、日本語メニューの新ラベル、英語ラベルを確認。以上22グループ成功、pageerrorなし。
- モバイルの説明への直接アクセスとクリック後は、見出し下の約86pxに目的の説明を表示。
- 既存62ルートのHTTP・言語・配役導線検査、翻訳の12テスト成功。
- ガイド本文・条文・配信本文・既存リンク、8ページのメタデータを以前のベースラインと比較して一致。Aboutの5つの実リンクはすべて200、役柄リンク先の`#cast`を確認。
- スクリーンショットと操作記録：既存Git外作業ディレクトリ`stageconnect-v2-design/gate6-final/`。PlaywrightのWebKit検査はiPhone実機の検証とは区別する。

## 継続課題：非JSの動的404

ローカルの最終ビルドでも、未登録の動的slugはHTTP404・noindexを返すが、JavaScript無効時の本文が空になる既存症状を再確認。JavaScript有効時の案内と、完全に未定義のルート向けglobal-not-foundは表示される。

新たに確認した[Next.js Issue #99793](https://github.com/vercel/next.js/issues/99793)は同形状の問題を再現例付きで報告し、確認時点でOpen。単一ルートレイアウト・複数バージョンでも報告されており、レイアウト統合や単純な更新で解消すると判断できない。判定の一次根拠は自サイトの実レスポンスとJS無効ブラウザの空の本文。

今回ここは未解消。通常ページにも存在確認のDB照会を追加するMiddleware回避策、200応答の疑似404、フレームワーク内部の直接パッチは導入していない。これはラフの禁止条件ではなく、About改修と通常アクセスへの影響を分ける実装判断であり、根本修正または別途検証したルーティング対策が必要。

## イラスト生成記録

ビルトインimagegenを使用。出力PNGはローカルの生成画像保管先に残し、プロジェクトでは上記WebPを使用。WebP化はエンコードのみで、内容の変更はしていない。実在の俳優や作品の写真・公式ビジュアルではなく、装飾用の匿名の舞台イラスト。

最終プロンプト：

> Create a finished original editorial illustration asset for the Stage Connect About web page, not a mockup, no text or typography at all. Wide landscape composition, approximately 3:2. Contemporary Japanese theatre art direction, bold cobalt blue #315cff, ultramarine and deep navy, warm off-white, a single large coral red sun disc behind the stage. Abstract angular folded blue theatre curtains pull open on both sides; dramatic white-blue spotlights converge on the center. At the bottom are five SMALL anonymous human performer silhouettes seen from behind / in three-quarter view, on an angular perspective stage with stair edges. Make the figures original and generic in simple long-coat / suit stage costumes, no recognizable actors, no recognizable characters, no official production imagery. Heroic but quiet, graphic print-like screenprint texture, crisp silhouettes and architectural shadows, sophisticated high-contrast art-book cover aesthetic. Open light area at upper center, deep blue architecture around edges. Strong depth from sweeping curtains and beams, visually striking, polished theatrical illustration. No words, no lettering, no logos, no watermark.

