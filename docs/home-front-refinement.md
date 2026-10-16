# トップページのヒーロー・シリーズカード整理

2026-10-17。ローカル確認用。前回公開したV2の上にトップページの見た目を調整したもので、この変更はまだ本番へ反映していない。

## 変更

- ヒーローだけに強い舞台クリエイティブを置き、その下は白・ネイビー・藤色の読みやすい情報カードに統一。
- トップの疑似ポスター4件を撤去。シリーズの正式名称・公演形式・実際の作品数を保持し、SVGの小さなモチーフと矢印を添える。
- 刀剣乱舞とテニミュの既知のslugにのみ刀・ラケットを使用。他のシリーズは記録された公演形式に基づく音符・舞台・シリーズのアイコンへフォールバック。公式ロゴ・作品画像・新しいタグとしては扱わない。
- JP/ENを `ArchiveHome.tsx` へ共通化し、従来のメタデータと検索先を維持。
- ホームの推しポイント導線はPCで5列×2段、スマホで2列。案内カードはスマホで説明文を省略。
- 画像は `next/image` の `getImageProps` とpictureで画面幅に応じて選択し、最初から必要な画像だけを優先して読み込む。スマホで舞台の幕・照明が切れないよう別構図を用意。

## 確認

- 本番用ビルド成功。主要30ページの表示・SEO・導線チェック成功。
- JP/EN、390pxと1440pxのブラウザ表示を確認。横方向のはみ出しなし。
- スマホではモバイル画像、PCでは横長画像を実際に選択することをcurrentSrcで確認。
- 画像最適化APIのWebP出力は、PC向け1920pxで63,986バイト、スマホ向け640pxで33,126バイト（品質85、確認時）。
- 管理画面・DB・投票API・作品一覧等のデータ処理は今回変更していない。

プレビュー: http://127.0.0.1:8139/

## 保存した画像と生成方法

組み込みの `image_gen` を使用。CLI/APIによる生成は使っていない。写真風の架空の無人舞台で、特定作品の舞台写真ではない。元の生成物はCodexの生成画像フォルダーに保持し、使用画像はプロジェクト内へコピーした。

- PC: `next-app/public/stage-hero-v2.png`
- スマホ: `next-app/public/stage-hero-mobile-v2.png`

### PC用の最終プロンプト

Use case: photorealistic-natural. Asset type: production website hero background for Stage Connect, an archive of Japanese 2.5D theatre productions. Create a cinematic, photorealistic EMPTY theatre stage seen straight on from the audience. Wide panoramic composition about 3:1, ideally 2400 x 800 pixels. Deep midnight navy and near-black stage, restrained burgundy velvet curtains at the far left and right, slim lighting trusses near the outside edges, two luminous cool-white theatre spotlights shining diagonally inward from the upper left and upper right. Fine atmospheric haze makes the beams tangible, with subtle silver-lavender light reflecting across the polished dark stage floor at the lower third. Sophisticated theatre photography, real fabric folds, realistic stage rigging and haze, crisp detail, restrained exposure. The central 50 percent must remain calm, mostly dark navy negative space, suitable for a large white Japanese headline and short white body copy overlaid later in HTML; do NOT add any lettering. The stage fills the whole image edge to edge, no audience or seats. No people, actors, silhouettes, characters, existing production artwork, logos, text, typography, signage, decorative symbols, websites, or UI. Avoid fantasy scenery, floral decor, blue neon, lens flare, excessive smoke, overexposed bright central area. The atmosphere should feel like the moment before the curtain rises. Deliver only the background photograph, no mockup.

### スマホ用の最終プロンプト

参照画像: PC用の生成画像。

Use case: background-extraction / compositing layout adaptation. The provided image is a reference for visual identity, materials and lighting, not a request to retain its panoramic framing. Create a MOBILE HERO BACKGROUND variant of this same empty theatre stage, square format 1024 x 1024. Recompose the scene for a portrait-phone website hero: the burgundy velvet curtains must be visible as narrow vertical borders along the left and right edges, lighting trusses just inside them, with two compact cool white stage lamps near the upper left and upper right corners shining down diagonally through subtle blue-silver haze. Keep the middle 70 percent mostly calm dark midnight navy, especially from 25 percent to 70 percent of height: white Japanese headline and body text will be added there in HTML later. Stage floor glints at the bottom 15 percent. Preserve photographic realism, dark elegant theater mood, materials and the subtle lavender-white spotlights from the reference. The important change is that curtains AND BOTH stage lamps are visible within this single square frame; do not just crop the wide reference. No people, actors, silhouettes, text, typography, logos, websites or UI. No bright center, no dramatic lens flare, no fantasy decoration.
