import axios from "axios";
import { containsHebrew } from "../utils/validators";
import { searchWeb, WebResult } from "./searchEngine";
import { probeUsername } from "./usernameService";

export interface PlatformLink {
  platform: string;
  url: string;
  title: string;
  source: "profile" | "search";
}

const SOCIAL_DOMAINS: Record<string, string[]> = {
  LinkedIn: ["linkedin.com"],
  "Twitter / X": ["twitter.com", "x.com"],
  Facebook: ["facebook.com"],
  Instagram: ["instagram.com"],
  TikTok: ["tiktok.com"],
  GitHub: ["github.com"],
  Reddit: ["reddit.com"],
  Medium: ["medium.com"],
};

const PLATFORM_QUERIES = [
  { platform: "LinkedIn", suffix: "linkedin" },
  { platform: "Instagram", suffix: "instagram" },
  { platform: "Facebook", suffix: "facebook" },
  { platform: "Twitter / X", suffix: "twitter" },
  { platform: "TikTok", suffix: "tiktok" },
  { platform: "Reddit", suffix: "reddit" },
  { platform: "Medium", suffix: "medium" },
];

function quoted(name: string): string {
  return `"${name}"`;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ");
}

function domainMatch(url: string, domains: string[]): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return domains.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

function isProfileUrl(platform: string, url: string): boolean {
  const lower = url.toLowerCase();
  switch (platform) {
    case "LinkedIn":
      return lower.includes("/in/") || lower.includes("/pub/");
    case "GitHub":
      return (
        !lower.includes("/search") &&
        /github\.com\/[^/]+\/?$/.test(lower)
      );
    case "Twitter / X":
      return /(twitter|x)\.com\/[^/]+\/?$/.test(lower);
    case "Facebook":
      return lower.includes("facebook.com/") && !lower.includes("/search");
    case "Instagram":
      return /instagram\.com\/[^/]+\/?$/.test(lower);
    case "Reddit":
      return /reddit\.com\/user\/[^/]+\/?$/.test(lower);
    case "Medium":
      return /medium\.com\/@[^/]+\/?$/.test(lower);
    default:
      return true;
  }
}

function nameMatches(text: string, first: string, last: string): boolean {
  const t = normalize(text);
  const f = normalize(first);
  const l = normalize(last);
  if (t.includes(`${f} ${l}`) || t.includes(`${l} ${f}`)) return true;
  return l.length >= 3 && t.includes(l) && (f.length < 3 || t.includes(f));
}

export function generateUsernameVariants(
  first: string,
  last: string
): string[] {
  const f = first.toLowerCase().replace(/[^a-z0-9]/g, "");
  const l = last.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!f || !l) return [];

  const variants = new Set([
    `${f}${l}`,
    `${f}.${l}`,
    `${f}_${l}`,
    `${f}-${l}`,
    `${l}${f}`,
    `${f[0]}${l}`,
    `${f}${l[0]}`,
    l,
  ]);

  return Array.from(variants).filter((v) => v.length >= 3 && v.length <= 32);
}

function buildPlatformSearchLinks(
  first: string,
  last: string,
  full: string
): PlatformLink[] {
  const q = encodeURIComponent(full);
  const capFirst = encodeURIComponent(first);
  const capLast = encodeURIComponent(last);

  return [
    {
      platform: "LinkedIn",
      url: `https://www.linkedin.com/search/results/people/?keywords=${q}`,
      title: `Search "${full}" on LinkedIn`,
      source: "search",
    },
    {
      platform: "LinkedIn",
      url: `https://www.linkedin.com/pub/dir/${capFirst}/${capLast}`,
      title: `LinkedIn directory: ${first} ${last}`,
      source: "search",
    },
    {
      platform: "Facebook",
      url: `https://www.facebook.com/public/${capFirst}%20${capLast}`,
      title: `Search "${full}" on Facebook`,
      source: "search",
    },
    {
      platform: "Instagram",
      url: `https://www.instagram.com/explore/search/keyword/?q=${q}`,
      title: `Search "${full}" on Instagram`,
      source: "search",
    },
    {
      platform: "Twitter / X",
      url: `https://twitter.com/search?q=${q}&f=user`,
      title: `Search "${full}" on X`,
      source: "search",
    },
    {
      platform: "Reddit",
      url: `https://www.reddit.com/search/?q=${q}&type=user`,
      title: `Search users "${full}" on Reddit`,
      source: "search",
    },
    {
      platform: "GitHub",
      url: `https://github.com/search?q=${q}&type=users`,
      title: `Search users "${full}" on GitHub`,
      source: "search",
    },
    {
      platform: "Medium",
      url: `https://medium.com/search?q=${q}`,
      title: `Search "${full}" on Medium`,
      source: "search",
    },
    {
      platform: "Dev.to",
      url: `https://dev.to/search?q=${q}`,
      title: `Search "${full}" on Dev.to`,
      source: "search",
    },
    {
      platform: "Hacker News",
      url: `https://hn.algolia.com/?query=${q}`,
      title: `Search "${full}" on Hacker News`,
      source: "search",
    },
    {
      platform: "Twitch",
      url: `https://www.twitch.tv/search?term=${q}`,
      title: `Search channels "${full}" on Twitch`,
      source: "search",
    },
    {
      platform: "Flickr",
      url: `https://www.flickr.com/search/people/?q=${q}`,
      title: `Search people "${full}" on Flickr`,
      source: "search",
    },
    {
      platform: "Stack Overflow",
      url: `https://stackoverflow.com/search?q=${q}`,
      title: `Search "${full}" on Stack Overflow`,
      source: "search",
    },
  ];
}

