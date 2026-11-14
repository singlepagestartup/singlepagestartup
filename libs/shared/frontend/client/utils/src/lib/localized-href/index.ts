import { internationalization } from "@sps/shared-configuration";

export function getLanguageSwitchHref(
  location: Pick<Location, "pathname" | "search" | "hash">,
  targetLanguage: string,
): string {
  const segments = location.pathname.split("/");
  const hasLanguage = internationalization.languages.some(
    (language) => language.code === segments[1],
  );
  if (hasLanguage) {
    segments[1] = targetLanguage;
  } else {
    segments.splice(1, 0, targetLanguage);
  }
  return segments.join("/") + location.search + location.hash;
}

export function getLocalizedHref(pathname: string, href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const languages = internationalization.languages.map(
    (language) => language.code,
  );
  const current = pathname.split("/")[1];
  const destination = href.split(/[/?#]/)[1];
  return languages.includes(current) && !languages.includes(destination)
    ? `/${current}${href}`
    : href;
}
