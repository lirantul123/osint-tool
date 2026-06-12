import ResultCard, { DataRow } from "./ResultCard";

export interface WebResult {
  title: string;
  url: string;
  snippet: string;
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

export interface PeopleResult {
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

function ResultList({ results }: { results: WebResult[] }) {
  return (
    <>
      {results.map((r) => (
        <div key={r.url} className="web-result">
          <a href={r.url} target="_blank" rel="noreferrer" className="web-result-title">
            {r.title}
          </a>
          <span className="web-result-url mono">{r.url}</span>
          {r.snippet && (
            <p
              className={`web-result-snippet ${r.snippet === "Platform search link" ? "search-hint" : ""}`}
            >
              {r.snippet}
            </p>
          )}
        </div>
      ))}
    </>
  );
}

export function peopleStats(result: PeopleResult) {
  return [
    { label: "Results", value: result.totalFound },
    { label: "Platforms", value: result.socialResults.length },
    {
      label: "Wikipedia",
      value: result.wikipedia?.length ?? 0,
    },
  ];
}

export default function PeopleResults({ result }: { result: PeopleResult }) {
  if (result.error) {
    return (
      <ResultCard title="Error" variant="error">
        <p>{result.error}</p>
      </ResultCard>
    );
  }

  return (
    <>
      {result.note && (
        <div className="info-banner info-banner-subtle">
          <p>{result.note}</p>
        </div>
      )}

      <ResultCard title="Person">
        <DataRow label="Name" value={result.parsedName.full} />
        {result.hebrewName && result.hebrewName !== result.parsedName.full && (
          <DataRow label="Hebrew" value={result.hebrewName} />
        )}
      </ResultCard>

      {result.wikipedia && result.wikipedia.length > 0 && (
        <ResultCard title="Wikipedia">
          {result.wikipedia.map((w) => (
            <div key={w.url} className="wiki-result">
              <div className="wiki-header">
                <a href={w.url} target="_blank" rel="noreferrer" className="platform-link">
                  {w.title}
                </a>
                <span className="lang-badge">{w.lang.toUpperCase()}</span>
              </div>
              {w.shortdesc && <p className="wiki-shortdesc">{w.shortdesc}</p>}
              {w.extract && <p className="web-result-snippet">{w.extract}</p>}
            </div>
          ))}
        </ResultCard>
      )}

      {result.socialResults.map((platform) => (
        <ResultCard
          key={platform.platform}
          title={`${platform.platform} (${platform.results.length})`}
        >
          <ResultList results={platform.results} />
        </ResultCard>
      ))}

      {result.webResults.length > 0 && (
        <ResultCard title={`Related Links (${result.webResults.length})`}>
          <ResultList results={result.webResults} />
        </ResultCard>
      )}

      {result.totalFound === 0 && (
        <ResultCard title="No Results">
          <p>
            No public results found. Check the spelling or try a different name
            format.
          </p>
        </ResultCard>
      )}
    </>
  );
}
