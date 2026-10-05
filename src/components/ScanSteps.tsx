import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import type { ScanStepDef } from "../lib/types";

const STEP_MS = 620;

export default function ScanSteps({ steps, onDone }: { steps: ScanStepDef[]; onDone: () => void }) {
  const [active, setActive] = useState(0);

  /* Keep the latest callback in a ref so parent re-renders can never reset
     the step timers (an unstable onDone identity would otherwise restart
     the effect and the scan would never complete). */
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (active >= steps.length) {
      const t = setTimeout(() => {
        try {
          doneRef.current();
        } catch {
          /* the page-level try/catch owns error reporting */
        }
      }, 350);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setActive((a) => a + 1), STEP_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, steps.length]);

  const pct = Math.min(100, (active / steps.length) * 100);

  return (
    <div className="panel relative overflow-hidden scanline p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#82c7d4] anim-flicker">
          Scanning…
        </span>
        <span className="font-mono text-[11px] text-[#9b97a4]">{Math.round(pct)}%</span>
      </div>

      <div className="h-1 rounded-full bg-[#34323b] overflow-hidden mb-5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#82c7d4] to-[#8296b3] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="space-y-3">
        {steps.map((s, i) => {
          const state = i < active ? "done" : i === active ? "active" : "pending";
          return (
            <div
              key={s.label}
              className={`flex items-center gap-3 transition-opacity duration-300 ${
                state === "pending" ? "opacity-35" : "opacity-100"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border shrink-0 ${
                  state === "done"
                    ? "border-[#7fbf9f] bg-[#7fbf9f1a] text-[#7fbf9f]"
                    : state === "active"
                    ? "border-[#82c7d4] text-[#82c7d4]"
                    : "border-[#3f3d47] text-[#6f6c7a]"
                }`}
                style={state === "active" ? { animation: "node-pulse 1.4s ease-in-out infinite" } : undefined}
              >
                {state === "done" ? (
                  <Check size={13} strokeWidth={2.5} />
                ) : state === "active" ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                )}
              </div>
              <div className="min-w-0">
                <div className={`text-[13px] font-medium ${state === "active" ? "text-white" : "text-[#e9e7ec]"}`}>
                  {s.label}
                </div>
                <div className="font-mono text-[10px] text-[#6f6c7a] truncate">{s.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
