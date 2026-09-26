import { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";

/**
 * Renders the order and the order lines it is handed instead of reading them
 * again. The subject cart reads both through owner-checked subject routes, and
 * the module-level order and order line reads require the Admin role (issues
 * #303, #349).
 */
export function Component(props: IComponentProps) {
  return <ChildComponent {...props} />;
}
