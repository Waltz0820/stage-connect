# BLEACH：公演年月・並び順・英語タイトルの修正

2026-10-20。対象は[日本語シリーズ](https://stageconnect.jp/series/bleach)と[英語シリーズ](https://stageconnect.jp/en/series/bleach)、既存の13作品。

## 原因とコード変更

2011年記念公演の期間は「東京・シアター1010：2011年7月1日〜3日…」。開始日を拾う正規表現が任意の4桁と少数の区切り文字を日付として認めていたため、「1010：2011」を年1010／月20／日11と解釈し、シリーズで初演2005年の後ろに送っていた。英語年表も1010/20-と表示していた。日本語側は別の日本語日付検索で2011/07-と表示され、表示と並び順も食い違っていた。

lib/performance-period.tsを追加し、公演の開始年月日をJP/ENと並び順で共通化。年は1800〜2199、月日と区切りを検証し、全角はNFKCで揃える。実在しない月日や会場の1010だけを日付にしない。年だけ・年月だけの既存データも保持する。lib/stage-connect.tsのperiodStartSortKeyをこの処理へ接続し、日英シリーズページの開始年・短い年月表示も同じ値を使う。

年表の新しい公演から並べる方向は維持。2011年は2012年と2010年の間、2006年と2007年の複数作品は出典を補った開始日で比較する。過去公演の短い年月表示に付いていた継続中と紛らわしい末尾ハイフンを除き、ラベルも公演時期／performanceへ変更。作品詳細の全公演区間は維持。

## DB補完

13作品のtitle_enを追加。既存英文部分は保持し、日本語部分はSaien、Shinsei、Mou Hitotsu no Chijou、Bankaiという編集上のローマ字表記と、2011年の記念公演の編集訳を使用した。公式英訳が存在すると主張していない。

年のみだった次の4作品には期間と当時の会場を補完。

| 作品 | 期間 | 会場 |
| --- | --- | --- |
| bleach2005 | 2005年8月17〜28日 | 全労済ホール／スペース・ゼロ |
| bleach2006 | 大阪2006年1月5〜8日、東京1月14〜19日 | 大阪メルパルクホール／日本青年館 大ホール（移転前） |
| bleach2006-2 | 大阪2006年8月10〜13日、東京8月16〜21日 | 同上 |
| bleach2007-2 | 東京2007年3月21〜27日、兵庫4月3〜8日 | 日本青年館 大ホール（移転前）／兵庫県立芸術文化センター 中ホール |

各年のキラハイを土台に[THEATRE1010公式の当時の出演歴](https://www.t1010.jp/html/calender/2009/117/117.htm)で公演区間・会場、[テレビ東京の当時の公式イベント情報](https://www.tv-tokyo.co.jp/anime/info_event/details/bleach.html)で2006年夏、[兵庫県立芸術文化センター公式](https://www1.gcenter-hyogo.jp/contents_parts/ConcertDetail.aspx?kid=4196112501&sid=0000000005)で2007年4月3〜8日を照合。テレビ東京の大阪年が200と欠けた部分を単独根拠にせず、他の公演資料の2006年と突き合わせた。

英語シリーズの原作者／掲載誌の固定表記とぴえろを既存翻訳辞書へ追加。[VIZのTite Kubo表記](https://www.viz.com/bleach)、[Studio Pierrot英語公式](https://en.pierrot.jp/)を参照。原文のシリーズ行は変更しない。

## 保全と確認

DBは13作品のtitle_en、うち4作品のperiod／venueと更新日時だけを更新。ID・slug・日本語タイトル・全配役・人物・既存翻訳・配信URL・クレジット・他シリーズは保全。1トランザクションのロールバック試行、本番適用、再実行を行い、主要8テーブルを全行比較。履歴14件を追加し、再実行の追加・変更は0件。スキーマ変更・マイグレーションはない。

開始日処理4テストと翻訳11テストを確認。ブラウザで2011/07と位置、全13件の英語タイトルと初期年月を確認。日英28ページ（シリーズ1＋作品13の各言語）の本番SSR出力で順序・タイトル・canonical・言語・配役カード・構造化データ・投票導線・シリーズ導線を検証済み。全339作品の期間を新処理で読めること、刀剣乱舞・テニミュ・血界戦線の追加8シリーズページの件数と年月表示も確認した。

変更ファイルは日英シリーズページ、lib/stage-connect.ts、新規lib/performance-period.ts、lib/en-term-map.ts、回帰テストscripts/performance-period.test.mjsとscripts/localization.test.mjs、採用記録research/bleach-timeline-20261020.json、本資料と監査メモ。全公開ページの一般的な期間末日ソート（periodSortKey）は今回変更していない。

あらすじ・プロフィール英訳・詳細内の全会場／スタッフ表記・総合監査は後続。モリステの別枠役付き出演の再点検も継続する。原文、SHA-256、適用SQL、変更前後の全行スナップショット、検証結果は非公開成果物bleach-timeline-20261020/に保存。

## 本番リリース

- URL：https://stageconnect.jp/series/bleach ／ https://stageconnect.jp/en/series/bleach
- 対象：Stage connectチームのstage-connect-ggdd、production、READY。
- 公開コミット：ad8ab6b5e41964de8d8504d9ebd8642b6942145f。GitHub mainへfast-forward反映。
- デプロイ：dpl_5ZbquJMLxsZFynGQGnKPyzSqbCwk。Next.js 15.5.28、ビルド約31秒、stageconnect.jpの割当を確認。
- 当該デプロイの直近15分のerror／fatalログは0件。外部Drainsは今回変更していない。
- 前回本番：dpl_HPU4PTnVwmPNN35LTyxFnfXkG3Bf。DB変更前の全行スナップショットと各行のbeforeを別途保全。
