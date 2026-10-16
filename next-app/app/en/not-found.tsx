import Link from "next/link";

export default function NotFound() {
  return <main className="container"><h1>404</h1><p>This page could not be found.</p><Link href="/en">Back to home</Link></main>;
}
