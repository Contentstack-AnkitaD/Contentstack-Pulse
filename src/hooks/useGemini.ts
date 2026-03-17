import { useCallback, useState } from "react";
import { useAppConfig } from "./useAppConfig";
import { EntryHealth, GeminiInsight, ChatMessage } from "../types";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
}

function parseGeminiJson(raw: string): any {
  let clean = raw.trim();
  // Strip markdown code fences
  clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  // Extract first JSON object if there's surrounding text
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in Gemini response");
  return JSON.parse(jsonMatch[0]);
}

export const useGeminiInsights = () => {
  const [config] = useAppConfig();
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<GeminiInsight | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = useCallback(
    async (flaggedEntries: EntryHealth[]) => {
      const apiKey = config.gemini_api_key || import.meta.env.REACT_APP_GEMINI_API_KEY;
      if (!apiKey) {
        setError("Gemini API key not configured. Go to App Configuration to set it.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Send top 20 worst entries for analysis
        const sample = flaggedEntries.slice(0, 20).map((e) => ({
          title: e.title,
          contentType: e.contentType,
          score: e.score,
          issues: e.issues.map((i) => ({ type: i.type, message: i.message, severity: i.severity })),
          lastUpdated: e.lastUpdated,
        }));

        const prompt = `You are a content quality analyst for Contentstack CMS.
Analyze these flagged entries and return ONLY a valid JSON object (no markdown, no code blocks, no extra text):
{"summary":"2-3 sentence summary of top problems","priorities":["priority1","priority2","priority3"],"recommendations":["fix1","fix2","fix3"]}

Keep each string under 100 characters. Entries: ${JSON.stringify(sample)}`;

        const rawResponse = await callGemini(apiKey, prompt);
        const parsed: GeminiInsight = parseGeminiJson(rawResponse);
        setInsights(parsed);
      } catch (err: any) {
        setError(err.message || "Failed to generate insights");
        console.error("[Pulse] Gemini insights error:", err);
      } finally {
        setLoading(false);
      }
    },
    [config]
  );

  return { generateInsights, loading, insights, error };
};

export const useGeminiChat = () => {
  const [config] = useAppConfig();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your Contentstack stack operations assistant. Try things like:\n- Export all entries or assets\n- Merge main branch entries into preview\n- Publish all Pages entries",
      timestamp: Date.now(),
    },
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      const apiKey = config.gemini_api_key || import.meta.env.REACT_APP_GEMINI_API_KEY;
      if (!apiKey) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: "Gemini API key not configured. Please set it in App Configuration.",
            timestamp: Date.now(),
          },
        ]);
        return;
      }

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: userMessage,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const prompt = `You are a Contentstack CLI assistant.
Given a user's natural language request, return ONLY a JSON object:
{
  "command": "the exact csdx CLI command to run",
  "explanation": "one line explaining what this will do",
  "safe": true/false
}

If the operation is destructive (delete, unpublish all), set safe: false.
If the request is not related to Contentstack operations, return:
{
  "command": null,
  "explanation": "a helpful response to the user's question",
  "safe": true
}

Supported commands:
- csdx cm:entries:export --content-type [ct] --stack-api-key [key]
- csdx cm:entries:publish --content-types [ct] --environments [env]
- csdx cm:stacks:audit
- csdx cm:stacks:export --stack-api-key [key]

User request: ${userMessage}`;

        const rawResponse = await callGemini(apiKey, prompt);
        const parsed = parseGeminiJson(rawResponse);

        let content = parsed.explanation;
        if (parsed.command) {
          content += `\n\nCommand: \`${parsed.command}\``;
          if (!parsed.safe) {
            content += "\n\n**Warning:** This is a destructive operation. Are you sure you want to proceed?";
          }
        }

        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content,
          command: parsed.command,
          safe: parsed.safe,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `Error: ${err.message}`,
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [config]
  );

  return { messages, sendMessage, loading };
};
