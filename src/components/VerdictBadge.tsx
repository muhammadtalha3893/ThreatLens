import { verdictColor, verdictLabel } from "../lib/types";
import type { Verdict } from "../lib/types";

export default function VerdictBadge({ verdict, label }: { verdict: Verdict; label?: string }) {
  const color = verdictColor[verdict];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] uppercase tracking-wider border"
      style={{ color, borderColor: `${color}44`, background: `${color}12` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      {label ?? verdictLabel[verdict]}
    </span>
  );
}
