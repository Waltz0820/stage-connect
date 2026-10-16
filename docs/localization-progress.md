# 多言語の共通処理と既存辞書の保全

2026-10-16。対象は稼働用の `next-app`。公開デザインの作り直しとは独立した内部改修。

## 既存のリプレイス辞書

- `next-app/lib/en-term-map.ts` に完全一致686件、部分置換33件がある。シリーズ名、役名、人物名、劇場名、スタッフ、原作表記、公演限定の補足などを扱う。
- `next-app/lib/en-copy.ts` がDBの入力済み英語と辞書の使い分け、表示用の翻訳を行う。DBの `nameEn` / `titleEn` 等の既存優先順位は維持した。
- 今回は辞書の登録内容を変更していない。短い語句の置換で長いルールが壊れないよう、部分置換の実行順を文字数の長い順にした。
- 登録済みなのに正しく適用されなかった4項目は、キングダムの原作クレジット、4劇場の連結表記、大阪・福岡公演のみ、同じ文の※付き表記。
- 辞書にない語はそのまま残す。`constructor` 等をオブジェクト継承プロパティとして誤取得する問題も修正した。
- 全ルールの適用、入力済み英語の優先、兼役・未解決の公演条件の保持を回帰テストにした。辞書の訳語自体を出典と照合する監査は別工程。

## ページ言語とURL

- 英語ページの最初のHTMLも `lang="ja"` だったため、日英それぞれのroot layoutで `ja` / `en` を出す構成へ変更した。
- 日本語側を `app/(ja)/` に移動した。括弧のroute groupは公開URLに含まれない。20ページの内容はimport階層の変更以外は同一。
- 共通document、共通metadata、言語対応表を分け、viewportの二重出力を解消した。
- 俳優一覧・俳優詳細にも既存英語ページへの切替を表示する。作品・シリーズと同じ対応表で処理する。
- 翻訳ページのない配信・ガイド等に、架空の英語リンクを追加していない。
- 公開画面と管理画面の切替でReact hookの呼出数が変わらないよう、公開用の状態管理を別コンポーネントに分けた。

日英は別root layoutなので、言語切替時はdocument全体を読み直す。言語をまたがない回遊は従来通りNextのクライアント遷移。静的ページをすべて動的化する方式は採っていない。

## 存在しないURL

複数root layoutで404の最初のHTMLを返すため、Next 15.5の `experimental.globalNotFound` と `app/global-not-found.tsx` を使用する。404は日英併記の共通ページで、documentは日本語、英語の文とリンクには `lang="en"` を指定する。HTTP 404とnoindex、日英トップへのリンクを検証対象にする。

これはNext 15では実験機能である。Next更新時は、存在しない俳優と未知のURLの両方で、HTTPステータス・初期HTML・復帰リンクを再確認する。

注意：実在する動的ルートで存在しない俳優を指定した場合は、改修前からNext 15のエラー用HTMLシェルが返り、ブラウザーで言語別のnot-foundを復元する挙動がある。今回もこの2 URLの最初のHTMLには `lang` や本文がない。HTTP 404/noindexと復元用の案内はHTTPで確認し、復元後の言語・404表示・復帰リンクはブラウザーで確認する。未知のURL用のglobal-not-foundとは区別する。

参照：[Next route groups](https://nextjs.org/docs/15/app/api-reference/file-conventions/route-groups)、[root layout](https://nextjs.org/docs/15/app/api-reference/file-conventions/layout)、[global-not-found](https://nextjs.org/docs/15/app/api-reference/file-conventions/not-found)。

## 検証手順

`next-app` で `npm run test:locale`、`npm run test:research`、`npm run build`。

本番ビルドをローカル8139番で起動し、`scripts/check-localized-pages.mjs` で改修前との比較を行う。代表の日英18ページに配信・ガイド・管理画面等と404を加えた31 URLが対象。通常ページのタイトル、見出し、canonical、description、関連URL、リンク数を比較する。言語切替で増えるリンクは本文の件数から分ける。robots、sitemap、iconも比較する。

ブラウザーでは俳優詳細からENに切り替え、`lang="en"` と英語の出演歴リンクを確認し、JPで同じ俳優へ戻る。

実施結果：辞書・表示・URLの7テストと既存44テストは全件成功。ビルド成功。31 URLとrobots/sitemap/iconの比較は失敗0件。移動した20ページはimport深度以外の本文変更0件。ブラウザーでも俳優詳細の日英往復、日英それぞれの存在しない俳優の404、英語404から英語トップへの復帰を確認した。

比較JSONと画面画像はGit管理外の `C:/Users/butch/.codex/visualizations/2026/10/15/01a13eca-736f-71a1-812b-5a84a70e97a5/localization-check/` に保存した。

この工程では本番DBへの書込み、SQLの適用、デプロイは行っていない。
