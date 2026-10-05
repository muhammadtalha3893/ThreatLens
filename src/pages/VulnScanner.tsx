import { useCallback, useState } from "react";
import {
  ShieldAlert, ScanLine, Loader2, CheckCircle2, XCircle, ExternalLink,
  FileCheck2, Cookie, Shuffle, Lock, Link2, Tag, Puzzle, EyeOff, Frame, Shield,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import LiveBadge from "../components/LiveBadge";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";

interface ObservatoryScan {
  id: number;
  details_url: string;
  algorithm_version: number;
  scanned_at: string;
  error: string | null;
  grade: string | null;
  score: number;
  status_code: number;
  tests_failed: number;
  tests_passed: number;
  tests_quantity: number;
}

const gradeColor = (grade: string | null): string => {
  if (!grade) return "#9b97a4";
  if (grade.startsWith("A")) return "#7fbf9f";
  if (grade.startsWith("B")) return "#93c48f";
  if (grade.startsWith("C")) return "#d9a05b";
  if (grade.startsWith("D")) return "#cf8a5e";
  return "#cf6679";
};

/** What the Observatory's 10 tests audit — static reference. */
const TEST_REFERENCE = [
  { icon: Frame, name: "Content-Security-Policy", desc: "Contains XSS and injection by restricting script sources." },
  { icon: Cookie, name: "Cookies", desc: "Secure, HttpOnly and SameSite flags on every session cookie." },
  { icon: Puzzle, name: "Cross-Origin Resource Sharing", desc: "Restricts which origins may read responses." },
  { icon: Lock, name: "HTTP Strict Transport Security", desc: "Pins browsers to HTTPS so downgrade attacks fail." },
  { icon: Shuffle, name: "Redirection", desc: "HTTP requests upgrade to HTTPS before serving content." },
  { icon: Tag, name: "Referrer Policy", desc: "Limits how much URL data leaks to third parties." },
  { icon: FileCheck2, name: "Subresource Integrity", desc: "Hashes external scripts so CDNs can't inject code." },
  { icon: EyeOff, name: "X-Content-Type-Options", desc: "Stops MIME-sniffing of uploaded or remote content." },
  { icon: Shield, name: "X-Frame-Options", desc: "Blocks clickjacking by refusing to be framed." },
  { icon: Link2, name: "X-XSS-Protection (legacy)", desc: "Older browser XSS filter — deprecated but still scored." },
];

export default function VulnScanner() {
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<"idle" | "probing" | "done" | "error">("idle");
  const [scan, setScan] = useState<ObservatoryScan | null>(null);
  const [host, setHost] = useState("");
  const [error, setError] = useState("");

  const run = useCallback(async (target: string) => {
    const t = target.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
    if (!t) return;
    setInput(t);
    setHost(t);
    setPhase("probing");
    setScan(null);
    setError("");
    try {
      const res = await fetchWithTimeout(
        `https://observatory-api.mdn.mozilla.net/api/v2/scan?host=${encodeURIComponent(t)}`,
        20000,
        { method: "POST" }
      );
      if (!res.ok) throw new Error(`Observatory responded ${res.status}`);
      const data = (await res.json()) as ObservatoryScan;
      if (data.error) throw new Error(data.error);
      setScan(data);
      setPhase("done");
    } catch (e) {
      setError(
        e instanceof Error && e.name === "AbortError"
          ? "The scan timed out — the target may be slow or unreachable."
          : e instanceof Error
          ? e.message
          : "Scan failed"
      );
      setPhase("error");
    }
  }, []);

  const color = scan ? gradeColor(scan.grade) : "#9b97a4";

  return (
    <div>
      <PageHeader
        title="Vulnerability Scanner"
        sub="Live HTTP security-header & TLS posture audit"
        right={
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#7fbf9f] px-2.5 py-1 rounded-full border border-[#7fbf9f33] bg-[#7fbf9f0a]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7fbf9f] anim-breathe" /> live probe
          </span>
        }
      />

      <div className="space-y-4 mb-6">
        <LiveBadge text="Live audit — powered by Mozilla Observatory" />
        <div className="panel p-5 sm:p-6">
          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9b97a4] block mb-2">
            Target host
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run(input)}
              placeholder="example.com"
              spellCheck={false}
              className="flex-1 bg-[#201f24] border border-[#34323b] rounded-lg px-4 py-3 mono text-[13px] text-[#e9e7ec] placeholder:text-[#6f6c7a] outline-none focus:border-[#7fbf9f66] focus:shadow-[0_0_20px_-8px_rgba(127,191,159,0.5)] transition-all"
            />
            <button
              onClick={() => run(input)}
              disabled={!input.trim() || phase === "probing"}
              className="px-6 py-3 rounded-lg bg-[#7fbf9f] text-[#1b1a1f] display font-bold text-[13px] tracking-wide hover:shadow-[0_0_28px_-6px_#7fbf9f] transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {phase === "probing" ? <Loader2 size={15} className="animate-spin" /> : <ScanLine size={15} />}
              {phase === "probing" ? "Auditing…" : "Audit Headers"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {["github.com", "example.com", "vercel.com"].map((s) => (
              <button
                key={s}
                onClick={() => run(s)}
                className="px-3 py-1.5 rounded-lg border border-[#34323b] mono text-[11px] text-[#9b97a4] hover:text-[#7fbf9f] hover:border-[#7fbf9f44] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {phase === "probing" && (
        <div className="panel relative overflow-hidden scanline p-8 text-center">
          <ShieldAlert size={26} className="mx-auto text-[#7fbf9f] anim-breathe" />
          <div className="font-mono text-[12px] text-[#7fbf9f] mt-3 tracking-wider">
            RUNNING 10-POINT POSTURE SCAN…
          </div>
          <div className="font-mono text-[10px] text-[#6f6c7a] mt-1">Mozilla Observatory · read-only · no payloads</div>
        </div>
      )}

      {phase === "error" && (
        <div className="panel p-6 border-[#cf667944] panel-glow-red text-center">
          <XCircle size={26} className="mx-auto text-[#cf6679]" />
          <div className="display text-[15px] font-semibold text-white mt-2">Scan failed</div>
          <p className="text-[12px] text-[#9b97a4] mt-1">{error}</p>
          <button
            onClick={() => run(host)}
            className="mt-4 px-5 py-2 rounded-lg border border-[#34323b] text-[12px] text-[#b5b1bc] hover:text-[#7fbf9f] hover:border-[#7fbf9f44] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {phase === "done" && scan && (
        <div className="space-y-4 anim-pop">
          {/* grade card */}
          <div className="panel p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-6">
            <div
              className="w-24 h-24 rounded-2xl border-2 flex items-center justify-center display text-5xl font-bold shrink-0"
              style={{ borderColor: color, color, textShadow: `0 0 24px ${color}66`, background: `${color}0a` }}
            >
              {scan.grade ?? "—"}
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="mono text-[14px] text-[#82c7d4] break-all">{host}</div>
              <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                <span className="font-mono text-[10px] px-2.5 py-1 rounded-full border border-[#34323b] text-[#9b97a4]">
                  HTTP {scan.status_code}
                </span>
                <span className="font-mono text-[10px] px-2.5 py-1 rounded-full border border-[#7fbf9f33] text-[#7fbf9f]">
                  score {scan.score}/100
                </span>
                <span className="font-mono text-[10px] px-2.5 py-1 rounded-full border border-[#7fbf9f33] text-[#7fbf9f]">
                  {scan.tests_passed} passed
                </span>
                <span className="font-mono text-[10px] px-2.5 py-1 rounded-full border border-[#cf667933] text-[#d98a96]">
                  {scan.tests_failed} failed
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-3 justify-center sm:justify-start">
                <div className="flex-1 min-w-[160px] max-w-xs h-2 rounded-full bg-[#34323b] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#cf6679] via-[#d9a05b] to-[#7fbf9f]"
                    style={{ width: `${scan.score}%`, animation: "bar-grow 0.9s both" }}
                  />
                </div>
                <a
                  href={scan.details_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#9b97a4] hover:text-[#7fbf9f] transition-colors"
                >
                  Full report <ExternalLink size={11} />
                </a>
              </div>
              <p className="font-mono text-[9.5px] text-[#6f6c7a] mt-2">
                scanned {new Date(scan.scanned_at).toLocaleString()} · algorithm v{scan.algorithm_version}
              </p>
            </div>
          </div>

          {/* verdict line */}
          <div
            className={`flex items-center gap-3 p-4 rounded-xl border ${
              scan.tests_failed === 0
                ? "border-[#7fbf9f33] bg-[#7fbf9f08]"
                : "border-[#d9a05b33] bg-[#d9a05b08]"
            }`}
          >
            {scan.tests_failed === 0 ? (
              <CheckCircle2 size={17} className="text-[#7fbf9f] shrink-0" />
            ) : (
              <ShieldAlert size={17} className="text-[#d9a05b] shrink-0" />
            )}
            <p className="text-[12.5px] leading-relaxed text-[#e9e7ec]">
              {scan.tests_failed === 0
                ? "Every posture check passed — this host's security headers are fully hardened."
                : `${scan.tests_failed} of ${scan.tests_quantity} posture checks failed. Review the audit areas below and open the full report for per-header detail.`}
            </p>
          </div>

          {/* audit reference */}
          <div className="panel p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9b97a4] mb-4">
              What the scan audits — 10-point model
            </div>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {TEST_REFERENCE.map((t, i) => (
                <div
                  key={t.name}
                  className="flex gap-3 p-3.5 rounded-xl border border-[#34323b] bg-[#232228] hover:border-[#3f3d47] transition-colors"
                  style={{ animation: `reveal-up 0.35s ${i * 0.05}s both` }}
                >
                  <t.icon size={16} className="text-[#82c7d4] shrink-0 mt-0.5" strokeWidth={1.8} />
                  <div>
                    <div className="text-[12.5px] font-semibold text-[#e9e7ec]">{t.name}</div>
                    <div className="text-[11px] text-[#9b97a4] mt-0.5 leading-relaxed">{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
