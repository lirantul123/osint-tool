import axios from "axios";

export interface WebResult {
  title: string;
  url: string;
  snippet: string;
}

export type SearchLocale = "en" | "he";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const LOCALE_PARAMS: Record<SearchLocale, { setlang: string; cc: string }> = {
  en: { setlang: "en-US", cc: "US" },
  he: { setlang: "he-IL", cc: "IL" },
};

function decodeXml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\u0022")
    .replace(/&#39;/g, "\u0027")
    .replace(/<[^>]+>/g, "");
}

function parseBingRss(xml: string, limit = 8): WebResult[] {
  const results: WebResult[] = [];
  const itemRegex =
    /<item>\s*<title>([\s\S]*?)<\/title>\s*<link>([\s\S]*?)<\/link>\s*<description>([\s\S]*?)<\/description>/g;

  let match;
  while ((match = itemRegex.exec(xml)) !== null && results.length < limit) {
    const url = decodeXml(match[2].trim());
    if (!url.startsWith("http")) continue;
    results.push({
      title: decodeXml(match[1].trim()),
      url,
      snippet: decodeXml(match[3].trim().replace(/\s+/g, " ")),
    });
  }

  return results;
}

export async function searchWeb(
  query: string,
  limit = 8,
  locale: SearchLocale = "en"
): Promise<WebResult[]> {
  try {
    const { data } = await axios.get<string>("https://www.bing.com/search", {
      params: {
        q: query,
        format: "rss",
        ...LOCALE_PARAMS[locale],
      },
      timeout: 15000,
      headers: { "User-Agent": UA },
      responseType: "text",
    });
    return parseBingRss(data, limit);
  } catch {
    return [];
  }
}
