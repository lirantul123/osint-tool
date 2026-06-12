import dns from "dns/promises";
import whois from "whois-json";
import axios from "axios";
import { normalizeDomain, isValidDomain } from "../utils/validators";

export interface DomainLookupResult {
  domain: string;
  addresses?: { address: string; family: number }[];
  whois?: Record<string, unknown>;
  ssl?: SSLInfo;
  headers?: Record<string, string>;
  error?: string;
}

export interface SSLInfo {
  valid: boolean;
  issuer?: string;
  subject?: string;
  validFrom?: string;
  validTo?: string;
  daysRemaining?: number;
}

export async function lookupDomain(input: string): Promise<DomainLookupResult> {
  const domain = normalizeDomain(input);
  if (!domain) return { domain: "", error: "Domain is required" };
  if (!isValidDomain(domain)) return { domain, error: "Invalid domain format" };

  try {
    let addresses: { address: string; family: number }[] = [];
    try {
      addresses = await dns.lookup(domain, { all: true });
    } catch (dnsErr: unknown) {
      console.warn("DNS lookup failed:", (dnsErr as Error).message);
    }

    let whoisData: Record<string, unknown> = {};
    try {
      whoisData = (await whois(domain)) as Record<string, unknown>;
    } catch (whoisErr: unknown) {
      console.warn("WHOIS lookup failed:", (whoisErr as Error).message);
    }

    let headers: Record<string, string> | undefined;
    try {
      const res = await axios.head(`https://${domain}`, {
        timeout: 8000,
        maxRedirects: 3,
        validateStatus: () => true,
      });
      headers = {
        server: String(res.headers["server"] || "unknown"),
        "content-type": String(res.headers["content-type"] || "unknown"),
        "x-powered-by": String(res.headers["x-powered-by"] || "none"),
        "strict-transport-security": String(
          res.headers["strict-transport-security"] || "none"
        ),
      };
    } catch {
      // HTTPS may not be available
    }

    if (addresses.length === 0 && Object.keys(whoisData).length === 0) {
      return { domain, error: "Cannot resolve domain or fetch WHOIS" };
    }

    return { domain, addresses, whois: whoisData, headers };
  } catch (err: unknown) {
    return {
      domain: input || "unknown",
      error: (err as Error).message || "Lookup failed",
    };
  }
}
