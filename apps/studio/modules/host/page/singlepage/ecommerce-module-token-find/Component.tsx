import type { IComponentProps } from "./interface";
import Tokens from "../framework/Tokens";
import { resolveFrameworkLink } from "../framework/navigation";
export function Component(_props: IComponentProps = {}) {
  return (
    <div
      data-module="host"
      data-model="page"
      data-variant="ecommerce-module-token-find"
    >
      <Tokens resolveLink={resolveFrameworkLink} />
    </div>
  );
}
