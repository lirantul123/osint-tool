import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import BarChart from "../components/charts/BarChart";
import DonutChart from "../components/charts/DonutChart";
import LineChart from "../components/charts/LineChart";
import ResultCard from "../components/ResultCard";
import {
  getHistory,
  clearHistory,
  computeStats,
} from "../lib/investigationHistory";

const TYPE_LABELS: Record<string, string> = {
  ip: "IP",
  domain: "Domain",
  email: "Email",
  username: "Username",
  person: "Person",
};

const TYPE_COLORS: Record<string, string> = {
  ip: "#06b6d4",
  domain: "#8b5cf6",
  email: "#f59e0b",
  username: "#10b981",
  person: "#3b82f6",
};

export default function StatisticsPage() {
  const [tick, setTick] = useState(0);

  const entries = useMemo(() => getHistory(), [tick]);
  const stats = useMemo(() => computeStats(entries), [entries]);

  const typeChart = Object.entries(stats.byType)
    .sort((a, b) => b[1] - a[1])
    .map(([type, value]) => ({
      label: TYPE_LABELS[type] || type,
      value,
      color: TYPE_COLORS[type],
    }));

  function handleClear() {
    if (window.confirm("Clear all investigation history?")) {
      clearHistory();
      setTick((t) => t + 1);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h2>Statistics</h2>
        <p>
          Analytics from your investigation sessions — search volume, target
          breakdown, and activity trends.
        </p>
      </header>

      <div className="stats-overview">
        <div className="stat">
          <span className="stat-num">{stats.total}</span>
          <span className="stat-label">Total searches</span>
        </div>
        <div className="stat">
          <span className="stat-num">{stats.thisWeek}</span>
          <span className="stat-label">This week</span>
        </div>
        <div className="stat">
          <span className="stat-num">{stats.avgResults}</span>
          <span className="stat-label">Avg results</span>
        </div>
        <div className="stat">
          <span className="stat-num">{stats.successRate}%</span>
          <span className="stat-label">Success rate</span>
        </div>
      </div>

      {stats.total === 0 ? (
        <ResultCard title="No data yet">
          <p>
            Run investigations from the{" "}
            <Link to="/investigate" className="inline-link">
              Investigate
            </Link>{" "}
            page — stats and charts will appear here automatically.
          </p>
        </ResultCard>
      ) : (
        <>
          <div className="chart-grid">
            <ResultCard title="Searches by type">
              <BarChart data={typeChart} />
            </ResultCard>

            <ResultCard title="Search modes">
              <DonutChart
                segments={[
                  { label: "Target", value: stats.byMode.target, color: "#06b6d4" },
                  { label: "Person", value: stats.byMode.person, color: "#3b82f6" },
                ]}
              />
            </ResultCard>
          </div>

          <ResultCard title="Activity — last 7 days">
            <LineChart
              data={stats.last7Days.map((d) => ({
                label: d.label,
                value: d.count,
              }))}
            />
          </ResultCard>

          <ResultCard title="Recent investigations">
            <div className="stats-table-wrap">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Target</th>
                    <th>Type</th>
                    <th>Results</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.map((e) => (
                    <tr key={e.id}>
                      <td className="mono">{e.target}</td>
                      <td>
                        <span className={`type-pill type-${e.type}`}>
                          {TYPE_LABELS[e.type] || e.type}
                        </span>
                      </td>
                      <td>{e.resultCount}</td>
                      <td className="stats-time">
                        {new Date(e.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ResultCard>

          <div className="stats-actions">
            <button type="button" className="export-btn" onClick={() => setTick((t) => t + 1)}>
              Refresh
            </button>
            <button type="button" className="export-btn export-btn-danger" onClick={handleClear}>
              Clear history
            </button>
          </div>
        </>
      )}
    </div>
  );
}
