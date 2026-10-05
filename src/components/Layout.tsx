import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Link2, MessageSquareText, FileSearch, ShieldAlert,
  Globe2, Fingerprint, Library, GraduationCap, History, Info,
  Menu, X, Radar, Languages,
} from "lucide-react";
import { useI18n, langNames, type Lang } from "../lib/i18n";

const NAV = [
  { to: "/", key: "nav.dashboard", icon: LayoutDashboard },
  {
    group: "nav.group.analyze",
    items: [
      { to: "/url", key: "nav.url", icon: Link2 },
      { to: "/text", key: "nav.text", icon: MessageSquareText },
      { to: "/file", key: "nav.file", icon: FileSearch },
    ],
  },
  {
    group: "nav.group.recon",
    items: [
      { to: "/vuln", key: "nav.vuln", icon: ShieldAlert },
      { to: "/ip", key: "nav.ip", icon: Globe2 },
      { to: "/osint", key: "nav.osint", icon: Fingerprint },
    ],
  },
  {
    group: "nav.group.knowledge",
    items: [
      { to: "/library", key: "nav.library", icon: Library },
      { to: "/quiz", key: "nav.quiz", icon: GraduationCap },
      { to: "/history", key: "nav.history", icon: History },
      { to: "/about", key: "nav.about", icon: Info },
    ],
  },
];

function NavItem({ to, label, icon: Icon, onNav }: {
  to: string; label: string; icon: typeof Link2; onNav?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onNav}
      end={to === "/"}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 border ${
          isActive
            ? "bg-[#82c7d414] text-[#82c7d4] border-[#82c7d42e] shadow-[0_0_18px_-8px_rgba(130,199,212,0.5)]"
            : "text-[#b5b1bc] border-transparent hover:text-[#e9e7ec] hover:bg-[#34323b55] hover:translate-x-0.5"
        }`
      }
    >
      <Icon size={16} strokeWidth={1.8} className="shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

function SidebarContent({ onNav }: { onNav?: () => void }) {
  const { t } = useI18n();
  return (
    <nav className="flex-1 overflow-y-auto thin-scroll px-3 py-4 space-y-5">
      <NavItem to="/" label={t("nav.dashboard")} icon={LayoutDashboard} onNav={onNav} />
      {NAV.slice(1).map((section) => (
        <div key={section.group}>
          <div className="px-3 mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#6f6c7a]">
            {t(section.group!)}
          </div>
          <div className="space-y-0.5">
            {section.items!.map((item) => (
              <NavItem key={item.to} to={item.to} label={t(item.key)} icon={item.icon} onNav={onNav} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#1b1a1f] text-[#e9e7ec]">
      {/* top bar */}
      <header className="fixed top-0 inset-x-0 z-40 h-16 flex items-center gap-3 px-4 border-b border-[#34323b] bg-[#1b1a1fee] backdrop-blur-md">
        <button
          className="lg:hidden p-2 -ml-1 rounded-lg text-[#b5b1bc] hover:text-[#82c7d4] hover:bg-[#34323b66] transition-colors"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-full border border-[#82c7d444] bg-[#211f25] overflow-hidden anim-breathe">
            <div className="absolute inset-0 radar-sweep" />
            <div className="absolute inset-[6px] rounded-full border border-[#34323b]" />
            <div className="absolute inset-[11px] rounded-full border border-[#34323b]" />
            <div className="absolute left-1/2 top-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#82c7d4]" />
          </div>
          <div>
            <div className="display font-semibold text-[15px] leading-tight tracking-wide text-white">
              Threat<span className="text-[#82c7d4]">Lens</span>
            </div>
            <div className="hidden sm:block font-mono text-[9.5px] text-[#6f6c7a] tracking-wider">
              CYBER-THREAT MULTITOOL
            </div>
          </div>
        </div>

        <div className="flex-1" />

        {/* language selector */}
        <div className="relative">
          <button
            onClick={() => setLangOpen((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#34323b] text-[#b5b1bc] hover:text-[#e9e7ec] hover:border-[#3f3d47] transition-colors text-xs"
          >
            <Languages size={14} />
            <span className="uppercase font-mono">{lang}</span>
          </button>
          <AnimatePresence>
            {langOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-40 panel p-1.5 z-50"
              >
                {(Object.keys(langNames) as Lang[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLang(l); setLangOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors ${
                      l === lang ? "bg-[#82c7d414] text-[#82c7d4]" : "text-[#b5b1bc] hover:bg-[#34323b66] hover:text-[#e9e7ec]"
                    }`}
                  >
                    {langNames[l]}
                  </button>
                ))}
                <div className="px-3 pt-1.5 pb-1 font-mono text-[9px] leading-snug text-[#6f6c7a]">
                  {t("note.chrome")}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* engine status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#7fbf9f33] bg-[#7fbf9f0a]">
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex w-full h-full rounded-full bg-[#7fbf9f] opacity-60" style={{ animation: "ping-ring 1.8s cubic-bezier(0,0,0.2,1) infinite" }} />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-[#7fbf9f]" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#7fbf9f]">
            {t("status.engine")}
          </span>
        </div>
      </header>

      {/* desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-60 flex-col border-r border-[#34323b] bg-[#201f24]">
        <SidebarContent />
        <div className="px-4 py-3 border-t border-[#2c2b32] font-mono text-[9px] text-[#6f6c7a] leading-relaxed">
          {t("status.local")} · v1.0
        </div>
      </aside>

      {/* mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 flex flex-col bg-[#201f24] border-r border-[#34323b] lg:hidden"
            >
              <div className="flex items-center justify-between px-4 h-16 border-b border-[#34323b]">
                <div className="flex items-center gap-2">
                  <Radar size={18} className="text-[#82c7d4]" />
                  <span className="display font-semibold text-white">Threat<span className="text-[#82c7d4]">Lens</span></span>
                </div>
                <button onClick={() => setOpen(false)} className="p-1.5 text-[#b5b1bc] hover:text-white" aria-label="Close menu">
                  <X size={18} />
                </button>
              </div>
              <SidebarContent onNav={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* main — animated route transitions */}
      <main className="pt-16 lg:pl-60">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.26, ease: [0.2, 0.8, 0.3, 1] }}
            className="min-h-[calc(100vh-4rem)] bg-grid"
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
              {children}
              <footer className="mt-14 pt-6 border-t border-[#2c2b32] text-center font-mono text-[10px] text-[#6f6c7a] leading-relaxed">
                {t("footer.disclaimer")}
              </footer>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
