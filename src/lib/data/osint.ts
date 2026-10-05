import { fetchWithTimeout } from "../fetchWithTimeout";

export type ProbeStatus = "found" | "absent" | "unknown";
export type HuntMode = "server" | "client" | "simulated";

export interface ProfileMeta {
  name?: string;
  bio?: string;
  followers?: number;
  avatar?: string;
}

export interface ProbeResult {
  name: string;
  category: string;
  url: string;
  status: ProbeStatus;
  /** "verified" = confirmed via JSON API, "page" = page-level check */
  confidence?: "verified" | "page";
  /** e.g. login-wall warning */
  note?: string | null;
  /** rich profile data when the platform's API provides it */
  meta?: ProfileMeta | null;
}

const TIMEOUT = 6500;

/* ------------------------------------------------------------------ */
/* Client-side live checkers (CORS-enabled public APIs only).          */
/* Used automatically when the server-side hunt is unavailable, and    */
/* for the instant first-pass results while the full sweep runs.       */
/* ------------------------------------------------------------------ */

interface ClientPlatform {
  name: string;
  category: string;
  profileUrl: (u: string) => string;
  check: (u: string) => Promise<{ status: ProbeStatus; meta?: ProfileMeta | null }>;
}

async function statusCheck(apiUrl: string): Promise<ProbeStatus> {
  const res = await fetchWithTimeout(apiUrl, TIMEOUT);
  if (res.status === 200) return "found";
  if (res.status === 404 || res.status === 410) return "absent";
  return "unknown";
}

export const CLIENT_PLATFORMS: ClientPlatform[] = [
  {
    name: "GitHub",
    category: "Development",
    profileUrl: (u) => `https://github.com/${u}`,
    check: async (u) => {
      const res = await fetchWithTimeout(`https://api.github.com/users/${encodeURIComponent(u)}`, TIMEOUT);
      if (res.status === 404) return { status: "absent" };
      if (!res.ok) return { status: "unknown" };
      const d = (await res.json()) as { name?: string; bio?: string; followers?: number; avatar_url?: string };
      return {
        status: "found",
        meta: { name: d.name || undefined, bio: d.bio || undefined, followers: d.followers, avatar: d.avatar_url },
      };
    },
  },
  {
    name: "GitLab",
    category: "Development",
    profileUrl: (u) => `https://gitlab.com/${u}`,
    check: async (u) => {
      const res = await fetchWithTimeout(`https://gitlab.com/api/v4/users?username=${encodeURIComponent(u)}`, TIMEOUT);
      if (!res.ok) return { status: "unknown" };
      const data = (await res.json()) as { name?: string; avatar_url?: string }[];
      if (!Array.isArray(data) || data.length === 0) return { status: "absent" };
      return { status: "found", meta: { name: data[0].name, avatar: data[0].avatar_url } };
    },
  },
  {
    name: "Bitbucket",
    category: "Development",
    profileUrl: (u) => `https://bitbucket.org/${u}/`,
    check: async (u) => ({ status: await statusCheck(`https://api.bitbucket.org/2.0/users/${encodeURIComponent(u)}`) }),
  },
  {
    name: "Codeberg",
    category: "Development",
    profileUrl: (u) => `https://codeberg.org/${u}`,
    check: async (u) => ({ status: await statusCheck(`https://codeberg.org/api/v1/users/${encodeURIComponent(u)}`) }),
  },
  {
    name: "Dev.to",
    category: "Development",
    profileUrl: (u) => `https://dev.to/${u}`,
    check: async (u) => ({ status: await statusCheck(`https://dev.to/api/users/by_username?url=${encodeURIComponent(u)}`) }),
  },
  {
    name: "Keybase",
    category: "Development",
    profileUrl: (u) => `https://keybase.io/${u}`,
    check: async (u) => {
      const res = await fetchWithTimeout(`https://keybase.io/_/api/1.0/user/lookup.json?usernames=${encodeURIComponent(u)}`, TIMEOUT);
      if (!res.ok) return { status: "unknown" };
      const data = (await res.json()) as { them?: { profile?: { full_name?: string; url?: string }; pictures?: { primary?: { url?: string } } }[] | null };
      const entry = data.them && data.them[0];
      if (!entry) return { status: "absent" };
      return {
        status: "found",
        meta: { name: entry.profile?.full_name, avatar: entry.pictures?.primary?.url },
      };
    },
  },
  {
    name: "Hacker News",
    category: "Development",
    profileUrl: (u) => `https://news.ycombinator.com/user?id=${u}`,
    check: async (u) => {
      const res = await fetchWithTimeout(`https://hacker-news.firebaseio.com/v0/user/${encodeURIComponent(u)}.json`, TIMEOUT);
      if (!res.ok) return { status: "unknown" };
      const data = await res.json();
      return data ? { status: "found", meta: { bio: data.about ? String(data.about).replace(/<[^>]+>/g, "").slice(0, 140) : undefined } } : { status: "absent" };
    },
  },
  {
    name: "Mastodon",
    category: "Social",
    profileUrl: (u) => `https://mastodon.social/@${u}`,
    check: async (u) => {
      const res = await fetchWithTimeout(`https://mastodon.social/api/v1/accounts/lookup?acct=${encodeURIComponent(u)}`, TIMEOUT);
      if (res.status === 404) return { status: "absent" };
      if (!res.ok) return { status: "unknown" };
      const d = (await res.json()) as { display_name?: string; note?: string; followers_count?: number; avatar?: string };
      return {
        status: "found",
        meta: {
          name: d.display_name || undefined,
          bio: d.note ? String(d.note).replace(/<[^>]+>/g, "").slice(0, 140) : undefined,
          followers: d.followers_count,
          avatar: d.avatar,
        },
      };
    },
  },
  {
    name: "Bluesky",
    category: "Social",
    profileUrl: (u) => `https://bsky.app/profile/${u}.bsky.social`,
    check: async (u) => {
      const res = await fetchWithTimeout(
        `https://public.api.bsky.app/v1/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(u)}.bsky.social`,
        TIMEOUT
      );
      if (res.status === 400 || res.status === 404) return { status: "absent" };
      if (!res.ok) return { status: "unknown" };
      const d = (await res.json()) as { displayName?: string; description?: string; followersCount?: number; avatar?: string };
      return {
        status: "found",
        meta: { name: d.displayName, bio: d.description?.slice(0, 140), followers: d.followersCount, avatar: d.avatar },
      };
    },
  },
  {
    name: "AniList",
    category: "Community",
    profileUrl: (u) => `https://anilist.co/user/${u}/`,
    check: async (u) => {
      const res = await fetchWithTimeout("https://graphql.anilist.co", TIMEOUT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "query($name:String){User(name:$name){id name avatar{large}}}",
          variables: { name: u },
        }),
      });
      const data = (await res.json()) as { data?: { User?: { name?: string; avatar?: { large?: string } } } };
      if (!data.data?.User) return { status: "absent" };
      return { status: "found", meta: { name: data.data.User.name, avatar: data.data.User.avatar?.large } };
    },
  },
  {
    name: "Stack Overflow",
    category: "Community",
    profileUrl: (u) => `https://stackoverflow.com/users?search=${u}`,
    check: async (u) => {
      const res = await fetchWithTimeout(
        `https://api.stackexchange.com/2.3/users?inname=${encodeURIComponent(u)}&site=stackoverflow`,
        TIMEOUT
      );
      if (!res.ok) return { status: "unknown" };
      const data = (await res.json()) as { items?: { display_name?: string; profile_image?: string; reputation?: number }[] };
      if (!data.items || data.items.length === 0) return { status: "absent" };
      return {
        status: "found",
        meta: { name: data.items[0].display_name, avatar: data.items[0].profile_image, followers: data.items[0].reputation },
      };
    },
  },
  {
    name: "Chess.com",
    category: "Community",
    profileUrl: (u) => `https://www.chess.com/member/${u}`,
    check: async (u) => {
      const res = await fetchWithTimeout(`https://api.chess.com/pub/player/${encodeURIComponent(u)}`, TIMEOUT);
      if (res.status === 404) return { status: "absent" };
      if (!res.ok) return { status: "unknown" };
      const d = (await res.json()) as { name?: string; avatar?: string };
      return { status: "found", meta: { name: d.name, avatar: d.avatar } };
    },
  },
];

