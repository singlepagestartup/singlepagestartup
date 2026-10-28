import { cache } from "react";
import type { Metadata } from "next";
import { api as metadataApi } from "@sps/host/models/metadata/sdk/server";
import { api as pageApi } from "@sps/host/models/page/sdk/server";
import { internationalization } from "@sps/shared-configuration";
import { resolveSeoRoute, safeJsonLd } from "@sps/shared-utils";
import { Component as HostModulePage } from "@sps/host/models/page/frontend/component";
import { notFound } from "next/navigation";
import { Component as Admin } from "../../src/components/admin";
import { Component as AdminV2 } from "../../src/components/admin-v2";

// Visibility and locale are checked from the current request before streaming.
// An ISR fallback cannot safely switch to request headers/session reads later.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const dynamicParams = true;

interface IPageProps {
  params: Promise<{ url?: string[] }>;
}

const readPageSeo = cache(async (url: string, language: string) => {
  const page = await pageApi.findByUrl({ url, language, silentNotFound: true });
  if (!page) notFound();
  const seo = await metadataApi.generatePageSeo({ url, language, page });
  return { page, ...seo };
});

export async function generateStaticParams() {
  // User-owned masks are resolved on demand, never globally enumerated.
  return [];
}

export async function generateMetadata(props: IPageProps): Promise<Metadata> {
  const params = await props.params;
  const { pathname, language } = resolveSeoRoute(
    `/${(params.url || []).join("/")}`,
    internationalization.languages.map((item) => item.code),
    internationalization.defaultLanguage.code,
  );
  if (/^\/admin(?:\/|$)/.test(pathname)) {
    return { title: "Admin", robots: { index: false, follow: false } };
  }
  return (await readPageSeo(pathname, language)).metadata;
}

export default async function Page(props: IPageProps) {
  const params = await props.params;
  const { pathname, language } = resolveSeoRoute(
    `/${(params.url || []).join("/")}`,
    internationalization.languages.map((item) => item.code),
    internationalization.defaultLanguage.code,
  );

  if (/^\/admin(?:\/|$)/.test(pathname)) {
    return <AdminV2 isServer={true} url={pathname} language={language} />;
  }

  const { page, structuredData } = await readPageSeo(pathname, language);
  return (
    <>
      {structuredData.length ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }}
        />
      ) : null}
      <Admin isServer={true} />
      <HostModulePage
        isServer={true}
        variant={page.variant as any}
        dataSource="props"
        data={page}
        url={pathname}
        language={language}
      />
    </>
  );
}
