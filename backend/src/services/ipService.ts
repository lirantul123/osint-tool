import axios from "axios";

export interface IPLookupResult {
  ip: string;
  geo?: any;
  error?: string;
}

/**
 * Fetch IP info from ip-api.com (open source)
 */
export async function lookupIP(ip: string): Promise<IPLookupResult> {
  try {
    const url = `http://ip-api.com/json/${ip}`;
    const { data } = await axios.get(url);
    if (data.status !== "success") throw new Error("IP not found");
    return { ip, geo: data };
  } catch (err: unknown) {
    return { ip, error: (err as Error).message };
  }
}
