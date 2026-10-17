# ロゴ・サイトアイコン更新

2026-10-17。ユーザー提供の「STAGE CONNECT ロゴガイドラインシート.png」に合わせ、公開サイトのヘッダーとモバイルメニューを新しいSCシンボル＋ワードマークに統一した。DB変更なし。

## 素材と実装

- シンボルの原案は提供画像。built-in imagegenで左上の大きいシンボルを透過素材として抽出。独立したベクター原稿は提供されていないため、シンボルは透過PNG。
- 保存原稿: `next-app/assets/brand/stage-connect-symbol-source.png`。
- サイト用: `next-app/public/brand/stage-connect-mark.png`（234×256、透過）。
- ヘッダーは `BrandLogo.tsx` でシンボルとHTMLのワードマークを組み合わせる。日本語・英語のタグラインを維持し、文字を画像化せず小さな画面でも鮮明に表示。
- ブランドロックアップをトップへの既存リンクに配置。画像自体は装飾扱いとし、リンク名は読める文字を使う。
- 色: ワードマークは深いネイビー `#0b1536`、シンボルの藤色は提供デザインを参照。既存の公開UIの配色は維持。

## アイコン

Next.jsのMetadataファイル規約でJP/ENの両方に反映する。

- `next-app/app/favicon.ico`: 16・32・48px入り。
- `next-app/app/icon.png`: 512px。旧 `app/icon.svg` を置き換え。
- `next-app/app/apple-icon.png`: 180px。
- `next-app/public/brand/icon-{16,32,48,64,192,512}.png`: 書き出し素材。
- `next-app/public/brand/icon-maskable-512.png`: 中央の安全領域にシンボルを収めたホーム画面用。
- `next-app/app/manifest.ts`: 192/512pxアイコンとmaskable版を指定。ブラウザ表示のホーム画面ショートカット用で、オフライン機能やインストール誘導は追加しない。

タブの背景色によって紺色の線が沈まないよう、アイコンにはオフホワイト `#fcfcff` の背景を付ける。ヘッダー用だけは背景を透過させる。

書き出しは `cd next-app` → `node scripts/export-brand-assets.mjs` で再現可能。imagegen原稿に対しSharpで定型のリサイズ・余白・形式変換を行う。

## 確認

ローカル実画面で320pxの日本語ヘッダーに横はみ出し・操作ボタンとの重なりなし。900pxの英語ナビは一行で表示するよう余白を調整した。ブラウザのDOM上でfavicon・PNGアイコン・Apple touch icon・manifestの指定を確認。16/32/48/64pxの見え方と明暗背景もプレビューする。

本番ビルド、既存60ページの確認、公開URLでの画像・アイコンの取得結果は作業完了報告に記載する。

## imagegenに渡した指示

入力画像: ユーザー提供のロゴガイドラインシート。`transparent_background=true`。built-in toolを使用、API/CLIフォールバックは使用していない。

```text
Edit the supplied STAGE CONNECT logo guideline sheet into a production logo asset. Extract ONLY the LARGE PRIMARY SYMBOL at the upper left of the sheet (section 1). Preserve its exact existing design, proportions and silhouette: intertwined elegant dark navy S/C monogram, arched left stem and serif foot, lavender right arch/stem, small lavender four-point sparkle in the lower-right interior. The navy and lavender areas, overlap interruptions, curved strokes and serif shapes must faithfully match the supplied symbol. Do not redesign, reinterpret, add a border, change lettering, simplify, add shadows or add texture. Remove ALL sheet elements including headings, divider lines, wordmark, small previews, labels and white background. Output one isolated symbol on a genuinely transparent background, tightly centered with modest even safety padding, as a high-resolution clean flat logo asset. Keep all interior negative space transparent as well. Colors should match the source: deep navy approximately #0B1536 and soft lavender approximately #A58BCD. No text or other content.
```
