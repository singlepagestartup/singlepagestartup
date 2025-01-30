import { NextResponse } from "next/server";

export async function middleware(request: any) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, images, sitemap, robots)
    "/((?!_next|_next/static|_next/image|sitemap|robots|api|favicon).*)",
  ],
};
