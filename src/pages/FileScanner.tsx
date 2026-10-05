import { useCallback, useRef, useState } from "react";
import { FileSearch, UploadCloud, ScanLine, Info, AlertTriangle } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ScanSteps from "../components/ScanSteps";
import ResultPanel from "../components/ResultPanel";
import { scanFile, formatSize } from "../lib/engines/fileEngine";
import { saveToHistory } from "../lib/history";
import type { ScanResult, ScanStepDef } from "../lib/types";

const STEPS: ScanStepDef[] = [
  { label: "Reading file metadata", sub: "name · size · type" },
  { label: "Evaluating extension risk", sub: "executable & macro tiers" },
  { label: "Detecting disguise tricks", sub: "double-extension · RTL override" },
  { label: "Heuristic deep scan", sub: "local structural analysis" },
];

interface PickedFile {
  name: string;
  size: number;
}

export default function FileScanner() {
  const [file, setFile] = useState<PickedFile | null>(null);
  const [drag, setDrag] = useState(false);
  const [phase, setPhase] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  /* Only the File object's name & size metadata are read — no FileReader,
     no upload, no content access. Works in every modern browser. */
  const pick = useCallback((f: File) => {
    setFile({ name: f.name, size: f.size });
    setResult(null);
    setError("");
    setPhase("idle");
  }, []);

  const begin = useCallback(() => {
    if (!file) return;
    setResult(null);
    setError("");
    setPhase("scanning");
  }, [file]);

  /* The scan itself — fully wrapped so nothing can fail silently. */
  const finish = useCallback(() => {
    try {
      if (!file) throw new Error("No file is selected. Drop a file or click the drop zone first.");
      const r = scanFile(file.name, file.size);
      if (!r) throw new Error("The engine returned no result.");
      saveToHistory(r);
      setResult(r);
      setError("");
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The file scan failed unexpectedly. Please try again.");
      setPhase("error");
    }
  }, [file]);

  return (
    <div>
      <PageHeader
        title="File Scanner"
        sub="Extension, structure & metadata heuristics"
        right={
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#8296b3] px-2.5 py-1 rounded-full border border-[#8296b333] bg-[#8296b30d]">
            <FileSearch size={11} /> local engine
          </span>
        }
      />

      <div className="panel p-5 sm:p-6 mb-6">
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files?.[0];
            if (f) pick(f);
          }}
          onClick={() => inputRef.current?.click()}
          className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 sm:p-10 text-center transition-all duration-300 ${
            drag
              ? "border-[#7fbf9f] bg-[#7fbf9f0d] scale-[1.01]"
              : "border-[#3f3d47] hover:border-[#7fbf9f66] hover:bg-[#28272e]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pick(f);
              e.target.value = "";
            }}
          />
          <UploadCloud
            size={34}
            className={`mx-auto mb-3 transition-colors ${drag ? "text-[#7fbf9f]" : "text-[#6f6c7a]"}`}
            strokeWidth={1.4}
          />
          <div className="display text-[15px] font-semibold text-white">
            {file ? file.name : "Drop a file here or click to browse"}
          </div>
          <div className="mono text-[11px] text-[#9b97a4] mt-1">
            {file ? formatSize(file.size) : "PDF, APK, EXE, DOCX, XLSX, ZIP, and more."}
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] text-[#7fbf9f] bg-[#7fbf9f0d] border border-[#7fbf9f33] rounded-full px-3 py-1">
            <Info size={10} /> Files are never uploaded — only name & size are inspected.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button
            onClick={begin}
            disabled={!file || phase === "scanning"}
            className="px-6 py-2.5 rounded-lg bg-[#7fbf9f] text-[#1b1a1f] display font-bold text-[13px] tracking-wide hover:shadow-[0_0_28px_-6px_#7fbf9f] transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2"
          >
            <ScanLine size={15} /> {phase === "scanning" ? "Scanning…" : "Scan File"}
          </button>
          <span className="font-mono text-[10px] text-[#6f6c7a]">
            Heuristic engine — not a live antivirus.
          </span>
        </div>
      </div>

      {phase === "scanning" && <ScanSteps steps={STEPS} onDone={finish} />}

      {phase === "error" && (
        <div className="panel p-6 border-[#cf667944] panel-glow-red text-center anim-pop">
          <AlertTriangle size={26} className="mx-auto text-[#cf6679]" />
          <div className="display text-[15px] font-semibold text-white mt-2">Scan failed</div>
          <p className="text-[12.5px] text-[#b5b1bc] mt-1 max-w-md mx-auto">{error}</p>
          <button
            onClick={begin}
            disabled={!file}
            className="mt-4 px-5 py-2 rounded-lg border border-[#34323b] text-[12px] text-[#b5b1bc] hover:text-[#7fbf9f] hover:border-[#7fbf9f44] transition-colors disabled:opacity-40"
          >
            Retry scan
          </button>
        </div>
      )}

      {phase === "done" && result && (
        <>
          <ResultPanel result={result} saved />
          <div className="mt-4 flex items-start gap-2.5 p-4 rounded-xl border border-[#34323b] bg-[#232228] text-[11.5px] text-[#9b97a4] leading-relaxed">
            <Info size={14} className="text-[#d9a05b] shrink-0 mt-0.5" />
            A real AV engine call (ClamAV/YARA server-side) would run here. See “How It Works” for the documented Phase-2 integration point.
          </div>
        </>
      )}
    </div>
  );
}
