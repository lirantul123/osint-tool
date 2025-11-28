import { useState } from "react";
import axios from "axios";

interface GitHubUser {
  login: string;
  id: number;
  html_url: string;
  avatar_url: string;
}

interface SocialSearchResult {
  query: string;
  results?: GitHubUser[];
  error?: string;
}

export default function SocialSearch() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SocialSearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function search() {
    if (!query) return alert("Enter a username or keyword");
    setLoading(true);
  
    try {
      const res = await axios.post<SocialSearchResult>(
        "http://localhost:5000/api/social",
        { query }
      );
      setResult(res.data);
    } catch (err) {
      setResult({ query, error: "Search failed" });
    } finally {
      setLoading(false);
    }
  }  

  return (
    <div style={styles.card}>
      <h2>Social Search (GitHub)</h2>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter GitHub username..."
        style={styles.input}
      />
      <button onClick={search} style={styles.button} disabled={loading}>
        {loading ? "Searching..." : "Search"}
      </button>

      {result && (
        <div style={styles.result}>
          {result.error ? (
            <p>{result.error}</p>
          ) : (
            result.results?.map((user) => (
              <div key={user.id} style={{ marginBottom: 10 }}>
                <img
                  src={user.avatar_url}
                  alt={user.login}
                  width={30}
                  height={30}
                  style={{ borderRadius: "50%", marginRight: 10 }}
                />
                <a href={user.html_url} target="_blank" rel="noreferrer">
                  {user.login}
                </a>
              </div>
            ))
          )}
        </div>
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
    background: "#f59e0b",
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
