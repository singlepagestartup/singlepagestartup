import type { IComponentProps } from "./interface";
import { FrameworkModulePage } from "../shared/FrameworkModulePage";

export function Component(_props: IComponentProps = {}) {
  return (
    <div
      data-module="host"
      data-model="page"
      data-variant="framework-module-find"
    >
      <FrameworkModulePage />
    </div>
  );
}
