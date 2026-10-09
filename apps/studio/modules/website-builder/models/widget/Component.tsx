import type { ComponentProps, ComponentType } from "react";
import { variants } from "./variants";

export type IComponentProps = {
  [Variant in keyof typeof variants]: { variant: Variant } & ComponentProps<
    (typeof variants)[Variant]
  >;
}[keyof typeof variants];

export function Component(props: IComponentProps) {
  // The public discriminated union pairs each variant with its own props.
  const Comp = variants[props.variant] as ComponentType<IComponentProps>;
  if (!Comp) return <></>;
  return <Comp {...props} />;
}
