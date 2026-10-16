import Link from "next/link";

export default function NotFound() {
  return <main className="container"><h1>404</h1><p>ページが見つかりませんでした。</p><Link href="/">トップへ戻る</Link></main>;
}
