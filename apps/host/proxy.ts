import {
  AI_CHAT_SIGN_IN_HREF,
  AI_CHAT_REGISTRATION_HREF,
  RBAC_EMAIL_PASSWORD_PATHS,
} from "@sps/shared-utils";
import { internationalization } from "@sps/shared-configuration";
import { NextResponse, type NextRequest } from "next/server";

const previousAuthPaths = new Map([
  ["/ai-chat/rbac/subjects/authentication/select-method", AI_CHAT_SIGN_IN_HREF],
  [
    "/ai-chat/rbac/subjects/authentication/registration",
    AI_CHAT_REGISTRATION_HREF,
  ],
  ["/ai-chat/sign-in", AI_CHAT_SIGN_IN_HREF],
  ["/ai-chat/create-account", AI_CHAT_REGISTRATION_HREF],
  ["/ai-chat/forgot-password", RBAC_EMAIL_PASSWORD_PATHS["forgot-password"]],
  ["/ai-chat/reset-password", RBAC_EMAIL_PASSWORD_PATHS["reset-password"]],
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const defaultLanguage = internationalization.defaultLanguage.code;

  const pathSegments = pathname.split("/").filter(Boolean);
  const hasLanguagePrefix =
    pathSegments.length > 0 &&
    internationalization.languages.some(
      (lang) => lang.code === pathSegments[0],
    );

  const language = hasLanguagePrefix ? pathSegments[0] : defaultLanguage;
  const path = hasLanguagePrefix ? pathSegments.slice(1) : pathSegments;
  const destination = previousAuthPaths.get("/" + path.join("/"));

  if (!hasLanguagePrefix || destination) {
    const nextUrl = request.nextUrl.clone();
    const requestHost = request.headers.get("host");

    if (requestHost) {
      // Setting a host without a port retains the URL's existing port.
      nextUrl.port = "";
      nextUrl.host = requestHost;
    }

    if (destination) {
      const target = new URL(destination, nextUrl.origin);
      nextUrl.pathname = `/${language}${target.pathname}`;
      target.searchParams.forEach((value, key) =>
        nextUrl.searchParams.set(key, value),
      );
    } else {
      nextUrl.pathname = `/${defaultLanguage}${pathname}`;
    }
    return NextResponse.redirect(nextUrl, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|images|_next/static|_next/image|sitemap|robots|api|favicon|healthz|google[a-zA-Z0-9]+\\.html).*)",
  ],
};
