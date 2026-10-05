import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ListChecks, BarChart3, Layers, Crosshair, LifeBuoy,
  ImageDown, FileDown, Save, ShieldCheck,
} from "lucide-react";
import type { ScanResult } from "../lib/types";
import { severityColor, verdictColor } from "../lib/types";
import ScoreGauge from "./ScoreGauge";
import VerdictBadge from "./VerdictBadge";
import Charts from "./Charts";
import RiskLayers from "./RiskLayers";
import KillChain from "./KillChain";

type Tab = "findings" | "charts" | "layers" | "killchain" | "suggestions";

const TABS: { id: Tab; label: string; icon: typeof ListChecks }[] = [
  { id: "findings", label: "Findings", icon: ListChecks },
  { id: "charts", label: "Charts", icon: BarChart3 },
  { id: "layers", label: "Risk Layers", icon: Layers },
  { id: "killchain", label: "Kill-Chain", icon: Crosshair },
  { id: "suggestions", label: "What To Do", icon: LifeBuoy },
];

function exportPng(result: ScanResult) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const vc = verdictColor[result.verdict];

  ctx.fillStyle = "#1b1a1f";
  ctx.fillRect(0, 0, 1200, 720);
  // grid
  ctx.strokeStyle = "rgba(130,199,212,0.05)";
  ctx.lineWidth = 1;
  for (let x = 0; x < 1200; x += 44) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 720); ctx.stroke();
  }
  for (let y = 0; y < 720; y += 44) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke();
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px 'Chakra Petch', sans-serif";
  ctx.fillText("ThreatLens — Scan Report", 48, 72);

  ctx.fillStyle = "#9b97a4";
  ctx.font = "14px 'JetBrains Mono', monospace";
  ctx.fillText(new Date(result.ts).toLocaleString(), 48, 100);
  ctx.fillText(`TOOL: ${result.tool.toUpperCase()}   CATEGORY: ${result.category.toUpperCase()}`, 48, 124);

  // input
  ctx.fillStyle = "#e9e7ec";
  ctx.font = "15px 'Inter', sans-serif";
  const input = result.input.length > 110 ? result.input.slice(0, 110) + "…" : result.input;
  ctx.fillText(`Target: ${input}`, 48, 160);

  // score block
  ctx.fillStyle = vc;
  ctx.font = "bold 88px 'Chakra Petch', sans-serif";
  ctx.fillText(String(result.score), 48, 280);
  ctx.font = "13px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#9b97a4";
  ctx.fillText("RISK SCORE / 100", 48, 306);

  ctx.fillStyle = vc;
  ctx.font = "bold 26px 'Chakra Petch', sans-serif";
  ctx.fillText(`${result.verdict.toUpperCase()} — ${result.category}`, 48, 352);

  // findings
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px 'Chakra Petch', sans-serif";
  ctx.fillText("Triggered Signals", 48, 410);

  ctx.font = "14px 'Inter', sans-serif";
  const rows = result.findings.slice(0, 8);
  if (rows.length === 0) {
    ctx.fillStyle = "#7fbf9f";
    ctx.fillText("No suspicious signals detected.", 48, 444);
  } else {
    rows.forEach((f, i) => {
      const y = 444 + i * 30;
      ctx.fillStyle = severityColor[f.severity];
      ctx.fillRect(48, y - 12, 8, 8);
      ctx.fillStyle = "#e9e7ec";
      ctx.fillText(`${f.title}  (+${f.weight})`, 68, y - 3);
      ctx.fillStyle = "#6f6c7a";
      ctx.font = "12px 'JetBrains Mono', monospace";
      ctx.fillText(f.severity.toUpperCase(), 1050, y - 3);
      ctx.font = "14px 'Inter', sans-serif";
    });
  }

  ctx.fillStyle = "#6f6c7a";
  ctx.font = "11px 'JetBrains Mono', monospace";
  ctx.fillText(
    "Local Heuristic Engine — educational tool, not a live antivirus. threatlens",
    48,
    690
  );

  const a = document.createElement("a");
  a.download = `threatlens-${result.tool}-${result.score}.png`;
  a.href = canvas.toDataURL("image/png");
  a.click();
}

