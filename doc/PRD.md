# ContentStack Pulse — PRD
## AI Content Health Dashboard + NLP Stack Operations

**Team:** Ankita + Aniket  
**Hackathon:** AI Unlockathon, Contentstack Accelerate 2026  
**Time:** 2 hours  
**Target Award:** Value + Intelligent Scale

---

## Problem

Contentstack customers manage large stacks but have zero visibility into content health. Broken references, blank required fields, orphaned entries, stale content — nobody knows until something breaks in production.

On top of that, stack operations (export, publish, migrate) require CLI knowledge. Non-technical users are completely blocked without a developer.

**Pulse solves both.**

---

## What You're Building

A web dashboard app with 3 parts:

```
[1. Health Audit] → [2. Dashboard UI] → [3. NLP Chatbot + CLI Bridge]
```

---

## Part 1 — Health Audit Engine

### Data Source
- Your real production stack via Contentstack Management API
- Stack specs: ~2k entries, 30-50 content types, ~2k assets

### What Gets Audited Per Entry

| Check | What it looks for | Severity |
|-------|------------------|----------|
| Missing required fields | Blank fields marked required in schema | 🔴 Critical |
| Broken references | Reference fields pointing to deleted/unpublished entries | 🔴 Critical |
| Empty select fields | Select/dropdown fields left blank | 🟡 Warning |
| Stale content | Not updated in 6+ months | 🟡 Warning |
| Missing assets | Asset fields with deleted/broken asset references | 🔴 Critical |
| Unpublished references | Entry references that exist but are unpublished | 🟡 Warning |

### Health Score Formula
Each entry gets scored 0–100:
- Start at 100
- -25 per Critical issue
- -10 per Warning issue
- Minimum score: 0

### Stack-level Score
Average of all entry scores → one number: **Stack Health = X/100**

### AI Layer (Google AI Studio / Gemini)
Feed a sample of flagged entries to Gemini with this prompt structure:

```
You are a content quality analyst for a CMS platform.
Given these content entries with their issues, provide:
1. A plain English summary of the top 3 health problems in this stack
2. Priority order for fixing them
3. One-line fix recommendation per issue type

Entries: [JSON of flagged entries]
```

Gemini output = the **"AI Insights" panel** on the dashboard.

---

## Part 2 — Dashboard UI

### Stack Overview (top of page)
```
┌─────────────────────────────────────────┐
│  Stack Health Score        62 / 100     │
│  ████████████░░░░░░  Needs Attention    │
│                                         │
│  2,048 entries    │  847 issues found   │
│  312 critical     │  535 warnings       │
└─────────────────────────────────────────┘
```

### AI Insights Panel
Gemini-generated plain English summary.

### Entry Table (main content)
Columns: Entry Title | Content Type | Health Score | Issues | Last Updated | Actions

Filters: By health score, content type, issue type.

Color coding: 🔴 0–40 Critical | 🟡 41–70 Needs Work | 🟢 71–100 Healthy

### Human Review Step
**"Mark as Reviewed"** button per entry — human in the loop.

---

## Part 3 — NLP Chatbot + CLI Bridge

### Supported NLP → CLI Operations (demo these 4 only)

| User says | Maps to CLI command |
|-----------|---------------------|
| "Export all entries from [content type]" | `csdx cm:entries:export --content-type [ct]` |
| "Publish all entries in [content type]" | `csdx cm:entries:publish --content-types [ct]` |
| "Show me all content types in this stack" | `csdx cm:stacks:audit` |
| "Export this entire stack" | `csdx cm:stacks:export` |

### Safety Gate
If `safe: false` → chatbot asks for confirmation before running.

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Frontend | HTML + CSS + Vanilla JS |
| AI / NLP | Google AI Studio (Gemini API) |
| Stack Data | Contentstack Management API |
| CLI Bridge | Node.js `child_process` + Contentstack CLI |
| Hosting | Run locally for demo |

---

## MVP Scope (must ship)
- ✅ Health score per entry
- ✅ Stack-level score
- ✅ Gemini AI insights panel
- ✅ Entry table with filters
- ✅ Human review button
- ✅ Chatbot UI with 1 working CLI operation minimum

## Cut if time runs out
- ❌ Multiple CLI operations (just demo export)
- ❌ Asset health checks
- ❌ Filters (just show the table)

---

## One Line Pitch
*"Pulse gives every Contentstack customer an instant health report on their stack — and lets them fix it by just asking."*
