import type { ComponentType } from "react";
import type { IComponentProps } from "./interface";
import { variants } from "./variants";

export function Component(props: IComponentProps) {
  const ChildComponent = variants[
    props.variant
  ] as ComponentType<IComponentProps>;
  if (!ChildComponent) return <></>;
  return <ChildComponent {...props} />;
}
