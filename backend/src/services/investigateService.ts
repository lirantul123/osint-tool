import { lookupIP } from "./ipService";
import { lookupDomain } from "./domainService";
import { lookupDNS } from "./dnsService";
import { enumerateSubdomains } from "./subdomainService";
import { searchUsernamePrefix } from "./usernameService";
import { lookupEmail } from "./emailService";
import {
  isValidIP,
  isValidDomain,
  isValidEmail,
  isValidUsername,
  normalizeDomain,
} from "../utils/validators";

export type TargetType = "ip" | "domain" | "email" | "username";

export interface InvestigationResult {
  target: string;
  type: TargetType;
  modules: Record<string, unknown>;
  completedAt: string;
  error?: string;
}

function detectType(target: string): TargetType | null {
  const t = target.trim();
  if (isValidIP(t)) return "ip";
  if (isValidEmail(t)) return "email";
  if (isValidUsername(t) && !t.includes(".")) return "username";
  if (isValidDomain(normalizeDomain(t))) return "domain";
  return null;
}

export interface InvestigateOptions {
  page?: number;
  deepScan?: boolean;
}

export async function runInvestigation(
  target: string,
  options: InvestigateOptions = {}
): Promise<InvestigationResult> {
  const type = detectType(target);
  if (!type) {
    return {
      target,
      type: "domain",
      modules: {},
      completedAt: new Date().toISOString(),
      error:
        "Could not determine target type. Enter an IP, domain, email, or username.",
    };
  }

  const modules: Record<string, unknown> = {};

  switch (type) {
    case "ip": {
      const [ipResult] = await Promise.all([lookupIP(target.trim())]);
      modules.ip = ipResult;
      break;
    }
    case "domain": {
      const domain = normalizeDomain(target);
      const [domainResult, dnsResult, subdomainResult] = await Promise.all([
        lookupDomain(domain),
        lookupDNS(domain),
        enumerateSubdomains(domain),
      ]);
      modules.domain = domainResult;
      modules.dns = dnsResult;
      modules.subdomains = subdomainResult;
      break;
    }
    case "email": {
      modules.email = await lookupEmail(target.trim());
      break;
    }
    case "username": {
      modules.username = await searchUsernamePrefix(target.trim(), {
        page: options.page ?? 1,
        deepScan: options.deepScan ?? false,
      });
      break;
    }
  }

  return {
    target: target.trim(),
    type,
    modules,
    completedAt: new Date().toISOString(),
  };
}
