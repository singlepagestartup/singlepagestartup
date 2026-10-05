import { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";

/**
 * Binds the order it is handed instead of reading it again by id. The
 * subject cart reads its orders through the owner-checked subject route, and
 * the module-level order reads require the Admin role (issue #303).
 */
export function Component(props: IComponentProps) {
  return <ChildComponent {...props} />;
}
