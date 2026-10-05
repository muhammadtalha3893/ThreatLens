import type { ScanResult } from "./types";

const KEY = "threatlens_history_v1";
const MAX = 60;

/** localStorage can be unavailable (private mode, blocked storage) — never let that break a scan. */
function storageAvailable(): boolean {
  try {
    const k = "__tl_probe__";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function loadHistory(): ScanResult[] {
  try {
    if (!storageAvailable()) return [];
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScanResult[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveToHistory(result: ScanResult): ScanResult[] {
  const list = [result, ...loadHistory()].slice(0, MAX);
  try {
    if (storageAvailable()) {
      localStorage.setItem(KEY, JSON.stringify(list));
    }
  } catch {
    /* storage unavailable — the scan still succeeds, it just isn't persisted */
  }
  try {
    window.dispatchEvent(new CustomEvent("tl-history"));
  } catch {
    /* ignore */
  }
  return list;
}

export function clearHistory() {
  try {
    if (storageAvailable()) localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent("tl-history"));
  } catch {
    /* ignore */
  }
}
