import type { Finding, ScanResult } from "../types";
import { finalize } from "./shared";

/* Local heuristic URL analysis — deterministic structural rules only. */

const ABUSE_TLDS = [
  "xyz", "top", "club", "work", "buzz", "gq", "tk", "ml", "cf", "ga",
  "icu", "cyou", "live", "site", "online", "website", "fun", "space",
];

const SHORTENERS = [
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "rb.gy",
  "cutt.ly", "shorturl.at", "buff.ly", "rebrand.ly", "tiny.cc", "s.id",
  "lnkd.in", "bitly.is", "t.ly",
];

const BRANDS = [
  "paypal", "google", "apple", "microsoft", "amazon", "netflix", "facebook",
  "instagram", "whatsapp", "chase", "wellsfargo", "bankofamerica", "dropbox",
  "docusign", "linkedin", "outlook", "icloud", "steam", "coinbase", "binance",
];

const CRED_KEYWORDS = [
  "login", "log-in", "signin", "sign-in", "verify", "verification", "update",
  "account", "password", "secure", "banking", "confirm", "suspended", "unlock",
];

function parseUrl(raw: string): URL | null {
  let candidate = raw.trim();
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(candidate)) candidate = "http://" + candidate;
  try {
    return new URL(candidate);
  } catch {
    return null;
  }
}

function registeredDomain(host: string): string {
  const parts = host.split(".");
  if (parts.length < 2) return host;
  return parts.slice(-2).join(".");
}