/** Platforms that still block all automated verification — manual quick-links. */
export const MANUAL_CHECKS = [
  { name: "Facebook", url: (u: string) => `https://www.facebook.com/${u}` },
  { name: "LinkedIn", url: (u: string) => `https://www.linkedin.com/in/${u}` },
  { name: "Threads", url: (u: string) => `https://www.threads.net/@${u}` },
  { name: "Truth Social", url: (u: string) => `https://truthsocial.com/@${u}` },
  { name: "VK", url: (u: string) => `https://vk.com/${u}` },
  { name: "Rumble", url: (u: string) => `https://rumble.com/user/${u}` },
  { name: "Odysee", url: (u: string) => `https://odysee.com/@${u}` },
  { name: "Gettr", url: (u: string) => `https://gettr.com/user/${u}` },
];

/** Run all client-side live checks in parallel; never throws. */
export async function clientHunt(username: string): Promise<{ results: ProbeResult[]; liveChecks: number }> {
  const settled = await Promise.allSettled(
    CLIENT_PLATFORMS.map(async (p) => {
      const { status, meta } = await p.check(username);
      return {
        name: p.name,
        category: p.category,
        url: p.profileUrl(username),
        status,
        confidence: "verified" as const,
        meta: meta ?? null,
      };
    })
  );
  const results: ProbeResult[] = settled.map((s, i) =>
    s.status === "fulfilled"
      ? s.value
      : {
          name: CLIENT_PLATFORMS[i].name,
          category: CLIENT_PLATFORMS[i].category,
          url: CLIENT_PLATFORMS[i].profileUrl(username),
          status: "unknown",
          confidence: "verified" as const,
          meta: null,
        }
  );
  const liveChecks = results.filter((r) => r.status !== "unknown").length;
  return { results, liveChecks };
}

/** Deterministic offline fallback (only if every live path fails). */
export function simulateHunt(username: string): ProbeResult[] {
  let h = 2166136261;
  for (let i = 0; i < username.length; i++) {
    h ^= username.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967295;
  };
  return CLIENT_PLATFORMS.map((p) => {
    const r = rand();
    return {
      name: p.name,
      category: p.category,
      url: p.profileUrl(username),
      status: (r < 0.34 ? "found" : r < 0.8 ? "absent" : "unknown") as ProbeStatus,
      confidence: "page" as const,
      meta: null,
    };
  });
}