export default function ResultPanel({ result, saved }: { result: ScanResult; saved: boolean }) {
  const [tab, setTab] = useState<Tab>("findings");
  const printRef = useRef<HTMLDivElement>(null);
  const vc = verdictColor[result.verdict];

  const suggestions = result.findings.filter((f) => f.suggestion);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      id="print-area"
      className={`panel p-5 sm:p-6 ${
        result.verdict === "malicious"
          ? "panel-glow-red"
          : result.verdict === "suspicious"
          ? ""
          : "panel-glow-mint"
      }`}
    >
      {/* header row */}
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        <ScoreGauge score={result.score} verdict={result.verdict} />
        <div className="flex-1 min-w-0 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
            <VerdictBadge verdict={result.verdict} />
            <span className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#34323b] text-[#9b97a4]">
              {result.category}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#8296b333] text-[#a3b1cc] bg-[#8296b30d]">
              Local Heuristic Engine
            </span>
          </div>
          <div className="mono text-[12px] text-[#b5b1bc] break-all leading-relaxed bg-[#201f24] border border-[#2c2b32] rounded-lg px-3 py-2">
            {result.input}
          </div>
          <div className="mt-2 font-mono text-[10px] text-[#6f6c7a]">
            {result.findings.filter((f) => f.weight > 0).length} triggered signals ·{" "}
            {new Date(result.ts).toLocaleTimeString()}
            {saved && (
              <span className="ml-2 inline-flex items-center gap-1 text-[#7fbf9f]">
                <Save size={10} /> Saved to history
              </span>
            )}
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="flex flex-wrap gap-1.5 mt-6 mb-5 print:hidden">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                tab === t.id
                  ? "bg-[#82c7d414] border-[#82c7d43d] text-[#82c7d4]"
                  : "border-[#34323b] text-[#9b97a4] hover:text-[#e9e7ec] hover:border-[#3f3d47]"
              }`}
            >
              <Icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* tab body */}
      <div className="min-h-[220px]">
        {tab === "findings" && (
          <div className="space-y-2.5">
            {result.findings.length === 0 ? (
              <div className="flex items-center gap-3 p-5 rounded-xl border border-[#7fbf9f33] bg-[#7fbf9f08] text-[#7fbf9f]">
                <ShieldCheck size={20} />
                <span className="text-[13px]">No suspicious signals detected.</span>
              </div>
            ) : (
              result.findings.map((f, i) => (
                <div
                  key={f.id}
                  className="flex gap-3 p-3.5 rounded-xl border border-[#34323b] bg-[#232228] hover:border-[#3f3d47] transition-colors"
                  style={{ animation: `reveal-up 0.35s ${i * 0.05}s both` }}
                >
                  <span
                    className="mt-1 w-2 h-2 rounded-full shrink-0"
                    style={{ background: severityColor[f.severity], boxShadow: `0 0 8px ${severityColor[f.severity]}` }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-semibold text-white">{f.title}</span>
                      <span
                        className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{ color: severityColor[f.severity], background: `${severityColor[f.severity]}14` }}
                      >
                        {f.severity}
                      </span>
                      {f.weight > 0 && (
                        <span className="font-mono text-[10px] text-[#9b97a4]">+{f.weight}</span>
                      )}
                    </div>
                    <p className="text-[12px] text-[#b5b1bc] leading-relaxed mt-0.5">{f.detail}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "charts" && <Charts result={result} />}
        {tab === "layers" && <RiskLayers result={result} />}
        {tab === "killchain" && <KillChain result={result} />}

        {tab === "suggestions" && (
          <div className="space-y-2.5">
            {suggestions.length === 0 ? (
              <div className="flex items-center gap-3 p-5 rounded-xl border border-[#7fbf9f33] bg-[#7fbf9f08] text-[#7fbf9f] text-[13px]">
                <ShieldCheck size={18} />
                No strong risk signals fired. Stay alert for anything unexpected and verify sensitive requests independently.
              </div>
            ) : (
              suggestions.map((f, i) => (
                <div
                  key={f.id}
                  className="flex gap-3 p-3.5 rounded-xl border border-[#82c7d422] bg-[#82c7d406]"
                  style={{ animation: `reveal-up 0.35s ${i * 0.06}s both` }}
                >
                  <LifeBuoy size={16} className="text-[#82c7d4] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[12px] font-semibold text-[#82c7d4]">{f.title}</div>
                    <p className="text-[12px] text-[#e9e7ec] leading-relaxed mt-0.5">{f.suggestion}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* export actions */}
      <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-[#2c2b32] print:hidden">
        <button
          onClick={() => exportPng(result)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#34323b] text-[12px] font-medium text-[#b5b1bc] hover:text-[#82c7d4] hover:border-[#82c7d444] hover:bg-[#82c7d40a] transition-all active:scale-95"
        >
          <ImageDown size={14} /> Export PNG
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#34323b] text-[12px] font-medium text-[#b5b1bc] hover:text-[#8296b3] hover:border-[#8296b344] hover:bg-[#8296b30a] transition-all active:scale-95"
        >
          <FileDown size={14} /> Export PDF
        </button>
        <span className="ml-auto font-mono text-[10px] text-[#6f6c7a] self-center" style={{ color: vc }}>
          verdict: {result.verdict.toUpperCase()}
        </span>
      </div>
    </motion.div>
  );
}
