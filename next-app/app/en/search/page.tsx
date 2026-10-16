import type { Metadata } from 'next';
import { SiteSearchPage } from '../../../components/SiteSearchPage';

export const metadata: Metadata = { title: 'Search | Stage Connect', description: 'Search actors, productions and series.', robots: { index: false, follow: true } };
export default async function EnglishSearch({ searchParams }: { searchParams?: Promise<{ q?: string | string[] }> }) {
  const value = (await searchParams)?.q;
  return <SiteSearchPage locale="en" query={Array.isArray(value) ? value[0] : value ?? ''}/>;
}
