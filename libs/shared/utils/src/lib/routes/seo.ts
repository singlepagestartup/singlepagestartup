import {
  SEO_NON_INDEXABLE_PATHS,
  SEO_PUBLIC_ROUTE_COLLECTIONS,
} from "../constants/seo";

export interface ISeoRoute {
  pathname: string;
  language: string;
}

export interface ISeoCanonicalUrlProps {
  origin: string;
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
  const { pathname } = resolveSeoRoute(
    props.pathname,
    [props.language],
    props.language,
  );
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

/** Receives an unlocalized Page mask; check this before expanding its entities. */
export function isSeoIndexablePage(props: { url: string }): boolean {
  if (
    !props.url.startsWith("/") ||
    props.url.startsWith("//") ||
    props.url.includes("\\")
  ) {
    return false;
  }
  const pathname = pathnameOnly(props.url);
  if (SEO_NON_INDEXABLE_PATHS.some((pattern) => pattern.test(pathname)))
    return false;
  return pathname
    .split("/")
    .filter(Boolean)
    .every((segment) => {
      if (!/[\[\]]/.test(segment)) return true;
      const match = /^\[([^\[\]]+)\]$/.exec(segment);
      if (!match) return false;
      return SEO_PUBLIC_ROUTE_COLLECTIONS.some((collection) => {
        const paginationPrefix = `${collection}.:pagination:`;
        return (
          match[1] === `${collection}.slug` ||
          match[1] === `${collection}.id` ||
          (match[1].startsWith(paginationPrefix) &&
            /^[1-9]\d*$/.test(match[1].slice(paginationPrefix.length)))
        );
      });
    });
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
