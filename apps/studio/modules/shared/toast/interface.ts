import type { ComponentProps } from "react";
import type { variants } from "./variants";
export type IComponentProps = {
  [V in keyof typeof variants]: { variant: V } & Omit<
    NonNullable<ComponentProps<(typeof variants)[V]>>,
    "variant"
  >;
}[keyof typeof variants];
