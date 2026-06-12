import {
  containsHebrew,
  isValidPersonName,
  normalizePersonName,
  parsePersonName,
} from "../utils/validators";
import { discoverPlatforms } from "./platformDiscovery";
import { WebResult } from "./searchEngine";
import {
  enrichWikiPage,
  pickBestWikiPage,
  searchAllWikiPages,
} from "./wikiEnrichment";

export interface PersonInput {
  name: string;
}

export interface PlatformSearch {
  platform: string;
  results: WebResult[];
}

export interface WikiResult {
  title: string;
  url: string;
  lang: string;
  extract?: string;
  shortdesc?: string;
}

export interface PeopleLookupResult {
  name: string;
  parsedName: { first: string; last: string; full: string };
  hebrewName?: string;
  webResults: WebResult[];
  socialResults: PlatformSearch[];
  wikipedia?: WikiResult[];
  totalFound: number;
  note: string;
  error?: string;
}

const MAX_WIKI_WEB = 3;

function mergePlatformGroups(
  a: PlatformSearch[],
  b: PlatformSearch[]
): PlatformSearch[] {
  const map = new Map<string, WebResult[]>();
  for (const group of [...a, ...b]) {
    if (!map.has(group.platform)) map.set(group.platform, []);
    const existing = map.get(group.platform)!;
    const seen = new Set(existing.map((r) => r.url));
    for (const r of group.results) {
      if (!seen.has(r.url)) existing.push(r);
    }
  }
  return Array.from(map.entries()).map(([platform, results]) => ({
    platform,
    results,
  }));
}

export async function investigatePerson(
  input: PersonInput
): Promise<PeopleLookupResult> {
  const name = normalizePersonName(input.name || "");

  const note =
    "Only public profiles and publicly indexed pages can be found. Private or restricted accounts will not appear.";

  if (!name) {
    return {
      name: "",
      parsedName: { first: "", last: "", full: "" },
      webResults: [],
      socialResults: [],
      totalFound: 0,
      note,
      error: "Full name is required (first and last)",
    };
  }

  if (!isValidPersonName(name)) {
    return {
      name,
      parsedName: parsePersonName(name),
      webResults: [],
      socialResults: [],
      totalFound: 0,
      note,
      error: "Enter a full name with at least first and last",
    };
  }

  const parsedName = parsePersonName(name);
  let hebrewName: string | undefined = containsHebrew(name) ? name : undefined;
  let webResults: WebResult[] = [];
  let socialResults: PlatformSearch[] = [];
  const wikipedia: WikiResult[] = [];

  const wikiPages = await searchAllWikiPages(name);
  const bestWiki = pickBestWikiPage(
    wikiPages,
    parsedName.first,
    parsedName.last
  );

  if (bestWiki) {
    const enriched = await enrichWikiPage(bestWiki);
    hebrewName = hebrewName || enriched.page.hebrewTitle;

    wikipedia.push({
      title: enriched.page.title,
      url: enriched.page.url,
      lang: enriched.page.lang,
      extract: enriched.page.extract,
      shortdesc: enriched.page.shortdesc,
    });

    if (enriched.page.hebrewTitle && enriched.page.lang === "en") {
      hebrewName = enriched.page.hebrewTitle;
    }

    const wikiSocial = enriched.socialLinks.map((l) => ({
      platform: l.platform,
      results: [{ title: l.platform, url: l.url, snippet: "" }],
    }));

    socialResults = mergePlatformGroups(socialResults, wikiSocial);
    webResults = enriched.webResults.slice(0, MAX_WIKI_WEB);
  }

  const discovered = await discoverPlatforms(
    parsedName.first,
    parsedName.last,
    parsedName.full,
    hebrewName
  );

  socialResults = mergePlatformGroups(socialResults, discovered);

  const totalFound =
    webResults.length +
    socialResults.reduce((n, s) => n + s.results.length, 0) +
    wikipedia.length;

  return {
    name,
    parsedName,
    hebrewName,
    webResults,
    socialResults,
    wikipedia: wikipedia.length > 0 ? wikipedia : undefined,
    totalFound,
    note,
  };
}
