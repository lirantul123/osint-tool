import dns from "dns/promises";
import whois from "whois-json";

export interface DomainLookupResult {
  domain: string;
  addresses?: { address: string; family: number }[];
  whois?: any;
  error?: string;
}

/**
 * Lookup domain IP addresses and WHOIS info
 */
export async function lookupDomain(input: string): Promise<DomainLookupResult> {
  try {
    const domain = input.replace(/^https?:\/\//, "").split("/")[0];

    let addresses: any[] = [];
    try {
      addresses = await dns.lookup(domain, { all: true });
    } catch (dnsErr: unknown) {
      console.warn("DNS lookup failed:", (dnsErr as Error).message);
    }

    let whoisData: any = {};
    try {
      whoisData = await whois(domain);
    } catch (whoisErr: unknown) {
      console.warn("WHOIS lookup failed:", (whoisErr as Error).message);
    }

    if (addresses.length === 0 && Object.keys(whoisData).length === 0) {
      return { domain, error: "Cannot resolve domain or fetch WHOIS" };
    }

    return { domain, addresses, whois: whoisData };
  } catch (err: unknown) {
    return { 
      domain: input || "unknown",
      error: (err as Error).message || "Lookup failed" 
    };
  }
}
