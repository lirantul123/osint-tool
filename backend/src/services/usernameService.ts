import axios from "axios";
import { isValidUsername } from "../utils/validators";

export interface PlatformResult {
  platform: string;
  url: string;
  exists: boolean;
  profileData?: Record<string, unknown>;
}

export interface UsernameSearchResult {
  username: string;
  platforms: PlatformResult[];
  foundCount: number;
  error?: string;
}

export interface UsernameMatch {
  username: string;
  platforms: PlatformResult[];
  foundCount: number;
}

export interface UsernamePrefixSearchResult {
  query: string;
  matches: UsernameMatch[];
  totalUsernames: number;
  totalProfiles: number;
  githubTotal?: number;
  page: number;
  pageSize: number;
  totalPages: number;
  deepScan: boolean;
  error?: string;
}

export interface PrefixSearchOptions {
  page?: number;
  pageSize?: number;
  deepScan?: boolean;
}

const PREFIX_PAGE_SIZE = 50;
const MAX_GITHUB_API_PAGES = 10;
const PREFIX_MIN_LENGTH = 2;
const GITHUB_CACHE_TTL_MS = 5 * 60 * 1000;
const PROBE_CACHE_TTL_MS = 10 * 60 * 1000;
const PROBE_TIMEOUT_MS = 5000;
const DEEP_BATCH_SIZE = 15;

/** Fast JSON/API checks — skip slow HTML scrapers in bulk scans. */
const BULK_PROBE_NAMES = new Set([
  "Reddit",
  "Dev.to",
  "Hacker News",
  "Keybase",
  "GitLab",
]);

interface GithubCacheEntry {
  users: GitHubSearchUser[];
  totalCount: number;
  expires: number;
}

const githubDiscoveryCache = new Map<string, GithubCacheEntry>();
const probeResultCache = new Map<string, { match: UsernameMatch; expires: number }>();

const GITHUB_HEADERS = {
  Accept: "application/vnd.github.v3+json",
  "User-Agent": "OSINT-Toolkit/1.0",
};

interface PlatformCheck {
  name: string;
  url: (u: string) => string;
  check: (u: string) => Promise<PlatformResult>;
}

