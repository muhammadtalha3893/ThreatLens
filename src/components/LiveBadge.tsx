import { Zap } from "lucide-react";

export default function LiveBadge({ text = "Live probe — real public API request" }: { text?: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-[#8296b333] bg-[#8296b30d]">
      <div className="w-8 h-8 rounded-lg bg-[#8296b31f] border border-[#8296b344] flex items-center justify-center shrink-0">
        <Zap size={15} className="text-[#a3b1cc]" />
      </div>
      <div>
        <div className="text-[13px] font-semibold text-[#b9c3d9]">{text}</div>
        <div className="text-[11px] text-[#9b97a4] mt-0.5 leading-relaxed">
          Passive and read-only — requests run directly in your browser against public APIs.
        </div>
      </div>
    </div>
  );
}
