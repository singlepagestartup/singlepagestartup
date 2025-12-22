import { NEXT_PUBLIC_HOST_SERVICE_URL } from "@sps/shared-utils";
import { api } from "@sps/host/models/page/sdk/server";

async function generateSiteMap() {
  try {
    const pages = await api.urls({});

    if (!pages) {
      return `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
      </urlset>
    `;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
     <urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
       ${pages
         ?.map((page) => {
           return `
             <url>
                 <loc>${`${NEXT_PUBLIC_HOST_SERVICE_URL}/${page.url.join("/")}`}</loc>
             </url>
           `;
         })
         .join("")}
     </urlset>
   `;
  } catch (error) {
    console.log("generateSiteMap ~ error:", error);

    return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
    </urlset>
  `;
  }
}

export async function GET() {
  const body = await generateSiteMap();

  return new Response(body, {
    status: 200,
    headers: {
      "Cache-control": "public, s-maxage=86400, stale-while-revalidate",
      "content-type": "application/xml",
    },
  });
}
