/**
 * Server-side OSINT hunt.
 *
 * Checks whether a PUBLIC profile exists for a username across ~90 platforms.
 * Detection strategies are chosen per platform so that a "found" verdict is
 * never produced by a bot-block page or a site that answers 200 to everything:
 *
 *  - "api"         : JSON endpoint with a judge function — strongest verification.
 *                    The judge returns "found" | "absent" | "unknown" (blocked).
 *                    May also extract profile metadata (name/bio/followers/avatar).
 *  - "status"      : 200/301/302 => found, 404/410 => absent, else unknown
 *  - "body"        : 200 + foundMarker => found, 200 w/o => absent
 *  - "bodyAbsent"  : 200 + absentMarker => absent, else found
 *  - "bodyUnknown" : 200 + marker => found, 404 => absent, else unknown
 *
 * Only already-public pages are touched. Runs server-side so browser CORS
 * never limits coverage.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const PER_PLATFORM_TIMEOUT = 5000;

const PLATFORMS = [
  /* ============================ SOCIAL ============================ */
  {
    name: "Instagram", category: "Social",
    url: (u) => `https://www.instagram.com/${u}/`,
    apiUrl: (u) => `https://www.instagram.com/api/v1/users/web_profile_info/?username=${u}`,
    headers: { "x-ig-app-id": "936619743392459" },
    mode: "api",
    judge: (text, status) => {
      if ([404, 410].includes(status)) return "absent";
      if (!status || status >= 400) return "unknown";
      try {
        return JSON.parse(text).data?.user ? "found" : "unknown";
      } catch {
        return "unknown";
      }
    },
    meta: (text) => {
      try {
        const user = JSON.parse(text).data?.user;
        if (!user) return null;
        return {
          name: user.full_name || undefined,
          bio: user.biography ? String(user.biography).slice(0, 140) : undefined,
          followers: user.edge_followed_by?.count,
          avatar: user.profile_pic_url || undefined,
        };
      } catch {
        return null;
      }
    },
    note: "May require login to view the profile on Instagram itself.",
  },
  {
    name: "TikTok", category: "Social",
    url: (u) => `https://www.tiktok.com/@${u}`,
    apiUrl: (u) => `https://www.tiktok.com/api/user/detail/?uniqueId=${u}`,
    mode: "api",
    judge: (text, status) => {
      if (!status || status >= 400) return "unknown";
      try {
        const d = JSON.parse(text);
        if (d.userInfo?.user) return "found";
        if (d.statusCode === 10202 || d.status_code === 10202) return "absent";
        return "unknown"; // blocked / captcha — never guess
      } catch {
        return "unknown";
      }
    },
    meta: (text) => {
      try {
        const user = JSON.parse(text).userInfo?.user;
        if (!user) return null;
        return {
          name: user.nickname || undefined,
          bio: user.signature ? String(user.signature).slice(0, 140) : undefined,
          followers: user.followerCount,
          avatar: user.avatarThumb || user.avatarMedium || undefined,
        };
      } catch {
        return null;
      }
    },
    note: "TikTok may show a captcha to some visitors.",
  },
  {
    name: "X / Twitter", category: "Social",
    url: (u) => `https://x.com/${u}`,
    apiUrl: (u) => `https://syndication.twitter.com/srv/timeline-profile/screen-name/${u}`,
    mode: "api",
    judge: (text, status) => {
      if ([404, 410].includes(status)) return "absent";
      if (!status || status >= 400) return "unknown"; // 429 rate-limit => unknown
      return text.includes('"screen_name"') ? "found" : "unknown";
    },
    note: "X may rate-limit anonymous views.",
  },
  { name: "Snapchat", category: "Social", url: (u) => `https://www.snapchat.com/add/${u}`, mode: "status", note: "May require login to view the profile." },
  { name: "Reddit", category: "Social", url: (u) => `https://www.reddit.com/user/${u}`, mode: "status" },
  {
    name: "Telegram", category: "Social",
    url: (u) => `https://t.me/${u}`,
    mode: "body",
    foundMarker: "tgme_page_title",
    meta: (text) => {
      try {
        const name = text.match(/tgme_page_title[^>]*>\s*<span[^>]*>([^<]*)</);
        const desc = text.match(/tgme_page_description[^>]*>([\s\S]*?)<\/div>/);
        const photo = text.match(/tgme_page_photo[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/);
        if (!name) return null;
        return {
          name: name[1].trim() || undefined,
          bio: desc ? desc[1].replace(/<[^>]+>/g, "").trim().slice(0, 140) : undefined,
          avatar: photo ? photo[1] : undefined,
        };
      } catch {
        return null;
      }
    },
  },
  { name: "Mastodon", category: "Social", url: (u) => `https://mastodon.social/@${u}`, mode: "status" },
  {
    name: "Bluesky", category: "Social",
    url: (u) => `https://bsky.app/profile/${u}.bsky.social`,
    apiUrl: (u) => `https://public.api.bsky.app/v1/xrpc/app.bsky.actor.getProfile?actor=${u}.bsky.social`,
    mode: "api",
    judge: (text, status) => {
      if (status === 200) return "found";
      if ([400, 404].includes(status)) return "absent";
      return "unknown";
    },
    meta: (text) => {
      try {
        const d = JSON.parse(text);
        if (!d.did) return null;
        return {
          name: d.displayName || undefined,
          bio: d.description ? String(d.description).slice(0, 140) : undefined,
          followers: d.followersCount,
          avatar: d.avatar || undefined,
        };
      } catch {
        return null;
      }
    },
  },
  { name: "Pinterest", category: "Social", url: (u) => `https://www.pinterest.com/${u}/`, mode: "body", foundMarker: "- Profile | Pinterest" },
  { name: "Tumblr", category: "Social", url: (u) => `https://${u}.tumblr.com`, mode: "status" },
  { name: "YouTube", category: "Social", url: (u) => `https://www.youtube.com/@${u}`, mode: "bodyUnknown", foundMarker: "channelId",
    meta: (text) => {
      const t = text.match(/<meta property="og:title" content="([^"]*)"/);
      if (!t) return null;
      const name = t[1].replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
      return { name: name || undefined };
    },
  },
  { name: "Twitch", category: "Social", url: (u) => `https://www.twitch.tv/${u}`, mode: "status" },
  { name: "Vero", category: "Social", url: (u) => `https://vero.co/${u}`, mode: "status" },
  { name: "Gab", category: "Social", url: (u) => `https://gab.com/${u}`, mode: "status" },
  { name: "Pixelfed", category: "Social", url: (u) => `https://pixelfed.social/${u}`, mode: "status" },
  { name: "Disqus", category: "Social", url: (u) => `https://disqus.com/by/${u}/`, mode: "status" },
  { name: "Linktree", category: "Social", url: (u) => `https://linktr.ee/${u}`, mode: "status" },
  { name: "Carrd", category: "Social", url: (u) => `https://${u}.carrd.co`, mode: "status" },
  { name: "Gravatar", category: "Social", url: (u) => `https://en.gravatar.com/${u}`, mode: "status" },
  { name: "About.me", category: "Social", url: (u) => `https://about.me/${u}`, mode: "status" },
  { name: "Ello", category: "Social", url: (u) => `https://ello.co/${u}`, mode: "status" },
  { name: "Lemmy", category: "Social", url: (u) => `https://lemmy.world/u/${u}`, mode: "status" },
  { name: "OK.ru", category: "Social", url: (u) => `https://ok.ru/${u}`, mode: "status" },

  /* ========================== DEVELOPMENT ========================= */
  {
    name: "GitHub", category: "Development",
    url: (u) => `https://github.com/${u}`,
    apiUrl: (u) => `https://api.github.com/users/${u}`,
    mode: "api",
    judge: (text, status) => {
      if ([404, 410].includes(status)) return "absent";
      if (status === 200) return "found";
      return "unknown"; // 403 = rate-limited, never guess
    },
    meta: (text) => {
      try {
        const d = JSON.parse(text);
        if (!d.login) return null;
        return {
          name: d.name || undefined,
          bio: d.bio ? String(d.bio).slice(0, 140) : undefined,
          followers: d.followers,
          avatar: d.avatar_url || undefined,
        };
      } catch {
        return null;
      }
    },
  },
  {
    name: "GitLab", category: "Development",
    url: (u) => `https://gitlab.com/${u}`,
    apiUrl: (u) => `https://gitlab.com/api/v4/users?username=${u}`,
    mode: "api",
    judge: (text, status) => {
      if (!status || status >= 400) return "unknown";
      try {
        const arr = JSON.parse(text);
        return Array.isArray(arr) && arr.length > 0 ? "found" : "absent";
      } catch {
        return "unknown";
      }
    },
    meta: (text) => {
      try {
        const arr = JSON.parse(text);
        if (!Array.isArray(arr) || !arr[0]) return null;
        return { name: arr[0].name || arr[0].username || undefined, avatar: arr[0].avatar_url || undefined };
      } catch {
        return null;
      }
    },
  },
  { name: "Bitbucket", category: "Development", url: (u) => `https://bitbucket.org/${u}/`, mode: "status" },
  { name: "Codeberg", category: "Development", url: (u) => `https://codeberg.org/${u}`, mode: "status" },
  { name: "Dev.to", category: "Development", url: (u) => `https://dev.to/${u}`, mode: "status" },
  { name: "npm", category: "Development", url: (u) => `https://www.npmjs.com/~${u}`, mode: "status" },
  { name: "PyPI", category: "Development", url: (u) => `https://pypi.org/user/${u}/`, mode: "status" },
  { name: "Docker Hub", category: "Development", url: (u) => `https://hub.docker.com/u/${u}`, mode: "status" },
  { name: "RubyGems", category: "Development", url: (u) => `https://rubygems.org/profiles/${u}`, mode: "status" },
  { name: "Packagist", category: "Development", url: (u) => `https://packagist.org/users/${u}/`, mode: "status" },
  { name: "crates.io", category: "Development", url: (u) => `https://crates.io/users/${u}`, mode: "status" },
  { name: "Hacker News", category: "Development", url: (u) => `https://news.ycombinator.com/user?id=${u}`, mode: "bodyAbsent", absentMarker: "No such user" },
  { name: "Lobsters", category: "Development", url: (u) => `https://lobste.rs/u/${u}`, mode: "status" },
  { name: "Keybase", category: "Development", url: (u) => `https://keybase.io/${u}`, mode: "status" },
  { name: "Replit", category: "Development", url: (u) => `https://replit.com/@${u}`, mode: "status" },

  /* =========================== CREATIVE =========================== */
  { name: "Medium", category: "Creative", url: (u) => `https://medium.com/@${u}`, mode: "status" },
  { name: "CodePen", category: "Creative", url: (u) => `https://codepen.io/${u}`, mode: "status" },
  { name: "Dribbble", category: "Creative", url: (u) => `https://dribbble.com/${u}`, mode: "status" },
  { name: "Behance", category: "Creative", url: (u) => `https://www.behance.net/${u}`, mode: "status" },
  { name: "ArtStation", category: "Creative", url: (u) => `https://www.artstation.com/${u}`, mode: "status" },
  { name: "DeviantArt", category: "Creative", url: (u) => `https://www.deviantart.com/${u}`, mode: "status" },
  { name: "Vimeo", category: "Creative", url: (u) => `https://vimeo.com/${u}`, mode: "status" },
  { name: "Flickr", category: "Creative", url: (u) => `https://www.flickr.com/people/${u}`, mode: "status" },
  { name: "SoundCloud", category: "Creative", url: (u) => `https://soundcloud.com/${u}`, mode: "status" },
  { name: "Bandcamp", category: "Creative", url: (u) => `https://${u}.bandcamp.com`, mode: "status" },
  { name: "Mixcloud", category: "Creative", url: (u) => `https://www.mixcloud.com/${u}/`, mode: "status" },
  { name: "Audiomack", category: "Creative", url: (u) => `https://audiomack.com/${u}`, mode: "status" },
  { name: "Last.fm", category: "Creative", url: (u) => `https://www.last.fm/user/${u}`, mode: "status" },
  { name: "Letterboxd", category: "Creative", url: (u) => `https://letterboxd.com/${u}/`, mode: "status" },
  { name: "Wattpad", category: "Creative", url: (u) => `https://www.wattpad.com/user/${u}`, mode: "status" },
  { name: "SlideShare", category: "Creative", url: (u) => `https://www.slideshare.net/${u}`, mode: "status" },
  { name: "500px", category: "Creative", url: (u) => `https://500px.com/${u}`, mode: "status" },
  { name: "Substack", category: "Creative", url: (u) => `https://${u}.substack.com`, mode: "status" },
  { name: "Hashnode", category: "Creative", url: (u) => `https://hashnode.com/@${u}`, mode: "status" },

  /* =========================== COMMUNITY ========================== */
  { name: "Steam", category: "Community", url: (u) => `https://steamcommunity.com/id/${u}`, mode: "bodyAbsent", absentMarker: "The specified profile could not be found" },
  { name: "itch.io", category: "Community", url: (u) => `https://${u}.itch.io`, mode: "status" },
  { name: "Roblox", category: "Community", url: (u) => `https://www.roblox.com/user.aspx?username=${u}`, mode: "status" },
  { name: "Chess.com", category: "Community", url: (u) => `https://www.chess.com/member/${u}`, mode: "status" },
  { name: "MyAnimeList", category: "Community", url: (u) => `https://myanimelist.net/profile/${u}`, mode: "status" },
  { name: "Kaggle", category: "Community", url: (u) => `https://www.kaggle.com/${u}`, mode: "status" },
  { name: "HackerRank", category: "Community", url: (u) => `https://www.hackerrank.com/${u}`, mode: "status" },
  { name: "LeetCode", category: "Community", url: (u) => `https://leetcode.com/${u}/`, mode: "status" },
  { name: "Codeforces", category: "Community", url: (u) => `https://codeforces.com/profile/${u}`, mode: "status" },
  { name: "TryHackMe", category: "Community", url: (u) => `https://tryhackme.com/${u}`, mode: "status" },
  { name: "Hugging Face", category: "Community", url: (u) => `https://huggingface.co/${u}`, mode: "status" },
  { name: "Goodreads", category: "Community", url: (u) => `https://www.goodreads.com/${u}`, mode: "status" },
  { name: "Duolingo", category: "Community", url: (u) => `https://www.duolingo.com/profile/${u}`, mode: "status" },

  /* ======================= COMMERCE / OTHER ======================= */
  { name: "Patreon", category: "Other", url: (u) => `https://www.patreon.com/${u}`, mode: "status" },
  { name: "Ko-fi", category: "Other", url: (u) => `https://ko-fi.com/${u}`, mode: "status" },
  { name: "Buy Me a Coffee", category: "Other", url: (u) => `https://buymeacoffee.com/${u}`, mode: "status" },
  { name: "Gumroad", category: "Other", url: (u) => `https://${u}.gumroad.com`, mode: "status" },
  { name: "Etsy", category: "Other", url: (u) => `https://www.etsy.com/shop/${u}`, mode: "status" },
  { name: "eBay", category: "Other", url: (u) => `https://www.ebay.com/usr/${u}`, mode: "status" },
  { name: "Fiverr", category: "Other", url: (u) => `https://www.fiverr.com/${u}`, mode: "status" },
  { name: "Depop", category: "Other", url: (u) => `https://www.depop.com/${u}/`, mode: "status" },
  { name: "Product Hunt", category: "Other", url: (u) => `https://www.producthunt.com/@${u}`, mode: "status" },
  { name: "Spotify", category: "Other", url: (u) => `https://open.spotify.com/user/${u}`, mode: "status" },
];

