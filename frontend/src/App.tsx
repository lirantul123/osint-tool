import IPLookup from "./components/IPLookup";
import DomainLookup from "./components/DomainLookup";
import SocialSearch from "./components/SocialSearch";

function App() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🔍 OSINT Toolkit</h1>

      <div style={styles.grid}>
        <IPLookup />
        <DomainLookup />
        <SocialSearch />
      </div>
    </div>
  );
}

export default App;

const styles = {
  container: {
    padding: "30px",
    fontFamily: "Arial, sans-serif",
    background: "#f4f7fb",
    minHeight: "100vh",
  },
  title: {
    textAlign: "center" as const,
    marginBottom: "30px",
    fontSize: "36px",
    color: "#222",
    fontWeight: 700,
  },
  grid: {
    display: "grid",
    gap: "20px",
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
  },
};
