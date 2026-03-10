// lib/news-fetcher.ts
// The AI Pulse news engine — fetches from all sources via Apify RAG Browser

export type NewsCategory =
  | 'research'
  | 'news'
  | 'products'
  | 'blogs'
  | 'social'
  | 'tools';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  category: NewsCategory;
  publishedAt: string;
  tags: string[];
  readTime?: number;
}

export interface NewsFeed {
  category: NewsCategory;
  label: string;
  icon: string;
  color: string;
  items: NewsItem[];
  lastFetched: string;
}

// Apify RAG Browser call
async function apifySearch(query: string, maxResults = 5): Promise<string[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    console.warn('APIFY_TOKEN not set — returning mock data');
    return [];
  }

  try {
    const response = await fetch(
      `https://api.apify.com/v2/acts/apify~rag-web-browser/run-sync-get-dataset-items?token=${token}&timeout=60&memory=1024`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          maxResults,
          outputFormats: ['markdown'],
        }),
        next: { revalidate: parseInt(process.env.REVALIDATE_SECONDS || '3600') },
      }
    );

    if (!response.ok) {
      console.error('Apify error:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    return data.map((item: { markdown?: string }) => item.markdown || '').filter(Boolean);
  } catch (err) {
    console.error('Apify fetch failed:', err);
    return [];
  }
}

// Parse markdown results into structured news items
function parseMarkdownToItems(
  markdowns: string[],
  category: NewsCategory,
  source: string,
  baseUrl?: string
): NewsItem[] {
  const items: NewsItem[] = [];

  for (const md of markdowns) {
    // Extract headlines: lines starting with ## or ### or bold **...**
    const headlineRegex = /^#{1,3}\s+(.+)$/gm;
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
    const headlines: { title: string; url: string }[] = [];

    // Try link extraction first (most reliable)
    let match;
    while ((match = linkRegex.exec(md)) !== null) {
      const title = match[1].trim();
      const url = match[2].trim();
      // Filter for meaningful headlines (not nav/footer links)
      if (
        title.length > 20 &&
        title.length < 200 &&
        !title.toLowerCase().includes('subscribe') &&
        !title.toLowerCase().includes('sign in') &&
        !title.toLowerCase().includes('log in') &&
        !title.toLowerCase().includes('cookie') &&
        !url.includes('#') &&
        (url.includes(baseUrl || '') || true)
      ) {
        headlines.push({ title, url });
      }
    }

    // Fallback: header extraction
    if (headlines.length < 3) {
      while ((match = headlineRegex.exec(md)) !== null) {
        const title = match[1].replace(/\*+/g, '').trim();
        if (title.length > 20 && title.length < 200) {
          headlines.push({ title, url: baseUrl || '#' });
        }
      }
    }

    // Take top 5 unique, deduplicated by title similarity
    const seen = new Set<string>();
    for (const h of headlines) {
      const key = h.title.toLowerCase().slice(0, 50);
      if (!seen.has(key) && items.length < 5) {
        seen.add(key);
        const summary = extractSummary(md, h.title);
        items.push({
          id: `${category}-${Date.now()}-${items.length}`,
          title: h.title,
          summary,
          url: h.url,
          source,
          category,
          publishedAt: new Date().toISOString(),
          tags: extractTags(h.title + ' ' + summary),
          readTime: Math.ceil((summary.length + h.title.length) / 800),
        });
      }
    }
  }

  return items.slice(0, 5);
}

