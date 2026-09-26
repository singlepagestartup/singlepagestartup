import { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";

/**
 * Binds the order line it is handed instead of reading it again by id. The
 * subject cart reads its lines through the owner-checked subject route, and
 * the module-level order line reads require the Admin role (issue #349).
 */
export function Component(props: IComponentProps) {
  return <ChildComponent {...props} />;
}
