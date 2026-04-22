import { internationalization } from "@sps/shared-configuration";

import { RouteRenderContext } from "./types";

interface ParamsInput {
  url?: string[];
}

export function resolveRouteContext(params?: ParamsInput): RouteRenderContext {
  const languages = internationalization.languages.map((lang) => lang.code);
  const defaultLanguage = internationalization.defaultLanguage.code;

  let urlSegments = params?.url || [];
  let language = defaultLanguage;

  if (urlSegments.length > 0 && languages.includes(urlSegments[0])) {
    language = urlSegments[0];
    urlSegments = urlSegments.slice(1);
  }

  const pageUrl = urlSegments.join("/") || "/";
  const url = pageUrl.startsWith("/") ? pageUrl : `/${pageUrl}`;

  return {
    url,
    language,
    isAdminRoute: url.startsWith("/admin"),
  };
}
