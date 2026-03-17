import { useCallback, useState } from "react";
import { cmaFetch } from "./useCmaApi";
import {
  ContentTypeInfo,
  EntryHealth,
  HealthIssue,
  Severity,
  StackHealth,
} from "../types";

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

function auditEntry(
  entry: any,
  contentType: ContentTypeInfo
): HealthIssue[] {
  const issues: HealthIssue[] = [];
  const schema = contentType.schema || [];

  for (const field of schema) {
    const value = entry[field.uid];

    // Missing required fields
    if (field.mandatory && (value === undefined || value === null || value === "")) {
      issues.push({
        type: "missing_required",
        message: `Required field "${field.display_name || field.uid}" is empty`,
        severity: Severity.CRITICAL,
        field: field.uid,
      });
    }

    // Broken references
    if (field.data_type === "reference" && value) {
      const refs = Array.isArray(value) ? value : [value];
      for (const ref of refs) {
        if (ref && (!ref.uid || ref._content_type_uid === undefined)) {
          issues.push({
            type: "broken_reference",
            message: `Broken reference in "${field.display_name || field.uid}"`,
            severity: Severity.CRITICAL,
            field: field.uid,
          });
        }
      }
    }

    // Empty select fields
    if (
      (field.data_type === "text" && field.enum) &&
      (value === undefined || value === null || value === "")
    ) {
      issues.push({
        type: "empty_select",
        message: `Select field "${field.display_name || field.uid}" is empty`,
        severity: Severity.WARNING,
        field: field.uid,
      });
    }

    // Missing assets
    if (field.data_type === "file" && field.mandatory && !value) {
      issues.push({
        type: "missing_asset",
        message: `Asset field "${field.display_name || field.uid}" is empty`,
        severity: Severity.CRITICAL,
        field: field.uid,
      });
    }
  }

  // Stale content check
  const updatedAt = new Date(entry.updated_at).getTime();
  if (Date.now() - updatedAt > SIX_MONTHS_MS) {
    issues.push({
      type: "stale_content",
      message: `Not updated since ${new Date(entry.updated_at).toLocaleDateString()}`,
      severity: Severity.WARNING,
    });
  }

  return issues;
}

function calculateScore(issues: HealthIssue[]): number {
  let score = 100;
  for (const issue of issues) {
    score -= issue.severity === Severity.CRITICAL ? 25 : 10;
  }
  return Math.max(0, score);
}

export const useHealthAudit = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: "" });
  const [stackHealth, setStackHealth] = useState<StackHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    setProgress({ current: 0, total: 0, phase: "Fetching content types..." });

    try {
      // 1. Fetch all content types via direct CMA
      const ctData = await cmaFetch<{ content_types: any[] }>("/content_types", {
        include_count: "true",
      });

      const contentTypes: ContentTypeInfo[] = (ctData.content_types || []).map((ct: any) => ({
        uid: ct.uid,
        title: ct.title,
        schema: ct.schema || [],
      }));

      setProgress({ current: 0, total: contentTypes.length, phase: "Auditing entries..." });

      const allEntries: EntryHealth[] = [];
      let totalIssues = 0;
      let criticalCount = 0;
      let warningCount = 0;

      // 2. For each content type, fetch all entries with pagination
      for (let i = 0; i < contentTypes.length; i++) {
        const ct = contentTypes[i];
        setProgress({ current: i + 1, total: contentTypes.length, phase: `Auditing ${ct.title}...` });

        try {
          let entries: any[] = [];
          let skip = 0;
          const limit = 100;

          while (true) {
            const entryData = await cmaFetch<{ entries: any[] }>(
              `/content_types/${ct.uid}/entries`,
              { include_count: "true", limit: String(limit), skip: String(skip) }
            );

            const batch = entryData.entries || [];
            entries = entries.concat(batch);

            if (batch.length < limit) break;
            skip += limit;
          }

          for (const entry of entries) {
            const issues = auditEntry(entry, ct);
            const score = calculateScore(issues);

            const criticals = issues.filter((i) => i.severity === Severity.CRITICAL).length;
            const warnings = issues.filter((i) => i.severity === Severity.WARNING).length;

            totalIssues += issues.length;
            criticalCount += criticals;
            warningCount += warnings;

            allEntries.push({
              uid: entry.uid,
              title: entry.title || "Untitled",
              contentType: ct.title,
              contentTypeUid: ct.uid,
              score,
              issues,
              lastUpdated: entry.updated_at,
              locale: entry.locale || "en-us",
              reviewed: false,
            });
          }
        } catch (err) {
          console.warn(`[Pulse] Failed to fetch entries for ${ct.title}:`, err);
        }
      }

      // Sort by score ascending (worst first)
      allEntries.sort((a, b) => a.score - b.score);

      const averageScore =
        allEntries.length > 0
          ? Math.round(allEntries.reduce((sum, e) => sum + e.score, 0) / allEntries.length)
          : 100;

      const result: StackHealth = {
        totalEntries: allEntries.length,
        totalIssues,
        criticalCount,
        warningCount,
        averageScore,
        entries: allEntries,
        contentTypes,
      };

      setStackHealth(result);
      setProgress({ current: contentTypes.length, total: contentTypes.length, phase: "Done!" });
    } catch (err: any) {
      setError(err.message || "Failed to run audit");
      console.error("[Pulse] Audit failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { runAudit, loading, progress, stackHealth, error, setStackHealth };
};
