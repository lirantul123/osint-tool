import { Link } from "react-router-dom";

const MODULES = [
  { label: "IP", icon: "◉" },
  { label: "Domain", icon: "◇" },
  { label: "DNS", icon: "▣" },
  { label: "Subdomains", icon: "▤" },
  { label: "Email", icon: "✉" },
  { label: "Username", icon: "◎" },
  { label: "People", icon: "◈" },
];

export default function Dashboard() {
  return (
    <div className="page">
      <header className="page-header hero">
        <h2>Intelligence Dashboard</h2>
        <p>
          One unified OSINT workflow — investigate any target or person, then
          review analytics in Statistics.
        </p>
      </header>

      <div className="dashboard-actions">
        <Link to="/investigate" className="investigate-feature">
          <div className="investigate-feature-head">
            <span className="tool-icon">◎</span>
            <div>
              <h3>Investigate</h3>
              <p>
                IP, domain, DNS, subdomains, email, username, or full name —
                all modules run automatically from a single search.
              </p>
            </div>
            <span className="tool-arrow">→</span>
          </div>
          <div className="module-chips">
            {MODULES.map((m) => (
              <span key={m.label} className="module-chip">
                <span className="module-chip-icon">{m.icon}</span>
                {m.label}
              </span>
            ))}
          </div>
        </Link>

        <Link to="/statistics" className="stats-feature">
          <span className="tool-icon">▥</span>
          <div>
            <h3>Statistics</h3>
            <p>Charts, trends, and search history from your sessions.</p>
          </div>
          <span className="tool-arrow">→</span>
        </Link>
      </div>

      <div className="info-banner">
        <strong>⚠ Responsible Use</strong>
        <p>
          This tool is for authorized security research, CTF challenges, and
          legitimate investigations only. Respect privacy laws and platform ToS.
        </p>
      </div>
    </div>
  );
}
