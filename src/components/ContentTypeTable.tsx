import React, { useMemo, useState } from "react";
import { ContentTypeHealth, Severity } from "../types";
import { getScoreColor } from "../common/utils";

interface Props {
  contentTypes: ContentTypeHealth[];
}

type FilterType = "all" | "critical" | "warning" | "healthy" | "empty";

const filterBtnClass = (active: boolean) =>
  `px-3 py-1.5 text-xs rounded-full border transition-colors ${
    active
      ? "bg-pulse-primary text-white border-pulse-primary"
      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
  }`;

const ContentTypeTable: React.FC<Props> = ({ contentTypes }) => {
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return contentTypes.filter((ct) => {
      if (filter === "critical" && !ct.issues.some((i) => i.severity === Severity.CRITICAL)) return false;
      if (filter === "warning" && !ct.issues.some((i) => i.severity === Severity.WARNING)) return false;
      if (filter === "healthy" && ct.issues.length > 0) return false;
      if (filter === "empty" && ct.entryCount > 0) return false;
      if (searchQuery && !ct.title.toLowerCase().includes(searchQuery.toLowerCase()) && !ct.uid.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [contentTypes, filter, searchQuery]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">Content Type Health</h2>
        <span className="text-sm text-gray-500">{filtered.length} content types</span>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="text"
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-pulse-primary transition-colors"
          placeholder="Search content types..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex gap-1.5">
          {(["all", "critical", "warning", "empty", "healthy"] as FilterType[]).map((f) => (
            <button key={f} className={filterBtnClass(filter === f)} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2.5 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Content Type
              </th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                UID
              </th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Entries
              </th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Score
              </th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Issues
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-400">
                  No content types match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((ct) => (
                <tr key={ct.uid} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-medium max-w-[200px] truncate">{ct.title}</td>
                  <td className="py-2.5 px-3 text-gray-400 text-xs font-mono max-w-[180px] truncate">{ct.uid}</td>
                  <td className="py-2.5 px-3">
                    <span className={`font-semibold ${ct.entryCount === 0 ? "text-orange-500" : "text-gray-700"}`}>
                      {ct.entryCount}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-sm" style={{ color: getScoreColor(ct.score) }}>
                      {ct.score}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {ct.issues.filter((i) => i.severity === Severity.CRITICAL).length > 0 && (
                        <span className="px-2 py-0.5 bg-red-50 text-red-500 rounded-full text-[11px] font-semibold">
                          {ct.issues.filter((i) => i.severity === Severity.CRITICAL).length} critical
                        </span>
                      )}
                      {ct.issues.filter((i) => i.severity === Severity.WARNING).length > 0 && (
                        <span className="px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-full text-[11px] font-semibold">
                          {ct.issues.filter((i) => i.severity === Severity.WARNING).length} warning
                        </span>
                      )}
                      {ct.issues.length === 0 && (
                        <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[11px] font-semibold">
                          Healthy
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContentTypeTable;
