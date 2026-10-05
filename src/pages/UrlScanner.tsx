import { useCallback, useState } from "react";
import { Link2, ScanLine, FlaskConical, ShieldCheck, AlertTriangle } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ScanSteps from "../components/ScanSteps";
import ResultPanel from "../components/ResultPanel";
import { scanUrl, URL_SAMPLE_PHISH, URL_SAMPLE_SAFE } from "../lib/engines/urlEngine";
import { saveToHistory } from "../lib/history";
import type { ScanResult, ScanStepDef } from "../lib/types";

const STEPS: ScanStepDef[] = [
  { label: "Parsing URL structure", sub: "scheme · host · path" },
  { label: "Inspecting domain & TLD", sub: "reputation heuristics" },
  { label: "Matching phishing signals", sub: "brand & keyword tells" },
  { label: "Scoring & classifying", sub: "weighted risk model" },
];

export default function UrlScanner() {
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");

  const start = useCallback((target: string) => {
    const t = target.trim();
    if (!t) return;
    setInput(t);
    setResult(null);
    setError("");
    setPhase("scanning");
  }, []);

  /* The scan itself — fully wrapped so nothing can fail silently. */
  const finish = useCallback(() => {
    try {
      if (!input.trim()) throw new Error("No URL was provided.");
      const r = scanUrl(input);
      if (!r) throw new Error("The engine returned no result.");
      saveToHistory(r);
      setResult(r);
      setError("");
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The URL scan failed unexpectedly. Please try again.");
      setPhase("error");
    }
  }, [input]);

  return (
    <div>
      <PageHeader
        title="URL / Website Scanner"
        sub="Structural phishing & abuse heuristics"
        right={
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#8296b3] px-2.5 py-1 rounded-full border border-[#8296b333] bg-[#8296b30d]">
            <Link2 size={11} /> local engine
          </span>
        }
      />

      <div className="panel p-5 sm:p-6 mb-6">
        <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9b97a4] block mb-2">
          Target URL
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && start(input)}
            placeholder="https://example.com/path…"
            spellCheck={false}
            className="flex-1 bg-[#201f24] border border-[#34323b] rounded-lg px-4 py-3 mono text-[13px] text-[#e9e7ec] placeholder:text-[#6f6c7a] outline-none focus:border-[#82c7d466] focus:shadow-[0_0_20px_-8px_rgba(130,199,212,0.5)] transition-all"
          />
          <button
            onClick={() => start(input)}
            disabled={!input.trim() || phase === "scanning"}
            className="px-6 py-3 rounded-lg bg-[#82c7d4] text-[#1b1a1f] display font-bold text-[13px] tracking-wide hover:shadow-[0_0_28px_-6px_#82c7d4] transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            <ScanLine size={15} /> Scan URL
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={() => start(URL_SAMPLE_PHISH)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#cf667933] text-[11px] text-[#d98a96] hover:bg-[#cf66790d] transition-colors"
          >
            <FlaskConical size={12} /> Try phishing sample
          </button>
          <button
            onClick={() => start(URL_SAMPLE_SAFE)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#7fbf9f33] text-[11px] text-[#7fbf9f] hover:bg-[#7fbf9f0d] transition-colors"
          >
            <ShieldCheck size={12} /> Try safe sample
          </button>
        </div>
      </div>

      {phase === "scanning" && <ScanSteps steps={STEPS} onDone={finish} />}

      {phase === "error" && (
        <div className="panel p-6 border-[#cf667944] panel-glow-red text-center anim-pop">
          <AlertTriangle size={26} className="mx-auto text-[#cf6679]" />
          <div className="display text-[15px] font-semibold text-white mt-2">Scan failed</div>
          <p className="text-[12.5px] text-[#b5b1bc] mt-1 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => start(input)}
            className="mt-4 px-5 py-2 rounded-lg border border-[#34323b] text-[12px] text-[#b5b1bc] hover:text-[#82c7d4] hover:border-[#82c7d444] transition-colors"
          >
            Retry scan
          </button>
        </div>
      )}

      {phase === "done" && result && <ResultPanel result={result} saved />}
    </div>
  );
}
