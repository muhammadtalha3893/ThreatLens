export type ThreatCategory = "Social Engineering" | "Malware" | "Network" | "Identity";

export interface ThreatEntry {
  id: string;
  name: string;
  aka: string;
  category: ThreatCategory;
  definition: string;
  pattern: string;
  signs: string[];
  prevention: string[];
}

export const THREATS: ThreatEntry[] = [
  {
    id: "phishing",
    name: "Phishing",
    aka: "Credential harvesting",
    category: "Social Engineering",
    definition:
      "Mass impersonation messages that steer victims to fake login pages or trick them into revealing credentials.",
    pattern:
      "A message posing as a bank or platform warns of 'unusual activity' and links to a look-alike domain that captures whatever is typed.",
    signs: [
      "Sender domain that almost — but doesn't quite — match the real brand",
      "Urgency and deadlines measured in hours",
      "Links whose hover destination differs from the visible text",
      "Requests to 'verify' passwords or payment details",
    ],
    prevention: [
      "Navigate to services by typing the domain or using bookmarks",
      "Enable MFA everywhere so stolen passwords alone are useless",
      "Report suspicious mail to your security team before deleting",
    ],
  },
  {
    id: "spear-phishing",
    name: "Spear Phishing",
    aka: "Whaling (when targeting executives)",
    category: "Social Engineering",
    definition:
      "Personalized phishing aimed at a specific individual, built from research about their role, contacts and projects.",
    pattern:
      "An email referencing a real project or colleague asks for a small, plausible favor — often an invoice or a login 'fix'.",
    signs: [
      "Unexpected requests from someone you know but via an unusual channel",
      "Details that are almost right (names, project titles) but slightly off",
      "Pressure to bypass normal approval steps",
    ],
    prevention: [
      "Verify unusual requests out-of-band (call the person)",
      "Limit public org-chart and project detail exposure",
      "Enforce dual approval for payments and access changes",
    ],
  },
  {
    id: "smishing",
    name: "Smishing",
    aka: "SMS phishing",
    category: "Social Engineering",
    definition:
      "Phishing delivered by text message, exploiting the trust people place in their phone's notification stream.",
    pattern:
      "A parcel 'delivery problem', a bank 'fraud alert', or a toll-road 'unpaid fee' text with a shortened link.",
    signs: [
      "Shortened or odd-looking links in SMS",
      "Messages that create instant time pressure",
      "Requests for card details to 'release' something",
    ],
    prevention: [
      "Never tap links in unexpected texts — use the official app",
      "Forward spam texts to your carrier's reporting number",
      "Remember banks never ask for OTPs by SMS reply",
    ],
  },
  {
    id: "vishing",
    name: "Vishing",
    aka: "Voice phishing",
    category: "Social Engineering",
    definition:
      "Phone-based manipulation where the attacker plays a trusted role — bank fraud desk, IT support, tax authority.",
    pattern:
      "A call claims your account is compromised and walks you through 'verification' that actually hands over codes or access.",
    signs: [
      "Caller pressures you to stay on the line",
      "Requests one-time codes read aloud",
      "Spoofed caller ID matching a real institution",
    ],
    prevention: [
      "Hang up and call back on a number you source yourself",
      "Never read OTPs or passwords to any caller",
      "Agree on family/colleague safe-words for emergencies",
    ],
  },
  {
    id: "baiting",
    name: "Baiting",
    aka: "Curiosity trap",
    category: "Social Engineering",
    definition:
      "Leaving tempting physical or digital bait — infected USB sticks, fake downloads, 'leaked' media — for victims to pick up.",
    pattern:
      "A USB labeled 'Payroll Q3' left in a lobby autoruns malware when plugged into a curious employee's laptop.",
    signs: [
      "Unexplained storage devices or QR codes in public areas",
      "Free downloads of paid software or media",
      "QR codes that paste over legitimate printed ones",
    ],
    prevention: [
      "Never plug found media into work devices — hand it to IT",
      "Disable autorun and block unknown USB classes",
      "Scan QR codes with a previewing reader before opening",
    ],
  },
  {
    id: "pretexting",
    name: "Pretexting",
    aka: "Fabricated scenario",
    category: "Social Engineering",
    definition:
      "Building a believable invented scenario to establish authority and extract data or access.",
    pattern:
      "'This is IT — we're migrating mailboxes tonight, I need your current password to carry your data across.'",
    signs: [
      "Strangers citing internal jargon to sound legitimate",
      "Requests framed as exceptional, one-time exceptions",
      "Reluctance to provide a ticket number or callback path",
    ],
    prevention: [
      "Require identity verification callbacks for all support asks",
      "Train staff that IT never asks for passwords",
      "Log and report every unusual access request",
    ],
  },
  {
    id: "ransomware",
    name: "Ransomware",
    aka: "Extortion malware",
    category: "Malware",
    definition:
      "Malware that encrypts files (and often exfiltrates them) and demands payment for restoration.",
    pattern:
      "A macro-laden attachment or stolen RDP login drops an encryptor; hours later screens show a ransom note.",
    signs: [
      "Files renamed with unfamiliar extensions",
      "Sudden CPU/disk churn from unknown processes",
      "Shadow copies and backups being deleted",
    ],
    prevention: [
      "Offline or immutable backups tested regularly",
      "Macro controls and application allow-listing",
      "EDR with behavior-based ransomware detection",
    ],
  },
  {
    id: "credential-stuffing",
    name: "Credential Stuffing",
    aka: "Password replay",
    category: "Identity",
    definition:
      "Automated replay of username/password pairs leaked from one breach against many other services.",
    pattern:
      "Bots try millions of breached combos against a login page; reused passwords let them in at scale.",
    signs: [
      "Login alerts from unfamiliar locations in bursts",
      "Spikes in failed logins on account dashboards",
      "Account changes you didn't make",
    ],
    prevention: [
      "Unique password per site via a password manager",
      "MFA — especially TOTP/passkeys over SMS",
      "HaveIBeenPwned-style breach monitoring",
    ],
  },
  {
    id: "typosquatting",
    name: "Typosquatting",
    aka: "URL hijacking",
    category: "Network",
    definition:
      "Registering domains that are common misspellings or look-alikes of popular sites to catch typing errors.",
    pattern:
      "g00gle-ads or faceb00k-login domains serve fake pages or malware to anyone who mistypes or misreads a link.",
    signs: [
      "Swapped letters, extra hyphens, or wrong TLD",
      "Homoglyph characters from other alphabets",
      "Ads or search results pointing at odd domains",
    ],
    prevention: [
      "Check the address bar character by character",
      "Use bookmarks for sensitive services",
      "DNS filtering that blocks newly registered look-alikes",
    ],
  },
  {
    id: "evil-twin",
    name: "Evil Twin Wi-Fi",
    aka: "Rogue access point",
    category: "Network",
    definition:
      "A fake wireless access point that clones a legitimate network name to intercept traffic.",
    pattern:
      "In an airport or café, 'Free_Airport_WiFi' is duplicated by an attacker who can read everything sent over it.",
    signs: [
      "Duplicate SSIDs with slightly different signal strength",
      "Open networks asking no questions at all",
      "Certificate warnings when browsing HTTPS sites",
    ],
    prevention: [
      "Use a VPN on any public Wi-Fi",
      "Forget networks you no longer use",
      "Never enter credentials on open, unencrypted networks",
    ],
  },
  {
    id: "session-hijacking",
    name: "Session Hijacking",
    aka: "Cookie theft",
    category: "Network",
    definition:
      "Stealing an authenticated session token so the attacker can act as the victim without a password.",
    pattern:
      "Malware or an XSS flaw exports browser cookies; the attacker imports them and is 'logged in' instantly.",
    signs: [
      "Sessions active on devices you don't recognize",
      "Logouts that don't stick",
      "Actions performed while you were offline",
    ],
    prevention: [
      "Short session lifetimes with re-auth for sensitive actions",
      "HttpOnly + Secure cookie flags on services you build",
      "Log out on shared machines and keep browsers patched",
    ],
  },
  {
    id: "malvertising",
    name: "Malvertising",
    aka: "Malicious advertising",
    category: "Malware",
    definition:
      "Malware distribution through legitimate advertising networks via infected or fraudulent ad creatives.",
    pattern:
      "A fake 'your PC is infected' pop-up or a poisoned ad redirects to a scareware download page.",
    signs: [
      "Full-screen warnings claiming to scan your machine",
      "Ads that trigger downloads without clicks",
      "Redirect chains through many unknown domains",
    ],
    prevention: [
      "Use an ad-blocker and keep browsers updated",
      "Never call numbers shown in pop-ups",
      "Close the tab via task manager if it locks the screen",
    ],
  },
];

export const THREAT_CATEGORIES: ("All" | ThreatCategory)[] = [
  "All",
  "Social Engineering",
  "Malware",
  "Network",
  "Identity",
];
