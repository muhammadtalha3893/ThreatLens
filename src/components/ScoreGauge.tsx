import { useEffect, useState } from "react";
import { verdictColor } from "../lib/types";
import type { Verdict } from "../lib/types";

export default function ScoreGauge({ score, verdict }: { score: number; verdict: Verdict }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const dur = 1100;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(score * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const color = verdictColor[verdict];
  const R = 54;
  const C = 2 * Math.PI * R;
  const arc = C * 0.75;
  const filled = arc * (shown / 100);

  return (
    <div className="relative w-[150px] h-[150px]">
      <svg viewBox="0 0 140 140" className="w-full h-full -rotate-[225deg]">
        <circle
          cx="70" cy="70" r={R} fill="none" stroke="#34323b" strokeWidth="10"
          strokeDasharray={`${arc} ${C}`} strokeLinecap="round"
        />
        <circle
          cx="70" cy="70" r={R} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${filled} ${C}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}88)`, transition: "stroke 0.4s" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="display text-4xl font-bold" style={{ color, textShadow: `0 0 20px ${color}66` }}>
          {shown}
        </div>
        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#9b97a4] mt-1">risk score</div>
      </div>
    </div>
  );
}
