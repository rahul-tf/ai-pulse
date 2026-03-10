# ⚡ AI Pulse — 360° AI Intelligence Feed

> One dashboard to rule them all. Live AI news from research papers, tech press, product launches, lab blogs, social discourse, and developer tools — auto-refreshed every hour via Apify + Vercel ISR.

![AI Pulse Dashboard](https://img.shields.io/badge/status-live-brightgreen) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![Vercel](https://img.shields.io/badge/deployed-Vercel-black) ![Apify](https://img.shields.io/badge/data-Apify-orange)

---

## 📡 What It Covers

| Category | Sources |
|----------|---------|
| 🔬 **Research Papers** | arXiv cs.AI, cs.LG, cs.CL — daily |
| 📰 **Tech News** | TechCrunch, The Verge, Wired, VentureBeat |
| 🚀 **AI Products** | Product launches, model releases, startup announcements |
| 📝 **Lab Blogs** | Anthropic, OpenAI, DeepMind, Meta AI, Hugging Face |
| 💬 **Social & Community** | X/Twitter AI discourse, Reddit r/ML, Hacker News |
| 🛠️ **Tools & Frameworks** | LangChain, LlamaIndex, CrewAI, Ollama, new OSS tools |

**Top 5 stories per category · Auto-refreshes every hour · Full-text search · Trending tags**

---

## 🚀 Quick Start (Local)

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/ai-pulse.git
cd ai-pulse

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your APIFY_TOKEN

# 4. Run locally
npm run dev
# Open http://localhost:3000
```

> **Without `APIFY_TOKEN`:** The app runs on rich mock data so you can see the UI immediately.
> **With `APIFY_TOKEN`:** Live data from Apify RAG Browser across all 6 source categories.

---

## 🔑 Getting Your Apify Token

1. Go to [console.apify.com](https://console.apify.com)
2. Sign up / log in
3. Go to **Settings → Integrations → API tokens**
4. Click **Create new token** → name it `ai-pulse`
5. Copy the token → paste into `.env.local` as `APIFY_TOKEN=your_token_here`

**Cost:** The Apify RAG Browser costs ~$0.002 per page scraped. At 6 categories × 3 pages × 24 refreshes/day = ~$0.86/day. Use the free tier ($5 credit) to start.

---

## 📦 Deploy to GitHub + Vercel

### Step 1: Create GitHub Repository

```bash
# In your project directory
git init
git add .
git commit -m "feat: Initial AI Pulse webapp"

# Create a repo on GitHub (github.com/new), then:
git remote add origin https://github.com/YOUR_USERNAME/ai-pulse.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

**Option A — Vercel CLI (fastest):**
```bash
npm install -g vercel
vercel login
vercel --prod
# Follow prompts → Vercel auto-detects Next.js
```

**Option B — Vercel Dashboard:**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Framework: **Next.js** (auto-detected)
4. Add environment variable: `APIFY_TOKEN` = your token
5. Click **Deploy**

### Step 3: Set Up Auto-Refresh via GitHub Actions

The repo includes `.github/workflows/refresh.yml` that pings Vercel every hour.

**Get your Vercel deploy hook URL:**
1. In Vercel dashboard → your project → **Settings → Git → Deploy Hooks**
2. Create hook: name `hourly-refresh`, branch `main`
3. Copy the URL (looks like `https://api.vercel.com/v1/integrations/deploy/...`)

**Add it to GitHub Secrets:**
1. GitHub repo → **Settings → Secrets and variables → Actions**
2. New secret: `VERCEL_DEPLOY_HOOK_URL` = your hook URL

Now GitHub Actions will trigger a Vercel rebuild + data refresh every hour automatically. ✅

---

## 🏗️ Architecture

```
ai-pulse/
├── app/
│   ├── layout.tsx          # Root layout + metadata
│   ├── page.tsx            # Server component — fetches news at build/revalidation
│   ├── globals.css         # Design system: Syne + JetBrains Mono + Source Serif
│   └── api/
│       └── news/route.ts   # /api/news endpoint (client-side refresh)
├── components/
│   └── ClientDashboard.tsx # Full UI: tabs, cards, search, ticker
├── lib/
│   └── news-fetcher.ts     # Apify RAG Browser engine + mock data fallback
├── .github/workflows/
│   └── refresh.yml         # Hourly GitHub Actions → Vercel deploy hook
└── vercel.json             # ISR config: 1hr cache + stale-while-revalidate
```

**Data Flow:**
```
Every Hour:
GitHub Actions → Vercel Deploy Hook → Next.js ISR Revalidation
                                    → fetchAllNews() called
                                    → 6 parallel Apify RAG searches
                                    → Markdown parsed → structured JSON
                                    → Rendered & cached at edge

On Page Load:
User → Vercel Edge → Cached HTML (instant)
User clicks Refresh → /api/news → Fresh Apify fetch → UI update
```

---

## 🎨 Design

- **Typography:** Syne (display/headings) + JetBrains Mono (code/labels) + Source Serif 4 (body)
- **Palette:** Deep black `#09090b` background, amber `#f59e0b` accent, color-coded categories
- **Features:** Live ticker bar, trending tags, search, stat cards, stagger animations, grain overlay

---

## ⚙️ Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `APIFY_TOKEN` | — | **Required for live data** |
| `REVALIDATE_SECONDS` | `3600` | How often Next.js revalidates (seconds) |
| `NEWS_PER_SECTION` | `5` | Stories per category |

---

## 🔧 Customizing Sources

Edit `lib/news-fetcher.ts` → `SEARCH_QUERIES` to add/change sources:

```typescript
research: [
  { 
    query: 'site:arxiv.org cs.AI agents 2026',
    source: 'arXiv', 
    baseUrl: 'arxiv.org' 
  },
  // Add more queries per category...
],
```

---

## 📊 Live Data Today (March 10, 2026)

Breaking stories fetched live via Apify:

**🔥 Top Stories Right Now:**
1. **Anthropic vs Department of War** — Dario Amodei issues statement after supply chain risk designation; challenging in court *(Anthropic Blog, Mar 5)*
2. **Revefi launches AI Observability** for enterprise LLM and agentic workflows across GPT, Claude, Gemini *(Press, Mar 9)*
3. **arXiv March 2026** — 1,564+ new cs.AI papers this month including TraderBench (AI agent trading), HiMAC (hierarchical LLM agents), MemPO (memory optimization)
4. **OpenAI Pentagon deal** — Hardware exec Caitlin Kalinowski quits in response *(Medium/news)*
5. **AI Agent frees itself and starts secretly mining crypto** — viral story making rounds

---

## 🤝 Contributing

1. Fork the repo
2. Add new source categories in `lib/news-fetcher.ts`
3. Improve the parser in `parseMarkdownToItems()`
4. Submit a PR

---

## 📄 License

MIT — use freely, attribution appreciated.

---

*Built with ⚡ by AI Pulse · Powered by Apify + Next.js + Vercel*
