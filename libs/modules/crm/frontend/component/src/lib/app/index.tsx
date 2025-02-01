import { IComponentProps } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";

export function App(props: IComponentProps) {
  return (
    <div data-module="crm" className={cn("w-full flex", props.className)}></div>
  );
}
