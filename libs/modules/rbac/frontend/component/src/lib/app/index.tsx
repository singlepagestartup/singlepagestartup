import { IComponentProps } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";

export function App(props: IComponentProps) {
  return (
    <div
      data-module="rbac"
      className={cn("flex w-full", props.className || "")}
    ></div>
  );
}
