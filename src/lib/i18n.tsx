import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "en" | "es" | "de" | "fr";

export const langNames: Record<Lang, string> = {
  en: "English",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
};

type Dict = Record<string, string>;

const en: Dict = {
  "app.tagline": "Radar-sweep threat intelligence multitool",
  "nav.dashboard": "Dashboard",
  "nav.url": "URL Scanner",
  "nav.text": "Text Analyzer",
  "nav.file": "File Scanner",
  "nav.vuln": "Vulnerability Scanner",
  "nav.ip": "IP Intelligence",
  "nav.osint": "OSINT Sherlock",
  "nav.library": "Threat Library",
  "nav.quiz": "Security Quiz",
  "nav.history": "Scan History",
  "nav.about": "How It Works",
  "nav.group.analyze": "Analyze",
  "nav.group.recon": "Recon",
  "nav.group.knowledge": "Knowledge",
  "status.engine": "Engine Online",
  "status.local": "Local Heuristic Engine",
  "note.chrome": "Interface is translated; scan findings remain in English in v1.",
  "dash.title": "Threat Dashboard",
  "dash.sub": "Aggregate view across your scan history",
  "dash.total": "Total Scans",
  "dash.malicious": "Malicious",
  "dash.suspicious": "Suspicious",
  "dash.safe": "Safe",
  "dash.recent": "Recent Activity",
  "dash.empty": "No scans yet. Run a URL, text, or file scan to populate your dashboard.",
  "dash.distribution": "Verdict Distribution",
  "dash.quick": "Quick Scan",
  "dash.recon": "Recon Suite",
  "dash.reconSub": "Live OSINT & reconnaissance tools — real public-API probes, right in your browser",
  "dash.live": "LIVE",
  "common.scan": "Scan",
  "common.clear": "Clear History",
  "common.view": "View",
  "common.exportPng": "Export PNG",
  "common.exportPdf": "Export PDF",
  "common.saved": "Saved to history",
  "footer.disclaimer":
    "ThreatLens is an educational heuristic tool. It is not a substitute for endpoint protection or professional security review.",
};

const es: Dict = {
  ...en,
  "app.tagline": "Multiherramienta de inteligencia de amenazas con barrido de radar",
  "nav.dashboard": "Panel",
  "nav.url": "Escáner de URL",
  "nav.text": "Analizador de Texto",
  "nav.file": "Escáner de Archivos",
  "nav.vuln": "Escáner de Vulnerabilidades",
  "nav.ip": "Inteligencia de IP",
  "nav.osint": "OSINT Sherlock",
  "nav.library": "Biblioteca de Amenazas",
  "nav.quiz": "Quiz de Seguridad",
  "nav.history": "Historial de Escaneos",
  "nav.about": "Cómo Funciona",
  "nav.group.analyze": "Analizar",
  "nav.group.recon": "Reconocimiento",
  "nav.group.knowledge": "Conocimiento",
  "status.engine": "Motor en Línea",
  "status.local": "Motor Heurístico Local",
  "note.chrome": "La interfaz está traducida; los resultados del escaneo permanecen en inglés en v1.",
  "dash.title": "Panel de Amenazas",
  "dash.sub": "Vista agregada de tu historial de escaneos",
  "dash.total": "Escaneos Totales",
  "dash.malicious": "Malicioso",
  "dash.suspicious": "Sospechoso",
  "dash.safe": "Seguro",
  "dash.recent": "Actividad Reciente",
  "dash.empty": "Aún no hay escaneos. Ejecuta un escaneo de URL, texto o archivo para llenar tu panel.",
  "dash.distribution": "Distribución de Veredictos",
  "dash.quick": "Escaneo Rápido",
  "dash.recon": "Suite de Reconocimiento",
  "dash.reconSub": "Herramientas OSINT en vivo — sondas reales vía APIs públicas, en tu navegador",
  "dash.live": "EN VIVO",
  "common.scan": "Escanear",
  "common.clear": "Borrar Historial",
  "common.view": "Ver",
  "common.exportPng": "Exportar PNG",
  "common.exportPdf": "Exportar PDF",
  "common.saved": "Guardado en el historial",
  "footer.disclaimer":
    "ThreatLens es una herramienta heurística educativa. No sustituye la protección de endpoints ni una revisión de seguridad profesional.",
};

