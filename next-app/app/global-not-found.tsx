import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "404 | Stage Connect",
  robots: { index: false, follow: true },
};

// Shared fallback for both language roots. Each message declares its language.
export default function GlobalNotFound() {
  return (
    <html lang="ja">
      <body>
        <main className="container" style={{ padding: "4rem 1rem" }}>
          <h1>404</h1>
          <p>ページが見つかりませんでした。</p>
          <p lang="en">This page could not be found.</p>
          <p><a href="/">日本語トップ</a>{" / "}<a href="/en" lang="en">English home</a></p>
        </main>
      </body>
    </html>
  );
}
