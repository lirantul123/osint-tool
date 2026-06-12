import dns from "dns/promises";
import axios from "axios";
import crypto from "crypto";
import { isValidEmail } from "../utils/validators";

export interface EmailLookupResult {
  email: string;
  valid: boolean;
  domain?: string;
  mxRecords?: string[];
  reputation?: {
    reputation: string;
    suspicious: boolean;
    references: number;
    details?: Record<string, unknown>;
  };
  gravatar?: {
    exists: boolean;
    url: string;
  };
  error?: string;
}

export async function lookupEmail(email: string): Promise<EmailLookupResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { email: "", valid: false, error: "Email is required" };
  if (!isValidEmail(normalized))
    return { email: normalized, valid: false, error: "Invalid email format" };

  const domain = normalized.split("@")[1];
  const result: EmailLookupResult = { email: normalized, valid: true, domain };

  try {
    const mx = await dns.resolveMx(domain);
    result.mxRecords = mx
      .sort((a, b) => a.priority - b.priority)
      .map((m) => `${m.priority} ${m.exchange}`);
  } catch {
    result.valid = false;
    result.error = "Domain has no MX records";
  }

  const hash = crypto.createHash("md5").update(normalized).digest("hex");
  const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=404`;
  try {
    const gravatarRes = await axios.head(gravatarUrl, { timeout: 5000 });
    result.gravatar = {
      exists: gravatarRes.status === 200,
      url: `https://www.gravatar.com/avatar/${hash}`,
    };
  } catch {
    result.gravatar = { exists: false, url: gravatarUrl };
  }

  try {
    const repRes = await axios.get(
      `https://emailrep.io/${encodeURIComponent(normalized)}`,
      {
        timeout: 10000,
        headers: { "User-Agent": "OSINT-Toolkit/1.0" },
      }
    );
    result.reputation = {
      reputation: repRes.data.reputation || "unknown",
      suspicious: Boolean(repRes.data.suspicious),
      references: repRes.data.references || 0,
      details: {
        free_provider: repRes.data.details?.free_provider,
        disposable: repRes.data.details?.disposable,
        deliverable: repRes.data.details?.deliverable,
        domain_exists: repRes.data.details?.domain_exists,
        data_breach: repRes.data.details?.data_breach,
        credentials_leaked: repRes.data.details?.credentials_leaked,
      },
    };
  } catch {
    // emailrep.io may rate-limit; non-fatal
  }

  return result;
}
