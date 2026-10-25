import type { IComponentProps } from "./interface";
import CodeFrameworkLanding from "./Landing";
import { resolveFrameworkLink } from "./navigation";
export function Component(_props: IComponentProps = {}) {
  return (
    <div data-module="host" data-model="page" data-variant="framework">
      <CodeFrameworkLanding resolveLink={resolveFrameworkLink} />
    </div>
  );
}
