const IPV4 =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const IPV6 = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
const DOMAIN =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME = /^[a-zA-Z0-9_.-]{2,32}$/;

const HEBREW = /[\u0590-\u05FF]/;

// Strip invisible bidi marks, zero-width chars, NBSP
const INVISIBLE =
  /[\u200B-\u200F\u202A-\u202E\u2060-\u2069\u061C\u00A0\uFEFF]/g;

export function isValidIP(ip: string): boolean {
  return IPV4.test(ip) || IPV6.test(ip);
}

export function normalizeDomain(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split(":")[0]
    .toLowerCase();
}

export function isValidDomain(domain: string): boolean {
  return DOMAIN.test(domain);
}

export function isValidEmail(email: string): boolean {
  return EMAIL.test(email.trim().toLowerCase());
}

export function isValidUsername(username: string): boolean {
  return USERNAME.test(username.trim());
}

export function containsHebrew(text: string): boolean {
  return HEBREW.test(text);
}

function cleanPart(part: string): string {
  return part.replace(INVISIBLE, "").trim();
}

/** Normalize invisible chars and collapse whitespace. */
export function normalizePersonName(name: string): string {
  return name
    .replace(INVISIBLE, "")
    .trim()
    .replace(/\s+/g, " ");
}

/** Split on spaces, hyphens, Hebrew maqaf, and en/em dashes. */
export function splitPersonNameParts(name: string): string[] {
  return normalizePersonName(name)
    .split(/[\s\u05BE\u2010-\u2015\u2212-]+/)
    .map(cleanPart)
    .filter((p) => /\p{L}/u.test(p));
}

export function isValidPersonName(name: string): boolean {
  return splitPersonNameParts(name).length >= 2;
}

export function parsePersonName(name: string): {
  first: string;
  last: string;
  full: string;
} {
  const parts = splitPersonNameParts(name);
  const first = parts[0] || "";
  const last = parts.slice(1).join(" ");
  return { first, last, full: parts.join(" ") };
}
