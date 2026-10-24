import type { IComponentProps } from "./interface";
import { FrameworkModulePage } from "../shared/FrameworkModulePage";

export function Component({ moduleSlug = "rbac" }: IComponentProps = {}) {
  return (
    <div
      data-module="host"
      data-model="page"
      data-variant="framework-module-slug"
    >
      <FrameworkModulePage moduleSlug={moduleSlug} />
    </div>
  );
}
