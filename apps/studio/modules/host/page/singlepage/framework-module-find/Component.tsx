import type { IComponentProps } from "./interface";
import ModulesPage from "../framework/Modules";
import { resolveFrameworkLink } from "../framework/navigation";
export function Component(_props: IComponentProps = {}) {
  return (
    <div
      data-module="host"
      data-model="page"
      data-variant="framework-module-find"
    >
      <ModulesPage resolveLink={resolveFrameworkLink} />
    </div>
  );
}
