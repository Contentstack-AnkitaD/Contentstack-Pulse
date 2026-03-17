const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ── Gemini helper ──────────────────────────────────────────────
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set in .env");

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

function parseGeminiJson(raw) {
  let clean = raw.trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
  }
  return JSON.parse(clean);
}

// ── Endpoint A: Health Audit Insights ──────────────────────────
app.post("/api/audit", async (req, res) => {
  try {
    const { entries, stackScore, totalEntries } = req.body;

    // Aggregate issues for the prompt
    const issueCounts = {};
    const sample = (entries || []).slice(0, 20);
    for (const entry of sample) {
      for (const issue of entry.issues || []) {
        issueCounts[issue.type] = (issueCounts[issue.type] || 0) + 1;
      }
    }

    const prompt = `You are a content quality analyst for a headless CMS platform called Contentstack.

Analyze these aggregated content health issues and return ONLY a JSON object (no markdown, no explanation):
{
  "summary": "2-3 sentence plain English summary of the biggest problems in this stack",
  "top_issues": [
    { "title": "Issue name", "count": N, "fix": "One line fix recommendation" }
  ],
  "priority_order": ["BROKEN_REFERENCE", "MISSING_REQUIRED", "EMPTY_SELECT", "STALE_CONTENT"]
}

Stack data:
- Total entries: ${totalEntries || sample.length}
- Stack health score: ${stackScore || "N/A"}/100
- Issues breakdown: ${JSON.stringify(issueCounts)}
- Sample entries with issues: ${JSON.stringify(sample)}`;

    const raw = await callGemini(prompt);
    const parsed = parseGeminiJson(raw);

    // Map to frontend's expected shape
    res.json({
      summary: parsed.summary,
      priorities: parsed.priority_order || parsed.top_issues?.map((i) => i.title) || [],
      recommendations: parsed.top_issues?.map((i) => i.fix) || [],
      top_issues: parsed.top_issues || [],
    });
  } catch (err) {
    console.error("[Pulse] /api/audit error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Endpoint B: NLP → CLI Command Mapping ──────────────────────
app.post("/api/command", async (req, res) => {
  try {
    const { message, stackApiKey } = req.body;
    if (!message) return res.status(400).json({ error: "message is required" });

    const prompt = `You are a Contentstack CLI assistant. Map the user's natural language request to a CLI command.
Return ONLY a valid JSON object (no markdown, no explanation):
{
  "command": "csdx",
  "args": ["cm:entries:export", "--content-type", "blog"],
  "explanation": "This will export all Blog entries to a JSON file",
  "safe": true
}

Rules:
- safe = false ONLY for destructive operations (bulk delete, bulk unpublish all entries)
- If you cannot map the request, return: { "error": "Cannot map to a valid Contentstack CLI command" }

Available commands:
- csdx cm:entries:export --content-type <uid> --environment <env>
- csdx cm:entries:publish --content-types <uid> --environments <env>
- csdx cm:stacks:audit
- csdx cm:stacks:export
- csdx cm:content-types:export

Stack API Key context: ${stackApiKey || "not provided"}
User request: "${message}"`;

    const raw = await callGemini(prompt);
    const parsed = parseGeminiJson(raw);

    if (parsed.error) {
      return res.json({ command: null, args: [], explanation: parsed.error, safe: true });
    }

    res.json({
      command: parsed.command || "csdx",
      args: parsed.args || [],
      explanation: parsed.explanation || "",
      safe: parsed.safe !== false,
    });
  } catch (err) {
    console.error("[Pulse] /api/command error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Endpoint C: CLI Execution via SSE ──────────────────────────
const ANSI_RE = /\x1B\[[0-9;]*[mGKHF]/g;

app.get("/api/execute", (req, res) => {
  const { args } = req.query;
  if (!args) {
    res.status(400).json({ error: "args query param required" });
    return;
  }

  let parsedArgs;
  try {
    parsedArgs = JSON.parse(args);
  } catch {
    res.status(400).json({ error: "args must be valid JSON array" });
    return;
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const proc = spawn("csdx", parsedArgs, {
    env: { ...process.env },
    shell: true,
  });

  proc.stdout.on("data", (data) => {
    data
      .toString()
      .split("\n")
      .filter(Boolean)
      .forEach((line) => {
        const clean = line.replace(ANSI_RE, "").trim();
        if (clean) {
          res.write(`data: ${JSON.stringify({ message: clean, error: false })}\n\n`);
        }
      });
  });

  proc.stderr.on("data", (data) => {
    data
      .toString()
      .split("\n")
      .filter(Boolean)
      .forEach((line) => {
        const clean = line.replace(ANSI_RE, "").trim();
        if (clean) {
          res.write(`data: ${JSON.stringify({ message: clean, error: true })}\n\n`);
        }
      });
  });

  proc.on("close", (code) => {
    res.write(`data: ${JSON.stringify({ done: true, exitCode: code })}\n\n`);
    res.end();
  });

  proc.on("error", (err) => {
    res.write(`data: ${JSON.stringify({ message: err.message, error: true })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true, exitCode: 1 })}\n\n`);
    res.end();
  });

  // Cleanup on client disconnect
  req.on("close", () => {
    if (!proc.killed) proc.kill();
  });
});

// ── Health check ───────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", geminiConfigured: !!process.env.GEMINI_API_KEY });
});

app.listen(PORT, () => {
  console.log(`[Pulse] Server running on http://localhost:${PORT}`);
});
