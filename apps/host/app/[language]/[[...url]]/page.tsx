import { cache } from "react";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { RBAC_EMAIL_PASSWORD_PATHS } from "@sps/shared-utils";
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

// Projects can compose a Host Page at any of these URLs. Supply the RBAC form
// when the project has no saved page, including an installation without seeds.
const defaultAuthenticationAction = cache(async (pathname: string) => {
  for (const [action, path] of Object.entries(RBAC_EMAIL_PASSWORD_PATHS)) {
    if (path === pathname) {
      const pages = await pageApi.find({
        params: {
          limit: 1,
          filters: { and: [{ column: "url", method: "eq", value: path }] },
        },
      });
      if (!pages?.length) {
        return action as keyof typeof RBAC_EMAIL_PASSWORD_PATHS;
      }
      break;
    }
  }
  return null;
});

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
  if (await defaultAuthenticationAction(`/${url.join("/")}`)) {
    return { robots: { index: false, follow: false } };
  }
  const pageSeo = await pageApi.resolvePageSeo(
    `/${language}${url.length ? "/" + url.join("/") : ""}`,
  );

  return pageSeo.metadata;
}

export default async function Page({ params }: IPageProps) {
  const { language, url = [] } = await params;
  if (!internationalization.languages.some(({ code }) => code === language))
    notFound();
  const action = await defaultAuthenticationAction(`/${url.join("/")}`);
  if (action) {
    return (
      <>
        <Admin isServer={true} />
        <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center p-6">
          <Subject
            isServer={true}
            variant="authentication-email-and-password-form-default"
            mode={action}
            language={language}
          />
        </main>
      </>
    );
  }
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
