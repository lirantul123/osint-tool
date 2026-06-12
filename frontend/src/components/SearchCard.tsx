import type { FormEvent, ReactNode } from "react";

interface Props {
  title: string;
  description: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  buttonLabel?: string;
  children?: ReactNode;
}

export default function SearchCard({
  title,
  description,
  placeholder,
  value,
  onChange,
  onSubmit,
  loading,
  buttonLabel = "Search",
  children,
}: Props) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <div className="page">
      <header className="page-header">
        <h2>{title}</h2>
        <p>{description}</p>
      </header>

      <form className="search-form" onSubmit={handleSubmit}>
        <input
          className="search-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
        />
        <button className="search-btn" type="submit" disabled={loading}>
          {loading ? (
            <span className="spinner" />
          ) : (
            buttonLabel
          )}
        </button>
      </form>

      {children}
    </div>
  );
}
