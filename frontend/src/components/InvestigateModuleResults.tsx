import ResultCard, { DataRow, Badge } from "./ResultCard";
import Pagination from "./Pagination";

interface PlatformResult {
  platform: string;
  url: string;
  exists: boolean;
  profileData?: Record<string, unknown>;
}

interface UsernameMatch {
  username: string;
  platforms: PlatformResult[];
  foundCount: number;
}

interface UsernamePrefixResult {
  query: string;
  matches: UsernameMatch[];
  totalUsernames: number;
  totalProfiles: number;
  githubTotal?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  error?: string;
}

export function technicalStats(modules: Record<string, unknown>) {
  const stats: { label: string; value: number | string }[] = [
    { label: "Modules", value: Object.keys(modules).length },
  ];

  const username = modules.username as UsernamePrefixResult | undefined;
  if (username?.matches) {
    stats.push({ label: "Usernames", value: username.totalUsernames });
    stats.push({ label: "Profiles", value: username.totalProfiles });
  }

  const subs = modules.subdomains as { subdomains?: string[] } | undefined;
  if (subs?.subdomains) {
    stats.push({ label: "Subdomains", value: subs.subdomains.length });
  }

  return stats;
}

export function InvestigateModuleResults({
  module,
  data,
  onUsernamePageChange,
  usernamePageLoading,
}: {
  module: string;
  data: Record<string, unknown>;
  onUsernamePageChange?: (page: number) => void;
  usernamePageLoading?: boolean;
}) {
  if (data.error) {
    return <p className="error-text">{String(data.error)}</p>;
  }

  if (module === "ip" && data.geo) {
    const geo = data.geo as Record<string, unknown>;
    return (
      <>
        <DataRow label="Country" value={String(geo.country || "")} />
        <DataRow label="City" value={String(geo.city || "")} />
        <DataRow label="ISP" value={String(geo.isp || "")} />
        <DataRow label="ASN" value={String(geo.as || "")} />
      </>
    );
  }

  if (module === "subdomains" && data.subdomains) {
    const subs = data.subdomains as string[];
    return (
      <>
        <DataRow label="Total" value={subs.length} />
        {subs.slice(0, 20).map((s) => (
          <div key={s} className="mono list-item">
            {s}
          </div>
        ))}
        {subs.length > 20 && <p>...and {subs.length - 20} more</p>}
      </>
    );
  }

  if (module === "username" && Array.isArray(data.matches)) {
    const result = data as unknown as UsernamePrefixResult;
    const pageSize = result.pageSize ?? 50;
    const page = result.page ?? 1;
    const githubTotal = result.githubTotal ?? 0;
    const totalPages =
      result.totalPages ??
      (githubTotal > pageSize ? Math.ceil(githubTotal / pageSize) : 1);
    const needsBackendRestart =
      result.totalPages == null &&
      result.page == null &&
      githubTotal > pageSize;

    return (
      <>
        {needsBackendRestart && (
          <p className="error-text">
            Restart the backend (<code>npm run dev</code>) so page navigation
            loads new results.
          </p>
        )}
        <p className="prefix-hint">
          Page {page} of {totalPages}
          {githubTotal > 0 && (
            <>
              {" "}
              · {githubTotal} matching GitHub accounts · {result.totalUsernames}{" "}
              with profiles on this page
            </>
          )}
        </p>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={onUsernamePageChange ?? (() => {})}
          loading={usernamePageLoading}
        />
        {result.matches.map((match) => (
          <div key={match.username} className="username-match-card">
            <div className="username-match-header">
              <span className="mono username-match-name">@{match.username}</span>
              <Badge variant="success">{match.foundCount} platforms</Badge>
            </div>
            <div className="username-match-platforms">
              {match.platforms.map((p) => (
                <div key={`${match.username}-${p.platform}`} className="platform-card">
                  <div className="platform-header">
                    <a href={p.url} target="_blank" rel="noreferrer" className="platform-link">
                      {p.platform}
                    </a>
                  </div>
                  {p.profileData && (
                    <div className="platform-meta">
                      {Object.entries(p.profileData)
                        .filter(([k]) => k !== "avatar_url")
                        .slice(0, 4)
                        .map(([k, v]) => (
                          <span key={k} className="meta-tag">
                            {k}: {String(v)}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {result.matches.length === 0 && (
          <p>No matching accounts with profiles on this page.</p>
        )}
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={onUsernamePageChange ?? (() => {})}
            loading={usernamePageLoading}
          />
        )}
      </>
    );
  }

  if (module === "username" && data.platforms && !data.matches) {
    return (
      <p className="error-text">
        Backend returned a single-username result. Restart the dev server and try
        again.
      </p>
    );
  }

  return <pre className="json-preview">{JSON.stringify(data, null, 2)}</pre>;
}

export function TechnicalResults({
  modules,
  onUsernamePageChange,
  usernamePageLoading,
}: {
  modules: Record<string, unknown>;
  onUsernamePageChange?: (page: number) => void;
  usernamePageLoading?: boolean;
}) {
  return (
    <>
      {Object.entries(modules).map(([module, data]) => (
        <ResultCard key={module} title={module.toUpperCase()}>
          <InvestigateModuleResults
            module={module}
            data={data as Record<string, unknown>}
            onUsernamePageChange={module === "username" ? onUsernamePageChange : undefined}
            usernamePageLoading={usernamePageLoading}
          />
        </ResultCard>
      ))}
    </>
  );
}
