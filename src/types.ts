export interface KeyValueObj {
  [key: string]: string;
}

export enum Severity {
  CRITICAL = "critical",
  WARNING = "warning",
}

export interface HealthIssue {
  type: string;
  message: string;
  severity: Severity;
  field?: string;
}

export interface EntryHealth {
  uid: string;
  title: string;
  contentType: string;
  contentTypeUid: string;
  score: number;
  issues: HealthIssue[];
  lastUpdated: string;
  locale: string;
  reviewed: boolean;
}

export interface StackHealth {
  totalEntries: number;
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  averageScore: number;
  entries: EntryHealth[];
  contentTypes: ContentTypeInfo[];
  contentTypeHealth: ContentTypeHealth[];
}

export interface ContentTypeHealth {
  uid: string;
  title: string;
  entryCount: number;
  issues: HealthIssue[];
  score: number;
}

export interface ContentTypeInfo {
  uid: string;
  title: string;
  schema: any[];
}

export interface GeminiInsight {
  summary: string;
  priorities: string[];
  recommendations: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  command?: string;
  safe?: boolean;
  timestamp: number;
}
