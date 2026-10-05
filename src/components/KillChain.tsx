import { STAGES, stageInterception, activeStages } from "../lib/engines/shared";
import type { ScanResult } from "../lib/types";
import { ShieldCheck } from "lucide-react";

export default function KillChain({ result }: { result: ScanResult }) {
  const touched = new Set(activeStages(result));

  return (
    <div>
      <p className="text-[12px] text-[#9b97a4] mb-4">
        Stages this artifact touches, and where it is typically intercepted.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {STAGES.map((stage, i) => {
          const active = touched.has(stage.id);
          return (
            <div
              key={stage.id}
              className={`relative p-3.5 rounded-xl border transition-all duration-300 ${
                active
                  ? "border-[#cf667955] bg-[#cf66790d] panel-glow-red"
                  : "border-[#34323b] bg-[#232228] opacity-70"
              }`}
              style={active ? { animation: `reveal-up 0.4s ${i * 0.07}s both` } : undefined}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6f6c7a]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {active ? (
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#cf6679] anim-breathe">
                    ● active
                  </span>
                ) : (
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#6f6c7a]">
                    not reached
                  </span>
                )}
              </div>
              <div className={`display text-[13px] font-semibold ${active ? "text-white" : "text-[#b5b1bc]"}`}>
                {stage.label}
              </div>
              <div className="text-[10.5px] leading-relaxed mt-1.5 text-[#9b97a4]">
                {active ? (
                  <>
                    <span className="text-[#d9a05b] font-medium">Typical interception point: </span>
                    {stageInterception[stage.id]}
                  </>
                ) : (
                  <span className="flex items-center gap-1 text-[#6f6c7a]">
                    <ShieldCheck size={11} /> No signals mapped to this stage.
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
