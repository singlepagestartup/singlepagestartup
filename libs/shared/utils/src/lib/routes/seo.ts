export interface ISeoRoute {
  pathname: string;
  language: string;
}

export interface ISeoCanonicalUrlProps {
  origin: string;
  /** Already resolved pathname, without the locale prefix. */
  pathname: string;
  language: string;
}

function pathnameOnly(value: string): string {
  const path = value.split(/[?#]/, 1)[0];
  return `/${path.split("/").filter(Boolean).join("/")}`;
}

export function resolveSeoRoute(
  url: string,
  languages: string[],
  defaultLanguage: string,
): ISeoRoute {
  const parts = pathnameOnly(url).split("/").filter(Boolean);
  const language = languages.includes(parts[0])
    ? parts.shift()!
    : defaultLanguage;
  return { pathname: `/${parts.join("/")}`, language };
}

export function getSeoCanonicalUrl(props: ISeoCanonicalUrlProps): string {
  const origin = new URL(props.origin);
  if (
    !/^https?:$/.test(origin.protocol) ||
    origin.username ||
    origin.password
  ) {
    throw new Error("Invalid SEO origin. Expected a public HTTP(S) origin");
  }
  if (!/^[a-zA-Z0-9-]+$/.test(props.language)) {
    throw new Error("Invalid SEO language");
  }
  const pathname = pathnameOnly(props.pathname);
  const parts = pathname.split("/").filter(Boolean);
  if (
    parts.some((part) => /^(?:\.|%2e){1,2}$/i.test(part)) ||
    pathname.includes("\\")
  ) {
    throw new Error("Invalid SEO pathname");
  }
  return new URL(
    `/${props.language}${pathname === "/" ? "" : pathname}`,
    origin.origin,
  ).href;
}

/** Publication is a property of the persisted Host Page, independent of URL or content module. */
export function isSeoIndexablePage(page: { variant?: string }): boolean {
  return !["hidden", "draft", "noindex"].includes(page.variant || "default");
}

/** JSON embedded in script text must never contain an HTML closing tag. */
export function safeJsonLd(value: unknown): string {
  return (JSON.stringify(value) ?? "null")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
