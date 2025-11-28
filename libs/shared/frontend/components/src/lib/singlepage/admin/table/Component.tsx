import { ReactNode } from "react";
import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended, IComponentProps } from "./interface";
import { type IComponentProps as ITableControllerComponentProps } from "../table-controller/Component";
export function Component<M extends { id: string }, V>(
  props: Omit<
    IComponentPropsExtended<M, V, IComponentProps<M, V>>,
    "adminForm"
  > & {
    children: ReactNode;
  } & ITableControllerComponentProps<M>,
) {
  return (
    <div
      data-module={props.module}
      data-variant={props.variant}
      className={cn(
        "relative gap-6 rounded-lg border border-input w-full bg-input",
        props.className,
      )}
    >
      <div className="flex flex-col gap-6">{props.children}</div>
    </div>
  );
}
