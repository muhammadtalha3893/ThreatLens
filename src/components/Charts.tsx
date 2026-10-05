import { severityColor, type ScanResult, type Severity } from "../lib/types";

export default function Charts({ result }: { result: ScanResult }) {
  const weighted = result.findings.filter((f) => f.weight > 0);
  const maxW = Math.max(1, ...weighted.map((f) => f.weight));

  const sevOrder: Severity[] = ["critical", "high", "medium", "low", "info"];
  const counts = sevOrder
    .map((s) => ({ sev: s, n: result.findings.filter((f) => f.severity === s).length }))
    .filter((c) => c.n > 0);
  const total = Math.max(1, counts.reduce((s, c) => s + c.n, 0));

  const R = 40;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* risk composition */}
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9b97a4] mb-3">
          Risk Composition
        </div>
        {weighted.length === 0 ? (
          <p className="text-[12px] text-[#6f6c7a]">No weighted signals — nothing to compose.</p>
        ) : (
          <div className="space-y-2.5">
            {weighted.map((f, i) => (
              <div key={f.id}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#e9e7ec] truncate pr-2">{f.title}</span>
                  <span className="mono text-[#9b97a4]">+{f.weight}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#34323b] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(f.weight / maxW) * 100}%`,
                      background: `linear-gradient(90deg, ${severityColor[f.severity]}66, ${severityColor[f.severity]})`,
                      animation: `bar-grow 0.8s ${i * 0.08}s cubic-bezier(0.2,0.8,0.3,1) both`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* severity donut */}
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9b97a4] mb-3">
          Findings by Severity
        </div>
        {counts.length === 0 ? (
          <p className="text-[12px] text-[#6f6c7a]">Zero findings.</p>
        ) : (
          <div className="flex items-center gap-6">
            <svg viewBox="0 0 100 100" className="w-32 h-32 -rotate-90 shrink-0">
              <circle cx="50" cy="50" r={R} fill="none" stroke="#34323b" strokeWidth="12" />
              {counts.map((c) => {
                const frac = c.n / total;
                const dash = frac * C;
                const el = (
                  <circle
                    key={c.sev}
                    cx="50" cy="50" r={R} fill="none"
                    stroke={severityColor[c.sev]}
                    strokeWidth="12"
                    strokeDasharray={`${dash} ${C - dash}`}
                    strokeDashoffset={-offset}
                    style={{ transition: "stroke-dasharray 0.6s" }}
                  />
                );
                offset += dash;
                return el;
              })}
            </svg>
            <div className="space-y-1.5">
              {counts.map((c) => (
                <div key={c.sev} className="flex items-center gap-2 text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: severityColor[c.sev] }} />
                  <span className="capitalize text-[#e9e7ec]">{c.sev}</span>
                  <span className="mono text-[#9b97a4]">×{c.n}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
