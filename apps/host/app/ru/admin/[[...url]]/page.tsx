import { renderAdminPage } from "../../../../src/runtime/admin/render-admin-page";

export default async function RuAdminPage(props: {
  params: Promise<{ url?: string[] }>;
}) {
  const params = await props.params;
  const tail = params.url?.join("/") || "";
  const url = tail.length ? `/admin/${tail}` : "/admin";

  return renderAdminPage({
    language: "ru",
    url,
  });
}