const PLATFORMS: PlatformCheck[] = [
  {
    name: "GitHub",
    url: (u) => `https://github.com/${u}`,
    check: async (u) => {
      const url = `https://github.com/${u}`;
      try {
        const res = await axios.get(`https://api.github.com/users/${u}`, {
          timeout: PROBE_TIMEOUT_MS,
          headers: GITHUB_HEADERS,
        });
        return {
          platform: "GitHub",
          url,
          exists: true,
          profileData: {
            name: res.data.name,
            bio: res.data.bio,
            public_repos: res.data.public_repos,
            followers: res.data.followers,
            created_at: res.data.created_at,
            avatar_url: res.data.avatar_url,
          },
        };
      } catch {
        return { platform: "GitHub", url, exists: false };
      }
    },
  },
  {
    name: "Reddit",
    url: (u) => `https://www.reddit.com/user/${u}`,
    check: async (u) => {
      const url = `https://www.reddit.com/user/${u}/about.json`;
      try {
        const res = await axios.get(url, {
          timeout: PROBE_TIMEOUT_MS,
          headers: { "User-Agent": "OSINT-Toolkit/1.0" },
        });
        const exists = !res.data.error;
        return {
          platform: "Reddit",
          url: `https://www.reddit.com/user/${u}`,
          exists,
          profileData: exists
            ? {
                karma: res.data.data?.total_karma,
                created: new Date(
                  (res.data.data?.created_utc || 0) * 1000
                ).toISOString(),
              }
            : undefined,
        };
      } catch {
        return {
          platform: "Reddit",
          url: `https://www.reddit.com/user/${u}`,
          exists: false,
        };
      }
    },
  },
  {
    name: "Dev.to",
    url: (u) => `https://dev.to/${u}`,
    check: async (u) => {
      const url = `https://dev.to/api/users/by_username?url=${u}`;
      try {
        const res = await axios.get(url, { timeout: PROBE_TIMEOUT_MS });
        return {
          platform: "Dev.to",
          url: `https://dev.to/${u}`,
          exists: true,
          profileData: {
            name: res.data.name,
            summary: res.data.summary,
            joined: res.data.joined_at,
          },
        };
      } catch {
        return {
          platform: "Dev.to",
          url: `https://dev.to/${u}`,
          exists: false,
        };
      }
    },
  },
  {
    name: "Hacker News",
    url: (u) => `https://news.ycombinator.com/user?id=${u}`,
    check: async (u) => {
      const url = `https://hacker-news.firebaseio.com/v0/user/${u}.json`;
      try {
        const res = await axios.get(url, { timeout: PROBE_TIMEOUT_MS });
        const exists = res.data !== null;
        return {
          platform: "Hacker News",
          url: `https://news.ycombinator.com/user?id=${u}`,
          exists,
          profileData: exists
            ? { karma: res.data.karma, about: res.data.about }
            : undefined,
        };
      } catch {
        return {
          platform: "Hacker News",
          url: `https://news.ycombinator.com/user?id=${u}`,
          exists: false,
        };
      }
    },
  },
  {
    name: "Keybase",
    url: (u) => `https://keybase.io/${u}`,
    check: async (u) => {
      const url = `https://keybase.io/_/api/1.0/user/lookup.json?usernames=${u}`;
      try {
        const res = await axios.get(url, { timeout: PROBE_TIMEOUT_MS });
        const exists = res.data?.status?.code === 0;
        return {
          platform: "Keybase",
          url: `https://keybase.io/${u}`,
          exists,
        };
      } catch {
        return {
          platform: "Keybase",
          url: `https://keybase.io/${u}`,
          exists: false,
        };
      }
    },
  },
  {
    name: "GitLab",
    url: (u) => `https://gitlab.com/${u}`,
    check: async (u) => {
      const url = `https://gitlab.com/api/v4/users?username=${u}`;
      try {
        const res = await axios.get(url, { timeout: PROBE_TIMEOUT_MS });
        const exists = Array.isArray(res.data) && res.data.length > 0;
        return {
          platform: "GitLab",
          url: `https://gitlab.com/${u}`,
          exists,
          profileData: exists
            ? { name: res.data[0].name, id: res.data[0].id }
            : undefined,
        };
      } catch {
        return {
          platform: "GitLab",
          url: `https://gitlab.com/${u}`,
          exists: false,
        };
      }
    },
  },
  {
    name: "Medium",
    url: (u) => `https://medium.com/@${u}`,
    check: async (u) => {
      const url = `https://medium.com/@${u}`;
      try {
        const res = await axios.get(url, {
          timeout: 8000,
          maxRedirects: 0,
          validateStatus: (s) => s < 500,
        });
        const exists = res.status === 200;
        return { platform: "Medium", url, exists };
      } catch {
        return { platform: "Medium", url, exists: false };
      }
    },
  },
  {
    name: "Pinterest",
    url: (u) => `https://www.pinterest.com/${u}`,
    check: async (u) => {
      const url = `https://www.pinterest.com/${u}/`;
      try {
        const res = await axios.get(url, {
          timeout: 8000,
          validateStatus: (s) => s < 500,
        });
        const exists = res.status === 200 && !res.data.includes("Not Found");
        return { platform: "Pinterest", url, exists };
      } catch {
        return { platform: "Pinterest", url, exists: false };
      }
    },
  },
];

export async function probeUsername(username: string): Promise<PlatformResult[]> {
  return Promise.all(PLATFORMS.map((p) => p.check(username.trim())));
}

export async function searchUsername(
  username: string
): Promise<UsernameSearchResult> {
  const u = username.trim();
  if (!u) return { username: "", platforms: [], foundCount: 0, error: "Username is required" };
  if (!isValidUsername(u))
    return { username: u, platforms: [], foundCount: 0, error: "Invalid username format" };

  const results = await Promise.all(PLATFORMS.map((p) => p.check(u)));
  const foundCount = results.filter((r) => r.exists).length;

  return { username: u, platforms: results, foundCount };
}

interface GitHubSearchUser {
  login: string;
  html_url: string;
  avatar_url: string;
}

interface GitHubDiscoverResult {
  users: GitHubSearchUser[];
  totalCount: number;
}

