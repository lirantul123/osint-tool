import { useState } from "react";
import axios from "axios";

interface IPLookupResult {
  ip: string;
  geo?: {
    country: string;
    regionName: string;
    city: string;
    lat: number;
    lon: number;
    isp: string;
  };
  error?: string;
}

export default function IPLookup() {
  const [ip, setIp] = useState("");
  const [result, setResult] = useState<IPLookupResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function lookup() {
    if (!ip) return alert("Enter an IP address");
    setLoading(true);

    try {
      const res = await axios.post<IPLookupResult>(
        "http://localhost:5000/api/ip",
        { ip }
      );
      setResult(res.data);
    } catch (err) {
      setResult({ ip, error: "Lookup failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.card}>
      <h2>IP Lookup</h2>
      <input
        value={ip}
        onChange={(e) => setIp(e.target.value)}
        placeholder="Enter IP address..."
        style={styles.input}
      />
      <button onClick={lookup} style={styles.button} disabled={loading}>
        {loading ? "Looking up..." : "Lookup"}
      </button>

      {result && (
        <pre style={styles.result}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
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
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  result: {
    marginTop: 15,
    background: "#f5f5f5",
    padding: 10,
    borderRadius: 8,
    whiteSpace: "pre-wrap" as const,
  },
};
