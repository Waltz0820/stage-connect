import type { Metadata } from "next";
import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

export const metadata: Metadata = {
  title: "プライバシーポリシー | Stage Connect（ステコネ）",
  description:
    "Stage Connect（ステコネ）のプライバシーポリシーです。個人情報、アクセス解析、Cookie、広告配信、お問い合わせ窓口について掲載しています。",
  alternates: {
    canonical: `${siteUrl}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Privacy Policy</span>
            <h1 className="page-title">プライバシーポリシー</h1>
            <p className="lead">
              Stage Connect では、サービス運営、アクセス解析、広告配信、掲載情報への対応のために必要な範囲で情報を取り扱います。
              本ページでは、その取扱方針とお問い合わせ窓口について記載しています。
            </p>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">運営者情報</h2>
          <div className="rich-text">
            <p>サイト名: Stage Connect</p>
            <p>運営形態: 個人運営の舞台・ミュージカル情報アーカイブ</p>
            <p>
              運営者へのご連絡は <Link href="/contact">お問い合わせページ</Link> からお願いします。
            </p>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">個人情報について</h2>
          <div className="rich-text">
            <p>
              当サイトでは、お問い合わせ対応、掲載内容の確認、外部サービスの利用に関連して個人情報を取り扱う場合があります。
            </p>
            <p>
              取得した情報は、回答や確認のために必要な範囲でのみ利用し、法令に基づく場合を除いて第三者へ提供しません。
            </p>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">アクセス解析について</h2>
          <div className="rich-text">
            <p>
              当サイトでは、利用状況の把握や改善のために Google Analytics などのアクセス解析ツールを利用する場合があります。
            </p>
            <p>
              これらのツールでは、トラフィックデータの収集のために Cookie を使用することがあります。
            </p>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">Cookie について</h2>
          <div className="rich-text">
            <p>
              Cookie は、ブラウザに保存される小さなデータです。利便性向上、アクセス解析、広告配信のために利用されることがあります。
            </p>
            <p>
              Cookie の保存はブラウザ設定から無効化できますが、一部機能が正常に動作しない場合があります。
            </p>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">広告配信について</h2>
          <div className="rich-text">
            <p>
              当サイトでは、第三者配信の広告サービスを利用する場合があります。これらの事業者は、ユーザーの興味に応じた広告を表示するために Cookie 等を利用することがあります。
            </p>
            <p>
              掲載している配信サービスリンクには、アフィリエイトリンクが含まれる場合があります。
            </p>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">掲載情報の修正・削除依頼</h2>
          <div className="rich-text">
            <p>
              掲載内容に誤り、修正希望、削除希望がある場合は、確認可能な情報を添えて
              <Link href="/contact">お問い合わせページ</Link> からご連絡ください。
            </p>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">お問い合わせ</h2>
          <div className="rich-text">
            <p>
              ポリシーに関する確認や修正依頼、掲載内容に関するご連絡は、
              <Link href="/contact">お問い合わせページ</Link> から受け付けています。
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
