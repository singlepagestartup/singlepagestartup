import type { ComponentType, ReactNode } from "react";
import type { ISpsComponentBase } from "@sps/ui-adapter";

interface IViewProps<P extends ISpsComponentBase> {
  Component: ComponentType<P>;
  componentProps: P;
}

export type IComponentProps<P extends ISpsComponentBase> = IViewProps<P> &
  (
    | { dataSource: "props" }
    | { dataSource?: "api"; Provider: ComponentType<{ children: ReactNode }> }
  );
