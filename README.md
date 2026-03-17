# Contentstack Pulse

AI-powered Content Health Dashboard for Contentstack — a marketplace app that audits your stack's content quality and provides actionable insights using Gemini AI.

## What It Does

- **Health Audit**: Scans all entries across content types and scores them (0–100) based on missing fields, broken references, stale content, and SEO gaps
- **AI Insights**: Sends flagged entries to Gemini for prioritized recommendations and a summary of top issues
- **CLI Assistant Chatbot**: Natural language interface that maps user requests to Contentstack CLI (`csdx`) commands

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Jotai (state) + React Query
- Contentstack App SDK
- Google Gemini 2.5 Flash

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.sample` to `.env` and fill in your values:

   ```
   REACT_APP_API_BASE_URL=https://api.contentstack.io
   REACT_APP_API_KEY=your_stack_api_key
   REACT_APP_MANAGEMENT_TOKEN=your_management_token
   REACT_APP_GEMINI_API_KEY=your_gemini_api_key
   ```

   Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).

3. **Start dev server**

   ```bash
   npm start
   ```

   App runs at `http://localhost:5173`.

## Usage

1. Install as a Contentstack marketplace app (Full Page location)
2. Click **Run Health Audit** to scan your stack
3. Review the health score, entry-level issues, and severity breakdown
4. Click **Generate AI Insights** for Gemini-powered analysis
5. Use the chatbot (bottom-right) to get CLI commands in plain English

## Project Structure

```
src/
├── components/
│   ├── AIInsightsPanel.tsx   # Gemini insights display
│   ├── Chatbot.tsx           # NLP chatbot UI
│   ├── EntryTable.tsx        # Sortable/filterable entry list
│   ├── ErrorBoundary.tsx     # Error boundary wrapper
│   └── HealthScoreCard.tsx   # Overall health score gauge
├── hooks/
│   ├── useAppConfig.ts       # App configuration state
│   ├── useAppSdk.ts          # Contentstack App SDK init
│   ├── useAppSdkApi.ts       # App SDK API helpers
│   ├── useCmaApi.ts          # Direct CMA fetch wrapper
│   ├── useGemini.ts          # Gemini AI integration
│   └── useHealthAudit.ts     # Content audit engine
├── routes/
│   ├── AppConfiguration.tsx  # Settings page
│   └── FullPageApp.tsx       # Main dashboard
└── types.ts                  # TypeScript interfaces
```

## Health Scoring

Each entry starts at 100 and loses points for:

| Issue | Severity | Penalty |
|-------|----------|---------|
| Missing required fields | Critical | -25 |
| Broken references | Critical | -25 |
| Stale content (>6 months) | Warning | -10 |
| Short body (<50 chars) | Warning | -10 |
| Missing global fields | Warning | -10 |

## Build

```bash
npm run build
```

Output goes to `build/`.
