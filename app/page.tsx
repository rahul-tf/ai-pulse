// app/page.tsx
import { fetchAllNews, type NewsFeed, type NewsItem, type NewsCategory } from '@/lib/news-fetcher';
import { Suspense } from 'react';
import ClientDashboard from '@/components/ClientDashboard';

// Force dynamic rendering — Apify calls can exceed static generation timeout
export const dynamic = 'force-dynamic';
export const revalidate = parseInt(process.env.REVALIDATE_SECONDS || '3600');

export default async function Home() {
  const feeds = await fetchAllNews();
  const generatedAt = new Date().toISOString();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ClientDashboard feeds={feeds} generatedAt={generatedAt} />
    </Suspense>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ background: 'var(--bg, #09090b)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#f59e0b', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
        ⚡ Loading AI Pulse…
      </div>
    </div>
  );
}
