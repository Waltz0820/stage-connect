# サービス連携状況

2026-10-17確認。

| サービス | 状態 | 次の作業 |
| --- | --- | --- |
| Supabase | プラグイン接続済み。「Stage Connect」のIDがローカルの接続先と一致し、管理SQLの読み取り確認成功 | 今後のDB作業に利用可能。投票用SQLはユーザーが適用済み |
| Search Console | GSC Wizard経由で `sc-domain:stageconnect.jp` の所有者権限、読み取り可・有効化済みを確認 | 新しい連携の追加は不要 |
| Google Analytics 4 | 接続済み。「Stage Connect」`properties/516745984` と `sc-domain:stageconnect.jp` の紐付けをプロパティ一覧・サイト一覧の両方で確認 | レポート取得に利用可能 |
| Vercel | 接続済み。チーム `stage-connect` とNext.jsプロジェクト `stage-connect-ggdd` の取得・環境変数の一覧確認成功 | 公開前に投票用サーバー環境変数を追加し、デプロイする |

Vercelで残っている公開作業は、投票用サーバー環境変数 `SUPABASE_SERVICE_ROLE_KEY` と `OSHI_VOTER_SECRET` の追加、更新アプリのデプロイ。一覧確認時にはどちらも未登録だった。プラグインには環境変数の作成・編集機能があることを確認したが、この接続確認では環境変数の変更・デプロイは行っていない。認証情報の値はこの文書へ記載しない。
