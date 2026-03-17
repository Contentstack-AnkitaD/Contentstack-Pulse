import React, { useEffect, useState } from "react";
import { useAppSdk } from "../hooks/useAppSdk";

const AppConfiguration: React.FC = () => {
  const [appSdk] = useAppSdk();
  const [geminiKey, setGeminiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (appSdk) {
      appSdk.getConfig().then((config: any) => {
        if (config?.gemini_api_key) {
          setGeminiKey(config.gemini_api_key);
        }
      });
    }
  }, [appSdk]);

  const handleSave = async () => {
    if (!appSdk) return;
    try {
      const location = appSdk.location?.AppConfigWidget;
      if (location) {
        await location.installation.setInstallationData({
          configuration: { gemini_api_key: geminiKey },
          serverConfiguration: {},
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("[Pulse] Failed to save config:", err);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 px-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Pulse Configuration</h1>
      <p className="text-gray-500 mb-8">
        Configure your Gemini API key to enable AI-powered insights and the NLP chatbot assistant.
      </p>

      <div className="mb-6">
        <label htmlFor="gemini-key" className="block text-sm font-semibold mb-2">
          Gemini API Key
        </label>
        <input
          id="gemini-key"
          type="password"
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-pulse-primary transition-colors"
          placeholder="Enter your Google AI Studio API key"
          value={geminiKey}
          onChange={(e) => setGeminiKey(e.target.value)}
        />
        <p className="mt-2 text-xs text-gray-400">
          Get your API key from{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            className="text-pulse-primary hover:underline"
          >
            Google AI Studio
          </a>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="px-5 py-2.5 bg-pulse-primary text-white rounded-lg text-sm font-medium hover:bg-pulse-primary-dark transition-colors"
          onClick={handleSave}
        >
          Save Configuration
        </button>
        {saved && <span className="text-green-600 text-sm font-medium">Configuration saved!</span>}
      </div>
    </div>
  );
};

export default AppConfiguration;
