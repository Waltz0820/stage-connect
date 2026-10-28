# DMM TVイラストの構造修正

2026-10-28。組み込みimage_genの編集モードを使用。既存画像を参照し、人物・画風・配色・場面を保ちながら、バッグの接続とソファ上の姿勢を修正した。

## 変更ファイル

- `next-app/public/images/dmm-tv/theatre-night-corrected.webp`：肩紐・金具・本体の接続を整え、本体を腰より下の身体の外側に配置。1086×1448、267,276 bytes。
- `next-app/public/images/dmm-tv/watch-anywhere-corrected.webp`：腰と曲げた脚を座面に置き、肘をクッションで支える姿勢へ。1399×933、184,326 bytes。
- `next-app/components/DmmTvLanding.tsx`：ヒーロー・デバイス説明・最下部の3か所のsrcだけを差し替え。共通コンポーネントによりJP/EN両方へ反映。
- `docs/dmm-illustration-corrections-2026-10-28.md`：本記録。

元のtheatre-night.webp／watch-anywhere.webpは上書きせず保持。旧版を復元可能な別ファイル名にし、Next画像キャッシュも新URLで更新される。生成したPNGをWebPへエンコード・縮小しただけで、別ツールによる描き直しや合成は行っていない。

## 確認

- 元画像と生成画像を拡大して目視。バッグが胴体に埋まらず外に吊られていること、ソファの背もたれ・座面・クッションと身体の接触が自然なことを確認。
- 本番用build成功。型・lint段階も完了。
- 日英2ページでHTTP200、3か所ずつの修正画像参照、画像2点のWebP配信とSHA256一致を確認。
- 変更前後で日英の本文・title・description・canonical・alternates・全本文リンクが一致。各ページ3本のアフィリエイトURL・rel・placementも保全。
- 実ブラウザで390pxのソファ全体とヒーロー、1440pxのヒーローを確認。横はみ出しなし。CSS・見出し・CTA・価格・計測処理は変更なし。
- Git管理外 `dmm-illustration-corrections-20261028/` に入力／出力ハッシュ・プロンプトJSON・前後HTML・検証結果・スクリーンショットを保存。

## 使用した最終プロンプト

### 劇場へ向かう女性（編集対象：theatre-night.webp）

Use case: precise-object-edit. Edit target: the supplied portrait illustration, a dark-blue-haired adult woman approaching a warmly lit theatre at blue hour. Correct ONLY the physically incoherent handbag and its strap. Keep the same woman, exact recognizable face and hair, same white blouse and navy skirt, pose, theatre facade, lights, other people, petals, wet pavement, blue/gold palette, anime illustration style, portrait 3:4 composition and original framing. The small navy bag must be a believable shoulder bag: one continuous carrying strap sits naturally on her visible right shoulder and connects properly to the bag, with a coherent suspension and gravity. The bag body hangs LOWER, clearly on the OUTSIDE of the hip/waist rather than embedded in the middle of her torso. Show a clean exterior bag silhouette, a small physical depth, appropriate occlusion and contact shadow against clothing. The bag must not look like a backpack, an anatomical lump, or a box growing from her spine; remove the old embedded-looking bag rather than adding another bag. Preserve the arm anatomy and hand count. No new accessories, no lettering, no logo, no watermark. Preserve the original artwork everywhere except the bag, strap, and immediately necessary adjacent clothing shading. Produce one finished portrait illustration asset, not a comparison or mockup.

### ソファでスマホを見る女性（編集対象：watch-anywhere.webp）

Use case: precise-object-edit. Edit target: the supplied landscape anime illustration of a dark-blue-haired adult woman with a smartphone in a bright living room. Fix the physically awkward relationship between her reclining body and the sofa. Keep her recognizable face, adult appearance, dark blue hair, white blouse and pale blue bottoms, the smartphone, warm sunlight, plants, window, cream sofa, pink cushion and pink knitted blanket, gentle pastel palette and detailed anime painting style. Keep a landscape 3:2 composition and similar subject scale, with her face near the center-left, phone in front of her. Change her from the awkward belly-down pose across an impossibly shallow seat into a comfortable semi-reclined SIDE-SEATED pose: her upper back and shoulder are visibly supported by the large pink cushion resting against the ACTUAL sofa backrest; her pelvis rests on the seat cushion; her bent legs remain on the SAME seat surface to her right. Arrange the sofa backrest behind her, not intersecting her waist, and show enough connected seat cushion to support her weight. Her elbows and forearms rest naturally on her lap or cushion while she looks at and holds the phone. A relaxed hand may support her cheek only if the elbow has a believable support. Natural spine, shoulder, hip, arm, hand and leg geometry. No hips on the backrest, no body through cushions, no unsupported floating torso, no extra limbs or fingers. Preserve the room, furnishings, lighting and calm expression; change only pose and sofa/cushion geometry necessary to make this physically believable. No text, no logo, no watermark. Produce one finished illustration asset, not a comparison or mockup.
