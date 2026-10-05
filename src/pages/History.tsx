import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { History as HistoryIcon, Trash2, Link2, MessageSquareText, FileSearch, ChevronDown, ScanLine } from "lucide-react";
import PageHeader from "../components/PageHeader";
import VerdictBadge from "../components/VerdictBadge";
import { loadHistory, clearHistory } from "../lib/history";
import { useI18n } from "../lib/i18n";
import type { ScanResult } from "../lib/types";
import { severityColor } from "../lib/types";

const toolIcon = { url: Link2, text: MessageSquareText, file: FileSearch };
const toolLabel = { url: "URL", text: "Text", file: "File" };

export default function History() {
  const { t } = useI18n();
  const [items, setItems] = useState<ScanResult[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setItems(loadHistory());
    refresh();
    window.addEventListener("tl-history", refresh);
    return () => window.removeEventListener("tl-history", refresh);
  }, []);

  return (
    <div>
      <PageHeader
        title={t("nav.history")}
        sub="Every scan logged with verdict and score — stored only in your browser"
        right={
          items.length > 0 ? (
            <button
              onClick={() => clearHistory()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#cf667933] text-[12px] font-medium text-[#d98a96] hover:bg-[#cf66790d] transition-colors active:scale-95"
            >
              <Trash2 size={13} /> {t("common.clear")}
            </button>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <div className="panel p-10 text-center">
          <HistoryIcon size={30} className="mx-auto text-[#6f6c7a]" strokeWidth={1.5} />
          <div className="display text-[16px] font-semibold text-white mt-3">No history yet.</div>
          <p className="text-[12.5px] text-[#9b97a4] mt-1 mb-5">Run any scan and it will be logged here automatically.</p>
          <Link
            to="/url"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#82c7d4] text-[#1b1a1f] display font-bold text-[13px] hover:shadow-[0_0_28px_-6px_#82c7d4] transition-all"
          >
            <ScanLine size={14} /> Start a scan
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((h, i) => {
            const Icon = toolIcon[h.tool];
            const open = openId === h.id;
            return (
              <div
                key={h.id}
                className={`panel overflow-hidden transition-all ${open ? "panel-glow-cyan" : "hover:border-[#3f3d47]"}`}
                style={{ animation: `reveal-up 0.3s ${Math.min(i, 10) * 0.04}s both` }}
              >
                <button
                  onClick={() => setOpenId(open ? null : h.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <div className="w-8 h-8 rounded-lg border border-[#34323b] bg-[#232228] flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-[#9b97a4]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mono text-[12px] text-[#e9e7ec] truncate">{h.input}</div>
                    <div className="font-mono text-[9.5px] text-[#6f6c7a] mt-0.5">
                      {toolLabel[h.tool]} · {new Date(h.ts).toLocaleString()} · {h.category}
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <span className="mono text-[12px] font-bold" style={{ color: severityColor[h.findings[0]?.severity ?? "info"] }}>
                      {h.score}
                    </span>
                  </div>
                  <VerdictBadge verdict={h.verdict} />
                  <ChevronDown size={15} className={`text-[#6f6c7a] transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <div className="px-4 pb-4 anim-reveal">
                    {h.findings.length === 0 ? (
                      <p className="text-[12px] text-[#7fbf9f]">No suspicious signals detected.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {h.findings.map((f) => (
                          <div key={f.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#232228] border border-[#2c2b32]">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: severityColor[f.severity] }} />
                            <span className="text-[12px] text-[#e9e7ec] flex-1">{f.title}</span>
                            <span className="font-mono text-[9px] uppercase" style={{ color: severityColor[f.severity] }}>{f.severity}</span>
                            {f.weight > 0 && <span className="font-mono text-[10px] text-[#9b97a4]">+{f.weight}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
