import React, { useCallback } from "react";
import { useHealthAudit } from "../hooks/useHealthAudit";
import { useGeminiInsights } from "../hooks/useGemini";
import HealthScoreCard from "../components/HealthScoreCard";
import AIInsightsPanel from "../components/AIInsightsPanel";
import EntryTable from "../components/EntryTable";
import ContentTypeTable from "../components/ContentTypeTable";
import Chatbot from "../components/Chatbot";

const FullPageApp: React.FC = () => {
  console.log("[Pulse] FullPageApp component rendering");
  const { runAudit, loading, progress, stackHealth, error, setStackHealth } = useHealthAudit();
  const {
    generateInsights,
    loading: insightsLoading,
    insights,
    error: insightsError,
  } = useGeminiInsights();

  const handleMarkReviewed = useCallback(
    (uid: string) => {
      if (!stackHealth) return;
      setStackHealth({
        ...stackHealth,
        entries: stackHealth.entries.map((e) =>
          e.uid === uid ? { ...e, reviewed: true } : e
        ),
      });
    },
    [stackHealth, setStackHealth]
  );

  const handleGenerateInsights = useCallback(() => {
    if (!stackHealth) return;
    // Send both entry issues and CT issues to Gemini
    const flaggedEntries = stackHealth.entries.filter((e) => e.issues.length > 0);
    const flaggedCTs = stackHealth.contentTypeHealth.filter((ct) => ct.issues.length > 0);
    generateInsights(flaggedEntries, flaggedCTs);
  }, [stackHealth, generateInsights]);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-pulse-primary text-white rounded-lg text-sm font-extrabold">
              P
            </span>
            Pulse
          </h1>
          <span className="text-sm text-gray-400 border-l border-gray-200 pl-3">
            AI Content Health Dashboard
          </span>
        </div>
        <button
          className="px-5 py-2.5 bg-pulse-primary text-white rounded-lg text-sm font-semibold hover:bg-pulse-primary-dark transition-colors disabled:opacity-50"
          onClick={runAudit}
          disabled={loading}
        >
          {loading ? "Scanning..." : stackHealth ? "Re-run Audit" : "Run Health Audit"}
        </button>
      </header>

      {/* Progress bar */}
      {loading && (
        <div className="mx-8 mt-6 text-center">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-pulse-primary rounded-full transition-all duration-300"
              style={{
                width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : "0%",
              }}
            />
          </div>
          <p className="text-sm text-gray-500">{progress.phase}</p>
          {progress.total > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {progress.current} / {progress.total} content types
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!stackHealth && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 opacity-60">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="36" stroke="#6C5CE7" strokeWidth="3" fill="none" />
              <path
                d="M28 42 L36 50 L52 30"
                stroke="#6C5CE7"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2">Welcome to Pulse</h2>
          <p className="text-gray-500 max-w-md">
            Click "Run Health Audit" to scan your Contentstack stack for content health issues.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Pulse will check for missing fields, broken references, stale content, and more.
          </p>
        </div>
      )}

      {/* Dashboard */}
      {stackHealth && (
        <div className="px-8 pt-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HealthScoreCard stackHealth={stackHealth} />
            <AIInsightsPanel
              insights={insights}
              loading={insightsLoading}
              error={insightsError}
              onGenerate={handleGenerateInsights}
            />
          </div>
          <ContentTypeTable contentTypes={stackHealth.contentTypeHealth} />
          {stackHealth.entries.length > 0 && (
            <EntryTable entries={stackHealth.entries} onMarkReviewed={handleMarkReviewed} />
          )}
        </div>
      )}

      <Chatbot />
    </div>
  );
};

export default FullPageApp;
