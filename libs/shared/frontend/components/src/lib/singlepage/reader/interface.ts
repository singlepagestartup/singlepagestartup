import type { ComponentType, ReactNode } from "react";
import type { ISpsComponentBase } from "@sps/ui-adapter";

export interface IComponentProps<P extends ISpsComponentBase> {
  Component: ComponentType<P>;
  Provider: ComponentType<{ children: ReactNode }>;
  componentProps: P;
}
