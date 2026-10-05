import type { Finding, ScanResult } from "../types";
import { finalize } from "./shared";

/* Local heuristic analysis of email / SMS / chat text. */

const URGENCY = [
  "urgent", "immediately", "act now", "expires", "expired", "24 hours", "48 hours",
  "final notice", "last warning", "suspended", "will be closed", "limited time",
  "before it's too late", "right away", "asap",
];

const CRED_REQUESTS = [
  "password", "passcode", "otp", "one-time", "verification code", "ssn",
  "social security", "card number", "credit card", "cvv", "pin", "login to verify",
  "verify your account", "confirm your identity", "bank details", "full name and dob",
];

const LURES = [
  "winner", "you won", "prize", "lottery", "congratulations", "refund",
  "reward", "bonus", "free bitcoin", "giveaway", "claim your", "lucky draw",
  "exclusive offer", "selected you",
];

const THREATS = [
  "legal action", "lawsuit", "court", "arrest", "police will", "fine of",
  "account will be closed", "permanent suspension", "debt collection",
  "criminal charges",
];

const VISHING = [
  "call now", "call us immediately", "call within", "dial", "phone number below",
  "contact our support line", "call this number",
];

const GENERIC_GREETINGS = [
  "dear customer", "dear user", "dear member", "valued customer",
  "dear account holder", "dear client", "greetings,",
];

const BRANDS = [
  "paypal", "google", "apple", "microsoft", "amazon", "netflix", "bank",
  "irs", "dhl", "fedex", "ups", "linkedin", "coinbase", "chase",
];

function countUrls(text: string): number {
  const matches = text.match(/https?:\/\/[^\s<>")]+|www\.[^\s<>")]+/gi);
  return matches ? matches.length : 0;
}

