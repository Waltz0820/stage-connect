# サービス連携状況

2026-10-17確認。

| サービス | 状態 | 次の作業 |
| --- | --- | --- |
| Supabase | プラグイン接続済み。「Stage Connect」のIDがローカルの接続先と一致し、管理SQLの読み取り確認成功 | 今後のDB作業に利用可能。投票用SQLはユーザーが適用済み |
| Search Console | GSC Wizard経由で `sc-domain:stageconnect.jp` の所有者権限、読み取り可・有効化済みを確認 | 新しい連携の追加は不要 |
| Google Analytics 4 | 接続済み。「Stage Connect」`properties/516745984` と `sc-domain:stageconnect.jp` の紐付けをプロパティ一覧・サイト一覧の両方で確認 | レポート取得に利用可能 |
| Vercel | 接続済み。チーム `stage-connect`、Next.jsプロジェクト `stage-connect-ggdd` の環境変数設定・本番公開を完了 | 今後の公開・ログ確認に利用可能 |

投票用サーバー環境変数 `SUPABASE_SERVICE_ROLE_KEY` と `OSHI_VOTER_SECRET` をProductionにSecretとして設定し、更新アプリのデプロイを完了した。Previewへ本番のservice_roleキーは追加していない。認証情報の値はこの文書へ記載しない。
