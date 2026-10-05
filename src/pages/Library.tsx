import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronDown, GraduationCap, Skull, Bug, Wifi, KeyRound, MessagesSquare } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { THREATS, THREAT_CATEGORIES, type ThreatCategory } from "../lib/data/threats";

const catIcon: Record<ThreatCategory, typeof Skull> = {
  "Social Engineering": MessagesSquare,
  Malware: Bug,
  Network: Wifi,
  Identity: KeyRound,
};

const catColor: Record<ThreatCategory, string> = {
  "Social Engineering": "#8296b3",
  Malware: "#cf6679",
  Network: "#82c7d4",
  Identity: "#d9a05b",
};

export default function Library() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<"All" | ThreatCategory>("All");
  const [openId, setOpenId] = useState<string | null>(THREATS[0].id);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return THREATS.filter(
      (t) =>
        (cat === "All" || t.category === cat) &&
        (!q || t.name.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q) || t.aka.toLowerCase().includes(q))
    );
  }, [query, cat]);

  return (
    <div>
      <PageHeader
        title="Threat Library"
        sub="Reference cards for common attack techniques"
        right={
          <Link
            to="/quiz"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#8296b344] bg-[#8296b30d] text-[12px] font-medium text-[#a3b1cc] hover:bg-[#8296b31a] transition-colors"
          >
            <GraduationCap size={14} /> Take the Quiz
          </Link>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6f6c7a]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search threats…"
            className="w-full bg-[#201f24] border border-[#34323b] rounded-lg pl-10 pr-4 py-2.5 text-[13px] text-[#e9e7ec] placeholder:text-[#6f6c7a] outline-none focus:border-[#82c7d466] transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {THREAT_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-lg text-[11.5px] font-medium border transition-all ${
                cat === c
                  ? "bg-[#82c7d414] border-[#82c7d43d] text-[#82c7d4]"
                  : "border-[#34323b] text-[#9b97a4] hover:text-[#e9e7ec] hover:border-[#3f3d47]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="panel p-8 text-center text-[13px] text-[#6f6c7a]">No threats match that search.</div>
        )}
        {filtered.map((t, i) => {
          const Icon = catIcon[t.category];
          const color = catColor[t.category];
          const open = openId === t.id;
          return (
            <div
              key={t.id}
              className={`panel overflow-hidden transition-all duration-300 ${open ? "panel-glow-cyan" : "hover:border-[#3f3d47]"}`}
              style={{ animation: `reveal-up 0.35s ${Math.min(i, 8) * 0.05}s both` }}
            >
              <button
                onClick={() => setOpenId(open ? null : t.id)}
                className="w-full flex items-center gap-3.5 p-4 sm:p-5 text-left"
              >
                <div
                  className="w-10 h-10 rounded-lg border flex items-center justify-center shrink-0"
                  style={{ borderColor: `${color}44`, background: `${color}0d`, color }}
                >
                  <Icon size={17} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="display text-[15px] font-semibold text-white">{t.name}</span>
                    <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border" style={{ color, borderColor: `${color}33`, background: `${color}0a` }}>
                      {t.category}
                    </span>
                  </div>
                  <div className="text-[11.5px] text-[#9b97a4] mt-0.5 truncate">{t.definition}</div>
                </div>
                <ChevronDown size={17} className={`text-[#6f6c7a] transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
              </button>

              {open && (
                <div className="px-4 sm:px-5 pb-5 grid md:grid-cols-2 gap-4 anim-reveal">
                  <div className="space-y-4">
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6f6c7a] mb-1.5">Definition</div>
                      <p className="text-[12.5px] text-[#e9e7ec] leading-relaxed">{t.definition}</p>
                      <div className="font-mono text-[10px] text-[#6f6c7a] mt-1.5">aka: {t.aka}</div>
                    </div>
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6f6c7a] mb-1.5">Real-world pattern</div>
                      <p className="text-[12.5px] text-[#b5b1bc] leading-relaxed border-l-2 pl-3" style={{ borderColor: color }}>
                        {t.pattern}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6f6c7a] mb-1.5">Warning signs</div>
                      <ul className="space-y-1.5">
                        {t.signs.map((s) => (
                          <li key={s} className="flex gap-2 text-[12px] text-[#e9e7ec] leading-relaxed">
                            <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: color }} />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6f6c7a] mb-1.5">Prevention</div>
                      <ul className="space-y-1.5">
                        {t.prevention.map((p) => (
                          <li key={p} className="flex gap-2 text-[12px] text-[#7fbf9f] leading-relaxed">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-[#7fbf9f] shrink-0" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
