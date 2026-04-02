# Stage Connect Next移行メモ

## 1. 結論

Stage Connect は、`Vite + BrowserRouter + client-side Supabase fetch` の構成から、
`Next.js(App Router) + server-side data fetch + static/SSR hybrid` へ移行する価値が高い。

理由は、サイトの強みが単体記事ではなく、

- シリーズ → 作品
- 作品 → 俳優
- 俳優 → 作品

の内部リンク循環そのものにあるため。

現状は一覧・詳細の本文リンクやカードリンクが初期HTMLに十分出ていない可能性が高く、
Search Console 上でもその兆候がある。

## 2. いま起きていること

現行構成の特徴:

- ルーティング: [`App.tsx`](../App.tsx) の `BrowserRouter`
- データ取得: 多くの公開ページが `useEffect + supabase.from(...)`
- HTML初期出力: 本文・内部リンクのかなりの部分がクライアント描画依存

Search Console の傾向:

- `/`, `/plays`, `/actors`, `/series`, `/guide`, `/watch/dmm` のような固定導線ページは拾われる
- 作品詳細・俳優詳細などの DB 本体ページは内部リンク数が不自然に少ない

この組み合わせから、Google が

- ナビや固定リンクは認識
- JS 実行後の本文リンク群は十分に集計できていない

可能性が高い。

## 3. 移行の目的

Next移行の目的は「新しい技術に乗ること」ではない。

目的は以下:

- 主要公開ページの本文と内部リンクを初期HTMLに出す
- 構造化データ/metadata/canonical をページ単位で安定化する
- Stage Connect 本来の内部リンク資産を Google に正しく見せる

## 4. 移行の基本方針

### やること

- 公開ページを Next 側へ移す
- DB 取得は server-side を基本にする
- 既存 UI の見た目・導線はできるだけ維持する
- データ投入は止めない

### やらないこと

- 最初から全ページを移さない
- 管理画面を最初に移さない
- 現行 Vite アプリを一気に破棄しない

## 5. 優先順位

### 最優先で移すページ

1. `/plays/[slug]`
2. `/actors/[slug]`
3. `/series/[slug]`
4. `/plays`
5. `/actors`
6. `/series`
7. `/guide`
8. `/guide/[slug]`
9. `/watch`
10. `/watch/dmm`

### 後回しでよいページ

- `/admin/*`
- `/favorites`
- `/search`
- `/tags/*`

## 6. 推奨アーキテクチャ

### フレームワーク

- Next.js App Router

### データ取得

- 公開ページ: Server Components で Supabase 読み取り
- 相互リンクが多い詳細ページは、初期HTMLにすべての主要リンクを含める
- 動的でもよいが、詳細ページは原則 SSR or ISR

### キャッシュ戦略

- 一覧ページ: `revalidate` あり
- 詳細ページ: `revalidate` あり
- ガイド: `revalidate` あり
- `/watch`: 更新頻度に応じて短め

### Supabase

- 読み取り: server-side client
- 認証を要する管理系は後で client-side + middleware 検討

## 7. Next 側の想定ルート

```text
app/
  page.tsx
  plays/
    page.tsx
    [slug]/
      page.tsx
  actors/
    page.tsx
    [slug]/
      page.tsx
  series/
    page.tsx
    [slug]/
      page.tsx
  guide/
    page.tsx
    [slug]/
      page.tsx
  watch/
    page.tsx
    dmm/
      page.tsx
    u-next/
      page.tsx
    danime/
      page.tsx
```

## 8. 現行からの流用方針

### そのまま流用しやすいもの

- UI 部品
  - `PlayCard`
  - `CastCard`
  - `ActorAvatar`
  - `Breadcrumbs`
- 表示用ユーティリティ
  - `normalizeTagsFromJoin`
  - `groupPlaysByYear`
  - 日付整形系の関数

### 置き換えるもの

- `SeoHead`
  - Next の metadata / generateMetadata に寄せる
- `BrowserRouter`
  - App Router に置き換える
- `useEffect` ベースの初回 fetch
  - server-side fetch へ移行

## 9. 最初の1本

最初に移すべきページは `/plays/[slug]`。

理由:

- Stage Connect の最重要キャッシュポイント
- キャスト・シリーズ・VOD・FAQ・クレジットと内部リンク密度が高い
- ここが初期HTMLに出るだけで改善インパクトが大きい

### `/plays/[slug]` で server-side に出すべきもの

- タイトル
- 概要
- 公演情報
- クレジット
- シリーズリンク
- 出演キャスト一覧
- FAQ
- 構造化データ
- 関連リンク

## 10. 現実的な進め方

### Phase 1

- Next プロジェクト作成
- Supabase server-side 接続整備
- `/plays/[slug]` を移植

### Phase 2

- `/actors/[slug]`
- `/series/[slug]`

### Phase 3

- 一覧ページ
- `/guide`
- `/watch`

### Phase 4

- 既存 Vite との切り替え方法決定
- 必要なら全体移行

## 11. リスク

- フルリライトを先に始めると、データ投入速度が落ちる
- 管理画面まで同時に移すと重い
- デザインまで変え始めると移行目的がぶれる

## 12. 実務判断

Stage Connect にとって Next 移行は、

- 贅沢な改善

ではなく、

- 既に積み上げた内部リンク資産を検索エンジンに正しく渡すための施工

として扱うべき。

ただし、やるなら

- 公開ページから
- 最小単位で
- 並行開発で

進めるのが安全。