export function scanUrl(raw: string): ScanResult {
  const findings: Finding[] = [];
  const url = parseUrl(raw);

  if (!url) {
    findings.push({
      id: "unparseable",
      title: "Unparseable URL",
      detail: "The input could not be parsed as a URL at all — malformed inputs are treated as hostile by default.",
      severity: "high",
      weight: 30,
      layers: ["application"],
      stages: ["delivery"],
      suggestion: "Do not paste this into a browser. Ask the sender what they actually meant to share.",
    });
    return finalize("url", raw, findings, (v) =>
      v === "malicious" ? "Malicious URL" : v === "suspicious" ? "Suspicious URL" : "Likely Safe URL"
    );
  }

  const host = url.hostname.toLowerCase();
  const regDomain = registeredDomain(host);
  const labels = host.split(".");
  const tld = labels[labels.length - 1];
  const full = url.href;

  // 1. IP address used as hostname
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":")) {
    findings.push({
      id: "ipHost",
      title: "IP address as hostname",
      detail: "Legit brands use domain names, not raw IPs. A raw address hides who operates the site.",
      severity: "critical",
      weight: 25,
      layers: ["network"],
      stages: ["delivery", "exploitation"],
      suggestion: "This uses a raw IP address instead of a domain. Legitimate services almost never do this.",
    });
  }

  // 2. @ symbol — everything before it is ignored by browsers
  if (raw.includes("@")) {
    findings.push({
      id: "atSymbol",
      title: "@ symbol in URL",
      detail: "Browsers ignore everything before the @ — it is a classic redirect trick to show a fake brand.",
      severity: "high",
      weight: 20,
      layers: ["network", "content"],
      stages: ["delivery"],
      suggestion: "The URL contains an @ — the real destination is after it. Do not trust the visible brand name.",
    });
  }

  // 3. Excessive subdomains
  const subCount = labels.length - 2;
  if (subCount >= 3) {
    findings.push({
      id: "subdomains",
      title: "Excessive subdomains",
      detail: `${subCount} subdomain levels — deep chains are used to look like a trusted host at a glance.`,
      severity: "medium",
      weight: 10,
      layers: ["network"],
      stages: ["delivery"],
    });
  }

  // 4. High-abuse TLD
  if (ABUSE_TLDS.includes(tld)) {
    findings.push({
      id: "tld",
      title: "High-abuse TLD",
      detail: `".${tld}" is cheap and commonly used by throwaway malicious sites.`,
      severity: "medium",
      weight: 14,
      layers: ["network"],
      stages: ["delivery"],
      suggestion: "This top-level domain is frequently abused. Treat the site as untrusted.",
    });
  }

  // 5. URL shortener
  if (SHORTENERS.includes(regDomain)) {
    findings.push({
      id: "shortener",
      title: "URL shortener masks destination",
      detail: "The real target is hidden behind a redirect service.",
      severity: "high",
      weight: 20,
      layers: ["network", "content"],
      stages: ["delivery"],
      suggestion: "This link uses a URL shortener — expand it with a link-expander before clicking.",
    });
  }

  // 6. No HTTPS
  if (url.protocol === "http:") {
    findings.push({
      id: "noHttps",
      title: "No HTTPS",
      detail: "Traffic is unencrypted and unauthenticated — credentials typed here are exposed.",
      severity: "medium",
      weight: 12,
      layers: ["network"],
      stages: ["exploitation"],
      suggestion: "No HTTPS — never enter credentials or personal data on this page.",
    });
  }

  // 7. Abnormally long URL
  if (full.length > 110) {
    findings.push({
      id: "longUrl",
      title: "Abnormally long URL",
      detail: `${full.length} characters — obfuscated parameter chains are common in phishing kits.`,
      severity: "low",
      weight: 8,
      layers: ["content"],
      stages: ["delivery"],
    });
  }

  // 8. Excessive hyphens in domain
  const hyphens = (host.match(/-/g) || []).length;
  if (hyphens >= 3) {
    findings.push({
      id: "hyphens",
      title: "Excessive hyphens in domain",
      detail: `${hyphens} hyphens — used to stitch brand names onto attacker-controlled domains.`,
      severity: "low",
      weight: 8,
      layers: ["network", "content"],
      stages: ["delivery"],
    });
  }

  // 9. Punycode / homograph
  if (labels.some((l) => l.startsWith("xn--"))) {
    findings.push({
      id: "punycode",
      title: "Punycode / homograph domain",
      detail: "xn-- prefix can hide look-alike Unicode characters that impersonate real brands.",
      severity: "high",
      weight: 18,
      layers: ["network"],
      stages: ["delivery", "exploitation"],
      suggestion: "This domain uses Punycode (xn--). It may impersonate a real brand with look-alike characters.",
    });
  }

  // 10. Brand keyword but mismatched registered domain
  const brandHit = BRANDS.find((b) => {
    const bare = regDomain.replace(/\./g, "");
    return (
      (host.includes(b) && bare !== `${b}com` && bare !== b) ||
      url.pathname.toLowerCase().includes(b)
    );
  });
  if (brandHit) {
    findings.push({
      id: "brand",
      title: "Brand keyword, mismatched domain",
      detail: `"${brandHit}" appears but the real domain is ${regDomain} — brands don't operate from look-alike hosts.`,
      severity: "critical",
      weight: 25,
      layers: ["content", "human"],
      stages: ["delivery", "exploitation"],
      suggestion: "A brand name appears but the domain does not match. Go to the brand's site directly instead.",
    });
  }

  // 11. Credential / urgency keywords in path or query
  const pathQuery = (url.pathname + url.search).toLowerCase();
  const credHits = CRED_KEYWORDS.filter((k) => pathQuery.includes(k));
  if (credHits.length >= 2) {
    findings.push({
      id: "urlKeywords",
      title: "Credential/urgency keywords",
      detail: `${credHits.length} urgency terms in path/query: ${credHits.slice(0, 4).join(", ")}.`,
      severity: "medium",
      weight: 12,
      layers: ["content", "human"],
      stages: ["exploitation"],
    });
  }

  // 12. Non-standard port
  if (url.port && !["80", "443"].includes(url.port)) {
    findings.push({
      id: "port",
      title: "Non-standard port",
      detail: `Port ${url.port} exposed in the URL — consumer services rarely run on odd ports.`,
      severity: "low",
      weight: 6,
      layers: ["network"],
      stages: ["delivery"],
    });
  }

  return finalize("url", raw, findings, (v, fs) => {
    if (v === "malicious") {
      const crit = fs.some((f) => f.severity === "critical");
      return crit ? "Phishing URL" : "Malicious URL";
    }
    if (v === "suspicious") return "Suspicious URL";
    return "Likely Safe URL";
  });
}

export const URL_SAMPLE_PHISH =
  "http://paypa1-secure-login.verify-account.xyz:8080/update/password?session=8842@bit.ly";
export const URL_SAMPLE_SAFE = "https://www.mozilla.org/en-US/firefox/new/";
