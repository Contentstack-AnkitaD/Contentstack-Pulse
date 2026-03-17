import { useCallback, useState } from "react";
import { cmaFetch } from "./useCmaApi";
import {
  ContentTypeHealth,
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

/** Audit a content type schema for structural issues */
function auditContentType(
  ct: any,
  globalFieldUids: Set<string>
): HealthIssue[] {
  const issues: HealthIssue[] = [];
  const schema = ct.schema || [];

  // Check for references to missing global fields
  for (const field of schema) {
    if (field.data_type === "global_field" && !globalFieldUids.has(field.reference_to)) {
      issues.push({
        type: "missing_global_field",
        message: `References deleted global field "${field.reference_to}"`,
        severity: Severity.CRITICAL,
        field: field.uid,
      });
    }

    // Check for groups/blocks with no fields
    if (field.data_type === "group" && (!field.schema || field.schema.length === 0)) {
      issues.push({
        type: "empty_group",
        message: `Group field "${field.display_name || field.uid}" has no sub-fields`,
        severity: Severity.WARNING,
        field: field.uid,
      });
    }

    // Check modular blocks with no blocks defined
    if (field.data_type === "blocks" && (!field.blocks || field.blocks.length === 0)) {
      issues.push({
        type: "empty_modular_blocks",
        message: `Modular Blocks "${field.display_name || field.uid}" has no blocks defined`,
        severity: Severity.WARNING,
        field: field.uid,
      });
    }
  }

  // No fields besides title
  if (schema.length <= 1) {
    issues.push({
      type: "minimal_schema",
      message: "Content type has no custom fields (only title)",
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
      // 1. Fetch all content types (paginated)
      let allRawCts: any[] = [];
      let ctSkip = 0;
      while (true) {
        const ctData = await cmaFetch<{ content_types: any[]; count?: number }>("/content_types", {
          include_count: "true",
          limit: "100",
          skip: String(ctSkip),
        });
        allRawCts = allRawCts.concat(ctData.content_types || []);
        if ((ctData.content_types || []).length < 100) break;
        ctSkip += 100;
      }

      const contentTypes: ContentTypeInfo[] = allRawCts.map((ct: any) => ({
        uid: ct.uid,
        title: ct.title,
        schema: ct.schema || [],
      }));

      // 2. Fetch global fields to detect missing references
      setProgress({ current: 0, total: contentTypes.length, phase: "Fetching global fields..." });
      let globalFieldUids = new Set<string>();
      try {
        const gfData = await cmaFetch<{ global_fields: any[] }>("/global_fields", {
          include_count: "true",
        });
        for (const gf of gfData.global_fields || []) {
          globalFieldUids.add(gf.uid);
        }
      } catch (err) {
        console.warn("[Pulse] Could not fetch global fields:", err);
      }

      // 3. Audit content type schemas + fetch entries
      const allEntries: EntryHealth[] = [];
      const ctHealthList: ContentTypeHealth[] = [];
      let totalIssues = 0;
      let criticalCount = 0;
      let warningCount = 0;

      for (let i = 0; i < contentTypes.length; i++) {
        const ct = contentTypes[i];
        const rawCt = allRawCts[i];
        setProgress({ current: i + 1, total: contentTypes.length, phase: `Auditing ${ct.title}...` });

        // CT-level audit
        const ctIssues = auditContentType(rawCt, globalFieldUids);

        // Fetch entries for this CT
        let entryCount = 0;
        try {
          let entries: any[] = [];
          let skip = 0;
          const limit = 100;

          while (true) {
            const entryData = await cmaFetch<{ entries: any[]; count?: number }>(
              `/content_types/${ct.uid}/entries`,
              { include_count: "true", limit: String(limit), skip: String(skip) }
            );

            const batch = entryData.entries || [];
            entries = entries.concat(batch);

            if (batch.length < limit) break;
            skip += limit;
          }

          entryCount = entries.length;

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

        // Empty CT check
        if (entryCount === 0) {
          ctIssues.push({
            type: "empty_content_type",
            message: "No entries found — consider removing if unused",
            severity: Severity.WARNING,
          });
        }

        // Count CT-level issues toward totals
        const ctCriticals = ctIssues.filter((i) => i.severity === Severity.CRITICAL).length;
        const ctWarnings = ctIssues.filter((i) => i.severity === Severity.WARNING).length;
        totalIssues += ctIssues.length;
        criticalCount += ctCriticals;
        warningCount += ctWarnings;

        ctHealthList.push({
          uid: ct.uid,
          title: ct.title,
          entryCount,
          issues: ctIssues,
          score: calculateScore(ctIssues),
        });
      }

      // Sort entries by score ascending (worst first)
      allEntries.sort((a, b) => a.score - b.score);
      // Sort CT health by score ascending
      ctHealthList.sort((a, b) => a.score - b.score);

      // Average score combines entry + CT health
      const allScores = [
        ...allEntries.map((e) => e.score),
        ...ctHealthList.map((c) => c.score),
      ];
      const averageScore =
        allScores.length > 0
          ? Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length)
          : 100;

      const result: StackHealth = {
        totalEntries: allEntries.length,
        totalIssues,
        criticalCount,
        warningCount,
        averageScore,
        entries: allEntries,
        contentTypes,
        contentTypeHealth: ctHealthList,
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
