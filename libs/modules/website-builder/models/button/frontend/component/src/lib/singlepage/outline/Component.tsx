import { IComponentPropsExtended } from "./interface";
import Link from "next/link";
import { cn } from "@sps/shared-frontend-client-utils";
import { Button } from "@sps/shared-ui-shadcn";

export function Component(props: IComponentPropsExtended) {
  return (
    <Button
      data-module="website-builder"
      data-model="button"
      data-id={props.data?.id || ""}
      data-variant={props.data.variant}
      className={cn("w-full", props.data.className)}
      variant="outline"
      asChild={true}
    >
      <Link href={props.data.url || "/"}>{props.data.title}</Link>
    </Button>
  );
}
