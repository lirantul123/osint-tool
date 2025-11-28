import { useState } from "react";
import axios from "axios";

interface DomainResult {
  domain: string;
  addresses?: { address: string; family: number }[];
  whois?: any;
  error?: string;
}

export default function DomainLookup() {
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<DomainResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function lookup() {
    if (!domain) return alert("Enter domain or URL");
    setLoading(true);

    try {
      const res = await axios.post<DomainResult>(
        "http://localhost:5000/api/domain",
        { domain }
      );
      setResult(res.data);
    } catch (err) {
      setResult({ domain, error: "Lookup failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.card}>
      <h2>Domain Lookup</h2>
      <input
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        placeholder="Enter domain or URL..."
        style={styles.input}
      />
      <button onClick={lookup} style={styles.button} disabled={loading}>{loading ? "Loading..." : "Lookup"} </button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}

const styles = {
  card: {
    padding: 20,
    borderRadius: 12,
    background: "white",
    marginBottom: 20,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  input: {
    width: "100%",
    padding: 10,
    border: "1px solid #ddd",
    borderRadius: 8,
    marginBottom: 10,
  },
  button: {
    width: "100%",
    padding: 10,
    background: "green",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  result: {
    marginTop: 15,
    padding: 10,
  },
};
