import { NextRequest, NextResponse } from "next/server";
import { internationalization } from "@sps/shared-configuration";

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const languages = internationalization.languages.map((language) => {
    return language.code;
  });
  const defaultLocale = internationalization.defaultLanguage.code;

  const browserLanguage = request.headers
    .get("accept-language")
    ?.split(",")[0]
    .split("-")[0];

  const languageFromQuery = url.searchParams.get("language");
  const languageFromCookie = request.cookies.get("language")?.value;

  let language = defaultLocale;

  if (languages.includes(languageFromQuery || "")) {
    language = languageFromQuery!;
  } else if (languages.includes(languageFromCookie || "")) {
    language = languageFromCookie!;
  } else if (languages.includes(browserLanguage || "")) {
    language = browserLanguage!;
  }

  const response = NextResponse.next();
  response.cookies.set("language", language, { path: "/", httpOnly: false });

  return response;
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, images, sitemap, robots)
    "/((?!_next|_next/static|_next/image|sitemap|robots|api|favicon).*)",
  ],
};
