export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type Verdict = "safe" | "suspicious" | "malicious";
export type ToolId = "url" | "text" | "file";

export type LayerId = "network" | "application" | "content" | "human";
export type StageId =
  | "reconnaissance"
  | "delivery"
  | "exploitation"
  | "installation"
  | "command"
  | "actions";

export interface Finding {
  id: string;
  title: string;
  detail: string;
  severity: Severity;
  weight: number;
  layers: LayerId[];
  stages: StageId[];
  suggestion?: string;
}

export interface ScanResult {
  id: string;
  tool: ToolId;
  input: string;
  score: number;
  verdict: Verdict;
  category: string;
  findings: Finding[];
  ts: number;
}

export interface ScanStepDef {
  label: string;
  sub: string;
}

export const severityRank: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

export const severityColor: Record<Severity, string> = {
  critical: "#cf6679",
  high: "#d98a96",
  medium: "#d9a05b",
  low: "#82c7d4",
  info: "#9b97a4",
};

export const verdictColor: Record<Verdict, string> = {
  safe: "#7fbf9f",
  suspicious: "#d9a05b",
  malicious: "#cf6679",
};

export const verdictLabel: Record<Verdict, string> = {
  safe: "Safe",
  suspicious: "Suspicious",
  malicious: "Malicious",
};

export function scoreToVerdict(score: number): Verdict {
  if (score >= 60) return "malicious";
  if (score >= 25) return "suspicious";
  return "safe";
}
