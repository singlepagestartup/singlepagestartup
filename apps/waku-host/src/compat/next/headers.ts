import { unstable_getHeaders } from "waku/server";

type CookieValue = {
  name: string;
  value: string;
};

function parseCookies(cookieHeader: string): Map<string, string> {
  return cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((cookies, entry) => {
      const separatorIndex = entry.indexOf("=");
      const name =
        separatorIndex >= 0 ? entry.slice(0, separatorIndex).trim() : entry;
      const value =
        separatorIndex >= 0 ? entry.slice(separatorIndex + 1).trim() : "";

      if (name) {
        cookies.set(name, decodeURIComponent(value));
      }

      return cookies;
    }, new Map<string, string>());
}

export async function cookies() {
  const headers = unstable_getHeaders();
  const parsedCookies = parseCookies(headers.cookie || "");

  return {
    get(name: string): CookieValue | undefined {
      const value = parsedCookies.get(name);

      if (typeof value === "undefined") {
        return undefined;
      }

      return { name, value };
    },
    getAll(): CookieValue[] {
      return Array.from(parsedCookies.entries()).map(([name, value]) => ({
        name,
        value,
      }));
    },
    has(name: string): boolean {
      return parsedCookies.has(name);
    },
  };
}