async function probe(platform, username) {
  const profileUrl = platform.url(username);
  const target = platform.apiUrl ? platform.apiUrl(username) : profileUrl;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PER_PLATFORM_TIMEOUT);

  const result = {
    name: platform.name,
    category: platform.category,
    url: profileUrl,
    status: "unknown",
    confidence: platform.mode === "api" ? "verified" : "page",
    note: platform.note || null,
    meta: null,
  };

  try {
    const resp = await fetch(target, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/json,*/*;q=0.8",
        ...(platform.headers || {}),
      },
    });

    if (platform.mode === "api") {
      let text = "";
      if (resp.ok) {
        try {
          text = (await resp.text()).slice(0, 400000);
        } catch {
          text = "";
        }
      }
      result.status = platform.judge(text, resp.status);
      if (result.status === "found" && platform.meta && text) {
        try {
          result.meta = platform.meta(text);
        } catch {
          result.meta = null;
        }
      }
    } else if (platform.mode === "status") {
      if ([200, 301, 302].includes(resp.status)) result.status = "found";
      else if ([404, 410].includes(resp.status)) result.status = "absent";
    } else if (platform.mode === "body") {
      if ([404, 410].includes(resp.status)) {
        result.status = "absent";
      } else if (resp.ok) {
        const text = (await resp.text()).slice(0, 400000);
        result.status = text.includes(platform.foundMarker) ? "found" : "absent";
        if (result.status === "found" && platform.meta) {
          try {
            result.meta = platform.meta(text);
          } catch {
            result.meta = null;
          }
        }
      }
    } else if (platform.mode === "bodyAbsent") {
      if ([404, 410].includes(resp.status)) {
        result.status = "absent";
      } else if (resp.ok) {
        const text = (await resp.text()).slice(0, 400000);
        result.status = text.includes(platform.absentMarker) ? "absent" : "found";
      }
    } else if (platform.mode === "bodyUnknown") {
      if ([404, 410].includes(resp.status)) {
        result.status = "absent";
      } else if (resp.ok) {
        const text = (await resp.text()).slice(0, 400000);
        result.status = text.includes(platform.foundMarker) ? "found" : "unknown";
        if (result.status === "found" && platform.meta) {
          try {
            result.meta = platform.meta(text);
          } catch {
            result.meta = null;
          }
        }
      }
    }
  } catch {
    /* stays unknown */
  } finally {
    clearTimeout(timeout);
  }

  return result;
}

export default async function handler(req, res) {
  const user = (req.query?.user || "").toString().trim().replace(/^@/, "");
  if (!/^[a-zA-Z0-9._-]{2,40}$/.test(user)) {
    return res.status(400).json({ ok: false, error: "Invalid username" });
  }

  const results = await Promise.all(PLATFORMS.map((p) => probe(p, user)));
  return res.status(200).json({ ok: true, user, mode: "server", results });
}
