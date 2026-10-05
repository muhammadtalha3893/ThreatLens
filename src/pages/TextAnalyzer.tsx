import { useCallback, useState } from "react";
import { MessageSquareText, ScanLine, FlaskConical, ShieldCheck, AlertTriangle } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ScanSteps from "../components/ScanSteps";
import ResultPanel from "../components/ResultPanel";
import { scanText, TEXT_SAMPLE_PHISH, TEXT_SAMPLE_SAFE } from "../lib/engines/textEngine";
import { saveToHistory } from "../lib/history";
import type { ScanResult, ScanStepDef } from "../lib/types";

const STEPS: ScanStepDef[] = [
  { label: "Tokenizing content", sub: "language & links" },
  { label: "Matching manipulation patterns", sub: "urgency · lures · threats" },
  { label: "Checking sender & links", sub: "spoofing & mismatch" },
  { label: "Classifying & scoring", sub: "social-engineering model" },
];

export default function TextAnalyzer() {
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
      if (!input.trim()) throw new Error("No text was provided.");
      const r = scanText(input);
      if (!r) throw new Error("The engine returned no result.");
      saveToHistory(r);
      setResult(r);
      setError("");
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The text analysis failed unexpectedly. Please try again.");
      setPhase("error");
    }
  }, [input]);

  return (
    <div>
      <PageHeader
        title="Email / SMS / Text Analyzer"
        sub="Phishing, smishing, vishing & baiting patterns"
        right={
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#8296b3] px-2.5 py-1 rounded-full border border-[#8296b333] bg-[#8296b30d]">
            <MessageSquareText size={11} /> local engine
          </span>
        }
      />

      <div className="panel p-5 sm:p-6 mb-6">
        <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9b97a4] block mb-2">
          Message content
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={7}
          placeholder="Paste the suspicious email, SMS or chat message here…"
          spellCheck={false}
          className="w-full bg-[#201f24] border border-[#34323b] rounded-lg px-4 py-3 mono text-[12.5px] text-[#e9e7ec] placeholder:text-[#6f6c7a] outline-none focus:border-[#8296b366] focus:shadow-[0_0_20px_-8px_rgba(130,150,179,0.5)] transition-all resize-y thin-scroll"
        />
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button
            onClick={() => start(input)}
            disabled={!input.trim() || phase === "scanning"}
            className="px-6 py-2.5 rounded-lg bg-[#8296b3] text-white display font-bold text-[13px] tracking-wide hover:shadow-[0_0_28px_-6px_#8296b3] transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2"
          >
            <ScanLine size={15} /> Analyze Text
          </button>
          <button
            onClick={() => start(TEXT_SAMPLE_PHISH)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#cf667933] text-[11px] text-[#d98a96] hover:bg-[#cf66790d] transition-colors"
          >
            <FlaskConical size={12} /> Try phishing sample
          </button>
          <button
            onClick={() => start(TEXT_SAMPLE_SAFE)}
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
          <div className="display text-[15px] font-semibold text-white mt-2">Analysis failed</div>
          <p className="text-[12.5px] text-[#b5b1bc] mt-1 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => start(input)}
            className="mt-4 px-5 py-2 rounded-lg border border-[#34323b] text-[12px] text-[#b5b1bc] hover:text-[#8296b3] hover:border-[#8296b344] transition-colors"
          >
            Retry analysis
          </button>
        </div>
      )}

      {phase === "done" && result && <ResultPanel result={result} saved />}
    </div>
  );
}
