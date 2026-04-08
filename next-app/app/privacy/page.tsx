import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";

export const metadata: Metadata = {
  title: "プライバシーポリシー | Stage Connect（ステコネ）",
  description:
    "Stage Connect（ステコネ）のプライバシーポリシーです。広告、アクセス解析、Cookie、外部サービス利用について案内しています。",
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
              Stage Connect では、サービス運営と広告配信のためにアクセス情報を活用する場合があります。
              以下では、取得する情報と利用目的について案内します。
            </p>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">個人情報について</h2>
          <div className="rich-text">
            当サイトでは、お問い合わせや外部サービスの利用に関連して個人情報を取り扱う場合があります。
            取得した情報は、必要な連絡やサービス改善のためにのみ利用し、目的外では利用しません。
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">アクセス解析について</h2>
          <div className="rich-text">
            当サイトでは、利用状況を把握するために Google Analytics などのアクセス解析ツールを利用する場合があります。
            これらのツールでは、トラフィックデータ収集のために Cookie を使用することがあります。
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">Cookie について</h2>
          <div className="rich-text">
            Cookie は、ユーザーのブラウザに保存される小さなデータです。ブラウザ設定により Cookie を無効化することもできますが、
            一部機能が正しく動作しない場合があります。
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">外部サービスへのリンク</h2>
          <div className="rich-text">
            当サイトには、DMM TV などの外部サービスへのリンクが含まれます。リンク先サービスの利用に関する情報は、
            各サービスの規約やポリシーをご確認ください。
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">お問い合わせ</h2>
          <div className="rich-text">
            ポリシーに関する確認や修正依頼がある場合は、掲載している窓口や運営者連絡先からご連絡ください。
          </div>
        </section>
      </div>
    </main>
  );
}
