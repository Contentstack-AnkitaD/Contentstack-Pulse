Give me 2 mins, reading the skill file first to make sure the PRD is sharp.Okay here's the full buildable PRD:

---

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
Gemini-generated plain English summary:
> *"Your stack has 3 major health problems: 1) 142 entries have broken references to deleted entries — likely from a bulk delete operation. 2) 89 product entries are missing required 'price' fields. 3) 210 entries haven't been updated in over a year..."*

### Entry Table (main content)

Columns: Entry Title | Content Type | Health Score | Issues | Last Updated | Actions

Filters:
- By health score (Critical / Warning / Healthy)
- By content type
- By issue type

Color coding:
- 🔴 0–40: Critical
- 🟡 41–70: Needs Work
- 🟢 71–100: Healthy

### Human Review Step (Aniket's role in demo)
A **"Mark as Reviewed"** button per entry. Aniket manually goes through the top 5 flagged entries, confirms the AI caught real issues, marks them reviewed. This is your hackathon rule compliance — human in the loop.

---

## Part 3 — NLP Chatbot + CLI Bridge

### Chat UI
Fixed panel on the right side of the dashboard. Simple chat interface.

### How It Works
```
User types message
        ↓
Gemini (AI Studio) interprets intent
        ↓
Maps to a Contentstack CLI command
        ↓
CLI runs on your demo stack
        ↓
Result shown back in chat
```

### Supported NLP → CLI Operations (demo these 4 only)

| User says | Maps to CLI command |
|-----------|-------------------|
| "Export all entries from [content type]" | `csdx cm:entries:export --content-type [ct]` |
| "Publish all entries in [content type]" | `csdx cm:entries:publish --content-types [ct]` |
| "Show me all content types in this stack" | `csdx cm:stacks:audit` |
| "Export this entire stack" | `csdx cm:stacks:export` |

### Gemini Prompt for Intent Mapping

```
You are a Contentstack CLI assistant. 
Given a user's natural language request, return ONLY a JSON object:
{
  "command": "the exact csdx CLI command to run",
  "explanation": "one line explaining what this will do",
  "safe": true/false  // false if destructive operation
}

If the operation is destructive (delete, unpublish all), set safe: false 
and do not execute — ask for confirmation first.

User request: [user message]
Stack alias: [demo stack alias]
```

### Safety Gate
If `safe: false` → chatbot asks "Are you sure? This will affect X entries." before running anything.

### CLI Execution (Node.js)
```javascript
const { exec } = require('child_process');
exec(command, (error, stdout, stderr) => {
  // return output to chat UI
});
```

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Frontend | HTML + CSS + Vanilla JS (fastest to build) |
| AI / NLP | Google AI Studio (Gemini API) |
| Stack Data | Contentstack Management API |
| CLI Bridge | Node.js `child_process` + Contentstack CLI |
| Hosting | Run locally for demo (no deployment needed) |

---

## Division of Work

| Ankita | Aniket |
|--------|--------|
| Gemini API integration (audit + chatbot) | Contentstack Management API calls |
| Health score calculation logic | CLI command mapping + execution |
| Dashboard UI | Test all 4 CLI operations on demo stack |
| NLP intent parsing | Human review flow in UI |
| AI Insights panel | Demo prep + rehearsal |

---

## Build Order (strict — 2 hours)

```
0:00 - 0:20  →  Aniket: API call to fetch entries + issues
               Ankita: Dashboard HTML shell + health score UI

0:20 - 0:50  →  Ankita: Gemini integration for audit insights
               Aniket: CLI commands tested manually on demo stack

0:50 - 1:20  →  Ankita: Chatbot UI + Gemini NLP intent mapping
               Aniket: CLI execution bridge (Node child_process)

1:20 - 1:40  →  Both: Connect everything end to end

1:40 - 2:00  →  Demo rehearsal. Cut anything not working.
               If CLI isn't ready → demo audit only, still strong.
```

---

## MVP Scope (must ship)
- ✅ Health score per entry
- ✅ Stack-level score
- ✅ Gemini AI insights panel
- ✅ Entry table with filters
- ✅ Human review button (Aniket)
- ✅ Chatbot UI with 1 working CLI operation minimum

## Cut if time runs out
- ❌ Multiple CLI operations (just demo export)
- ❌ Asset health checks
- ❌ Filters (just show the table)

---

## Demo Script (2 minutes)

**Ankita:** "Every Contentstack customer has a stack full of content. But nobody knows how healthy that content actually is. We built Pulse."

*[Show dashboard loading with real stack data]*

**Ankita:** "This is a real stack. 2,048 entries. Pulse ran an AI audit in seconds. Stack health score: 62/100. 312 critical issues."

*[Show AI insights panel]*

**Ankita:** "Gemini analyzed the issues and told us exactly what's wrong and what to fix first."

*[Aniket reviews top 5 flagged entries, marks as reviewed]*

**Aniket:** "I'm doing the human review here — confirming the AI flagged real issues. This broken reference? I can see that entry was deleted last month."

*[Switch to chatbot]*

**Ankita:** "Now — instead of opening a terminal and knowing CLI commands, I just ask."

*[Types: "Export all Blog entries from this stack"]*

**Ankita:** "Gemini understands what I want, maps it to the right CLI command, and runs it."

*[CLI executes, result shows in chat]*

**Ankita:** "That used to require a developer, CLI knowledge, and 20 minutes. Now any content manager does it in 10 seconds."

---

## One Line Pitch
*"Pulse gives every Contentstack customer an instant health report on their stack — and lets them fix it by just asking."*

---

Start with the Contentstack Management API call to fetch entries. That's your foundation. Everything else builds on top of that data. Want me to write that API fetch code first?