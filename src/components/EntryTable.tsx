import React, { useMemo, useState } from "react";
import { EntryHealth, Severity } from "../types";
import { getScoreColor, timeAgo } from "../common/utils";

interface Props {
  entries: EntryHealth[];
  onMarkReviewed: (uid: string) => void;
}

type FilterType = "all" | "critical" | "warning" | "healthy";

const filterBtnClass = (active: boolean) =>
  `px-3 py-1.5 text-xs rounded-full border transition-colors ${
    active
      ? "bg-pulse-primary text-white border-pulse-primary"
      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
  }`;

const EntryTable: React.FC<Props> = ({ entries, onMarkReviewed }) => {
  const [filter, setFilter] = useState<FilterType>("all");
  const [contentTypeFilter, setContentTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedUid, setExpandedUid] = useState<string | null>(null);

  const contentTypes = useMemo(() => {
    const types = new Set(entries.map((e) => e.contentType));
    return Array.from(types).sort();
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (filter === "critical" && entry.score > 40) return false;
      if (filter === "warning" && (entry.score <= 40 || entry.score > 70)) return false;
      if (filter === "healthy" && entry.score <= 70) return false;
      if (contentTypeFilter !== "all" && entry.contentType !== contentTypeFilter) return false;
      if (searchQuery && !entry.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [entries, filter, contentTypeFilter, searchQuery]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">Entry Health Report</h2>
        <span className="text-sm text-gray-500">{filteredEntries.length} entries</span>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="text"
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-pulse-primary transition-colors"
          placeholder="Search entries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="flex gap-1.5">
          {(["all", "critical", "warning", "healthy"] as FilterType[]).map((f) => (
            <button key={f} className={filterBtnClass(filter === f)} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <select
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none cursor-pointer"
          value={contentTypeFilter}
          onChange={(e) => setContentTypeFilter(e.target.value)}
        >
          <option value="all">All Content Types</option>
          {contentTypes.map((ct) => (
            <option key={ct} value={ct}>{ct}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2.5 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Entry Title
              </th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Content Type
              </th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Score
              </th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Issues
              </th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Last Updated
              </th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400">
                  No entries match the current filters.
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => (
                <React.Fragment key={entry.uid}>
                  <tr
                    className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      entry.reviewed ? "bg-green-50" : ""
                    } ${expandedUid === entry.uid ? "bg-purple-50" : ""}`}
                    onClick={() => setExpandedUid(expandedUid === entry.uid ? null : entry.uid)}
                  >
                    <td className="py-2.5 px-3 font-medium max-w-[250px] truncate">
                      <span className="mr-1.5 text-gray-400 text-[10px]">
                        {expandedUid === entry.uid ? "▼" : "▶"}
                      </span>
                      {entry.title}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-purple-50 text-pulse-primary rounded-full text-xs font-semibold">
                        {entry.contentType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-sm" style={{ color: getScoreColor(entry.score) }}>
                        {entry.score}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex gap-1.5 flex-wrap">
                        {entry.issues.filter((i) => i.severity === Severity.CRITICAL).length > 0 && (
                          <span className="px-2 py-0.5 bg-red-50 text-red-500 rounded-full text-[11px] font-semibold">
                            {entry.issues.filter((i) => i.severity === Severity.CRITICAL).length} critical
                          </span>
                        )}
                        {entry.issues.filter((i) => i.severity === Severity.WARNING).length > 0 && (
                          <span className="px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-full text-[11px] font-semibold">
                            {entry.issues.filter((i) => i.severity === Severity.WARNING).length} warning
                          </span>
                        )}
                        {entry.issues.length === 0 && (
                          <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[11px] font-semibold">
                            No issues
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                      {timeAgo(entry.lastUpdated)}
                    </td>
                    <td className="py-2.5 px-3">
                      {entry.reviewed ? (
                        <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[11px] font-semibold">
                          Reviewed
                        </span>
                      ) : (
                        <button
                          className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkReviewed(entry.uid);
                          }}
                        >
                          Mark Reviewed
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Expanded issue details */}
                  {expandedUid === entry.uid && entry.issues.length > 0 && (
                    <tr>
                      <td colSpan={6} className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Issue Details
                          </span>
                          {entry.issues.map((issue, idx) => (
                            <div
                              key={idx}
                              className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm ${
                                issue.severity === Severity.CRITICAL
                                  ? "bg-red-50 border border-red-100"
                                  : "bg-yellow-50 border border-yellow-100"
                              }`}
                            >
                              <span
                                className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                                  issue.severity === Severity.CRITICAL ? "bg-red-500" : "bg-yellow-500"
                                }`}
                              />
                              <div className="flex-1">
                                <span
                                  className={`text-xs font-semibold uppercase mr-2 ${
                                    issue.severity === Severity.CRITICAL ? "text-red-500" : "text-yellow-600"
                                  }`}
                                >
                                  {issue.severity}
                                </span>
                                <span className="text-gray-700">{issue.message}</span>
                                {issue.field && (
                                  <span className="ml-2 px-1.5 py-0.5 bg-white rounded text-[10px] text-gray-500 font-mono">
                                    {issue.field}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400 bg-white px-1.5 py-0.5 rounded whitespace-nowrap">
                                {issue.type.replace(/_/g, " ")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EntryTable;
