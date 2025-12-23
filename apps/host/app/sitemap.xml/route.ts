import { sitemap } from "@sps/host/frontend/component";

export const revalidate = 60; // 1 minute

export async function GET() {
  return sitemap.GET();
}
