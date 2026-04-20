import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";
const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";
const contactX = process.env.NEXT_PUBLIC_CONTACT_X || "";

export const metadata: Metadata = {
  title: "お問い合わせ | Stage Connect（ステコネ）",
  description:
    "Stage Connect（ステコネ）へのお問い合わせ窓口です。掲載内容の修正依頼、削除依頼、運営に関するご連絡はこちらからご確認ください。",
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
};

export default function ContactPage() {
  const hasEmail = Boolean(contactEmail);
  const hasX = Boolean(contactX);

  return (
    <main className="container" style={{ paddingBlock: 32 }}>
      <div className="stack-lg">
        <section className="hero-card stack-md">
          <div className="stack-sm">
            <span className="eyebrow">Contact</span>
            <h1 className="page-title">お問い合わせ</h1>
            <p className="lead">
              掲載情報の修正・削除依頼、運営に関するご連絡、その他のお問い合わせはこちらをご利用ください。
            </p>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">ご連絡方法</h2>
          <div className="rich-text">
            {hasEmail ? (
              <p>
                メール:{" "}
                <a href={`mailto:${contactEmail}`}>
                  {contactEmail}
                </a>
              </p>
            ) : null}

            {hasX ? (
              <p>
                X:{" "}
                <a href={contactX} target="_blank" rel="noopener noreferrer">
                  {contactX}
                </a>
              </p>
            ) : null}

            {!hasEmail && !hasX ? (
              <p>
                連絡先は現在準備中です。実運用時はこのページにメールアドレスまたは公式Xアカウントを掲載してください。
              </p>
            ) : null}
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">主な受付内容</h2>
          <div className="rich-text">
            <ul>
              <li>掲載内容の修正・削除依頼</li>
              <li>プロフィールやクレジット情報に関する確認</li>
              <li>運営・広告掲載に関するお問い合わせ</li>
              <li>その他サイト全般に関するご連絡</li>
            </ul>
          </div>
        </section>

        <section className="section-card stack-md">
          <h2 className="section-title">お願い</h2>
          <div className="rich-text">
            <p>
              修正依頼の際は、対象ページURL、該当箇所、正しい情報が分かる一次ソース等をあわせてご連絡いただけると確認がスムーズです。
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
