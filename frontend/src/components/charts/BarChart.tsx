interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
}

const COLORS = ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

export default function BarChart({ data, height = 160 }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="chart-bar" style={{ height }}>
      {data.map((d, i) => (
        <div key={d.label} className="chart-bar-col">
          <span className="chart-bar-value">{d.value || ""}</span>
          <div
            className="chart-bar-fill"
            style={{
              height: `${(d.value / max) * 100}%`,
              background: d.color || COLORS[i % COLORS.length],
            }}
          />
          <span className="chart-bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
