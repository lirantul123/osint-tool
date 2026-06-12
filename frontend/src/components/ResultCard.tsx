import type { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
  variant?: "default" | "error" | "success";
}

export default function ResultCard({
  title,
  children,
  variant = "default",
}: Props) {
  return (
    <div className={`result-card result-${variant}`}>
      <h3>{title}</h3>
      <div className="result-body">{children}</div>
    </div>
  );
}

export function DataRow({ label, value }: { label: string; value: ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="data-row">
      <span className="data-label">{label}</span>
      <span className="data-value">{value}</span>
    </div>
  );
}

export function Badge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}
