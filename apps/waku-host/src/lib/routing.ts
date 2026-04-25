import { internationalization } from "@sps/shared-configuration";

export type TWakuPath = `/${string}`;
export type TLocalizedRoute = {
  hasLanguagePrefix: boolean;
  language: string;
  slashedUrl: TWakuPath;
  urlSegments: string[];
};

export const DEFAULT_LANGUAGE = internationalization.defaultLanguage.code;
export const SUPPORTED_LANGUAGES = internationalization.languages.map(
  (language) => language.code,
);

export function buildLocalizedPath(
  language: string,
  segments: string[] = [],
): TWakuPath {
  if (!segments.length) {
    return `/${language}`;
  }

  return `/${language}/${segments.join("/")}`;
}

export function toSlashedUrl(urlSegments?: string[]): TWakuPath {
  const pageUrl = urlSegments?.join("/") || "/";
  return pageUrl.startsWith("/") ? (pageUrl as TWakuPath) : `/${pageUrl}`;
}

export function getLocalizedRoute(urlSegments?: string[]): TLocalizedRoute {
  const segments = urlSegments || [];
  const [maybeLanguage, ...rest] = segments;

  if (maybeLanguage && SUPPORTED_LANGUAGES.includes(maybeLanguage)) {
    return {
      hasLanguagePrefix: true,
      language: maybeLanguage,
      slashedUrl: toSlashedUrl(rest),
      urlSegments: rest,
    };
  }

  return {
    hasLanguagePrefix: false,
    language: DEFAULT_LANGUAGE,
    slashedUrl: toSlashedUrl(segments),
    urlSegments: segments,
  };
}

export function toWakuPath(path: string): TWakuPath {
  return path as TWakuPath;
}
