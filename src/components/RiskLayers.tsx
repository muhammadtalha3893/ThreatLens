import { LAYERS, layerMitigation, activeLayers } from "../lib/engines/shared";
import type { ScanResult } from "../lib/types";
import { Wifi, AppWindow, MessagesSquare, UserRound, ShieldAlert, ShieldCheck } from "lucide-react";

const ICONS = { network: Wifi, application: AppWindow, content: MessagesSquare, human: UserRound };

export default function RiskLayers({ result }: { result: ScanResult }) {
  const risky = new Set(activeLayers(result));

  return (
    <div>
      <p className="text-[12px] text-[#9b97a4] mb-4">4-Layer Risk Model</p>
      <div className="space-y-3">
        {LAYERS.map((layer, i) => {
          const isRisk = risky.has(layer.id);
          const Icon = ICONS[layer.id];
          const mit = layerMitigation[layer.id];
          return (
            <div
              key={layer.id}
              className={`flex gap-3.5 p-4 rounded-xl border transition-all ${
                isRisk
                  ? "border-[#d9a05b44] bg-[#d9a05b0a]"
                  : "border-[#7fbf9f33] bg-[#7fbf9f08]"
              }`}
              style={{ animation: `reveal-up 0.4s ${i * 0.08}s both` }}
            >
              <div
                className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                  isRisk ? "border-[#d9a05b55] text-[#d9a05b] bg-[#d9a05b12]" : "border-[#7fbf9f44] text-[#7fbf9f] bg-[#7fbf9f10]"
                }`}
                style={isRisk ? { animation: "node-pulse 2s ease-in-out infinite" } : undefined}
              >
                <Icon size={16} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="display text-[13px] font-semibold text-white">{layer.label}</span>
                  {isRisk ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-[#d9a05b]">
                      <ShieldAlert size={10} /> risk signals
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-[#7fbf9f]">
                      <ShieldCheck size={10} /> clear
                    </span>
                  )}
                </div>
                <p className="text-[11.5px] text-[#b5b1bc] leading-relaxed mt-1">
                  {isRisk ? mit.risk : mit.safe}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
