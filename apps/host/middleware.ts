import { internationalization } from "@sps/shared-configuration";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const defaultLanguage = internationalization.defaultLanguage.code;

  const pathSegments = pathname.split("/").filter(Boolean);
  const hasLanguagePrefix =
    pathSegments.length > 0 &&
    internationalization.languages.some(
      (lang) => lang.code === pathSegments[0],
    );

  if (!hasLanguagePrefix) {
    const nextUrl = request.nextUrl.clone();
    const requestHost = request.headers.get("host");

    if (requestHost) {
      // Setting a host without a port retains the URL's existing port.
      nextUrl.port = "";
      nextUrl.host = requestHost;
    }

    nextUrl.pathname = `/${defaultLanguage}${pathname}`;
    return NextResponse.redirect(nextUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|images|_next/static|_next/image|sitemap|robots|api|favicon|healthz|google[a-zA-Z0-9]+\\.html).*)",
  ],
};
