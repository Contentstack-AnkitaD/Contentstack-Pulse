import { useCallback, useState } from "react";
import { EntryHealth, GeminiInsight, ChatMessage } from "../types";

// ── Insights hook — calls backend /api/audit ───────────────────
export const useGeminiInsights = () => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<GeminiInsight | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = useCallback(
    async (flaggedEntries: EntryHealth[], stackScore?: number, totalEntries?: number) => {
      setLoading(true);
      setError(null);

      try {
        const sample = flaggedEntries.slice(0, 20).map((e) => ({
          title: e.title,
          contentType: e.contentType,
          score: e.score,
          issues: e.issues.map((i) => ({ type: i.type, message: i.message, severity: i.severity })),
          lastUpdated: e.lastUpdated,
        }));

        const response = await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entries: sample,
            stackScore: stackScore ?? 0,
            totalEntries: totalEntries ?? sample.length,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: response.statusText }));
          throw new Error(err.error || `Server error: ${response.status}`);
        }

        const parsed: GeminiInsight = await response.json();
        setInsights(parsed);
      } catch (err: any) {
        setError(err.message || "Failed to generate insights");
        console.error("[Pulse] Insights error:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { generateInsights, loading, insights, error };
};

// ── Chat hook — calls backend /api/command ─────────────────────
export const useGeminiChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        'Hi! I\'m your Contentstack assistant. Ask me things like:\n- "Export all Blog entries"\n- "Show me all content types"\n- "Publish all entries in Pages"',
      timestamp: Date.now(),
    },
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (userMessage: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(err.error || `Server error: ${response.status}`);
      }

      const parsed = await response.json();

      let content = parsed.explanation;
      if (parsed.command && parsed.args?.length) {
        const fullCommand = `${parsed.command} ${parsed.args.join(" ")}`;
        content += `\n\nCommand: \`${fullCommand}\``;
        if (!parsed.safe) {
          content += "\n\n**Warning:** This is a destructive operation. Are you sure you want to proceed?";
        }
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content,
        command: parsed.command && parsed.args?.length ? parsed.command : undefined,
        args: parsed.args,
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
  }, []);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  return { messages, sendMessage, addMessage, loading };
};
