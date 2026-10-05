export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  explanation: string;
}

export const QUIZ: QuizQuestion[] = [
  {
    q: "You get an email from 'Your Bank' saying your account will be closed in 24 hours unless you click a link and verify. What is the safest move?",
    options: [
      "Click the link quickly so you don't miss the deadline",
      "Reply to the email asking if it's real",
      "Ignore the link, open your banking app or type the bank's address yourself",
      "Forward it to friends to see if they got it too",
    ],
    answer: 2,
    explanation:
      "Urgency plus a link is the classic phishing formula. Always reach the real service through a channel you control — the app or a typed/bookmarked address.",
  },
  {
    q: "Which of these URLs is the most suspicious?",
    options: [
      "https://accounts.google.com/signin",
      "https://paypal-secure-verify.login-update.xyz/auth",
      "https://www.github.com/login",
      "https://shop.apple.com/cart",
    ],
    answer: 1,
    explanation:
      "Brand words stitched with hyphens on an unrelated, high-abuse TLD (.xyz) is a phishing signature. The real domain is the part just before the TLD.",
  },
  {
    q: "A file arrives named 'invoice_2024.pdf.exe'. What is it?",
    options: [
      "A PDF invoice with a typo",
      "A Windows executable disguised as a PDF",
      "A compressed archive",
      "A corrupted file that's safe to open",
    ],
    answer: 1,
    explanation:
      "Windows hides known extensions by default, so victims see 'invoice_2024.pdf'. The real type is the last extension: .exe — a program that runs code.",
  },
  {
    q: "Someone calls claiming to be IT support and asks for your password to 'fix your mailbox'. You should…",
    options: [
      "Give it — IT needs it to do their job",
      "Give a fake password instead",
      "Hang up and report it; real IT never asks for passwords",
      "Ask them to email you the password request",
    ],
    answer: 2,
    explanation:
      "This is pretexting. Legitimate support teams never need your password — they have admin tools that don't require it.",
  },
  {
    q: "Which is the strongest defense if your password gets stolen?",
    options: [
      "A longer security question answer",
      "Multi-factor authentication",
      "Changing your wallpaper",
      "Using the same password but capitalized",
    ],
    answer: 1,
    explanation:
      "MFA means a stolen password alone isn't enough to get in. Passkeys and authenticator apps beat SMS codes, which can be SIM-swapped.",
  },
  {
    q: "You find a USB stick in the office parking lot labeled 'Payroll Q3'. What do you do?",
    options: [
      "Plug it in to see who it belongs to",
      "Plug it into a spare laptop, not yours",
      "Hand it to IT/security unopened",
      "Keep it for personal use",
    ],
    answer: 2,
    explanation:
      "This is baiting. Plugging in unknown media can auto-run malware or emulate a keyboard that types commands in seconds. Let professionals handle it.",
  },
  {
    q: "A text says: 'Package on hold — pay €1.99 customs fee: bit.ly/3xKp9Q'. This is…",
    options: [
      "Normal delivery procedure",
      "Smishing — SMS phishing using a shortener link",
      "A message from your mobile carrier",
      "Safe because the amount is small",
    ],
    answer: 1,
    explanation:
      "Small fees lower your guard while the link harvests card details. Carriers and couriers don't resolve holds via shortened links.",
  },
  {
    q: "What does HTTPS actually guarantee?",
    options: [
      "The site is safe and legitimate",
      "The connection is encrypted and the server proved its identity",
      "The site has been antivirus-scanned",
      "Nothing — it's just decoration",
    ],
    answer: 1,
    explanation:
      "HTTPS encrypts traffic and verifies the domain owner — but phishing sites can buy certificates too. Padlock ≠ trustworthy.",
  },
  {
    q: "Your password manager says a site you use was breached. Best next step?",
    options: [
      "Wait to see if anything happens",
      "Change that password — and any place you reused it",
      "Add an exclamation mark to the password",
      "Delete the account immediately",
    ],
    answer: 1,
    explanation:
      "Reuse is what turns one breach into many. Change the breached password and every duplicate, then enable MFA where possible.",
  },
  {
    q: "A pop-up says 'YOUR PC IS INFECTED — CALL 1-888-555-0199 NOW'. You should…",
    options: [
      "Call the number — it's probably Microsoft",
      "Click the pop-up to run the scan",
      "Close the browser via task manager; never call pop-up numbers",
      "Enter your card to unlock the screen",
    ],
    answer: 2,
    explanation:
      "This is scareware/tech-support fraud. Real antivirus never demands a phone call. If the tab is locked, end the browser process.",
  },
];
