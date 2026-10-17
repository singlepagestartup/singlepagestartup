import { internationalization } from "@sps/shared-configuration";
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
