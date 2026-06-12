const STORAGE_KEY = "osint-investigation-history";
const MAX_ENTRIES = 200;

export interface HistoryEntry {
  id: string;
  mode: "target" | "person";
  target: string;
  type: string;
  moduleCount: number;
  resultCount: number;
  success: boolean;
  timestamp: string;
}

function load(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function save(entries: HistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export function getHistory(): HistoryEntry[] {
  return load();
}

export function addHistoryEntry(entry: Omit<HistoryEntry, "id" | "timestamp">) {
  const entries = load();
  entries.unshift({
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  });
  save(entries);
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

export function computeStats(entries: HistoryEntry[]) {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = entries.filter((e) => new Date(e.timestamp).getTime() >= weekAgo);

  const byType: Record<string, number> = {};
  const byDay: Record<string, number> = {};
  let totalResults = 0;
  let successes = 0;

  for (const e of entries) {
    byType[e.type] = (byType[e.type] || 0) + 1;
    totalResults += e.resultCount;
    if (e.success) successes += 1;

    const day = e.timestamp.slice(0, 10);
    byDay[day] = (byDay[day] || 0) + 1;
  }

  const last7Days: { date: string; label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    last7Days.push({
      date: key,
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      count: byDay[key] || 0,
    });
  }

  const byMode = {
    target: entries.filter((e) => e.mode === "target").length,
    person: entries.filter((e) => e.mode === "person").length,
  };

  return {
    total: entries.length,
    thisWeek: thisWeek.length,
    avgResults: entries.length ? Math.round(totalResults / entries.length) : 0,
    successRate: entries.length ? Math.round((successes / entries.length) * 100) : 0,
    byType,
    byMode,
    last7Days,
    recent: entries.slice(0, 10),
  };
}
