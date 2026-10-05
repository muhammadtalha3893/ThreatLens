import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Link2, MessageSquareText, FileSearch, ShieldAlert, Globe2, Fingerprint,
  Activity, ArrowRight, ScanLine,
} from "lucide-react";
import Radar from "../components/Radar";
import PageHeader from "../components/PageHeader";
import VerdictBadge from "../components/VerdictBadge";
import CountUp from "../components/CountUp";
import { loadHistory } from "../lib/history";
import { useI18n } from "../lib/i18n";
import type { ScanResult } from "../lib/types";

const toolIcon = { url: Link2, text: MessageSquareText, file: FileSearch };

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.2, 0.8, 0.3, 1] as const } },
};

export default function Dashboard() {
  const { t } = useI18n();
  const [history, setHistory] = useState<ScanResult[]>([]);

  useEffect(() => {
    const refresh = () => setHistory(loadHistory());
    refresh();
    // custom event = same-tab updates, storage event = cross-tab updates
    window.addEventListener("tl-history", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("tl-history", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const counts = {
    total: history.length,
    malicious: history.filter((h) => h.verdict === "malicious").length,
    suspicious: history.filter((h) => h.verdict === "suspicious").length,
    safe: history.filter((h) => h.verdict === "safe").length,
  };

  const dist = [
    { label: t("dash.malicious"), n: counts.malicious, color: "#cf6679" },
    { label: t("dash.suspicious"), n: counts.suspicious, color: "#d9a05b" },
    { label: t("dash.safe"), n: counts.safe, color: "#7fbf9f" },
  ];
  const maxDist = Math.max(1, ...dist.map((d) => d.n));

  const quick = [
    { to: "/url", icon: Link2, title: t("nav.url"), desc: "Structural phishing & abuse heuristics", color: "#82c7d4" },
    { to: "/text", icon: MessageSquareText, title: t("nav.text"), desc: "Phishing, smishing, vishing & baiting patterns", color: "#8296b3" },
    { to: "/file", icon: FileSearch, title: t("nav.file"), desc: "Extension, structure & metadata heuristics", color: "#7fbf9f" },
  ];

  const recon = [
    { to: "/vuln", icon: ShieldAlert, title: t("nav.vuln"), desc: "Live HTTP security-header & TLS posture audit" },
    { to: "/ip", icon: Globe2, title: t("nav.ip"), desc: "Geolocation, ASN & hosting-risk intelligence" },
    { to: "/osint", icon: Fingerprint, title: t("nav.osint"), desc: "Find where a username exists across the internet" },
  ];

  return (
    <div>
      {/* hero */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.3, 1] }}
        className="panel panel-glow-cyan relative overflow-hidden p-6 sm:p-10 mb-8"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(130,199,212,0.08),transparent_55%)]" />
        <div className="relative flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#82c7d433] bg-[#82c7d40a] font-mono text-[10px] uppercase tracking-[0.2em] text-[#82c7d4] mb-4">
              <ScanLine size={11} /> {t("status.local")}
            </div>
            <h1 className="display text-3xl sm:text-5xl font-bold text-white leading-tight">
              Threat<span className="text-[#82c7d4] text-glow-cyan">Lens</span>
            </h1>
            <p className="text-[#b5b1bc] mt-2 text-sm sm:text-[15px] max-w-md mx-auto md:mx-0">
              {t("app.tagline")}. Scan URLs, messages and files with a transparent,
              deterministic rule engine that runs entirely in your browser.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
              <Link
                to="/url"
                className="px-5 py-2.5 rounded-lg bg-[#82c7d4] text-[#1b1a1f] text-[13px] font-bold display tracking-wide hover:shadow-[0_0_28px_-6px_#82c7d4] hover:-translate-y-0.5 transition-all active:scale-95"
              >
                {t("dash.quick")} →
              </Link>
              <Link
                to="/about"
                className="px-5 py-2.5 rounded-lg border border-[#3f3d47] text-[13px] font-medium text-[#e9e7ec] hover:border-[#82c7d455] hover:text-[#82c7d4] transition-all"
              >
                {t("nav.about")}
              </Link>
            </div>
          </div>
          <div className="anim-float shrink-0">
            <Radar size={230} />
          </div>
        </div>
      </motion.div>

      <PageHeader title={t("dash.title")} sub={t("dash.sub")} />

      {/* stat cards — animated counters */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: t("dash.total"), n: counts.total, color: "#82c7d4" },
          { label: t("dash.malicious"), n: counts.malicious, color: "#cf6679" },
          { label: t("dash.suspicious"), n: counts.suspicious, color: "#d9a05b" },
          { label: t("dash.safe"), n: counts.safe, color: "#7fbf9f" },
        ].map((s) => (
          <motion.div
            key={s.label}
            variants={fadeUp}
            whileHover={{ y: -3 }}
            className="panel p-4 transition-shadow"
          >
            <div className="display text-3xl font-bold" style={{ color: s.color, textShadow: `0 0 18px ${s.color}44` }}>
              <CountUp value={s.n} />
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#9b97a4] mt-1">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* distribution */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.45 }} className="panel p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9b97a4] mb-4">
            {t("dash.distribution")}
          </div>
          {counts.total === 0 ? (
            <p className="text-[12px] text-[#6f6c7a]">{t("dash.empty")}</p>
          ) : (
            <div className="space-y-3">
              {dist.map((d) => (
                <div key={d.label}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[#e9e7ec]">{d.label}</span>
                    <span className="mono text-[#9b97a4]">{d.n}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#34323b] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(d.n / maxDist) * 100}%`,
                        background: d.color,
                        boxShadow: `0 0 10px ${d.color}66`,
                        animation: "bar-grow 0.9s cubic-bezier(0.2,0.8,0.3,1) both",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* recent activity */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.45 }} className="panel p-5">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#9b97a4] mb-4">
            <Activity size={12} className="text-[#82c7d4]" /> {t("dash.recent")}
          </div>
          {history.length === 0 ? (
            <p className="text-[12px] text-[#6f6c7a]">{t("dash.empty")}</p>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 5).map((h, i) => {
                const Icon = toolIcon[h.tool];
                return (
                  <motion.div
                    key={h.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.06, duration: 0.3 }}
                  >
                    <Link
                      to="/history"
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-transparent hover:border-[#34323b] hover:bg-[#28272e] transition-colors group"
                    >
                      <Icon size={14} className="text-[#9b97a4] group-hover:text-[#82c7d4] shrink-0" />
                      <span className="mono text-[11px] text-[#b5b1bc] truncate flex-1">{h.input}</span>
                      <VerdictBadge verdict={h.verdict} />
                      <ArrowRight size={12} className="text-[#6f6c7a] group-hover:text-[#82c7d4] transition-colors" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* quick scan */}
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9b97a4] mb-3">
        {t("dash.quick")}
      </div>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid sm:grid-cols-3 gap-3 mb-8">
        {quick.map((q) => {
          const Icon = q.icon;
          return (
            <motion.div key={q.to} variants={fadeUp} whileHover={{ y: -4 }}>
              <Link
                to={q.to}
                className="panel p-5 group h-full block transition-all duration-300"
              >
                <div
                  className="w-10 h-10 rounded-lg border flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                  style={{ borderColor: `${q.color}44`, background: `${q.color}0d`, color: q.color }}
                >
                  <Icon size={18} strokeWidth={1.8} />
                </div>
                <div className="display text-[15px] font-semibold text-white">{q.title}</div>
                <p className="text-[11.5px] text-[#9b97a4] mt-1 leading-relaxed">{q.desc}</p>
                <div className="mt-3 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1" style={{ color: q.color }}>
                  {t("common.scan")} <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* recon suite */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.45 }} className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <div className="display text-[15px] font-semibold text-white">{t("dash.recon")}</div>
            <div className="text-[11px] text-[#9b97a4]">{t("dash.reconSub")}</div>
          </div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#7fbf9f] px-2.5 py-1 rounded-full border border-[#7fbf9f33] bg-[#7fbf9f0a]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7fbf9f] anim-breathe" /> {t("dash.live")}
          </span>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {recon.map((r, i) => {
            const Icon = r.icon;
            return (
              <motion.div
                key={r.to}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.08, duration: 0.35 }}
                whileHover={{ y: -3 }}
              >
                <Link
                  to={r.to}
                  className="flex gap-3 p-3.5 rounded-xl border border-[#34323b] bg-[#232228] hover:border-[#8296b355] hover:bg-[#8296b308] transition-all group h-full"
                >
                  <Icon size={17} className="text-[#8296b3] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-[13px] font-semibold text-white">{r.title}</div>
                    <div className="text-[10.5px] text-[#9b97a4] mt-0.5 leading-relaxed">{r.desc}</div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