function hostOf(u: string): string {
  try {
    const url = new URL(/^https?:/i.test(u) ? u : "http://" + u);
    return url.hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function scanText(raw: string): ScanResult {
  const findings: Finding[] = [];
  const text = raw.toLowerCase();

  // 1. Urgency pressure
  const urgencyHits = URGENCY.filter((k) => text.includes(k));
  if (urgencyHits.length) {
    findings.push({
      id: "urgency",
      title: "Urgency language",
      detail: `${urgencyHits.length} pressure phrase(s): \u201c${urgencyHits.slice(0, 3).join("\u201d, \u201c")}\u201d.`,
      severity: "medium",
      weight: 14,
      layers: ["content", "human"],
      stages: ["delivery", "exploitation"],
      suggestion: "Urgency is a pressure tactic. Slow down and verify through a channel you already trust.",
    });
  }

  // 2. Credential / PII requests
  const credHits = CRED_REQUESTS.filter((k) => text.includes(k));
  if (credHits.length) {
    findings.push({
      id: "cred",
      title: "Requests credentials / PII",
      detail: `Asks for: ${credHits.slice(0, 4).join(", ")}.`,
      severity: "high",
      weight: 22,
      layers: ["content", "human"],
      stages: ["exploitation", "actions"],
      suggestion: "This message asks for passwords, OTPs, or card details. No legitimate org requests these by message.",
    });
  }

  // 3. Reward / lure language
  const lureHits = LURES.filter((k) => text.includes(k));
  if (lureHits.length) {
    findings.push({
      id: "lure",
      title: "Reward / lure language",
      detail: `${lureHits.length} bait phrase(s): \u201c${lureHits.slice(0, 3).join("\u201d, \u201c")}\u201d.`,
      severity: "medium",
      weight: 12,
      layers: ["content", "human"],
      stages: ["delivery"],
    });
  }

  // 4. Threat / fear language
  const threatHits = THREATS.filter((k) => text.includes(k));
  if (threatHits.length) {
    findings.push({
      id: "threat",
      title: "Fear / legal-threat language",
      detail: `${threatHits.length} intimidation phrase(s): \u201c${threatHits.slice(0, 3).join("\u201d, \u201c")}\u201d.`,
      severity: "high",
      weight: 18,
      layers: ["content", "human"],
      stages: ["exploitation"],
      suggestion: "The threat of closure/legal action is designed to scare you. Verify directly with the organization.",
    });
  }

  // 5. Vishing — push to call
  const phonePattern = /(\+?\d[\d\s().-]{7,}\d)/.test(raw);
  const vishingHits = VISHING.filter((k) => text.includes(k));
  if (vishingHits.length || (phonePattern && (text.includes("call") || text.includes("phone")))) {
    findings.push({
      id: "vishing",
      title: "Push to call a number",
      detail: "Directing victims to a phone line is a classic vishing (voice phishing) pattern.",
      severity: "high",
      weight: 20,
      layers: ["human"],
      stages: ["exploitation", "actions"],
      suggestion: "It pushes you to call a number urgently — a vishing tactic. Verify using an official number you look up yourself.",
    });
  }

  // 6. Generic greeting
  const greetHit = GENERIC_GREETINGS.find((g) => text.includes(g));
  if (greetHit) {
    findings.push({
      id: "greeting",
      title: "Generic greeting",
      detail: `\u201c${greetHit}\u201d — real organizations usually address you by name.`,
      severity: "low",
      weight: 6,
      layers: ["content"],
      stages: ["delivery"],
    });
  }

  // 7. Multiple embedded links
  const linkCount = countUrls(raw);
  if (linkCount >= 3) {
    findings.push({
      id: "manyLinks",
      title: "Multiple embedded links",
      detail: `${linkCount} links present — mass link payloads raise the odds one is hostile.`,
      severity: "medium",
      weight: 10,
      layers: ["network", "content"],
      stages: ["delivery"],
    });
  }

  // 8. Link text / destination mismatch (HTML anchors)
  const anchors = [...raw.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  let mismatch = false;
  for (const a of anchors) {
    const hrefHost = hostOf(a[1]);
    const visible = a[2].replace(/<[^>]+>/g, "").trim();
    const visibleHost = hostOf(visible);
    if (hrefHost && visibleHost && visibleHost !== hrefHost) mismatch = true;
    else if (/https?:\/\//i.test(visible) && visibleHost !== hrefHost) mismatch = true;
  }
  if (mismatch) {
    findings.push({
      id: "linkMismatch",
      title: "Link text ≠ destination",
      detail: "At least one link shows one address but actually points somewhere else.",
      severity: "high",
      weight: 20,
      layers: ["content"],
      stages: ["delivery", "exploitation"],
      suggestion: "The link text does not match its real destination. Hover to reveal the true URL before clicking.",
    });
  }

  // 9. Spoofed sender header
  const fromMatch = raw.match(/from\s*:\s*"?([^"]+?)"?\s*<([^>]+)>/i);
  if (fromMatch) {
    const name = fromMatch[1].toLowerCase();
    const addr = fromMatch[2].toLowerCase();
    const addrDomain = addr.split("@")[1] || "";
    const brand = BRANDS.find((b) => name.includes(b));
    if (brand && addrDomain && !addrDomain.replace(/\./g, "").includes(brand.replace(/\s/g, ""))) {
      findings.push({
        id: "spoof",
        title: "Spoofed sender name",
        detail: `Display name claims \u201c${brand}\u201d but the address is ${addrDomain}.`,
        severity: "high",
        weight: 18,
        layers: ["content"],
        stages: ["delivery"],
        suggestion: "The sender name does not match the email address. Check the full address, not just the display name.",
      });
    }
  }

  // 10. Excessive caps / exclamation
  const letters = raw.replace(/[^a-zA-Z]/g, "");
  const caps = raw.replace(/[^A-Z]/g, "");
  const bangs = (raw.match(/!/g) || []).length;
  if ((letters.length > 20 && caps.length / letters.length > 0.45) || bangs >= 4) {
    findings.push({
      id: "caps",
      title: "Aggressive emphasis",
      detail: "Heavy ALL-CAPS or exclamation usage — emotional flooding to bypass careful reading.",
      severity: "low",
      weight: 5,
      layers: ["content", "human"],
      stages: ["delivery"],
    });
  }

  return finalize("text", raw, findings, (v, fs) => {
    if (v === "safe") return "Likely Legitimate";
    const has = (id: string) => fs.some((f) => f.id === id);
    if (has("vishing")) return "Vishing Attempt";
    if (raw.length < 160 && countUrls(raw) > 0) return "Smishing (SMS Phishing)";
    if (has("lure")) return "Baiting Message";
    if (fromMatch) return "Pretexting / Phishing Email";
    return "Phishing Message";
  });
}

export const TEXT_SAMPLE_PHISH = `From: PayPal Security <security@paypal-account-notice.xyz>
Dear Customer,

We detected UNUSUAL ACTIVITY on your account. Your account will be closed within 24 hours unless you verify your identity IMMEDIATELY.

Click here to confirm your password and card number: <a href="http://resolve-paypal.login-verify.xyz/session">https://www.paypal.com/security</a>

If you do not act now, legal action may be taken. Call our support line at +1 (888) 555-0142.

Act now! This is your final notice!!!`;

export const TEXT_SAMPLE_SAFE = `Hi Alex,

Lunch on Thursday still works for me. I booked the 12:30 table at the place near your office — the one with the good ramen.

No rush on the notes from yesterday, whenever you get a chance.

See you soon,
Sam`;
