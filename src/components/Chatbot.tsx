import React, { useRef, useEffect, useState } from "react";
import { useGeminiChat } from "../hooks/useGemini";

const Chatbot: React.FC = () => {
  const { messages, sendMessage, loading } = useGeminiChat();
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    sendMessage(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-pulse-primary text-white border-none text-xl cursor-pointer shadow-lg z-[1000] flex items-center justify-center hover:scale-110 transition-transform"
        onClick={() => setIsOpen(!isOpen)}
        title="Open AI Assistant"
      >
        {isOpen ? "\u2715" : "\u{1F4AC}"}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-[380px] h-[500px] bg-white border border-gray-200 rounded-xl shadow-xl z-[1000] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-pulse-primary text-white">
            <h3 className="text-sm font-semibold">Pulse Assistant</h3>
            <span className="text-[11px] opacity-80">NLP-powered stack operations</span>
          </div>

          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[85%] ${msg.role === "user" ? "self-end" : "self-start"}`}
              >
                <div
                  className={`px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-pulse-primary text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}
                >
                  {msg.content.split("\n").map((line, i) => (
                    <React.Fragment key={i}>
                      {line.startsWith("Command: `") ? (
                        <code className="block mt-2 px-2.5 py-2 bg-gray-900 text-green-400 rounded-md font-mono text-xs break-all">
                          {line.replace("Command: `", "").replace("`", "")}
                        </code>
                      ) : line.startsWith("**Warning") ? (
                        <strong className="block mt-2 text-yellow-500 text-xs">
                          {line.replace(/\*\*/g, "")}
                        </strong>
                      ) : (
                        <span>{line}</span>
                      )}
                      {i < msg.content.split("\n").length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="self-start">
                <div className="flex gap-1 px-4 py-3 bg-gray-100 rounded-xl w-fit">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full"
                      style={{ animation: "bounce-dot 1.2s ease-in-out infinite" }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2 p-3 border-t border-gray-200">
            <input
              type="text"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-pulse-primary transition-colors"
              placeholder="Ask about your stack..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className="px-4 py-2 bg-pulse-primary text-white rounded-lg text-sm font-medium hover:bg-pulse-primary-dark transition-colors disabled:opacity-50"
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