async function searchPlatformViaWeb(
  name: string,
  platform: string,
  suffix: string,
  domains: string[],
  locale: "en" | "he"
): Promise<PlatformLink[]> {
  const results = await searchWeb(`${quoted(name)} ${suffix}`, 10, locale);
  const links: PlatformLink[] = [];

  for (const r of results) {
    if (!domainMatch(r.url, domains)) continue;
    if (!isProfileUrl(platform, r.url)) continue;
    links.push({
      platform,
      url: r.url,
      title: r.title || r.url,
      source: "profile",
    });
  }

  return links;
}

async function probeVariantsOnPlatforms(
  variants: string[],
  first: string,
  last: string
): Promise<PlatformLink[]> {
  const links: PlatformLink[] = [];
  const topVariants = variants.slice(0, 4);

  for (const variant of topVariants) {
    const results = await probeUsername(variant);
    for (const r of results) {
      if (!r.exists) continue;
      if (r.platform === "Pinterest" || r.platform === "Keybase") continue;
      const profileName = String(r.profileData?.name || "");
      const bio = String(r.profileData?.bio || "");
      const matches =
        !profileName ||
        nameMatches(`${profileName} ${bio}`, first, last) ||
        nameMatches(variant, first, last);

      if (matches || variant.includes(normalize(last).replace(/\s/g, ""))) {
        links.push({
          platform: r.platform,
          url: r.url,
          title: profileName
            ? `${profileName} (@${variant})`
            : `@${variant} on ${r.platform}`,
          source: "profile",
        });
      }
    }
  }

  return links;
}

async function searchGitHubByName(
  first: string,
  last: string,
  full: string
): Promise<PlatformLink[]> {
  const links: PlatformLink[] = [];

  try {
    const res = await axios.get(
      `https://api.github.com/search/users?q=${encodeURIComponent(full)}&per_page=8`,
      {
        timeout: 10000,
        headers: { Accept: "application/vnd.github.v3+json" },
      }
    );

    const items: { login: string }[] = res.data.items || [];
    for (const item of items.slice(0, 5)) {
      try {
        const user = await axios.get(
          `https://api.github.com/users/${item.login}`,
          {
            timeout: 8000,
            headers: { Accept: "application/vnd.github.v3+json" },
          }
        );
        const displayName = user.data.name || item.login;
        if (
          nameMatches(displayName, first, last) ||
          nameMatches(item.login, first, last)
        ) {
          links.push({
            platform: "GitHub",
            url: user.data.html_url,
            title: `${displayName} (@${item.login})`,
            source: "profile",
          });
        }
      } catch {
        // skip
      }
    }
  } catch {
    // skip
  }

  return links;
}

function dedupeLinks(links: PlatformLink[]): PlatformLink[] {
  const seen = new Set<string>();
  return links.filter((l) => {
    const key = `${l.platform}:${l.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function groupByPlatform(
  links: PlatformLink[]
): { platform: string; results: WebResult[] }[] {
  const buckets = new Map<string, WebResult[]>();
  for (const link of links) {
    if (!buckets.has(link.platform)) buckets.set(link.platform, []);
    buckets.get(link.platform)!.push({
      title: link.title,
      url: link.url,
      snippet: link.source === "search" ? "Platform search link" : "",
    });
  }
  return Array.from(buckets.entries())
    .map(([platform, results]) => ({ platform, results }))
    .sort((a, b) => {
      const aProfiles = a.results.filter((r) => !r.snippet).length;
      const bProfiles = b.results.filter((r) => !r.snippet).length;
      return bProfiles - aProfiles || b.results.length - a.results.length;
    });
}

export async function discoverPlatforms(
  first: string,
  last: string,
  full: string,
  hebrewName?: string
): Promise<{ platform: string; results: WebResult[] }[]> {
  const variants = generateUsernameVariants(first, last);
  const locales: ("en" | "he")[] = containsHebrew(full)
    ? ["he", "en"]
    : ["en"];
  if (hebrewName && !containsHebrew(full)) locales.push("he");

  const searchNames = [full, hebrewName].filter(
    (n): n is string => Boolean(n)
  );

  const [probeLinks, githubLinks, ...webPlatformLinks] = await Promise.all([
    probeVariantsOnPlatforms(variants, first, last),
    searchGitHubByName(first, last, full),
    ...searchNames.flatMap((name) =>
      locales.flatMap((locale) =>
        PLATFORM_QUERIES.map(({ platform, suffix }) =>
          searchPlatformViaWeb(
            name,
            platform,
            suffix,
            SOCIAL_DOMAINS[platform],
            locale
          )
        )
      )
    ),
  ]);

  const searchLinks = buildPlatformSearchLinks(first, last, full);
  const allLinks = dedupeLinks([
    ...probeLinks,
    ...githubLinks,
    ...webPlatformLinks.flat(),
    ...searchLinks,
  ]);

  return groupByPlatform(allLinks);
}
