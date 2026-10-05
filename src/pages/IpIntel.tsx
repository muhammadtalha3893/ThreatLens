import { useCallback, useState } from "react";
import {
  Globe2, ScanLine, Loader2, MapPin, Clock, Building2, Network,
  Server, AlertTriangle, ExternalLink, Crosshair, Wifi, LocateFixed,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import LiveBadge from "../components/LiveBadge";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";

interface IpInfo {
  ip: string;
  resolvedFrom?: string;
  city?: string;
  region?: string;
  countryName?: string;
  countryCode?: string;
  timezone?: string;
  org?: string;
  isp?: string;
  asn?: string;
  hostname?: string;
  latitude?: number;
  longitude?: number;
  provider: string;
}

interface RiskSignal {
  title: string;
  detail: string;
  weight: number;
}

const HOSTING_MARKERS = [
  "amazon", "aws", "google cloud", "google llc", "digitalocean", "ovh", "hetzner",
  "linode", "vultr", "azure", "microsoft", "cloudflare", "akamai", "oracle cloud",
  "alibaba", "hosting", "server", "vps", "datacenter", "data center", "leaseweb",
  "choopa", "hostinger", "contabo", "fastly",
];

/* ----------------------------- input handling ----------------------------- */

const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6_RE = /^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i;

function isIp(s: string): boolean {
  return IPV4_RE.test(s) || IPV6_RE.test(s);
}

function isValidHostname(s: string): boolean {
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(s);
}

/** Resolve a hostname to an IPv4 address via Cloudflare DNS-over-HTTPS (CORS-enabled). */
async function resolveHostname(host: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=A`,
      6000,
      { headers: { accept: "application/dns-json" } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { Answer?: { type: number; data: string }[] };
    const a = data.Answer?.find((x) => x.type === 1);
    return a?.data ?? null;
  } catch {
    return null;
  }
}

/* ------------------------------ geo providers ----------------------------- */

async function fromIpwhois(ip: string): Promise<IpInfo> {
  const res = await fetchWithTimeout(`https://ipwho.is/${ip}`, 6000);
  const d = await res.json();
  if (!d.success) throw new Error(d.message || "ipwho.is lookup failed");
  return {
    ip: d.ip,
    city: d.city,
    region: d.region,
    countryName: d.country,
    countryCode: d.country_code,
    timezone: d.timezone?.id,
    org: d.connection?.org,
    isp: d.connection?.isp,
    asn: d.connection?.asn ? `AS${d.connection.asn}` : undefined,
    latitude: d.latitude,
    longitude: d.longitude,
    provider: "ipwho.is",
  };
}

async function fromIpinfo(ip: string): Promise<IpInfo> {
  const res = await fetchWithTimeout(`https://ipinfo.io/${ip}/json`, 6000);
  if (!res.ok) throw new Error(`ipinfo.io responded ${res.status}`);
  const d = await res.json();
  if (d.bogon) throw new Error("ipinfo.io flagged this address as bogon");
  const [lat, lng] = typeof d.loc === "string" ? d.loc.split(",").map(Number) : [undefined, undefined];
  return {
    ip: d.ip ?? ip,
    hostname: d.hostname,
    city: d.city,
    region: d.region,
    countryName: d.country,
    countryCode: d.country,
    timezone: d.timezone,
    org: d.org,
    isp: d.org,
    asn: d.org ? d.org.split(" ")[0] : undefined,
    latitude: lat,
    longitude: lng,
    provider: "ipinfo.io",
  };
}

async function fromGeolocationDb(ip: string): Promise<IpInfo> {
  const res = await fetchWithTimeout(`https://geolocation-db.com/json/${ip}`, 6000);
  if (!res.ok) throw new Error(`geolocation-db responded ${res.status}`);
  const d = await res.json();
  if (!d.country_code) throw new Error("geolocation-db has no data for this address");
  return {
    ip,
    city: d.city ?? undefined,
    countryName: d.country_name,
    countryCode: d.country_code,
    latitude: d.latitude,
    longitude: d.longitude,
    provider: "geolocation-db.com",
  };
}

async function lookupGeo(ip: string): Promise<IpInfo> {
  // Race the two full-featured providers in parallel — first success wins.
  try {
    return await Promise.any([fromIpwhois(ip), fromIpinfo(ip)]);
  } catch {
    // Last-resort provider (geo only, no ASN/org)
    try {
      return await fromGeolocationDb(ip);
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "All geolocation providers failed");
    }
  }
}

