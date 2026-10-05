import type { Finding, ScanResult } from "../types";
import { finalize } from "./shared";

/* Local heuristic file analysis — only name, size and extension are
   inspected. File contents never leave the browser. */

const HIGH_RISK_EXT = [
  "exe", "msi", "scr", "bat", "cmd", "com", "pif", "vbs", "vbe", "js",
  "jse", "wsf", "wsh", "ps1", "psm1", "jar", "apk", "hta", "cpl", "dll",
  "lnk", "reg", "appimage",
];

const MACRO_EXT = ["doc", "xls", "ppt", "docm", "xlsm", "pptm", "pdf", "rtf", "xla"];
const CONTAINER_EXT = ["zip", "rar", "7z", "iso", "img", "tar", "gz", "bz2", "cab", "dmg", "vhd"];
const LOW_RISK_EXT = [
  "png", "jpg", "jpeg", "gif", "webp", "bmp", "txt", "md", "mp3", "wav",
  "mp4", "mov", "mkv", "csv", "json",
];

const LURE_NAMES = ["invoice", "payment", "receipt", "resume", "cv", "lottery", "prize", "order", "statement", "salary"];

function splitExts(name: string): string[] {
  const base = name.replace(/\u202e/g, "");
  const parts = base.split(".").filter(Boolean);
  return parts.length > 1 ? parts.slice(1).map((p) => p.toLowerCase()) : [];
}

export function scanFile(name: string, size: number): ScanResult {
  const findings: Finding[] = [];
  const exts = splitExts(name);
  const lastExt = exts[exts.length - 1] || "";

  // 1. Right-to-left override disguise
  if (name.includes("\u202e")) {
    findings.push({
      id: "rtlOverride",
      title: "Right-to-left override in filename",
      detail: "U+202E can visually reverse the extension, making an .exe read as a document.",
      severity: "critical",
      weight: 30,
      layers: ["application", "content"],
      stages: ["delivery", "installation"],
      suggestion: "The filename hides a right-to-left override character to disguise its real extension. Do not open it.",
    });
  }

  // 2. Double extension
  if (exts.length >= 2) {
    const prev = exts[exts.length - 2];
    const docLike = [...LOW_RISK_EXT, ...MACRO_EXT].includes(prev);
    if (docLike && HIGH_RISK_EXT.includes(lastExt)) {
      findings.push({
        id: "doubleExt",
        title: "Double extension",
        detail: `\u201c.${prev}.${lastExt}\u201d — the visible type is a decoy; the real type executes.`,
        severity: "critical",
        weight: 28,
        layers: ["application"],
        stages: ["delivery", "installation"],
        suggestion: "This file has a double extension (e.g. invoice.pdf.exe) — do not open it.",
      });
    }
  }

  // 3. Extension tier
  if (HIGH_RISK_EXT.includes(lastExt)) {
    findings.push({
      id: "extHigh",
      title: "High-risk executable extension",
      detail: `\u201c.${lastExt}\u201d can execute code directly on your machine.`,
      severity: "high",
      weight: 24,
      layers: ["application"],
      stages: ["installation", "actions"],
      suggestion: "This is an executable file type. Only run it if you fully trust the source and scanned it with a real AV.",
    });
  } else if (MACRO_EXT.includes(lastExt)) {
    findings.push({
      id: "extMed",
      title: "Macro-capable / active content",
      detail: `\u201c.${lastExt}\u201d can carry macros or embedded scripts.`,
      severity: "medium",
      weight: 12,
      layers: ["application"],
      stages: ["exploitation", "installation"],
      suggestion: "This document can carry macros. Open in Protected View and keep macros disabled.",
    });
  } else if (CONTAINER_EXT.includes(lastExt)) {
    findings.push({
      id: "extContainer",
      title: "Archive / container",
      detail: `\u201c.${lastExt}\u201d contents are unknown until extracted.`,
      severity: "medium",
      weight: 10,
      layers: ["application"],
      stages: ["delivery", "installation"],
      suggestion: "This is an archive. Inspect its contents in a sandbox before extracting.",
    });
  } else if (LOW_RISK_EXT.includes(lastExt)) {
    findings.push({
      id: "extLow",
      title: "Low-risk file type",
      detail: `\u201c.${lastExt}\u201d is generally passive content.`,
      severity: "info",
      weight: 0,
      layers: ["application"],
      stages: [],
    });
  } else if (lastExt) {
    findings.push({
      id: "extUnknown",
      title: "Unrecognized extension",
      detail: `\u201c.${lastExt}\u201d is not in any known tier — treat unknown types with caution.`,
      severity: "low",
      weight: 6,
      layers: ["application"],
      stages: ["delivery"],
    });
  }

  // 4. Zero-byte file
  if (size === 0) {
    findings.push({
      id: "zeroByte",
      title: "Zero-byte file",
      detail: "Empty files can be placeholders or droppers completed by a second download.",
      severity: "medium",
      weight: 10,
      layers: ["application"],
      stages: ["installation"],
    });
  }

  // 5. Oversized
  if (size > 100 * 1024 * 1024) {
    findings.push({
      id: "oversized",
      title: "Unusually large file",
      detail: `${(size / 1024 / 1024).toFixed(0)} MB — oversized blobs sometimes pad past sandbox scan limits.`,
      severity: "low",
      weight: 6,
      layers: ["application"],
      stages: ["delivery"],
    });
  }

  // 6. Overlong filename
  if (name.length > 80) {
    findings.push({
      id: "nameLen",
      title: "Overlong filename",
      detail: `${name.length} characters — long names can push the true extension out of view.`,
      severity: "low",
      weight: 8,
      layers: ["content"],
      stages: ["delivery"],
    });
  }

  // 7. Social lure name paired with risky type
  const lower = name.toLowerCase();
  const lureHit = LURE_NAMES.find((l) => lower.includes(l));
  if (lureHit && (HIGH_RISK_EXT.includes(lastExt) || CONTAINER_EXT.includes(lastExt))) {
    findings.push({
      id: "lureName",
      title: "Social-lure filename",
      detail: `\u201c${lureHit}\u201d paired with an executable/archive type is a common malware delivery costume.`,
      severity: "medium",
      weight: 10,
      layers: ["content", "human"],
      stages: ["delivery"],
    });
  }

  return finalize("file", `${name} (${formatSize(size)})`, findings, (v, fs) => {
    const has = (id: string) => fs.some((f) => f.id === id);
    if (has("doubleExt") || has("rtlOverride")) return "Disguised Executable";
    if (v === "malicious") return "High-Risk File";
    if (v === "suspicious") {
      return has("extMed") ? "Active-Content File" : "Suspicious File";
    }
    return "Low-Risk File";
  });
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
