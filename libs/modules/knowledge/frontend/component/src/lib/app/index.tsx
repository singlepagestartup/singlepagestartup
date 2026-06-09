import { IComponentProps } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";

export function App(props: IComponentProps) {
  return (
    <div
      data-module="knowledge"
      className={cn("w-full flex flex-col", props.className)}
    ></div>
  );
}
