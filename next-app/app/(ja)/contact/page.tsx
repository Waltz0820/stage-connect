import type { Metadata } from "next";
import { ContactEmail } from "../../../components/ContactEmail";
import { Breadcrumbs } from "../../../components/Breadcrumbs";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stageconnect.jp";
const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "stageconnect2.5d@gmail.com";
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
    <main className="container editorial-support support-contact">
      <div className="stack-lg">
        <Breadcrumbs items={[{ label: "お問い合わせ" }]} />
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
          <h2 className="section-title">メールでのお問い合わせ</h2>
          <div className="rich-text">
            {hasEmail ? (
              <ContactEmail email={contactEmail} />
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

        <section className="section-card stack-md contact-checklist">
          <h2 className="section-title">修正依頼の際は</h2>
          <div className="rich-text">
            <p>
              修正依頼の際は、対象ページURL、該当箇所、正しい情報が分かる一次ソース等をあわせてご連絡いただけると確認がスムーズです。
            </p>
          </div>
          <ol className="support-checklist">
            <li><strong>対象ページのURL</strong><span>該当するページのリンク</span></li>
            <li><strong>修正を希望する箇所</strong><span>現在の表記と、修正したい内容</span></li>
            <li><strong>一次ソースの情報</strong><span>公式サイト・公式発表・公式SNSなど</span></li>
          </ol>
        </section>
      </div>
    </main>
  );
}
