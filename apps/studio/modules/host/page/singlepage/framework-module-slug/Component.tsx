import type { IComponentProps } from "./interface";
import ModulesPage from "../framework/Modules";
import { resolveFrameworkLink } from "../framework/navigation";
export function Component({ moduleSlug = "rbac" }: IComponentProps = {}) {
  return (
    <div
      data-module="host"
      data-model="page"
      data-variant="framework-module-slug"
    >
      <ModulesPage
        navigationHref={`/framework/modules/${encodeURIComponent(moduleSlug)}`}
        resolveLink={resolveFrameworkLink}
      />
    </div>
  );
}
