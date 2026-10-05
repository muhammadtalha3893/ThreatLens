import { Info, Link2, FileSearch, Globe2, Network, ShieldCheck, Layers, Crosshair } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { STAGES, LAYERS, stageInterception } from "../lib/engines/shared";

const integrations = [
  { icon: Link2, label: "URL reputation", value: "urlscan.io, Google Safe Browsing, VirusTotal URL API" },
  { icon: FileSearch, label: "File contents", value: "Server-side ClamAV + YARA rules, VirusTotal file hash lookup" },
  { icon: Globe2, label: "Hosting / IP reputation", value: "AbuseIPDB, Shodan" },
  { icon: Network, label: "Service / vuln probing", value: "Nmap/Nikto-style scanners (server-side only)" },
];

export default function About() {
  return (
    <div>
      <PageHeader title="How ThreatLens Works" sub="Honesty about capability & limits" />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="panel p-6">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={17} className="text-[#7fbf9f]" />
            <h2 className="display text-[16px] font-semibold text-white">Phase 1 — what ships today</h2>
          </div>
          <p className="text-[13px] text-[#b5b1bc] leading-relaxed">
            ThreatLens Phase 1 ships a genuine heuristic engine that runs entirely in your browser.
            It scores risk from observable structure: URL patterns, file extensions and metadata,
            and phishing language patterns. These are real, deterministic rules — not random numbers.
          </p>
          <p className="text-[13px] text-[#b5b1bc] leading-relaxed mt-3">
            What a browser-only app cannot do: real antivirus scanning of file contents, live
            vulnerability/port scanning, or threat-intelligence lookups. Those require server-side
            engines and APIs.
          </p>
        </div>

        <div className="panel p-6">
          <div className="flex items-center gap-2 mb-3">
            <Network size={17} className="text-[#8296b3]" />
            <h2 className="display text-[16px] font-semibold text-white">
              Phase 2 — Backend integration points <span className="font-mono text-[10px] text-[#9b97a4]">(documented, not shipped)</span>
            </h2>
          </div>
          <div className="space-y-2.5">
            {integrations.map((x) => (
              <div key={x.label} className="flex gap-3 p-3 rounded-xl border border-[#34323b] bg-[#232228]">
                <x.icon size={15} className="text-[#8296b3] shrink-0 mt-0.5" />
                <div>
                  <div className="text-[12.5px] font-semibold text-[#e9e7ec]">{x.label}</div>
                  <div className="text-[11.5px] text-[#9b97a4] mt-0.5">{x.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel p-5 mb-6 flex items-start gap-3 border-[#7fbf9f33] bg-[#7fbf9f06]">
        <Info size={16} className="text-[#7fbf9f] shrink-0 mt-0.5" />
        <p className="text-[12.5px] text-[#abd4c0] leading-relaxed">
          Every result is labeled <span className="font-semibold">“Local Heuristic Engine”</span> so a verdict
          is never misrepresented as a live antivirus or threat-intel database.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="panel p-6">
          <div className="flex items-center gap-2 mb-4">
            <Crosshair size={16} className="text-[#cf6679]" />
            <h2 className="display text-[15px] font-semibold text-white">Kill-Chain Mapping</h2>
          </div>
          <div className="space-y-2">
            {STAGES.map((s, i) => (
              <div key={s.id} className="flex gap-3 items-start p-2.5 rounded-lg hover:bg-[#28272e] transition-colors">
                <span className="mono text-[10px] text-[#cf6679] mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <div className="text-[12.5px] font-medium text-[#e9e7ec]">{s.label}</div>
                  <div className="text-[10.5px] text-[#9b97a4] mt-0.5 leading-relaxed">{stageInterception[s.id]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={16} className="text-[#82c7d4]" />
            <h2 className="display text-[15px] font-semibold text-white">4-Layer Risk Model</h2>
          </div>
          <p className="text-[12px] text-[#9b97a4] leading-relaxed mb-4">
            Every finding maps to one or more defense layers, so each result tells you not just
            what is wrong, but where to intervene.
          </p>
          <div className="space-y-2.5">
            {LAYERS.map((l, i) => (
              <div
                key={l.id}
                className="p-3.5 rounded-xl border border-[#34323b] bg-[#232228] flex items-center gap-3"
                style={{ animation: `reveal-up 0.35s ${i * 0.07}s both` }}
              >
                <span
                  className="w-7 h-7 rounded-lg border border-[#82c7d433] bg-[#82c7d40a] flex items-center justify-center mono text-[11px] text-[#82c7d4]"
                >
                  L{i + 1}
                </span>
                <span className="text-[13px] text-[#e9e7ec]">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
