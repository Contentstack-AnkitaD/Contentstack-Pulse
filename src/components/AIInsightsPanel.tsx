import React from "react";
import { GeminiInsight } from "../types";

interface Props {
  insights: GeminiInsight | null;
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
}

const AIInsightsPanel: React.FC<Props> = ({ insights, loading, error, onGenerate }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">AI Insights</h2>
        <span className="text-[11px] text-pulse-primary bg-purple-50 px-2.5 py-1 rounded-full font-medium">
          Powered by Gemini
        </span>
      </div>

      {!insights && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500 gap-4">
          <p className="text-sm">
            Run the health audit first, then generate AI insights to get actionable recommendations.
          </p>
          <button
            className="px-4 py-2 bg-pulse-primary text-white rounded-lg text-sm font-medium hover:bg-pulse-primary-dark transition-colors"
            onClick={onGenerate}
          >
            Generate Insights
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-10 gap-4 text-gray-500">
          <div className="w-8 h-8 border-3 border-gray-200 border-t-pulse-primary rounded-full animate-spin-slow" />
          <p className="text-sm">Analyzing your stack with AI...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 rounded-lg text-red-500 text-center">
          <p className="mb-3 text-sm">{error}</p>
          <button
            className="px-4 py-2 border border-pulse-primary text-pulse-primary rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors"
            onClick={onGenerate}
          >
            Retry
          </button>
        </div>
      )}

      {insights && (
        <div className="space-y-4">
          <div className="p-4 bg-purple-50 border-l-[3px] border-pulse-primary rounded-r-lg text-sm leading-relaxed">
            {insights.summary}
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              Priority Fixes
            </h3>
            <ol className="list-decimal pl-5 text-sm space-y-1.5">
              {insights.priorities.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ol>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              Recommendations
            </h3>
            <ul className="list-disc pl-5 text-sm space-y-1.5">
              {insights.recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsightsPanel;
