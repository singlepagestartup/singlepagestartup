import { Component as AdminV2 } from "../../components/admin-v2";

interface RenderAdminPageProps {
  language: string;
  url: string;
}

export function renderAdminPage(props: RenderAdminPageProps) {
  return <AdminV2 isServer={true} url={props.url} language={props.language} />;
}
