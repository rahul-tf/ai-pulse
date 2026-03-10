// app/api/news/route.ts
import { NextResponse } from 'next/server';
import { fetchAllNews } from '@/lib/news-fetcher';

export const revalidate = parseInt(process.env.REVALIDATE_SECONDS || '3600');

export async function GET() {
  try {
    const feeds = await fetchAllNews();
    return NextResponse.json(
      { feeds, generatedAt: new Date().toISOString() },
      {
        headers: {
          'Cache-Control': `s-maxage=${revalidate}, stale-while-revalidate`,
        },
      }
    );
  } catch (err) {
    console.error('[/api/news] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
