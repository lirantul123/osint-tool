import axios from "axios";
import dns from "dns/promises";
import { isValidIP } from "../utils/validators";

export interface GeoData {
  status: string;
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
  query?: string;
  mobile?: boolean;
  proxy?: boolean;
  hosting?: boolean;
}

export interface IPLookupResult {
  ip: string;
  geo?: GeoData;
  reverseDns?: string[];
  error?: string;
}

export async function lookupIP(ip: string): Promise<IPLookupResult> {
  if (!ip?.trim()) return { ip: "", error: "IP address is required" };
  if (!isValidIP(ip.trim())) return { ip, error: "Invalid IP address format" };

  try {
    const url = `http://ip-api.com/json/${ip.trim()}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query,mobile,proxy,hosting`;
    const { data } = await axios.get<GeoData>(url, { timeout: 10000 });

    if (data.status !== "success") {
      return { ip, error: "IP not found or lookup failed" };
    }

    let reverseDns: string[] = [];
    try {
      const hostnames = await dns.reverse(ip.trim());
      reverseDns = hostnames;
    } catch {
      // reverse DNS not available
    }

    return { ip: ip.trim(), geo: data, reverseDns };
  } catch (err: unknown) {
    return { ip, error: (err as Error).message };
  }
}
