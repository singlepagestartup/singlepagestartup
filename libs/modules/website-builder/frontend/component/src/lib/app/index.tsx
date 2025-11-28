import { IComponentProps } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";

export function App(props: IComponentProps) {
  return (
    <div
      data-module="website-builder"
      className={cn(
        "w-full flex flex-col py-6 items-center bg-foreground text-background",
      )}
    ></div>
  );
}
