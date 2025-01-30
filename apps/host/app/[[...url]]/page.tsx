import { api as spsHostPageApi } from "@sps/host/models/page/sdk/server";
import { App as Host } from "@sps/host/frontend/component";
import { api as metadataApi } from "@sps/host/models/metadata/sdk/server";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { internationalization } from "@sps/shared-configuration";

export const revalidate = 86400;
export const dynamicParams = true;
export const experimental_ppr = true;

export async function generateStaticParams() {
  const productionBuild = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;

  const urls = await spsHostPageApi.urls({ catchErrors: true });

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
  return metadataApi.generate({ catchErrors: true, ...props });
}

export default async function Page(props: {
  params: Promise<{ url?: string[] }>;
}) {
  const params = await props.params;
  const languages = internationalization.languages.map((lang) => lang.code);
  const defaultLanguage = internationalization.defaultLanguage.code;

  let urlSegments = params.url || [];
  let language = defaultLanguage;

  if (urlSegments.length > 0 && languages.includes(urlSegments[0])) {
    language = urlSegments[0];
    urlSegments = urlSegments.slice(1);
  }

  const pageUrl = urlSegments.join("/") || "/";
  const slashedUrl = pageUrl.startsWith("/") ? pageUrl : `/${pageUrl}`;

  return (
    <Host
      isServer={true}
      variant="default"
      url={slashedUrl}
      language={language}
    />
  );
}