/* ------------------------------- risk model ------------------------------- */

function analyzeRisk(info: IpInfo): { signals: RiskSignal[]; score: number } {
  const signals: RiskSignal[] = [];
  const org = `${info.org || ""} ${info.isp || ""}`.toLowerCase();

  if (HOSTING_MARKERS.some((m) => org.includes(m))) {
    signals.push({
      title: "Hosting / datacenter provider",
      detail: `Registered to "${info.org || info.isp}" — bulk hosting ranges are common for scanners and C2 nodes.`,
      weight: 25,
    });
  }

  const parts = info.ip.split(".").map(Number);
  if (parts.length === 4 && parts.every((n) => !Number.isNaN(n))) {
    if (parts[0] === 10 || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168)) {
      signals.push({
        title: "Private address space",
        detail: "RFC1918 range — not routable on the public internet.",
        weight: 10,
      });
    }
    if (parts[0] === 127) {
      signals.push({ title: "Loopback address", detail: "Points back at the local machine.", weight: 5 });
    }
  }

  if (!info.asn) {
    signals.push({
      title: "No ASN announced",
      detail: "Missing routing metadata can indicate ephemeral or abused infrastructure.",
      weight: 15,
    });
  }

  const score = Math.min(100, signals.reduce((s, x) => s + x.weight, 0));
  return { signals, score };
}

/* --------------------------------- page ---------------------------------- */

