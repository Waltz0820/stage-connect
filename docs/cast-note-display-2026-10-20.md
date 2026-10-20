# 2026-10-20 配役注記の公開表示

## 問題と変更

`casts.note` に保存した補足が、作品詳細の取得クエリ・配役グループ化・カード描画のいずれにも渡されていなかった。ALL OUT!! の「コーチ」に加え、モリミュコンサートのゲスト出演日時8件、あんステの大阪公演の歌唱録音・台詞変更条件1件が公開画面から欠落していた。

作品詳細の取得に既存の `note` 列を追加。日英ページの重複した配役グループ化を `lib/play-cast.ts` にまとめ、俳優の行をまとめる際も元の役名と注記の対応を保持する。グループ・配役順・主演表示・俳優リンクは維持する。同一役でも異なる注記は残し、同一の役名と注記の重複だけを除く。

`components/PlayCastRoles.tsx` は役名の直下に注記をプレーンテキストで表示。注記があるカードは役数による省略を行わず、長文・改行を折り返す。注記のないカードは従来の3役までの要約表示を維持する。クライアントJSや追加のDB呼び出しは増やしていない。

英語は「Coach」、ゲスト出演日時、既存の大阪公演の条件文を明示的に翻訳。認識できない注記は原文を保持し、推測で消したり補ったりしない。DBの原文・配役行・作品・人物データは一切変更せず、マイグレーションも不要。

## 確認

- `node --test scripts/play-cast.test.mjs scripts/localization.test.mjs scripts/performance-period.test.mjs`：21件成功。
- 新規6テストは複数役と各注記の対応、重複、別グループ、主演、元データ不変、4役以上、注記のみ、HTMLエスケープ、日英日時、未知の注記保持、長文の条件を確認。
- `npm run build`：Next.js 15.5.28でビルド・型検査成功。
- `scripts/check-play-cast-notes.mjs`：実DBを読む作品詳細のSSRで3作品×日英、計20件の注記を全文照合。投票・公演・配信・canonicalも確認。
- `scripts/check-v2-pages.mjs`：ローカル60ページ成功。
- 刀剣乱舞・テニミュ1st・キングダム・ALL OUT!! の日英8ページについて、新旧のグループ順・カード順・名前・役名・主演・俳優リンク・CreativeWorkのactor配列が同一であることを照合。
- ブラウザで長い英語の出演条件がカード内で全文表示されることを確認。

## 変更箇所と残課題

日英作品詳細、`lib/stage-connect.ts`、`lib/play-cast.ts`、`lib/en-copy.ts`、`components/PlayCastRoles.tsx`、`app/globals.css`、`package.json`、回帰テストと公開ページ確認スクリプト。本書と監査メモに経緯を記録。

役名・学校名・プロフィールなどの未翻訳は既存の後続作業。今回の修正は保存済み注記の欠落を解消するもので、全シリーズの翻訳完了を意味しない。外部Drainsは未設定のまま。

## 本番リリース結果

- URL：https://stageconnect.jp/plays/allout2017#cast ／ https://stageconnect.jp/en/plays/allout2017#cast
- 対象：Stage connectチームのstage-connect-ggdd、production。
- Status：READY。公開コミット `83af8b9e1d1c2a6b71d2d4eba773ab0fcd99f230` をGitHub mainへfast-forward反映。
- デプロイ：`dpl_7YvbqXdRtonWUKdmSffCzLz243Pd`。Next.js 15.5.28、ビルド約44秒。stageconnect.jpの割当成功を確認。
- 公開URLで日英6ページの全20注記を全文照合し、一般60ページの確認も成功。
- 当該デプロイの直近15分のerror／fatalログは0件。外部Drainsは未設定。現時点の検証結果であり、常時監視の導入ではない。
- 前回本番：`dpl_5ZbquJMLxsZFynGQGnKPyzSqbCwk`。今回はDBのスキーマ変更・データ書き換えを行っていない。

公開確認結果と保全対象のカード比較結果を非公開成果物 `cast-note-display-20261020/` に保存した。
