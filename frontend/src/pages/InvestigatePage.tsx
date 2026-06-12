import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { post } from "../api/client";
import ResultCard, { Badge } from "../components/ResultCard";
import ResultStats from "../components/ResultStats";
import PeopleResults, { peopleStats, type PeopleResult } from "../components/PeopleResults";
import {
  TechnicalResults,
  technicalStats,
} from "../components/InvestigateModuleResults";
import { addHistoryEntry } from "../lib/investigationHistory";

type SearchMode = "target" | "person";

interface InvestigationResult {
  target: string;
  type: string;
  modules: Record<string, unknown>;
  completedAt: string;
  error?: string;
}

const MODE_CONFIG = {
  target: {
    label: "Target",
    hint: "IP · domain · email · username",
    placeholder: "8.8.8.8 / example.com / user@email.com / username",
    button: "Investigate",
  },
  person: {
    label: "Person",
    hint: "Full name · English or Hebrew",
    placeholder: "First Last",
    button: "Search Person",
  },
} as const;

export default function InvestigatePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode: SearchMode =
    searchParams.get("mode") === "person" ? "person" : "target";
  const [query, setQuery] = useState("");
  const [targetResult, setTargetResult] = useState<InvestigationResult | null>(null);
  const [peopleResult, setPeopleResult] = useState<PeopleResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [deepScanLoading, setDeepScanLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState("");

  function switchMode(next: SearchMode) {
    setSearchParams(next === "person" ? { mode: "person" } : {});
    setQuery("");
    setError("");
    setTargetResult(null);
    setPeopleResult(null);
  }

  async function runSearch(
    page = 1,
    opts: { isPageChange?: boolean; deepScan?: boolean } = {}
  ) {
    if (!query.trim()) return;
    const { isPageChange = false, deepScan = false } = opts;

    if (deepScan) {
      setDeepScanLoading(true);
    } else if (isPageChange) {
      setPageLoading(true);
    } else {
      setLoading(true);
      page = 1;
    }
    setError("");
    if (!isPageChange && !deepScan) {
      setTargetResult(null);
      setPeopleResult(null);
    }

    try {
      if (mode === "person") {
        const data = await post<PeopleResult>("/people", { name: query.trim() });
        setPeopleResult(data);
        if (!data.error && !isPageChange) {
          addHistoryEntry({
            mode: "person",
            target: query.trim(),
            type: "person",
            moduleCount: data.socialResults.length,
            resultCount: data.totalFound,
            success: data.totalFound > 0,
          });
        }
      } else {
        const data = await post<InvestigationResult>("/investigate", {
          target: query.trim(),
          page: String(page),
          ...(deepScan ? { deepScan: "true" } : {}),
        });
        setTargetResult(data);
        setCurrentPage(page);
        if (!data.error && !isPageChange && !deepScan) {
          const tStats = technicalStats(data.modules);
          const resultCount = tStats
            .filter((s) => s.label !== "Modules")
            .reduce((n, s) => n + (typeof s.value === "number" ? s.value : 0), 0);
          addHistoryEntry({
            mode: "target",
            target: query.trim(),
            type: data.type,
            moduleCount: Object.keys(data.modules).length,
            resultCount: resultCount || Object.keys(data.modules).length,
            success: Object.keys(data.modules).length > 0,
          });
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setPageLoading(false);
      setDeepScanLoading(false);
    }
  }

  function handleUsernamePageChange(page: number) {
    runSearch(page, { isPageChange: true });
  }

  function handleDeepScan() {
    runSearch(currentPage, { deepScan: true });
  }

  function exportJson() {
    const payload = mode === "person" ? peopleResult : targetResult;
    if (!payload) return;
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `osint-${query.trim()}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const config = MODE_CONFIG[mode];
  const hasResult =
    (mode === "target" && targetResult && !targetResult.error) ||
    (mode === "person" && peopleResult && !peopleResult.error);

  const stats =
    mode === "target" && targetResult
      ? technicalStats(targetResult.modules)
      : mode === "person" && peopleResult
        ? peopleStats(peopleResult)
        : [];

  return (
    <div className="page">
      <header className="page-header">
        <h2>Investigate</h2>
        <p>
          One search for technical targets and people — pick a mode, enter your
          query, and review unified results below.
        </p>
      </header>

      <div className="mode-switch" role="tablist" aria-label="Search mode">
        {(Object.keys(MODE_CONFIG) as SearchMode[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            className={`mode-btn ${mode === key ? "active" : ""}`}
            onClick={() => switchMode(key)}
          >
            <span className="mode-btn-label">{MODE_CONFIG[key].label}</span>
            <span className="mode-btn-hint">{MODE_CONFIG[key].hint}</span>
          </button>
        ))}
      </div>

      <form
        className="search-form"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(1);
        }}
      >
        <input
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={config.placeholder}
          disabled={loading}
          dir={mode === "person" ? "auto" : "ltr"}
        />
        <button className="search-btn" type="submit" disabled={loading}>
          {loading ? <span className="spinner" /> : config.button}
        </button>
      </form>

      {error && (
        <ResultCard title="Error" variant="error">
          <p>{error}</p>
        </ResultCard>
      )}

      {targetResult?.error && (
        <ResultCard title="Error" variant="error">
          <p>{targetResult.error}</p>
        </ResultCard>
      )}

      {hasResult && (
        <>
          <div className="investigate-header">
            <div className="investigate-meta">
              <Badge variant="default">
                {mode === "person" ? "PERSON" : targetResult!.type.toUpperCase()}
              </Badge>
              <span className="investigate-target">{query.trim()}</span>
            </div>
            <button className="export-btn" type="button" onClick={exportJson}>
              Export JSON
            </button>
          </div>

          <ResultStats stats={stats} />

          {mode === "person" && peopleResult && (
            <PeopleResults result={peopleResult} />
          )}

          {mode === "target" && targetResult && (
            <TechnicalResults
              modules={targetResult.modules}
              onUsernamePageChange={
                targetResult.type === "username" ? handleUsernamePageChange : undefined
              }
              onUsernameDeepScan={
                targetResult.type === "username" ? handleDeepScan : undefined
              }
              usernamePageLoading={pageLoading}
              usernameDeepScanLoading={deepScanLoading}
            />
          )}

          {mode === "target" && targetResult && (
            <p className="timestamp">
              Completed: {new Date(targetResult.completedAt).toLocaleString()}
            </p>
          )}
        </>
      )}
    </div>
  );
}
