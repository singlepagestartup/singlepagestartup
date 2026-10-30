import type { Metadata } from "next";
import { api as pageApi } from "@sps/host/models/page/sdk/server";
import { Component as HostModulePage } from "@sps/host/models/page/frontend/component";
import { internationalization } from "@sps/shared-configuration";
import { notFound } from "next/navigation";
import { Component as Admin } from "../../../src/components/admin";

export const revalidate = 3600;
export const dynamicParams = true;

interface IPageProps {
  params: Promise<{ language: string; url?: string[] }>;
}

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: IPageProps): Promise<Metadata> {
  // Next already escapes path delimiters within params; preserve those escapes.
  const { language, url = [] } = await params;
  if (!internationalization.languages.some(({ code }) => code === language))
    notFound();
  return (await pageApi.resolvePageSeo(`/${url.join("/")}`, language)).metadata;
}

export default async function Page({ params }: IPageProps) {
  const { language, url = [] } = await params;
  if (!internationalization.languages.some(({ code }) => code === language))
    notFound();
  return (
    <>
      <Admin isServer={true} />
      <HostModulePage
        isServer={true}
        variant="document"
        url={`/${url.join("/")}`}
        language={language}
      />
    </>
  );
}
