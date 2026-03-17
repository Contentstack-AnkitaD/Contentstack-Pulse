import { useCallback, useState } from "react";
import { useAppConfig } from "./useAppConfig";
import { EntryHealth, GeminiInsight, ChatMessage } from "../types";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
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

        const prompt = `You are a content quality analyst for a CMS platform called Contentstack.
Given these content entries with their health issues, provide a JSON response with:
1. "summary": A plain English paragraph summarizing the top 3 health problems in this stack
2. "priorities": An array of 3 strings listing issues in priority order for fixing
3. "recommendations": An array of 3 strings with one-line fix recommendation per issue type

Respond ONLY with valid JSON, no markdown code blocks.

Entries: ${JSON.stringify(sample)}`;

        const rawResponse = await callGemini(apiKey, prompt);

        // Parse JSON from response (handle possible markdown wrapping)
        let cleanJson = rawResponse.trim();
        if (cleanJson.startsWith("```")) {
          cleanJson = cleanJson.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
        }

        const parsed: GeminiInsight = JSON.parse(cleanJson);
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
      content: 'Hi! I\'m your Contentstack assistant. Ask me things like:\n- "Export all Blog entries"\n- "Show me all content types"\n- "Publish all entries in Pages"',
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

        let cleanJson = rawResponse.trim();
        if (cleanJson.startsWith("```")) {
          cleanJson = cleanJson.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
        }

        const parsed = JSON.parse(cleanJson);

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
