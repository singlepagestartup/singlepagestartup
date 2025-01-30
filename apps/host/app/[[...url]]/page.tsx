import { api as spsHostPageApi } from "@sps/host/models/page/sdk/server";
import { App as Host } from "@sps/host/frontend/component";
import { api as metadataApi } from "@sps/host/models/metadata/sdk/server";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { cookies } from "next/headers";
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
  const language =
    (await cookies()).get("language")?.value ||
    internationalization.defaultLanguage.code;

  const { url } = await props.params;

  const pageUrl = url?.join("/") || "/";
  const slashedUrl = pageUrl.startsWith("/") ? pageUrl : `/${pageUrl}`;

  return (
    <div>
      <p className="p-10 font-4xl">language: {language}</p>
      <Host
        isServer={true}
        variant="default"
        url={slashedUrl}
        language={language}
      />
    </div>
  );
}