export default function IpIntel() {
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<"idle" | "looking" | "done" | "error">("idle");
  const [info, setInfo] = useState<IpInfo | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [tab, setTab] = useState<"overview" | "map" | "network" | "risk">("overview");

  const lookup = useCallback(async (target: string) => {
    const raw = target.trim().toLowerCase();
    setPhase("looking");
    setInfo(null);
    setError("");

    try {
      let ip = raw;
      let resolvedFrom: string | undefined;

      if (!raw) {
        setStatus("Detecting your public IP…");
        const res = await fetchWithTimeout("https://api.ipify.org/?format=json", 6000);
        const d = (await res.json()) as { ip: string };
        ip = d.ip;
      } else if (!isIp(raw)) {
        if (!isValidHostname(raw)) throw new Error("Enter a valid IP address or hostname");
        setStatus(`Resolving ${raw} via DNS-over-HTTPS…`);
        const resolved = await resolveHostname(raw);
        if (!resolved) throw new Error(`Could not resolve "${raw}" to an IP address`);
        resolvedFrom = raw;
        ip = resolved;
      }

      setStatus(`Querying geolocation providers for ${ip}…`);
      const data = await lookupGeo(ip);
      if (resolvedFrom) data.resolvedFrom = resolvedFrom;
      setInfo(data);
      setPhase("done");
      setTab("overview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed");
      setPhase("error");
    }
  }, []);

  const risk = info ? analyzeRisk(info) : null;
  const riskColor = risk && risk.score >= 40 ? "#cf6679" : risk && risk.score >= 20 ? "#d9a05b" : "#7fbf9f";

  return (
    <div>
      <PageHeader
        title="IP Intelligence"
        sub="Geolocation, ASN & hosting-risk intelligence"
        right={
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#7fbf9f] px-2.5 py-1 rounded-full border border-[#7fbf9f33] bg-[#7fbf9f0a]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7fbf9f] anim-breathe" /> live lookup
          </span>
        }
      />

      <div className="space-y-4 mb-6">
        <LiveBadge text="Live lookup — 3-provider geolocation chain with DNS hostname resolution" />
        <div className="panel p-5 sm:p-6">
          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9b97a4] block mb-2">
            IP address or hostname (empty = your own)
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookup(input)}
              placeholder="8.8.8.8 or github.com"
              spellCheck={false}
              className="flex-1 bg-[#201f24] border border-[#34323b] rounded-lg px-4 py-3 mono text-[13px] text-[#e9e7ec] placeholder:text-[#6f6c7a] outline-none focus:border-[#82c7d466] focus:shadow-[0_0_20px_-8px_rgba(130,199,212,0.5)] transition-all"
            />
            <button
              onClick={() => lookup(input)}
              disabled={phase === "looking"}
              className="px-6 py-3 rounded-lg bg-[#82c7d4] text-[#1b1a1f] display font-bold text-[13px] tracking-wide hover:shadow-[0_0_28px_-6px_#82c7d4] transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {phase === "looking" ? <Loader2 size={15} className="animate-spin" /> : <ScanLine size={15} />}
              Locate IP
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {["8.8.8.8", "1.1.1.1", "github.com", "cloudflare.com"].map((s) => (
              <button
                key={s}
                onClick={() => lookup(s)}
                className="px-3 py-1.5 rounded-lg border border-[#34323b] mono text-[11px] text-[#9b97a4] hover:text-[#82c7d4] hover:border-[#82c7d444] transition-colors"
              >
                {s}
              </button>
            ))}
            <button
              onClick={() => lookup("")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#82c7d433] mono text-[11px] text-[#82c7d4] hover:bg-[#82c7d40d] transition-colors"
            >
              <LocateFixed size={11} /> my IP
            </button>
          </div>
        </div>
      </div>

      {phase === "looking" && (
        <div className="panel relative overflow-hidden scanline p-8 text-center">
          <Globe2 size={26} className="mx-auto text-[#82c7d4] anim-breathe" />
          <div className="font-mono text-[12px] text-[#82c7d4] mt-3 tracking-wider">{status || "RESOLVING…"}</div>
          <div className="font-mono text-[10px] text-[#6f6c7a] mt-1">
            providers raced in parallel: ipwho.is · ipinfo.io · geolocation-db
          </div>
        </div>
      )}

      {phase === "error" && (
        <div className="panel p-6 border-[#cf667944] text-center">
          <AlertTriangle size={24} className="mx-auto text-[#cf6679]" />
          <div className="display text-[15px] font-semibold text-white mt-2">Lookup failed</div>
          <p className="text-[12px] text-[#9b97a4] mt-1 max-w-md mx-auto break-words">{error}</p>
          <button
            onClick={() => lookup(input)}
            className="mt-4 px-5 py-2 rounded-lg border border-[#34323b] text-[12px] text-[#b5b1bc] hover:text-[#82c7d4] hover:border-[#82c7d444] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {phase === "done" && info && risk && (
        <div className="anim-pop space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {([
              ["overview", "Overview"],
              ["map", "Map"],
              ["network", "Network / Hosting"],
              ["risk", "Risk"],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-3.5 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                  tab === id
                    ? "bg-[#82c7d414] border-[#82c7d43d] text-[#82c7d4]"
                    : "border-[#34323b] text-[#9b97a4] hover:text-[#e9e7ec] hover:border-[#3f3d47]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="panel p-5 sm:p-6">
            {tab === "overview" && (
              <div>
                <div className="mono text-2xl text-[#82c7d4] text-glow-cyan mb-1">{info.ip}</div>
                {info.resolvedFrom && (
                  <div className="font-mono text-[10.5px] text-[#9b97a4] mb-3">
                    resolved from <span className="text-[#a3b1cc]">{info.resolvedFrom}</span> via DNS-over-HTTPS
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  {[
                    { icon: MapPin, label: "Location", value: [info.city, info.region, info.countryName].filter(Boolean).join(", ") || "—" },
                    { icon: Crosshair, label: "Coordinates", value: info.latitude != null ? `${info.latitude}, ${info.longitude}` : "—" },
                    { icon: Clock, label: "Timezone", value: info.timezone || "—" },
                    { icon: Building2, label: "ISP / Org", value: info.org || info.isp || "—" },
                  ].map((row, i) => (
                    <div key={row.label} className="flex gap-3 p-3.5 rounded-xl border border-[#34323b] bg-[#232228]" style={{ animation: `reveal-up 0.35s ${i * 0.06}s both` }}>
                      <row.icon size={16} className="text-[#82c7d4] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6f6c7a]">{row.label}</div>
                        <div className="text-[13px] text-[#e9e7ec] mt-0.5 break-words">{row.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  {info.latitude != null && (
                    <a
                      href={`https://www.google.com/maps?q=${info.latitude},${info.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#34323b] text-[12px] text-[#b5b1bc] hover:text-[#82c7d4] hover:border-[#82c7d444] transition-colors"
                    >
                      <ExternalLink size={13} /> Open in Maps
                    </a>
                  )}
                  <span className="font-mono text-[9.5px] text-[#6f6c7a]">source: {info.provider}</span>
                </div>
              </div>
            )}

            {tab === "map" && (
              <div>
                {info.latitude != null ? (
                  <div className="rounded-xl overflow-hidden border border-[#34323b]">
                    <iframe
                      title="IP location map"
                      width="100%"
                      height="380"
                      style={{ border: 0, filter: "invert(0.92) hue-rotate(185deg) saturate(0.7)" }}
                      loading="lazy"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${info.longitude! - 1.2},${info.latitude! - 0.7},${info.longitude! + 1.2},${info.latitude! + 0.7}&layer=mapnik&marker=${info.latitude},${info.longitude}`}
                    />
                  </div>
                ) : (
                  <p className="text-[12px] text-[#6f6c7a]">No coordinates available for this address.</p>
                )}
              </div>
            )}

            {tab === "network" && (
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { icon: Network, label: "ASN", value: info.asn || "not announced" },
                  { icon: Server, label: "Organization", value: info.org || "unknown" },
                  { icon: Wifi, label: "ISP", value: info.isp || info.org || "unknown" },
                  { icon: Globe2, label: "Country", value: `${info.countryName || ""} (${info.countryCode || "?"})` },
                ].map((row, i) => (
                  <div key={row.label} className="flex gap-3 p-3.5 rounded-xl border border-[#34323b] bg-[#232228]" style={{ animation: `reveal-up 0.35s ${i * 0.06}s both` }}>
                    <row.icon size={16} className="text-[#8296b3] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6f6c7a]">{row.label}</div>
                      <div className="text-[13px] text-[#e9e7ec] mt-0.5 break-words">{row.value}</div>
                    </div>
                  </div>
                ))}
                {info.hostname && (
                  <div className="flex gap-3 p-3.5 rounded-xl border border-[#34323b] bg-[#232228] sm:col-span-2">
                    <Globe2 size={16} className="text-[#8296b3] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6f6c7a]">Reverse DNS</div>
                      <div className="mono text-[13px] text-[#e9e7ec] mt-0.5 break-all">{info.hostname}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "risk" && (
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="display text-4xl font-bold" style={{ color: riskColor, textShadow: `0 0 20px ${riskColor}55` }}>
                    {risk.score}
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#9b97a4]">Network Risk Score</div>
                    <div className="text-[11px] text-[#6f6c7a]">heuristic — hosting & metadata signals only</div>
                  </div>
                </div>
                {risk.signals.length === 0 ? (
                  <div className="flex items-center gap-2.5 p-4 rounded-xl border border-[#7fbf9f33] bg-[#7fbf9f08] text-[#7fbf9f] text-[13px]">
                    <Globe2 size={16} /> No elevated network-risk signals detected.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {risk.signals.map((s, i) => (
                      <div key={s.title} className="flex gap-3 p-3.5 rounded-xl border border-[#d9a05b33] bg-[#d9a05b0a]" style={{ animation: `reveal-up 0.35s ${i * 0.06}s both` }}>
                        <AlertTriangle size={15} className="text-[#d9a05b] shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[13px] font-semibold text-white">{s.title}</div>
                          <p className="text-[11.5px] text-[#b5b1bc] mt-0.5 leading-relaxed">{s.detail}</p>
                        </div>
                        <span className="mono text-[11px] text-[#d9a05b] ml-auto shrink-0">+{s.weight}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
