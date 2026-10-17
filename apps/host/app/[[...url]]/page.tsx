import { api as metadataApi } from "@sps/host/models/metadata/sdk/server";
import { internationalization } from "@sps/shared-configuration";
import { Component as HostModulePage } from "@sps/host/models/page/frontend/component";
import { notFound } from "next/navigation";
import { Component as Admin } from "../../src/components/admin";
import { Component as AdminV2 } from "../../src/components/admin-v2";

export const revalidate = 86400;
export const dynamicParams = true;
export const experimental_ppr = true;

export async function generateStaticParams() {
  // Dynamic masks include user-owned entities and can expand to millions of
  // paths. Both build and dev leave the manifest empty; dynamicParams permits
  // on-demand rendering, subject to each page's fetch and cache behavior.
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

  if (slashedUrl.startsWith("/admin")) {
    return <AdminV2 isServer={true} url={slashedUrl} language={language} />;
  }

  return (
    <HostModulePage
      isServer={true}
      variant="find-by-url"
      url={slashedUrl}
      silentNotFound={true}
    >
      {({ data }) => {
        if (!data) {
          throw notFound();
        }

        return (
          <>
            <Admin isServer={true} />
            <HostModulePage
              isServer={true}
              variant={data?.variant as any}
              data={data}
              url={slashedUrl}
              language={language}
            />
          </>
        );
      }}
    </HostModulePage>
  );
}