async function discoverGitHubUsernames(
  prefix: string,
  neededCount: number
): Promise<GitHubDiscoverResult> {
  const key = prefix.toLowerCase();
  const now = Date.now();
  const cached = githubDiscoveryCache.get(key);

  if (cached && cached.expires > now && cached.users.length >= neededCount) {
    return {
      users: cached.users.slice(0, neededCount),
      totalCount: cached.totalCount,
    };
  }

  const lower = key;
  const users: GitHubSearchUser[] = cached?.expires && cached.expires > now
    ? [...cached.users]
    : [];
  let totalCount = cached?.totalCount ?? 0;

  const alreadyFetched = users.length;
  const startApiPage = Math.floor(alreadyFetched / 100) + 1;
  const endApiPage = Math.min(
    MAX_GITHUB_API_PAGES,
    Math.max(startApiPage, Math.ceil(neededCount / 100))
  );

  for (let page = startApiPage; page <= endApiPage && users.length < neededCount; page++) {
    try {
      const res = await axios.get(
        `https://api.github.com/search/users?q=${encodeURIComponent(prefix)}+in:login&per_page=100&page=${page}`,
        {
          timeout: 12000,
          headers: GITHUB_HEADERS,
        }
      );
      totalCount = res.data.total_count ?? totalCount;
      const items: GitHubSearchUser[] = res.data.items || [];
      const seen = new Set(users.map((u) => u.login.toLowerCase()));
      for (const u of items) {
        if (u.login.toLowerCase().startsWith(lower) && !seen.has(u.login.toLowerCase())) {
          users.push(u);
          seen.add(u.login.toLowerCase());
        }
      }
      if (items.length < 100) break;
    } catch {
      break;
    }
  }

  githubDiscoveryCache.set(key, {
    users,
    totalCount,
    expires: now + GITHUB_CACHE_TTL_MS,
  });

  return { users: users.slice(0, neededCount), totalCount };
}

/** Fallback candidates when GitHub search is unavailable. */
function generatePrefixVariants(prefix: string): string[] {
  const variants = new Set<string>([prefix]);
  for (const tail of [
    "1", "12", "123", "official", "dev", "real", "x", "tal", "tul", "co",
  ]) {
    variants.add(`${prefix}${tail}`);
  }
  return Array.from(variants);
}

async function discoverViaVariantProbe(
  prefix: string
): Promise<GitHubSearchUser[]> {
  const variants = generatePrefixVariants(prefix);
  const found: GitHubSearchUser[] = [];

  for (const username of variants) {
    try {
      const res = await axios.get(`https://api.github.com/users/${username}`, {
        timeout: 6000,
        headers: GITHUB_HEADERS,
        validateStatus: (s) => s < 500,
      });
      if (res.status === 200 && res.data?.login) {
        found.push({
          login: res.data.login,
          html_url: res.data.html_url,
          avatar_url: res.data.avatar_url,
        });
      }
    } catch {
      // skip
    }
    if (found.length >= PREFIX_PAGE_SIZE) break;
  }

  return found;
}

function githubFromSearch(user: GitHubSearchUser): PlatformResult {
  return {
    platform: "GitHub",
    url: user.html_url,
    exists: true,
    profileData: {
      login: user.login,
      avatar_url: user.avatar_url,
    },
  };
}

function buildFastMatch(
  username: string,
  preset: PlatformResult[] = []
): UsernameMatch {
  const platforms = preset.filter((p) => p.exists);
  return { username, platforms, foundCount: platforms.length };
}

async function buildUsernameMatch(
  username: string,
  preset: PlatformResult[] = [],
  bulk = false
): Promise<UsernameMatch> {
  const cacheKey = `${username.toLowerCase()}:${bulk ? "bulk" : "full"}`;
  const cached = probeResultCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.match;

  const presetFound = preset.filter((p) => p.exists);
  const skip = new Set(presetFound.map((p) => p.platform));
  const toProbe = PLATFORMS.filter((p) => {
    if (skip.has(p.name)) return false;
    if (bulk && !BULK_PROBE_NAMES.has(p.name)) return false;
    return true;
  });

  const probed = await Promise.all(toProbe.map((p) => p.check(username)));
  const platforms = [...presetFound, ...probed.filter((p) => p.exists)];
  const match: UsernameMatch = {
    username,
    platforms,
    foundCount: platforms.length,
  };

  probeResultCache.set(cacheKey, {
    match,
    expires: Date.now() + PROBE_CACHE_TTL_MS,
  });

  return match;
}

