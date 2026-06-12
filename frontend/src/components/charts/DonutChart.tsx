interface DonutChartProps {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}

export default function DonutChart({ segments, size = 140 }: DonutChartProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = 40;
  const c = 2 * Math.PI * r;
  let offset = 0;

  const arcs = segments.map((seg) => {
    const pct = seg.value / total;
    const dash = pct * c;
    const arc = { ...seg, dash, gap: c - dash, offset };
    offset += dash;
    return arc;
  });

  return (
    <div className="chart-donut-wrap">
      <svg width={size} height={size} viewBox="0 0 100 100" className="chart-donut">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="12" />
        {arcs.map((arc) => (
          <circle
            key={arc.label}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth="12"
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={-arc.offset + c / 4}
            className="chart-donut-segment"
          />
        ))}
        <text x="50" y="48" textAnchor="middle" className="chart-donut-total">
          {total}
        </text>
        <text x="50" y="58" textAnchor="middle" className="chart-donut-sub">
          total
        </text>
      </svg>
      <div className="chart-donut-legend">
        {segments.map((seg) => (
          <div key={seg.label} className="chart-legend-item">
            <span className="chart-legend-dot" style={{ background: seg.color }} />
            <span>{seg.label}</span>
            <span className="chart-legend-val">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
