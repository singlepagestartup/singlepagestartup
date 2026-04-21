import { api as spsHostPageApi } from "@sps/host/models/page/sdk/server";
import { api as metadataApi } from "@sps/host/models/metadata/sdk/server";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { notFound } from "next/navigation";
import {
  renderSitePageByUrl,
  resolveRouteContext,
} from "../../src/runtime/site";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  const productionBuild = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;

  const urls = await spsHostPageApi
    .urls({ catchErrors: true })
    .catch(() => undefined);

  if (!productionBuild) {
    return (
      urls?.filter((url) => {
        if (url.url.length === 0) {
          return false;
        }

        return true;
      }) || []
    );
  }

  return [];
}

export async function generateMetadata(props: any) {
  return metadataApi.generate({ catchErrors: true, ...props }).catch(() => {
    return undefined;
  });
}

export default async function Page(props: {
  params: Promise<{ url?: string[] }>;
}) {
  const routeContext = resolveRouteContext(await props.params);
  const page = await renderSitePageByUrl(routeContext);

  if (!page) {
    throw notFound();
  }

  return page;
}