async function probeUsernamesBatch(
  entries: { username: string; preset?: PlatformResult[] }[],
  deepScan: boolean
): Promise<UsernameMatch[]> {
  if (!deepScan) {
    return entries.map((e) => buildFastMatch(e.username, e.preset || []));
  }

  const results: UsernameMatch[] = [];
  for (let i = 0; i < entries.length; i += DEEP_BATCH_SIZE) {
    const chunk = entries.slice(i, i + DEEP_BATCH_SIZE);
    const chunkResults = await Promise.all(
      chunk.map((e) => buildUsernameMatch(e.username, e.preset || [], true))
    );
    results.push(...chunkResults);
  }
  return results;
}

export async function searchUsernamePrefix(
  prefix: string,
  pageOrOptions: number | PrefixSearchOptions = 1,
  pageSizeArg = PREFIX_PAGE_SIZE
): Promise<UsernamePrefixSearchResult> {
  const opts: PrefixSearchOptions =
    typeof pageOrOptions === "number"
      ? { page: pageOrOptions, pageSize: pageSizeArg }
      : pageOrOptions;

  const query = prefix.trim().toLowerCase();
  const currentPage = Math.max(1, Math.floor(opts.page ?? 1));
  const size = Math.min(50, Math.max(1, Math.floor(opts.pageSize ?? PREFIX_PAGE_SIZE)));
  const deepScan = opts.deepScan === true;

  const empty = (error?: string): UsernamePrefixSearchResult => ({
    query,
    matches: [],
    totalUsernames: 0,
    totalProfiles: 0,
    page: currentPage,
    pageSize: size,
    totalPages: 0,
    deepScan,
    error,
  });

  if (!query) return empty("Username prefix is required");
  if (query.length < PREFIX_MIN_LENGTH) return empty("Enter at least 2 characters");
  if (!/^[a-zA-Z0-9_.-]+$/.test(query)) return empty("Invalid username characters");

  const neededCount = currentPage * size;

  let { users: githubUsers, totalCount: githubTotal } =
    await discoverGitHubUsernames(query, neededCount);

  if (githubUsers.length < 2 && currentPage === 1) {
    const fallback = await discoverViaVariantProbe(query);
    const seenGh = new Set(githubUsers.map((u) => u.login.toLowerCase()));
    for (const u of fallback) {
      if (!seenGh.has(u.login.toLowerCase())) githubUsers.push(u);
    }
    githubTotal = Math.max(githubTotal, githubUsers.length);
  }

  const seen = new Set<string>();
  const allEntries: { username: string; preset?: PlatformResult[] }[] = [];

  for (const gh of githubUsers) {
    const u = gh.login;
    if (seen.has(u.toLowerCase())) continue;
    seen.add(u.toLowerCase());
    allEntries.push({ username: u, preset: [githubFromSearch(gh)] });
  }

  if (currentPage === 1 && !seen.has(query)) {
    allEntries.unshift({ username: query });
  }

  const maxFetchable = MAX_GITHUB_API_PAGES * 100;
  const effectiveTotal =
    githubTotal > 0
      ? Math.min(githubTotal, maxFetchable)
      : allEntries.length;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / size));
  const start = (currentPage - 1) * size;
  const pageEntries = allEntries.slice(start, start + size);

  if (pageEntries.length === 0 && currentPage > 1) {
    return { ...empty(), totalPages, githubTotal: githubTotal || undefined };
  }

  const matches = await probeUsernamesBatch(pageEntries, deepScan);

  matches.sort((a, b) => {
    if (a.username.toLowerCase() === query) return -1;
    if (b.username.toLowerCase() === query) return 1;
    if (b.foundCount !== a.foundCount) return b.foundCount - a.foundCount;
    return a.username.localeCompare(b.username);
  });

  const listed = deepScan ? matches.filter((m) => m.foundCount > 0) : matches;
  const totalProfiles = listed.reduce((n, m) => n + m.foundCount, 0);

  return {
    query,
    matches: listed,
    totalUsernames: listed.length,
    totalProfiles,
    githubTotal: githubTotal > 0 ? githubTotal : undefined,
    page: currentPage,
    pageSize: size,
    totalPages,
    deepScan,
  };
}
