import dns from "dns/promises";
import { normalizeDomain, isValidDomain } from "../utils/validators";

export interface DNSRecord {
  type: string;
  value: string | string[];
}

export interface DNSLookupResult {
  domain: string;
  records: DNSRecord[];
  error?: string;
}

async function safeResolve<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function lookupDNS(input: string): Promise<DNSLookupResult> {
  const domain = normalizeDomain(input);
  if (!domain) return { domain: "", records: [], error: "Domain is required" };
  if (!isValidDomain(domain))
    return { domain, records: [], error: "Invalid domain format" };

  const records: DNSRecord[] = [];

  const [a, aaaa, mx, txt, ns, cname, soa] = await Promise.all([
    safeResolve(() => dns.resolve4(domain), [] as string[]),
    safeResolve(() => dns.resolve6(domain), [] as string[]),
    safeResolve(() => dns.resolveMx(domain), [] as { exchange: string; priority: number }[]),
    safeResolve(() => dns.resolveTxt(domain), [] as string[][]),
    safeResolve(() => dns.resolveNs(domain), [] as string[]),
    safeResolve(() => dns.resolveCname(domain), [] as string[]),
    safeResolve(() => dns.resolveSoa(domain), null as {
      nsname: string;
      hostmaster: string;
      serial: number;
    } | null),
  ]);

  if (a.length) records.push({ type: "A", value: a });
  if (aaaa.length) records.push({ type: "AAAA", value: aaaa });
  if (mx.length)
    records.push({
      type: "MX",
      value: mx.map((m: { exchange: string; priority: number }) => `${m.priority} ${m.exchange}`),
    });
  if (txt.length)
    records.push({ type: "TXT", value: txt.map((t: string[]) => t.join("")) });
  if (ns.length) records.push({ type: "NS", value: ns });
  if (cname.length) records.push({ type: "CNAME", value: cname });
  if (soa)
    records.push({
      type: "SOA",
      value: `${soa.nsname} ${soa.hostmaster} serial=${soa.serial}`,
    });

  if (records.length === 0) {
    return { domain, records: [], error: "No DNS records found" };
  }

  return { domain, records };
}
