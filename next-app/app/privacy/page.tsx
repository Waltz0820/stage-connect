import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

export const metadata: Metadata = {
  title: "プライバシーポリシー | Stage Connect（ステコネ）",
  description:
    "Stage Connect（ステコネ）の簡易プライバシーポリシーです。広告配信、アクセス解析、Cookie、外部サービス利用についてご案内します。",
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
              Stage Connect（ステコネ）では、サービス改善と広告配信のためにアクセス情報を取得する場合があります。
              以下に、取得する情報と利用目的の概要を記載します。
            </p>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">広告について</h2>
          <div className="rich-text">
            当サイトでは、第三者配信の広告サービスを利用する場合があります。広告配信事業者は、ユーザーの興味に応じた広告を表示するため、
            Cookie などを用いてアクセス情報を取得することがあります。
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">アクセス解析について</h2>
          <div className="rich-text">
            当サイトでは、利用状況を把握しサービス改善に役立てるため、Google Analytics などのアクセス解析ツールを使用する場合があります。
            これらのツールでは、トラフィックデータ収集のために Cookie を利用することがあります。
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">Cookie について</h2>
          <div className="rich-text">
            Cookie は、ユーザーのブラウザに保存される小さなデータです。ブラウザ設定により Cookie を無効化することもできますが、
            一部機能が正常に動作しない場合があります。
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">外部サービスへのリンク</h2>
          <div className="rich-text">
            当サイトには、DMM TV などの外部サービスへのリンクが含まれます。移動先サイトで提供される情報やサービスについては、
            各サービス提供元のポリシーをご確認ください。
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">お問い合わせ</h2>
          <div className="rich-text">
            ポリシーに関するご質問や修正依頼がある場合は、今後設置するお問い合わせ導線、または運営者が案内する連絡先からご連絡ください。
          </div>
        </section>
      </div>
    </main>
  );
}
