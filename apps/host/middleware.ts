import { internationalization } from "@sps/shared-configuration";
import { NextResponse } from "next/server";

export async function middleware(request: any) {
  const { pathname, origin } = request.nextUrl;
  const defaultLanguage = internationalization.defaultLanguage.code;

  const pathSegments = pathname.split("/").filter(Boolean);
  const hasLanguagePrefix =
    pathSegments.length > 0 &&
    internationalization.languages.some(
      (lang) => lang.code === pathSegments[0],
    );

  if (!hasLanguagePrefix) {
    return NextResponse.redirect(`${origin}/${defaultLanguage}${pathname}`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|images|_next/static|_next/image|sitemap|robots|api|favicon).*)",
  ],
};
