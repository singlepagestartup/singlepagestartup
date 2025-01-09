import Link from "next/link";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Button } from "@sps/shared-ui-shadcn";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <Button variant="outline" asChild={true}>
        <Link href={`/rbac/subjects/${props.data.id}`}>{props.data.id}</Link>
      </Button>
    </div>
  );
}
