interface Stat {
  label: string;
  value: number | string;
}

export default function ResultStats({ stats }: { stats: Stat[] }) {
  if (stats.length === 0) return null;

  return (
    <div className="stats-row stats-row-compact">
      {stats.map((s) => (
        <div key={s.label} className="stat">
          <span className="stat-num">{s.value}</span>
          <span className="stat-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
