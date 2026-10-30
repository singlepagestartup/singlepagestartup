import type { Metadata } from "next";
import { Component as AdminV2 } from "../../../../src/components/admin-v2";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage({
  params,
}: {
  params: Promise<{ language: string; url?: string[] }>;
}) {
  const { language, url = [] } = await params;
  return (
    <AdminV2
      isServer={true}
      url={`/admin${url.length ? `/${url.join("/")}` : ""}`}
      language={language}
    />
  );
}
