import axios from "axios";
import { normalizeDomain, isValidDomain } from "../utils/validators";

export interface SubdomainResult {
  domain: string;
  subdomains: string[];
  source: string;
  total: number;
  error?: string;
}

interface CrtShEntry {
  name_value: string;
}

export async function enumerateSubdomains(
  input: string
): Promise<SubdomainResult> {
  const domain = normalizeDomain(input);
  if (!domain) return { domain: "", subdomains: [], source: "crt.sh", total: 0, error: "Domain is required" };
  if (!isValidDomain(domain))
    return { domain, subdomains: [], source: "crt.sh", total: 0, error: "Invalid domain format" };

  try {
    const url = `https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`;
    const { data } = await axios.get<CrtShEntry[]>(url, { timeout: 30000 });

    const found = new Set<string>();
    for (const entry of data) {
      const names = entry.name_value.split("\n");
      for (const name of names) {
        const cleaned = name.trim().toLowerCase().replace(/^\*\./, "");
        if (cleaned.endsWith(domain) && cleaned !== domain) {
          found.add(cleaned);
        }
      }
    }

    const subdomains = Array.from(found).sort();
    return {
      domain,
      subdomains,
      source: "crt.sh (Certificate Transparency)",
      total: subdomains.length,
    };
  } catch (err: unknown) {
    return {
      domain,
      subdomains: [],
      source: "crt.sh",
      total: 0,
      error: (err as Error).message || "Subdomain enumeration failed",
    };
  }
}
