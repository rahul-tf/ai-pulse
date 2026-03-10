'use client';

import { useState, useEffect, useCallback } from 'react';
import type { NewsFeed, NewsItem, NewsCategory } from '@/lib/news-fetcher';

interface Props {
  feeds: NewsFeed[];
  generatedAt: string;
}

const TAG_COLORS: Record<string, string> = {
  LLM: '#6366f1', agent: '#f59e0b', agents: '#f59e0b', GPT: '#10b981',
  Claude: '#ec4899', Gemini: '#3b82f6', reasoning: '#8b5cf6',
  research: '#14b8a6', 'open-source': '#f97316', safety: '#ef4444',
  alignment: '#ef4444', RAG: '#06b6d4', code: '#84cc16',
  multimodal: '#a855f7', benchmark: '#eab308', startup: '#10b981',
  funding: '#22c55e', voice: '#fb923c', vision: '#60a5fa',
  'fine-tuning': '#c084fc', OpenAI: '#10b981', Anthropic: '#ec4899',
  Google: '#3b82f6', Meta: '#1d4ed8', DeepMind: '#3b82f6',
  Microsoft: '#0ea5e9', Nvidia: '#22c55e', 'Hugging Face': '#f59e0b',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NewsCard({ item, index }: { item: NewsItem; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        padding: '16px',
        borderRadius: '4px',
        background: hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'}`,
        transition: 'all 0.2s ease',
        textDecoration: 'none',
        cursor: 'pointer',
        transform: hovered ? 'translateX(3px)' : 'translateX(0)',
        animationDelay: `${index * 0.06}s`,
        animation: 'slideUp 0.4s ease-out both',
      }}
    >
      {/* Number + source row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.65rem',
          color: '#3f3f46',
          minWidth: '16px',
        }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.6rem',
          color: '#71717a',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          background: 'rgba(255,255,255,0.04)',
          padding: '2px 6px',
          borderRadius: '2px',
        }}>
          {item.source}
        </span>
        <span style={{
          marginLeft: 'auto',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.6rem',
          color: '#52525b',
        }}>
          {timeAgo(item.publishedAt)}
        </span>
      </div>

      {/* Title */}
      <h3 style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: '0.875rem',
        fontWeight: 600,
        color: hovered ? '#f4f4f5' : '#d4d4d8',
        lineHeight: 1.4,
        marginBottom: '8px',
        letterSpacing: '-0.01em',
      }}>
        {item.title}
      </h3>

      {/* Summary */}
      <p style={{
        fontFamily: 'Source Serif 4, serif',
        fontSize: '0.78rem',
        color: '#71717a',
        lineHeight: 1.6,
        marginBottom: '10px',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {item.summary}
      </p>

      {/* Tags + read time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {item.tags.slice(0, 3).map((tag) => (
          <span key={tag} style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.58rem',
            letterSpacing: '0.04em',
            padding: '2px 6px',
            borderRadius: '2px',
            color: TAG_COLORS[tag] || '#71717a',
            border: `1px solid ${TAG_COLORS[tag] ? TAG_COLORS[tag] + '30' : '#27272a'}`,
            background: TAG_COLORS[tag] ? TAG_COLORS[tag] + '10' : 'transparent',
          }}>
            {tag}
          </span>
        ))}
        {item.readTime && (
          <span style={{
            marginLeft: 'auto',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.58rem',
            color: '#3f3f46',
          }}>
            {item.readTime} min
          </span>
        )}
      </div>
    </a>
  );
}

function FeedSection({ feed, isActive }: { feed: NewsFeed; isActive: boolean }) {
  if (!isActive) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {feed.items.length === 0 ? (
        <div style={{
          padding: '32px',
          textAlign: 'center',
          color: '#52525b',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.75rem',
        }}>
          No items fetched — check your APIFY_TOKEN
        </div>
      ) : (
        feed.items.map((item, idx) => (
          <NewsCard key={item.id} item={item} index={idx} />
        ))
      )}
    </div>
  );
}

function CategoryTab({
  feed,
  isActive,
  onClick,
}: {
  feed: NewsFeed;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        background: isActive ? feed.color + '18' : 'transparent',
        border: `1px solid ${isActive ? feed.color + '40' : 'transparent'}`,
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '0.85rem' }}>{feed.icon}</span>
      <span style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: '0.75rem',
        fontWeight: isActive ? 600 : 400,
        color: isActive ? feed.color : '#71717a',
        letterSpacing: '0.01em',
      }}>
        {feed.label}
      </span>
      <span style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.58rem',
        color: isActive ? feed.color : '#3f3f46',
        background: isActive ? feed.color + '20' : 'rgba(255,255,255,0.04)',
        padding: '1px 5px',
        borderRadius: '2px',
      }}>
        {feed.items.length}
      </span>
    </button>
  );
}

function TickerBar({ feeds }: { feeds: NewsFeed[] }) {
  const allItems = feeds.flatMap((f) => f.items).slice(0, 20);
  const doubled = [...allItems, ...allItems];

  return (
    <div style={{
      background: '#111113',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
    }}>
      <div style={{
        flexShrink: 0,
        padding: '0 12px',
        background: '#f59e0b',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        zIndex: 10,
      }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.62rem',
          fontWeight: 600,
          color: '#09090b',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          LIVE
        </span>
      </div>
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div className="ticker-content" style={{
          display: 'flex',
          gap: '0',
          width: 'max-content',
        }}>
          {doubled.map((item, idx) => (
            <a
              key={idx}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 24px',
                textDecoration: 'none',
                borderRight: '1px solid rgba(255,255,255,0.06)',
                height: '32px',
              }}
            >
              <span style={{ fontSize: '0.65rem' }}>
                {feeds.find(f => f.category === item.category)?.icon}
              </span>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.68rem',
                color: '#a1a1aa',
                whiteSpace: 'nowrap',
                maxWidth: '320px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {item.title}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      padding: '12px 16px',
      background: '#111113',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '4px',
    }}>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.6rem',
        color: '#52525b',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '4px',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: '1.25rem',
        fontWeight: 700,
        color: '#f4f4f5',
        lineHeight: 1,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.58rem',
          color: '#3f3f46',
          marginTop: '4px',
        }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export default function ClientDashboard({ feeds, generatedAt }: Props) {
  const [activeCategory, setActiveCategory] = useState<NewsCategory>('research');
  const [refreshing, setRefreshing] = useState(false);
  const [currentFeeds, setCurrentFeeds] = useState(feeds);
  const [lastUpdated, setLastUpdated] = useState(generatedAt);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<NewsItem[] | null>(null);

  const activeFeed = currentFeeds.find((f) => f.category === activeCategory);
  const totalItems = currentFeeds.reduce((sum, f) => sum + f.items.length, 0);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/news', { cache: 'no-store' });
      const data = await res.json();
      if (data.feeds) {
        setCurrentFeeds(data.feeds);
        setLastUpdated(data.generatedAt);
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Search across all feeds
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(null);
      return;
    }
    const q = searchQuery.toLowerCase();
    const results = currentFeeds
      .flatMap((f) => f.items)
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q)) ||
          item.source.toLowerCase().includes(q)
      );
    setFilteredItems(results);
  }, [searchQuery, currentFeeds]);

  const allTopTags = currentFeeds
    .flatMap((f) => f.items.flatMap((i) => i.tags))
    .reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topTags = Object.entries(allTopTags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  return (
    <div style={{ background: '#09090b', minHeight: '100vh', position: 'relative' }}>
      {/* ── HEADER ── */}
      <header style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(9,9,11,0.95)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
              }}>
                ⚡
              </div>
              <div>
                <div style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: '#f4f4f5',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}>
                  AI PULSE
                </div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.55rem',
                  color: '#52525b',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}>
                  360° Intelligence Feed
                </div>
              </div>
            </div>

            {/* Search */}
            <div style={{ flex: 1, maxWidth: '400px', margin: '0 32px' }}>
              <input
                type="text"
                placeholder="Search across all sources…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '4px',
                  padding: '7px 12px',
                  color: '#e4e4e7',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.75rem',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(245,158,11,0.4)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                }}
              />
            </div>

            {/* Right controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.62rem',
                color: '#52525b',
              }}>
                <div
                  className="pulse-dot"
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#22c55e',
                  }}
                />
                Updated {timeAgo(lastUpdated)}
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                style={{
                  padding: '6px 14px',
                  background: 'transparent',
                  border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: '4px',
                  color: '#f59e0b',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.68rem',
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  opacity: refreshing ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.04em',
                }}
              >
                {refreshing ? '↻ Fetching…' : '↻ Refresh'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── TICKER ── */}
      <TickerBar feeds={currentFeeds} />

      {/* ── MAIN CONTENT ── */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 24px 64px' }}>

        {/* Search results */}
        {filteredItems !== null && (
          <div style={{ marginBottom: '32px', animation: 'slideUp 0.3s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <h2 style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: '1rem',
                fontWeight: 700,
                color: '#f4f4f5',
              }}>
                Search: "{searchQuery}"
              </h2>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.65rem',
                color: '#f59e0b',
              }}>
                {filteredItems.length} results
              </span>
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  marginLeft: 'auto',
                  background: 'transparent',
                  border: 'none',
                  color: '#52525b',
                  cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.7rem',
                }}
              >
                ✕ Clear
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '8px' }}>
              {filteredItems.map((item, idx) => (
                <NewsCard key={item.id} item={item} index={idx} />
              ))}
              {filteredItems.length === 0 && (
                <div style={{ color: '#52525b', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', padding: '24px' }}>
                  No results found.
                </div>
              )}
            </div>
            <div style={{ margin: '24px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }} />
          </div>
        )}

        {/* ── STATS ROW ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '8px',
          marginBottom: '24px',
          animation: 'slideUp 0.3s ease-out',
        }}>
          <StatCard label="Total Stories" value={String(totalItems)} sub="across all sources" />
          <StatCard label="Categories" value={String(currentFeeds.length)} sub="research to social" />
          <StatCard label="arxiv Today" value="1,564+" sub="cs.AI papers" />
          <StatCard label="Refresh Rate" value="1hr" sub="auto-revalidation" />
          <StatCard label="Sources" value="20+" sub="monitored feeds" />
        </div>

        {/* ── TRENDING TAGS ── */}
        <div style={{ marginBottom: '24px', animation: 'slideUp 0.35s ease-out' }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.6rem',
            color: '#52525b',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '10px',
          }}>
            Trending topics
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {topTags.map(([tag, count]) => (
              <button
                key={tag}
                onClick={() => setSearchQuery(tag)}
                style={{
                  padding: '4px 10px',
                  background: TAG_COLORS[tag] ? TAG_COLORS[tag] + '12' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${TAG_COLORS[tag] ? TAG_COLORS[tag] + '30' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '2px',
                  color: TAG_COLORS[tag] || '#71717a',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.65rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                {tag}
                <span style={{ opacity: 0.5, fontSize: '0.58rem' }}>{count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '240px 1fr',
          gap: '16px',
          alignItems: 'start',
        }}>
          {/* Sidebar: Category Tabs */}
          <div style={{
            position: 'sticky',
            top: '90px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            animation: 'slideUp 0.4s ease-out',
          }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.6rem',
              color: '#52525b',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0 4px',
              marginBottom: '6px',
            }}>
              Sources
            </div>
            {currentFeeds.map((feed) => (
              <CategoryTab
                key={feed.category}
                feed={feed}
                isActive={activeCategory === feed.category}
                onClick={() => setActiveCategory(feed.category)}
              />
            ))}

            {/* Feed info */}
            {activeFeed && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#111113',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '4px',
              }}>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.58rem',
                  color: '#52525b',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  Feed info
                </div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.65rem',
                  color: '#71717a',
                  lineHeight: 1.8,
                }}>
                  <div>Stories: <span style={{ color: '#d4d4d8' }}>{activeFeed.items.length}</span></div>
                  <div>Updated: <span style={{ color: '#d4d4d8' }}>{timeAgo(activeFeed.lastFetched)}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Main content area */}
          <div style={{ animation: 'slideUp 0.4s ease-out' }}>
            {/* Section header */}
            {activeFeed && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: `1px solid ${activeFeed.color}30`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.25rem' }}>{activeFeed.icon}</span>
                  <div>
                    <h2 style={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: '#f4f4f5',
                      letterSpacing: '-0.02em',
                    }}>
                      {activeFeed.label}
                    </h2>
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.6rem',
                      color: '#52525b',
                      marginTop: '2px',
                    }}>
                      Top {activeFeed.items.length} stories · Updated {timeAgo(activeFeed.lastFetched)}
                    </div>
                  </div>
                </div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.65rem',
                  color: activeFeed.color,
                  background: activeFeed.color + '15',
                  border: `1px solid ${activeFeed.color}30`,
                  padding: '4px 10px',
                  borderRadius: '2px',
                }}>
                  {activeFeed.category.toUpperCase()}
                </div>
              </div>
            )}

            {/* News items */}
            {currentFeeds.map((feed) => (
              <FeedSection
                key={feed.category}
                feed={feed}
                isActive={activeCategory === feed.category}
              />
            ))}
          </div>
        </div>

        {/* ── ALL STORIES GRID (overview) ── */}
        <div style={{ marginTop: '48px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <h2 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: '1rem',
              fontWeight: 700,
              color: '#f4f4f5',
            }}>
              All Stories
            </h2>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.62rem',
              color: '#52525b',
            }}>
              {totalItems} total across {currentFeeds.length} categories
            </span>
          </div>
          <div className="stagger" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '8px',
          }}>
            {currentFeeds.flatMap((f) =>
              f.items.slice(0, 2).map((item) => (
                <NewsCard key={item.id + '-overview'} item={item} index={0} />
              ))
            )}
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '24px',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.62rem',
          color: '#3f3f46',
          lineHeight: 2,
        }}>
          <div>⚡ AI PULSE — 360° AI Intelligence Feed</div>
          <div>Powered by Apify RAG Browser · Next.js · Vercel</div>
          <div style={{ marginTop: '4px' }}>
            Data refreshes every hour ·{' '}
            <a
              href="https://github.com"
              style={{ color: '#52525b', textDecoration: 'none' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>{' '}
            ·{' '}
            <a
              href="https://vercel.com"
              style={{ color: '#52525b', textDecoration: 'none' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Vercel
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
