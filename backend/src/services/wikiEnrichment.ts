import axios from "axios";
import { WebResult } from "./searchEngine";

const WIKI_HEADERS = {
  "User-Agent": "OSINT-Toolkit/1.0 (education/research)",
};

export interface WikiPage {
  title: string;
  url: string;
  lang: string;
  extract?: string;
  shortdesc?: string;
  hebrewTitle?: string;
}

export interface WikiEnrichment {
  page: WikiPage;
  webResults: WebResult[];
  socialLinks: { platform: string; url: string }[];
}

const SOCIAL_CLAIMS: Record<string, { platform: string; url: (v: string) => string }> = {
  P2002: { platform: "Twitter / X", url: (v) => `https://twitter.com/${v}` },
  P2003: { platform: "Instagram", url: (v) => `https://instagram.com/${v}` },
  P2013: { platform: "Facebook", url: (v) => `https://facebook.com/${v}` },
  P6634: { platform: "LinkedIn", url: (v) => v.startsWith("http") ? v : `https://linkedin.com/in/${v}` },
  P2397: { platform: "YouTube", url: (v) => `https://youtube.com/channel/${v}` },
};

const SOCIAL_DOMAINS: Record<string, string> = {
  "instagram.com": "Instagram",
  "twitter.com": "Twitter / X",
  "x.com": "Twitter / X",
  "facebook.com": "Facebook",
  "linkedin.com": "LinkedIn",
  "tiktok.com": "TikTok",
  "youtube.com": "YouTube",
};

function wikiUrl(lang: string, title: string): string {
  return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}

function linkToResult(url: string): WebResult {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    return {
      title: host + u.pathname.slice(0, 60),
      url,
      snippet: "",
    };
  } catch {
    return { title: url, url, snippet: "" };
  }
}

function socialPlatformFromUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    for (const [domain, platform] of Object.entries(SOCIAL_DOMAINS)) {
      if (host === domain || host.endsWith(`.${domain}`)) return platform;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function searchWikipedia(
  name: string,
  lang: string
): Promise<WikiPage[]> {
  try {
    const searchRes = await axios.get(
      `https://${lang}.wikipedia.org/w/api.php`,
      {
        params: {
          action: "opensearch",
          search: name,
          limit: 5,
          format: "json",
        },
        timeout: 8000,
        headers: WIKI_HEADERS,
      }
    );

    const [, titles, , urls] = searchRes.data as [
      unknown,
      string[],
      unknown,
      string[],
    ];

    return titles.map((title, i) => ({
      title,
      url: urls[i],
      lang,
    }));
  } catch {
    return [];
  }
}

export function pickBestWikiPage(
  pages: WikiPage[],
  first: string,
  last: string
): WikiPage | null {
  const firstL = first.toLowerCase();
  const lastL = last.toLowerCase();

  for (const p of pages) {
    const titleL = p.title.toLowerCase();
    if (titleL.includes(firstL) && titleL.includes(lastL)) return p;
  }

  for (const p of pages) {
    if (p.title.toLowerCase().includes(lastL)) return p;
  }

  return null;
}

export async function enrichWikiPage(page: WikiPage): Promise<WikiEnrichment> {
  const title = page.title;
  const lang = page.lang;

  let extract = page.extract;
  let shortdesc = page.shortdesc;
  let hebrewTitle = page.hebrewTitle;
  const extUrls: string[] = [];
  const socialLinks: { platform: string; url: string }[] = [];
  const webResults: WebResult[] = [];

  try {
    const res = await axios.get(
      `https://${lang}.wikipedia.org/w/api.php`,
      {
        params: {
          action: "query",
          titles: title,
          prop: "extracts|pageprops|extlinks|langlinks",
          exintro: true,
          explaintext: true,
          ellimit: 20,
          lllang: "he",
          format: "json",
        },
        timeout: 12000,
        headers: WIKI_HEADERS,
      }
    );

    const pages = res.data?.query?.pages || {};
    const pageData = Object.values(pages)[0] as {
      extract?: string;
      pageprops?: { "wikibase-shortdesc"?: string; wikibase_item?: string };
      extlinks?: { "*": string }[];
      langlinks?: { lang: string; "*": string }[];
    };

    if (pageData) {
      extract = extract || pageData.extract?.slice(0, 400);
      shortdesc = shortdesc || pageData.pageprops?.["wikibase-shortdesc"];

      const heLink = pageData.langlinks?.find((l) => l.lang === "he");
      if (heLink) hebrewTitle = heLink["*"];

      for (const link of pageData.extlinks || []) {
        const url = link["*"];
        if (url.includes("archive.org") || url.includes("worldcat.org")) continue;
        extUrls.push(url);
      }

      const wikibaseId = pageData.pageprops?.wikibase_item;
      if (wikibaseId) {
        const wdLinks = await fetchWikidataSocial(wikibaseId);
        socialLinks.push(...wdLinks);
      }
    }
  } catch {
    // partial enrichment is fine
  }

  if (!hebrewTitle && lang === "en") {
    try {
      const heSearch = await searchWikipedia(title, "he");
      const match = heSearch.find((p) =>
        p.title.includes(" ") || p.title.length > 2
      );
      if (match) hebrewTitle = match.title;
    } catch {
      // optional
    }
  }

  const seenSocial = new Set(socialLinks.map((s) => s.url));

  for (const url of extUrls) {
    const platform = socialPlatformFromUrl(url);
    if (platform) {
      if (!seenSocial.has(url)) {
        socialLinks.push({ platform, url });
        seenSocial.add(url);
      }
    } else {
      webResults.push(linkToResult(url));
    }
  }

  return {
    page: {
      ...page,
      extract,
      shortdesc,
      hebrewTitle,
    },
    webResults,
    socialLinks,
  };
}

async function fetchWikidataSocial(
  entityId: string
): Promise<{ platform: string; url: string }[]> {
  try {
    const res = await axios.get("https://www.wikidata.org/w/api.php", {
      params: {
        action: "wbgetentities",
        ids: entityId,
        props: "claims",
        format: "json",
      },
      timeout: 8000,
      headers: WIKI_HEADERS,
    });

    const claims = res.data?.entities?.[entityId]?.claims || {};
    const links: { platform: string; url: string }[] = [];

    for (const [pid, mapping] of Object.entries(SOCIAL_CLAIMS)) {
      const statements = claims[pid];
      if (!statements?.[0]?.mainsnak?.datavalue?.value) continue;
      const value = statements[0].mainsnak.datavalue.value;
      const id = typeof value === "string" ? value : value.id;
      if (id) links.push({ platform: mapping.platform, url: mapping.url(id) });
    }

    return links;
  } catch {
    return [];
  }
}

export async function searchAllWikiPages(name: string): Promise<WikiPage[]> {
  const langs = /[\u0590-\u05FF]/.test(name) ? ["he", "en"] : ["en", "he"];
  const results = await Promise.all(
    langs.map((lang) => searchWikipedia(name, lang))
  );

  const seen = new Set<string>();
  const merged: WikiPage[] = [];
  for (const p of results.flat()) {
    if (seen.has(p.url)) continue;
    seen.add(p.url);
    merged.push(p);
  }
  return merged;
}
