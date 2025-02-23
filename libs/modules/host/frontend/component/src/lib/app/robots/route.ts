import { HOST_SERVICE_URL } from "@sps/shared-utils";

async function generateRobots() {
  return `User-agent: *\nSitemap: ${HOST_SERVICE_URL}/sitemap.xml`;
}

export async function GET() {
  const body = await generateRobots();

  return new Response(body, {
    status: 200,
    headers: {
      "Cache-control": "public, s-maxage=86400, stale-while-revalidate",
      "content-type": "text/plain",
    },
  });
}
