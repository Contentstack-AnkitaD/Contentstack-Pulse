import React from "react";
import { StackHealth } from "../types";
import { getScoreColor, getScoreLabel } from "../common/utils";

interface Props {
  stackHealth: StackHealth;
}

const HealthScoreCard: React.FC<Props> = ({ stackHealth }) => {
  const { averageScore, totalEntries, totalIssues, criticalCount, warningCount, contentTypeHealth } = stackHealth;
  const color = getScoreColor(averageScore);
  const label = getScoreLabel(averageScore);

  const emptyCTs = contentTypeHealth.filter((ct) => ct.entryCount === 0).length;
  const ctWithIssues = contentTypeHealth.filter((ct) => ct.issues.length > 0).length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-800">Stack Health Score</h2>
        <span
          className="px-3 py-1 rounded-full text-white text-xs font-semibold"
          style={{ backgroundColor: color }}
        >
          {label}
        </span>
      </div>

      <div className="flex items-center gap-5 mb-6">
        <div className="text-5xl font-extrabold leading-none min-w-[120px]" style={{ color }}>
          {averageScore}
          <span className="text-xl font-normal text-gray-400"> / 100</span>
        </div>
        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${averageScore}%`, backgroundColor: color }}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <Stat value={contentTypeHealth.length.toString()} label="content types" />
        <Divider />
        <Stat value={totalEntries.toLocaleString()} label="entries" />
        <Divider />
        <Stat value={totalIssues.toLocaleString()} label="issues" />
        <Divider />
        <Stat value={criticalCount.toString()} label="critical" className="text-red-500" />
        <Divider />
        <Stat value={warningCount.toString()} label="warnings" className="text-yellow-500" />
      </div>

      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <span className="px-2 py-1 bg-orange-50 text-orange-600 rounded text-[11px] font-semibold">
          {emptyCTs} empty content types
        </span>
        <span className="px-2 py-1 bg-red-50 text-red-500 rounded text-[11px] font-semibold">
          {ctWithIssues} content types with issues
        </span>
      </div>
    </div>
  );
};

const Stat: React.FC<{ value: string; label: string; className?: string }> = ({
  value,
  label,
  className = "",
}) => (
  <div className="flex flex-col items-center flex-1">
    <span className={`text-xl font-bold ${className}`}>{value}</span>
    <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
  </div>
);

const Divider = () => <div className="w-px h-8 bg-gray-200" />;

export default HealthScoreCard;