const de: Dict = {
  ...en,
  "app.tagline": "Radar-Threat-Intelligence-Multitool",
  "nav.dashboard": "Dashboard",
  "nav.url": "URL-Scanner",
  "nav.text": "Text-Analysator",
  "nav.file": "Datei-Scanner",
  "nav.vuln": "Schwachstellen-Scanner",
  "nav.ip": "IP-Intelligenz",
  "nav.osint": "OSINT Sherlock",
  "nav.library": "Threat-Bibliothek",
  "nav.quiz": "Sicherheits-Quiz",
  "nav.history": "Scan-Verlauf",
  "nav.about": "Funktionsweise",
  "nav.group.analyze": "Analysieren",
  "nav.group.recon": "Aufklärung",
  "nav.group.knowledge": "Wissen",
  "status.engine": "Engine Online",
  "status.local": "Lokale Heuristik-Engine",
  "note.chrome": "Oberfläche übersetzt; Scan-Ergebnisse bleiben in v1 auf Englisch.",
  "dash.title": "Threat-Dashboard",
  "dash.sub": "Aggregierte Ansicht deines Scan-Verlaufs",
  "dash.total": "Scans gesamt",
  "dash.malicious": "Bösartig",
  "dash.suspicious": "Verdächtig",
  "dash.safe": "Sicher",
  "dash.recent": "Letzte Aktivität",
  "dash.empty": "Noch keine Scans. Führe einen URL-, Text- oder Datei-Scan aus, um dein Dashboard zu füllen.",
  "dash.distribution": "Urteils-Verteilung",
  "dash.quick": "Schnellscan",
  "dash.recon": "Recon-Suite",
  "dash.reconSub": "Live-OSINT-Tools — echte Public-API-Sonden direkt im Browser",
  "dash.live": "LIVE",
  "common.scan": "Scannen",
  "common.clear": "Verlauf löschen",
  "common.view": "Ansehen",
  "common.exportPng": "PNG exportieren",
  "common.exportPdf": "PDF exportieren",
  "common.saved": "Im Verlauf gespeichert",
  "footer.disclaimer":
    "ThreatLens ist ein edukatives Heuristik-Tool und ersetzt keinen Endpoint-Schutz und keine professionelle Sicherheitsprüfung.",
};

const fr: Dict = {
  ...en,
  "app.tagline": "Multi-outil de threat intelligence à balayage radar",
  "nav.dashboard": "Tableau de bord",
  "nav.url": "Scanner d'URL",
  "nav.text": "Analyseur de Texte",
  "nav.file": "Scanner de Fichiers",
  "nav.vuln": "Scanner de Vulnérabilités",
  "nav.ip": "Renseignement IP",
  "nav.osint": "OSINT Sherlock",
  "nav.library": "Bibliothèque des Menaces",
  "nav.quiz": "Quiz Sécurité",
  "nav.history": "Historique des Scans",
  "nav.about": "Fonctionnement",
  "nav.group.analyze": "Analyser",
  "nav.group.recon": "Reconnaissance",
  "nav.group.knowledge": "Savoir",
  "status.engine": "Moteur en Ligne",
  "status.local": "Moteur Heuristique Local",
  "note.chrome": "Interface traduite ; les résultats de scan restent en anglais en v1.",
  "dash.title": "Tableau des Menaces",
  "dash.sub": "Vue agrégée de votre historique de scans",
  "dash.total": "Scans Totaux",
  "dash.malicious": "Malveillant",
  "dash.suspicious": "Suspect",
  "dash.safe": "Sûr",
  "dash.recent": "Activité Récente",
  "dash.empty": "Aucun scan pour l'instant. Lancez un scan d'URL, de texte ou de fichier pour remplir votre tableau de bord.",
  "dash.distribution": "Répartition des Verdicts",
  "dash.quick": "Scan Rapide",
  "dash.recon": "Suite de Reconnaissance",
  "dash.reconSub": "Outils OSINT en direct — sondes réelles via APIs publiques, dans votre navigateur",
  "dash.live": "DIRECT",
  "common.scan": "Scanner",
  "common.clear": "Effacer l'historique",
  "common.view": "Voir",
  "common.exportPng": "Exporter PNG",
  "common.exportPdf": "Exporter PDF",
  "common.saved": "Enregistré dans l'historique",
  "footer.disclaimer":
    "ThreatLens est un outil heuristique éducatif. Il ne remplace ni une protection des endpoints ni un audit de sécurité professionnel.",
};

const dicts: Record<Lang, Dict> = { en, es, de, fr };

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const Ctx = createContext<I18nCtx>({ lang: "en", setLang: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem("tl_lang");
    return stored && stored in dicts ? (stored as Lang) : "en";
  });
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("tl_lang", l);
  };
  const t = (key: string) => dicts[lang][key] ?? en[key] ?? key;
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  return useContext(Ctx);
}
