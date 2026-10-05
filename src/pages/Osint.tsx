import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Fingerprint, Search, Loader2, ExternalLink, ShieldAlert, UserCheck,
  UserX, HelpCircle, Satellite, Globe2, FlaskConical, BadgeCheck, LogIn, X,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import LiveBadge from "../components/LiveBadge";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import {
  clientHunt, simulateHunt, MANUAL_CHECKS,
  type ProbeResult, type HuntMode,
} from "../lib/data/osint";

const MODE_LABEL: Record<HuntMode, { text: string; icon: typeof Satellite }> = {
  server: { text: "full sweep — ~85 platforms, server-side", icon: Satellite },
  client: { text: "quick sweep — public APIs in your browser", icon: Globe2 },
  simulated: { text: "offline simulation — live checks unreachable", icon: FlaskConical },
};

export default function Osint() {
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<"idle" | "hunting" | "done">("idle");
  const [results, setResults] = useState<ProbeResult[]>([]);
  const [mode, setMode] = useState<HuntMode>("client");
  const [upgradePending, setUpgradePending] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [tab, setTab] = useState<"found" | "all" | "categories">("found");
  const [selected, setSelected] = useState<ProbeResult | null>(null);
  const timerRef = useRef<number | null>(null);
  const huntIdRef = useRef(0);

  /* Close the profile viewer with Escape. */
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  useEffect(() => {
    if (phase === "hunting") {
      const start = Date.now();
      timerRef.current = window.setInterval(() => setElapsed((Date.now() - start) / 1000), 100);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [phase]);

  const hunt = useCallback(async (username: string) => {
    const u = username.trim().replace(/^@/, "");
    if (!u || !/^[a-zA-Z0-9._-]{2,40}$/.test(u)) return;
    const huntId = ++huntIdRef.current;

    setInput(u);
    setPhase("hunting");
    setResults([]);
    setSelected(null);
    setElapsed(0);
    setUpgradePending(true);

    /* ---- Tier A: full server-side sweep (starts immediately, capped) ---- */
    const serverPromise = (async (): Promise<ProbeResult[] | null> => {
      try {
        const res = await fetchWithTimeout(`/api/hunt?user=${encodeURIComponent(u)}`, 20000);
        if (!res.ok) return null;
        const data = (await res.json()) as { ok?: boolean; results?: ProbeResult[] };
        return data.ok && Array.isArray(data.results) && data.results.length > 0 ? data.results : null;
      } catch {
        return null;
      }
    })();

    /* ---- Tier B: fast browser-side checks — shown as soon as ready ---- */
    const { results: live, liveChecks } = await clientHunt(u);
    if (huntIdRef.current !== huntId) return;

    if (liveChecks > 0) {
      setResults(live);
      setMode("client");
    } else {
      setResults(simulateHunt(u));
      setMode("simulated");
    }
    setPhase("done");
    setTab("found");

    /* ---- Upgrade in place when the full server sweep arrives ---- */
    const serverResults = await serverPromise;
    if (huntIdRef.current !== huntId) return;
    setUpgradePending(false);
    if (serverResults) {
      setResults(serverResults);
      setMode("server");
    }
  }, []);

  const found = results.filter((r) => r.status === "found");
  const categories = [...new Set(results.map((r) => r.category))];
  const ModeIcon = MODE_LABEL[mode].icon;

  return (
    <div>
      <PageHeader
        title="OSINT Sherlock"
        sub="Find where a username exists across the internet"
        right={
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#7fbf9f] px-2.5 py-1 rounded-full border border-[#7fbf9f33] bg-[#7fbf9f0a]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7fbf9f] anim-breathe" /> live hunt
          </span>
        }
      />

      <div className="space-y-4 mb-6">
        <div className="flex items-start gap-3 p-4 rounded-xl border border-[#d9a05b33] bg-[#d9a05b0a]">
          <ShieldAlert size={17} className="text-[#d9a05b] shrink-0 mt-0.5" />
          <div>
            <div className="text-[13px] font-semibold text-[#ddc28f]">Ethical-use only — public data</div>
            <p className="text-[11.5px] text-[#b5b1bc] leading-relaxed mt-0.5">
              This checks whether a PUBLIC profile exists for a username across many platforms, in real time.
              It reveals only what is already publicly visible. Use it for your own accounts or with
              authorization — never for stalking or harassment.
            </p>
          </div>
        </div>

        <div className="panel p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6f6c7a]" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && hunt(input)}
                placeholder="username (e.g. torvalds)"
                spellCheck={false}
                className="w-full bg-[#201f24] border border-[#34323b] rounded-lg pl-10 pr-4 py-3 mono text-[13px] text-[#e9e7ec] placeholder:text-[#6f6c7a] outline-none focus:border-[#8296b366] focus:shadow-[0_0_20px_-8px_rgba(130,150,179,0.5)] transition-all"
              />
            </div>
            <button
              onClick={() => hunt(input)}
              disabled={phase === "hunting" || !input.trim()}
              className="px-7 py-3 rounded-lg bg-[#8296b3] text-white display font-bold text-[13px] tracking-wide hover:shadow-[0_0_28px_-6px_#8296b3] transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {phase === "hunting" ? <Loader2 size={15} className="animate-spin" /> : <Fingerprint size={15} />}
              Hunt
            </button>
          </div>
          <div className="font-mono text-[10px] text-[#6f6c7a] mt-2">
            quick results in ~2s · full ~90-platform sweep merges in automatically · click any found platform to view its verified profile data
          </div>
        </div>
      </div>

      {phase === "hunting" && (
        <div className="panel relative overflow-hidden scanline p-8 text-center">
          <Fingerprint size={28} className="mx-auto text-[#8296b3] anim-breathe" />
          <div className="font-mono text-[12px] text-[#a3b1cc] mt-3 tracking-wider">
            HUNTING “{input}” ACROSS THE WEB…
          </div>
          <div className="font-mono text-[11px] text-[#6f6c7a] mt-1">
            {elapsed.toFixed(1)}s elapsed · quick results appear first
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="anim-pop space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#7fbf9f33] bg-[#7fbf9f0a]">
              <UserCheck size={15} className="text-[#7fbf9f]" />
              <span className="display text-lg font-bold text-[#7fbf9f]">{found.length}</span>
              <span className="text-[11px] text-[#9b97a4]">found on</span>
            </div>
            <div className="font-mono text-[11px] text-[#9b97a4]">
              {results.length} platforms checked · {elapsed.toFixed(1)}s
            </div>
            <span
              className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                mode === "simulated"
                  ? "border-[#d9a05b33] text-[#d9a05b] bg-[#d9a05b0a]"
                  : "border-[#8296b333] text-[#a3b1cc] bg-[#8296b30d]"
              }`}
            >
              <ModeIcon size={11} /> {MODE_LABEL[mode].text}
            </span>
            {upgradePending && (
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#82c7d433] text-[#82c7d4] bg-[#82c7d40a] anim-breathe">
                <Loader2 size={10} className="animate-spin" /> full sweep in progress…
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {([
              ["found", `Found (${found.length})`],
              ["all", `All (${results.length})`],
              ["categories", "Categories"],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-3.5 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                  tab === id
                    ? "bg-[#8296b314] border-[#8296b33d] text-[#a3b1cc]"
                    : "border-[#34323b] text-[#9b97a4] hover:text-[#e9e7ec] hover:border-[#3f3d47]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="panel p-5">
            {tab === "found" && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {found.length === 0 ? (
                  <p className="text-[12px] text-[#6f6c7a] col-span-full">
                    No public profiles found for this username on the checked platforms.
                  </p>
                ) : (
                  found.map((r, i) => (
                    <button
                      key={r.name}
                      onClick={() => setSelected(r)}
                      className="group text-left p-3.5 rounded-xl border border-[#7fbf9f26] bg-[#7fbf9f08] hover:border-[#7fbf9f66] hover:-translate-y-0.5 transition-all cursor-pointer"
                      style={{ animation: `reveal-up 0.35s ${Math.min(i, 12) * 0.04}s both` }}
                      aria-label={`View verified profile data for ${r.name}`}
                    >
                      <div className="flex items-center gap-3">
                        {r.meta?.avatar ? (
                          <img
                            src={r.meta.avatar}
                            alt=""
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full border border-[#7fbf9f44] object-cover shrink-0 bg-[#232228]"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-[#7fbf9f] shadow-[0_0_8px_#7fbf9f] shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[13px] font-semibold text-white">{r.name}</span>
                            {r.confidence === "verified" && (
                              <span className="inline-flex items-center gap-0.5 font-mono text-[8.5px] uppercase tracking-wider text-[#82c7d4] border border-[#82c7d433] bg-[#82c7d40a] rounded-full px-1.5 py-0.5">
                                <BadgeCheck size={9} /> API-verified
                              </span>
                            )}
                            {r.note && (
                              <span
                                className="inline-flex items-center gap-0.5 font-mono text-[8.5px] uppercase tracking-wider text-[#d9a05b] border border-[#d9a05b33] bg-[#d9a05b0a] rounded-full px-1.5 py-0.5"
                                title={r.note}
                              >
                                <LogIn size={9} /> login wall
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[9px] uppercase tracking-wider text-[#6f6c7a]">{r.category}</div>
                        </div>
                        <ExternalLink size={13} className="text-[#6f6c7a] group-hover:text-[#7fbf9f] transition-colors shrink-0" />
                      </div>
                      {r.meta && (r.meta.name || r.meta.bio || typeof r.meta.followers === "number") && (
                        <div className="mt-2.5 pt-2.5 border-t border-[#7fbf9f1f]">
                          {r.meta.name && (
                            <div className="text-[12px] font-medium text-[#e9e7ec] truncate">{r.meta.name}</div>
                          )}
                          {r.meta.bio && (
                            <div className="text-[10.5px] text-[#9b97a4] leading-relaxed mt-0.5 line-clamp-2">{r.meta.bio}</div>
                          )}
                          {typeof r.meta.followers === "number" && (
                            <div className="font-mono text-[9.5px] text-[#7fbf9f] mt-1">
                              {r.meta.followers.toLocaleString()} followers
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {tab === "all" && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {results.map((r, i) => (
                  <div
                    key={r.name}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border ${
                      r.status === "found"
                        ? "border-[#7fbf9f26] bg-[#7fbf9f08]"
                        : r.status === "absent"
                        ? "border-[#34323b] bg-[#232228] opacity-70"
                        : "border-[#34323b] bg-[#232228] opacity-50"
                    }`}
                    style={{ animation: `reveal-up 0.3s ${Math.min(i, 15) * 0.02}s both` }}
                  >
                    {r.status === "found" ? (
                      <UserCheck size={14} className="text-[#7fbf9f] shrink-0" />
                    ) : r.status === "absent" ? (
                      <UserX size={14} className="text-[#6f6c7a] shrink-0" />
                    ) : (
                      <HelpCircle size={14} className="text-[#9b97a4] shrink-0" />
                    )}
                    <span className="text-[12.5px] text-[#e9e7ec] truncate flex-1">{r.name}</span>
                    <span
                      className={`font-mono text-[9px] uppercase tracking-wider ${
                        r.status === "found" ? "text-[#7fbf9f]" : r.status === "absent" ? "text-[#6f6c7a]" : "text-[#9b97a4]"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {tab === "categories" && (
              <div className="grid sm:grid-cols-2 gap-4">
                {categories.map((cat) => {
                  const inCat = results.filter((r) => r.category === cat);
                  const foundCat = inCat.filter((r) => r.status === "found");
                  return (
                    <div key={cat} className="p-4 rounded-xl border border-[#34323b] bg-[#232228]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="display text-[13px] font-semibold text-white">{cat}</span>
                        <span className="font-mono text-[10px] text-[#9b97a4]">
                          {foundCat.length}/{inCat.length} found
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#34323b] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#8296b3] to-[#82c7d4]"
                          style={{ width: `${(foundCat.length / Math.max(1, inCat.length)) * 100}%`, animation: "bar-grow 0.8s both" }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {inCat.map((r) => (
                          <span
                            key={r.name}
                            className={`font-mono text-[9.5px] px-2 py-0.5 rounded-full border ${
                              r.status === "found"
                                ? "border-[#7fbf9f44] text-[#7fbf9f]"
                                : "border-[#34323b] text-[#6f6c7a]"
                            }`}
                          >
                            {r.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* manual checks for platforms that block automation */}
          <div className="panel p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9b97a4] mb-1">
              Manual verification
            </div>
            <p className="text-[11px] text-[#6f6c7a] mb-3">
              These platforms aggressively block automated checks (bot walls / forced login), so no tool can
              verify them remotely without false results. Open the profile link directly to check by hand.
            </p>
            <div className="flex flex-wrap gap-2">
              {MANUAL_CHECKS.map((m) => (
                <a
                  key={m.name}
                  href={m.url(input)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#34323b] text-[12px] text-[#b5b1bc] hover:text-[#82c7d4] hover:border-[#82c7d444] transition-colors"
                >
                  {m.name} <ExternalLink size={11} />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* In-app profile viewer — clicking a found platform always shows the
          verified data here first, so destination login walls / bot checks
          never look like a broken result. */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setSelected(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 14 }}
              transition={{ duration: 0.22, ease: [0.2, 0.8, 0.3, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label={`${selected.name} profile details`}
              className="panel panel-glow-mint relative w-full max-w-md p-6 max-h-[85vh] overflow-y-auto thin-scroll"
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-[#9b97a4] hover:text-white hover:bg-[#34323b66] transition-colors"
                aria-label="Close profile details"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-4">
                {selected.meta?.avatar ? (
                  <img
                    src={selected.meta.avatar}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-full border-2 border-[#7fbf9f55] object-cover bg-[#232228] shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-[#7fbf9f55] bg-[#7fbf9f0d] flex items-center justify-center shrink-0">
                    <UserCheck size={24} className="text-[#7fbf9f]" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="display text-[18px] font-bold text-white leading-tight">{selected.name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#6f6c7a] mt-0.5">
                    {selected.category} · profile found
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {selected.confidence === "verified" && (
                      <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-[#82c7d4] border border-[#82c7d433] bg-[#82c7d40a] rounded-full px-2 py-0.5">
                        <BadgeCheck size={10} /> API-verified
                      </span>
                    )}
                    {selected.note && (
                      <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-[#d9a05b] border border-[#d9a05b33] bg-[#d9a05b0a] rounded-full px-2 py-0.5">
                        <LogIn size={10} /> login wall possible
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {selected.meta?.name && (
                  <div className="p-3.5 rounded-xl border border-[#34323b] bg-[#232228]">
                    <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6f6c7a] mb-1">Display name</div>
                    <div className="text-[13.5px] text-[#e9e7ec] font-medium">{selected.meta.name}</div>
                  </div>
                )}
                {selected.meta?.bio && (
                  <div className="p-3.5 rounded-xl border border-[#34323b] bg-[#232228]">
                    <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6f6c7a] mb-1">Bio</div>
                    <div className="text-[12.5px] text-[#b5b1bc] leading-relaxed">{selected.meta.bio}</div>
                  </div>
                )}
                {typeof selected.meta?.followers === "number" && (
                  <div className="p-3.5 rounded-xl border border-[#34323b] bg-[#232228] flex items-center justify-between">
                    <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6f6c7a]">Followers</div>
                    <div className="display text-[16px] font-bold text-[#7fbf9f]">
                      {selected.meta.followers.toLocaleString()}
                    </div>
                  </div>
                )}
                <div className="p-3.5 rounded-xl border border-[#34323b] bg-[#232228]">
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6f6c7a] mb-1">Profile URL</div>
                  <div className="mono text-[11.5px] text-[#82c7d4] break-all">{selected.url}</div>
                </div>
                {selected.note && (
                  <p className="text-[11px] text-[#ddc28f] bg-[#d9a05b0a] border border-[#d9a05b26] rounded-xl p-3 leading-relaxed">
                    {selected.note} If the page below asks you to log in or shows a captcha, that is the
                    platform's own visitor protection — the profile data above was already verified.
                  </p>
                )}
              </div>

              <div className="flex gap-2.5 mt-5">
                <a
                  href={selected.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#7fbf9f] text-[#1b1a1f] display font-bold text-[12.5px] hover:shadow-[0_0_28px_-6px_#7fbf9f] transition-all active:scale-95"
                >
                  <ExternalLink size={13} /> Open on {selected.name}
                </a>
                <button
                  onClick={() => setSelected(null)}
                  className="px-4 py-2.5 rounded-lg border border-[#34323b] text-[12.5px] text-[#b5b1bc] hover:text-white hover:border-[#3f3d47] transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
