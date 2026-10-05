import type { Finding, LayerId, ScanResult, StageId, Verdict } from "../types";
import { scoreToVerdict } from "../types";

/* ------------------------------------------------------------------ */
/* Shared heuristic infrastructure for the URL / text / file engines.  */
/* All rules are deterministic, local, and transparent.                */
/* ------------------------------------------------------------------ */

export const STAGES: { id: StageId; label: string }[] = [
  { id: "reconnaissance", label: "Reconnaissance" },
  { id: "delivery", label: "Delivery" },
  { id: "exploitation", label: "Exploitation" },
  { id: "installation", label: "Installation" },
  { id: "command", label: "Command & Control" },
  { id: "actions", label: "Actions on Objective" },
];

export const LAYERS: { id: LayerId; label: string }[] = [
  { id: "network", label: "Network Layer" },
  { id: "application", label: "Application Layer" },
  { id: "content", label: "Content / Social Layer" },
  { id: "human", label: "Human Factor Layer" },
];

export const stageInterception: Record<StageId, string> = {
  reconnaissance: "Email filters & domain monitoring typically catch probing here.",
  delivery: "Secure email gateways, URL rewriting and user awareness intercept most lures.",
  exploitation: "Browser isolation, patching and sandboxing stop payload execution.",
  installation: "Endpoint protection and macro controls block persistence attempts.",
  command: "Network detection (EDR/NDR) and egress filtering sever C2 channels.",
  actions: "Least privilege, MFA and DLP limit damage at the objective.",
};

export const layerMitigation: Record<LayerId, { safe: string; risk: string }> = {
  network: {
    safe: "Transport signals look normal. Still verify HTTPS and the exact domain before trusting.",
    risk: "Do not submit data. Verify the certificate, avoid the link, and reach the site via a bookmark or typed domain.",
  },
  application: {
    safe: "File/script risk is low. Keep software patched and only run trusted executables.",
    risk: "Do not open or execute. Scan with a real AV, disable macros, and confirm the sender out-of-band.",
  },
  content: {
    safe: "No strong manipulation language detected. Stay alert for unexpected requests.",
    risk: "Treat requests for credentials or actions as hostile. Verify through an official channel you already trust.",
  },
  human: {
    safe: "Low pressure/urgency cues. Continue with normal caution.",
    risk: "Urgency and authority pressure are manipulation tactics. Slow down and independently verify before acting.",
  },
};

export function finalize(
  tool: "url" | "text" | "file",
  input: string,
  findings: Finding[],
  categoryFor: (verdict: Verdict, findings: Finding[]) => string
): ScanResult {
  const score = Math.min(100, findings.reduce((s, f) => s + f.weight, 0));
  const verdict = scoreToVerdict(score);
  return {
    id: `${tool}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tool,
    input,
    score,
    verdict,
    category: categoryFor(verdict, findings),
    findings: findings.sort((a, b) => b.weight - a.weight),
    ts: Date.now(),
  };
}

export function activeStages(result: ScanResult): StageId[] {
  const set = new Set<StageId>();
  result.findings.forEach((f) => f.stages.forEach((s) => set.add(s)));
  return [...set];
}

export function activeLayers(result: ScanResult): LayerId[] {
  const set = new Set<LayerId>();
  result.findings.forEach((f) => {
    if (f.weight > 0) f.layers.forEach((l) => set.add(l));
  });
  return [...set];
}
