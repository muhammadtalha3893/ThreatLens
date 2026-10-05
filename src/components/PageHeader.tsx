import type { ReactNode } from "react";

export default function PageHeader({ title, sub, right }: { title: string; sub: string; right?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="display text-2xl sm:text-[28px] font-bold text-white tracking-wide anim-flicker">
          {title}
        </h1>
        <p className="text-[13px] text-[#9b97a4] mt-1">{sub}</p>
      </div>
      {right}
    </div>
  );
}
