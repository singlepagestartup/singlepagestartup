import type { IWorkspacePageProps } from "../../../../../utils/pages";
import ModulesPage from "./index";

export default function ModuleGuide(props: IWorkspacePageProps) {
  return (
    <ModulesPage
      text={props.text}
      navigationHref={props.navigationHref}
      resolveLink={props.resolveLink}
      defaultSlug="rbac"
    />
  );
}
