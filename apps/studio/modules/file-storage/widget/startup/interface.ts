import type { ComponentProps } from "react";
import type { variants } from "./variants";
export type IComponentProps = {
  [Variant in keyof typeof variants]: { variant: Variant } & Omit<
    NonNullable<ComponentProps<(typeof variants)[Variant]>>,
    "variant"
  >;
}[keyof typeof variants];