function extractSummary(md: string, title: string): string {
  // Find text near the title
  const titleIdx = md.toLowerCase().indexOf(title.toLowerCase().slice(0, 30));
  if (titleIdx > -1) {
    const after = md.slice(titleIdx + title.length, titleIdx + title.length + 400);
    const cleaned = after
      .replace(/[#*\[\]]/g, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned.length > 40) {
      return cleaned.slice(0, 280).trim() + (cleaned.length > 280 ? '…' : '');
    }
  }
  // Fallback: first meaningful paragraph
  const paras = md.split('\n\n').filter((p) => p.length > 60 && !p.startsWith('#'));
  return paras[0]
    ? paras[0]
        .replace(/[#*\[\]]/g, '')
        .replace(/\n/g, ' ')
        .trim()
        .slice(0, 280) + '…'
    : 'Click to read the full story.';
}

function extractTags(text: string): string[] {
  const keywords = [
    'LLM', 'GPT', 'Claude', 'Gemini', 'agent', 'agents', 'multimodal',
    'reasoning', 'RAG', 'fine-tuning', 'RLHF', 'safety', 'alignment',
    'robotics', 'vision', 'voice', 'code', 'benchmark', 'open-source',
    'OpenAI', 'Anthropic', 'Google', 'Meta', 'DeepMind', 'Hugging Face',
    'Microsoft', 'Nvidia', 'startup', 'funding', 'research',
  ];
  const lower = text.toLowerCase();
  return keywords
    .filter((kw) => lower.includes(kw.toLowerCase()))
    .slice(0, 4);
}

// ── MOCK DATA (used when APIFY_TOKEN is not set) ──────────────────────────────

function getMockData(): NewsFeed[] {
  const now = new Date().toISOString();
  return [
    {
      category: 'research',
      label: 'Research Papers',
      icon: '🔬',
      color: '#6366f1',
      lastFetched: now,
      items: [
        { id: 'r1', title: 'TraderBench: How Robust Are AI Agents in Adversarial Capital Markets?', summary: 'A new benchmark evaluating LLM-based trading agents against adversarial market conditions, submitted to ICLR 2026 Agents in the Wild Workshop.', url: 'https://arxiv.org/abs/2603.00285', source: 'arXiv', category: 'research', publishedAt: now, tags: ['agent', 'benchmark', 'LLM'], readTime: 3 },
        { id: 'r2', title: 'DenoiseFlow: Uncertainty-Aware Denoising for Reliable LLM Agentic Workflows', summary: 'A novel framework that introduces uncertainty-aware denoising to improve the reliability of LLM agents in complex multi-step workflows.', url: 'https://arxiv.org/abs/2603.00532', source: 'arXiv', category: 'research', publishedAt: now, tags: ['agent', 'LLM', 'reasoning'], readTime: 4 },
        { id: 'r3', title: 'Draft-Thinking: Learning Efficient Reasoning in Long Chain-of-Thought LLMs', summary: 'Proposes a training approach to make LLMs reason more efficiently in extended chain-of-thought contexts, reducing compute while preserving quality.', url: 'https://arxiv.org/abs/2603.00578', source: 'arXiv', category: 'research', publishedAt: now, tags: ['reasoning', 'LLM'], readTime: 4 },
        { id: 'r4', title: 'MemPO: Self-Memory Policy Optimization for Long-Horizon Agents', summary: 'Introduces memory-augmented policy optimization enabling agents to persist and leverage learned experiences over long interaction horizons.', url: 'https://arxiv.org/abs/2603.00680', source: 'arXiv', category: 'research', publishedAt: now, tags: ['agent', 'LLM', 'reasoning'], readTime: 5 },
        { id: 'r5', title: 'HiMAC: Hierarchical Macro-Micro Learning for Long-Horizon LLM Agents', summary: 'A hierarchical architecture decomposing long-horizon tasks into macro goals and micro actions for improved LLM agent planning.', url: 'https://arxiv.org/abs/2603.00977', source: 'arXiv', category: 'research', publishedAt: now, tags: ['agent', 'LLM', 'benchmark'], readTime: 5 },
      ],
    },
    {
      category: 'news',
      label: 'Tech News',
      icon: '📰',
      color: '#f59e0b',
      lastFetched: now,
      items: [
        { id: 'n1', title: 'OpenAI launches GPT-5 with native voice and vision agents', summary: 'OpenAI announces their most capable model yet, integrating voice, vision, and agentic capabilities natively into a unified system.', url: 'https://techcrunch.com', source: 'TechCrunch', category: 'news', publishedAt: now, tags: ['OpenAI', 'GPT', 'agent', 'multimodal'], readTime: 3 },
        { id: 'n2', title: 'Google DeepMind releases Gemini Ultra 2.0 with 10M context window', summary: 'The new Gemini model dramatically extends context capacity, enabling analysis of entire codebases and lengthy research documents.', url: 'https://theverge.com', source: 'The Verge', category: 'news', publishedAt: now, tags: ['Google', 'Gemini', 'multimodal'], readTime: 4 },
        { id: 'n3', title: 'Microsoft Copilot gets autonomous agent mode in Office 365', summary: 'Microsoft integrates agentic AI directly into Word, Excel, and Teams, allowing Copilot to take multi-step actions on behalf of users.', url: 'https://wired.com', source: 'Wired', category: 'news', publishedAt: now, tags: ['Microsoft', 'agent', 'code'], readTime: 3 },
        { id: 'n4', title: 'Anthropic raises $4B Series E, valued at $60B', summary: 'Anthropic secures another major funding round as enterprise demand for Claude AI accelerates across financial services and healthcare.', url: 'https://techcrunch.com', source: 'TechCrunch', category: 'news', publishedAt: now, tags: ['Anthropic', 'Claude', 'funding', 'startup'], readTime: 2 },
        { id: 'n5', title: 'EU AI Act enforcement begins: companies rush to comply', summary: 'The first wave of EU AI Act compliance deadlines arrives, forcing major AI providers to audit and document high-risk system deployments.', url: 'https://theverge.com', source: 'The Verge', category: 'news', publishedAt: now, tags: ['safety', 'alignment'], readTime: 4 },
      ],
    },
    {
      category: 'products',
      label: 'AI Products',
      icon: '🚀',
      color: '#10b981',
      lastFetched: now,
      items: [
        { id: 'p1', title: 'Cursor AI releases v2.0 with multi-file autonomous editing', summary: 'The AI-first code editor now supports fully autonomous multi-file refactoring and test generation with human-in-the-loop approval.', url: 'https://cursor.sh', source: 'Cursor', category: 'products', publishedAt: now, tags: ['code', 'agent', 'open-source'], readTime: 3 },
        { id: 'p2', title: 'Perplexity launches Deep Research mode for enterprise', summary: 'Perplexity expands its agentic research capabilities with multi-step web browsing and source synthesis for business intelligence use cases.', url: 'https://perplexity.ai', source: 'Perplexity', category: 'products', publishedAt: now, tags: ['agent', 'RAG', 'research'], readTime: 3 },
        { id: 'p3', title: 'Mistral releases Mistral-Next with 128K context', summary: 'Mistral AI ships a significantly upgraded open-weight model with extended context and improved multilingual reasoning capabilities.', url: 'https://mistral.ai', source: 'Mistral AI', category: 'products', publishedAt: now, tags: ['open-source', 'LLM'], readTime: 2 },
        { id: 'p4', title: 'Cohere launches Command R+ 2.0 for enterprise RAG', summary: 'Cohere updates its flagship enterprise model with improved tool use, grounding, and lower latency for production RAG pipelines.', url: 'https://cohere.com', source: 'Cohere', category: 'products', publishedAt: now, tags: ['RAG', 'LLM', 'fine-tuning'], readTime: 3 },
        { id: 'p5', title: 'ElevenLabs ships real-time voice AI with 300ms latency', summary: 'The voice AI platform achieves sub-300ms latency for real-time conversational agents, opening new possibilities for live phone AI.', url: 'https://elevenlabs.io', source: 'ElevenLabs', category: 'products', publishedAt: now, tags: ['voice', 'agent', 'startup'], readTime: 2 },
      ],
    },
    {
      category: 'blogs',
      label: 'AI Lab Blogs',
      icon: '📝',
      color: '#ec4899',
      lastFetched: now,
      items: [
        { id: 'b1', title: 'Anthropic: Constitutional AI 2.0 — Training AI to be Helpful and Harmless', summary: 'Anthropic publishes new research on evolved Constitutional AI methods that improve Claude\'s alignment across more diverse ethical scenarios.', url: 'https://anthropic.com/research', source: 'Anthropic Blog', category: 'blogs', publishedAt: now, tags: ['Anthropic', 'Claude', 'safety', 'alignment'], readTime: 6 },
        { id: 'b2', title: 'OpenAI: Reasoning models and the path to AGI', summary: 'OpenAI shares insights from their o-series reasoning model development and previews what comes after chain-of-thought reasoning.', url: 'https://openai.com/blog', source: 'OpenAI Blog', category: 'blogs', publishedAt: now, tags: ['OpenAI', 'reasoning', 'GPT'], readTime: 7 },
        { id: 'b3', title: 'Hugging Face: Open LLM Leaderboard 2026 — New Benchmarks', summary: 'Hugging Face updates the open LLM leaderboard with new agentic and long-context benchmarks, reshuffling open-source model rankings.', url: 'https://huggingface.co/blog', source: 'Hugging Face Blog', category: 'blogs', publishedAt: now, tags: ['open-source', 'benchmark', 'LLM', 'Hugging Face'], readTime: 5 },
        { id: 'b4', title: 'Google DeepMind: AlphaFold 3 expands to RNA and small molecules', summary: 'DeepMind extends its protein folding AI to model RNA structures and drug-like molecules, dramatically broadening its impact on drug discovery.', url: 'https://deepmind.google/blog', source: 'DeepMind Blog', category: 'blogs', publishedAt: now, tags: ['Google', 'research', 'multimodal'], readTime: 6 },
        { id: 'b5', title: 'Meta AI: LLaMA 4 series — Training on 30 trillion tokens', summary: 'Meta shares the training methodology behind LLaMA 4, including dataset curation, compute allocation, and safety evaluation at scale.', url: 'https://ai.meta.com/blog', source: 'Meta AI Blog', category: 'blogs', publishedAt: now, tags: ['Meta', 'open-source', 'LLM'], readTime: 8 },
      ],
    },
    {
      category: 'social',
      label: 'Social & Community',
      icon: '💬',
      color: '#8b5cf6',
      lastFetched: now,
      items: [
        { id: 's1', title: '@karpathy: "The agent era is here — but we\'re still writing the OS"', summary: 'Andrej Karpathy\'s viral thread on why AI agents need a new software paradigm, drawing parallels to the early days of operating systems. 47K likes.', url: 'https://x.com', source: 'X (Twitter)', category: 'social', publishedAt: now, tags: ['agent', 'LLM', 'reasoning'], readTime: 4 },
        { id: 's2', title: 'r/MachineLearning: GPT-5 technical report analysis megathread', summary: 'The machine learning community tears apart the GPT-5 technical report, identifying key architectural decisions and comparing to academic work. 12K upvotes.', url: 'https://reddit.com/r/MachineLearning', source: 'Reddit r/ML', category: 'social', publishedAt: now, tags: ['GPT', 'OpenAI', 'research'], readTime: 10 },
        { id: 's3', title: 'HackerNews: Show HN — I built a personal AI agent that manages my email', summary: 'A developer shares their open-source personal email AI agent that triages, drafts, and sends with approval gates. 800+ comments discussing privacy and agentic autonomy.', url: 'https://news.ycombinator.com', source: 'Hacker News', category: 'social', publishedAt: now, tags: ['agent', 'open-source', 'code'], readTime: 15 },
        { id: 's4', title: '@ylecun debate: Scaling laws are running out — time for new architectures', summary: 'Yann LeCun sparks intense debate claiming the AI community needs to move beyond transformer scaling, pointing to world models as the path forward.', url: 'https://x.com', source: 'X (Twitter)', category: 'social', publishedAt: now, tags: ['LLM', 'reasoning', 'research', 'alignment'], readTime: 5 },
        { id: 's5', title: 'LinkedIn: AI Engineers survey — 73% say agent frameworks need better evals', summary: 'A widely-shared LinkedIn post summarizing survey data from 500 AI engineers on their biggest pain points building production agent systems.', url: 'https://linkedin.com', source: 'LinkedIn', category: 'social', publishedAt: now, tags: ['agent', 'benchmark', 'code'], readTime: 3 },
      ],
    },
    {
      category: 'tools',
      label: 'Tools & Frameworks',
      icon: '🛠️',
      color: '#14b8a6',
      lastFetched: now,
      items: [
        { id: 't1', title: 'LangChain v0.3 — Native multi-agent orchestration lands', summary: 'LangChain ships a major architectural overhaul with first-class multi-agent support, streaming, and a new graph-based execution model.', url: 'https://langchain.com', source: 'LangChain', category: 'tools', publishedAt: now, tags: ['agent', 'open-source', 'code', 'LLM'], readTime: 5 },
        { id: 't2', title: 'LlamaIndex 2.0 — Production-ready RAG with auto-eval', summary: 'LlamaIndex releases a ground-up rewrite focusing on production RAG with built-in evaluation, observability, and enterprise deployment patterns.', url: 'https://llamaindex.ai', source: 'LlamaIndex', category: 'tools', publishedAt: now, tags: ['RAG', 'agent', 'code', 'open-source'], readTime: 4 },
        { id: 't3', title: 'CrewAI hits 100K GitHub stars — new enterprise offering', summary: 'The multi-agent collaboration framework celebrates 100K GitHub stars and launches a managed cloud tier for enterprise teams.', url: 'https://crewai.com', source: 'CrewAI', category: 'tools', publishedAt: now, tags: ['agent', 'open-source', 'startup'], readTime: 3 },
        { id: 't4', title: 'Ollama adds function calling and tool use to all local models', summary: 'Ollama ships a major update enabling standardized function calling and tool use across all locally-hosted models, matching cloud API parity.', url: 'https://ollama.com', source: 'Ollama', category: 'tools', publishedAt: now, tags: ['open-source', 'LLM', 'code'], readTime: 3 },
        { id: 't5', title: 'Anthropic MCP protocol becomes industry standard — 200+ integrations', summary: 'The Model Context Protocol reaches a milestone with adoption from major dev tools, databases, and cloud providers, establishing it as the agent integration standard.', url: 'https://anthropic.com', source: 'Anthropic', category: 'tools', publishedAt: now, tags: ['Anthropic', 'agent', 'open-source'], readTime: 4 },
      ],
    },
  ];
}

// ── LIVE APIFY FETCHING ───────────────────────────────────────────────────────

const SEARCH_QUERIES: Record<NewsCategory, { query: string; source: string; baseUrl: string }[]> = {
  research: [
    { query: 'site:arxiv.org cs.AI LLM agents agentic latest 2026', source: 'arXiv', baseUrl: 'arxiv.org' },
  ],
  news: [
    { query: 'AI artificial intelligence news today 2026 site:techcrunch.com OR site:theverge.com OR site:wired.com', source: 'Tech Press', baseUrl: 'techcrunch.com' },
  ],
  products: [
    { query: 'new AI product launch announcement 2026 LLM model release', source: 'Product Launch', baseUrl: '' },
  ],
  blogs: [
    { query: 'openai.com/blog OR anthropic.com/research OR ai.meta.com/blog OR huggingface.co/blog 2026', source: 'AI Labs', baseUrl: '' },
  ],
  social: [
    { query: 'AI agents LLM trending discussion site:reddit.com OR site:news.ycombinator.com 2026', source: 'Community', baseUrl: '' },
  ],
  tools: [
    { query: 'AI developer tools frameworks LangChain LlamaIndex release update 2026', source: 'Dev Tools', baseUrl: '' },
  ],
};

const FEED_META: Record<NewsCategory, { label: string; icon: string; color: string }> = {
  research: { label: 'Research Papers', icon: '🔬', color: '#6366f1' },
  news:     { label: 'Tech News',       icon: '📰', color: '#f59e0b' },
  products: { label: 'AI Products',     icon: '🚀', color: '#10b981' },
  blogs:    { label: 'AI Lab Blogs',    icon: '📝', color: '#ec4899' },
  social:   { label: 'Social & Community', icon: '💬', color: '#8b5cf6' },
  tools:    { label: 'Tools & Frameworks', icon: '🛠️', color: '#14b8a6' },
};

export async function fetchAllNews(): Promise<NewsFeed[]> {
  const token = process.env.APIFY_TOKEN;

  // No token — return rich mock data
  if (!token || token === 'your_apify_token_here') {
    console.log('[AI Pulse] Running with mock data (set APIFY_TOKEN for live data)');
    return getMockData();
  }

  const categories = Object.keys(SEARCH_QUERIES) as NewsCategory[];
  const feeds: NewsFeed[] = [];

  await Promise.allSettled(
    categories.map(async (category) => {
      const queries = SEARCH_QUERIES[category];
      const meta = FEED_META[category];
      let allItems: NewsItem[] = [];

      for (const q of queries) {
        const markdowns = await apifySearch(q.query, 3);
        const items = parseMarkdownToItems(markdowns, category, q.source, q.baseUrl);
        allItems = [...allItems, ...items];
      }

      // Deduplicate
      const seen = new Set<string>();
      const deduped = allItems.filter((item) => {
        const key = item.title.toLowerCase().slice(0, 40);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      feeds.push({
        category,
        ...meta,
        items: deduped.slice(0, 5),
        lastFetched: new Date().toISOString(),
      });
    })
  );

  // Sort to match desired order
  const order: NewsCategory[] = ['research', 'news', 'products', 'blogs', 'social', 'tools'];
  feeds.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));

  // Fill any missing feeds with mock data
  const mockFeeds = getMockData();
  for (const order_cat of order) {
    if (!feeds.find((f) => f.category === order_cat)) {
      const mock = mockFeeds.find((f) => f.category === order_cat);
      if (mock) feeds.push(mock);
    }
  }

  return feeds;
}
